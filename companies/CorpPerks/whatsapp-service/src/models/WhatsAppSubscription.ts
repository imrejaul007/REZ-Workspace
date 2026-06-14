import mongoose, { Document, Schema } from 'mongoose';

// Subscription status
export type SubscriptionStatus = 'active' | 'inactive' | 'paused';

// Notification preference types
export type NotificationType = 'leave_approval' | 'attendance' | 'payroll' | 'general' | 'all';

// WhatsApp message types
export type MessageType = 'text' | 'template' | 'interactive' | 'image' | 'document';

export interface IWhatsAppSubscription extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: string;
  employeeName: string;
  phoneNumber: string;
  waBusinessUid: string; // WhatsApp Business UID
  isVerified: boolean;
  verifiedAt?: Date;
  notificationPreferences: {
    leaveApproval: boolean;
    attendance: boolean;
    payroll: boolean;
    general: boolean;
  };
  status: SubscriptionStatus;
  lastMessageAt?: Date;
  lastNotificationAt?: Date;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppSubscriptionSchema = new Schema<IWhatsAppSubscription>(
  {
    employeeId: {
      type: String,
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    waBusinessUid: {
      type: String,
      required: true,
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    notificationPreferences: {
      leaveApproval: {
        type: Boolean,
        default: true,
      },
      attendance: {
        type: Boolean,
        default: true,
      },
      payroll: {
        type: Boolean,
        default: true,
      },
      general: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'paused'],
      default: 'active',
    },
    lastMessageAt: {
      type: Date,
    },
    lastNotificationAt: {
      type: Date,
    },
    language: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
WhatsAppSubscriptionSchema.index({ phoneNumber: 1 });
WhatsAppSubscriptionSchema.index({ waBusinessUid: 1 });
WhatsAppSubscriptionSchema.index({ status: 1 });
WhatsAppSubscriptionSchema.index({ employeeId: 1, status: 1 });

export const WhatsAppSubscription = mongoose.model<IWhatsAppSubscription>(
  'WhatsAppSubscription',
  WhatsAppSubscriptionSchema
);
