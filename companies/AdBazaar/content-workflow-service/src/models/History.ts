import mongoose, { Document, Schema } from 'mongoose';

export interface IHistory extends Document {
  _id: mongoose.Types.ObjectId;
  historyId: string;
  workflowId: string;
  stageId?: string;
  action: string;
  actorId: string;
  actorName: string;
  previousState?: any;
  newState?: any;
  comments?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const HistorySchema = new Schema<IHistory>(
  {
    historyId: { type: String, required: true, unique: true, index: true },
    workflowId: { type: String, required: true, index: true },
    stageId: { type: String },
    action: { type: String, required: true },
    actorId: { type: String, required: true },
    actorName: { type: String, required: true },
    previousState: { type: Schema.Types.Mixed },
    newState: { type: Schema.Types.Mixed },
    comments: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

HistorySchema.index({ workflowId: 1, createdAt: -1 });
HistorySchema.index({ actorId: 1, createdAt: -1 });

export const History = mongoose.model<IHistory>('History', HistorySchema);