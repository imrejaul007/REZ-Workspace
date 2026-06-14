import mongoose, { Document, Schema } from 'mongoose';

// Enums for Alert Types
export enum AlertType {
  LOW_STOCK = 'LOW_STOCK',
  EXPIRING = 'EXPIRING',
  EXPIRED = 'EXPIRED',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

// Enums for Alert Severity
export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Inventory Alert Interface
export interface IInventoryAlert extends Document {
  alertId: string;
  merchantId: string;
  productId: string;
  productName: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  currentStock?: number;
  reorderLevel?: number;
  expiryDate?: Date;
  daysUntilExpiry?: number;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Inventory Alert Schema
const InventoryAlertSchema = new Schema<IInventoryAlert>({
  alertId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  merchantId: {
    type: String,
    required: true,
    index: true
  },
  productId: {
    type: String,
    required: true,
    index: true
  },
  productName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: AlertType,
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: AlertSeverity,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  currentStock: {
    type: Number
  },
  reorderLevel: {
    type: Number
  },
  expiryDate: {
    type: Date
  },
  daysUntilExpiry: {
    type: Number
  },
  isResolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: String
  },
  resolutionNotes: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'inventory_alerts'
});

// Compound Indexes for common queries
InventoryAlertSchema.index({ merchantId: 1, type: 1, isResolved: 1 });
InventoryAlertSchema.index({ merchantId: 1, severity: 1, isResolved: 1 });
InventoryAlertSchema.index({ productId: 1, type: 1 });
InventoryAlertSchema.index({ createdAt: -1 });

// Static method to resolve alert
InventoryAlertSchema.statics.resolveAlert = async function(
  alertId: string,
  resolvedBy: string,
  notes?: string
): Promise<IInventoryAlert | null> {
  return this.findOneAndUpdate(
    { alertId },
    {
      $set: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        resolutionNotes: notes
      }
    },
    { new: true }
  );
};

// Static method to get unresolved alerts by merchant
InventoryAlertSchema.statics.getUnresolvedByMerchant = async function(
  merchantId: string,
  type?: AlertType
): Promise<IInventoryAlert[]> {
  const filter: { merchantId: string; isResolved: boolean; type?: AlertType } = {
    merchantId,
    isResolved: false
  };
  if (type) filter.type = type;

  return this.find(filter).sort({ severity: -1, createdAt: -1 });
};

// Static method to check for existing unresolved alert
InventoryAlertSchema.statics.hasUnresolvedAlert = async function(
  productId: string,
  type: AlertType
): Promise<boolean> {
  const count = await this.countDocuments({
    productId,
    type,
    isResolved: false
  });
  return count > 0;
};

// Static method to clean up resolved alerts older than X days
InventoryAlertSchema.statics.cleanupOldResolved = async function(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    isResolved: true,
    resolvedAt: { $lt: cutoffDate }
  });

  return result.deletedCount || 0;
};

export const InventoryAlert = mongoose.model<IInventoryAlert>('InventoryAlert', InventoryAlertSchema);