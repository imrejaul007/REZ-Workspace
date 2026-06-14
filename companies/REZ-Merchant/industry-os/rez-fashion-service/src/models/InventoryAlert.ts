import mongoose, { Schema, model, Document } from 'mongoose';
import { IInventoryAlert } from '../types';

export interface InventoryAlertDocument extends Omit<IInventoryAlert, '_id'>, Document {}

const inventoryAlertSchema = new Schema<InventoryAlertDocument>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    productId: { type: String, required: true, index: true },
    merchantId: { type: String, required: true, index: true },
    alertType: {
      type: String,
      required: true,
      enum: ['low_stock', 'out_of_stock', 'size_alert', 'reorder'],
      lowercase: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high'],
      lowercase: true,
    },
    productName: { type: String, required: true },
    currentStock: { type: Number, required: true, min: 0 },
    threshold: { type: Number, required: true },
    size: { type: String },
    color: { type: String },
    resolved: { type: Boolean, default: false, index: true },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
    indexes: [
      { keys: { merchantId: 1, resolved: 1 }, name: 'idx_merchant_resolved' },
      { keys: { alertType: 1, severity: 1 }, name: 'idx_type_severity' },
    ],
  }
);

inventoryAlertSchema.pre('save', function (next) {
  if (!this.alertId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.alertId = `IAL-${timestamp}-${randomStr}`;
  }
  next();
});

inventoryAlertSchema.methods.resolve = function () {
  this.resolved = true;
  this.resolvedAt = new Date();
  return this.save();
};

inventoryAlertSchema.statics.getUnresolved = function (merchantId?: string) {
  const query: Record<string, unknown> = { resolved: false };
  if (merchantId) query.merchantId = merchantId;
  return this.find(query).sort({ severity: -1, createdAt: -1 });
};

inventoryAlertSchema.statics.getByProduct = function (productId: string) {
  return this.find({ productId, resolved: false });
};

inventoryAlertSchema.statics.createAlert = async function (
  productId: string,
  merchantId: string,
  productName: string,
  alertType: IInventoryAlert['alertType'],
  currentStock: number,
  threshold: number,
  size?: string,
  color?: string
): Promise<InventoryAlertDocument> {
  // Check if unresolved alert exists
  const existing = await this.findOne({ productId, alertType, resolved: false, size, color });
  if (existing) return existing;

  let severity: 'low' | 'medium' | 'high' = 'low';
  if (currentStock === 0) severity = 'high';
  else if (currentStock <= threshold * 0.5) severity = 'medium';

  const alert = new this({
    productId, merchantId, productName, alertType,
    currentStock, threshold, size, color, severity
  });
  await alert.save();
  return alert;
};

inventoryAlertSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const InventoryAlert = model<InventoryAlertDocument>('InventoryAlert', inventoryAlertSchema);