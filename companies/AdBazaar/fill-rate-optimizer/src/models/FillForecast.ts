import mongoose, { Schema, Document } from 'mongoose';

export interface IFillForecast extends Document {
  date: Date;
  inventoryId?: string;
  predicted: number;
  confidence: number;
  factors: {
    name: string;
    weight: number;
    direction: 'positive' | 'negative' | 'neutral';
  }[];
  model: string;
  modelVersion: string;
  horizon: number; // hours ahead
  actual?: number;
  error?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const FactorSchema = new Schema({
  name: { type: String, required: true },
  weight: { type: Number, required: true },
  direction: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    required: true
  }
}, { _id: false });

const FillForecastSchema = new Schema<IFillForecast>(
  {
    date: {
      type: Date,
      required: true,
      index: true
    },
    inventoryId: {
      type: String,
      required: false,
      index: true
    },
    predicted: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    factors: [FactorSchema],
    model: {
      type: String,
      required: true,
      default: 'fill-rate-forecast-v1'
    },
    modelVersion: {
      type: String,
      required: true,
      default: '1.0.0'
    },
    horizon: {
      type: Number,
      required: true,
      default: 24
    },
    actual: {
      type: Number,
      required: false
    },
    error: {
      type: Number,
      required: false
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false
    }
  },
  {
    timestamps: true,
    collection: 'fill_forecasts'
  }
);

// Indexes
FillForecastSchema.index({ date: -1, inventoryId: 1 });
FillForecastSchema.index({ inventoryId: 1, date: -1 });
FillForecastSchema.index({ predicted: 1, confidence: -1 });

// Method to update with actual value
FillForecastSchema.methods.updateWithActual = async function(actual: number): Promise<void> {
  this.actual = actual;
  this.error = Math.abs(this.predicted - actual);
  await this.save();
};

export const FillForecast = mongoose.model<IFillForecast>('FillForecast', FillForecastSchema);
