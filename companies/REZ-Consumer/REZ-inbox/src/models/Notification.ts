/**
 * Notification Model
 * Core notification entity for the REZ inbox service
 */

import mongoose, { Document, Schema } from 'mongoose';

// Notification type enum
export enum NotificationType {
  ORDER = 'order',
  PAYMENT = 'payment',
  PROMO = 'promo',
  SYSTEM = 'system',
  CHAT = 'chat',
  DELIVERY = 'delivery',
  RIDE = 'ride',
  BOOKING = 'booking',
  SECURITY = 'security'
}

// Notification priority enum
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Notification status enum
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  ARCHIVED = 'archived'
}

// Notification channel enum
export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  WHATSAPP = 'whatsapp'
}

// Notification interface
export interface INotification extends Document {
  // Core fields
  userId: string;
  type: NotificationType;
  title: string;
  body: string;

  // Metadata
  data?: Record<string, any>;
  priority: NotificationPriority;
  status: NotificationStatus;

  // Tracking
  read: boolean;
  readAt?: Date;
  deliveredAt?: Date;

  // Channels
  channels: NotificationChannel[];
  channelStatuses: Record<string, 'pending' | 'sent' | 'delivered' | 'failed'>;

  // Actions
  actionUrl?: string;
  actionType?: 'deep_link' | 'web_url' | 'dismiss' | 'reply';

  // Grouping
  groupId?: string;
  threadId?: string;

  // Delivery tracking
  pushToken?: string;
  email?: string;
  phone?: string;

  // Timing
  scheduledAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Source tracking
  sourceService?: string;
  sourceEvent?: string;

  // Preferences check
  shouldSend(userId: string): Promise<boolean>;
}

// Notification schema
const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    body: {
      type: String,
      required: true,
      maxlength: 1000
    },
    data: {
      type: Schema.Types.Mixed,
      default: {}
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.NORMAL
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    },
    channels: {
      type: [String],
      enum: Object.values(NotificationChannel),
      default: [NotificationChannel.IN_APP]
    },
    channelStatuses: {
      type: Map,
      of: String,
      default: {}
    },
    actionUrl: {
      type: String
    },
    actionType: {
      type: String,
      enum: ['deep_link', 'web_url', 'dismiss', 'reply']
    },
    groupId: {
      type: String,
      index: true
    },
    threadId: {
      type: String,
      index: true
    },
    pushToken: {
      type: String
    },
    email: {
      type: String
    },
    phone: {
      type: String
    },
    scheduledAt: {
      type: Date,
      index: true
    },
    expiresAt: {
      type: Date
    },
    sourceService: {
      type: String
    },
    sourceEvent: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ scheduledAt: 1, status: 1 });
NotificationSchema.index({ groupId: 1, createdAt: -1 });
NotificationSchema.index({ threadId: 1, createdAt: -1 });

// Virtual for checking if notification is expired
NotificationSchema.virtual('isExpired').get(function () {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Pre-save hook
NotificationSchema.pre('save', function (next) {
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = new Date();
    this.status = NotificationStatus.READ;
  }
  next();
});

// Static method to mark as read
NotificationSchema.statics.markAsRead = async function (
  notificationId: string,
  userId: string
): Promise<INotification | null> {
  return this.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true, readAt: new Date(), status: NotificationStatus.READ },
    { new: true }
  );
};

// Static method to mark multiple as read
NotificationSchema.statics.markManyAsRead = async function (
  userId: string,
  notificationIds?: string[]
): Promise<number> {
  const query: Record<string, any> = { userId, read: false };
  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }
  const result = await this.updateMany(query, {
    read: true,
    readAt: new Date(),
    status: NotificationStatus.READ
  });
  return result.modifiedCount;
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = async function (
  userId: string
): Promise<number> {
  return this.countDocuments({ userId, read: false });
};

// Static method to get notifications by type
NotificationSchema.statics.getByType = async function (
  userId: string,
  type: NotificationType,
  limit = 50,
  offset = 0
): Promise<INotification[]> {
  return this.find({ userId, type })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);
};

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);