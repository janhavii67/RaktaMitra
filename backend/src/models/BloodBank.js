const mongoose = require('mongoose');

const bloodAvailabilitySchema = new mongoose.Schema({
  'A+': { type: Number, default: 0 },
  'A-': { type: Number, default: 0 },
  'B+': { type: Number, default: 0 },
  'B-': { type: Number, default: 0 },
  'AB+': { type: Number, default: 0 },
  'AB-': { type: Number, default: 0 },
  'O+': { type: Number, default: 0 },
  'O-': { type: Number, default: 0 },
}, { _id: false });

const bloodBankSchema = new mongoose.Schema({
  bankId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: { type: String, required: true },
  district: { type: String, required: true, index: true },
  address: { type: String, default: '' },
  contact: { type: String, default: '' },
  email: { type: String, default: '' },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  availability: { type: bloodAvailabilitySchema, default: () => ({}) },
  lastUpdated: { type: Date, default: Date.now },
  source: { type: String, default: 'eRaktKosh' },
}, {
  timestamps: true,
});

// Virtual: total units across all blood types
bloodBankSchema.virtual('totalUnits').get(function () {
  const a = this.availability;
  if (!a) return 0;
  return (
    (a['A+'] || 0) + (a['A-'] || 0) +
    (a['B+'] || 0) + (a['B-'] || 0) +
    (a['AB+'] || 0) + (a['AB-'] || 0) +
    (a['O+'] || 0) + (a['O-'] || 0)
  );
});

bloodBankSchema.set('toJSON', { virtuals: true });
bloodBankSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BloodBank', bloodBankSchema);
