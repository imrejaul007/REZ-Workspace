/**
 * REZ Outbound Service - Prospect Model
 *
 * Stores prospects added to sequences
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// Types
// ============================================================================

export type ProspectStatus = 'pending' | 'active' | 'completed' | 'opted_out' | 'bounced' | 'failed';
export type ReplyStatus = 'none' | 'replied' | 'interested' | 'not_interested' | 'demo_scheduled';

export interface IActivity {
  stepOrder: number;
  type: 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'opted_out' | 'skipped' | 'completed';
  timestamp: Date;
  details?: string;
  metadata?: Record<string, any>;
}

export interface IProspect extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Prospect info
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  title?: string;
  companyId: string;
  companyName?: string;
  linkedinUrl?: string;
  phone?: string;

  // Sequence info
  sequenceId: mongoose.Types.ObjectId;
  variantId?: string; // For A/B testing

  // Status
  status: ProspectStatus;
  replyStatus: ReplyStatus;
  currentStep: number;

  // Timing
  addedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  lastActivityAt?: Date;
  nextScheduledAt?: Date;

  // Engagement metrics
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  repliesReceived: number;

  // Activity log
  activities: IActivity[];

  // Personalization
  variables: Record<string, string>;

  // Ownership
  ownerId: string;
  ownerName?: string;

  // External references
  crmContactId?: string;
  crmOpportunityId?: string;

  // Notes
  notes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Schema
// ============================================================================

const ActivitySchema = new Schema<IActivity>({
  stepOrder: { type: Number, required: true },
  type: {
    type: String,
    enum: ['sent', 'opened', 'clicked', 'replied', 'bounced', 'opted_out', 'skipped', 'completed'],
    required: true,
  },
  timestamp: { type: Date, required: true },
  details: String,
  metadata: { type: Schema.Types.Mixed },
}, { _id: false });

const ProspectSchema = new Schema<IProspect>({
  tenantId: { type: String, required: true, index: true },

  // Prospect info
  email: { type: String, required: true, lowercase: true },
  firstName: String,
  lastName: String,
  fullName: String,
  title: String,
  companyId: { type: String, required: true, index: true },
  companyName: String,
  linkedinUrl: String,
  phone: String,

  // Sequence info
  sequenceId: { type: Schema.Types.ObjectId, ref: 'Sequence', required: true, index: true },
  variantId: String,

  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'opted_out', 'bounced', 'failed'],
    default: 'pending',
    index: true,
  },
  replyStatus: {
    type: String,
    enum: ['none', 'replied', 'interested', 'not_interested', 'demo_scheduled'],
    default: 'none',
  },
  currentStep: { type: Number, default: 0 },

  // Timing
  addedAt: { type: Date, default: Date.now },
  startedAt: Date,
  completedAt: Date,
  lastActivityAt: Date,
  nextScheduledAt: Date,

  // Engagement metrics
  emailsSent: { type: Number, default: 0 },
  emailsOpened: { type: Number, default: 0 },
  emailsClicked: { type: Number, default: 0 },
  repliesReceived: { type: Number, default: 0 },

  // Activity log
  activities: [ActivitySchema],

  // Personalization
  variables: { type: Map, of: String },

  // Ownership
  ownerId: { type: String, required: true },
  ownerName: String,

  // External references
  crmContactId: String,
  crmOpportunityId: String,

  // Notes
  notes: String,
}, {
  timestamps: true,
});

// Indexes
ProspectSchema.index({ tenantId: 1, status: 1 });
ProspectSchema.index({ tenantId: 1, sequenceId: 1, status: 1 });
ProspectSchema.index({ tenantId: 1, email: 1 });
ProspectSchema.index({ tenantId: 1, nextScheduledAt: 1 });
ProspectSchema.index({ tenantId: 1, replyStatus: 1 });
ProspectSchema.index({ sequenceId: 1, nextScheduledAt: 1 });
ProspectSchema.index({ ownerId: 1 });

// ============================================================================
// Model
// ============================================================================

export const ProspectModel: Model<IProspect> = mongoose.model<IProspect>('Prospect', ProspectSchema);
export default ProspectModel;
