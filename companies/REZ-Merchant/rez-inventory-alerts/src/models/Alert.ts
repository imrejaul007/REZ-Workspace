import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAlert extends Document {
  merchantId: Types.ObjectId;
  productId: Types.ObjectId;
  productName: string;
  productSku: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring' | 'expired' | 'price_change' | 'demand_spike';
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  message: string;
  currentValue: number;
  threshold: number;
  previousValue?: number;
  notificationSent: boolean;
  notificationChannels: ('sms' | 'email' | 'push' | 'webhook')[];
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAlertRule extends Document {
  merchantId: Types.ObjectId;
  name: string;
  type: IAlert['type'];
  severity: IAlert['severity'];
  conditions: {
    field: 'stock' | 'expiry_days' | 'price' | 'demand';
    operator: 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
    value: number;
  }[];
  notificationChannels: ('sms' | 'email' | 'push' | 'webhook')[];
  webhookUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  productName: { type: String, required: true },
  productSku: { type: String, required: true },
  type: { type: String, enum: ['low_stock', 'out_of_stock', 'overstock', 'expiring', 'expired', 'price_change', 'demand_spike'], required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical', 'emergency'], required: true },
  message: { type: String, required: true },
  currentValue: { type: Number, required: true },
  threshold: { type: Number, required: true },
  previousValue: Number,
  notificationSent: { type: Boolean, default: false },
  notificationChannels: [{ type: String, enum: ['sms', 'email', 'push', 'webhook'] }],
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: String,
  acknowledgedAt: Date,
  resolved: { type: Boolean, default: false },
  resolvedAt: Date,
  resolvedBy: String,
}, { timestamps: true });

AlertSchema.index({ merchantId: 1, type: 1, resolved: 1 });
AlertSchema.index({ merchantId: 1, severity: 1 });
AlertSchema.index({ createdAt: -1 });

const AlertRuleSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['low_stock', 'out_of_stock', 'overstock', 'expiring', 'expired', 'price_change', 'demand_spike'], required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical', 'emergency'], required: true },
  conditions: [{
    field: { type: String, enum: ['stock', 'expiry_days', 'price', 'demand'], required: true },
    operator: { type: String, enum: ['lt', 'gt', 'eq', 'lte', 'gte'], required: true },
    value: { type: Number, required: true },
  }],
  notificationChannels: [{ type: String, enum: ['sms', 'email', 'push', 'webhook'] }],
  webhookUrl: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

AlertRuleSchema.index({ merchantId: 1, isActive: 1 });

export const Alert = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
export const AlertRule = mongoose.models.AlertRule || mongoose.model<IAlertRule>('AlertRule', AlertRuleSchema);
