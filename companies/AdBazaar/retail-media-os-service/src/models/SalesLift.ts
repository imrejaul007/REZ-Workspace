import mongoose, { Schema, Document } from 'mongoose';

export type LiftMethod = 'geo_test' | 'store_test' | 'holdout' | 'matched_market';

export interface ISalesLift extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  retailerId: mongoose.Types.ObjectId;
  storeIds: string[];
  method: LiftMethod;
  period: {
    startDate: Date;
    endDate: Date;
  };
  baseline: {
    sales: number;
    transactions: number;
    avgOrderValue: number;
    units: number;
  };
  treatment: {
    sales: number;
    transactions: number;
    avgOrderValue: number;
    units: number;
  };
  lift: {
    salesPercent: number;
    transactionsPercent: number;
    aovChange: number;
    unitsPercent: number;
  };
  confidence: {
    level: number;
    intervalLow: number;
    intervalHigh: number;
    pValue: number;
    sampleSize: number;
  };
  controlGroup: {
    storeIds: string[];
    sales: number;
    transactions: number;
  };
  status: 'calculating' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const SalesLiftSchema = new Schema<ISalesLift>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'RetailCampaign', required: true, index: true },
    retailerId: { type: Schema.Types.ObjectId, ref: 'Retailer', required: true, index: true },
    storeIds: [{ type: String, required: true }],
    method: {
      type: String,
      enum: ['geo_test', 'store_test', 'holdout', 'matched_market'],
      required: true
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    },
    baseline: {
      sales: { type: Number, required: true },
      transactions: { type: Number, required: true },
      avgOrderValue: { type: Number, required: true },
      units: { type: Number, required: true }
    },
    treatment: {
      sales: { type: Number, required: true },
      transactions: { type: Number, required: true },
      avgOrderValue: { type: Number, required: true },
      units: { type: Number, required: true }
    },
    lift: {
      salesPercent: { type: Number, default: 0 },
      transactionsPercent: { type: Number, default: 0 },
      aovChange: { type: Number, default: 0 },
      unitsPercent: { type: Number, default: 0 }
    },
    confidence: {
      level: { type: Number, default: 0 },
      intervalLow: { type: Number, default: 0 },
      intervalHigh: { type: Number, default: 0 },
      pValue: { type: Number, default: 1 },
      sampleSize: { type: Number, default: 0 }
    },
    controlGroup: {
      storeIds: [{ type: String }],
      sales: { type: Number, default: 0 },
      transactions: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['calculating', 'completed', 'failed'],
      default: 'calculating'
    }
  },
  { timestamps: true }
);

// Indexes
SalesLiftSchema.index({ retailerId: 1, status: 1 });
SalesLiftSchema.index({ campaignId: 1, method: 1 });
SalesLiftSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });

// Calculate lift values before saving
SalesLiftSchema.pre('save', function (next) {
  if (this.baseline.sales > 0) {
    this.lift.salesPercent = ((this.treatment.sales - this.baseline.sales) / this.baseline.sales) * 100;
  }
  if (this.baseline.transactions > 0) {
    this.lift.transactionsPercent = ((this.treatment.transactions - this.baseline.transactions) / this.baseline.transactions) * 100;
  }
  if (this.baseline.avgOrderValue > 0) {
    this.lift.aovChange = this.treatment.avgOrderValue - this.baseline.avgOrderValue;
  }
  if (this.baseline.units > 0) {
    this.lift.unitsPercent = ((this.treatment.units - this.baseline.units) / this.baseline.units) * 100;
  }

  // Calculate confidence
  const totalSampleSize = this.treatment.transactions + this.baseline.transactions;
  this.confidence.sampleSize = totalSampleSize;

  next();
});

export const SalesLift = mongoose.model<ISalesLift>('SalesLift', SalesLiftSchema);
export default SalesLift;