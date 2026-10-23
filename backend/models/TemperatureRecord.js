const mongoose = require('mongoose');

const temperatureRecordSchema = new mongoose.Schema(
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
    temperature: {
      type: Number,
      required: [true, 'Temperature is required'],
      min: [30.0, 'Temperature is unrealistically low (minimum 30°C)'],
      max: [45.0, 'Temperature is unrealistically high (maximum 45°C)'],
    },
    isFever: {
      type: Boolean,
      required: true,
      default: false,
    },
    feverThresholdUsed: {
      type: Number,
      default: 38.0,
    },
    recordDate: {
      type: String, // Format: YYYY-MM-DD (Facility Local Date)
      required: [true, 'Record date is required'],
    },
    recordTime: {
      type: Date,
      default: Date.now,
    },
    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Nurse reference is required'],
    },
    nurseName: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    isUnusual: {
      type: Boolean,
      default: false, // Flagged if < 35°C or > 40°C
    },
    isCorrected: {
      type: Boolean,
      default: false,
    },
    correctionReason: {
      type: String,
      default: null,
    },
    previousTemperature: {
      type: Number,
      default: null,
    },
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    correctedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce single daily temperature record per patient at the database level!
temperatureRecordSchema.index({ patient: 1, recordDate: 1 }, { unique: true });

module.exports = mongoose.model('TemperatureRecord', temperatureRecordSchema);
