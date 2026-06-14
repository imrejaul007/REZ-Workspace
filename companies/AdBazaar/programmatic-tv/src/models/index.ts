import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  PrivateDeal,
  BidderSeat,
  FloorPriceRule,
  DealStatus,
  DealType,
  CTVDeviceCategory,
  FloorConditions,
  DealTargeting,
  BidLimits,
  DayPart,
} from '../types/index.js';

// ============================================================================
// Private Deal Schema
// ============================================================================

const DayPartSchema = new Schema<DayPart>(
  {
    daysOfWeek: { type: [Number], required: true },
    startHour: { type: Number, required: true, min: 0, max: 23 },
    endHour: { type: Number, required: true, min: 0, max: 23 },
    timezone: { type: String, default: 'UTC' },
  },
  { _id: false }
);

const DealTargetingSchema = new Schema<DealTargeting>(
  {
    geo: [{ type: String }],
    deviceTypes: [{ type: String, enum: Object.values(CTVDeviceCategory) }],
    contentCategories: [{ type: String }],
    deviceMakes: [{ type: String }],
    deviceModels: [{ type: String }],
    operatingSystems: [{ type: String }],
    userAgeGroups: [{ type: Number }],
    userGenders: [{ type: String }],
    dayParts: [DayPartSchema],
    inventorySources: [{ type: String }],
  },
  { _id: false }
);

const PrivateDealSchema = new Schema<PrivateDeal>(
  {
    dealId: {
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
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    advertiserId: {
      type: String,
      required: true,
      index: true,
    },
    advertiserName: {
      type: String,
      trim: true,
    },
    publisherId: {
      type: String,
      required: true,
      index: true,
    },
    publisherName: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(DealType),
      index: true,
    },
    floorPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    priceCurrency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    targeting: {
      type: DealTargetingSchema,
      default: {},
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(DealStatus),
      default: DealStatus.ACTIVE,
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
    },
    impressionsLimit: {
      type: Number,
    },
    impressionsDelivered: {
      type: Number,
      default: 0,
    },
    budgetLimit: {
      type: Number,
    },
    budgetSpent: {
      type: Number,
      default: 0,
    },
    dealAttributes: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: 'private_deals',
  }
);

// Compound indexes
PrivateDealSchema.index({ startDate: 1, endDate: 1 });
PrivateDealSchema.index({ advertiserId: 1, status: 1 });
PrivateDealSchema.index({ publisherId: 1, status: 1 });
PrivateDealSchema.index({ status: 1, type: 1 });

// Virtual for checking if deal is currently valid
PrivateDealSchema.virtual('isValid').get(function (this: PrivateDeal & Document) {
  const now = new Date();
  return (
    this.status === DealStatus.ACTIVE &&
    this.startDate <= now &&
    this.endDate >= now
  );
});

// Ensure virtuals are serialized
PrivateDealSchema.set('toJSON', { virtuals: true });
PrivateDealSchema.set('toObject', { virtuals: true });

// ============================================================================
// Bidder Seat Schema
// ============================================================================

const BidLimitsSchema = new Schema<BidLimits>(
  {
    dailyBudget: { type: Number },
    monthlyBudget: { type: Number },
    perBidMax: { type: Number },
    dailyImpressions: { type: Number },
  },
  { _id: false }
);

const BidderSeatSchema = new Schema<BidderSeat>(
  {
    seatId: {
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
    },
    advertiserId: {
      type: String,
      required: true,
      index: true,
    },
    organizationName: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'suspended', 'inactive'],
      default: 'active',
      index: true,
    },
    allowedFormats: {
      type: [String],
      default: ['video', 'display'],
    },
    allowedCategories: {
      type: [String],
      default: [],
    },
    bidLimits: {
      type: BidLimitsSchema,
    },
    sspConnections: {
      type: [String],
      default: [],
    },
    lastActivityAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: 'bidder_seats',
  }
);

// Compound indexes
BidderSeatSchema.index({ advertiserId: 1, status: 1 });
BidderSeatSchema.index({ status: 1, createdAt: -1 });

// ============================================================================
// Floor Price Rule Schema
// ============================================================================

const FloorConditionsSchema = new Schema<FloorConditions>(
  {
    geo: [{ type: String }],
    deviceTypes: [{ type: String, enum: Object.values(CTVDeviceCategory) }],
    contentCategories: [{ type: String }],
    appBundles: [{ type: String }],
    formats: [{ type: String }],
    connectionTypes: [{ type: Number }],
    timeOfDay: {
      startHour: { type: Number, min: 0, max: 23 },
      endHour: { type: Number, min: 0, max: 23 },
      daysOfWeek: [{ type: Number, min: 0, max: 6 }],
    },
    dealTypes: [{ type: String, enum: Object.values(DealType) }],
  },
  { _id: false }
);

const FloorPriceRuleSchema = new Schema<FloorPriceRule>(
  {
    ruleId: {
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
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    priority: {
      type: Number,
      required: true,
      default: 0,
    },
    conditions: {
      type: FloorConditionsSchema,
      required: true,
    },
    floorPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'paused', 'deleted'],
      default: 'active',
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'floor_price_rules',
  }
);

// Compound indexes
FloorPriceRuleSchema.index({ priority: -1 });
FloorPriceRuleSchema.index({ status: 1, priority: -1 });

// ============================================================================
// Export Models
// ============================================================================

export interface IPrivateDealDocument extends PrivateDeal, Document {}

export const PrivateDealModel: Model<IPrivateDealDocument> = mongoose.model<IPrivateDealDocument>(
  'PrivateDeal',
  PrivateDealSchema
);

export interface IBidderSeatDocument extends BidderSeat, Document {}

export const BidderSeatModel: Model<IBidderSeatDocument> = mongoose.model<IBidderSeatDocument>(
  'BidderSeat',
  BidderSeatSchema
);

export interface IFloorPriceRuleDocument extends FloorPriceRule, Document {}

export const FloorPriceRuleModel: Model<IFloorPriceRuleDocument> = mongoose.model<IFloorPriceRuleDocument>(
  'FloorPriceRule',
  FloorPriceRuleSchema
);

// Export schemas for validation
export { PrivateDealSchema, BidderSeatSchema, FloorPriceRuleSchema };