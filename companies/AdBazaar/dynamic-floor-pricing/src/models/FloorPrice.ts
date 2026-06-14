import mongoose, { Schema, Document } from 'mongoose';

export interface IFloorPrice extends Document {
  inventoryId: string;
  price: number;
  currency: string;
  type: 'fixed' | 'dynamic' | 'market' | 'competitor' | 'ai_optimized';
  status: 'active' | 'inactive' | 'pending' | 'archived';
  effectiveDate: Date;
  expirationDate?: Date;
  constraints: {
    minPrice?: number;
    maxPrice?: number;
    maxDailyChange?: number;
    timeWindows?: Array<{
      start: string;
      end: string;
      priceModifier?: number;
    }>;
  };
  metadata: {
    createdBy: string;
    updatedBy?: string;
    source: string;
    campaignId?: string;
    advertiserId?: string;
    priority?: number;
  };
  lastOptimized?: Date;
  optimizationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const FloorPriceSchema = new Schema<IFloorPrice>(
  {
    inventoryId: {
      type: String,
      required: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    type: {
      type: String,
      enum: ['fixed', 'dynamic', 'market', 'competitor', 'ai_optimized'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'archived'],
      default: 'pending',
      index: true
    },
    effectiveDate: {
      type: Date,
      required: true,
      index: true
    },
    expirationDate: {
      type: Date,
      index: true
    },
    constraints: {
      minPrice: {
        type: Number,
        min: 0
      },
      maxPrice: {
        type: Number,
        min: 0
      },
      maxDailyChange: {
        type: Number,
        min: 0,
        max: 100
      },
      timeWindows: [
        {
          start: String,
          end: String,
          priceModifier: Number
        }
      ]
    },
    metadata: {
      createdBy: {
        type: String,
        required: true
      },
      updatedBy: String,
      source: {
        type: String,
        default: 'manual'
      },
      campaignId: String,
      advertiserId: String,
      priority: {
        type: Number,
        default: 1
      }
    },
    lastOptimized: Date,
    optimizationCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    collection: 'floor_prices'
  }
);

// Compound indexes
FloorPriceSchema.index({ inventoryId: 1, status: 1 });
FloorPriceSchema.index({ inventoryId: 1, effectiveDate: 1 });
FloorPriceSchema.index({ status: 1, type: 1 });

// Virtual for checking if floor is currently effective
FloorPriceSchema.virtual('isEffective').get(function () {
  const now = new Date();
  const afterStart = this.effectiveDate <= now;
  const beforeEnd = !this.expirationDate || this.expirationDate > now;
  return afterStart && beforeEnd && this.status === 'active';
});

// Ensure virtuals are included in JSON
FloorPriceSchema.set('toJSON', { virtuals: true });
FloorPriceSchema.set('toObject', { virtuals: true });

export const FloorPrice = mongoose.model<IFloorPrice>('FloorPrice', FloorPriceSchema);