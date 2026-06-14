import mongoose, { Document, Schema } from 'mongoose';

export type RuleType =
  | 'brand_safety'
  | 'platform_policy'
  | 'copyright'
  | 'trademark'
  | 'ftc_disclosure'
  | 'inappropriate_content'
  | 'competitor_mention'
  | 'custom';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type Platform =
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'youtube'
  | 'tiktok'
  | 'linkedin'
  | 'all';

export type ActionType =
  | 'block'
  | 'warn'
  | 'suggest_edit'
  | 'flag_review'
  | 'auto_fix';

export interface IComplianceRule extends Document {
  name: string;
  type: RuleType;
  description: string;
  severity: Severity;
  platforms: Platform[];
  pattern?: string;
  keywords?: string[];
  regexPattern?: RegExp;
  action: ActionType;
  enabled: boolean;
  createdBy: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ComplianceRuleSchema = new Schema<IComplianceRule>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'brand_safety',
        'platform_policy',
        'copyright',
        'trademark',
        'ftc_disclosure',
        'inappropriate_content',
        'competitor_mention',
        'custom',
      ],
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      default: 'medium',
    },
    platforms: {
      type: [String],
      required: true,
      default: ['all'],
    },
    pattern: {
      type: String,
    },
    keywords: {
      type: [String],
      default: [],
    },
    regexPattern: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      enum: ['block', 'warn', 'suggest_edit', 'flag_review', 'auto_fix'],
      default: 'warn',
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
ComplianceRuleSchema.index({ type: 1, enabled: 1 });
ComplianceRuleSchema.index({ platforms: 1, enabled: 1 });

export const ComplianceRule = mongoose.model<IComplianceRule>(
  'ComplianceRule',
  ComplianceRuleSchema
);