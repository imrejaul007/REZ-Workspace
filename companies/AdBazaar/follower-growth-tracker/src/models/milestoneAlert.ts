import mongoose, { Schema, Document } from 'mongoose';

export interface IMilestoneAlert {
  id: string;
  accountId: string;
  milestone: number;
  reached: boolean;
  reachedAt?: Date;
  notified: boolean;
}

export interface IMilestoneAlertDoc extends IMilestoneAlert, Document {}

const MilestoneAlertSchema = new Schema<IMilestoneAlertDoc>(
  {
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    milestone: {
      type: Number,
      required: true,
    },
    reached: {
      type: Boolean,
      default: false,
    },
    reachedAt: {
      type: Date,
    },
    notified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
MilestoneAlertSchema.index({ accountId: 1, milestone: 1 });
MilestoneAlertSchema.index({ reached: 1, notified: 1 });

export const MilestoneAlert = mongoose.model<IMilestoneAlertDoc>(
  'MilestoneAlert',
  MilestoneAlertSchema
);
