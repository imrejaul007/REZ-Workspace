import mongoose, { Document, Schema } from 'mongoose';

export interface ISalesLift {
  campaignId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  shelfId: mongoose.Types.ObjectId;
  productSku: string;
  period: {
    start: Date;
    end: Date;
  };
  baseline: {
    sales: number;
    units: number;
    avgOrderValue: number;
    transactions: number;
  };
  campaign: {
    sales: number;
    units: number;
    avgOrderValue: number;
    transactions: number;
  };
  lift: {
    salesPercentage: number;
    unitsPercentage: number;
    aovChange: number;
    transactionsPercentage: number;
  };
  confidence: {
    level: 'high' | 'medium' | 'low';
    score: number;
    marginOfError: number;
    sampleSize: number;
  };
  statisticalSignificance: {
    pValue: number;
    tStatistic: number;
    isSignificant: boolean;
  };
  attribution: {
    model: 'last_touch' | 'first_touch' | 'linear' | 'time_decay' | 'data_driven';
    shelfContribution: number;
    otherChannels: number;
  };
  status: 'calculating' | 'completed' | 'insufficient_data';
  createdAt: Date;
  updatedAt: Date;
}

export interface ISalesLiftDocument extends ISalesLift, Document {
  _id: mongoose.Types.ObjectId;
}

const SalesLiftSchema = new Schema<ISalesLiftDocument>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'ShelfCampaign',
      required: true,
      index: true
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true
    },
    shelfId: {
      type: Schema.Types.ObjectId,
      ref: 'Shelf',
      required: true,
      index: true
    },
    productSku: {
      type: String,
      required: true
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true }
    },
    baseline: {
      sales: { type: Number, required: true },
      units: { type: Number, required: true },
      avgOrderValue: { type: Number, required: true },
      transactions: { type: Number, required: true }
    },
    campaign: {
      sales: { type: Number, required: true },
      units: { type: Number, required: true },
      avgOrderValue: { type: Number, required: true },
      transactions: { type: Number, required: true }
    },
    lift: {
      salesPercentage: { type: Number, default: 0 },
      unitsPercentage: { type: Number, default: 0 },
      aovChange: { type: Number, default: 0 },
      transactionsPercentage: { type: Number, default: 0 }
    },
    confidence: {
      level: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      },
      score: { type: Number, default: 0 },
      marginOfError: { type: Number, default: 0 },
      sampleSize: { type: Number, default: 0 }
    },
    statisticalSignificance: {
      pValue: { type: Number, default: 1 },
      tStatistic: { type: Number, default: 0 },
      isSignificant: { type: Boolean, default: false }
    },
    attribution: {
      model: {
        type: String,
        enum: ['last_touch', 'first_touch', 'linear', 'time_decay', 'data_driven'],
        default: 'data_driven'
      },
      shelfContribution: { type: Number, default: 100 },
      otherChannels: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['calculating', 'completed', 'insufficient_data'],
      default: 'calculating',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
SalesLiftSchema.index({ campaignId: 1, storeId: 1 });
SalesLiftSchema.index({ campaignId: 1, status: 1 });
SalesLiftSchema.index({ createdAt: -1 });

// Calculate lift percentages on save
SalesLiftSchema.pre('save', function(next) {
  if (this.baseline && this.campaign) {
    // Sales lift
    if (this.baseline.sales > 0) {
      this.lift.salesPercentage = ((this.campaign.sales - this.baseline.sales) / this.baseline.sales) * 100;
    }
    // Units lift
    if (this.baseline.units > 0) {
      this.lift.unitsPercentage = ((this.campaign.units - this.baseline.units) / this.baseline.units) * 100;
    }
    // AOV change
    if (this.baseline.avgOrderValue > 0) {
      this.lift.aovChange = ((this.campaign.avgOrderValue - this.baseline.avgOrderValue) / this.baseline.avgOrderValue) * 100;
    }
    // Transactions lift
    if (this.baseline.transactions > 0) {
      this.lift.transactionsPercentage = ((this.campaign.transactions - this.baseline.transactions) / this.baseline.transactions) * 100;
    }
  }
  next();
});

export const SalesLift = mongoose.model<ISalesLiftDocument>('SalesLift', SalesLiftSchema);
export default SalesLift;