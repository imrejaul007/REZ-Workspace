import mongoose, { Schema, Document } from 'mongoose';

export type AlertType = 'low_stock' | 'expiry_warning' | 'expiry_critical' | 'reorder' | 'out_of_stock';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface IStockAlert extends Document {
  alertId: string;
  product: mongoose.Types.ObjectId;
  salonId: string;
  alertType: AlertType;
  status: AlertStatus;
  currentStock: number;
  threshold: number;
  message: string;
  suggestedAction?: string;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockAlertSchema = new Schema<IStockAlert>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    salonId: { type: String, required: true, index: true },
    alertType: {
      type: String,
      enum: ['low_stock', 'expiry_warning', 'expiry_critical', 'reorder', 'out_of_stock'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
      default: 'active',
      index: true
    },
    currentStock: { type: Number, required: true },
    threshold: { type: Number, required: true },
    message: { type: String, required: true },
    suggestedAction: { type: String },
    acknowledgedAt: { type: Date },
    acknowledgedBy: { type: String },
    resolvedAt: { type: Date },
    resolvedBy: { type: String }
  },
  { timestamps: true }
);

StockAlertSchema.index({ salonId: 1, status: 1, alertType: 1 });
StockAlertSchema.index({ product: 1, status: 1 });
StockAlertSchema.index({ createdAt: -1 });

export const StockAlert = mongoose.model<IStockAlert>('StockAlert', StockAlertSchema);
