import mongoose, { Schema, Document } from 'mongoose';

export interface IShopAnalytics extends Document {
  id: string;
  date: Date;
  productViews: number;
  productClicks: number;
  addToCartCount: number;
  checkoutInitiated: number;
  checkoutCompleted: number;
  revenue: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Array<{
    productId: string;
    views: number;
    orders: number;
    revenue: number;
  }>;
  sourceBreakdown: {
    organic: number;
    paid: number;
    influencer: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TopProductSchema = new Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    orders: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const SourceBreakdownSchema = new Schema(
  {
    organic: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    influencer: { type: Number, default: 0 },
  },
  { _id: false }
);

const ShopAnalyticsSchema = new Schema<IShopAnalytics>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    productViews: {
      type: Number,
      default: 0,
    },
    productClicks: {
      type: Number,
      default: 0,
    },
    addToCartCount: {
      type: Number,
      default: 0,
    },
    checkoutInitiated: {
      type: Number,
      default: 0,
    },
    checkoutCompleted: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    averageOrderValue: {
      type: Number,
      default: 0,
    },
    conversionRate: {
      type: Number,
      default: 0,
    },
    topProducts: {
      type: [TopProductSchema],
      default: [],
    },
    sourceBreakdown: {
      type: SourceBreakdownSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString();
        ret._id = undefined;
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

ShopAnalyticsSchema.index({ date: -1 });

export const ShopAnalytics = mongoose.model<IShopAnalytics>('ShopAnalytics', ShopAnalyticsSchema);
