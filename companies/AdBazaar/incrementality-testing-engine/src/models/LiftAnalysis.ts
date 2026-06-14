import mongoose, { Document, Schema } from 'mongoose';

export interface ILiftAnalysisDocument extends Document {
  experimentId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  lift: number;
  absoluteLift: number;
  relativeLift: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  pValue: number;
  tStatistic: number;
  sampleSize: number;
  statisticalPower: number;
  minimumDetectableEffect: number;
  isSignificant: boolean;
  confidenceLevel: number;
  analysisDate: Date;
  createdAt: Date;
}

const LiftAnalysisSchema = new Schema<ILiftAnalysisDocument>(
  {
    experimentId: {
      type: Schema.Types.ObjectId,
      ref: 'Experiment',
      required: true,
      index: true
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'TestGroup',
      index: true
    },
    lift: {
      type: Number,
      required: true
    },
    absoluteLift: {
      type: Number,
      required: true
    },
    relativeLift: {
      type: Number,
      required: true
    },
    confidenceInterval: {
      lower: { type: Number, required: true },
      upper: { type: Number, required: true }
    },
    pValue: {
      type: Number,
      required: true
    },
    tStatistic: {
      type: Number,
      required: true
    },
    sampleSize: {
      type: Number,
      required: true,
      min: 0
    },
    statisticalPower: {
      type: Number,
      default: 0.8
    },
    minimumDetectableEffect: {
      type: Number,
      required: true
    },
    isSignificant: {
      type: Boolean,
      required: true
    },
    confidenceLevel: {
      type: Number,
      default: 0.95
    },
    analysisDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'lift_analyses'
  }
);

// Indexes
LiftAnalysisSchema.index({ experimentId: 1, analysisDate: -1 });
LiftAnalysisSchema.index({ experimentId: 1, isSignificant: 1 });

// Static methods for lift calculations
LiftAnalysisSchema.statics.calculateLift = function(
  treatmentRate: number,
  controlRate: number
) {
  if (controlRate === 0) {
    return treatmentRate > 0 ? 100 : 0;
  }
  return ((treatmentRate - controlRate) / controlRate) * 100;
};

LiftAnalysisSchema.statics.calculateStatisticalSignificance = function(
  treatmentConversions: number,
  treatmentSize: number,
  controlConversions: number,
  controlSize: number
) {
  // Calculate conversion rates
  const treatmentRate = treatmentSize > 0 ? treatmentConversions / treatmentSize : 0;
  const controlRate = controlSize > 0 ? controlConversions / controlSize : 0;

  // Calculate pooled probability
  const pooledP = (treatmentConversions + controlConversions) / (treatmentSize + controlSize);

  // Calculate standard error
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / treatmentSize + 1 / controlSize));

  // Calculate z-score (t-statistic)
  const zScore = se > 0 ? (treatmentRate - controlRate) / se : 0;

  // Calculate p-value (two-tailed test)
  const pValue = this.normalCDF(Math.abs(zScore));

  return {
    zScore,
    pValue,
    isSignificant: pValue < 0.05
  };
};

// Normal CDF approximation
LiftAnalysisSchema.statics.normalCDF = function(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
};

LiftAnalysisSchema.statics.calculateConfidenceInterval = function(
  treatmentRate: number,
  controlRate: number,
  treatmentSize: number,
  controlSize: number,
  confidenceLevel: number = 0.95
) {
  const zValue = confidenceLevel === 0.99 ? 2.576 : 1.96; // 95% or 99%

  // Calculate standard error of the difference
  const seTreatment = Math.sqrt((treatmentRate * (1 - treatmentRate)) / treatmentSize);
  const seControl = Math.sqrt((controlRate * (1 - controlRate)) / controlSize);
  const seDiff = Math.sqrt(seTreatment * seTreatment + seControl * seControl);

  const diff = treatmentRate - controlRate;

  return {
    lower: diff - zValue * seDiff,
    upper: diff + zValue * seDiff
  };
};

LiftAnalysisSchema.statics.calculateMinimumDetectableEffect = function(
  baselineRate: number,
  sampleSize: number,
  power: number = 0.8,
  alpha: number = 0.05
) {
  const zAlpha = 1.96; // Two-tailed test at 95% confidence
  const zBeta = 0.84; // 80% power

  const p1 = baselineRate;
  const p2 = Math.min(p1 + 0.5, 0.999); // Max rate is 99.9%

  const pooledP = p1;
  const se = Math.sqrt(2 * pooledP * (1 - pooledP) / sampleSize);

  return (zAlpha + zBeta) * se;
};

export const LiftAnalysis = mongoose.model<ILiftAnalysisDocument>('LiftAnalysis', LiftAnalysisSchema);