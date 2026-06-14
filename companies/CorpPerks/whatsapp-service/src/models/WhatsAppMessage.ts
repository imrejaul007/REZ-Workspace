import mongoose, { Document, Schema } from 'mongoose';

// Message directions
export type MessageDirection = 'inbound' | 'outbound';

// Message status
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

// Message type
export type WhatsAppMessageType = 'text' | 'template' | 'interactive' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact';

// Notification category
export type NotificationCategory = 'leave_approval' | 'leave_rejection' | 'attendance_checkin' | 'attendance_reminder' | 'payroll_credit' | 'general' | 'hr_notice' | 'bot_command';

export interface IWhatsAppMessage extends Document {
  _id: mongoose.Types.ObjectId;
  messageId: string; // WhatsApp message ID
  waMessageId?: string; // WhatsApp Business API message ID
  subscriptionId: mongoose.Types.ObjectId;
  employeeId: string;
  phoneNumber: string;
  direction: MessageDirection;
  type: WhatsAppMessageType;
  content: {
    body?: string;
    header?: string;
    footer?: string;
    buttons?: { id: string; title: string }[];
    mediaUrl?: string;
    mediaCaption?: string;
  };
  status: MessageStatus;
  statusHistory: {
    status: MessageStatus;
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }[];
  notificationCategory: NotificationCategory;
  metadata?: {
    leaveId?: string;
    attendanceId?: string;
    payrollId?: string;
    templateName?: string;
    campaignId?: string;
    replyToMessageId?: string;
    interactiveMessageId?: string;
  };
  errorMessage?: string;
  retryCount: number;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
    },
    waMessageId: {
      type: String,
      sparse: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'WhatsAppSubscription',
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'template', 'interactive', 'image', 'document', 'audio', 'video', 'location', 'contact'],
      required: true,
    },
    content: {
      body: String,
      header: String,
      footer: String,
      buttons: [
        {
          id: String,
          title: String,
        },
      ],
      mediaUrl: String,
      mediaCaption: String,
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed'],
      default: 'queued',
    },
    statusHistory: [
      {
        status: String,
        timestamp: Date,
        metadata: Schema.Types.Mixed,
      },
    ],
    notificationCategory: {
      type: String,
      enum: [
        'leave_approval',
        'leave_rejection',
        'attendance_checkin',
        'attendance_reminder',
        'payroll_credit',
        'general',
        'hr_notice',
        'bot_command',
      ],
      default: 'general',
    },
    metadata: {
      leaveId: String,
      attendanceId: String,
      payrollId: String,
      templateName: String,
      campaignId: String,
      replyToMessageId: String,
      interactiveMessageId: String,
    },
    errorMessage: String,
    retryCount: {
      type: Number,
      default: 0,
    },
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
WhatsAppMessageSchema.index({ messageId: 1 });
WhatsAppMessageSchema.index({ waMessageId: 1 });
WhatsAppMessageSchema.index({ employeeId: 1, createdAt: -1 });
WhatsAppMessageSchema.index({ subscriptionId: 1 });
WhatsAppMessageSchema.index({ status: 1, createdAt: -1 });
WhatsAppMessageSchema.index({ notificationCategory: 1 });
WhatsAppMessageSchema.index({ phoneNumber: 1 });
WhatsAppMessageSchema.index({ createdAt: -1 }); // For cleanup jobs

export const WhatsAppMessage = mongoose.model<IWhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);
