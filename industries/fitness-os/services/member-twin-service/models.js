const mongoose = require('mongoose');
const memberTwinSchema = new mongoose.Schema({
  memberId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: String, phone: String,
  membershipType: { type: String, enum: ['basic', 'premium', 'vip'], default: 'basic' },
  goals: [String],
  progress: [{ metric: String, value: Number, date: Date }],
  status: { type: String, enum: ['active', 'paused', 'cancelled'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const MemberTwin = mongoose.model('MemberTwin', memberTwinSchema);
module.exports = { MemberTwin };
