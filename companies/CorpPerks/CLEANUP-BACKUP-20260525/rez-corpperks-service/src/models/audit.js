/**
 * Audit Log Model
 * Tracks all actions for compliance
 */

const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'payment', 'refund', 'access'],
    required: true,
    index: true,
  },
  entity: {
    type: String,
    required: true,
  },
  entityId: String,
  userId: String,
  companyId: String,
  ip: String,
  userAgent: String,
  requestId: String,
  before: mongoose.Schema.Types.Mixed,
  after: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success',
  },
  error: String,
  duration: Number,
}, { timestamps: true });

auditSchema.index({ entity: 1, action: 1, createdAt: -1 });
auditSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditSchema);
