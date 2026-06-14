import mongoose, { Document, Schema } from 'mongoose';

// Fingerprint feature interface
export interface IFingerprintFeature {
  name: string;
  value: string | number | boolean;
  hash?: string;
  stable: boolean;
  firstSeen: Date;
  lastSeen: Date;
}

// Fingerprint document interface
export interface IFingerprint extends Document {
  fingerprintId: string;
  deviceId: string;
  features: IFingerprintFeature[];
  hash: string;
  confidence: number;
  version: string;
  sources: string[];
  lastUpdated: Date;
  isActive: boolean;
  matchCount: number;
  lastMatchAt?: Date;
  metadata: {
    userAgent?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
    browser?: string;
    [key: string]: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Fingerprint schema
const FingerprintSchema = new Schema<IFingerprint>(
  {
    fingerprintId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    deviceId: {
      type: String,
      required: true,
      index: true
    },
    features: [{
      name: { type: String, required: true },
      value: { type: Schema.Types.Mixed, required: true },
      hash: { type: String },
      stable: { type: Boolean, default: true },
      firstSeen: { type: Date, default: Date.now },
      lastSeen: { type: Date, default: Date.now }
    }],
    hash: {
      type: String,
      required: true,
      index: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50
    },
    version: {
      type: String,
      default: '1.0'
    },
    sources: {
      type: [String],
      default: []
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    matchCount: {
      type: Number,
      default: 0
    },
    lastMatchAt: {
      type: Date
    },
    metadata: {
      userAgent: String,
      screenResolution: String,
      timezone: String,
      language: String,
      platform: String,
      browser: String
    }
  },
  {
    timestamps: true,
    collection: 'fingerprints'
  }
);

// Indexes
FingerprintSchema.index({ deviceId: 1, hash: 1 });
FingerprintSchema.index({ hash: 1, confidence: -1 });
FingerprintSchema.index({ isActive: 1, lastUpdated: -1 });
FingerprintSchema.index({ matchCount: -1 });

// Methods
FingerprintSchema.methods.updateFeatures = function(features: IFingerprintFeature[]) {
  features.forEach(newFeature => {
    const existingFeature = this.features.find(f => f.name === newFeature.name);
    if (existingFeature) {
      existingFeature.value = newFeature.value;
      existingFeature.hash = newFeature.hash;
      existingFeature.lastSeen = new Date();
    } else {
      this.features.push({
        ...newFeature,
        firstSeen: new Date(),
        lastSeen: new Date()
      });
    }
  });
  this.lastUpdated = new Date();
  return this.save();
};

FingerprintSchema.methods.incrementMatchCount = function() {
  this.matchCount += 1;
  this.lastMatchAt = new Date();
  return this.save();
};

// Static methods
FingerprintSchema.statics.findByFingerprintId = function(fingerprintId: string) {
  return this.findOne({ fingerprintId });
};

FingerprintSchema.statics.findByDeviceId = function(deviceId: string) {
  return this.find({ deviceId, isActive: true }).sort({ lastUpdated: -1 });
};

FingerprintSchema.statics.findByHash = function(hash: string) {
  return this.find({ hash, isActive: true }).sort({ confidence: -1 });
};

FingerprintSchema.statics.findSimilarFingerprints = function(hash: string, threshold: number = 0.8) {
  // Find fingerprints with similar hashes
  return this.find({
    hash: { $regex: new RegExp(`^${hash.substring(0, Math.floor(hash.length * threshold))}`) },
    isActive: true
  }).sort({ confidence: -1 });
};

FingerprintSchema.statics.getFingerprintStats = async function(deviceId: string) {
  const stats = await this.aggregate([
    { $match: { deviceId } },
    {
      $group: {
        _id: null,
        totalFingerprints: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' },
        maxConfidence: { $max: '$confidence' },
        totalMatches: { $sum: '$matchCount' },
        uniqueHashes: { $addToSet: '$hash' }
      }
    }
  ]);
  return stats[0] || null;
};

export const Fingerprint = mongoose.model<IFingerprint>('Fingerprint', FingerprintSchema);