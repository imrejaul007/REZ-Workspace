import mongoose, { Schema, Document } from 'mongoose';
import { ConversionType, AttributionModel } from '../types.js';

// Attribution Touchpoint Subdocument
export interface IAttributionTouchpoint {
  signalId: string;
  source: string;
  eventType: string;
  category: string;
  position: number;
  lagDays: number;
  attributionCredit: number;
  attributionValue: number;
}

// Conversion Document Interface
export interface IConversion extends Document {
  conversionId: string;
  userId: string;
  conversionType: ConversionType;
  conversionValue: number;
  currency: string;
  category: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  attributedSignals: IAttributionTouchpoint[];
  model: AttributionModel;
  createdAt: Date;
  updatedAt: Date;
}

// Attribution Touchpoint Schema
const AttributionTouchpointSchema = new Schema<IAttributionTouchpoint>(
  {
    signalId: { type: String, required: true, index: true },
    source: { type: String, required: true, index: true },
    eventType: { type: String, required: true },
    category: { type: String, required: true, index: true },
    position: { type: Number, required: true },
    lagDays: { type: Number, required: true, default: 0 },
    attributionCredit: { type: Number, required: true, min: 0, max: 1 },
    attributionValue: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

// Conversion Schema
const ConversionSchema = new Schema<IConversion>(
  {
    conversionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    conversionType: {
      type: String,
      required: true,
      enum: Object.values(ConversionType),
      index: true
    },
    conversionValue: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      maxlength: 3
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    orderId: {
      type: String,
      sparse: true,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    attributedSignals: {
      type: [AttributionTouchpointSchema],
      default: []
    },
    model: {
      type: String,
      required: true,
      enum: Object.values(AttributionModel),
      default: AttributionModel.TIME_DECAY
    }
  },
  {
    timestamps: true,
    collection: 'conversions'
  }
);

// Compound indexes for common queries
ConversionSchema.index({ userId: 1, timestamp: -1 });
ConversionSchema.index({ category: 1, timestamp: -1 });
ConversionSchema.index({ conversionType: 1, timestamp: -1 });
ConversionSchema.index({ createdAt: -1 });

// Static methods
ConversionSchema.statics.findByUserId = function(userId: string, limit = 50, skip = 0) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

ConversionSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 }).lean();
};

ConversionSchema.statics.findByCategory = function(category: string, limit = 100) {
  return this.find({ category })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Instance methods
ConversionSchema.methods.getTotalAttributionValue = function(): number {
  return this.attributedSignals.reduce((sum, signal) => sum + signal.attributionValue, 0);
};

ConversionSchema.methods.getAverageLag = function(): number {
  if (this.attributedSignals.length === 0) return 0;
  const totalLag = this.attributedSignals.reduce((sum, signal) => sum + signal.lagDays, 0);
  return totalLag / this.attributedSignals.length;
};

export const Conversion = mongoose.model<IConversion>('Conversion', ConversionSchema);
export default Conversion;