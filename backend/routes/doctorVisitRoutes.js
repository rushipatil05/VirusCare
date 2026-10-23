const express = require('express');
const router = express.Router();
const {
  recordVisit,
  getTodayVisits,
} = require('../controllers/doctorVisitController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Doctor only can record daily visits
router.post('/', authorize('doctor'), recordVisit);

// All roles can view today's visit statuses
router.get('/today', getTodayVisits);

module.exports = router;
