/**
 * REZ Atlas v2 - Email Service MongoDB Models
 * Email Sequences & Campaign Management
 */

import mongoose, { Schema, Document } from 'mongoose';

// ================================================
// EmailTemplate Schema
// ================================================
export interface IEmailTemplate extends Document {
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  variables: [{ type: String }],
  category: { type: String, default: 'general', index: true },
}, { timestamps: true });

EmailTemplateSchema.index({ name: 1, category: 1 });
export const EmailTemplate = mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);

// ================================================
// EmailSequence Schema
// ================================================
export interface IEmailStep {
  step: number;
  delayDays: number;
  templateId: string;
  subject: string;
  body: string;
}

export interface IEmailSequenceStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
}

export interface IEmailSequence extends Document {
  name: string;
  description: string;
  steps: IEmailStep[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  stats: IEmailSequenceStats;
  createdAt: Date;
  updatedAt: Date;
}

const EmailStepSchema = new Schema<IEmailStep>({
  step: { type: Number, required: true },
  delayDays: { type: Number, default: 1 },
  templateId: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
}, { _id: false });

const EmailSequenceStatsSchema = new Schema<IEmailSequenceStats>({
  sent: { type: Number, default: 0 },
  delivered: { type: Number, default: 0 },
  opened: { type: Number, default: 0 },
  clicked: { type: Number, default: 0 },
  replied: { type: Number, default: 0 },
  bounced: { type: Number, default: 0 },
}, { _id: false });

const EmailSequenceSchema = new Schema<IEmailSequence>({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  steps: [EmailStepSchema],
  status: { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft', index: true },
  stats: { type: EmailSequenceStatsSchema, default: () => ({ sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 }) },
}, { timestamps: true });

EmailSequenceSchema.index({ status: 1, createdAt: -1 });
export const EmailSequence = mongoose.model<IEmailSequence>('EmailSequence', EmailSequenceSchema);

// ================================================
// Email Schema
// ================================================
export interface IEmail extends Document {
  sequenceId: string;
  contactId: string;
  contactEmail: string;
  contactName: string;
  subject: string;
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';
  sentAt: Date | null;
  deliveredAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  repliedAt: Date | null;
  bounceReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const EmailSchema = new Schema<IEmail>({
  sequenceId: { type: String, default: '', index: true },
  contactId: { type: String, required: true, index: true },
  contactEmail: { type: String, required: true },
  contactName: { type: String, default: '' },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  status: { type: String, enum: ['queued', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed'], default: 'queued', index: true },
  sentAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  openedAt: { type: Date, default: null },
  clickedAt: { type: Date, default: null },
  repliedAt: { type: Date, default: null },
  bounceReason: { type: String, default: null },
}, { timestamps: true });

EmailSchema.index({ status: 1, createdAt: -1 });
EmailSchema.index({ contactId: 1, status: 1 });
EmailSchema.index({ sequenceId: 1, status: 1 });

export const Email = mongoose.model<IEmail>('Email', EmailSchema);