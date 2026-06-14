import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  ChannelType,
  CampaignStatus,
  MessageStatus,
  ABTestStatus,
  DeliveryStatus,
  TriggerType,
} from '../types';

// ==================== SCHEMAS ====================

export interface IContactInfo {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface IEmailTemplate {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
  isActive: boolean;
  createdBy?: string;
}

export interface ISMSTemplate {
  name: string;
  content: string;
  variables?: string[];
  isActive: boolean;
  createdBy?: string;
}

export interface IABTestVariant {
  variantId: string;
  name: string;
  templateId: string;
  subject?: string;
  content: string;
  sendPercentage: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
}

export interface IABTest {
  name: string;
  campaignId: mongoose.Types.ObjectId;
  channel: ChannelType;
  variants: IABTestVariant[];
  status: ABTestStatus;
  startDate: Date;
  endDate?: Date;
  winningVariantId?: string;
  metrics?: {
    openRate?: number;
    clickRate?: number;
    conversionRate?: number;
  };
}

export interface ISequenceStep {
  stepId: string;
  order: number;
  channel: ChannelType;
  templateId: mongoose.Types.ObjectId;
  delayMinutes: number;
  delayDays?: number;
  delayHours?: number;
  triggerType: TriggerType;
  scheduledTime?: string;
  condition?: {
    field: string;
    operator: string;
    value: string | number | boolean;
  };
}

export interface ISequence {
  name: string;
  description?: string;
  steps: ISequenceStep[];
  trigger: {
    type: TriggerType;
    eventName?: string;
    timeDelay?: number;
  };
  status: 'active' | 'paused' | 'completed' | 'archived';
  totalContacts: number;
  completedContacts: number;
}

export interface ICampaign {
  name: string;
  description?: string;
  channel: ChannelType;
  templateId: mongoose.Types.ObjectId;
  subject?: string;
  status: CampaignStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  respondedCount: number;
  failedCount: number;
  abTest?: IABTest;
  createdBy?: string;
}

export interface IDripCampaign {
  name: string;
  description?: string;
  channel: ChannelType;
  sequences: ISequence[];
  enrollmentCriteria?: {
    field: string;
    operator: string;
    value: string | number | boolean;
  };
  exitCriteria?: {
    field: string;
    operator: string;
    value: string | number | boolean;
  };
  reEnrollmentEnabled: boolean;
  reEnrollmentDelayDays?: number;
  status: CampaignStatus;
  totalEnrolled: number;
  completedCount: number;
}

export interface IDeliveryRecord {
  campaignId?: mongoose.Types.ObjectId;
  sequenceId?: mongoose.Types.ObjectId;
  stepId?: string;
  contact: IContactInfo;
  channel: ChannelType;
  templateId: mongoose.Types.ObjectId;
  status: DeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface IUnsubscribeRecord {
  contact: IContactInfo;
  channel: ChannelType;
  reason?: string;
  source: 'link_click' | 'reply' | 'manual' | 'bounce';
  campaignId?: mongoose.Types.ObjectId;
  unsubscribedAt: Date;
}

export interface IQueuedMessage {
  contact: IContactInfo;
  channel: ChannelType;
  templateId: mongoose.Types.ObjectId;
  subject?: string;
  content: string;
  variables?: Record<string, string | number | boolean | null | undefined>;
  scheduledFor?: Date;
  priority: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ISequenceEnrollment {
  contact: IContactInfo;
  sequenceId: mongoose.Types.ObjectId;
  currentStepIndex: number;
  enrolledAt: Date;
  lastStepCompletedAt?: Date;
  completedSteps: string[];
  paused: boolean;
  pausedAt?: Date;
  exitReason?: string;
}

// ==================== SCHEMA DEFINITIONS ====================

const ContactInfoSchema = new Schema<IContactInfo>(
  {
    email: { type: String, sparse: true, lowercase: true, trim: true },
    phone: { type: String, sparse: true, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    userId: { type: String, sparse: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const SequenceStepSchema = new Schema<ISequenceStep>(
  {
    stepId: { type: String, required: true },
    order: { type: Number, required: true },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'EmailTemplate', required: true },
    delayMinutes: { type: Number, default: 0 },
    delayDays: { type: Number },
    delayHours: { type: Number },
    triggerType: {
      type: String,
      enum: ['immediate', 'scheduled', 'time_delay', 'event_based', 'drip_day'],
      default: 'immediate',
    },
    scheduledTime: { type: String },
    condition: {
      field: String,
      operator: String,
      value: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const ABTestVariantSchema = new Schema<IABTestVariant>(
  {
    variantId: { type: String, required: true },
    name: { type: String, required: true },
    templateId: { type: String, required: true },
    subject: { type: String },
    content: { type: String, required: true },
    sendPercentage: { type: Number, required: true, min: 0, max: 100 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    openedCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const ABTestSchema = new Schema<IABTest>(
  {
    name: { type: String, required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    variants: { type: [ABTestVariantSchema], required: true },
    status: {
      type: String,
      enum: ['running', 'completed', 'cancelled'],
      default: 'running',
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    winningVariantId: { type: String },
    metrics: {
      openRate: { type: Number },
      clickRate: { type: Number },
      conversionRate: { type: Number },
    },
  },
  { timestamps: true }
);

// ==================== MODELS ====================

export const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    htmlContent: { type: String, required: true },
    textContent: { type: String },
    variables: [{ type: String }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export const SMSTemplateSchema = new Schema<ISMSTemplate>(
  {
    name: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    variables: [{ type: String }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    templateId: { type: Schema.Types.ObjectId, required: true },
    subject: { type: String },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'archived'],
      default: 'draft',
    },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    openedCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
    respondedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    abTest: { type: ABTestSchema },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export const DripCampaignSchema = new Schema<IDripCampaign>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    sequences: { type: [SequenceStepSchema], required: true },
    enrollmentCriteria: {
      field: String,
      operator: String,
      value: Schema.Types.Mixed,
    },
    exitCriteria: {
      field: String,
      operator: String,
      value: Schema.Types.Mixed,
    },
    reEnrollmentEnabled: { type: Boolean, default: false },
    reEnrollmentDelayDays: { type: Number },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'archived'],
      default: 'draft',
    },
    totalEnrolled: { type: Number, default: 0 },
    completedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SequenceSchema = new Schema<ISequence>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    steps: { type: [SequenceStepSchema], required: true },
    trigger: {
      type: {
        type: String,
        enum: ['immediate', 'scheduled', 'time_delay', 'event_based', 'drip_day'],
        required: true,
      },
      eventName: { type: String },
      timeDelay: { type: Number },
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'archived'],
      default: 'active',
    },
    totalContacts: { type: Number, default: 0 },
    completedContacts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DeliveryRecordSchema = new Schema<IDeliveryRecord>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    sequenceId: { type: Schema.Types.ObjectId, ref: 'Sequence' },
    stepId: { type: String },
    contact: { type: ContactInfoSchema, required: true },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    templateId: { type: Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced'],
      default: 'queued',
    },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    openedAt: { type: Date },
    clickedAt: { type: Date },
    failedAt: { type: Date },
    errorMessage: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
DeliveryRecordSchema.index({ contact: 1, campaignId: 1 });
DeliveryRecordSchema.index({ status: 1, scheduledFor: 1 });
DeliveryRecordSchema.index({ campaignId: 1, status: 1 });

export const UnsubscribeRecordSchema = new Schema<IUnsubscribeRecord>(
  {
    contact: { type: ContactInfoSchema, required: true },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    reason: { type: String },
    source: {
      type: String,
      enum: ['link_click', 'reply', 'manual', 'bounce'],
      required: true,
    },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    unsubscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound indexes for unsubscribe lookups
UnsubscribeRecordSchema.index({ 'contact.email': 1, channel: 1 });
UnsubscribeRecordSchema.index({ 'contact.phone': 1, channel: 1 });

export const QueuedMessageSchema = new Schema<IQueuedMessage>(
  {
    contact: { type: ContactInfoSchema, required: true },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    templateId: { type: Schema.Types.ObjectId, required: true },
    subject: { type: String },
    content: { type: String, required: true },
    variables: { type: Schema.Types.Mixed },
    scheduledFor: { type: Date, index: true },
    priority: { type: Number, default: 0 },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Index for efficient message processing
QueuedMessageSchema.index({ status: 1, scheduledFor: 1, priority: -1 });

export const SequenceEnrollmentSchema = new Schema<ISequenceEnrollment>(
  {
    contact: { type: ContactInfoSchema, required: true },
    sequenceId: { type: Schema.Types.ObjectId, ref: 'Sequence', required: true },
    currentStepIndex: { type: Number, default: 0 },
    enrolledAt: { type: Date, default: Date.now },
    lastStepCompletedAt: { type: Date },
    completedSteps: [{ type: String }],
    paused: { type: Boolean, default: false },
    pausedAt: { type: Date },
    exitReason: { type: String },
  },
  { timestamps: true }
);

// Compound index for enrollment queries
SequenceEnrollmentSchema.index({ sequenceId: 1, 'contact.email': 1 });
SequenceEnrollmentSchema.index({ sequenceId: 1, 'contact.phone': 1 });
SequenceEnrollmentSchema.index({ paused: 1, currentStepIndex: 1 });

// ==================== MODEL INTERFACES ====================

export interface IEmailTemplateModel extends Document, IEmailTemplate {}
export interface ISMSTemplateModel extends Document, ISMSTemplate {}
export interface ICampaignModel extends Document, ICampaign {}
export interface IDripCampaignModel extends Document, IDripCampaign {}
export interface ISequenceModel extends Document, ISequence {}
export interface IDeliveryRecordModel extends Document, IDeliveryRecord {}
export interface IUnsubscribeRecordModel extends Document, IUnsubscribeRecord {}
export interface IQueuedMessageModel extends Document, IQueuedMessage {}
export interface ISequenceEnrollmentModel extends Document, ISequenceEnrollment {}

// ==================== MODEL EXPORTS ====================

export const EmailTemplate: Model<IEmailTemplateModel> = mongoose.model<IEmailTemplateModel>(
  'EmailTemplate',
  EmailTemplateSchema
);

export const SMSTemplate: Model<ISMSTemplateModel> = mongoose.model<ISMSTemplateModel>(
  'SMSTemplate',
  SMSTemplateSchema
);

export const Campaign: Model<ICampaignModel> = mongoose.model<ICampaignModel>(
  'Campaign',
  CampaignSchema
);

export const DripCampaign: Model<IDripCampaignModel> = mongoose.model<IDripCampaignModel>(
  'DripCampaign',
  DripCampaignSchema
);

export const Sequence: Model<ISequenceModel> = mongoose.model<ISequenceModel>(
  'Sequence',
  SequenceSchema
);

export const DeliveryRecord: Model<IDeliveryRecordModel> = mongoose.model<IDeliveryRecordModel>(
  'DeliveryRecord',
  DeliveryRecordSchema
);

export const UnsubscribeRecord: Model<IUnsubscribeRecordModel> = mongoose.model<IUnsubscribeRecordModel>(
  'UnsubscribeRecord',
  UnsubscribeRecordSchema
);

export const QueuedMessage: Model<IQueuedMessageModel> = mongoose.model<IQueuedMessageModel>(
  'QueuedMessage',
  QueuedMessageSchema
);

export const SequenceEnrollment: Model<ISequenceEnrollmentModel> = mongoose.model<ISequenceEnrollmentModel>(
  'SequenceEnrollment',
  SequenceEnrollmentSchema
);

// ==================== HELPER METHODS ====================

// Check if contact is unsubscribed
export async function isContactUnsubscribed(
  contact: IContactInfo,
  channel: ChannelType
): Promise<boolean> {
  const query: Record<string, unknown> = { channel };

  if (contact.email) {
    query['contact.email'] = contact.email.toLowerCase();
  } else if (contact.phone) {
    query['contact.phone'] = contact.phone;
  } else {
    return false;
  }

  const unsubscribe = await UnsubscribeRecord.findOne(query);
  return !!unsubscribe;
}

// Get delivery statistics for a campaign
export async function getCampaignStats(
  campaignId: mongoose.Types.ObjectId
): Promise<{
  total: number;
  sent: number;
  delivered: number;
  opened?: number;
  clicked?: number;
  failed: number;
}> {
  const stats = await DeliveryRecord.aggregate([
    { $match: { campaignId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    failed: 0,
  };

  for (const stat of stats) {
    result.total += stat.count;
    if (stat._id === 'sent') result.sent = stat.count;
    if (stat._id === 'delivered') result.delivered = stat.count;
    if (stat._id === 'opened') result.opened = stat.count;
    if (stat._id === 'clicked') result.clicked = stat.count;
    if (stat._id === 'failed' || stat._id === 'bounced') result.failed += stat.count;
  }

  return result;
}
