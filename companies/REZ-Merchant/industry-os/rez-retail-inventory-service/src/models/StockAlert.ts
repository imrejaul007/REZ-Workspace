import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AlertType, AlertSeverity, AlertStatus } from '../types';

export interface IStockAlert {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  alertType: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  currentStock: number;
  threshold: number;
  message: string;
  suggestedAction?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStockAlertDocument extends Omit<IStockAlert, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const StockAlertSchema = new Schema<IStockAlertDocument>({
  id: { type: String, default: () => uuidv4(), unique: true, index: true },
  productId: { type: String, required: true, index: true },
  sku: { type: String, required: true },
  productName: { type: String, required: true },
  alertType: {
    type: String,
    enum: Object.values(AlertType),
    required: true,
  },
  severity: {
    type: String,
    enum: Object.values(AlertSeverity),
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(AlertStatus),
    default: AlertStatus.ACTIVE,
    index: true,
  },
  currentStock: { type: Number, required: true, min: 0 },
  threshold: { type: Number, required: true, min: 0 },
  message: { type: String, required: true },
  suggestedAction: { type: String },
  acknowledgedBy: { type: String },
  acknowledgedAt: { type: Date },
  resolvedBy: { type: String },
  resolvedAt: { type: Date },
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
StockAlertSchema.index({ productId: 1, alertType: 1, status: 1 });
StockAlertSchema.index({ severity: 1, status: 1 });
StockAlertSchema.index({ createdAt: -1 });

// Pre-save to set severity based on alert type
StockAlertSchema.pre('save', function (next) {
  if (this.alertType === AlertType.OUT_OF_STOCK) {
    this.severity = AlertSeverity.CRITICAL;
  } else if (this.alertType === AlertType.LOW_STOCK) {
    this.severity = AlertSeverity.WARNING;
  }
  next();
});

// Static method to get active alerts
StockAlertSchema.statics.getActiveAlerts = function (severity?: AlertSeverity) {
  const query: Record<string, unknown> = { status: AlertStatus.ACTIVE };
  if (severity) {
    query.severity = severity;
  }
  return this.find(query).sort({ severity: -1, createdAt: -1 });
};

export const StockAlert = mongoose.model<IStockAlertDocument>('StockAlert', StockAlertSchema);

export default StockAlert;
