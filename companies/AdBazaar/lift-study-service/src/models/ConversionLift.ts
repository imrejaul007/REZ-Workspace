import mongoose, { Document, Schema } from 'mongoose';

export interface IConversionLift extends Document {
  _id: mongoose.Types.ObjectId;
  studyId: mongoose.Types.ObjectId;
  treatmentGroup: boolean;
  userId?: string;
  sessionId?: string;
  metrics: {
    conversions?: number;
    conversionValue?: number;
    revenue?: number;
    visits?: number;
    engagementTime?: number;
    pageViews?: number;
    addToCart?: number;
    checkoutStarted?: number;
    purchases?: number;
    purchaseValue?: number;
  };
  metadata?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversionLiftSchema = new Schema<IConversionLift>(
  {
    studyId: { type: Schema.Types.ObjectId, ref: 'LiftStudy', required: true, index: true },
    treatmentGroup: { type: Boolean, required: true, index: true },
    userId: { type: String, index: true },
    sessionId: { type: String, index: true },
    metrics: {
      conversions: { type: Number, default: 0 },
      conversionValue: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      visits: { type: Number, default: 0 },
      engagementTime: { type: Number, default: 0 },
      pageViews: { type: Number, default: 0 },
      addToCart: { type: Number, default: 0 },
      checkoutStarted: { type: Number, default: 0 },
      purchases: { type: Number, default: 0 },
      purchaseValue: { type: Number, default: 0 }
    },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: true
  }
);

// Indexes for aggregation queries
ConversionLiftSchema.index({ studyId: 1, treatmentGroup: 1, timestamp: 1 });
ConversionLiftSchema.index({ studyId: 1, userId: 1 });
ConversionLiftSchema.index({ studyId: 1, sessionId: 1 });

// Compound index for daily aggregation
ConversionLiftSchema.index({ studyId: 1, treatmentGroup: 1, createdAt: 1 });

export const ConversionLift = mongoose.model<IConversionLift>('ConversionLift', ConversionLiftSchema);
export default ConversionLift;