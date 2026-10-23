const express = require('express');
const router = express.Router();
const { getConfig, updateConfig } = require('../controllers/configController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getConfig);
router.put('/', authorize('admin'), updateConfig);

module.exports = router;
