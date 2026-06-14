import mongoose, { Document, Schema } from 'mongoose';

export type ActionType =
  | 'send_notification'
  | 'send_email'
  | 'webhook'
  | 'update_record'
  | 'create_record'
  | 'delete_record'
  | 'http_request'
  | 'delay'
  | 'script'
  | 'workflow';

export interface IAction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  description?: string;
  type: ActionType;
  config: Record<string, unknown>;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoff: 'linear' | 'exponential';
  };
  timeout?: number; // Timeout in milliseconds
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActionSchema = new Schema<IAction>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 200 },
    description: String,
    type: {
      type: String,
      enum: [
        'send_notification',
        'send_email',
        'webhook',
        'update_record',
        'create_record',
        'delete_record',
        'http_request',
        'delay',
        'script',
        'workflow'
      ],
      required: true
    },
    config: { type: Schema.Types.Mixed, default: {} },
    retryConfig: {
      maxRetries: { type: Number, default: 3 },
      retryDelay: { type: Number, default: 1000 },
      backoff: { type: String, enum: ['linear', 'exponential'], default: 'exponential' }
    },
    timeout: { type: Number, default: 30000 },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

ActionSchema.index({ userId: 1, type: 1 });
ActionSchema.index({ userId: 1, isActive: 1 });

export const Action = mongoose.model<IAction>('Action', ActionSchema);