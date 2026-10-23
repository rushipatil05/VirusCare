const AuditLog = require('../models/AuditLog');

// @desc Get audit logs
// @route GET /api/audit-logs
// @access Admin only (or doctor/nurse viewing patient-specific log)
const getAuditLogs = async (req, res, next) => {
  try {
    const { patientId, action, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (patientId) filter.patientId = patientId;
    if (action) filter.action = action;

    const parsedLimit = Math.min(100, Math.max(1, Number(limit)));
    const skip = (Math.max(1, Number(page)) - 1) * parsedLimit;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('user', 'name role email')
      .lean();

    res.json({
      success: true,
      total,
      page: Number(page),
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
