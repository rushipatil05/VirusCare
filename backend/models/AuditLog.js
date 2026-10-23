const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'PATIENT_REGISTERED',
      'PATIENT_UPDATED',
      'ROOM_REASSIGNED',
      'TEMPERATURE_RECORDED',
      'TEMPERATURE_CORRECTED',
      'DOCTOR_VISIT_COMPLETED',
      'PATIENT_DISCHARGED',
      'PATIENT_DECEASED',
      'FEVER_THRESHOLD_UPDATED',
      'FACILITY_CONFIG_UPDATED',
    ],
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null,
  },
  patientId: {
    type: String,
    default: null,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
