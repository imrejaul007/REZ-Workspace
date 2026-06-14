import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStock extends Document {
  _id: Types.ObjectId;
  skuId: Types.ObjectId;
  storeId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastRestocked: Date;
  lastSold: Date;
  lowStockAlert: boolean;
  warehouseStock?: number;
  // Expiry/Batch tracking fields
  batchNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  batchCostPrice?: number;
  // Computed fields (stored for quick queries)
  isExpiringSoon?: boolean; // true if expiry within 30 days
  isExpired?: boolean; // true if expiryDate < today
  createdAt: Date;
  updatedAt: Date;
}

const StockSchema = new Schema<IStock>(
  {
    skuId: {
      type: Schema.Types.ObjectId,
      ref: 'SKU',
      required: [true, 'SKU ID is required'],
      unique: true,
      index: true,
    },
    storeId: {
      type: String,
      required: [true, 'Store ID is required'],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      min: [0, 'Reserved quantity cannot be negative'],
      default: 0,
    },
    availableQuantity: {
      type: Number,
      min: [0, 'Available quantity cannot be negative'],
      default: function (this: IStock) {
        return this.quantity - this.reservedQuantity;
      },
    },
    lastRestocked: {
      type: Date,
    },
    lastSold: {
      type: Date,
    },
    lowStockAlert: {
      type: Boolean,
      default: false,
      index: true,
    },
    warehouseStock: {
      type: Number,
      min: [0, 'Warehouse stock cannot be negative'],
    },
    // Expiry/Batch tracking fields
    batchNumber: {
      type: String,
      trim: true,
      index: true,
    },
    manufacturingDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
      index: true,
    },
    batchCostPrice: {
      type: Number,
      min: [0, 'Batch cost price cannot be negative'],
    },
    isExpiringSoon: {
      type: Boolean,
      default: false,
      index: true,
    },
    isExpired: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes
StockSchema.index({ storeId: 1, lowStockAlert: 1 });
StockSchema.index({ skuId: 1, storeId: 1 }, { unique: true });
StockSchema.index({ storeId: 1, isExpiringSoon: 1 });
StockSchema.index({ storeId: 1, isExpired: 1 });
StockSchema.index({ expiryDate: 1, isExpired: 1 });

// Virtual for days until expiry
StockSchema.virtual('daysUntilExpiry').get(function (this: IStock) {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included in JSON
StockSchema.set('toJSON', { virtuals: true });
StockSchema.set('toObject', { virtuals: true });

// Pre-save hook to update availableQuantity, lowStockAlert, and expiry flags
StockSchema.pre('save', function (next) {
  this.availableQuantity = this.quantity - this.reservedQuantity;

  // Update expiry computed fields
  if (this.expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(this.expiryDate);
    expiry.setHours(0, 0, 0, 0);

    this.isExpired = expiry < today;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    this.isExpiringSoon = !this.isExpired && expiry <= thirtyDaysFromNow;
  }

  next();
});

export const Stock = mongoose.model<IStock>('Stock', StockSchema);
