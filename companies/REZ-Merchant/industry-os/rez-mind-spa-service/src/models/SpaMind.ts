import mongoose, { Schema, Document } from 'mongoose';
import {
  CustomerSegmentation,
  SentimentAnalysis,
  TreatmentRecommendation,
  TherapistMatch,
  LifetimeValuePrediction,
} from '../types';

// Mongoose Document interface
export interface ISpaMindSession extends Document {
  merchantId: string;
  sessionId: string;
  customerId: string;
  analysis: {
    customerSegmentation?: CustomerSegmentation;
    sentiment?: SentimentAnalysis;
    preferences?: Record<string, unknown>;
  };
  recommendations: TreatmentRecommendation[];
  therapistMatches: TherapistMatch[];
  lifetimeValuePrediction?: LifetimeValuePrediction;
  sessionData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SpaMindSchema = new Schema<ISpaMindSession>(
  {
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    analysis: {
      customerSegmentation: {
        segmentId: String,
        segmentName: String,
        characteristics: [String],
        preferences: Schema.Types.Mixed,
        avgLifetimeValue: Number,
        retentionRate: Number,
        preferredChannels: [String],
      },
      sentiment: {
        overall: Number,
        positive: Number,
        negative: Number,
        neutral: Number,
        keywords: [
          {
            keyword: String,
            sentiment: String,
            frequency: Number,
          },
        ],
        trends: [
          {
            period: String,
            direction: String,
            delta: Number,
          },
        ],
      },
      preferences: Schema.Types.Mixed,
    },
    recommendations: [
      {
        treatment: {
          treatmentId: String,
          name: String,
          category: String,
          description: String,
          duration: Number,
          basePrice: Number,
          benefits: [String],
          suitableFor: [String],
        },
        score: Number,
        reason: String,
        upsellPotential: Boolean,
        seasonalRelevance: Number,
        confidence: Number,
      },
    ],
    therapistMatches: [
      {
        therapist: {
          therapistId: String,
          name: String,
          specialties: [String],
          certifications: [String],
          experience: Number,
          rating: Number,
        },
        matchScore: Number,
        matchReasons: [String],
        availabilityScore: Number,
        customerSatisfactionPrediction: Number,
      },
    ],
    lifetimeValuePrediction: {
      predictedCLV: Number,
      confidence: Number,
      factors: [
        {
          factor: String,
          impact: Number,
          weight: Number,
        },
      ],
      tier: String,
      recommendations: [String],
    },
    sessionData: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'spa_mind_sessions',
  }
);

// Indexes for performance
SpaMindSchema.index({ merchantId: 1, createdAt: -1 });
SpaMindSchema.index({ customerId: 1, createdAt: -1 });
SpaMindSchema.index({ sessionId: 1 }, { unique: true });

// Virtual for session age
SpaMindSchema.virtual('sessionAge').get(function () {
  return Date.now() - this.createdAt.getTime();
});

// Method to check if session is expired (30 minutes)
SpaMindSchema.methods.isExpired = function (): boolean {
  const thirtyMinutes = 30 * 60 * 1000;
  return Date.now() - this.createdAt.getTime() > thirtyMinutes;
};

// Static method to find active sessions for customer
SpaMindSchema.statics.findActiveSessions = function (
  customerId: string,
  merchantId: string
): Promise<ISpaMindSession[]> {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return this.find({
    customerId,
    merchantId,
    createdAt: { $gte: thirtyMinutesAgo },
  }).sort({ createdAt: -1 });
};

// Static method to get customer session history
SpaMindSchema.statics.getCustomerHistory = function (
  customerId: string,
  limit: number = 10
): Promise<ISpaMindSession[]> {
  return this.find({ customerId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Export the model
export const SpaMind = mongoose.model<ISpaMindSession>('SpaMind', SpaMindSchema);