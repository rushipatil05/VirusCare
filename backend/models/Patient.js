const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [130, 'Please enter a valid age'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
    },
    admissionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    roomNumber: {
      type: Number,
      min: 1,
      max: 74,
      default: null,
    },
    status: {
      type: String,
      enum: ['Admitted', 'Discharge Eligible', 'Discharged', 'Deceased'],
      default: 'Admitted',
    },
    outcome: {
      type: String,
      enum: ['Active', 'Recovered', 'Deceased'],
      default: 'Active',
    },
    consecutiveFeverFreeDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    dischargeDate: {
      type: Date,
      default: null,
    },
    dischargeNotes: {
      type: String,
      default: '',
    },
    dischargedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deathDate: {
      type: Date,
      default: null,
    },
    deathNotes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Partial unique index: Room number must be unique among currently admitted/discharge-eligible patients!
patientSchema.index(
  { roomNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['Admitted', 'Discharge Eligible'] },
      roomNumber: { $type: 'number' },
    },
  }
);

module.exports = mongoose.model('Patient', patientSchema);
