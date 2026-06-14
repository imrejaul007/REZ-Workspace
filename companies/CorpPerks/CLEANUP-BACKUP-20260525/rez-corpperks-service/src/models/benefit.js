/**
 * Benefit Model
 * Corporate benefit definitions
 */

const mongoose = require('mongoose');

const benefitSchema = new mongoose.Schema({
  benefitId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['meal', 'travel', 'wellness', 'learning', 'gifting', 'other'],
    required: true,
  },
  amount: { type: Number, required: true },
  frequency: {
    type: String,
    enum: ['monthly', 'yearly', 'one-time'],
    default: 'monthly',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active',
  },
  companyId: String,
  department: String,
  eligibility: {
    levels: [String],
    minTenure: Number,
    roles: [String],
  },
  rules: {
    minAmount: Number,
    maxAmount: Number,
    rollover: Boolean,
    expiry: Date,
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

benefitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Benefit', benefitSchema);
