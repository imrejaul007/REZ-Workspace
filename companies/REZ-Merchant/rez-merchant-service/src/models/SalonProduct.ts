import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Salon Product Inventory Model
 *
 * Manages salon-specific product inventory including:
 * - Stock tracking (shampoo, conditioner, styling products, etc.)
 * - Low stock alerts and reordering
 * - Expiry date management
 * - Usage recording for staff accountability
 */

export type ProductCategory =
  | 'shampoo'
  | 'conditioner'
  | 'styling'
  | 'treatment'
  | 'skincare'
  | 'other';

export type ProductStatus = 'active' | 'low_stock' | 'out_of_stock';

export interface ISalonProduct extends Document {
  storeId: Types.ObjectId;
  name: string;
  brand: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
  reorderPoint: number;
  cost: number;
  price: number;
  supplier: string;
  expiryDate?: Date;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SalonProductSchema = new Schema<ISalonProduct>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['shampoo', 'conditioner', 'styling', 'treatment', 'skincare', 'other'],
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      default: 'units',
    },
    reorderPoint: {
      type: Number,
      required: true,
      min: 0,
      default: 10,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    supplier: {
      type: String,
      required: true,
      trim: true,
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'low_stock', 'out_of_stock'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
  },
);

// Compound indexes for efficient queries
SalonProductSchema.index({ storeId: 1, status: 1 });
SalonProductSchema.index({ storeId: 1, category: 1 });
SalonProductSchema.index({ storeId: 1, expiryDate: 1 });

/**
 * Auto-update status based on quantity
 */
SalonProductSchema.pre('save', function (next) {
  if (this.quantity <= 0) {
    this.status = 'out_of_stock';
  } else if (this.quantity <= this.reorderPoint) {
    this.status = 'low_stock';
  } else {
    this.status = 'active';
  }
  next();
});

/**
 * Auto-update status on findOneAndUpdate
 */
SalonProductSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as Partial<ISalonProduct>;

  if (update && update.quantity !== undefined) {
    if (update.quantity <= 0) {
      this.set({ status: 'out_of_stock' });
    } else if (update.reorderPoint !== undefined && update.quantity <= update.reorderPoint) {
      this.set({ status: 'low_stock' });
    } else if (update.quantity <= (update.reorderPoint ?? 10)) {
      this.set({ status: 'low_stock' });
    } else {
      this.set({ status: 'active' });
    }
  }

  next();
});

export const SalonProduct = mongoose.model<ISalonProduct>('SalonProduct', SalonProductSchema);
