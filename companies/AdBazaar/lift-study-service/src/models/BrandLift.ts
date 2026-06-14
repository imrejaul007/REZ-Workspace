import mongoose, { Document, Schema } from 'mongoose';

export interface IBrandLift extends Document {
  _id: mongoose.Types.ObjectId;
  studyId: mongoose.Types.ObjectId;
  surveyType: 'pre' | 'post' | 'both';
  treatmentGroup: boolean;
  respondentId: string;
  responses: {
    awareness?: {
      unaided?: boolean;
      aided?: boolean;
      score?: number;
    };
    consideration?: number;
    intent?: number;
    adRecall?: {
      exact?: boolean;
      vague?: boolean;
      none?: boolean;
    };
    brandPerception?: Record<string, number>;
    purchaseIntent?: number;
    recommendationLikelihood?: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
  demographics?: {
    age?: number;
    gender?: string;
    location?: string;
    income?: string;
  };
  computedMetrics?: {
    awarenessLift?: number;
    considerationLift?: number;
    intentLift?: number;
    adRecallLift?: number;
    netPromoterScore?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BrandLiftSchema = new Schema<IBrandLift>(
  {
    studyId: { type: Schema.Types.ObjectId, ref: 'LiftStudy', required: true, index: true },
    surveyType: {
      type: String,
      required: true,
      enum: ['pre', 'post', 'both']
    },
    treatmentGroup: { type: Boolean, required: true },
    respondentId: { type: String, required: true },
    responses: {
      awareness: {
        unaided: Boolean,
        aided: Boolean,
        score: Number
      },
      consideration: Number,
      intent: Number,
      adRecall: {
        exact: Boolean,
        vague: Boolean,
        none: Boolean
      },
      brandPerception: { type: Map, of: Number },
      purchaseIntent: Number,
      recommendationLikelihood: Number,
      sentiment: String
    },
    demographics: {
      age: Number,
      gender: String,
      location: String,
      income: String
    },
    computedMetrics: {
      awarenessLift: Number,
      considerationLift: Number,
      intentLift: Number,
      adRecallLift: Number,
      netPromoterScore: Number
    }
  },
  {
    timestamps: true
  }
);

// Indexes
BrandLiftSchema.index({ studyId: 1, surveyType: 1, treatmentGroup: 1 });
BrandLiftSchema.index({ respondentId: 1 });
BrandLiftSchema.index({ createdAt: 1 });

export const BrandLift = mongoose.model<IBrandLift>('BrandLift', BrandLiftSchema);
export default BrandLift;