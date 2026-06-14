import mongoose from 'mongoose';

export interface IAuditLog extends mongoose.Document {
  action: string;
  userId?: string;
  resourceType: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  resourceType: { type: String },
  resourceId: String,
  ip: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } });

AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// Type alias for TypeScript
export type AuditLog = IAuditLog;
