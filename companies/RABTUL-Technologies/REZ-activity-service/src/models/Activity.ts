/**
 * REZ Activity Service - Activity Model
 * Unified B2B activity tracking across all touchpoints
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// Types
// ============================================================================

export type ActivityType =
  | 'email_sent' | 'email_opened' | 'email_clicked' | 'email_replied'
  | 'call_made' | 'call_received' | 'call_completed' | 'call_missed'
  | 'meeting_scheduled' | 'meeting_started' | 'meeting_completed' | 'meeting_cancelled'
  | 'linkedin_sent' | 'linkedin_connected' | 'linkedin_message'
  | 'sms_sent' | 'sms_received'
  | 'note_added' | 'deal_created' | 'deal_stage_changed' | 'deal_closed'
  | 'signal_detected' | 'task_created' | 'task_completed'
  | 'document_viewed' | 'proposal_sent' | 'contract_signed'
  | 'website_visited' | 'content_downloaded';

export type ActivitySource = 'outbound' | 'inbound' | 'system' | 'manual' | 'integration';

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Activity type
  type: ActivityType;
  source: ActivitySource;

  // Entities
  companyId: string;
  companyName?: string;
  contactId?: string;
  contactName?: string;
  dealId?: string;
  dealName?: string;

  // Actor
  userId: string;
  userName?: string;

  // Details
  title: string;
  description?: string;
  metadata?: Record<string, any>;

  // Engagement
  engagement?: {
    duration?: number; // seconds
    clicks?: number;
    opens?: number;
    responseTime?: number; // seconds to first response
  };

  // Links
  relatedActivities?: mongoose.Types.ObjectId[];
  linkedEntityIds?: string[]; // Other related entity IDs

  // Sentiment
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;

  // Timestamps
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Schema
// ============================================================================

const EngagementSchema = new Schema({
  duration: Number,
  clicks: Number,
  opens: Number,
  responseTime: Number,
}, { _id: false });

const ActivitySchema = new Schema<IActivity>({
  tenantId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: [
      'email_sent', 'email_opened', 'email_clicked', 'email_replied',
      'call_made', 'call_received', 'call_completed', 'call_missed',
      'meeting_scheduled', 'meeting_started', 'meeting_completed', 'meeting_cancelled',
      'linkedin_sent', 'linkedin_connected', 'linkedin_message',
      'sms_sent', 'sms_received',
      'note_added', 'deal_created', 'deal_stage_changed', 'deal_closed',
      'signal_detected', 'task_created', 'task_completed',
      'document_viewed', 'proposal_sent', 'contract_signed',
      'website_visited', 'content_downloaded'
    ],
    required: true,
    index: true,
  },
  source: {
    type: String,
    enum: ['outbound', 'inbound', 'system', 'manual', 'integration'],
    default: 'manual',
  },
  companyId: { type: String, required: true, index: true },
  companyName: String,
  contactId: String,
  contactName: String,
  dealId: String,
  dealName: String,
  userId: { type: String, required: true, index: true },
  userName: String,
  title: { type: String, required: true },
  description: String,
  metadata: { type: Schema.Types.Mixed },
  engagement: EngagementSchema,
  relatedActivities: [{ type: Schema.Types.ObjectId, ref: 'Activity' }],
  linkedEntityIds: [String],
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
  sentimentScore: Number,
  occurredAt: { type: Date, required: true, index: true },
}, { timestamps: true });

// Indexes
ActivitySchema.index({ tenantId: 1, companyId: 1, occurredAt: -1 });
ActivitySchema.index({ tenantId: 1, contactId: 1, occurredAt: -1 });
ActivitySchema.index({ tenantId: 1, dealId: 1, occurredAt: -1 });
ActivitySchema.index({ tenantId: 1, userId: 1, occurredAt: -1 });
ActivitySchema.index({ tenantId: 1, type: 1, occurredAt: -1 });
ActivitySchema.index({ occurredAt: -1 });

export const ActivityModel: Model<IActivity> = mongoose.model<IActivity>('Activity', ActivitySchema);
export default ActivityModel;
