import mongoose, { Schema, Document } from 'mongoose';
import { ISession } from '../types';

const MaterialSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, enum: ['slides', 'video', 'document'], required: true }
}, { _id: false });

const FeedbackSchema = new Schema({
  rating: { type: Number, default: 0 },
  count: { type: Number, default: 0 }
}, { _id: false });

export interface ISessionDocument extends Omit<ISession, '_id'>, Document {}

const SessionSchema = new Schema<ISessionDocument>({
  conferenceId: { type: Schema.Types.ObjectId, ref: 'Conference', required: true, index: true },
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['keynote', 'panel', 'workshop', 'networking', 'breakout', 'other'],
    required: true,
    index: true
  },
  speakerIds: [{ type: Schema.Types.ObjectId, ref: 'Speaker' }],
  room: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  capacity: { type: Number },
  registeredCount: { type: Number, default: 0 },
  tags: [{ type: String, index: true }],
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  materials: [MaterialSchema],
  feedback: { type: FeedbackSchema }
}, {
  timestamps: true,
  collection: 'sessions'
});

// Indexes
SessionSchema.index({ conferenceId: 1, date: 1 });
SessionSchema.index({ conferenceId: 1, type: 1 });
SessionSchema.index({ conferenceId: 1, room: 1 });
SessionSchema.index({ tags: 1 });
SessionSchema.index({ 'feedback.rating': -1 });
SessionSchema.index({ '$**': 'text' }, { name: 'text_index' });

export const Session = mongoose.model<ISessionDocument>('Session', SessionSchema);
