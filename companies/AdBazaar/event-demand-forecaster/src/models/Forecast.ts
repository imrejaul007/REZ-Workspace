import mongoose, { Document, Schema, Model } from 'mongoose';

// Forecast factors interface
export interface IForecastFactor {
  name: string;
  value: number;
  weight: number;
  description?: string;
}

// Time series data point
export interface IForecastDataPoint {
  date: Date;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

// Forecast document interface
export interface IForecast extends Document {
  eventId: string;
  eventName: string;
  category: string;
  location: string;
  startDate: Date;
  endDate: Date;
  predicted: {
    totalDemand: number;
    peakDemand: number;
    peakDate: Date;
    daily: IForecastDataPoint[];
    hourly?: { hour: number; demand: number }[];
  };
  confidence: {
    score: number;
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  factors: {
    historical: number;
    seasonal: number;
    promotional: number;
    weather: number;
    economic: number;
    social: number;
    location: number;
    competitor: number;
  };
  status: 'pending' | 'active' | 'calibrated' | 'completed' | 'expired';
  metadata: {
    model: string;
    algorithm: string;
    trainingDataPoints: number;
    lastUpdated: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Forecast schema
const ForecastSchema = new Schema<IForecast>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    eventName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      index: true,
      enum: [
        'concert', 'sports', 'conference', 'exhibition', 'festival',
        'corporate', 'wedding', 'social', 'political', 'religious', 'other'
      ]
    },
    location: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true
    },
    predicted: {
      totalDemand: {
        type: Number,
        required: true,
        min: 0
      },
      peakDemand: {
        type: Number,
        required: true,
        min: 0
      },
      peakDate: {
        type: Date,
        required: true
      },
      daily: [{
        date: { type: Date, required: true },
        predicted: { type: Number, required: true },
        lowerBound: { type: Number, required: true },
        upperBound: { type: Number, required: true },
        confidence: { type: Number, required: true, min: 0, max: 1 }
      }],
      hourly: [{
        hour: { type: Number, required: true, min: 0, max: 23 },
        demand: { type: Number, required: true, min: 0 }
      }]
    },
    confidence: {
      score: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      },
      level: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
      },
      factors: [{
        type: String
      }]
    },
    factors: {
      historical: { type: Number, default: 0 },
      seasonal: { type: Number, default: 0 },
      promotional: { type: Number, default: 0 },
      weather: { type: Number, default: 0 },
      economic: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      location: { type: Number, default: 0 },
      competitor: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'calibrated', 'completed', 'expired'],
      default: 'pending',
      index: true
    },
    metadata: {
      model: { type: String, default: 'prophet-like' },
      algorithm: { type: String, default: 'ensemble' },
      trainingDataPoints: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
ForecastSchema.index({ category: 1, status: 1 });
ForecastSchema.index({ location: 1, status: 1 });
ForecastSchema.index({ startDate: 1, endDate: 1 });
ForecastSchema.index({ 'predicted.totalDemand': -1 });
ForecastSchema.index({ createdAt: -1 });

// Methods
ForecastSchema.methods.isHighConfidence = function(): boolean {
  return this.confidence.score >= 0.75;
};

ForecastSchema.methods.getDemandRange = function(): { min: number; max: number } {
  const dailyDemands = this.predicted.daily.map(d => d.predicted);
  return {
    min: Math.min(...dailyDemands),
    max: Math.max(...dailyDemands)
  };
};

// Static methods
ForecastSchema.statics.findByCategory = function(category: string, status?: string) {
  const query: Record<string, unknown> = { category };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

ForecastSchema.statics.findByLocation = function(location: string, status?: string) {
  const query: Record<string, unknown> = { location };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

ForecastSchema.statics.findActiveForecasts = function() {
  return this.find({ status: { $in: ['active', 'calibrated'] } })
    .sort({ 'predicted.totalDemand': -1 });
};

// Pre-save middleware
ForecastSchema.pre('save', function(next) {
  // Update confidence level based on score
  if (this.confidence.score >= 0.75) {
    this.confidence.level = 'high';
  } else if (this.confidence.score >= 0.5) {
    this.confidence.level = 'medium';
  } else {
    this.confidence.level = 'low';
  }

  // Update metadata
  this.metadata.lastUpdated = new Date();

  next();
});

// Export model
export const Forecast: Model<IForecast> = mongoose.model<IForecast>('Forecast', ForecastSchema);

export default Forecast;