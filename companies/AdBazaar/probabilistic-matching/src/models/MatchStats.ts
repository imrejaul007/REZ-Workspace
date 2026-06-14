import mongoose, { Document, Schema } from 'mongoose';

// Match statistics by type
export interface IMatchStatsByType {
  type: string;
  count: number;
  avgProbability: number;
  avgConfidence: number;
}

// Match statistics by source
export interface IMatchStatsBySource {
  source: string;
  count: number;
  avgProbability: number;
}

// MatchStats document interface
export interface IMatchStats extends Document {
  date: Date;
  statsId: string;
  totalMatches: number;
  newMatches: number;
  confirmedMatches: number;
  rejectedMatches: number;
  mergedMatches: number;
  avgProbability: number;
  avgConfidence: number;
  byType: IMatchStatsByType[];
  bySource: IMatchStatsBySource[];
  highConfidenceMatches: number;
  mediumConfidenceMatches: number;
  lowConfidenceMatches: number;
  uniqueDevices: number;
  uniqueUsers: number;
  graphOperations: number;
  fingerprintOperations: number;
  mergeOperations: number;
  processingTimeMs: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  accuracy: {
    truePositives: number;
    falsePositives: number;
    falseNegatives: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// MatchStats schema
const MatchStatsSchema = new Schema<IMatchStats>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true
    },
    statsId: {
      type: String,
      required: true,
      unique: true
    },
    totalMatches: {
      type: Number,
      default: 0
    },
    newMatches: {
      type: Number,
      default: 0
    },
    confirmedMatches: {
      type: Number,
      default: 0
    },
    rejectedMatches: {
      type: Number,
      default: 0
    },
    mergedMatches: {
      type: Number,
      default: 0
    },
    avgProbability: {
      type: Number,
      default: 0
    },
    avgConfidence: {
      type: Number,
      default: 0
    },
    byType: [{
      type: { type: String, required: true },
      count: { type: Number, default: 0 },
      avgProbability: { type: Number, default: 0 },
      avgConfidence: { type: Number, default: 0 }
    }],
    bySource: [{
      source: { type: String, required: true },
      count: { type: Number, default: 0 },
      avgProbability: { type: Number, default: 0 }
    }],
    highConfidenceMatches: {
      type: Number,
      default: 0
    },
    mediumConfidenceMatches: {
      type: Number,
      default: 0
    },
    lowConfidenceMatches: {
      type: Number,
      default: 0
    },
    uniqueDevices: {
      type: Number,
      default: 0
    },
    uniqueUsers: {
      type: Number,
      default: 0
    },
    graphOperations: {
      type: Number,
      default: 0
    },
    fingerprintOperations: {
      type: Number,
      default: 0
    },
    mergeOperations: {
      type: Number,
      default: 0
    },
    processingTimeMs: {
      avg: { type: Number, default: 0 },
      p50: { type: Number, default: 0 },
      p95: { type: Number, default: 0 },
      p99: { type: Number, default: 0 }
    },
    accuracy: {
      truePositives: { type: Number, default: 0 },
      falsePositives: { type: Number, default: 0 },
      falseNegatives: { type: Number, default: 0 },
      precision: { type: Number, default: 0 },
      recall: { type: Number, default: 0 },
      f1Score: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
    collection: 'match_stats'
  }
);

// Indexes
MatchStatsSchema.index({ statsId: 1 });
MatchStatsSchema.index({ date: -1 });
MatchStatsSchema.index({ 'accuracy.precision': -1 });

// Methods
MatchStatsSchema.methods.calculateAccuracy = function() {
  const { truePositives, falsePositives, falseNegatives } = this.accuracy;

  if (truePositives + falsePositives > 0) {
    this.accuracy.precision = truePositives / (truePositives + falsePositives);
  }

  if (truePositives + falseNegatives > 0) {
    this.accuracy.recall = truePositives / (truePositives + falseNegatives);
  }

  if (this.accuracy.precision + this.accuracy.recall > 0) {
    this.accuracy.f1Score = 2 * (this.accuracy.precision * this.accuracy.recall) /
      (this.accuracy.precision + this.accuracy.recall);
  }

  return this;
};

MatchStatsSchema.methods.addMatchResult = function(result: {
  type: string;
  source: string;
  probability: number;
  confidence: number;
  processingTimeMs: number;
}) {
  this.totalMatches += 1;

  if (result.confidence >= 85) {
    this.highConfidenceMatches += 1;
  } else if (result.confidence >= 60) {
    this.mediumConfidenceMatches += 1;
  } else {
    this.lowConfidenceMatches += 1;
  }

  // Update by-type stats
  const typeStat = this.byType.find(t => t.type === result.type);
  if (typeStat) {
    typeStat.count += 1;
    typeStat.avgProbability = (typeStat.avgProbability * (typeStat.count - 1) + result.probability) / typeStat.count;
    typeStat.avgConfidence = (typeStat.avgConfidence * (typeStat.count - 1) + result.confidence) / typeStat.count;
  } else {
    this.byType.push({
      type: result.type,
      count: 1,
      avgProbability: result.probability,
      avgConfidence: result.confidence
    });
  }

  // Update by-source stats
  const sourceStat = this.bySource.find(s => s.source === result.source);
  if (sourceStat) {
    sourceStat.count += 1;
    sourceStat.avgProbability = (sourceStat.avgProbability * (sourceStat.count - 1) + result.probability) / sourceStat.count;
  } else {
    this.bySource.push({
      source: result.source,
      count: 1,
      avgProbability: result.probability
    });
  }

  // Update averages
  this.avgProbability = (this.avgProbability * (this.totalMatches - 1) + result.probability) / this.totalMatches;
  this.avgConfidence = (this.avgConfidence * (this.totalMatches - 1) + result.confidence) / this.totalMatches;

  // Update processing time
  this.processingTimeMs.avg = (this.processingTimeMs.avg * (this.totalMatches - 1) + result.processingTimeMs) / this.totalMatches;

  return this;
};

// Static methods
MatchStatsSchema.statics.getOrCreateForDate = async function(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  let stats = await this.findOne({ date: startOfDay });

  if (!stats) {
    const statsId = `stats_${startOfDay.toISOString().split('T')[0]}`;
    stats = new this({
      date: startOfDay,
      statsId
    });
    await stats.save();
  }

  return stats;
};

MatchStatsSchema.statics.getStatsRange = function(startDate: Date, endDate: Date) {
  return this.find({
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

MatchStatsSchema.statics.getLatestStats = function() {
  return this.findOne().sort({ date: -1 });
};

MatchStatsSchema.statics.getWeeklyStats = function() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return this.find({ date: { $gte: oneWeekAgo } }).sort({ date: 1 });
};

MatchStatsSchema.statics.getMonthlyStats = function() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return this.find({ date: { $gte: oneMonthAgo } }).sort({ date: 1 });
};

export const MatchStats = mongoose.model<IMatchStats>('MatchStats', MatchStatsSchema);