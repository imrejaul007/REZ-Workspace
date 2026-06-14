import mongoose, { Schema, Document, Model } from 'mongoose';
import { CostAlert } from '../types';

export interface ICostAlertDocument extends Omit<CostAlert, 'createdAt' | 'updatedAt'>, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CostAlertSchema = new Schema<ICostAlertDocument>(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    supplierId: {
      type: String,
      required: true,
      index: true,
    },
    productId: String,
    alertType: {
      type: String,
      enum: ['cost_increase', 'cost_decrease', 'availability', 'quality_issue', 'lead_time_change'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    oldValue: Number,
    newValue: Number,
    changePercent: Number,
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: Date,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'costalerts',
  }
);

// Compound indexes
CostAlertSchema.index({ merchantId: 1, isRead: 1 });
CostAlertSchema.index({ merchantId: 1, isResolved: 1 });
CostAlertSchema.index({ merchantId: 1, alertType: 1, createdAt: -1 });
CostAlertSchema.index({ severity: 1, createdAt: -1 });
CostAlertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL: 90 days

// Static method to create alert for cost change
CostAlertSchema.statics.createCostChangeAlert = async function (params: {
  merchantId: string;
  supplierId: string;
  productId?: string;
  productName?: string;
  alertType: 'cost_increase' | 'cost_decrease';
  oldValue: number;
  newValue: number;
}): Promise<ICostAlertDocument> {
  const changePercent = ((params.newValue - params.oldValue) / params.oldValue) * 100;
  const absChangePercent = Math.abs(changePercent);

  // Determine severity based on change percent
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (absChangePercent >= 20) severity = 'critical';
  else if (absChangePercent >= 15) severity = 'high';
  else if (absChangePercent >= 10) severity = 'medium';

  const direction = params.alertType === 'cost_increase' ? 'increased' : 'decreased';
  const productInfo = params.productName ? ` for ${params.productName}` : '';
  const message = `Cost has ${direction} from ₹${params.oldValue.toFixed(2)} to ₹${params.newValue.toFixed(2)} (${changePercent.toFixed(1)}%)${productInfo}`;

  return this.create({
    // FIX (security): Replaced Math.random() with crypto.randomUUID()
    alertId: (() => {
      try {
        const { randomUUID } = require('crypto');
        return `alert_${Date.now()}_${randomUUID().replace(/-/g, '').substring(0, 9)}`;
      } catch {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    })(),
    merchantId: params.merchantId,
    supplierId: params.supplierId,
    productId: params.productId,
    alertType: params.alertType,
    severity,
    message,
    oldValue: params.oldValue,
    newValue: params.newValue,
    changePercent,
  });
};

// Static method to get unread alerts count
CostAlertSchema.statics.getUnreadCount = async function (merchantId: string): Promise<number> {
  return this.countDocuments({ merchantId, isRead: false, isResolved: false });
};

// Static method to get alerts by merchant
CostAlertSchema.statics.findByMerchant = function (
  merchantId: string,
  options: {
    isRead?: boolean;
    isResolved?: boolean;
    alertType?: string;
    severity?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<ICostAlertDocument[]> {
  const query: Record<string, unknown> = { merchantId };

  if (typeof options.isRead === 'boolean') query.isRead = options.isRead;
  if (typeof options.isResolved === 'boolean') query.isResolved = options.isResolved;
  if (options.alertType) query.alertType = options.alertType;
  if (options.severity) query.severity = options.severity;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(((options.page ?? 1) - 1) * (options.limit ?? 20))
    .limit(options.limit ?? 20)
    .exec();
};

// Static method to mark alerts as read
CostAlertSchema.statics.markAsRead = async function (
  merchantId: string,
  alertIds: string[]
): Promise<number> {
  const result = await this.updateMany(
    { merchantId, alertId: { $in: alertIds } },
    { $set: { isRead: true } }
  );
  return result.modifiedCount;
};

// Static method to mark alerts as resolved
CostAlertSchema.statics.markAsResolved = async function (
  merchantId: string,
  alertIds: string[]
): Promise<number> {
  const result = await this.updateMany(
    { merchantId, alertId: { $in: alertIds } },
    { $set: { isResolved: true, resolvedAt: new Date() } }
  );
  return result.modifiedCount;
};

// Static method to get alert summary by type
CostAlertSchema.statics.getAlertSummary = async function (
  merchantId: string
): Promise<Record<string, { total: number; unread: number; critical: number }>> {
  const alerts = await this.find({ merchantId, isResolved: false }).exec();

  const summary: Record<string, { total: number; unread: number; critical: number }> = {};

  for (const alert of alerts) {
    const type = alert.alertType;
    if (!summary[type]) {
      summary[type] = { total: 0, unread: 0, critical: 0 };
    }
    summary[type].total++;
    if (!alert.isRead) summary[type].unread++;
    if (alert.severity === 'critical') summary[type].critical++;
  }

  return summary;
};

export const CostAlertModel: Model<ICostAlertDocument> = mongoose.model<ICostAlertDocument>('CostAlert', CostAlertSchema);
