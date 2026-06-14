import mongoose, { Schema, Types, Document } from 'mongoose';

export type AuditAction =
  | 'create' | 'read' | 'update' | 'delete'
  | 'login' | 'logout' | 'password_change'
  | 'role_change' | 'permission_change'
  | 'export' | 'import' | 'bulk_action';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface IAuditLog extends Document {
  merchantId: Types.ObjectId;
  merchantUserId?: Types.ObjectId;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  severity: AuditSeverity;
  details?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    fields?: string[];
    reason?: string;
  };
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAuditLog>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    merchantUserId: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },
    action: {
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'login', 'logout',
             'password_change', 'role_change', 'permission_change',
             'export', 'import', 'bulk_action'],
      required: true
    },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info'
    },
    details: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
      fields: [String],
      reason: String,
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true, collection: 'auditlogs' },
);
schema.index({ merchantId: 1, createdAt: -1 });
schema.index({ resourceType: 1, resourceId: 1 });
schema.index({ merchantId: 1, action: 1 });
schema.index({ resourceId: 1, createdAt: -1 });
schema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', schema);
