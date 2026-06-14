import mongoose, { Schema, Document } from 'mongoose';

export interface IFillAlert extends Document {
  inventoryId?: string;
  inventoryName?: string;
  threshold: number;
  condition: 'above' | 'below' | 'equals';
  notification: {
    email?: string;
    webhook?: string;
    slack?: string;
    sms?: string;
  };
  status: 'active' | 'paused' | 'triggered' | 'disabled';
  lastTriggeredAt?: Date;
  triggeredCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema({
  email: { type: String, required: false },
  webhook: { type: String, required: false },
  slack: { type: String, required: false },
  sms: { type: String, required: false }
}, { _id: false });

const FillAlertSchema = new Schema<IFillAlert>(
  {
    inventoryId: {
      type: String,
      required: false,
      index: true
    },
    inventoryName: {
      type: String,
      required: false
    },
    threshold: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    condition: {
      type: String,
      enum: ['above', 'below', 'equals'],
      required: true
    },
    notification: {
      type: NotificationSchema,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'triggered', 'disabled'],
      default: 'active',
      index: true
    },
    lastTriggeredAt: {
      type: Date,
      required: false
    },
    triggeredCount: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'fill_alerts'
  }
);

// Indexes
FillAlertSchema.index({ status: 1, inventoryId: 1 });
FillAlertSchema.index({ createdBy: 1 });

// Method to check if alert should trigger
FillAlertSchema.methods.shouldTrigger = function(currentRate: number): boolean {
  switch (this.condition) {
    case 'above':
      return currentRate > this.threshold;
    case 'below':
      return currentRate < this.threshold;
    case 'equals':
      return Math.abs(currentRate - this.threshold) < 0.5;
    default:
      return false;
  }
};

// Method to trigger alert
FillAlertSchema.methods.trigger = async function(): Promise<void> {
  this.status = 'triggered';
  this.lastTriggeredAt = new Date();
  this.triggeredCount += 1;
  await this.save();
};

export const FillAlert = mongoose.model<IFillAlert>('FillAlert', FillAlertSchema);
