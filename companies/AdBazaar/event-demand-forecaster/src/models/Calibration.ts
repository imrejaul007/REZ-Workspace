import mongoose, { Document, Schema, Model } from 'mongoose';

// Adjustment interface
export interface IAdjustment {
  factor: string;
  original: number;
  adjusted: number;
  reason: string;
  impact: number; // % change
}

// Calibration document interface
export interface ICalibration extends Document {
  eventId: string;
  eventName: string;
  category: string;
  location: string;
  timestamp: Date;
  adjustments: IAdjustment[];
  totalImpact: number;
  method: 'manual' | 'automatic' | 'ai_recommended';
  source: {
    type: 'historical' | 'real_time' | 'expert' | 'ai';
    details: string;
  };
  beforeState: {
    totalDemand: number;
    peakDemand: number;
    confidence: number;
  };
  afterState: {
    totalDemand: number;
    peakDemand: number;
    confidence: number;
  };
  notes: string;
  validated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Calibration schema
const CalibrationSchema = new Schema<ICalibration>(
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
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    adjustments: [{
      factor: {
        type: String,
        required: true,
        enum: [
          'historical', 'seasonal', 'promotional', 'weather',
          'economic', 'social', 'location', 'competitor', 'demand'
        ]
      },
      original: { type: Number, required: true },
      adjusted: { type: Number, required: true },
      reason: { type: String, required: true },
      impact: { type: Number, required: true }
    }],
    totalImpact: {
      type: Number,
      required: true,
      default: 0
    },
    method: {
      type: String,
      enum: ['manual', 'automatic', 'ai_recommended'],
      required: true
    },
    source: {
      type: {
        type: String,
        enum: ['historical', 'real_time', 'expert', 'ai'],
        required: true
      },
      details: { type: String, default: '' }
    },
    beforeState: {
      totalDemand: { type: Number, required: true },
      peakDemand: { type: Number, required: true },
      confidence: { type: Number, required: true }
    },
    afterState: {
      totalDemand: { type: Number, required: true },
      peakDemand: { type: Number, required: true },
      confidence: { type: Number, required: true }
    },
    notes: {
      type: String,
      default: ''
    },
    validated: {
      type: Boolean,
      default: false
    },
    validatedBy: {
      type: String
    },
    validatedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
CalibrationSchema.index({ eventId: 1, timestamp: -1 });
CalibrationSchema.index({ category: 1, timestamp: -1 });
CalibrationSchema.index({ location: 1, timestamp: -1 });
CalibrationSchema.index({ method: 1 });
CalibrationSchema.index({ validated: 1, timestamp: -1 });

// Methods
CalibrationSchema.methods.isSignificant = function(): boolean {
  return Math.abs(this.totalImpact) >= 10; // >10% change is significant
};

CalibrationSchema.methods.getAdjustmentSummary = function(): string {
  const upAdjustments = this.adjustments.filter(a => a.impact > 0).length;
  const downAdjustments = this.adjustments.filter(a => a.impact < 0).length;

  return `${upAdjustments} upward, ${downAdjustments} downward adjustments`;
};

CalibrationSchema.methods.getDemandChange = function(): { absolute: number; percentage: number } {
  const absolute = this.afterState.totalDemand - this.beforeState.totalDemand;
  const percentage = (absolute / this.beforeState.totalDemand) * 100;

  return { absolute, percentage };
};

CalibrationSchema.methods.validate = function(validatedBy: string): void {
  this.validated = true;
  this.validatedBy = validatedBy;
  this.validatedAt = new Date();
};

// Static methods
CalibrationSchema.statics.getEventCalibrations = function(eventId: string, limit: number = 10) {
  return this.find({ eventId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

CalibrationSchema.statics.getRecentCalibrations = function(days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    timestamp: { $gte: startDate }
  })
    .sort({ timestamp: -1 })
    .limit(100);
};

CalibrationSchema.statics.getUnvalidatedCalibrations = function() {
  return this.find({ validated: false })
    .sort({ timestamp: -1 });
};

CalibrationSchema.statics.getCategoryStats = function(category: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { category, timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: '$method',
        count: { $sum: 1 },
        avgImpact: { $avg: '$totalImpact' },
        avgConfidenceChange: {
          $avg: { $subtract: ['$afterState.confidence', '$beforeState.confidence'] }
        }
      }
    }
  ]);
};

CalibrationSchema.statics.getMethodBreakdown = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$method',
        count: { $sum: 1 },
        avgImpact: { $avg: '$totalImpact' },
        totalImpact: { $sum: '$totalImpact' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

CalibrationSchema.statics.getPendingValidations = function() {
  return this.find({
    validated: false,
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  }).sort({ timestamp: -1 });
};

// Export model
export const Calibration: Model<ICalibration> = mongoose.model<ICalibration>('Calibration', CalibrationSchema);

export default Calibration;