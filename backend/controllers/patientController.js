const Patient = require('../models/Patient');
const FacilityConfig = require('../models/FacilityConfig');
const TemperatureRecord = require('../models/TemperatureRecord');
const DoctorVisit = require('../models/DoctorVisit');
const AuditLog = require('../models/AuditLog');
const { getTodayDateString, evaluateDischargeEligibility } = require('../utils/dateUtils');

// Helper to get all currently occupied rooms
const getOccupiedRooms = async () => {
  const activePatients = await Patient.find({
    status: { $in: ['Admitted', 'Discharge Eligible'] },
    roomNumber: { $ne: null },
  }).select('roomNumber');

  return activePatients.map((p) => p.roomNumber);
};

// @desc Register a new patient
// @route POST /api/patients
// @access Admin only
const registerPatient = async (req, res, next) => {
  try {
    const config = await FacilityConfig.getConfig();
    const maxCapacity = config.maxCapacity || 74;

    // Check facility capacity
    const currentAdmittedCount = await Patient.countDocuments({
      status: { $in: ['Admitted', 'Discharge Eligible'] },
    });

    if (currentAdmittedCount >= maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Facility is at maximum capacity (${maxCapacity}/${maxCapacity} beds occupied). No new admissions can be accepted until a bed is vacated.`,
      });
    }

    let { patientId, name, age, gender, admissionDate, roomNumber } = req.body;

    if (!name || age === undefined || !roomNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, and room number are required.',
      });
    }

    roomNumber = Number(roomNumber);
    if (isNaN(roomNumber) || roomNumber < 1 || roomNumber > maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Room number must be between 1 and ${maxCapacity}.`,
      });
    }

    // Verify room is not already occupied
    const occupiedRooms = await getOccupiedRooms();
    if (occupiedRooms.includes(roomNumber)) {
      return res.status(409).json({
        success: false,
        message: `Room ${roomNumber} is already occupied by an active patient. Please choose an available room.`,
      });
    }

    // Auto-generate patientId if not provided
    if (!patientId || !patientId.trim()) {
      const count = await Patient.countDocuments();
      patientId = `VC-${String(count + 1).padStart(3, '0')}`;
    } else {
      patientId = patientId.trim().toUpperCase();
      const existing = await Patient.findOne({ patientId });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Patient ID '${patientId}' already exists. Please provide a unique ID.`,
        });
      }
    }

    const patient = await Patient.create({
      patientId,
      name: name.trim(),
      age: Number(age),
      gender: gender || 'Male',
      admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      roomNumber,
      status: 'Admitted',
      outcome: 'Active',
      consecutiveFeverFreeDays: 0,
      createdBy: req.user._id,
    });

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'PATIENT_REGISTERED',
      patient: patient._id,
      patientId: patient.patientId,
      details: {
        name: patient.name,
        roomNumber: patient.roomNumber,
        admissionDate: patient.admissionDate,
      },
    });

    res.status(201).json({
      success: true,
      message: `Patient ${patient.name} (${patient.patientId}) successfully registered and assigned to Room ${roomNumber}.`,
      patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all patients (searchable and filterable)
// @route GET /api/patients
// @access All authenticated roles
const getPatients = async (req, res, next) => {
  try {
    const { search, status, roomNumber } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (roomNumber) {
      filter.roomNumber = Number(roomNumber);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { patientId: searchRegex },
      ];
    }

    const patients = await Patient.find(filter)
      .sort({ roomNumber: 1, createdAt: -1 })
      .lean();

    const todayStr = getTodayDateString();

    // Enrich with today's status: whether temperature recorded today, whether doctor visited today
    const enrichedPatients = await Promise.all(
      patients.map(async (p) => {
        const todayTemp = await TemperatureRecord.findOne({
          patient: p._id,
          recordDate: todayStr,
        }).lean();

        const todayVisit = await DoctorVisit.findOne({
          patient: p._id,
          visitDate: todayStr,
        }).lean();

        return {
          ...p,
          hasTemperatureToday: !!todayTemp,
          todayTemperature: todayTemp ? todayTemp.temperature : null,
          todayFever: todayTemp ? todayTemp.isFever : null,
          hasDoctorVisitToday: !!todayVisit,
          todayDoctorVisitStatus: todayVisit ? todayVisit.status : 'Pending',
        };
      })
    );

    res.json({
      success: true,
      count: enrichedPatients.length,
      patients: enrichedPatients,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get patient by ID with full histories
// @route GET /api/patients/:id
// @access All authenticated roles
const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const config = await FacilityConfig.getConfig();
    const feverThreshold = config.feverThreshold || 38.0;

    // Fetch temperature records sorted by recordDate ascending for charts
    const temperatureRecords = await TemperatureRecord.find({ patient: patient._id })
      .sort({ recordDate: 1, recordTime: 1 })
      .lean();

    // Fetch doctor visits sorted by visitDate descending
    const doctorVisits = await DoctorVisit.find({ patient: patient._id })
      .sort({ visitDate: -1, visitTime: -1 })
      .lean();

    // Fetch audit logs for this patient
    const auditLogs = await AuditLog.find({ patient: patient._id })
      .sort({ timestamp: -1 })
      .lean();

    // Evaluate discharge eligibility based on current temperature records
    const eligibility = evaluateDischargeEligibility(temperatureRecords, feverThreshold);

    // If consecutiveFeverFreeDays in DB is out of sync with calculation, update it
    if (patient.consecutiveFeverFreeDays !== eligibility.consecutiveFeverFreeDays) {
      patient.consecutiveFeverFreeDays = eligibility.consecutiveFeverFreeDays;
      if (eligibility.isEligibleForDischarge && patient.status === 'Admitted') {
        patient.status = 'Discharge Eligible';
      } else if (!eligibility.isEligibleForDischarge && patient.status === 'Discharge Eligible') {
        patient.status = 'Admitted';
      }
      await patient.save();
    }

    res.json({
      success: true,
      patient,
      temperatureRecords,
      doctorVisits,
      auditLogs,
      dischargeEligibility: eligibility,
      feverThreshold,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get available rooms (1 to 74)
// @route GET /api/patients/rooms/available
// @access All authenticated roles
const getAvailableRooms = async (req, res, next) => {
  try {
    const config = await FacilityConfig.getConfig();
    const maxCapacity = config.maxCapacity || 74;

    const occupiedRooms = await getOccupiedRooms();
    const occupiedSet = new Set(occupiedRooms);

    const availableRooms = [];
    for (let r = 1; r <= maxCapacity; r++) {
      if (!occupiedSet.has(r)) {
        availableRooms.push(r);
      }
    }

    res.json({
      success: true,
      maxCapacity,
      totalOccupied: occupiedRooms.length,
      totalAvailable: availableRooms.length,
      availableRooms,
      occupiedRooms: occupiedRooms.sort((a, b) => a - b),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Record patient outcome as deceased
// @route POST /api/patients/:id/outcome/deceased
// @access Admin only
const recordPatientDeceased = async (req, res, next) => {
  try {
    const { deathNotes } = req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (patient.status === 'Deceased') {
      return res.status(400).json({ success: false, message: 'Patient is already recorded as deceased.' });
    }

    const previousRoom = patient.roomNumber;
    patient.status = 'Deceased';
    patient.outcome = 'Deceased';
    patient.deathDate = new Date();
    patient.deathNotes = deathNotes || 'Patient passed away in facility.';
    patient.roomNumber = null; // Vacate room immediately

    await patient.save();

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'PATIENT_DECEASED',
      patient: patient._id,
      patientId: patient.patientId,
      details: {
        vacatedRoom: previousRoom,
        deathDate: patient.deathDate,
        notes: patient.deathNotes,
      },
    });

    res.json({
      success: true,
      message: `Patient ${patient.name} recorded as deceased. Room ${previousRoom} has been vacated.`,
      patient,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerPatient,
  getPatients,
  getPatientById,
  getAvailableRooms,
  recordPatientDeceased,
};
