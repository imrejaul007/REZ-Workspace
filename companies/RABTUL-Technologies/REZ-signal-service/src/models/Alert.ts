/**
 * REZ Signal Service - Alert Model
 *
 * Stores signal-based alerts for sales teams
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// Types
// ============================================================================

export type AlertType = 'new_signal' | 'signal_trend' | 'competitor_activity' | 'intent_surge' | 'threshold_breach';

export type AlertStatus = 'active' | 'acknowledged' | 'dismissed' | 'actioned';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IAlertAction {
  takenBy?: string;
  takenAt?: Date;
  action: string;
  notes?: string;
}

export interface IAlert extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Alert data
  type: AlertType;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;

  // Related entities
  companyId: string;
  companyName: string;
  signalIds: mongoose.Types.ObjectId[];

  // Content
  summary: string;
  insight: string;
  recommendedAction: string;

  // Actions taken
  actions: IAlertAction[];

  // Notification
  notifiedUsers: string[];
  notificationChannels: string[]; // email, slack, webhook

  // Urgency
  isUrgent: boolean;
  expiresAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Schema
// ============================================================================

const AlertActionSchema = new Schema<IAlertAction>({
  takenBy: String,
  takenAt: Date,
  action: { type: String, required: true },
  notes: String,
}, { _id: false });

const AlertSchema = new Schema<IAlert>({
  tenantId: { type: String, required: true, index: true },

  type: {
    type: String,
    enum: ['new_signal', 'signal_trend', 'competitor_activity', 'intent_surge', 'threshold_breach'],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'dismissed', 'actioned'],
    default: 'active',
    index: true,
  },

  companyId: { type: String, required: true, index: true },
  companyName: { type: String, required: true },
  signalIds: [{ type: Schema.Types.ObjectId, ref: 'Signal' }],

  summary: { type: String, required: true },
  insight: { type: String, required: true },
  recommendedAction: { type: String, required: true },

  actions: [AlertActionSchema],

  notifiedUsers: [{ type: String }],
  notificationChannels: [{ type: String }],

  isUrgent: { type: Boolean, default: false },
  expiresAt: Date,
}, {
  timestamps: true,
});

// Indexes
AlertSchema.index({ tenantId: 1, status: 1 });
AlertSchema.index({ tenantId: 1, companyId: 1 });
AlertSchema.index({ tenantId: 1, severity: 1, status: 1 });
AlertSchema.index({ createdAt: -1 });

// ============================================================================
// Model
// ============================================================================

export const AlertModel: Model<IAlert> = mongoose.model<IAlert>('Alert', AlertSchema);
export default AlertModel;
