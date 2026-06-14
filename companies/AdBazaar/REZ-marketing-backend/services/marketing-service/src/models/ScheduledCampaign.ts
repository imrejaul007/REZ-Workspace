import { Schema, model, Document, Types } from 'mongoose';

/**
 * ScheduledCampaign — tracks scheduled marketing campaign executions on a calendar.
 *
 * Enables:
 * - Marketing calendar view (month/week/day)
 * - Drag-drop campaign rescheduling
 * - Conflict detection (multiple campaigns same time slot)
 * - Suggested optimal send times
 * - Bulk scheduling for campaigns
 */

export type ScheduleStatus = 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled' | 'paused';

export interface IScheduledCampaign extends Document {
  campaignId: Types.ObjectId;
  merchantId: Types.ObjectId;

  // Scheduling
  scheduledDate: Date;
  scheduledTime: string; // HH:mm format (merchant local time)
  timezone: string; // IANA timezone (e.g., 'Asia/Kolkata')

  // Status tracking
  status: ScheduleStatus;

  // Queue tracking
  queueJobId?: string; // BullMQ job ID for this scheduled send

  // Execution tracking
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;

  // Rescheduling history
  rescheduledFrom?: Date;
  rescheduledCount: number;

  // Bulk scheduling
  isRecurring: boolean;
  recurrenceRule?: string; // RRULE format for recurring campaigns
  recurrenceEndDate?: Date;

  // Conflicts
  hasConflict: boolean;
  conflictWith?: Types.ObjectId[]; // IDs of other scheduled campaigns at same time

  // Metadata
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledCampaignSchema = new Schema<IScheduledCampaign>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'MarketingCampaign',
      required: true,
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/, // HH:mm format
    },
    timezone: {
      type: String,
      required: true,
      default: 'Asia/Kolkata',
    },
    status: {
      type: String,
      enum: ['scheduled', 'sending', 'sent', 'failed', 'cancelled', 'paused'],
      default: 'scheduled',
      index: true,
    },
    queueJobId: {
      type: String,
      index: true,
    },
    startedAt: Date,
    completedAt: Date,
    errorMessage: String,
    rescheduledFrom: Date,
    rescheduledCount: {
      type: Number,
      default: 0,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceRule: String,
    recurrenceEndDate: Date,
    hasConflict: {
      type: Boolean,
      default: false,
    },
    conflictWith: [{
      type: Schema.Types.ObjectId,
      ref: 'ScheduledCampaign',
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'MerchantUser',
    },
  },
  { timestamps: true },
);

// Compound indexes for efficient queries
ScheduledCampaignSchema.index({ merchantId: 1, scheduledDate: 1, status: 1 });
ScheduledCampaignSchema.index({ merchantId: 1, status: 1, scheduledDate: 1 });
ScheduledCampaignSchema.index({ campaignId: 1, status: 1 });

// Prevent duplicate scheduling (same campaign, same date, not cancelled)
ScheduledCampaignSchema.index(
  { campaignId: 1, scheduledDate: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['cancelled', 'failed'] } },
  },
);

export const ScheduledCampaign = model<IScheduledCampaign>('ScheduledCampaign', ScheduledCampaignSchema);
export default ScheduledCampaign;
