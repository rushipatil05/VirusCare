const Patient = require('../models/Patient');
const TemperatureRecord = require('../models/TemperatureRecord');
const FacilityConfig = require('../models/FacilityConfig');
const AuditLog = require('../models/AuditLog');
const { evaluateDischargeEligibility } = require('../utils/dateUtils');

// @desc Get all discharge-eligible patients and evaluate all active patients
// @route GET /api/discharges/eligible
// @access All authenticated roles
const getDischargeEligiblePatients = async (req, res, next) => {
  try {
    const config = await FacilityConfig.getConfig();
    const feverThreshold = config.feverThreshold || 38.0;

    // Active patients
    const activePatients = await Patient.find({
      status: { $in: ['Admitted', 'Discharge Eligible'] },
    }).sort({ roomNumber: 1 });

    const evaluationResults = await Promise.all(
      activePatients.map(async (patient) => {
        const records = await TemperatureRecord.find({ patient: patient._id }).sort({ recordDate: 1 });
        const eligibility = evaluateDischargeEligibility(records, feverThreshold);

        // Update database if status changed
        if (patient.consecutiveFeverFreeDays !== eligibility.consecutiveFeverFreeDays) {
          patient.consecutiveFeverFreeDays = eligibility.consecutiveFeverFreeDays;
          if (eligibility.isEligibleForDischarge) {
            patient.status = 'Discharge Eligible';
          } else {
            patient.status = 'Admitted';
          }
          await patient.save();
        }

        return {
          patient,
          consecutiveFeverFreeDays: eligibility.consecutiveFeverFreeDays,
          isEligible: eligibility.isEligibleForDischarge,
          thresholdRequired: 3,
          latestRecordDate: eligibility.latestRecordDate,
          breakdown: eligibility.dailyBreakdown,
        };
      })
    );

    const eligiblePatients = evaluationResults.filter((e) => e.isEligible);
    const nonEligiblePatients = evaluationResults.filter((e) => !e.isEligible);

    res.json({
      success: true,
      feverThreshold,
      totalActive: activePatients.length,
      eligibleCount: eligiblePatients.length,
      eligiblePatients,
      monitoringPatients: nonEligiblePatients,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Confirm patient discharge
// @route POST /api/discharges/:id/confirm
// @access Admin only
const confirmDischarge = async (req, res, next) => {
  try {
    const { dischargeNotes } = req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (patient.status === 'Discharged') {
      return res.status(400).json({ success: false, message: 'Patient is already discharged.' });
    }

    if (patient.status === 'Deceased') {
      return res.status(400).json({ success: false, message: 'Cannot discharge a deceased patient record.' });
    }

    const config = await FacilityConfig.getConfig();
    const feverThreshold = config.feverThreshold || 38.0;

    // Strict validation: Re-evaluate discharge eligibility
    const records = await TemperatureRecord.find({ patient: patient._id }).sort({ recordDate: 1 });
    const eligibility = evaluateDischargeEligibility(records, feverThreshold);

    if (!eligibility.isEligibleForDischarge) {
      return res.status(400).json({
        success: false,
        message: `Discharge criteria not met. Patient has only ${eligibility.consecutiveFeverFreeDays} consecutive fever-free days (required: 3 full days).`,
      });
    }

    const freedRoomNumber = patient.roomNumber;

    // Update patient record
    patient.status = 'Discharged';
    patient.outcome = 'Recovered';
    patient.dischargeDate = new Date();
    patient.dischargeNotes = dischargeNotes || 'Completed 3 consecutive fever-free days. Clinically stable and cleared for discharge.';
    patient.dischargedBy = req.user._id;
    patient.roomNumber = null; // Immediately vacate room bed!

    await patient.save();

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'PATIENT_DISCHARGED',
      patient: patient._id,
      patientId: patient.patientId,
      details: {
        freedRoom: freedRoomNumber,
        dischargeDate: patient.dischargeDate,
        consecutiveFeverFreeDays: eligibility.consecutiveFeverFreeDays,
        dischargeNotes: patient.dischargeNotes,
      },
    });

    res.json({
      success: true,
      message: `Patient ${patient.name} (${patient.patientId}) has been successfully discharged. Room ${freedRoomNumber} is now immediately available.`,
      patient,
      freedRoomNumber,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDischargeEligiblePatients,
  confirmDischarge,
};
