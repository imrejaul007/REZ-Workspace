import mongoose, { Document, Schema, Types } from 'mongoose';

export type UnitType = 'piece' | 'kg' | 'litre' | 'meter';
export type SKUStatus = 'active' | 'inactive' | 'discontinued';

export interface ISKU extends Document {
  _id: Types.ObjectId;
  merchantId: string;
  storeId: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  hsnCode: string;
  mrp: number;
  costPrice: number;
  sellingPrice: number;
  margin: number;
  taxRate: number;
  unit: UnitType;
  variant?: string;
  images: string[];
  minStock: number;
  maxStock?: number;
  reorderPoint: number;
  supplierId?: string;
  status: SKUStatus;
  // Expiry tracking configuration
  trackExpiry?: boolean; // whether to track expiry for this SKU
  shelfLife?: number; // expected shelf life in days
  minStockAlert?: number; // alert threshold for low stock
  createdAt: Date;
  updatedAt: Date;
}

const SKUSchema = new Schema<ISKU>(
  {
    merchantId: {
      type: String,
      required: [true, 'Merchant ID is required'],
      index: true,
    },
    storeId: {
      type: String,
      required: [true, 'Store ID is required'],
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true,
    },
    subcategory: {
      type: String,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      index: true,
    },
    hsnCode: {
      type: String,
      required: [true, 'HSN code is required'],
      trim: true,
    },
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: [0, 'MRP cannot be negative'],
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    margin: {
      type: Number,
      default: function () {
        if (this.costPrice > 0) {
          return ((this.sellingPrice - this.costPrice) / this.costPrice) * 100;
        }
        return 0;
      },
    },
    taxRate: {
      type: Number,
      required: [true, 'Tax rate is required'],
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },
    unit: {
      type: String,
      enum: {
        values: ['piece', 'kg', 'litre', 'meter'],
        message: 'Unit must be piece, kg, litre, or meter',
      },
      required: [true, 'Unit is required'],
    },
    variant: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    minStock: {
      type: Number,
      required: [true, 'Minimum stock level is required'],
      min: [0, 'Minimum stock cannot be negative'],
      default: 5,
    },
    maxStock: {
      type: Number,
      min: [0, 'Maximum stock cannot be negative'],
    },
    reorderPoint: {
      type: Number,
      required: [true, 'Reorder point is required'],
      min: [0, 'Reorder point cannot be negative'],
    },
    supplierId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'discontinued'],
        message: 'Status must be active, inactive, or discontinued',
      },
      default: 'active',
      index: true,
    },
    // Expiry tracking configuration
    trackExpiry: {
      type: Boolean,
      default: false,
    },
    shelfLife: {
      type: Number,
      min: [0, 'Shelf life cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Shelf life must be a whole number of days',
      },
    },
    minStockAlert: {
      type: Number,
      min: [0, 'Minimum stock alert cannot be negative'],
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

// Compound indexes for common queries
SKUSchema.index({ merchantId: 1, storeId: 1 });
SKUSchema.index({ merchantId: 1, category: 1, status: 1 });
SKUSchema.index({ merchantId: 1, brand: 1, status: 1 });
SKUSchema.index({ storeId: 1, category: 1, status: 1 });
SKUSchema.index({ trackExpiry: 1, shelfLife: 1 });

// Text index for search
SKUSchema.index({
  name: 'text',
  description: 'text',
  sku: 'text',
  brand: 'text',
});

export const SKU = mongoose.model<ISKU>('SKU', SKUSchema);
