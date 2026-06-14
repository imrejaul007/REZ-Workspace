/**
 * Employee Model
 * Corporate employee records
 */

const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  userId: String,
  companyId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  department: { type: String, index: true },
  level: String,
  managerId: String,
  benefits: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated'],
    default: 'active',
  },
  employment: {
    type: { type: String, enum: ['full-time', 'part-time', 'contractor'] },
    startDate: Date,
    endDate: Date,
  },
  wallet: {
    balance: { type: Number, default: 0 },
    transactions: [{
      amount: Number,
      type: String,
      reason: String,
      timestamp: { type: Date, default: Date.now },
    }],
  },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
