import mongoose, { Document, Schema, Model } from 'mongoose';

// Error metrics interface
export interface IErrorMetrics {
  mae: number;  // Mean Absolute Error
  mse: number;  // Mean Squared Error
  rmse: number; // Root Mean Squared Error
  mape: number; // Mean Absolute Percentage Error
  bias: number; // Systematic bias
}

// Performance metrics interface
export interface IPerformanceMetrics {
  accuracy: number; // % of predictions within tolerance
  precision: number;
  recall: number;
  f1Score: number;
}

// Analytics document interface
export interface IForecastAnalytics extends Document {
  eventId: string;
  eventName: string;
  category: string;
  location: string;
  period: {
    start: Date;
    end: Date;
    days: number;
  };
  errors: IErrorMetrics;
  performance: IPerformanceMetrics;
  comparison: {
    vsHistorical: number;
    vsCategoryAvg: number;
    vsLocationAvg: number;
  };
  dataQuality: {
    completeness: number; // % of data points available
    freshness: number;    // How recent the data is
    reliability: number;  // Data source reliability score
  };
  status: 'in_progress' | 'completed' | 'failed';
  insights: {
    majorFactors: string[];
    anomalies: string[];
    recommendations: string[];
  };
  metadata: {
    dataPoints: number;
    algorithms: string[];
    lastCalculated: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Forecast analytics schema
const ForecastAnalyticsSchema = new Schema<IForecastAnalytics>(
  {
    eventId: {
      type: String,
      required: true,
      index: true
    },
    eventName: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    location: {
      type: String,
      required: true,
      index: true
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
      days: { type: Number, required: true }
    },
    errors: {
      mae: { type: Number, default: 0 },
      mse: { type: Number, default: 0 },
      rmse: { type: Number, default: 0 },
      mape: { type: Number, default: 0 },
      bias: { type: Number, default: 0 }
    },
    performance: {
      accuracy: { type: Number, default: 0, min: 0, max: 1 },
      precision: { type: Number, default: 0, min: 0, max: 1 },
      recall: { type: Number, default: 0, min: 0, max: 1 },
      f1Score: { type: Number, default: 0, min: 0, max: 1 }
    },
    comparison: {
      vsHistorical: { type: Number, default: 0 },
      vsCategoryAvg: { type: Number, default: 0 },
      vsLocationAvg: { type: Number, default: 0 }
    },
    dataQuality: {
      completeness: { type: Number, default: 0, min: 0, max: 1 },
      freshness: { type: Number, default: 0, min: 0, max: 1 },
      reliability: { type: Number, default: 0, min: 0, max: 1 }
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'failed'],
      default: 'in_progress'
    },
    insights: {
      majorFactors: [{ type: String }],
      anomalies: [{ type: String }],
      recommendations: [{ type: String }]
    },
    metadata: {
      dataPoints: { type: Number, default: 0 },
      algorithms: [{ type: String }],
      lastCalculated: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
ForecastAnalyticsSchema.index({ eventId: 1, 'period.start': -1 });
ForecastAnalyticsSchema.index({ category: 1, 'period.start': -1 });
ForecastAnalyticsSchema.index({ location: 1, 'period.start': -1 });
ForecastAnalyticsSchema.index({ 'performance.accuracy': -1 });
ForecastAnalyticsSchema.index({ createdAt: -1 });

// Methods
ForecastAnalyticsSchema.methods.isHighQuality = function(): boolean {
  return this.dataQuality.completeness >= 0.8 &&
         this.dataQuality.freshness >= 0.7 &&
         this.dataQuality.reliability >= 0.75;
};

ForecastAnalyticsSchema.methods.getOverallScore = function(): number {
  const qualityScore = (
    this.dataQuality.completeness * 0.3 +
    this.dataQuality.freshness * 0.3 +
    this.dataQuality.reliability * 0.4
  );

  const performanceScore = (
    this.performance.accuracy * 0.4 +
    this.performance.precision * 0.3 +
    this.performance.f1Score * 0.3
  );

  return (qualityScore + performanceScore) / 2;
};

ForecastAnalyticsSchema.methods.getErrorSummary = function(): string {
  if (this.errors.mape <= 5) return 'Excellent';
  if (this.errors.mape <= 10) return 'Good';
  if (this.errors.mape <= 20) return 'Fair';
  return 'Needs Improvement';
};

// Static methods
ForecastAnalyticsSchema.statics.getTopPerformers = function(limit: number = 10) {
  return this.find({ status: 'completed' })
    .sort({ 'performance.accuracy': -1 })
    .limit(limit);
};

ForecastAnalyticsSchema.statics.getCategoryPerformance = function(category: string) {
  return this.aggregate([
    { $match: { category, status: 'completed' } },
    {
      $group: {
        _id: '$category',
        avgAccuracy: { $avg: '$performance.accuracy' },
        avgMape: { $avg: '$errors.mape' },
        totalEvents: { $sum: 1 },
        avgDataQuality: { $avg: '$dataQuality.reliability' }
      }
    }
  ]);
};

ForecastAnalyticsSchema.statics.getLocationPerformance = function(location: string) {
  return this.aggregate([
    { $match: { location, status: 'completed' } },
    {
      $group: {
        _id: '$location',
        avgAccuracy: { $avg: '$performance.accuracy' },
        avgMape: { $avg: '$errors.mape' },
        totalEvents: { $sum: 1 },
        avgDataQuality: { $avg: '$dataQuality.reliability' }
      }
    }
  ]);
};

ForecastAnalyticsSchema.statics.getOverallStats = function() {
  return this.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: null,
        totalForecasts: { $sum: 1 },
        avgAccuracy: { $avg: '$performance.accuracy' },
        avgMape: { $avg: '$errors.mape' },
        avgDataQuality: { $avg: '$dataQuality.reliability' },
        avgCompleteness: { $avg: '$dataQuality.completeness' }
      }
    }
  ]);
};

// Export model
export const ForecastAnalytics: Model<IForecastAnalytics> = mongoose.model<IForecastAnalytics>(
  'ForecastAnalytics',
  ForecastAnalyticsSchema
);

export default ForecastAnalytics;