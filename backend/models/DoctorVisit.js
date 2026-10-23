const mongoose = require('mongoose');

const doctorVisitSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
    },
    patientId: {
      type: String,
      required: true,
      trim: true,
    },
    visitDate: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Visit date is required'],
    },
    visitTime: {
      type: Date,
      default: Date.now,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor reference is required'],
    },
    doctorName: {
      type: String,
      required: true,
    },
    observations: {
      type: String,
      required: [true, 'Clinical observations are required'],
      trim: true,
    },
    conditionSeverity: {
      type: String,
      enum: ['Stable', 'Improving', 'Guarded', 'Critical'],
      default: 'Stable',
    },
    treatmentNotes: {
      type: String,
      default: '',
      trim: true,
    },
    hadTemperatureRecordedToday: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Completed', 'Pending'],
      default: 'Completed',
    },
  },
  {
    timestamps: true,
  }
);

// One official daily doctor visit per patient per day
doctorVisitSchema.index({ patient: 1, visitDate: 1 }, { unique: true });

module.exports = mongoose.model('DoctorVisit', doctorVisitSchema);
