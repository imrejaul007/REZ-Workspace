import mongoose, { Document, Schema } from 'mongoose';

// Brand safety violation types
export enum ViolationType {
  EXPLICIT_CONTENT = 'explicit_content',
  HATE_SPEECH = 'hate_speech',
  VIOLENCE = 'violence',
  ILLEGAL_CONTENT = 'illegal_content',
  CONTROVERSIAL = 'controversial',
  SENSITIVE_TOPIC = 'sensitive_topic',
  COMPETITOR_ADJACENCY = 'competitor_adjacency',
  FRAUDULENT = 'fraudulent',
  MISLEADING = 'misleading'
}

// Violation severity levels
export enum SeverityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Check status
export enum CheckStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  WARNING = 'warning',
  PENDING = 'pending'
}

// Individual brand safety check result
export interface IBrandSafetyCheck {
  checkId: string;
  checkType: string;
  name: string;
  status: CheckStatus;
  score: number; // 0-100
  violations: {
    type: ViolationType;
    severity: SeverityLevel;
    description: string;
    url?: string;
    timestamp: Date;
  }[];
  metadata?: Record<string, unknown>;
}

// Brand safety document interface
export interface IBrandSafety extends Document {
  campaignId: string;
  timestamp: Date;
  overallScore: number; // 0-100
  overallStatus: CheckStatus;
  checks: IBrandSafetyCheck[];
  contentCategories: {
    category: string;
    risk: number;
    exposure: number;
  }[];
  contextualAnalysis: {
    topic: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    relevance: number;
  }[];
  viewabilityScore?: number;
  brandSuitabilityScore?: number;
  recommendations?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Brand safety schema
const brandSafetySchema = new Schema<IBrandSafety>(
  {
    campaignId: {
      type: String,
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    overallStatus: {
      type: String,
      enum: Object.values(CheckStatus),
      required: true
    },
    checks: [
      {
        checkId: {
          type: String,
          required: true
        },
        checkType: {
          type: String,
          required: true
        },
        name: {
          type: String,
          required: true
        },
        status: {
          type: String,
          enum: Object.values(CheckStatus),
          required: true
        },
        score: {
          type: Number,
          min: 0,
          max: 100
        },
        violations: [
          {
            type: {
              type: String,
              enum: Object.values(ViolationType)
            },
            severity: {
              type: String,
              enum: Object.values(SeverityLevel)
            },
            description: String,
            url: String,
            timestamp: Date
          }
        ],
        metadata: { type: Schema.Types.Mixed }
      }
    ],
    contentCategories: [
      {
        category: String,
        risk: Number,
        exposure: Number
      }
    ],
    contextualAnalysis: [
      {
        topic: String,
        sentiment: String,
        relevance: Number
      }
    ],
    viewabilityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    brandSuitabilityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    recommendations: [String],
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

// Indexes
brandSafetySchema.index({ campaignId: 1, timestamp: -1 });
brandSafetySchema.index({ overallScore: 1 });
brandSafetySchema.index({ overallStatus: 1 });
brandSafetySchema.index({ 'checks.checkType': 1 });

export const BrandSafety = mongoose.model<IBrandSafety>('BrandSafety', brandSafetySchema);

// Brand safety settings per advertiser
export interface IBrandSafetySettings extends Document {
  advertiserId: string;
  brandName: string;
  vertical: string;
  blockedCategories: ViolationType[];
  competitorDomains: string[];
  customKeywords: {
    positive: string[];
    negative: string[];
  };
  minimumScoreThreshold: number;
  autoPauseEnabled: boolean;
  notificationSettings: {
    email: boolean;
    webhook: boolean;
    threshold: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const brandSafetySettingsSchema = new Schema<IBrandSafetySettings>(
  {
    advertiserId: {
      type: String,
      required: true,
      unique: true
    },
    brandName: {
      type: String,
      required: true
    },
    vertical: {
      type: String,
      required: true
    },
    blockedCategories: [
      {
        type: String,
        enum: Object.values(ViolationType)
      }
    ],
    competitorDomains: [String],
    customKeywords: {
      positive: [String],
      negative: [String]
    },
    minimumScoreThreshold: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    autoPauseEnabled: {
      type: Boolean,
      default: true
    },
    notificationSettings: {
      email: { type: Boolean, default: true },
      webhook: { type: Boolean, default: false },
      threshold: { type: Number, default: 50 }
    }
  },
  {
    timestamps: true
  }
);

export const BrandSafetySettings = mongoose.model<IBrandSafetySettings>(
  'BrandSafetySettings',
  brandSafetySettingsSchema
);