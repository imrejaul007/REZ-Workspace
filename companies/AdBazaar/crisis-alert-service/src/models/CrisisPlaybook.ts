/**
 * CrisisPlaybook Model - Mongoose schema for crisis response playbooks
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum NotificationChannel {
  SLACK = 'slack',
  EMAIL = 'email',
}

export interface ITriggerConditions {
  sentimentThreshold?: number;
  mentionThreshold?: number;
  velocityThreshold?: number;
  keywords?: string[];
}

export interface IPlaybookStep {
  order: number;
  action: string;
  assignee?: string;
  delayMinutes?: number;
}

export interface IPlaybookNotification {
  channel: NotificationChannel;
  recipients: string[];
  template: string;
}

export interface ICrisisPlaybook extends Document {
  playbookId: string;
  name: string;
  triggerConditions: ITriggerConditions;
  steps: IPlaybookStep[];
  notifications: IPlaybookNotification[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const triggerConditionsSchema = new Schema<ITriggerConditions>(
  {
    sentimentThreshold: Number,
    mentionThreshold: Number,
    velocityThreshold: Number,
    keywords: [{ type: String }],
  },
  { _id: false }
);

const playbookStepSchema = new Schema<IPlaybookStep>(
  {
    order: { type: Number, required: true },
    action: { type: String, required: true },
    assignee: String,
    delayMinutes: { type: Number, default: 0 },
  },
  { _id: false }
);

const playbookNotificationSchema = new Schema<IPlaybookNotification>(
  {
    channel: {
      type: String,
      enum: Object.values(NotificationChannel),
      required: true,
    },
    recipients: [{ type: String, required: true }],
    template: { type: String, required: true },
  },
  { _id: false }
);

const crisisPlaybookSchema = new Schema<ICrisisPlaybook>(
  {
    playbookId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    triggerConditions: { type: triggerConditionsSchema, required: true },
    steps: [{ type: playbookStepSchema, required: true }],
    notifications: [{ type: playbookNotificationSchema, required: true }],
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
crisisPlaybookSchema.index({ name: 'text' });

export const CrisisPlaybook = mongoose.model<ICrisisPlaybook>('CrisisPlaybook', crisisPlaybookSchema);
export default CrisisPlaybook;
