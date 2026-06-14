import mongoose, { Schema, Model } from 'mongoose';
import {
  IProduct,
  IProductDocument,
  ProductStatus,
} from '../types';

const ProductSchema = new Schema<IProduct>(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Creator',
      required: [true, 'Creator ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    commission: {
      type: Number,
      required: [true, 'Commission rate is required'],
      min: [0, 'Commission cannot be negative'],
      max: [100, 'Commission cannot exceed 100%'],
    },
    commissionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    inventory: {
      type: Number,
      default: 0,
      min: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    images: [{
      type: String,
    }],
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
ProductSchema.index({ creatorId: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ soldCount: -1 });
ProductSchema.index({ creatorId: 1, status: 1 });

// Pre-save middleware to calculate commission amount
ProductSchema.pre('save', function (next) {
  this.commissionAmount = (this.price * this.commission) / 100;
  next();
});

// Pre-findOneAndUpdate middleware
ProductSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const update = this.getUpdate() as Record<string, unknown>;
  if (update.price !== undefined || update.commission !== undefined) {
    const price = update.price as number ?? (this as unknown as IProduct).price;
    const commission = update.commission as number ?? (this as unknown as IProduct).commission;
    update.commissionAmount = (price * commission) / 100;
  }
  next();
});

// Static methods
ProductSchema.statics.findByCreator = function (creatorId: string) {
  return this.find({ creatorId }).sort({ createdAt: -1 });
};

ProductSchema.statics.findActiveByCreator = function (creatorId: string) {
  return this.find({
    creatorId,
    status: ProductStatus.ACTIVE,
  }).sort({ createdAt: -1 });
};

ProductSchema.statics.findByCategory = function (category: string) {
  return this.find({
    category: category.toLowerCase(),
    status: ProductStatus.ACTIVE,
  }).sort({ soldCount: -1 });
};

ProductSchema.statics.findFeatured = function (limit: number = 10) {
  return this.find({ status: ProductStatus.ACTIVE })
    .sort({ soldCount: -1, rating: -1 })
    .limit(limit);
};

// Instance method to update inventory
ProductSchema.methods.decrementInventory = async function (quantity: number = 1) {
  if (this.inventory < quantity) {
    throw new Error('Insufficient inventory');
  }
  this.inventory -= quantity;
  this.soldCount += quantity;

  // Auto-update status if sold out
  if (this.inventory === 0) {
    this.status = ProductStatus.SOLD_OUT;
  }

  return this.save();
};

// Instance method to increment inventory
ProductSchema.methods.incrementInventory = async function (quantity: number = 1) {
  this.inventory += quantity;

  // Update status if was sold out
  if (this.status === ProductStatus.SOLD_OUT && this.inventory > 0) {
    this.status = ProductStatus.ACTIVE;
  }

  return this.save();
};

// Instance method to calculate net earnings
ProductSchema.methods.calculateNetEarnings = function (quantity: number = 1) {
  const grossEarnings = this.price * quantity;
  const commission = (grossEarnings * this.commission) / 100;
  return grossEarnings - commission;
};

export const Product: Model<IProductDocument> = mongoose.model<IProductDocument>(
  'Product',
  ProductSchema
);

export default Product;