import mongoose, { Schema, Document } from 'mongoose';

export enum FollowUpType {
  CALL = 'call',
  WHATSAPP = 'whatsapp',
  SITE_VISIT = 'site_visit',
  MEETING = 'meeting',
  EMAIL = 'email',
  FOLLOW_UP = 'follow_up',
  REMINDER = 'reminder'
}

export enum FollowUpPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum FollowUpStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  RESCHEDULED = 'rescheduled',
  NO_ANSWER = 'no_answer'
}

export enum SiteVisitStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export interface IAISuggestion {
  recommendedAction?: string;
  recommendedTime?: Date;
  bestChannel?: string;
  confidence?: number;
}

export interface IFollowUp extends Document {
  leadId: string;
  brokerId: string;
  agentId?: string;
  type: FollowUpType;
  priority: FollowUpPriority;
  scheduledAt: Date;
  duration?: number;
  timezone?: string;
  status: FollowUpStatus;
  outcome?: string;
  notes?: string;
  recordingUrl?: string;
  aiSuggestion?: IAISuggestion;
  completedAt?: Date;
  completedBy?: string;
  rescheduledFrom?: Date;
  rescheduleCount: number;
  deletedAt?: Date;
}

export interface ISiteVisitAttendee {
  name?: string;
  phone?: string;
  role?: string;
}

export interface ISiteVisitFeedback {
  rating?: number;
  comments?: string;
  interestedProperties?: string[];
  objections?: string[];
  nextSteps?: string;
}

export interface ISiteVisit extends Document {
  leadId: string;
  brokerId: string;
  propertyId: string;
  scheduledAt: Date;
  estimatedDuration?: number;
  timezone?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  landmark?: string;
  status: SiteVisitStatus;
  attendees?: ISiteVisitAttendee[];
  agentId?: string;
  feedback?: ISiteVisitFeedback;
  startedAt?: Date;
  completedAt?: Date;
  reminderSent: boolean;
  reminderSentAt?: Date;
  deletedAt?: Date;
}

// FollowUp Schema
const AISuggestionSchema = new Schema({
  recommendedAction: String,
  recommendedTime: Date,
  bestChannel: String,
  confidence: Number
}, { _id: false });

const FollowUpSchema = new Schema<IFollowUp>({
  leadId: { type: String, required: true, index: true },
  brokerId: { type: String, required: true, index: true },
  agentId: String,
  type: { type: String, enum: Object.values(FollowUpType), required: true },
  priority: { type: String, enum: Object.values(FollowUpPriority), default: FollowUpPriority.MEDIUM },
  scheduledAt: { type: Date, required: true, index: true },
  duration: Number,
  timezone: String,
  status: { type: String, enum: Object.values(FollowUpStatus), default: FollowUpStatus.PENDING, index: true },
  outcome: String,
  notes: String,
  recordingUrl: String,
  aiSuggestion: { type: AISuggestionSchema },
  completedAt: Date,
  completedBy: String,
  rescheduledFrom: Date,
  rescheduleCount: { type: Number, default: 0 },
  deletedAt: Date
}, { timestamps: true });

FollowUpSchema.index({ scheduledAt: 1, status: 1 });

export const FollowUp = mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);

// SiteVisit Schema
const SiteVisitAttendeeSchema = new Schema({
  name: String,
  phone: String,
  role: String
}, { _id: false });

const SiteVisitFeedbackSchema = new Schema({
  rating: Number,
  comments: String,
  interestedProperties: [String],
  objections: [String],
  nextSteps: String
}, { _id: false });

const SiteVisitSchema = new Schema<ISiteVisit>({
  leadId: { type: String, required: true, index: true },
  brokerId: { type: String, required: true, index: true },
  propertyId: { type: String, required: true, index: true },
  scheduledAt: { type: Date, required: true },
  estimatedDuration: Number,
  timezone: String,
  address: String,
  coordinates: {
    lat: Number,
    lng: Number
  },
  landmark: String,
  status: { type: String, enum: Object.values(SiteVisitStatus), default: SiteVisitStatus.SCHEDULED, index: true },
  attendees: [SiteVisitAttendeeSchema],
  agentId: String,
  feedback: { type: SiteVisitFeedbackSchema },
  startedAt: Date,
  completedAt: Date,
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: Date,
  deletedAt: Date
}, { timestamps: true });

export const SiteVisit = mongoose.model<ISiteVisit>('SiteVisit', SiteVisitSchema);
