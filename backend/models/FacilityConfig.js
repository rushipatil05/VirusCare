const mongoose = require('mongoose');

const facilityConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'facility_settings',
  },
  facilityName: {
    type: String,
    default: 'VirusCare Quarantine & Treatment Facility',
  },
  maxCapacity: {
    type: Number,
    default: 74,
    min: 1,
  },
  feverThreshold: {
    type: Number,
    default: 38.0,
    min: 35.0,
    max: 42.0,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Helper to get or create default config
facilityConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne({ key: 'facility_settings' });
  if (!config) {
    config = await this.create({
      key: 'facility_settings',
      facilityName: 'VirusCare Quarantine & Treatment Facility',
      maxCapacity: 74,
      feverThreshold: 38.0,
    });
  }
  return config;
};

module.exports = mongoose.model('FacilityConfig', facilityConfigSchema);
