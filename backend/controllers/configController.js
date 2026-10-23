const FacilityConfig = require('../models/FacilityConfig');
const Patient = require('../models/Patient');
const TemperatureRecord = require('../models/TemperatureRecord');
const AuditLog = require('../models/AuditLog');
const { evaluateDischargeEligibility } = require('../utils/dateUtils');

// @desc Get facility configuration
// @route GET /api/config
// @access All authenticated roles
const getConfig = async (req, res, next) => {
  try {
    const config = await FacilityConfig.getConfig();
    res.json({
      success: true,
      config,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update facility configuration (e.g. fever threshold)
// @route PUT /api/config
// @access Admin only
const updateConfig = async (req, res, next) => {
  try {
    const { feverThreshold, maxCapacity, facilityName } = req.body;

    let config = await FacilityConfig.getConfig();
    const previousThreshold = config.feverThreshold;

    if (feverThreshold !== undefined) {
      const thresholdVal = Number(feverThreshold);
      if (isNaN(thresholdVal) || thresholdVal < 35.0 || thresholdVal > 42.0) {
        return res.status(400).json({
          success: false,
          message: 'Fever threshold must be between 35.0°C and 42.0°C.',
        });
      }
      config.feverThreshold = thresholdVal;
    }

    if (maxCapacity !== undefined) {
      const capacityVal = Number(maxCapacity);
      if (isNaN(capacityVal) || capacityVal < 1 || capacityVal > 500) {
        return res.status(400).json({
          success: false,
          message: 'Maximum capacity must be between 1 and 500 beds.',
        });
      }
      config.maxCapacity = capacityVal;
    }

    if (facilityName) {
      config.facilityName = facilityName.trim();
    }

    config.updatedBy = req.user._id;
    config.updatedAt = new Date();
    await config.save();

    // Recalculate eligibility for all active patients if threshold changed
    if (feverThreshold !== undefined && Number(feverThreshold) !== previousThreshold) {
      const activePatients = await Patient.find({
        status: { $in: ['Admitted', 'Discharge Eligible'] },
      });

      for (const p of activePatients) {
        const records = await TemperatureRecord.find({ patient: p._id }).sort({ recordDate: 1 });
        const eligibility = evaluateDischargeEligibility(records, config.feverThreshold);

        p.consecutiveFeverFreeDays = eligibility.consecutiveFeverFreeDays;
        p.status = eligibility.isEligibleForDischarge ? 'Discharge Eligible' : 'Admitted';
        await p.save();
      }

      await AuditLog.create({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'FEVER_THRESHOLD_UPDATED',
        details: {
          previousThreshold,
          newThreshold: config.feverThreshold,
          recalculatedPatientsCount: activePatients.length,
        },
      });
    }

    res.json({
      success: true,
      message: `Facility configuration successfully updated. Fever threshold is set to ${config.feverThreshold}°C.`,
      config,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConfig,
  updateConfig,
};
