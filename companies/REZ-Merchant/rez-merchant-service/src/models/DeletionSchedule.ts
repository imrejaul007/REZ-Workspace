/**
 * DeletionSchedule — GDPR-compliant data deletion scheduling
 *
 * Purpose:
 * - Implements Article 17 (Right to Erasure) of GDPR
 * - Schedules tenant data for permanent deletion after 30-day grace period
 * - Tracks deletion status for audit compliance
 *
 * Retention Policy:
 * - Deleted accounts anonymized immediately (PII stripped)
 * - Actual data deletion scheduled 30 days later
 * - User can cancel deletion during grace period
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export const DELETION_STATUSES = ['pending', 'processing', 'completed', 'cancelled'] as const;
export type DeletionStatus = (typeof DELETION_STATUSES)[number];

export const DELETION_TYPES = ['full', 'partial', 'anonymization_only'] as const;
export type DeletionType = (typeof DELETION_TYPES)[number];

export interface IDeletionSchedule extends Document {
  tenantId: Types.ObjectId;
  tenantType: 'merchant' | 'user' | 'customer';
  scheduledAt: Date;
  completedAt?: Date;
  status: DeletionStatus;
  deletionType: DeletionType;
  initiatedBy: string; // userId or 'system' for automated cleanup
  initiatedAt: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  reason?: string;
  metadata?: {
    emailAnonymized?: boolean;
    ordersAnonymized?: boolean;
    customerDataAnonymized?: boolean;
    gracePeriodExpired?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeletionScheduleModel extends Model<IDeletionSchedule> {
  findPendingDeletions(): Promise<IDeletionSchedule[]>;
  cancelDeletion(tenantId: Types.ObjectId, cancelledBy: string): Promise<IDeletionSchedule | null>;
}

const DeletionScheduleSchema = new Schema<IDeletionSchedule, IDeletionScheduleModel>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    tenantType: {
      type: String,
      enum: ['merchant', 'user', 'customer'],
      required: true,
      index: true,
    },
    scheduledAt: { type: Date, required: true, index: true },
    completedAt: { type: Date },
    status: {
      type: String,
      enum: DELETION_STATUSES as unknown as string[],
      default: 'pending',
      index: true,
    },
    deletionType: {
      type: String,
      enum: DELETION_TYPES as unknown as string[],
      default: 'full',
    },
    initiatedBy: { type: String, required: true },
    initiatedAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
    cancelledBy: { type: String },
    reason: { type: String, maxlength: 500 },
    metadata: {
      emailAnonymized: Boolean,
      ordersAnonymized: Boolean,
      customerDataAnonymized: Boolean,
      gracePeriodExpired: Boolean,
    },
  },
  { timestamps: true },
);

// Indexes for efficient queries
DeletionScheduleSchema.index({ status: 1, scheduledAt: 1 }); // Find due deletions
DeletionScheduleSchema.index({ tenantId: 1, tenantType: 1, status: 1 }); // Lookup by tenant

// GDPR Data Retention: TTL index to auto-delete completed/cancelled schedules after 1 year
// Keeps audit trail for 1 year for compliance purposes
DeletionScheduleSchema.index(
  { completedAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60, partialFilterExpression: { completedAt: { $exists: true } } },
);

// TTL index for cancelled records (1 year)
DeletionScheduleSchema.index(
  { cancelledAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60, partialFilterExpression: { cancelledAt: { $exists: true } } },
);

// Static methods
DeletionScheduleSchema.statics.findPendingDeletions = async function (): Promise<unknown[]> {
  return this.find({
    status: 'pending',
    scheduledAt: { $lte: new Date() },
  }).lean();
};

DeletionScheduleSchema.statics.cancelDeletion = async function (
  tenantId: Types.ObjectId,
  cancelledBy: string,
): Promise<IDeletionSchedule | null> {
  return this.findOneAndUpdate(
    { tenantId, status: 'pending' },
    {
      $set: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy,
      },
    },
    { new: true },
  );
};

export const DeletionSchedule =
  (mongoose.models.DeletionSchedule as IDeletionScheduleModel) ||
  mongoose.model<IDeletionSchedule, IDeletionScheduleModel>('DeletionSchedule', DeletionScheduleSchema);

export default DeletionSchedule;
