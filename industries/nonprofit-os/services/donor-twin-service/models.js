const mongoose = require('mongoose');
const donorTwinSchema = new mongoose.Schema({
  donorId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: String,
  phone: String,
  karmaScore: { type: Number, default: 0 },
  loyaltyTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  givingHistory: [{
    date: Date,
    amount: Number,
    campaign: String,
    paymentMethod: String
  }],
  causes: [String],
  engagementMetrics: {
    emailsOpened: Number,
    eventsAttended: Number,
    referrals: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const DonorTwin = mongoose.model('DonorTwin', donorTwinSchema);
module.exports = { DonorTwin };
