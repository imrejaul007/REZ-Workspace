import mongoose, { Document, Schema } from 'mongoose';

// ==================== INTERFACE ====================

export type NotificationType =
  | 'announcement'
  | 'task_reminder'
  | 'leave_request'
  | 'leave_approved'
  | 'leave_rejected'
  | 'meeting_reminder'
  | 'payroll'
  | 'document'
  | 'performance_review'
  | 'policy_update'
  | 'shift_change'
  | 'onboarding'
  | 'general';

export interface ITemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface INotificationTemplate extends Document {
  templateId: string;
  name: string;
  description?: string;
  type: NotificationType;
  channels: ('push' | 'in_app' | 'email' | 'sms')[];
  titleTemplate: string;
  bodyTemplate: string;
  imageTemplate?: string;
  deepLinkTemplate?: string;
  variables: ITemplateVariable[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isActive: boolean;
  isDefault: boolean;
  companyId?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
}

// ==================== SCHEMA ====================

const TemplateVariableSchema = new Schema<ITemplateVariable>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'date'],
      default: 'string',
    },
    required: { type: Boolean, default: false },
    defaultValue: { type: String },
    description: { type: String },
  },
  { _id: false }
);

const NotificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    templateId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    description: { type: String },
    type: {
      type: String,
      enum: [
        'announcement',
        'task_reminder',
        'leave_request',
        'leave_approved',
        'leave_rejected',
        'meeting_reminder',
        'payroll',
        'document',
        'performance_review',
        'policy_update',
        'shift_change',
        'onboarding',
        'general',
      ],
      required: true,
      index: true,
    },
    channels: [
      {
        type: String,
        enum: ['push', 'in_app', 'email', 'sms'],
      },
    ],
    titleTemplate: { type: String, required: true },
    bodyTemplate: { type: String, required: true },
    imageTemplate: { type: String },
    deepLinkTemplate: { type: String },
    variables: [TemplateVariableSchema],
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    isActive: { type: Boolean, default: true, index: true },
    isDefault: { type: Boolean, default: false },
    companyId: { type: String, index: true },
    tags: [{ type: String, index: true }],
    metadata: { type: Schema.Types.Mixed },
    createdBy: { type: String, required: true },
    lastUsedAt: { type: Date },
    usageCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================

NotificationTemplateSchema.index({ name: 1, companyId: 1 });
NotificationTemplateSchema.index({ type: 1, isActive: 1 });
NotificationTemplateSchema.index({ companyId: 1, type: 1 });
NotificationTemplateSchema.index({ tags: 1 });

// ==================== MODEL ====================

export const NotificationTemplate = mongoose.model<INotificationTemplate>(
  'NotificationTemplate',
  NotificationTemplateSchema
);
