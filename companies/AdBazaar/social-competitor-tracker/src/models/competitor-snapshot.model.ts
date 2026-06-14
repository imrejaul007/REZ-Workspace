import mongoose, { Schema, Document, Model } from 'mongoose';

// CompetitorSnapshot - Daily metrics snapshots for tracking changes
export interface ICompetitorSnapshot extends Document {
  competitorId: mongoose.Types.ObjectId;
  platform: string;
  date: Date;
  followers: number;
  following: number;
  posts: number;
  avgLikes: number;
  avgComments: number;
  engagementRate: number;
  postingFrequency: number; // posts per week
  createdAt: Date;
}

const CompetitorSnapshotSchema = new Schema<ICompetitorSnapshot>(
  {
    competitorId: { type: Schema.Types.ObjectId, ref: 'Competitor', required: true, index: true },
    platform: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    avgLikes: { type: Number, default: 0 },
    avgComments: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    postingFrequency: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for efficient queries
CompetitorSnapshotSchema.index({ competitorId: 1, platform: 1, date: -1 });
CompetitorSnapshotSchema.index({ competitorId: 1, date: -1 });

// Static methods
CompetitorSnapshotSchema.statics.findLatest = function (competitorId: string, platform: string) {
  return this.findOne({ competitorId, platform }).sort({ date: -1 }).exec();
};

CompetitorSnapshotSchema.statics.findByDateRange = function (
  competitorId: string,
  platform: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    competitorId,
    platform,
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: 1 })
    .exec();
};

CompetitorSnapshotSchema.statics.getGrowthRate = async function (
  competitorId: string,
  platform: string,
  days: number = 30
) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  const snapshots = await this.find({
    competitorId,
    platform,
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: 1 })
    .exec();

  if (snapshots.length < 2) return null;

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];

  const followerGrowth = last.followers - first.followers;
  const growthRate = first.followers > 0 ? (followerGrowth / first.followers) * 100 : 0;

  return {
    followerGrowth,
    growthRate: Math.round(growthRate * 100) / 100,
    startFollowers: first.followers,
    endFollowers: last.followers,
    period: days,
    snapshotCount: snapshots.length,
  };
};

export const CompetitorSnapshot: Model<ICompetitorSnapshot> = mongoose.model<ICompetitorSnapshot>(
  'CompetitorSnapshot',
  CompetitorSnapshotSchema
);