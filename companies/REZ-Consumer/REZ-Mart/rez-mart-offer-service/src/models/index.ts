import mongoose, { Schema, Document, Model } from 'mongoose';

export type OfferType = 'percentage' | 'flat' | 'free_delivery' | 'buy_x_get_y';
export type OfferStatus = 'active' | 'inactive' | 'expired';

export interface IOffer extends Document {
  offerId: string;
  code: string;
  type: OfferType;
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  maxUses?: number;
  usedCount: number;
  userId?: string;
  storeId?: string;
  validFrom: Date;
  validUntil: Date;
  status: OfferStatus;
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
  isValid(): boolean;
  calculateDiscount(orderValue: number): number;
}

// Extend static methods interface
interface IOfferModel extends Model<IOffer> {
  findValidOffers(filters?: {
    storeId?: string;
    userId?: string;
    orderValue?: number;
  }): Promise<IOffer[]>;
}

const OfferSchema = new Schema<IOffer>(
  {
    offerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['percentage', 'flat', 'free_delivery', 'buy_x_get_y'],
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: undefined,
      min: 0,
    },
    maxUses: {
      type: Number,
      default: undefined,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    userId: {
      type: String,
      default: undefined,
      index: true,
    },
    storeId: {
      type: String,
      default: undefined,
      index: true,
    },
    validFrom: {
      type: Date,
      required: true,
      index: true,
    },
    validUntil: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive', 'expired'],
      default: 'active',
      index: true,
    },
    terms: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: 'offers',
  }
);

// Compound indexes for common queries
OfferSchema.index({ status: 1, validFrom: 1, validUntil: 1 });
OfferSchema.index({ storeId: 1, status: 1 });
OfferSchema.index({ userId: 1, status: 1 });

// Pre-save middleware to auto-expire offers
OfferSchema.pre('find', function () {
  // Auto-expire offers based on validUntil date
});

// Instance method to check if offer is valid
OfferSchema.methods.isValid = function (): boolean {
  const now = new Date();
  return (
    this.status === 'active' &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.maxUses === undefined || this.usedCount < this.maxUses)
  );
};

// Instance method to calculate discount
OfferSchema.methods.calculateDiscount = function (orderValue: number): number {
  if (!this.isValid() || orderValue < this.minOrderValue) {
    return 0;
  }

  let discount = 0;

  switch (this.type) {
    case 'percentage':
      discount = (orderValue * this.value) / 100;
      break;
    case 'flat':
      discount = this.value;
      break;
    case 'free_delivery':
      // Free delivery is handled differently - returns a flag
      discount = 0;
      break;
    case 'buy_x_get_y':
      // Buy X Get Y is handled differently
      discount = 0;
      break;
  }

  // Apply max discount cap if set
  if (this.maxDiscount && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }

  // Don't exceed order value
  return Math.min(discount, orderValue);
};

// Static method to find valid offers
OfferSchema.statics.findValidOffers = function (filters?: {
  storeId?: string;
  userId?: string;
  orderValue?: number;
}) {
  const now = new Date();
  const query: Record<string, unknown> = {
    status: 'active',
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    $or: [{ maxUses: undefined }, { $expr: { $lt: ['$usedCount', '$maxUses'] } }],
  };

  if (filters?.storeId) {
    query.storeId = filters.storeId;
  }

  if (filters?.userId) {
    query.$or = [
      { userId: undefined },
      { userId: filters.userId },
    ];
  }

  return this.find(query);
};

export const Offer = mongoose.model<IOffer, IOfferModel>('Offer', OfferSchema);
export default Offer;