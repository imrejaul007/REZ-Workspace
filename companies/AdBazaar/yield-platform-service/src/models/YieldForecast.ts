import mongoose, { Document, Schema } from 'mongoose';

// Forecast factor interface
export interface IForecastFactor {
  name: string;
  impact: number;
  weight: number;
  direction: 'positive' | 'negative' | 'neutral';
}

// Forecast confidence interval
export interface IConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number;
}

// Yield forecast document interface
export interface IYieldForecast extends Document {
  date: Date;
  horizon: 'hourly' | 'daily' | 'weekly' | 'monthly';
  inventoryType?: string;
  predicted: {
    revenue: number;
    ecpm: number;
    fillRate: number;
    impressions: number;
  };
  confidence: {
    overall: number;
    revenue: IConfidenceInterval;
    ecpm: IConfidenceInterval;
    fillRate: IConfidenceInterval;
  };
  factors: IForecastFactor[];
  actual?: {
    revenue: number;
    ecpm: number;
    fillRate: number;
    impressions: number;
  };
  accuracy?: number;
  model: string;
  metadata: {
    features: string[];
    trainingData: {
      startDate: Date;
      endDate: Date;
      samples: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema for YieldForecast
const ForecastFactorSchema = new Schema({
  name: { type: String, required: true },
  impact: { type: Number, required: true },
  weight: { type: Number, required: true },
  direction: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    required: true
  }
}, { _id: false });

const ConfidenceIntervalSchema = new Schema({
  lower: { type: Number, required: true },
  upper: { type: Number, required: true },
  confidence: { type: Number, required: true }
}, { _id: false });

const YieldForecastSchema = new Schema({
  date: { type: Date, required: true, index: true },
  horizon: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    required: true
  },
  inventoryType: { type: String, index: true },
  predicted: {
    revenue: { type: Number, required: true },
    ecpm: { type: Number, required: true },
    fillRate: { type: Number, required: true },
    impressions: { type: Number, required: true }
  },
  confidence: {
    overall: { type: Number, required: true },
    revenue: { type: ConfidenceIntervalSchema, required: true },
    ecpm: { type: ConfidenceIntervalSchema, required: true },
    fillRate: { type: ConfidenceIntervalSchema, required: true }
  },
  factors: [ForecastFactorSchema],
  actual: {
    revenue: { type: Number },
    ecpm: { type: Number },
    fillRate: { type: Number },
    impressions: { type: Number }
  },
  accuracy: { type: Number },
  model: { type: String, required: true, default: 'moving_average' },
  metadata: {
    features: [String],
    trainingData: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      samples: { type: Number, required: true }
    }
  }
}, {
  timestamps: true,
  collection: 'yield_forecasts'
});

// Indexes
YieldForecastSchema.index({ date: -1 });
YieldForecastSchema.index({ horizon: 1, date: -1 });
YieldForecastSchema.index({ inventoryType: 1, date: -1 });
YieldForecastSchema.index({ date: 1, inventoryType: 1, horizon: 1 }, { unique: true });

// Static methods
YieldForecastSchema.statics.findByDateRange = function(
  startDate: Date,
  endDate: Date,
  inventoryType?: string
) {
  const query: any = { date: { $gte: startDate, $lte: endDate } };
  if (inventoryType) {
    query.inventoryType = inventoryType;
  }
  return this.find(query).sort({ date: 1 });
};

YieldForecastSchema.statics.getLatest = function(horizon: string, limit: number = 1) {
  return this.find({ horizon }).sort({ date: -1 }).limit(limit);
};

YieldForecastSchema.statics.updateWithActual = async function(
  forecastId: string,
  actual: IYieldForecast['actual']
) {
  const forecast = await this.findById(forecastId);
  if (!forecast) return null;

  // Calculate accuracy
  const accuracy = {
    revenue: forecast.predicted.revenue > 0
      ?1 - Math.abs(forecast.predicted.revenue - actual!.revenue) / forecast.predicted.revenue
      : 0,
    ecpm: forecast.predicted.ecpm > 0
      ? 1 - Math.abs(forecast.predicted.ecpm - actual!.ecpm) / forecast.predicted.ecpm
      : 0,
    fillRate: forecast.predicted.fillRate > 0
      ? 1 - Math.abs(forecast.predicted.fillRate - actual!.fillRate) / forecast.predicted.fillRate
      : 0
  };

  forecast.actual = actual;
  forecast.accuracy = (accuracy.revenue + accuracy.ecpm + accuracy.fillRate) / 3;
  await forecast.save();

  return forecast;
};

YieldForecastSchema.statics.getAccuracyStats = async function(
  inventoryType?: string,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const query: any = {
    date: { $gte: startDate },
    accuracy: { $exists: true }
  };
  if (inventoryType) {
    query.inventoryType = inventoryType;
  }

  const forecasts = await this.find(query);

  if (forecasts.length === 0) {
    return { average:0, min: 0, max: 0, count: 0 };
  }

  const accuracies = forecasts.map(f => f.accuracy!);
  return {
    average: accuracies.reduce((a, b) => a + b, 0) / accuracies.length,
    min: Math.min(...accuracies),
    max: Math.max(...accuracies),
    count: accuracies.length
  };
};

export const YieldForecast = mongoose.model<IYieldForecast>('YieldForecast', YieldForecastSchema);