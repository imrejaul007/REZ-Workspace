import mongoose, { Schema, Document } from 'mongoose';

export interface IDormantIntent extends Document {
  dormantIntentId: string;
  userId: string;
  category: string;
  intentKey: string;
  lastSignalTimestamp: Date;
  daysDormant: number;
  revivalScore: number;
  idealTiming?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DormantIntentSchema = new Schema<IDormantIntent>(
  {
    dormantIntentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    intentKey: {
      type: String,
      required: true,
      index: true,
    },
    lastSignalTimestamp: {
      type: Date,
      required: true,
    },
    daysDormant: {
      type: Number,
      required: true,
      min: 0,
    },
    revivalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0,
    },
    idealTiming: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
DormantIntentSchema.index({ userId: 1, category: 1 });
DormantIntentSchema.index({ category: 1, daysDormant: -1 });
DormantIntentSchema.index({ revivalScore: -1, daysDormant: -1 });
DormantIntentSchema.index({ lastSignalTimestamp: -1 });
DormantIntentSchema.index({ idealTiming: 1, revivalScore: -1 });

// Virtual for dormancy status
DormantIntentSchema.virtual('isHighlyDormant').get(function () {
  return this.daysDormant > 30;
});

DormantIntentSchema.virtual('isRevivalReady').get(function () {
  return this.revivalScore > 0.7 && this.daysDormant > 7;
});

// Method to calculate days dormant
DormantIntentSchema.methods.calculateDaysDormant = function (): number {
  const now = new Date();
  const lastSignal = this.lastSignalTimestamp;
  return Math.floor((now.getTime() - lastSignal.getTime()) / (1000 * 60 * 60 * 24));
};

// Static method to find candidates for revival
DormantIntentSchema.statics.findRevivalCandidates = function (minScore = 0.5, minDays = 7) {
  return this.find({
    revivalScore: { $gte: minScore },
    daysDormant: { $gte: minDays },
  }).sort({ revivalScore: -1, daysDormant: -1 });
};

// Static method to find by user
DormantIntentSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId }).sort({ revivalScore: -1 });
};

// Static method to get dormancy statistics
DormantIntentSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgDaysDormant: { $avg: '$daysDormant' },
        avgRevivalScore: { $avg: '$revivalScore' },
        highRevivalCount: {
          $sum: { $cond: [{ $gte: ['$revivalScore', 0.7] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return stats;
};

// Static method to update dormancy for all records
DormantIntentSchema.statics.updateDormancy = async function () {
  const now = new Date();
  const dormantIntents = await this.find({});

  const bulkOps = dormantIntents.map((intent) => {
    const daysDormant = Math.floor(
      (now.getTime() - intent.lastSignalTimestamp.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      updateOne: {
        filter: { _id: intent._id },
        update: { $set: { daysDormant } },
      },
    };
  });

  if (bulkOps.length > 0) {
    await this.bulkWrite(bulkOps);
  }

  return bulkOps.length;
};

export const DormantIntent = mongoose.model<IDormantIntent>('DormantIntent', DormantIntentSchema);
