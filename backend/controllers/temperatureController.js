const TemperatureRecord = require('../models/TemperatureRecord');
const Patient = require('../models/Patient');
const FacilityConfig = require('../models/FacilityConfig');
const AuditLog = require('../models/AuditLog');
const { getTodayDateString, evaluateDischargeEligibility } = require('../utils/dateUtils');

// Helper to recalculate and update patient discharge eligibility after any temperature change
const updatePatientEligibility = async (patientId, feverThreshold) => {
  const allRecords = await TemperatureRecord.find({ patient: patientId }).sort({ recordDate: 1 });
  const eligibility = evaluateDischargeEligibility(allRecords, feverThreshold);

  const patient = await Patient.findById(patientId);
  if (patient && (patient.status === 'Admitted' || patient.status === 'Discharge Eligible')) {
    patient.consecutiveFeverFreeDays = eligibility.consecutiveFeverFreeDays;
    if (eligibility.isEligibleForDischarge) {
      patient.status = 'Discharge Eligible';
    } else {
      patient.status = 'Admitted';
    }
    await patient.save();
  }
  return eligibility;
};

// @desc Record a daily temperature for an admitted patient
// @route POST /api/temperatures
// @access Nurse only
const recordTemperature = async (req, res, next) => {
  try {
    const { patientId, temperature, notes, recordDate } = req.body;

    if (!patientId || temperature === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Patient and temperature value are required.',
      });
    }

    const tempVal = Number(temperature);
    if (isNaN(tempVal) || tempVal < 30.0 || tempVal > 45.0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a realistic temperature in Celsius (between 30.0°C and 45.0°C).',
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (patient.status === 'Discharged' || patient.status === 'Deceased') {
      return res.status(400).json({
        success: false,
        message: `Cannot record temperature for a ${patient.status.toLowerCase()} patient.`,
      });
    }

    // Facility local date
    const targetDate = recordDate || getTodayDateString();

    // Check for duplicate daily reading
    const existing = await TemperatureRecord.findOne({
      patient: patient._id,
      recordDate: targetDate,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: `A temperature reading (${existing.temperature}°C) has already been recorded for patient ${patient.name} on ${targetDate}. To correct this reading, please use the edit flow.`,
        existingRecord: existing,
      });
    }

    const config = await FacilityConfig.getConfig();
    const feverThreshold = config.feverThreshold || 38.0;
    const isFever = tempVal > feverThreshold;
    const isUnusual = tempVal < 35.0 || tempVal > 40.0;

    const record = await TemperatureRecord.create({
      patient: patient._id,
      patientId: patient.patientId,
      temperature: tempVal,
      isFever,
      feverThresholdUsed: feverThreshold,
      recordDate: targetDate,
      recordTime: new Date(),
      nurse: req.user._id,
      nurseName: req.user.name,
      notes: notes || '',
      isUnusual,
    });

    // Recalculate eligibility
    const eligibility = await updatePatientEligibility(patient._id, feverThreshold);

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TEMPERATURE_RECORDED',
      patient: patient._id,
      patientId: patient.patientId,
      details: {
        recordDate: targetDate,
        temperature: tempVal,
        isFever,
        isUnusual,
        feverThreshold,
        consecutiveFeverFreeDays: eligibility.consecutiveFeverFreeDays,
      },
    });

    res.status(201).json({
      success: true,
      message: `Temperature ${tempVal}°C recorded for ${patient.name}.${isFever ? ' Warning: Fever detected!' : ''}${isUnusual ? ' Notice: Unusual temperature reading recorded.' : ''}`,
      record,
      eligibility,
      warning: isUnusual ? 'Unusual reading: verify patient condition.' : null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Correct an existing temperature reading (with audit trail)
// @route PUT /api/temperatures/:id/correct
// @access Nurse only
const correctTemperature = async (req, res, next) => {
  try {
    const { temperature, correctionReason, notes } = req.body;

    if (temperature === undefined || !correctionReason || !correctionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'New temperature value and a valid correction reason are required for audit trail.',
      });
    }

    const tempVal = Number(temperature);
    if (isNaN(tempVal) || tempVal < 30.0 || tempVal > 45.0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a realistic temperature in Celsius (between 30.0°C and 45.0°C).',
      });
    }

    const record = await TemperatureRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Temperature record not found.' });
    }

    const patient = await Patient.findById(record.patient);
    const config = await FacilityConfig.getConfig();
    const feverThreshold = config.feverThreshold || 38.0;

    const previousTemp = record.temperature;
    const isFever = tempVal > feverThreshold;
    const isUnusual = tempVal < 35.0 || tempVal > 40.0;

    record.previousTemperature = previousTemp;
    record.temperature = tempVal;
    record.isFever = isFever;
    record.isUnusual = isUnusual;
    record.isCorrected = true;
    record.correctionReason = correctionReason.trim();
    record.correctedBy = req.user._id;
    record.correctedAt = new Date();
    if (notes !== undefined) record.notes = notes;

    await record.save();

    // Recalculate eligibility
    const eligibility = await updatePatientEligibility(record.patient, feverThreshold);

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TEMPERATURE_CORRECTED',
      patient: record.patient,
      patientId: record.patientId,
      details: {
        recordDate: record.recordDate,
        previousTemperature: previousTemp,
        newTemperature: tempVal,
        correctionReason: record.correctionReason,
        consecutiveFeverFreeDays: eligibility.consecutiveFeverFreeDays,
      },
    });

    res.json({
      success: true,
      message: `Temperature updated from ${previousTemp}°C to ${tempVal}°C with audit trail.`,
      record,
      eligibility,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get today's temperature checks (completed and pending) for all admitted patients
// @route GET /api/temperatures/today
// @access All authenticated roles
const getTodayRecords = async (req, res, next) => {
  try {
    const targetDate = req.query.date || getTodayDateString();

    // Find all currently admitted / discharge-eligible patients
    const activePatients = await Patient.find({
      status: { $in: ['Admitted', 'Discharge Eligible'] },
    }).sort({ roomNumber: 1 });

    // Fetch all records for targetDate
    const todayRecords = await TemperatureRecord.find({
      recordDate: targetDate,
    }).populate('nurse', 'name');

    const recordsMap = new Map();
    todayRecords.forEach((r) => {
      recordsMap.set(String(r.patient), r);
    });

    const completed = [];
    const pending = [];

    activePatients.forEach((patient) => {
      const rec = recordsMap.get(String(patient._id));
      if (rec) {
        completed.push({
          patient,
          record: rec,
        });
      } else {
        pending.push({
          patient,
          record: null,
        });
      }
    });

    const totalActive = activePatients.length;
    const completionRate = totalActive > 0 ? Math.round((completed.length / totalActive) * 100) : 0;

    res.json({
      success: true,
      date: targetDate,
      totalActive,
      completedCount: completed.length,
      pendingCount: pending.length,
      completionRate,
      completed,
      pending,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordTemperature,
  correctTemperature,
  getTodayRecords,
  updatePatientEligibility,
};
