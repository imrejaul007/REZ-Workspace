import mongoose, { Schema, Document, Model } from 'mongoose';
import { Supplier, SupplierCategory, SupplierStatus } from '../types';

export interface ISupplierDocument extends Omit<Supplier, 'createdAt' | 'updatedAt'>, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    supplierId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
      index: true,
    },
    category: {
      type: String,
      enum: ['groceries', 'beverages', 'dairy', 'meat', 'produce', 'bakery', 'frozen', 'packaged', 'household', 'personal_care', 'other'] as SupplierCategory[],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending_verification'] as SupplierStatus[],
      default: 'pending_verification',
      index: true,
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'India' },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    taxId: String,
    paymentTerms: {
      type: String,
      enum: ['immediate', 'net15', 'net30', 'net60', 'net90'],
      default: 'net30',
    },
    minimumOrderValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    leadTimeDays: {
      type: Number,
      min: 0,
      default: 1,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalOrders: {
      type: Number,
      min: 0,
      default: 0,
    },
    onTimeDeliveryRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'suppliers',
  }
);

// Indexes for efficient queries
SupplierSchema.index({ category: 1, status: 1 });
SupplierSchema.index({ 'address.city': 1, 'address.state': 1 });
SupplierSchema.index({ rating: -1 });
SupplierSchema.index({ onTimeDeliveryRate: -1 });

// Virtual for full address
SupplierSchema.virtual('fullAddress').get(function () {
  const parts = [
    this.address?.street,
    this.address?.city,
    this.address?.state,
    this.address?.postalCode,
    this.address?.country,
  ].filter(Boolean);
  return parts.join(', ');
});

// Method to update rating based on recent orders
SupplierSchema.methods.updateRating = async function (newRating: number, totalReviews: number): Promise<void> {
  const currentTotal = this.rating * this.totalOrders;
  this.rating = (currentTotal + newRating) / (this.totalOrders + totalReviews);
  this.totalOrders += totalReviews;
  await this.save();
};

// Static method to find active suppliers by category
SupplierSchema.statics.findActiveByCategory = function (category: SupplierCategory): Promise<ISupplierDocument[]> {
  return this.find({ category, status: 'active' }).sort({ rating: -1 }).exec();
};

// Static method to find suppliers by merchant mapping
SupplierSchema.statics.findByMerchantId = function (merchantId: string): Promise<ISupplierDocument[]> {
  return this.aggregate([
    {
      $lookup: {
        from: 'merchantsuppliermappings',
        localField: 'supplierId',
        foreignField: 'supplierId',
        as: 'mappings',
      },
    },
    {
      $match: {
        'mappings.merchantId': merchantId,
        'mappings.status': 'active',
      },
    },
    {
      $sort: { rating: -1 },
    },
  ]);
};

export const SupplierModel: Model<ISupplierDocument> = mongoose.model<ISupplierDocument>('Supplier', SupplierSchema);
