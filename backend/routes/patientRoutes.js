const express = require('express');
const router = express.Router();
const {
  registerPatient,
  getPatients,
  getPatientById,
  getAvailableRooms,
  recordPatientDeceased,
} = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Admin-only actions
router.post('/', authorize('admin'), registerPatient);
router.post('/:id/outcome/deceased', authorize('admin'), recordPatientDeceased);

// Shared actions (Admin, Doctor, Nurse)
router.get('/', getPatients);
router.get('/rooms/available', getAvailableRooms);
router.get('/:id', getPatientById);

module.exports = router;
