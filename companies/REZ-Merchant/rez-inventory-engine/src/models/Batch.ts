import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBatch extends Document {
  _id: Types.ObjectId;
  skuId: Types.ObjectId;
  batchNumber: string;
  quantity: number;
  reservedQuantity: number;
  manufacturingDate: Date;
  expiryDate: Date;
  costPrice: number;
  supplierId?: string;
  location?: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    skuId: {
      type: Schema.Types.ObjectId,
      ref: 'SKU',
      required: [true, 'SKU ID is required'],
      index: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
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
    manufacturingDate: {
      type: Date,
      required: [true, 'Manufacturing date is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    supplierId: {
      type: String,
      index: true,
    },
    location: {
      type: String,
      trim: true,
    },
    isExpired: {
      type: Boolean,
      default: function (this: IBatch) {
        return new Date() > this.expiryDate;
      },
      index: true,
    },
    isExpiringSoon: {
      type: Boolean,
      default: function (this: IBatch) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return new Date() < this.expiryDate && this.expiryDate <= thirtyDaysFromNow;
      },
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
BatchSchema.index({ skuId: 1, batchNumber: 1 }, { unique: true });
BatchSchema.index({ skuId: 1, expiryDate: 1 });
BatchSchema.index({ expiryDate: 1, isExpired: 1 });
BatchSchema.index({ isExpiringSoon: 1, isExpired: 1 });

// Virtual for days until expiry
BatchSchema.virtual('daysUntilExpiry').get(function () {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included in JSON
BatchSchema.set('toJSON', { virtuals: true });
BatchSchema.set('toObject', { virtuals: true });

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);
