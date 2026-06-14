import mongoose, { Schema, Document } from 'mongoose';

export interface IFillRate extends Document {
  date: Date;
  inventoryId: string;
  inventoryName?: string;
  impressions: number;
  filled: number;
  rate: number;
  requestId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const FillRateSchema = new Schema<IFillRate>(
  {
    date: {
      type: Date,
      required: true,
      index: true
    },
    inventoryId: {
      type: String,
      required: true,
      index: true
    },
    inventoryName: {
      type: String,
      required: false
    },
    impressions: {
      type: Number,
      required: true,
      min: 0
    },
    filled: {
      type: Number,
      required: true,
      min: 0
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    requestId: {
      type: String,
      required: false
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false
    }
  },
  {
    timestamps: true,
    collection: 'fill_rates'
  }
);

// Compound indexes for common queries
FillRateSchema.index({ date: -1, inventoryId: 1 });
FillRateSchema.index({ inventoryId: 1, date: -1 });
FillRateSchema.index({ rate: -1, date: -1 });

// Virtual for calculating rate
FillRateSchema.virtual('unfilled').get(function() {
  return this.impressions - this.filled;
});

// Static method to calculate rate
FillRateSchema.statics.calculateRate = function(filled: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (filled / impressions) * 100;
};

// Pre-save hook to auto-calculate rate
FillRateSchema.pre('save', function(next) {
  if (this.isModified(['filled', 'impressions'])) {
    this.rate = FillRateSchema.statics.calculateRate(this.filled, this.impressions);
  }
  next();
});

export const FillRate = mongoose.model<IFillRate>('FillRate', FillRateSchema);
