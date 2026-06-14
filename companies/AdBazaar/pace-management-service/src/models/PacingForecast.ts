import mongoose, { Schema, Document } from 'mongoose';

export interface IForecastFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface IPacingForecastDocument extends Document {
  campaignId: string;
  date: Date;
  projectedSpend: number;
  projectedImpressions: number;
  projectedClicks: number;
  projectedConversions: number;
  confidence: number;
  factors: IForecastFactor[];
  methodology: string;
  createdAt: Date;
  updatedAt: Date;
}

const ForecastFactorSchema = new Schema<IForecastFactor>(
  {
    factor: {
      type: String,
      required: true
    },
    impact: {
      type: Number,
      required: true,
      min: -1,
      max: 1
    },
    description: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const PacingForecastSchema = new Schema<IPacingForecastDocument>(
  {
    campaignId: {
      type: String,
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    projectedSpend: {
      type: Number,
      required: true,
      min: 0
    },
    projectedImpressions: {
      type: Number,
      required: true,
      min: 0
    },
    projectedClicks: {
      type: Number,
      required: true,
      min: 0
    },
    projectedConversions: {
      type: Number,
      required: true,
      min: 0
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    factors: [ForecastFactorSchema],
    methodology: {
      type: String,
      default: 'historical_average'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
PacingForecastSchema.index({ campaignId: 1, date: -1 });
PacingForecastSchema.index({ date: -1 });
PacingForecastSchema.index({ confidence: 1 });

// Virtual for budget utilization percentage
PacingForecastSchema.virtual('budgetUtilization').get(function () {
  if (this.projectedSpend <= 0) return 0;
  return Math.min(100, (this.projectedSpend / this.projectedSpend) * 100);
});

// Method to calculate projected end date
PacingForecastSchema.methods.getProjectedEndDate = function (
  totalBudget: number,
  currentSpent: number
): Date | null {
  if (currentSpent <= 0 || this.projectedSpend <= 0) return null;

  const dailySpendRate = this.projectedSpend;
  const remainingBudget = totalBudget - currentSpent;

  if (remainingBudget <= 0) return new Date();

  const daysRemaining = Math.ceil(remainingBudget / dailySpendRate);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysRemaining);

  return endDate;
};

// Method to check if budget will be exhausted
PacingForecastSchema.methods.willExhaustBudget = function (
  totalBudget: number,
  currentSpent: number
): boolean {
  return this.projectedSpend > (totalBudget - currentSpent);
};

// Method to get confidence label
PacingForecastSchema.methods.getConfidenceLabel = function (): string {
  if (this.confidence >= 90) return 'Very High';
  if (this.confidence >= 75) return 'High';
  if (this.confidence >= 60) return 'Medium';
  if (this.confidence >= 40) return 'Low';
  return 'Very Low';
};

// Static method to get latest forecast for a campaign
PacingForecastSchema.statics.getLatestForecast = function (campaignId: string) {
  return this.findOne({ campaignId })
    .sort({ date: -1 })
    .exec();
};

// Static method to get forecast range
PacingForecastSchema.statics.getForecastRange = function (
  campaignId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    campaignId,
    date: { $gte: startDate, $lte: endDate }
  })
    .sort({ date: 1 })
    .exec();
};

// Static method to calculate average forecast accuracy
PacingForecastSchema.statics.calculateAccuracy = async function (
  campaignId: string,
  historicalDays: number = 7
) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - historicalDays);

  const forecasts = await this.find({
    campaignId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  if (forecasts.length === 0) return null;

  let totalAccuracy = 0;
  let count = 0;

  for (const forecast of forecasts) {
    // This would need actual spend data to compare
    // For now, we use confidence as a proxy
    totalAccuracy += forecast.confidence;
    count++;
  }

  return count > 0 ? totalAccuracy / count : null;
};

// Static method to generate forecast based on historical data
PacingForecastSchema.statics.generateForecast = async function (
  campaignId: string,
  historicalData: Array<{
    date: Date;
    spent: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>
): Promise<IPacingForecastDocument | null> {
  if (historicalData.length === 0) return null;

  // Calculate averages
  const avgSpent = historicalData.reduce((sum, d) => sum + d.spent, 0) / historicalData.length;
  const avgImpressions = historicalData.reduce((sum, d) => sum + d.impressions, 0) / historicalData.length;
  const avgClicks = historicalData.reduce((sum, d) => sum + d.clicks, 0) / historicalData.length;
  const avgConversions = historicalData.reduce((sum, d) => sum + d.conversions, 0) / historicalData.length;

  // Calculate confidence based on data consistency
  const variance = historicalData.reduce((sum, d) => {
    const diff = d.spent - avgSpent;
    return sum + (diff * diff);
  }, 0) / historicalData.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / (avgSpent || 1);
  const confidence = Math.max(0, Math.min(100, 100 - coefficientOfVariation * 100));

  // Identify factors
  const factors: IForecastFactor[] = [];

  // Check for trend
  const firstHalf = historicalData.slice(0, Math.floor(historicalData.length / 2));
  const secondHalf = historicalData.slice(Math.floor(historicalData.length / 2));
  const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.spent, 0) / (firstHalf.length || 1);
  const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.spent, 0) / (secondHalf.length || 1);

  if (secondHalfAvg > firstHalfAvg * 1.1) {
    factors.push({
      factor: 'accelerating_spend',
      impact: 0.2,
      description: 'Spend is accelerating compared to previous period'
    });
  } else if (secondHalfAvg < firstHalfAvg * 0.9) {
    factors.push({
      factor: 'decelerating_spend',
      impact: -0.1,
      description: 'Spend is decelerating compared to previous period'
    });
  }

  // Weekend vs weekday patterns
  const weekendData = historicalData.filter(d => {
    const day = new Date(d.date).getDay();
    return day === 0 || day === 6;
  });
  const weekdayData = historicalData.filter(d => {
    const day = new Date(d.date).getDay();
    return day !== 0 && day !== 6;
  });

  if (weekendData.length > 0 && weekdayData.length > 0) {
    const weekendAvg = weekendData.reduce((sum, d) => sum + d.spent, 0) / weekendData.length;
    const weekdayAvg = weekdayData.reduce((sum, d) => sum + d.spent, 0) / weekdayData.length;
    if (weekendAvg !== weekdayAvg) {
      factors.push({
        factor: 'weekend_pattern',
        impact: (weekendAvg - weekdayAvg) / weekdayAvg,
        description: `Weekend spending is ${weekendAvg > weekdayAvg ? 'higher' : 'lower'} than weekdays`
      });
    }
  }

  const forecast = new this({
    campaignId,
    date: new Date(),
    projectedSpend: avgSpent,
    projectedImpressions: avgImpressions,
    projectedClicks: avgClicks,
    projectedConversions: avgConversions,
    confidence: Math.round(confidence),
    factors,
    methodology: 'historical_average'
  });

  return forecast.save();
};

export const PacingForecast = mongoose.model<IPacingForecastDocument>(
  'PacingForecast',
  PacingForecastSchema
);