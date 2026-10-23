const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Viewable by all authenticated staff, or admin
router.get('/', getAuditLogs);

module.exports = router;
