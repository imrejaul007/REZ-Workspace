import mongoose, { Document, Schema } from 'mongoose';
import { Platform } from '../utils/validators';

// Individual check result within history
export interface ICheckResult {
  checkId: string;
  date: Date;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyFlags: string[];
}

// Trend data
export interface ITrend {
  scoreChange: number; // positive or negative change
  direction: 'improving' | 'declining' | 'stable';
  previousScore: number;
  currentScore: number;
}

// Alert information
export interface IAlert {
  alertId: string;
  type: 'sudden_spike' | 'score_drop' | 'flag_added' | 'risk_increase';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  notes?: string;
}

export interface ICheckHistory extends Document {
  influencerId: string;
  platform: Platform;
  username: string;
  checks: ICheckResult[];
  trend: ITrend;
  alerts: IAlert[];
  totalChecks: number;
  firstCheckDate: Date;
  lastCheckDate: Date;
  averageScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const CheckResultSchema = new Schema<ICheckResult>(
  {
    checkId: { type: String, required: true },
    date: { type: Date, required: true },
    overallScore: { type: Number, required: true },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    keyFlags: [String],
  },
  { _id: false }
);

const AlertSchema = new Schema<IAlert>(
  {
    alertId: { type: String, required: true },
    type: {
      type: String,
      enum: ['sudden_spike', 'score_drop', 'flag_added', 'risk_increase'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      required: true,
    },
    message: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: String,
    acknowledgedAt: Date,
    notes: String,
  },
  { _id: false }
);

const CheckHistorySchema = new Schema<ICheckHistory>(
  {
    influencerId: {
      type: String,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['instagram', 'youtube', 'twitter', 'tiktok', 'facebook', 'linkedin'],
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    checks: [CheckResultSchema],
    trend: {
      scoreChange: { type: Number, default: 0 },
      direction: {
        type: String,
        enum: ['improving', 'declining', 'stable'],
        default: 'stable',
      },
      previousScore: { type: Number },
      currentScore: { type: Number },
    },
    alerts: [AlertSchema],
    totalChecks: { type: Number, default: 0 },
    firstCheckDate: Date,
    lastCheckDate: Date,
    averageScore: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Compound index
CheckHistorySchema.index({ influencerId: 1, platform: 1 }, { unique: true });
CheckHistorySchema.index({ 'alerts.acknowledged': 1, 'alerts.createdAt': -1 });

// Instance method to add check to history
CheckHistorySchema.methods.addCheck = async function (
  checkResult: ICheckResult
): Promise<void> {
  this.checks.push(checkResult);
  this.totalChecks += 1;

  // Update trend
  if (this.checks.length >= 2) {
    const previousCheck = this.checks[this.checks.length - 2];
    this.trend.previousScore = previousCheck.overallScore;
    this.trend.currentScore = checkResult.overallScore;
    this.trend.scoreChange = checkResult.overallScore - previousCheck.overallScore;

    if (this.trend.scoreChange > 5) {
      this.trend.direction = 'improving';
    } else if (this.trend.scoreChange < -5) {
      this.trend.direction = 'declining';
    } else {
      this.trend.direction = 'stable';
    }
  }

  // Update first/last check dates
  if (!this.firstCheckDate) {
    this.firstCheckDate = checkResult.date;
  }
  this.lastCheckDate = checkResult.date;

  // Recalculate average
  const totalScore = this.checks.reduce((sum, c) => sum + c.overallScore, 0);
  this.averageScore = totalScore / this.checks.length;

  await this.save();
};

// Instance method to add alert
CheckHistorySchema.methods.addAlert = async function (
  alert: Omit<IAlert, 'alertId' | 'createdAt'>
): Promise<void> {
  const newAlert: IAlert = {
    ...alert,
    alertId: new mongoose.Types.ObjectId().toString(),
    createdAt: new Date(),
  };
  this.alerts.push(newAlert);
  await this.save();
};

// Instance method to get unacknowledged alerts
CheckHistorySchema.methods.getUnacknowledgedAlerts = function (): IAlert[] {
  return this.alerts.filter((a) => !a.acknowledged);
};

export const CheckHistory = mongoose.model<ICheckHistory>('CheckHistory', CheckHistorySchema);