const express = require('express');
const router = express.Router();
const {
  getDischargeEligiblePatients,
  confirmDischarge,
} = require('../controllers/dischargeController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// All roles can view eligibility list
router.get('/eligible', getDischargeEligiblePatients);

// Admin only can confirm discharge
router.post('/:id/confirm', authorize('admin'), confirmDischarge);

module.exports = router;
