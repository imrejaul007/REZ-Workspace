/**
 * Dunning Configuration Model
 *
 * Defines dunning rules and sequences for B2B payment recovery.
 * Each merchant can have multiple dunning configurations for different scenarios.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

// ── Subdocument Schemas ──────────────────────────────────────────────────────

/**
 * Dunning Rule - defines a single step in the dunning sequence
 */
export interface IDunningRule {
  sequence: number; // Order in the sequence (1, 2, 3...)
  trigger: 'due_date' | 'days_overdue' | 'amount_threshold';
  triggerDays: number; // Days relative to trigger (negative = before, positive = after)
  triggerAmount?: number; // Threshold amount for amount_threshold trigger
  channel: 'whatsapp' | 'sms' | 'email' | 'all';
  template: string; // Template name to use
  priority: 'low' | 'medium' | 'high' | 'critical';
  ccEmails?: string[]; // CC email recipients
  bccEmails?: string[]; // BCC email recipients
  requiresApproval: boolean; // Whether this step requires manual approval
  approverEmail?: string; // Email to send approval request
  isActive: boolean;
}

const DunningRuleSchema = new Schema<IDunningRule>(
  {
    sequence: { type: Number, required: true, min: 1 },
    trigger: {
      type: String,
      enum: ['due_date', 'days_overdue', 'amount_threshold'],
      required: true,
    },
    triggerDays: { type: Number, required: true }, // Negative = before, positive = after
    triggerAmount: { type: Number, min: 0 },
    channel: {
      type: String,
      enum: ['whatsapp', 'sms', 'email', 'all'],
      required: true,
    },
    template: { type: String, required: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    ccEmails: [{ type: String }],
    bccEmails: [{ type: String }],
    requiresApproval: { type: Boolean, default: false },
    approverEmail: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

/**
 * Business Hours Configuration
 */
export interface IBusinessHours {
  start: string; // '09:00'
  end: string; // '20:00'
  timezone: string; // 'Asia/Kolkata'
  excludeDays: string[]; // ['Sunday']
}

const BusinessHoursSchema = new Schema<IBusinessHours>(
  {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '20:00' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    excludeDays: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  },
  { _id: false }
);

/**
 * Escalation Contact - contacts to notify at different escalation levels
 */
export interface IEscalationContact {
  level: number; // Escalation level (1, 2, 3...)
  email?: string;
  phone?: string;
  name?: string;
}

const EscalationContactSchema = new Schema<IEscalationContact>(
  {
    level: { type: Number, required: true, min: 1 },
    email: { type: String },
    phone: { type: String },
    name: { type: String },
  },
  { _id: false }
);

// ── Main Dunning Config Schema ──────────────────────────────────────────────

export interface IDunningConfig extends Document {
  merchantId: Types.ObjectId;
  name: string; // e.g., "Standard 30-day", "Aggressive 15-day"
  description?: string;
  isDefault: boolean;
  rules: IDunningRule[];
  businessHours: IBusinessHours;
  escalationContacts: IEscalationContact[];
  minOverdueAmount: number; // Minimum overdue amount to trigger dunning
  maxDunningDays: number; // Max days to run dunning before marking as bad debt
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const DunningConfigSchema = new Schema<IDunningConfig>(
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
    description: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    rules: {
      type: [DunningRuleSchema],
      default: [],
    },
    businessHours: {
      type: BusinessHoursSchema,
      default: () => ({
        start: '09:00',
        end: '20:00',
        timezone: 'Asia/Kolkata',
        excludeDays: ['Sunday'],
      }),
    },
    escalationContacts: {
      type: [EscalationContactSchema],
      default: [],
    },
    minOverdueAmount: {
      type: Number,
      default: 100, // Minimum INR 100 overdue
      min: 0,
    },
    maxDunningDays: {
      type: Number,
      default: 90, // Max 90 days of dunning
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    collection: 'dunningconfigs',
  }
);

// ── Indexes ─────────────────────────────────────────────────────────────────

DunningConfigSchema.index({ merchantId: 1, isDefault: 1 });
DunningConfigSchema.index({ merchantId: 1, isActive: 1 });
DunningConfigSchema.index({ merchantId: 1, name: 1 }, { unique: true });

// ── Pre-save Hooks ──────────────────────────────────────────────────────────

/**
 * Ensure only one default config per merchant
 */
DunningConfigSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await DunningConfig.updateMany(
      { merchantId: this.merchantId, _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

/**
 * Validate triggerAmount for amount_threshold trigger
 */
DunningRuleSchema.pre('save', function (next) {
  if (this.trigger === 'amount_threshold' && !this.triggerAmount) {
    return next(new Error('triggerAmount is required for amount_threshold trigger'));
  }
  next();
});

// ── Instance Methods ──────────────────────────────────────────────────────────

/**
 * Get active rules sorted by sequence
 */
DunningConfigSchema.methods.getActiveRules = function (): IDunningRule[] {
  return this.rules
    .filter((rule) => rule.isActive)
    .sort((a, b) => a.sequence - b.sequence);
};

/**
 * Get rule by sequence number
 */
DunningConfigSchema.methods.getRuleBySequence = function (sequence: number): IDunningRule | undefined {
  return this.rules.find((rule) => rule.sequence === sequence && rule.isActive);
};

/**
 * Check if current time is within business hours
 */
DunningConfigSchema.methods.isWithinBusinessHours = function (): boolean {
  const now = new Date();
  const timeZone = this.businessHours.timezone || 'Asia/Kolkata';

  // Format current time in the configured timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'long',
  };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(now);

  const currentDay = parts.find((p) => p.type === 'weekday')?.value;
  const currentTime = parts.find((p) => p.type === 'hour')?.value + ':' + parts.find((p) => p.type === 'minute')?.value;

  // Check if current day is excluded
  if (this.businessHours.excludeDays?.includes(currentDay || '')) {
    return false;
  }

  // Check if within time range
  const start = this.businessHours.start || '09:00';
  const end = this.businessHours.end || '20:00';

  return currentTime >= start && currentTime <= end;
};

// ── Static Methods ───────────────────────────────────────────────────────────

/**
 * Get default config for a merchant
 */
DunningConfigSchema.statics.getDefaultConfig = async function (
  merchantId: Types.ObjectId
): Promise<IDunningConfig | null> {
  return this.findOne({ merchantId, isDefault: true, isActive: true });
};

/**
 * Get all active configs for a merchant
 */
DunningConfigSchema.statics.getActiveConfigs = async function (
  merchantId: Types.ObjectId
): Promise<IDunningConfig[]> {
  return this.find({ merchantId, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
};

// ── Model Export ─────────────────────────────────────────────────────────────

export const DunningConfig =
  mongoose.models.DunningConfig || mongoose.model<IDunningConfig>('DunningConfig', DunningConfigSchema);
