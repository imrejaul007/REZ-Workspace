import mongoose, { Schema, Document } from 'mongoose';
import { Product as IProduct, ProductCategory } from '../types';

export interface ProductDocument extends Omit<IProduct, '_id'>, Document {}

const ProductSchema = new Schema<ProductDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      maxlength: 1000
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: ['skincare', 'haircare', 'massage_oil', 'body_lotion', 'cleaning', 'equipment', 'consumable', 'other'],
      index: true
    },
    brand: {
      type: String,
      maxlength: 100
    },
    supplierId: {
      type: String,
      index: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    unit: {
      type: String,
      default: 'pieces',
      maxlength: 20
    },
    minStockLevel: {
      type: Number,
      default: 10,
      min: 0
    },
    maxStockLevel: {
      type: Number,
      default: 100,
      min: 0
    },
    reorderPoint: {
      type: Number,
      default: 20,
      min: 0
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    expiryDate: {
      type: Date
    },
    batchNumber: {
      type: String
    },
    images: [{
      type: String
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ supplierId: 1 });
ProductSchema.index({ quantity: 1 });

ProductSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.reorderPoint;
});

ProductSchema.virtual('isOutOfStock').get(function() {
  return this.quantity === 0;
});

ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

ProductSchema.statics.findLowStock = function() {
  return this.find({
    status: 'active',
    $expr: { $lte: ['$quantity', '$reorderPoint'] }
  });
};

ProductSchema.statics.findOutOfStock = function() {
  return this.find({
    status: 'active',
    quantity: 0
  });
};

ProductSchema.statics.findBySupplier = function(supplierId: string) {
  return this.find({ supplierId, status: 'active' });
};

export const ProductModel = mongoose.model<ProductDocument>('Product', ProductSchema);
