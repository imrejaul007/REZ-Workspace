import mongoose, { Document, Schema } from 'mongoose';

export type HistoryStatus = 'success' | 'failed' | 'skipped' | 'partial';

export interface IHistory extends Document {
  _id: mongoose.Types.ObjectId;
  triggerId: mongoose.Types.ObjectId;
  userId: string;
  status: HistoryStatus;
  triggerType: string;
  eventData: Record<string, unknown>;
  conditionsEvaluated: {
    condition: string;
    result: boolean;
    actualValue?: unknown;
  }[];
  actionsExecuted: {
    actionType: string;
    actionName: string;
    status: 'success' | 'failed' | 'skipped';
    result?: Record<string, unknown>;
    error?: string;
    duration: number;
  }[];
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const HistorySchema = new Schema<IHistory>(
  {
    triggerId: { type: Schema.Types.ObjectId, ref: 'Trigger', required: true, index: true },
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['success', 'failed', 'skipped', 'partial'],
      default: 'success',
      index: true
    },
    triggerType: { type: String, required: true },
    eventData: { type: Map, of: Schema.Types.Mixed, default: {} },
    conditionsEvaluated: [
      {
        condition: { type: String, required: true },
        result: { type: Boolean, required: true },
        actualValue: { type: Schema.Types.Mixed }
      }
    ],
    actionsExecuted: [
      {
        actionType: { type: String, required: true },
        actionName: { type: String, required: true },
        status: { type: String, enum: ['success', 'failed', 'skipped'], required: true },
        result: { type: Map, of: Schema.Types.Mixed },
        error: String,
        duration: { type: Number, required: true }
      }
    ],
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    duration: Number,
    error: String,
    metadata: { type: Map, of: Schema.Types.Mixed }
  },
  { timestamps: true }
);

HistorySchema.index({ triggerId: 1, createdAt: -1 });
HistorySchema.index({ userId: 1, createdAt: -1 });
HistorySchema.index({ triggerId: 1, status: 1 });

export const History = mongoose.model<IHistory>('History', HistorySchema);