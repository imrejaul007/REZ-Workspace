/**
 * Reminder Template Model
 *
 * Stores message templates for dunning communications.
 * Supports multiple channels (WhatsApp, SMS, Email) with channel-specific content.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

// ── Template Variable Schema ──────────────────────────────────────────────────

export interface ITemplateVariable {
  name: string;
  description: string;
  example?: string;
  required: boolean;
}

const TemplateVariableSchema = new Schema<ITemplateVariable>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    example: { type: String },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

// ── Main Reminder Template Schema ────────────────────────────────────────────

export type TemplateType =
  | 'due_soon'
  | 'due_today'
  | 'overdue_1'
  | 'overdue_3'
  | 'overdue_7'
  | 'overdue_14'
  | 'overdue_30'
  | 'final_notice'
  | 'payment_confirmation'
  | 'custom';

export type TemplateChannel = 'whatsapp' | 'sms' | 'email' | 'all';

export interface IReminderTemplate extends Document {
  merchantId: Types.ObjectId;
  name: string; // Template identifier, e.g., "friendly_reminder", "urgent_overdue"
  type: TemplateType;
  channel: TemplateChannel;
  subject?: string; // For email only

  // Channel-specific content
  whatsappTemplate?: string; // Template body for WhatsApp
  smsTemplate?: string; // Template body for SMS
  emailHtml?: string; // Full email HTML content
  emailText?: string; // Plain text fallback for email

  // Template metadata
  variables: string[]; // Available variables: supplier_name, po_number, amount, etc.
  variableDefinitions?: ITemplateVariable[];

  // Template settings
  isDefault: boolean; // Default template for this type
  priority: 'low' | 'medium' | 'high' | 'critical';
  autoApprove: boolean; // Skip approval for this template

  // WhatsApp Business API specific
  whatsappTemplateId?: string; // Registered WhatsApp template ID
  whatsappHeaderType?: 'text' | 'image' | 'video';
  whatsappHeaderContent?: string;
  whatsappFooter?: string;
  whatsappButtons?: Array<{
    type: 'quick_reply' | 'url' | 'phone';
    text: string;
    url?: string;
    phone?: string;
  }>;

  // Status
  isActive: boolean;
  isApproved: boolean; // WhatsApp template approval status

  // Audit
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;

  // Metadata
  metadata?: Record<string, unknown>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ReminderTemplateSchema = new Schema<IReminderTemplate>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'due_soon',
        'due_today',
        'overdue_1',
        'overdue_3',
        'overdue_7',
        'overdue_14',
        'overdue_30',
        'final_notice',
        'payment_confirmation',
        'custom',
      ],
      required: true,
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'sms', 'email', 'all'],
      default: 'all',
    },
    subject: {
      type: String,
      trim: true,
    },

    // Channel-specific content
    whatsappTemplate: {
      type: String,
      trim: true,
    },
    smsTemplate: {
      type: String,
      trim: true,
    },
    emailHtml: {
      type: String,
    },
    emailText: {
      type: String,
      trim: true,
    },

    // Template metadata
    variables: [{
      type: String,
    }],
    variableDefinitions: [TemplateVariableSchema],

    // Template settings
    isDefault: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    autoApprove: {
      type: Boolean,
      default: false,
    },

    // WhatsApp Business API specific
    whatsappTemplateId: { type: String },
    whatsappHeaderType: {
      type: String,
      enum: ['text', 'image', 'video'],
    },
    whatsappHeaderContent: { type: String },
    whatsappFooter: { type: String },
    whatsappButtons: [{
      type: {
        type: String,
        enum: ['quick_reply', 'url', 'phone'],
      },
      text: { type: String },
      url: { type: String },
      phone: { type: String },
    }],

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },

    // Audit
    approvedBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },
    approvedAt: { type: Date },

    // Metadata
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    collection: 'remindertemplates',
  }
);

// ── Indexes ─────────────────────────────────────────────────────────────────

ReminderTemplateSchema.index({ merchantId: 1, name: 1 }, { unique: true });
ReminderTemplateSchema.index({ merchantId: 1, type: 1, channel: 1 });
ReminderTemplateSchema.index({ merchantId: 1, isDefault: 1, isActive: 1 });
ReminderTemplateSchema.index({ merchantId: 1, isActive: 1, type: 1 });

// ── Pre-save Hooks ──────────────────────────────────────────────────────────

/**
 * Set default template for type if not specified
 */
ReminderTemplateSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await ReminderTemplate.updateMany(
      {
        merchantId: this.merchantId,
        type: this.type,
        _id: { $ne: this._id },
        isDefault: true,
      },
      { isDefault: false }
    );
  }
  next();
});

/**
 * Validate that at least one channel content is provided
 */
ReminderTemplateSchema.pre('save', function (next) {
  const hasWhatsApp = Boolean(this.whatsappTemplate || this.whatsappTemplateId);
  const hasSMS = Boolean(this.smsTemplate);
  const hasEmail = Boolean(this.emailHtml || this.emailText || this.subject);

  if (this.channel === 'all' && !hasWhatsApp && !hasSMS && !hasEmail) {
    return next(new Error('At least one channel content must be provided'));
  }
  if (this.channel === 'whatsapp' && !hasWhatsApp) {
    return next(new Error('WhatsApp template content is required for WhatsApp channel'));
  }
  if (this.channel === 'sms' && !hasSMS) {
    return next(new Error('SMS template content is required for SMS channel'));
  }
  if (this.channel === 'email' && !hasEmail) {
    return next(new Error('Email content (subject/body) is required for Email channel'));
  }

  next();
});

// ── Instance Methods ──────────────────────────────────────────────────────────

/**
 * Get template content for a specific channel
 */
ReminderTemplateSchema.methods.getContentForChannel = function (
  channel: 'whatsapp' | 'sms' | 'email'
): string | undefined {
  switch (channel) {
    case 'whatsapp':
      return this.whatsappTemplate;
    case 'sms':
      return this.smsTemplate;
    case 'email':
      return this.emailHtml;
    default:
      return undefined;
  }
};

/**
 * Get email subject
 */
ReminderTemplateSchema.methods.getEmailSubject = function (): string {
  return this.subject || this.getDefaultSubject();
};

/**
 * Get default subject based on type
 */
ReminderTemplateSchema.methods.getDefaultSubject = function (): string {
  const subjects: Record<TemplateType, string> = {
    due_soon: 'Payment Reminder - Due in {{days_until_due}} days',
    due_today: 'Payment Due Today',
    overdue_1: 'Payment Overdue - 1 Day',
    overdue_3: 'Payment Overdue - 3 Days',
    overdue_7: 'Payment Overdue - 1 Week',
    overdue_14: 'Payment Overdue - 2 Weeks',
    overdue_30: 'Payment Overdue - 1 Month',
    final_notice: 'FINAL NOTICE - Immediate Payment Required',
    payment_confirmation: 'Payment Received - Thank You',
    custom: 'Payment Communication',
  };
  return subjects[this.type] || 'Payment Communication';
};

/**
 * Check if template is ready to send
 */
ReminderTemplateSchema.methods.isReadyToSend = function (): boolean {
  if (!this.isActive) return false;
  if (this.channel === 'whatsapp' && !this.whatsappTemplate && !this.whatsappTemplateId) return false;
  if (this.channel === 'sms' && !this.smsTemplate) return false;
  if (this.channel === 'email' && !this.emailHtml && !this.emailText) return false;
  return true;
};

// ── Static Methods ───────────────────────────────────────────────────────────

/**
 * Get template by name
 */
ReminderTemplateSchema.statics.getByName = async function (
  merchantId: Types.ObjectId,
  name: string
): Promise<IReminderTemplate | null> {
  return this.findOne({ merchantId, name, isActive: true });
};

/**
 * Get default template for type
 */
ReminderTemplateSchema.statics.getDefaultForType = async function (
  merchantId: Types.ObjectId,
  type: TemplateType
): Promise<IReminderTemplate | null> {
  return this.findOne({ merchantId, type, isDefault: true, isActive: true });
};

/**
 * Get templates by type
 */
ReminderTemplateSchema.statics.getByType = async function (
  merchantId: Types.ObjectId,
  type: TemplateType
): Promise<IReminderTemplate[]> {
  return this.find({ merchantId, type, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
};

/**
 * Get active templates for merchant
 */
ReminderTemplateSchema.statics.getActiveTemplates = async function (
  merchantId: Types.ObjectId
): Promise<IReminderTemplate[]> {
  return this.find({ merchantId, isActive: true }).sort({ type: 1, channel: 1, createdAt: -1 });
};

/**
 * Check if name exists
 */
ReminderTemplateSchema.statics.nameExists = async function (
  merchantId: Types.ObjectId,
  name: string,
  excludeId?: Types.ObjectId
): Promise<boolean> {
  const query: Record<string, unknown> = { merchantId, name };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const count = await this.countDocuments(query);
  return count > 0;
};

// ── Model Export ─────────────────────────────────────────────────────────────

export const ReminderTemplate =
  mongoose.models.ReminderTemplate || mongoose.model<IReminderTemplate>('ReminderTemplate', ReminderTemplateSchema);

// ── Default Templates ────────────────────────────────────────────────────────

/**
 * Default template variables available for all templates
 */
export const DEFAULT_TEMPLATE_VARIABLES: string[] = [
  'supplier_name',
  'supplier_contact_name',
  'supplier_email',
  'supplier_phone',
  'po_number',
  'po_numbers',
  'amount',
  'outstanding_amount',
  'total_amount',
  'due_date',
  'days_until_due',
  'days_overdue',
  'merchant_name',
  'payment_link',
  'merchant_email',
  'merchant_phone',
  'oldest_po_number',
  'oldest_po_amount',
  'oldest_po_days_overdue',
  'current_date',
  'payment_methods',
  'account_details',
];

/**
 * Required variables by template type
 */
export const REQUIRED_VARIABLES_BY_TYPE: Record<TemplateType, string[]> = {
  due_soon: ['supplier_name', 'po_number', 'amount', 'due_date', 'days_until_due'],
  due_today: ['supplier_name', 'po_number', 'amount', 'due_date'],
  overdue_1: ['supplier_name', 'po_number', 'amount', 'days_overdue'],
  overdue_3: ['supplier_name', 'po_number', 'amount', 'days_overdue'],
  overdue_7: ['supplier_name', 'po_numbers', 'outstanding_amount', 'days_overdue'],
  overdue_14: ['supplier_name', 'po_numbers', 'outstanding_amount', 'days_overdue', 'merchant_name'],
  overdue_30: ['supplier_name', 'po_numbers', 'outstanding_amount', 'days_overdue', 'merchant_name'],
  final_notice: ['supplier_name', 'po_numbers', 'outstanding_amount', 'days_overdue', 'merchant_name', 'legal_notice_text'],
  payment_confirmation: ['supplier_name', 'po_number', 'amount', 'payment_date'],
  custom: ['supplier_name'],
};
