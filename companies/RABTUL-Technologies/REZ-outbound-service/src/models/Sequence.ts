/**
 * REZ Outbound Service - Sequence Model
 *
 * Stores outbound sequences (email sequences, cadences)
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// Types
// ============================================================================

export type SequenceStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type SequenceType = 'email' | 'linkedin' | 'sms' | 'call' | 'multi-channel';
export type StepType = 'email' | 'linkedin_connection' | 'linkedin_message' | 'linkedin_post' | 'sms' | 'call' | 'task';
export type StepDelayUnit = 'minutes' | 'hours' | 'days' | 'weeks';

export interface IStepContent {
  subject?: string; // For emails
  body?: string;
  templateId?: string;
  linkedinMessage?: string;
  smsBody?: string;
  callScript?: string;
  taskTitle?: string;
  taskDescription?: string;
  attachments?: string[];
  variables?: Record<string, string>;
}

export interface ISequenceStep {
  order: number;
  type: StepType;
  delay: number; // Amount
  delayUnit: StepDelayUnit;
  delayFrom: 'previous_step' | 'start' | 'prospect_added';
  content: IStepContent;
  conditions?: {
    minDaysBetween: number;
    maxDaysBetween: number;
    onlyOnDays?: number[]; // 0-6, Sunday-Saturday
    onlyInHours?: { start: number; end: number };
    skipIfNoReply?: boolean;
    skipIfClicked?: boolean;
    skipIfOpened?: boolean;
    skipIfReplied?: boolean;
  };
  trackOpens?: boolean;
  trackClicks?: boolean;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface ISequence extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  name: string;
  description?: string;

  // Type
  type: SequenceType;
  status: SequenceStatus;

  // Settings
  channel: StepType;
  steps: ISequenceStep[];
  totalDurationDays: number;

  // A/B Testing
  abTestEnabled: boolean;
  abVariants?: {
    name: string;
    weight: number;
    content: IStepContent;
  }[];

  // Targeting
  targetIcpIds?: string[];
  targetTags?: string[];
  excludeTags?: string[];

  // Limits
  dailyLimit?: number;
  maxProspects?: number;

  // Working hours
  workingHours?: {
    enabled: boolean;
    startHour: number;
    endHour: number;
    timezone: string;
    daysOfWeek?: number[];
  };

  // Statistics
  stats: {
    totalProspects: number;
    activeProspects: number;
    completedProspects: number;
    optedOutProspects: number;
    repliedProspects: number;
    interestedProspects: number;
    avgReplyRate: number;
    avgOpenRate: number;
    avgClickRate: number;
    avgConversionRate: number;
  };

  // Ownership
  createdBy: string;
  assignedTo?: string;

  // Scheduling
  scheduledStartAt?: Date;
  scheduledEndAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Schema
// ============================================================================

const StepContentSchema = new Schema<IStepContent>({
  subject: String,
  body: String,
  templateId: String,
  linkedinMessage: String,
  smsBody: String,
  callScript: String,
  taskTitle: String,
  taskDescription: String,
  attachments: [String],
  variables: { type: Map, of: String },
}, { _id: false });

const StepConditionsSchema = new Schema({
  minDaysBetween: { type: Number, default: 0 },
  maxDaysBetween: { type: Number, default: 7 },
  onlyOnDays: [Number],
  onlyInHours: {
    start: Number,
    end: Number,
  },
  skipIfNoReply: { type: Boolean, default: false },
  skipIfClicked: { type: Boolean, default: false },
  skipIfOpened: { type: Boolean, default: false },
  skipIfReplied: { type: Boolean, default: false },
}, { _id: false });

const SequenceStepSchema = new Schema<ISequenceStep>({
  order: { type: Number, required: true },
  type: {
    type: String,
    enum: ['email', 'linkedin_connection', 'linkedin_message', 'linkedin_post', 'sms', 'call', 'task'],
    required: true,
  },
  delay: { type: Number, required: true, default: 24 },
  delayUnit: {
    type: String,
    enum: ['minutes', 'hours', 'days', 'weeks'],
    default: 'hours',
  },
  delayFrom: {
    type: String,
    enum: ['previous_step', 'start', 'prospect_added'],
    default: 'previous_step',
  },
  content: { type: StepContentSchema, required: true },
  conditions: StepConditionsSchema,
  trackOpens: { type: Boolean, default: true },
  trackClicks: { type: Boolean, default: true },
  replyTo: String,
  cc: [String],
  bcc: [String],
}, { _id: false });

const ABVariantSchema = new Schema({
  name: { type: String, required: true },
  weight: { type: Number, required: true },
  content: { type: StepContentSchema, required: true },
}, { _id: false });

const SequenceStatsSchema = new Schema({
  totalProspects: { type: Number, default: 0 },
  activeProspects: { type: Number, default: 0 },
  completedProspects: { type: Number, default: 0 },
  optedOutProspects: { type: Number, default: 0 },
  repliedProspects: { type: Number, default: 0 },
  interestedProspects: { type: Number, default: 0 },
  avgReplyRate: { type: Number, default: 0 },
  avgOpenRate: { type: Number, default: 0 },
  avgClickRate: { type: Number, default: 0 },
  avgConversionRate: { type: Number, default: 0 },
}, { _id: false });

const SequenceSchema = new Schema<ISequence>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: String,

  type: {
    type: String,
    enum: ['email', 'linkedin', 'sms', 'call', 'multi-channel'],
    default: 'email',
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft',
    index: true,
  },

  channel: {
    type: String,
    enum: ['email', 'linkedin_connection', 'linkedin_message', 'linkedin_post', 'sms', 'call', 'task'],
    default: 'email',
  },
  steps: [SequenceStepSchema],
  totalDurationDays: { type: Number, default: 30 },

  abTestEnabled: { type: Boolean, default: false },
  abVariants: [ABVariantSchema],

  targetIcpIds: [{ type: String }],
  targetTags: [{ type: String }],
  excludeTags: [{ type: String }],

  dailyLimit: Number,
  maxProspects: Number,

  workingHours: {
    enabled: { type: Boolean, default: false },
    startHour: { type: Number, default: 9 },
    endHour: { type: Number, default: 17 },
    timezone: { type: String, default: 'UTC' },
    daysOfWeek: [Number],
  },

  stats: {
    type: SequenceStatsSchema,
    default: () => ({}),
  },

  createdBy: { type: String, required: true },
  assignedTo: String,

  scheduledStartAt: Date,
  scheduledEndAt: Date,
}, {
  timestamps: true,
});

// Indexes
SequenceSchema.index({ tenantId: 1, status: 1 });
SequenceSchema.index({ tenantId: 1, type: 1 });
SequenceSchema.index({ tenantId: 1, createdBy: 1 });
SequenceSchema.index({ createdAt: -1 });

// ============================================================================
// Model
// ============================================================================

export const SequenceModel: Model<ISequence> = mongoose.model<ISequence>('Sequence', SequenceSchema);
export default SequenceModel;
