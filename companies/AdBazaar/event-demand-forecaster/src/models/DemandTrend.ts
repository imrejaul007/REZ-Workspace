import mongoose, { Document, Schema, Model } from 'mongoose';

// Demand trend document interface
export interface IDemandTrend extends Document {
  eventId: string;
  eventName: string;
  category: string;
  location: string;
  date: Date;
  demand: {
    actual: number;
    predicted: number;
    variance: number;
    variancePercent: number;
  };
  historical: {
    previousDay: number;
    previousWeek: number;
    previousMonth: number;
    sameDayLastYear: number;
  };
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    velocity: number; // % change per day
    momentum: number; // acceleration/deceleration
  };
  signals: {
    social: number; // Social media mentions score
    search: number; // Search volume score
    ticket: number; // Ticket sales velocity
    weather: number; // Weather impact score
    competitor: number; // Competing events score
  };
  confidence: number;
  metadata: {
    dataSources: string[];
    lastUpdated: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Demand trend schema
const DemandTrendSchema = new Schema<IDemandTrend>(
  {
    eventId: {
      type: String,
      required: true,
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
      index: true
    },
    location: {
      type: String,
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    demand: {
      actual: {
        type: Number,
        required: true,
        min: 0
      },
      predicted: {
        type: Number,
        required: true,
        min: 0
      },
      variance: {
        type: Number,
        required: true
      },
      variancePercent: {
        type: Number,
        required: true
      }
    },
    historical: {
      previousDay: { type: Number, default: 0 },
      previousWeek: { type: Number, default: 0 },
      previousMonth: { type: Number, default: 0 },
      sameDayLastYear: { type: Number, default: 0 }
    },
    trend: {
      direction: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable', 'volatile'],
        required: true
      },
      velocity: {
        type: Number,
        required: true,
        default: 0
      },
      momentum: {
        type: Number,
        required: true,
        default: 0
      }
    },
    signals: {
      social: { type: Number, min: 0, max: 100, default: 50 },
      search: { type: Number, min: 0, max: 100, default: 50 },
      ticket: { type: Number, min: 0, max: 100, default: 50 },
      weather: { type: Number, min: 0, max: 100, default: 50 },
      competitor: { type: Number, min: 0, max: 100, default: 50 }
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.5
    },
    metadata: {
      dataSources: [{
        type: String,
        enum: ['social', 'search', 'ticket', 'weather', 'historical', 'competitor']
      }],
      lastUpdated: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
DemandTrendSchema.index({ eventId: 1, date: -1 });
DemandTrendSchema.index({ category: 1, date: -1 });
DemandTrendSchema.index({ location: 1, date: -1 });
DemandTrendSchema.index({ date: -1 });

// Compound index for unique daily trend per event
DemandTrendSchema.index({ eventId: 1, date: 1 }, { unique: true });

// Virtual for accuracy
DemandTrendSchema.virtual('accuracy').get(function() {
  if (this.demand.predicted === 0) return 0;
  return 1 - Math.abs(this.demand.variancePercent) / 100;
});

// Methods
DemandTrendSchema.methods.getOverallSignal = function(): number {
  const signals = this.signals;
  return (signals.social + signals.search + signals.ticket + signals.weather + signals.competitor) / 5;
};

DemandTrendSchema.methods.isTrendingUp = function(): boolean {
  return this.trend.direction === 'increasing' && this.trend.velocity > 5;
};

DemandTrendSchema.methods.isTrendingDown = function(): boolean {
  return this.trend.direction === 'decreasing' && this.trend.velocity < -5;
};

// Static methods
DemandTrendSchema.statics.getTrendHistory = function(eventId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    eventId,
    date: { $gte: startDate }
  }).sort({ date: -1 });
};

DemandTrendSchema.statics.getCategoryTrends = function(category: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { category, date: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        avgDemand: { $avg: '$demand.actual' },
        avgPredicted: { $avg: '$demand.predicted' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

DemandTrendSchema.statics.getLocationTrends = function(location: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { location, date: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        avgDemand: { $avg: '$demand.actual' },
        totalDemand: { $sum: '$demand.actual' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Ensure virtuals are serialized
DemandTrendSchema.set('toJSON', { virtuals: true });
DemandTrendSchema.set('toObject', { virtuals: true });

// Export model
export const DemandTrend: Model<IDemandTrend> = mongoose.model<IDemandTrend>('DemandTrend', DemandTrendSchema);

export default DemandTrend;