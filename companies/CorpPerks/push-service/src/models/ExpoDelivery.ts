import mongoose, { Document, Schema } from 'mongoose';

// ==================== INTERFACE ====================

export type ExpoDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed';

export interface IExpoDelivery extends Document {
  deliveryId: string;
  notificationId: string;
  expoPushToken: string;
  expoTicketId?: string;
  status: ExpoDeliveryStatus;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
  sentAt?: Date;
  deliveredAt?: Date;
  bouncedAt?: Date;
  retryCount: number;
  lastRetryAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== SCHEMA ====================

const ExpoDeliverySchema = new Schema<IExpoDelivery>(
  {
    deliveryId: { type: String, required: true, unique: true, index: true },
    notificationId: { type: String, required: true, index: true },
    expoPushToken: { type: String, required: true, index: true },
    expoTicketId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'bounced', 'failed'],
      default: 'pending',
      index: true,
    },
    error: {
      code: { type: String },
      message: { type: String },
      details: { type: Schema.Types.Mixed },
    },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    bouncedAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    lastRetryAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ==========================

ExpoDeliverySchema.index({ notificationId: 1, status: 1 });
ExpoDeliverySchema.index({ expoPushToken: 1, status: 1 });
ExpoDeliverySchema.index({ status: 1, createdAt: -1 });
ExpoDeliverySchema.index({ expoTicketId: 1 });

// ==================== METHODS ====================

ExpoDeliverySchema.methods.markSent = async function (ticketId?: string): Promise<void> {
  this.status = 'sent';
  this.sentAt = new Date();
  if (ticketId) {
    this.expoTicketId = ticketId;
  }
  await this.save();
};

ExpoDeliverySchema.methods.markDelivered = async function (): Promise<void> {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  await this.save();
};

ExpoDeliverySchema.methods.markBounced = async function (
  errorCode: string,
  errorMessage: string,
  details?: Record<string, unknown>
): Promise<void> {
  this.status = 'bounced';
  this.bouncedAt = new Date();
  this.error = { code: errorCode, message: errorMessage, details };
  await this.save();
};

ExpoDeliverySchema.methods.markFailed = async function (
  errorCode: string,
  errorMessage: string,
  details?: Record<string, unknown>
): Promise<void> {
  this.status = 'failed';
  this.error = { code: errorCode, message: errorMessage, details };
  await this.save();
};

ExpoDeliverySchema.methods.scheduleRetry = async function (): Promise<void> {
  this.retryCount += 1;
  this.lastRetryAt = new Date();
  this.status = 'pending';
  await this.save();
};

// ==================== STATICS ====================

ExpoDeliverySchema.statics.findByNotification = function (
  notificationId: string
): Promise<IExpoDelivery[]> {
  return this.find({ notificationId }).exec();
};

ExpoDeliverySchema.statics.findPending = function (limit = 100): Promise<IExpoDelivery[]> {
  return this.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .exec();
};

ExpoDeliverySchema.statics.findFailed = function (limit = 100): Promise<IExpoDelivery[]> {
  return this.find({ status: 'failed', retryCount: { $lt: 3 } })
    .sort({ createdAt: 1 })
    .limit(limit)
    .exec();
};

ExpoDeliverySchema.statics.getStatsByNotification = async function (
  notificationId: string
): Promise<{ sent: number; delivered: number; bounced: number; failed: number; total: number }> {
  const results = await this.aggregate([
    { $match: { notificationId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = { sent: 0, delivered: 0, bounced: 0, failed: 0, total: 0 };
  for (const result of results) {
    const status = result._id as keyof typeof stats;
    if (status in stats) {
      stats[status] = result.count;
      stats.total += result.count;
    }
  }
  return stats;
};

// ==================== MODEL ====================

export const ExpoDelivery = mongoose.model<IExpoDelivery>('ExpoDelivery', ExpoDeliverySchema);
