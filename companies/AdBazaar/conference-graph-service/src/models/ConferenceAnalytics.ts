import mongoose, { Schema, Document } from 'mongoose';
import { IConferenceAnalytics } from '../types';

const SessionAnalyticsSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  impressions: { type: Number, default: 0 },
  attendance: { type: Number, default: 0 },
  feedback: {
    rating: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
}, { _id: false });

const EngagementSchema = new Schema({
  websiteVisits: { type: Number, default: 0 },
  socialShares: { type: Number, default: 0 },
  hashtagMentions: { type: Number, default: 0 },
  pressMentions: { type: Number, default: 0 }
}, { _id: false });

const ConversionsSchema = new Schema({
  registrations: { type: Number, default: 0 },
  ticketSales: { type: Number, default: 0 },
  sponsorMeetings: { type: Number, default: 0 },
  leadCaptures: { type: Number, default: 0 }
}, { _id: false });

const DemographicsSchema = new Schema({
  industries: { type: Map, of: Number, default: {} },
  jobTitles: { type: Map, of: Number, default: {} },
  companySizes: { type: Map, of: Number, default: {} },
  countries: { type: Map, of: Number, default: {} }
}, { _id: false });

export interface IConferenceAnalyticsDocument extends Omit<IConferenceAnalytics, '_id'>, Document {}

const ConferenceAnalyticsSchema = new Schema<IConferenceAnalyticsDocument>({
  conferenceId: { type: Schema.Types.ObjectId, ref: 'Conference', required: true, unique: true, index: true },
  impressions: { type: Number, default: 0 },
  registrations: { type: Number, default: 0 },
  attendance: { type: Number, default: 0 },
  checkIns: { type: Number, default: 0 },
  sessions: [SessionAnalyticsSchema],
  engagement: { type: EngagementSchema },
  conversions: { type: ConversionsSchema },
  demographics: { type: DemographicsSchema },
  date: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'conference_analytics'
});

// Indexes
ConferenceAnalyticsSchema.index({ conferenceId: 1, date: -1 });

export const ConferenceAnalytics = mongoose.model<IConferenceAnalyticsDocument>(
  'ConferenceAnalytics',
  ConferenceAnalyticsSchema
);
