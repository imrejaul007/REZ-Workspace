/**
 * WhatsApp Message Model
 *
 * Persistent storage for WhatsApp messages and conversations.
 * Provides MongoDB-backed history for messages, conversations, and templates.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { WhatsAppTemplate } from '../services/whatsappTemplates';

/**
 * WhatsApp message status
 */
export enum WhatsAppStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  PENDING = 'pending',
}

/**
 * WhatsApp message type
 */
export enum WhatsAppMessageType {
  TEXT = 'text',
  TEMPLATE = 'template',
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  INTERACTIVE = 'interactive',
}

/**
 * WhatsApp message direction
 */
export enum WhatsAppDirection {
  OUTBOUND = 'outbound',
  INBOUND = 'inbound',
}

/**
 * WhatsApp Message interface
 */
export interface IWhatsAppMessage extends Document {
  // Identification
  messageId: string;        // WhatsApp message ID
  waId: string;             // WhatsApp user ID (phone number)

  // Merchant context
  merchantId: Types.ObjectId;

  // Recipient
  recipientPhone: string;    // E.164 format

  // Message content
  type: WhatsAppMessageType;
  direction: WhatsAppDirection;
  templateName?: string;
  templateParams?: string[];

  // Status
  status: WhatsAppStatus;
  statusHistory: Array<{
    status: WhatsAppStatus;
    timestamp: Date;
    error?: string;
  }>;

  // Timestamps
  queuedAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  failedReason?: string;

  // References
  referenceId?: string;      // External reference (PO ID, RFQ ID, etc.)
  conversationId?: Types.ObjectId;

  // Content
  content?: {
    text?: string;
    mediaUrl?: string;
    mediaId?: string;
    caption?: string;
    buttons?: Array<{
      type: 'reply' | 'url';
      title: string;
      id?: string;
      url?: string;
    }>;
  };

  // Metadata
  metadata?: Record<string, unknown>;

  // Retry tracking
  retryCount: number;
  maxRetries: number;
  lastRetryAt?: Date;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;
}

/**
 * WhatsApp Conversation interface
 */
export interface IWhatsAppConversation extends Document {
  // Identification
  conversationId: string;    // Unique conversation ID (waId)

  // Merchant context
  merchantId: Types.ObjectId;

  // Supplier link (if applicable)
  supplierId?: Types.ObjectId;

  // Contact info
  displayName?: string;
  phoneNumber: string;       // E.164 format

  // Stats
  messageCount: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };

  // Last activity
  lastMessageAt?: Date;
  lastMessageId?: string;
  lastMessagePreview?: string;

  // Status
  isActive: boolean;
  isBlocked: boolean;
  blockedReason?: string;

  // Tags
  tags: string[];

  // Notes
  notes?: string;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;
}

/**
 * WhatsApp Template Usage interface (for analytics)
 */
export interface IWhatsAppTemplateUsage extends Document {
  merchantId: Types.ObjectId;
  templateName: string;
  template: WhatsAppTemplate;

  // Stats
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;

  // Period
  period: 'daily' | 'weekly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;

  // Last used
  lastUsedAt: Date;
}

// ── Message Schema ──────────────────────────────────────────────────────────────

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    waId: {
      type: String,
      required: true,
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    recipientPhone: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(WhatsAppMessageType),
      required: true,
    },
    direction: {
      type: String,
      enum: Object.values(WhatsAppDirection),
      default: WhatsAppDirection.OUTBOUND,
    },
    templateName: String,
    templateParams: [String],
    status: {
      type: String,
      enum: Object.values(WhatsAppStatus),
      default: WhatsAppStatus.PENDING,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(WhatsAppStatus),
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        error: String,
      },
    ],
    queuedAt: Date,
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    failedAt: Date,
    failedReason: String,
    referenceId: String,
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'WhatsAppConversation',
    },
    content: {
      text: String,
      mediaUrl: String,
      mediaId: String,
      caption: String,
      buttons: [
        {
          type: String,
          title: String,
          id: String,
          url: String,
        },
      ],
    },
    metadata: Schema.Types.Mixed,
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    lastRetryAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
    strict: true,
    collection: 'whatsappmessages',
  }
);

// Indexes
WhatsAppMessageSchema.index({ merchantId: 1, createdAt: -1 });
WhatsAppMessageSchema.index({ merchantId: 1, status: 1 });
WhatsAppMessageSchema.index({ merchantId: 1, referenceId: 1 });
WhatsAppMessageSchema.index({ conversationId: 1, createdAt: -1 });
WhatsAppMessageSchema.index({ recipientPhone: 1, createdAt: -1 });

// ── Conversation Schema ────────────────────────────────────────────────────────

const WhatsAppConversationSchema = new Schema<IWhatsAppConversation>(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    displayName: String,
    phoneNumber: {
      type: String,
      required: true,
    },
    messageCount: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    lastMessageAt: Date,
    lastMessageId: String,
    lastMessagePreview: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedReason: String,
    tags: {
      type: [String],
      default: [],
    },
    notes: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
    strict: true,
    collection: 'whatsappconversations',
  }
);

// Indexes
WhatsAppConversationSchema.index({ merchantId: 1, isActive: 1 });
WhatsAppConversationSchema.index({ merchantId: 1, lastMessageAt: -1 });
WhatsAppConversationSchema.index({ supplierId: 1 });

// ── Template Usage Schema ──────────────────────────────────────────────────────

const WhatsAppTemplateUsageSchema = new Schema<IWhatsAppTemplateUsage>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    templateName: {
      type: String,
      required: true,
    },
    template: {
      type: String,
      enum: Object.values(WhatsAppTemplate),
      required: true,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    deliveredCount: {
      type: Number,
      default: 0,
    },
    readCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'whatsapptemplateusage',
  }
);

// Indexes
WhatsAppTemplateUsageSchema.index({
  merchantId: 1,
  template: 1,
  period: 1,
  periodStart: 1,
}, { unique: true });

// ── Instance Methods ───────────────────────────────────────────────────────────

/**
 * Update message status with history
 */
WhatsAppMessageSchema.methods.updateStatus = function (
  newStatus: WhatsAppStatus,
  error?: string
): void {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    error,
  });

  // Update specific timestamps
  switch (newStatus) {
    case WhatsAppStatus.SENT:
      this.sentAt = new Date();
      break;
    case WhatsAppStatus.DELIVERED:
      this.deliveredAt = new Date();
      break;
    case WhatsAppStatus.READ:
      this.readAt = new Date();
      break;
    case WhatsAppStatus.FAILED:
      this.failedAt = new Date();
      this.failedReason = error;
      break;
  }
};

/**
 * Increment retry count
 */
WhatsAppMessageSchema.methods.incrementRetry = function (): void {
  this.retryCount += 1;
  this.lastRetryAt = new Date();
};

/**
 * Check if can retry
 */
WhatsAppMessageSchema.methods.canRetry = function (): boolean {
  return this.retryCount < this.maxRetries && this.status !== WhatsAppStatus.READ;
};

// ── Static Methods ─────────────────────────────────────────────────────────────

/**
 * Find messages by merchant with pagination
 */
WhatsAppMessageSchema.statics.findByMerchant = async function (
  merchantId: string,
  options: {
    page?: number;
    limit?: number;
    status?: WhatsAppStatus;
    phone?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const { page = 1, limit = 20, status, phone, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { merchantId, isDeleted: false };

  if (status) query.status = status;
  if (phone) query.recipientPhone = phone;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) (query.createdAt as Record<string, Date>).$gte = startDate;
    if (endDate) (query.createdAt as Record<string, Date>).$lte = endDate;
  }

  const [items, total] = await Promise.all([
    this.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    this.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update conversation stats
 */
WhatsAppConversationSchema.statics.updateStats = async function (
  conversationId: string,
  status: WhatsAppStatus
) {
  const update: Record<string, unknown> = {
    $inc: { 'messageCount.total': 1 },
  };

  switch (status) {
    case WhatsAppStatus.SENT:
    case WhatsAppStatus.QUEUED:
      update.$inc = { ...(update.$inc as object), 'messageCount.sent': 1 };
      break;
    case WhatsAppStatus.DELIVERED:
      update.$inc = { ...(update.$inc as object), 'messageCount.delivered': 1 };
      break;
    case WhatsAppStatus.READ:
      update.$inc = { ...(update.$inc as object), 'messageCount.read': 1 };
      break;
    case WhatsAppStatus.FAILED:
      update.$inc = { ...(update.$inc as object), 'messageCount.failed': 1 };
      break;
  }

  return this.findOneAndUpdate(
    { conversationId },
    update,
    { new: true }
  );
};

/**
 * Get or create conversation
 */
WhatsAppConversationSchema.statics.getOrCreate = async function (
  merchantId: string,
  phoneNumber: string,
  options: {
    displayName?: string;
    supplierId?: string;
  } = {}
) {
  let conversation = await this.findOne({
    phoneNumber,
    merchantId,
    isDeleted: false,
  });

  if (!conversation) {
    const conversationId = `wa:${merchantId}:${phoneNumber.replace(/\D/g, '')}`;
    conversation = await this.create({
      conversationId,
      merchantId,
      phoneNumber,
      displayName: options.displayName,
      supplierId: options.supplierId,
      messageCount: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 },
      isActive: true,
      isBlocked: false,
      tags: [],
    });
  }

  return conversation;
};

// ── Model Exports ──────────────────────────────────────────────────────────────

export const WhatsAppMessage =
  mongoose.models.WhatsAppMessage ||
  mongoose.model<IWhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);

export const WhatsAppConversation =
  mongoose.models.WhatsAppConversation ||
  mongoose.model<IWhatsAppConversation>(
    'WhatsAppConversation',
    WhatsAppConversationSchema
  );

export const WhatsAppTemplateUsage =
  mongoose.models.WhatsAppTemplateUsage ||
  mongoose.model<IWhatsAppTemplateUsage>(
    'WhatsAppTemplateUsage',
    WhatsAppTemplateUsageSchema
  );
