import mongoose, { Schema, Document } from 'mongoose';
import { AlertThreshold, AlertSeverity } from '../types';

export interface IPacingAlertDocument extends Document {
  campaignId: string;
  alertType: AlertThreshold;
  threshold: number;
  currentValue: number;
  severity: AlertSeverity;
  message: string;
  isTriggered: boolean;
  lastTriggered?: Date;
  notificationChannels: string[];
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PacingAlertSchema = new Schema<IPacingAlertDocument>(
  {
    campaignId: {
      type: String,
      required: true,
      index: true
    },
    alertType: {
      type: String,
      enum: Object.values(AlertThreshold),
      required: true
    },
    threshold: {
      type: Number,
      required: true
    },
    currentValue: {
      type: Number,
      default: 0
    },
    severity: {
      type: String,
      enum: Object.values(AlertSeverity),
      default: AlertSeverity.WARNING
    },
    message: {
      type: String,
      required: true
    },
    isTriggered: {
      type: Boolean,
      default: false
    },
    lastTriggered: {
      type: Date
    },
    notificationChannels: {
      type: [String],
      default: ['email'],
      enum: ['email', 'sms', 'push', 'webhook', 'slack']
    },
    isEnabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
PacingAlertSchema.index({ campaignId: 1, alertType: 1 }, { unique: true });
PacingAlertSchema.index({ isTriggered: 1, isEnabled: 1 });
PacingAlertSchema.index({ severity: 1 });
PacingAlertSchema.index({ lastTriggered: -1 });

// Method to check if alert should trigger
PacingAlertSchema.methods.shouldTrigger = function (currentValue: number): boolean {
  this.currentValue = currentValue;

  switch (this.alertType) {
    case AlertThreshold.DAILY_BUDGET:
    case AlertThreshold.TOTAL_BUDGET:
      return currentValue >= this.threshold;
    case AlertThreshold.PACE_DEVIATION:
      return Math.abs(currentValue - 100) >= this.threshold;
    case AlertThreshold.SPEND_RATE:
      return currentValue > this.threshold;
    default:
      return false;
  }
};

// Method to trigger alert
PacingAlertSchema.methods.trigger = function (): void {
  this.isTriggered = true;
  this.lastTriggered = new Date();
};

// Method to reset alert
PacingAlertSchema.methods.reset = function (): void {
  this.isTriggered = false;
};

// Method to generate alert message
PacingAlertSchema.methods.generateMessage = function (): string {
  switch (this.alertType) {
    case AlertThreshold.DAILY_BUDGET:
      return `Daily budget threshold reached: ${this.currentValue}/${this.threshold}`;
    case AlertThreshold.TOTAL_BUDGET:
      return `Total budget threshold reached: ${this.currentValue}/${this.threshold}`;
    case AlertThreshold.PACE_DEVIATION:
      return `Pace deviation alert: ${this.currentValue}% (threshold: ${this.threshold}%)`;
    case AlertThreshold.SPEND_RATE:
      return `High spend rate: ${this.currentValue} (threshold: ${this.threshold})`;
    default:
      return `Alert triggered for campaign ${this.campaignId}`;
  }
};

// Static method to find active alerts for a campaign
PacingAlertSchema.statics.findActiveAlerts = function (campaignId: string) {
  return this.find({
    campaignId,
    isEnabled: true,
    isTriggered: true
  });
};

// Static method to get all alerts for a campaign
PacingAlertSchema.statics.getCampaignAlerts = function (campaignId: string) {
  return this.find({ campaignId }).sort({ createdAt: -1 });
};

// Static method to get triggered alerts count by severity
PacingAlertSchema.statics.getTriggeredAlertsBySeverity = async function () {
  const result = await this.aggregate([
    {
      $match: {
        isTriggered: true,
        isEnabled: true
      }
    },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }
    }
  ]);

  const counts: Record<string, number> = {};
  result.forEach((item) => {
    counts[item._id] = item.count;
  });

  return counts;
};

// Static method to create default alerts for a campaign
PacingAlertSchema.statics.createDefaultAlerts = async function (campaignId: string, dailyBudget: number, totalBudget: number) {
  const defaultAlerts = [
    {
      campaignId,
      alertType: AlertThreshold.DAILY_BUDGET,
      threshold: dailyBudget * 0.8,
      severity: AlertSeverity.WARNING,
      message: `Daily budget at 80%: ${dailyBudget * 0.8}/${dailyBudget}`,
      notificationChannels: ['email', 'push']
    },
    {
      campaignId,
      alertType: AlertThreshold.DAILY_BUDGET,
      threshold: dailyBudget * 0.95,
      severity: AlertSeverity.CRITICAL,
      message: `Daily budget at 95%: ${dailyBudget * 0.95}/${dailyBudget}`,
      notificationChannels: ['email', 'push', 'sms']
    },
    {
      campaignId,
      alertType: AlertThreshold.TOTAL_BUDGET,
      threshold: totalBudget * 0.9,
      severity: AlertSeverity.WARNING,
      message: `Total budget at 90%: ${totalBudget * 0.9}/${totalBudget}`,
      notificationChannels: ['email', 'push']
    },
    {
      campaignId,
      alertType: AlertThreshold.PACE_DEVIATION,
      threshold: 10,
      severity: AlertSeverity.WARNING,
      message: 'Pace deviation exceeds 10%',
      notificationChannels: ['email']
    },
    {
      campaignId,
      alertType: AlertThreshold.PACE_DEVIATION,
      threshold: 20,
      severity: AlertSeverity.CRITICAL,
      message: 'Pace deviation exceeds 20%',
      notificationChannels: ['email', 'push']
    },
    {
      campaignId,
      alertType: AlertThreshold.SPEND_RATE,
      threshold: 1.2,
      severity: AlertSeverity.INFO,
      message: 'Spend rate increased significantly',
      notificationChannels: ['push']
    }
  ];

  return this.insertMany(defaultAlerts);
};

export const PacingAlert = mongoose.model<IPacingAlertDocument>(
  'PacingAlert',
  PacingAlertSchema
);