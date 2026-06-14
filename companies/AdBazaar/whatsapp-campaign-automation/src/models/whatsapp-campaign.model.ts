/**
 * WhatsApp Campaign Mongoose Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import {
  WhatsAppCampaign,
  CampaignTemplate,
  CampaignAudience,
  CampaignScheduling,
  CampaignMetrics,
  CampaignStatus,
  TemplateType,
  AudienceType,
  SchedulingType,
  CampaignMessage,
} from '../types/whatsapp.types';

export interface IWhatsAppCampaign extends Document {
  campaignId: string;
  merchantId: string;
  name: string;
  template: CampaignTemplate;
  audience: CampaignAudience;
  scheduling: CampaignScheduling;
  metrics: CampaignMetrics;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  completedAt?: Date;
}

const TemplateButtonSchema = new Schema({
  text: { type: String, required: true },
  action: { type: String, required: true },
}, { _id: false });

const CampaignTemplateSchema = new Schema({
  type: {
    type: String,
    enum: ['promotional', 'transactional', 'reengagement', 'welcome'] as TemplateType[],
    required: true,
  },
  header: { type: String },
  body: { type: String, required: true },
  footer: { type: String },
  buttons: [TemplateButtonSchema],
  mediaUrl: { type: String },
}, { _id: false });

const AudienceFiltersSchema = new Schema({
  lastPurchaseDays: { type: Number },
  cartAbandoners: { type: Boolean },
  minOrderValue: { type: Number },
  lastVisitDays: { type: Number },
  tags: [{ type: String }],
}, { _id: false });

const CampaignAudienceSchema = new Schema({
  type: {
    type: String,
    enum: ['all_customers', 'segment', 'custom'] as AudienceType[],
    required: true,
  },
  segmentId: { type: String },
  userIds: [{ type: String }],
  filters: AudienceFiltersSchema,
}, { _id: false });

const CampaignSchedulingSchema = new Schema({
  type: {
    type: String,
    enum: ['immediate', 'scheduled', 'automated'] as SchedulingType[],
    required: true,
  },
  scheduledTime: { type: Date },
  optimalTimeEnabled: { type: Boolean, default: false },
}, { _id: false });

const CampaignMetricsSchema = new Schema({
  sent: { type: Number, default: 0 },
  delivered: { type: Number, default: 0 },
  read: { type: Number, default: 0 },
  clicked: { type: Number, default: 0 },
  responded: { type: Number, default: 0 },
  optOut: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
}, { _id: false });

const WhatsAppCampaignSchema = new Schema<IWhatsAppCampaign>(
  {
    campaignId: { type: String, required: true, unique: true, index: true },
    merchantId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 200 },
    template: { type: CampaignTemplateSchema, required: true },
    audience: { type: CampaignAudienceSchema, required: true },
    scheduling: { type: CampaignSchedulingSchema, required: true },
    metrics: { type: CampaignMetricsSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'completed', 'paused'] as CampaignStatus[],
      default: 'draft',
      index: true,
    },
    sentAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
WhatsAppCampaignSchema.index({ merchantId: 1, status: 1 });
WhatsAppCampaignSchema.index({ merchantId: 1, createdAt: -1 });
WhatsAppCampaignSchema.index({ scheduling: 1, status: 1 });

// Instance methods
WhatsAppCampaignSchema.methods.toJSON = function (this: IWhatsAppCampaign) {
  const obj = this.toObject();
  delete obj._id;
  return obj;
};

export const WhatsAppCampaignModel = mongoose.model<IWhatsAppCampaign>(
  'WhatsAppCampaign',
  WhatsAppCampaignSchema
);

// Campaign Message Model
export interface ICampaignMessage extends Document {
  messageId: string;
  campaignId: string;
  userId: string;
  phoneNumber: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'opt_out';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
  createdAt: Date;
}

const CampaignMessageSchema = new Schema<ICampaignMessage>(
  {
    messageId: { type: String, required: true, unique: true, index: true },
    campaignId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'opt_out'],
      default: 'pending',
      index: true,
    },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    error: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for message queries
CampaignMessageSchema.index({ campaignId: 1, status: 1 });
CampaignMessageSchema.index({ userId: 1, createdAt: -1 });

export const CampaignMessageModel = mongoose.model<ICampaignMessage>(
  'CampaignMessage',
  CampaignMessageSchema
);