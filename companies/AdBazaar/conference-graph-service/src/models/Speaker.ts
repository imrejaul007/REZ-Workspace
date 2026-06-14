import mongoose, { Schema, Document } from 'mongoose';
import { ISpeaker } from '../types';

const FollowersSchema = new Schema({
  twitter: { type: Number, default: 0 },
  linkedin: { type: Number, default: 0 },
  instagram: { type: Number, default: 0 }
}, { _id: false });

const SocialLinksSchema = new Schema({
  twitter: { type: String },
  linkedin: { type: String },
  website: { type: String }
}, { _id: false });

export interface ISpeakerDocument extends Omit<ISpeaker, '_id'>, Document {}

const SpeakerSchema = new Schema<ISpeakerDocument>({
  conferenceId: { type: Schema.Types.ObjectId, ref: 'Conference', required: true, index: true },
  name: { type: String, required: true, index: true },
  title: { type: String, required: true },
  company: { type: String, required: true, index: true },
  bio: { type: String, required: true },
  topic: { type: String, required: true, index: true },
  expertise: [{ type: String, index: true }],
  followers: { type: FollowersSchema },
  photo: { type: String },
  socialLinks: { type: SocialLinksSchema },
  rating: { type: Number, default: 0 },
  sessions: [{ type: Schema.Types.ObjectId, ref: 'Session' }]
}, {
  timestamps: true,
  collection: 'speakers'
});

// Indexes
SpeakerSchema.index({ conferenceId: 1, name: 1 });
SpeakerSchema.index({ company: 1 });
SpeakerSchema.index({ expertise: 1 });
SpeakerSchema.index({ 'followers.linkedin': -1 });
SpeakerSchema.index({ rating: -1 });
SpeakerSchema.index({ '$**': 'text' }, { name: 'text_index' });

export const Speaker = mongoose.model<ISpeakerDocument>('Speaker', SpeakerSchema);
