import mongoose, { Schema, Document } from 'mongoose';
import { IConference } from '../types';

const VenueSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  capacity: { type: Number, required: true }
}, { _id: false });

const OrganizerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String, required: true }
}, { _id: false });

const SponsorSchema = new Schema({
  name: { type: String, required: true },
  tier: { type: String, enum: ['platinum', 'gold', 'silver', 'bronze'], required: true },
  logo: { type: String }
}, { _id: false });

const SocialMediaSchema = new Schema({
  twitter: { type: String },
  linkedin: { type: String },
  facebook: { type: String }
}, { _id: false });

const PriceRangeSchema = new Schema({
  min: { type: Number },
  max: { type: Number },
  currency: { type: String, default: 'USD' }
}, { _id: false });

export interface IConferenceDocument extends Omit<IConference, '_id'>, Document {}

const ConferenceSchema = new Schema<IConferenceDocument>({
  name: { type: String, required: true, index: true },
  description: { type: String, required: true },
  date: {
    start: { type: Date, required: true, index: true },
    end: { type: Date, required: true }
  },
  venue: { type: VenueSchema, required: true },
  industry: { type: String, required: true, index: true },
  expectedAttendance: { type: Number, required: true },
  actualAttendance: { type: Number },
  topics: [{ type: String, index: true }],
  tags: [{ type: String, index: true }],
  organizer: { type: OrganizerSchema, required: true },
  sponsors: [SponsorSchema],
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  registrationUrl: { type: String },
  website: { type: String },
  socialMedia: { type: SocialMediaSchema },
  targetAudience: [{ type: String }],
  priceRange: { type: PriceRangeSchema },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'conferences'
});

// Indexes for efficient querying
ConferenceSchema.index({ 'venue.city': 1 });
ConferenceSchema.index({ 'venue.country': 1 });
ConferenceSchema.index({ status: 1, 'date.start': 1 });
ConferenceSchema.index({ industry: 1, status: 1 });
ConferenceSchema.index({ tags: 1 });
ConferenceSchema.index({ '$**': 'text' }, { name: 'text_index' });

export const Conference = mongoose.model<IConferenceDocument>('Conference', ConferenceSchema);
