import mongoose, { Schema, Document } from 'mongoose';

export interface IAutomationRule extends Document {
  merchantId: string;
  storeId?: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  trigger: {
    type: 'rebooking_overdue' | 'birthday' | 'post_visit_review' | 'visit_anniversary' | 'inactive_client' | 'first_visit';
    config: {
      daysSinceLastVisit?: number;
      daysBeforeBirthday?: number;
      hoursAfterVisit?: number;
      yearsAnniversary?: number;
    };
  };
  action: {
    type: 'send_push' | 'send_sms' | 'send_email' | 'give_coins';
    config: {
      title?: string;
      message: string;
      coinAmount?: number;
    };
  };
  stats: {
    sent: number;
    opened: number;
    converted: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AutomationRuleSchema = new Schema<IAutomationRule>(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, index: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['active', 'paused', 'draft'], default: 'draft' },
    trigger: {
      type: {
        type: String,
        required: true,
        enum: ['rebooking_overdue', 'birthday', 'post_visit_review', 'visit_anniversary', 'inactive_client', 'first_visit'],
      },
      config: {
        daysSinceLastVisit: Number,
        daysBeforeBirthday: Number,
        hoursAfterVisit: Number,
        yearsAnniversary: Number,
      },
    },
    action: {
      type: {
        type: String,
        required: true,
        enum: ['send_push', 'send_sms', 'send_email', 'give_coins'],
      },
      config: {
        title: String,
        message: { type: String, required: true },
        coinAmount: Number,
      },
    },
    stats: {
      sent: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      converted: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Compound index for merchant queries
AutomationRuleSchema.index({ merchantId: 1, storeId: 1 });

export const AutomationRule = mongoose.model<IAutomationRule>('AutomationRule', AutomationRuleSchema);
