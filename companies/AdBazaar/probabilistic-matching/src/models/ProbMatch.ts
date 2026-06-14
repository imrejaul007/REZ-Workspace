import mongoose, { Document, Schema } from 'mongoose';

// Feature weights for probabilistic matching
export interface IMatchFeature {
  name: string;
  value: string | number | boolean;
  weight: number;
  similarity?: number;
}

// Model configuration
export interface IModelConfig {
  algorithm: 'naive-bayes' | 'logistic-regression' | 'random-forest' | 'neural-network';
  thresholds: {
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
  weights: {
    ip: number;
    userAgent: number;
    deviceFingerprint: number;
    behavioral: number;
    temporal: number;
    geographic: number;
  };
}

// ProbMatch document interface
export interface IProbMatch extends Document {
  matchId: string;
  deviceIds: string[];
  probability: number;
  confidence: number;
  features: IMatchFeature[];
  model: IModelConfig;
  status: 'pending' | 'confirmed' | 'rejected' | 'merged';
  sources: string[];
  firstSeen: Date;
  lastSeen: Date;
  mergeCount: number;
  mergedInto?: string;
  metadata: {
    adId?: string;
    campaignId?: string;
    publisherId?: string;
    timestamp: Date;
    [key: string]: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ProbMatch schema
const ProbMatchSchema = new Schema<IProbMatch>(
  {
    matchId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    deviceIds: {
      type: [String],
      required: true,
      index: true
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    features: [{
      name: { type: String, required: true },
      value: { type: Schema.Types.Mixed, required: true },
      weight: { type: Number, default: 1 },
      similarity: { type: Number, min: 0, max: 1 }
    }],
    model: {
      algorithm: {
        type: String,
        enum: ['naive-bayes', 'logistic-regression', 'random-forest', 'neural-network'],
        default: 'naive-bayes'
      },
      thresholds: {
        highConfidence: { type: Number, default: 85 },
        mediumConfidence: { type: Number, default: 60 },
        lowConfidence: { type: Number, default: 40 }
      },
      weights: {
        ip: { type: Number, default: 0.15 },
        userAgent: { type: Number, default: 0.15 },
        deviceFingerprint: { type: Number, default: 0.25 },
        behavioral: { type: Number, default: 0.20 },
        temporal: { type: Number, default: 0.15 },
        geographic: { type: Number, default: 0.10 }
      }
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'merged'],
      default: 'pending',
      index: true
    },
    sources: {
      type: [String],
      default: []
    },
    firstSeen: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    mergeCount: {
      type: Number,
      default: 0
    },
    mergedInto: {
      type: String,
      index: true
    },
    metadata: {
      adId: String,
      campaignId: String,
      publisherId: String,
      timestamp: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true,
    collection: 'prob_matches'
  }
);

// Indexes
ProbMatchSchema.index({ deviceIds: 1 });
ProbMatchSchema.index({ probability: -1 });
ProbMatchSchema.index({ confidence: -1 });
ProbMatchSchema.index({ status: 1, createdAt: -1 });
ProbMatchSchema.index({ firstSeen: -1, lastSeen: 1 });

// Pre-save hook
ProbMatchSchema.pre('save', function(next) {
  if (this.isModified('lastSeen')) {
    this.lastSeen = new Date();
  }
  next();
});

// Static methods
ProbMatchSchema.statics.findByMatchId = function(matchId: string) {
  return this.findOne({ matchId });
};

ProbMatchSchema.statics.findByDeviceId = function(deviceId: string) {
  return this.findOne({ deviceIds: deviceId });
};

ProbMatchSchema.statics.findByProbabilityRange = function(min: number, max: number) {
  return this.find({ probability: { $gte: min, $lte: max } });
};

ProbMatchSchema.statics.findHighConfidence = function(threshold: number = 85) {
  return this.find({ confidence: { $gte: threshold } });
};

ProbMatchSchema.statics.findPendingMatches = function() {
  return this.find({ status: 'pending' }).sort({ probability: -1 });
};

export const ProbMatch = mongoose.model<IProbMatch>('ProbMatch', ProbMatchSchema);