const DoctorVisit = require('../models/DoctorVisit');
const Patient = require('../models/Patient');
const TemperatureRecord = require('../models/TemperatureRecord');
const AuditLog = require('../models/AuditLog');
const { getTodayDateString } = require('../utils/dateUtils');

// @desc Record a doctor daily visit
// @route POST /api/doctor-visits
// @access Doctor only
const recordVisit = async (req, res, next) => {
  try {
    const { patientId, observations, conditionSeverity, treatmentNotes, visitDate } = req.body;

    if (!patientId || !observations || !observations.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Patient selection and clinical observations are required.',
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (patient.status === 'Discharged' || patient.status === 'Deceased') {
      return res.status(400).json({
        success: false,
        message: `Cannot record doctor visit for a ${patient.status.toLowerCase()} patient.`,
      });
    }

    const targetDate = visitDate || getTodayDateString();

    // Check if visit already exists for today
    const existingVisit = await DoctorVisit.findOne({
      patient: patient._id,
      visitDate: targetDate,
    });

    if (existingVisit) {
      return res.status(409).json({
        success: false,
        message: `A doctor visit has already been documented for patient ${patient.name} on ${targetDate}.`,
        existingVisit,
      });
    }

    // Check if today's temperature was recorded
    const todayTemp = await TemperatureRecord.findOne({
      patient: patient._id,
      recordDate: targetDate,
    });

    const hadTemperatureRecordedToday = !!todayTemp;

    const visit = await DoctorVisit.create({
      patient: patient._id,
      patientId: patient.patientId,
      visitDate: targetDate,
      visitTime: new Date(),
      doctor: req.user._id,
      doctorName: req.user.name,
      observations: observations.trim(),
      conditionSeverity: conditionSeverity || 'Stable',
      treatmentNotes: treatmentNotes ? treatmentNotes.trim() : '',
      hadTemperatureRecordedToday,
      status: 'Completed',
    });

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DOCTOR_VISIT_COMPLETED',
      patient: patient._id,
      patientId: patient.patientId,
      details: {
        visitDate: targetDate,
        conditionSeverity: visit.conditionSeverity,
        hadTemperatureRecordedToday,
        observationsSnippet: observations.substring(0, 80),
      },
    });

    let warningMessage = null;
    if (!hadTemperatureRecordedToday) {
      warningMessage = "Clinical note: Patient's temperature has not yet been recorded for today.";
    }

    res.status(201).json({
      success: true,
      message: `Doctor visit documented for ${patient.name} (${patient.patientId}).`,
      warning: warningMessage,
      visit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get today's doctor visits (completed and pending) for all admitted patients
// @route GET /api/doctor-visits/today
// @access All authenticated roles
const getTodayVisits = async (req, res, next) => {
  try {
    const targetDate = req.query.date || getTodayDateString();

    // Admitted & discharge-eligible patients
    const activePatients = await Patient.find({
      status: { $in: ['Admitted', 'Discharge Eligible'] },
    }).sort({ roomNumber: 1 });

    const todayVisits = await DoctorVisit.find({
      visitDate: targetDate,
    }).populate('doctor', 'name');

    const visitsMap = new Map();
    todayVisits.forEach((v) => {
      visitsMap.set(String(v.patient), v);
    });

    // Check today's temperatures for each patient
    const todayTemps = await TemperatureRecord.find({
      recordDate: targetDate,
    });
    const tempsMap = new Map();
    todayTemps.forEach((t) => {
      tempsMap.set(String(t.patient), t);
    });

    const completed = [];
    const pending = [];

    activePatients.forEach((patient) => {
      const visit = visitsMap.get(String(patient._id));
      const tempRecord = tempsMap.get(String(patient._id));
      const hasTemperatureToday = !!tempRecord;

      const patientData = {
        patient,
        hasTemperatureToday,
        todayTemperature: tempRecord ? tempRecord.temperature : null,
        todayFever: tempRecord ? tempRecord.isFever : null,
        visit: visit || null,
      };

      if (visit) {
        completed.push(patientData);
      } else {
        pending.push(patientData);
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
  recordVisit,
  getTodayVisits,
};
