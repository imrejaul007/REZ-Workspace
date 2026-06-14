import mongoose, { Schema, Document } from 'mongoose';
import { AuditAction } from '../types/index.js';

export interface IAuditLog extends Document {
  computationId: string;
  action: AuditAction;
  actor: string;
  details: Record<string, unknown>;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    computationId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: Object.values(AuditAction),
    },
    actor: {
      type: String,
      required: true,
      default: 'system',
    },
    details: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
    collection: 'audit_logs',
  }
);

// Compound indexes for efficient queries
AuditLogSchema.index({ computationId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ actor: 1, timestamp: -1 });

// TTL index - auto-delete logs older than 90 days
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static methods
AuditLogSchema.statics.findByComputation = function (computationId: string, limit = 100) {
  return this.find({ computationId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

AuditLogSchema.statics.findByAction = function (action: AuditAction, limit = 100) {
  return this.find({ action })
    .sort({ timestamp: -1 })
    .limit(limit);
};

AuditLogSchema.statics.findByActor = function (actor: string, limit = 100) {
  return this.find({ actor })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Methods
AuditLogSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  return obj;
};

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;