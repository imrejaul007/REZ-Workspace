import mongoose, { Schema, Document } from 'mongoose';

// Trend data point interface
export interface ITrendDataPoint {
  date: Date;
  value: number;
  predicted?: boolean;
  confidence?: number;
}

// Forecast data interface
export interface IForecast {
  date: Date;
  predicted: number;
  lower: number;
  upper: number;
  confidence: number;
}

// Trend data document interface
export interface ITrendData extends Document {
  publisherId: string;
  metric: 'revenue' | 'impressions' | 'ctr' | 'ecpm' | 'fillRate' | 'clicks' | 'conversions';
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  values: ITrendDataPoint[];
  forecast: IForecast[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
  changeAbsolute: number;
  period: {
    start: Date;
    end: Date;
  };
  metadata: {
    avgValue: number;
    minValue: number;
    maxValue: number;
    totalValue: number;
    volatility: number;
    seasonality?: {
      dayOfWeek?: { [key: number]: number };
      hourOfDay?: { [key: number]: number };
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Trend data point schema
const TrendDataPointSchema = new Schema<ITrendDataPoint>({
  date: { type: Date, required: true },
  value: { type: Number, required: true },
  predicted: { type: Boolean, default: false },
  confidence: { type: Number, min: 0, max: 1 }
}, { _id: false });

// Forecast schema
const ForecastSchema = new Schema<IForecast>({
  date: { type: Date, required: true },
  predicted: { type: Number, required: true },
  lower: { type: Number, required: true },
  upper: { type: Number, required: true },
  confidence: { type: Number, min: 0, max: 1, default: 0.95 }
}, { _id: false });

// Seasonality schema
const SeasonalitySchema = new Schema({
  dayOfWeek: {
    type: Map,
    of: Number,
    default: new Map()
  },
  hourOfDay: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, { _id: false });

// Trend data schema
const TrendDataSchema = new Schema<ITrendData>({
  publisherId: {
    type: String,
    required: true,
    index: true
  },
  metric: {
    type: String,
    enum: ['revenue', 'impressions', 'ctr', 'ecpm', 'fillRate', 'clicks', 'conversions'],
    required: true,
    index: true
  },
  granularity: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  values: {
    type: [TrendDataPointSchema],
    default: []
  },
  forecast: {
    type: [ForecastSchema],
    default: []
  },
  trend: {
    type: String,
    enum: ['increasing', 'decreasing', 'stable'],
    default: 'stable'
  },
  changePercent: {
    type: Number,
    default: 0
  },
  changeAbsolute: {
    type: Number,
    default: 0
  },
  period: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  metadata: {
    avgValue: { type: Number, default: 0 },
    minValue: { type: Number, default: 0 },
    maxValue: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    volatility: { type: Number, default: 0 },
    seasonality: {
      type: SeasonalitySchema,
      default: {}
    }
  }
}, {
  timestamps: true,
  collection: 'trend_data'
});

// Compound indexes
TrendDataSchema.index({ publisherId: 1, metric: 1, granularity: 1, 'period.end': -1 });
TrendDataSchema.index({ publisherId: 1, metric: 1, 'period.start': 1, 'period.end': 1 });

// Static method for getting trend data
TrendDataSchema.statics.getTrend = async function(
  publisherId: string,
  metric: string,
  startDate: Date,
  endDate: Date,
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  const trend = await this.findOne({
    publisherId,
    metric,
    granularity,
    'period.start': { $lte: startDate },
    'period.end': { $gte: endDate }
  });

  return trend;
};

// Static method for comparing periods
TrendDataSchema.statics.comparePeriods = async function(
  publisherId: string,
  metric: string,
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
) {
  const [currentTrend, previousTrend] = await Promise.all([
    this.aggregate([
      {
        $match: {
          publisherId,
          metric,
          'period.start': { $lte: currentStart },
          'period.end': { $gte: currentEnd }
        }
      },
      { $unwind: '$values' },
      {
        $match: {
          'values.date': { $gte: currentStart, $lte: currentEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$values.value' },
          avg: { $avg: '$values.value' },
          min: { $min: '$values.value' },
          max: { $max: '$values.value' },
          count: { $sum: 1 }
        }
      }
    ]),
    this.aggregate([
      {
        $match: {
          publisherId,
          metric,
          'period.start': { $lte: previousStart },
          'period.end': { $gte: previousEnd }
        }
      },
      { $unwind: '$values' },
      {
        $match: {
          'values.date': { $gte: previousStart, $lte: previousEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$values.value' },
          avg: { $avg: '$values.value' },
          min: { $min: '$values.value' },
          max: { $max: '$values.value' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const current = currentTrend[0] || { total: 0, avg: 0, min: 0, max: 0, count: 0 };
  const previous = previousTrend[0] || { total: 0, avg: 0, min: 0, max: 0, count: 0 };

  const changePercent = previous.total > 0
    ? ((current.total - previous.total) / previous.total) * 100
    : 0;

  return {
    current: {
      total: current.total,
      avg: current.avg,
      min: current.min,
      max: current.max,
      count: current.count
    },
    previous: {
      total: previous.total,
      avg: previous.avg,
      min: previous.min,
      max: previous.max,
      count: previous.count
    },
    change: {
      absolute: current.total - previous.total,
      percent: changePercent,
      direction: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable'
    }
  };
};

// Static method for getting forecast
TrendDataSchema.statics.getForecast = async function(
  publisherId: string,
  metric: string,
  daysAhead: number = 7
) {
  const trend = await this.findOne({
    publisherId,
    metric
  }).sort({ 'period.end': -1 });

  if (!trend || trend.forecast.length === 0) {
    return [];
  }

  // Return forecasts for the requested number of days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

  return trend.forecast.filter(f => f.date <= cutoffDate);
};

// Static method for detecting anomalies
TrendDataSchema.statics.detectAnomalies = async function(
  publisherId: string,
  metric: string,
  startDate: Date,
  endDate: Date,
  threshold: number = 2 // standard deviations
) {
  const result = await this.aggregate([
    {
      $match: {
        publisherId,
        metric,
        'period.start': { $lte: startDate },
        'period.end': { $gte: endDate }
      }
    },
    { $unwind: '$values' },
    {
      $match: {
        'values.date': { $gte: startDate, $lte: endDate },
        'values.predicted': false
      }
    },
    {
      $group: {
        _id: null,
        values: { $push: { date: '$values.date', value: '$values.value' } },
        avg: { $avg: '$values.value' },
        stdDev: { $stdDevPop: '$values.value' }
      }
    }
  ]);

  if (!result.length) {
    return [];
  }

  const { values, avg, stdDev } = result[0];
  const anomalies: Array<{ date: Date; value: number; zScore: number; type: 'spike' | 'drop' }> = [];

  for (const item of values) {
    const zScore = stdDev > 0 ? Math.abs((item.value - avg) / stdDev) : 0;
    if (zScore > threshold) {
      anomalies.push({
        date: item.date,
        value: item.value,
        zScore,
        type: item.value > avg ? 'spike' : 'drop'
      });
    }
  }

  return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
};

export const TrendData = mongoose.model<ITrendData>('TrendData', TrendDataSchema);
export default TrendData;