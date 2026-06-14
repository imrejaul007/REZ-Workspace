import mongoose, { Document, Schema } from 'mongoose';

// Update types
export type UpdateType =
  | 'field_enrichment'
  | 'contact_update'
  | 'company_update'
  | 'deal_update'
  | 'activity_log'
  | 'sentiment_analysis'
  | 'intent_detection'
  | 'health_score'
  | 'next_action';

// Update status
export type UpdateStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'ignored';

// AI Model used
export type AiModel = 'openai' | 'anthropic' | 'internal' | 'rule_based';

// Auto-update rule configuration
export interface IAutoUpdateRule {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  name: string;
  description?: string;

  // Trigger configuration
  trigger: {
    type: 'scheduled' | 'event' | 'manual';
    schedule?: string; // Cron expression
    eventType?: string; // For event triggers
    entityType?: 'contact' | 'company' | 'deal';
  };

  // Update configuration
  updateType: UpdateType;
  targetEntity: 'contact' | 'company' | 'deal';

  // Field mappings
  fieldMappings: {
    sourceField: string;
    targetField: string;
    transform?: 'uppercase' | 'lowercase' | 'titlecase' | 'date_format' | 'custom';
    transformFunction?: string;
  }[];

  // AI configuration
  aiConfig?: {
    model?: AiModel;
    prompt?: string;
    temperature?: number;
    maxTokens?: number;
  };

  // Enrichment sources
  enrichmentSources?: string[];

  // Filtering
  filterConditions?: {
    field: string;
    operator: string;
    value: string | number | boolean;
  }[];

  // Status
  isActive: boolean;
  priority: number;

  // Stats
  lastRunAt?: Date;
  lastSuccessAt?: Date;
  lastError?: string;
  runCount: number;
  successCount: number;
  failureCount: number;

  // Meta
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Update job record
export interface IUpdateJob {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Rule reference
  ruleId?: mongoose.Types.ObjectId;
  ruleName?: string;

  // Job details
  jobType: 'auto' | 'manual' | 'scheduled';
  updateType: UpdateType;

  // Target
  targetEntity: 'contact' | 'company' | 'deal';
  targetId: string;

  // Updates made
  updates: {
    field: string;
    oldValue?: unknown;
    newValue?: unknown;
    source: 'ai' | 'enrichment' | 'rule' | 'manual';
    confidence?: number;
  }[];

  // Status
  status: UpdateStatus;
  errorMessage?: string;

  // AI specific
  aiModel?: AiModel;
  aiConfidence?: number;
  aiReasoning?: string;

  // Timing
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Meta
  createdBy: string;
  createdAt: Date;
}

// Enrichment result cache
export interface IEnrichmentCache {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Entity
  entityType: 'contact' | 'company';
  entityId: string;
  email?: string;

  // Enrichment data
  enrichmentData: Record<string, unknown>;

  // Source tracking
  sources: string[];
  lastEnrichedAt: Date;

  // Stats
  refreshCount: number;

  // TTL
  expiresAt: Date;
}

// Activity summary (AI-generated)
export interface IActivitySummary {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Reference
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;

  // Summary content
  summary: string;
  keyPoints: string[];

  // Analysis
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number; // -1 to 1

  // Next actions
  recommendedActions: {
    action: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }[];

  // Confidence
  confidence: number;
  aiModel?: AiModel;

  // Period covered
  periodStart: Date;
  periodEnd: Date;

  // Meta
  createdAt: Date;
  updatedAt: Date;
}

// Health score history
export interface IHealthScore {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Entity
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;

  // Score components
  score: number; // 0-100
  components: {
    name: string;
    score: number;
    weight: number;
    reason: string;
  }[];

  // Factors
  positiveFactors: string[];
  negativeFactors: string[];
  riskFactors: string[];

  // Period
  period: 'daily' | 'weekly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;

  // Meta
  createdAt: Date;
}

// Mongoose Models
const AutoUpdateRuleSchema = new Schema<IAutoUpdateRule>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    trigger: {
      type: { type: String, enum: ['scheduled', 'event', 'manual'], required: true },
      schedule: String,
      eventType: String,
      entityType: { type: String, enum: ['contact', 'company', 'deal'] }
    },
    updateType: {
      type: String,
      enum: ['field_enrichment', 'contact_update', 'company_update', 'deal_update',
             'activity_log', 'sentiment_analysis', 'intent_detection', 'health_score', 'next_action'],
      required: true
    },
    targetEntity: {
      type: String,
      enum: ['contact', 'company', 'deal'],
      required: true
    },
    fieldMappings: [
      {
        sourceField: String,
        targetField: String,
        transform: String,
        transformFunction: String
      }
    ],
    aiConfig: {
      model: { type: String, enum: ['openai', 'anthropic', 'internal', 'rule_based'] },
      prompt: String,
      temperature: Number,
      maxTokens: Number
    },
    enrichmentSources: [String],
    filterConditions: [
      {
        field: String,
        operator: String,
        value: mongoose.Schema.Types.Mixed
      }
    ],
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    lastRunAt: Date,
    lastSuccessAt: Date,
    lastError: String,
    runCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);

AutoUpdateRuleSchema.index({ tenantId: 1, isActive: 1 });
AutoUpdateRuleSchema.index({ tenantId: 1, updateType: 1 });

const UpdateJobSchema = new Schema<IUpdateJob>(
  {
    tenantId: { type: String, required: true, index: true },
    ruleId: { type: Schema.Types.ObjectId, ref: 'AutoUpdateRule' },
    ruleName: String,
    jobType: { type: String, enum: ['auto', 'manual', 'scheduled'], required: true },
    updateType: {
      type: String,
      enum: ['field_enrichment', 'contact_update', 'company_update', 'deal_update',
             'activity_log', 'sentiment_analysis', 'intent_detection', 'health_score', 'next_action'],
      required: true
    },
    targetEntity: {
      type: String,
      enum: ['contact', 'company', 'deal'],
      required: true
    },
    targetId: { type: String, required: true },
    updates: [
      {
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        source: { type: String, enum: ['ai', 'enrichment', 'rule', 'manual'] },
        confidence: Number
      }
    ],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'ignored'],
      default: 'pending'
    },
    errorMessage: String,
    aiModel: String,
    aiConfidence: Number,
    aiReasoning: String,
    queuedAt: { type: Date, default: Date.now },
    startedAt: Date,
    completedAt: Date,
    createdBy: String
  },
  { timestamps: true }
);

UpdateJobSchema.index({ tenantId: 1, status: 1 });
UpdateJobSchema.index({ tenantId: 1, targetEntity: 1, targetId: 1 });
UpdateJobSchema.index({ tenantId: 1, updateType: 1, createdAt: -1 });

const EnrichmentCacheSchema = new Schema<IEnrichmentCache>(
  {
    tenantId: { type: String, required: true, index: true },
    entityType: { type: String, enum: ['contact', 'company'], required: true },
    entityId: { type: String, required: true },
    email: String,
    enrichmentData: { type: Map, of: mongoose.Schema.Types.Mixed },
    sources: [String],
    lastEnrichedAt: Date,
    refreshCount: { type: Number, default: 1 },
    expiresAt: Date
  },
  { timestamps: true }
);

EnrichmentCacheSchema.index({ tenantId: 1, entityType: 1, entityId: 1 }, { unique: true });
EnrichmentCacheSchema.index({ tenantId: 1, email: 1 });
EnrichmentCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ActivitySummarySchema = new Schema<IActivitySummary>(
  {
    tenantId: { type: String, required: true, index: true },
    entityType: { type: String, enum: ['contact', 'company', 'deal'], required: true },
    entityId: { type: String, required: true },
    summary: String,
    keyPoints: [String],
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
    sentimentScore: Number,
    recommendedActions: [
      {
        action: String,
        priority: { type: String, enum: ['high', 'medium', 'low'] },
        reason: String
      }
    ],
    confidence: Number,
    aiModel: String,
    periodStart: Date,
    periodEnd: Date
  },
  { timestamps: true }
);

ActivitySummarySchema.index({ tenantId: 1, entityType: 1, entityId: 1, periodStart: -1 });

const HealthScoreSchema = new Schema<IHealthScore>(
  {
    tenantId: { type: String, required: true, index: true },
    entityType: { type: String, enum: ['contact', 'company', 'deal'], required: true },
    entityId: { type: String, required: true },
    score: { type: Number, required: true },
    components: [
      {
        name: String,
        score: Number,
        weight: Number,
        reason: String
      }
    ],
    positiveFactors: [String],
    negativeFactors: [String],
    riskFactors: [String],
    period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    periodStart: Date,
    periodEnd: Date
  },
  { timestamps: true }
);

HealthScoreSchema.index({ tenantId: 1, entityType: 1, entityId: 1, periodStart: -1 });

// Export models
export const AutoUpdateRule = mongoose.model<IAutoUpdateRule>('AutoUpdateRule', AutoUpdateRuleSchema);
export const UpdateJob = mongoose.model<IUpdateJob>('UpdateJob', UpdateJobSchema);
export const EnrichmentCache = mongoose.model<IEnrichmentCache>('EnrichmentCache', EnrichmentCacheSchema);
export const ActivitySummary = mongoose.model<IActivitySummary>('ActivitySummary', ActivitySummarySchema);
export const HealthScore = mongoose.model<IHealthScore>('HealthScore', HealthScoreSchema);
