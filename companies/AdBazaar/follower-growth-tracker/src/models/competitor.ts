import mongoose, { Schema, Document } from 'mongoose';

export interface ICompetitor {
  accountId: string;
  competitorId: string;
  competitorUsername: string;
  competitorName: string;
  lastSyncedAt: Date;
  snapshots: {
    date: Date;
    followers: number;
    posts: number;
    avgLikes: number;
    avgComments: number;
  }[];
}

export interface ICompetitorDoc extends ICompetitor, Document {}

const CompetitorSnapshotSchema = new Schema(
  {
    date: { type: Date, required: true },
    followers: { type: Number, required: true },
    posts: { type: Number, required: true },
    avgLikes: { type: Number, default: 0 },
    avgComments: { type: Number, default: 0 },
  },
  { _id: false }
);

const CompetitorSchema = new Schema<ICompetitorDoc>(
  {
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    competitorId: {
      type: String,
      required: true,
    },
    competitorUsername: {
      type: String,
      required: true,
    },
    competitorName: {
      type: String,
      default: '',
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    snapshots: {
      type: [CompetitorSnapshotSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index
CompetitorSchema.index({ accountId: 1, competitorId: 1 }, { unique: true });

export const Competitor = mongoose.model<ICompetitorDoc>(
  'Competitor',
  CompetitorSchema
);
