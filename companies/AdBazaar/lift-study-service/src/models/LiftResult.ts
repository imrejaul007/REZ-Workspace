import mongoose, { Document, Schema } from 'mongoose';

export interface ILiftMetricResult {
  metric: string;
  treatmentValue: number;
  controlValue: number;
  lift: number;
  liftPercentage: number;
  confidence: number;
  pValue: number;
  statisticalSignificance: boolean;
  sampleSize: {
    treatment: number;
    control: number;
  };
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface ILiftResult extends Document {
  _id: mongoose.Types.ObjectId;
  studyId: mongoose.Types.ObjectId;
  type: 'brand_lift' | 'conversion_lift' | 'both';
  overallLift: number;
  liftPercentage: number;
  confidence: number;
  pValue: number;
  statisticalSignificance: boolean;
  sampleSize: {
    treatment: number;
    control: number;
    total: number;
  };
  metricResults: ILiftMetricResult[];
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  methodology: string;
  computationDetails: {
    testUsed: string;
    assumptionsMet: boolean;
    effectSize: number;
    power: number;
  };
  recommendations: {
    action: string;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
  }[];
  computedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LiftMetricResultSchema = new Schema<ILiftMetricResult>(
  {
    metric: { type: String, required: true },
    treatmentValue: { type: Number, required: true },
    controlValue: { type: Number, required: true },
    lift: { type: Number, required: true },
    liftPercentage: { type: Number, required: true },
    confidence: { type: Number, required: true },
    pValue: { type: Number, required: true },
    statisticalSignificance: { type: Boolean, required: true },
    sampleSize: {
      treatment: { type: Number, required: true },
      control: { type: Number, required: true }
    },
    confidenceInterval: {
      lower: { type: Number, required: true },
      upper: { type: Number, required: true }
    }
  },
  { _id: false }
);

const LiftResultSchema = new Schema<ILiftResult>(
  {
    studyId: { type: Schema.Types.ObjectId, ref: 'LiftStudy', required: true, unique: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['brand_lift', 'conversion_lift', 'both'],
      index: true
    },
    overallLift: { type: Number, required: true },
    liftPercentage: { type: Number, required: true },
    confidence: { type: Number, required: true },
    pValue: { type: Number, required: true },
    statisticalSignificance: { type: Boolean, required: true },
    sampleSize: {
      treatment: { type: Number, required: true },
      control: { type: Number, required: true },
      total: { type: Number, required: true }
    },
    metricResults: [LiftMetricResultSchema],
    confidenceInterval: {
      lower: { type: Number, required: true },
      upper: { type: Number, required: true }
    },
    methodology: { type: String, required: true },
    computationDetails: {
      testUsed: { type: String, required: true },
      assumptionsMet: { type: Boolean, required: true },
      effectSize: { type: Number, required: true },
      power: { type: Number, required: true }
    },
    recommendations: [{
      action: { type: String, required: true },
      priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
      rationale: { type: String, required: true }
    }],
    computedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Indexes
LiftResultSchema.index({ studyId: 1, type: 1 });
LiftResultSchema.index({ statisticalSignificance: 1 });
LiftResultSchema.index({ computedAt: 1 });

export const LiftResult = mongoose.model<ILiftResult>('LiftResult', LiftResultSchema);
export default LiftResult;