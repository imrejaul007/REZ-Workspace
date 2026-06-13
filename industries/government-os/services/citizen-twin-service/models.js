const mongoose = require('mongoose');
const citizenTwinSchema = new mongoose.Schema({
  citizenId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  aadhaarNumber: String,
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  },
  trustScore: { type: Number, default: 0 },
  verificationStatus: { type: String, enum: ['verified', 'pending', 'unverified'], default: 'pending' },
  consentRecords: [{
    service: String,
    granted: Boolean,
    date: Date
  }],
  servicesUsed: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const CitizenTwin = mongoose.model('CitizenTwin', citizenTwinSchema);
module.exports = { CitizenTwin };
