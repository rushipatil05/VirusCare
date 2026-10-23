const express = require('express');
const router = express.Router();
const {
  recordTemperature,
  correctTemperature,
  getTodayRecords,
} = require('../controllers/temperatureController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Nurse only can record and correct temperatures
router.post('/', authorize('nurse'), recordTemperature);
router.put('/:id/correct', authorize('nurse'), correctTemperature);

// All roles can view today's records
router.get('/today', getTodayRecords);

module.exports = router;
