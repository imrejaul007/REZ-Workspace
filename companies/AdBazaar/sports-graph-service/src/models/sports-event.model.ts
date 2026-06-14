import mongoose, { Schema, Document } from 'mongoose';
import type {
  SportType,
  EventStatus,
  Venue,
  SportsEvent as SportsEventType
} from '../types/index.js';

export interface ISportsEventDocument extends Omit<SportsEventType, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
 createdAt: Date;
  updatedAt: Date;
}

const VenueSchema = new Schema<Venue>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, default: 'India' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  capacity: { type: Number, required: true },
  type: {
    type: String,
    enum: ['stadium', 'arena', 'ground', 'indoor', 'outdoor'],
    required: true
  },
  amenities: [{ type: String }]
}, { _id: false });

const SportsEventSchema = new Schema<ISportsEventDocument>({
  name: { type: String, required: true, index: true },
  sport: {
    type: String,
    enum: ['cricket', 'football', 'hockey', 'tennis', 'basketball', 'volleyball', 'badminton', 'kabaddi', 'wrestling', 'other'],
    required: true,
    index: true
  },
  tournament: { type: String, index: true },
  season: { type: String },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled',
    index: true
  },
  venue: { type: VenueSchema, required: true },
  teams: [{
    name: { type: String, required: true },
    logo: { type: String },
    homeCity: { type: String }
  }],
  expectedFootfall: { type: Number },
  broadcastChannels: [{ type: String }],
  prizePool: { type: Number },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes
SportsEventSchema.index({ startDate: 1, status: 1 });
SportsEventSchema.index({ 'venue.city': 1, sport: 1 });
SportsEventSchema.index({ tournament: 1, season: 1 });

export const SportsEventModel = mongoose.model<ISportsEventDocument>('SportsEvent', SportsEventSchema);
