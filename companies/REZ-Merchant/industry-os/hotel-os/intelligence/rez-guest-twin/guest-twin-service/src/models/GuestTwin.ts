/**
 * Guest Twin Model
 *
 * Per-guest AI twin that learns:
 * - Preferences (temperature, pillow, floor, quiet, dietary)
 * - Stay patterns (check-in time, stay duration, room type)
 * - Brand preferences
 * - Travel behavior
 */

import mongoose, { Schema } from 'mongoose';

export interface IStayRecord {
  hotelId: string;
  hotelName: string;
  roomType: string;
  checkInDate: Date;
  checkOutDate: Date;
  satisfaction: number;       // 1-5
  feedback?: string;
  purpose: 'business' | 'leisure' | 'conference' | 'mmt';
  spent: number;
}

export interface IPreferencePattern {
  category: string;         // 'room', 'food', 'service', 'timing'
  preference: string;        // 'quiet room', 'high floor'
  confidence: number;       // 0-1
  source: 'explicit' | 'implicit' | 'booking' | 'stay' | 'feedback';
  lastUpdated: Date;
}

export interface IStayPreference {
  temperature?: number;      // Celsius
  pillowType?: 'soft' | 'firm' | 'memory' | 'hard';
  floorPreference?: 'low' | 'high' | 'any';
  quietRoom?: boolean;
  earlyCheckIn?: boolean;
  lateCheckOut?: boolean;
  dietaryRequirements?: string[];
  smokingPreference?: 'smoking' | 'non-smoking';
  bedConfiguration?: 'single' | 'double' | 'twin' | 'suite';
  viewPreference?: 'city' | 'garden' | 'pool' | 'sea' | 'any';
  airportPickup?: boolean;
}

export interface IMetrics {
  stayCount: number;
  totalNights: number;
  loyaltyScore: number;      // 0-100
  avgSatisfaction: number;   // 1-5
  avgRoomRate: number;
  totalSpent: number;
  favoriteBrand?: string;
  travelFrequency: number;  // stays per year
  lastStay: Date;
  preferredDestinations: string[];
  preferredRoomTypes: string[];
}

export interface IGuestTwin {
  twinId: string;           // TWIN-GUEST-{guestId}
  guestId: string;         // CorpID or guest ID
  email?: string;
  phone?: string;

  // Identity
  name?: string;
  nationality?: string;
  company?: string;

  // Stay history
  stays: IStayRecord[];

  // Preferences
  preferences: IStayPreference;
  preferencePatterns: IPreferencePattern[];

  // Metrics
  metrics: IMetrics;

  // AI Insights
  insights: {
    prediction: string;      // 'likely to rebook', 'high value'
    riskOfChurn: number;   // 0-1
    nextBestOffer: string;   // 'Free upgrade', 'Late checkout'
    preferredTiming: string;  // 'weekday', 'weekend'
  };

  // Privacy
  privacy: {
    shareWithHotel: boolean;
    shareWithPartners: boolean;
    marketingConsent: boolean;
  };

  // Sync
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StayRecordSchema = new Schema<IStayRecord>({
  hotelId: { type: String, required: true },
  hotelName: { type: String },
  roomType: { type: String },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date },
  satisfaction: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  purpose: { type: String, enum: ['business', 'leisure', 'conference', 'mmt'] },
  spent: { type: Number }
}, { _id: false });

const PreferencePatternSchema = new Schema<IPreferencePattern>({
  category: { type: String, required: true },
  preference: { type: String, required: true },
  confidence: { type: Number, default: 0.5 },
  source: {
    type: String,
    enum: ['explicit', 'implicit', 'booking', 'stay', 'feedback'],
    default: 'implicit'
  },
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

const StayPreferenceSchema = new Schema<IStayPreference>({
  temperature: Number,
  pillowType: { type: String, enum: ['soft', 'firm', 'memory', 'hard'] },
  floorPreference: { type: String, enum: ['low', 'high', 'any'] },
  quietRoom: Boolean,
  earlyCheckIn: Boolean,
  lateCheckOut: Boolean,
  dietaryRequirements: [String],
  smokingPreference: { type: String, enum: ['smoking', 'non-smoking'] },
  bedConfiguration: { type: String, enum: ['single', 'double', 'twin', 'suite'] },
  viewPreference: { type: String, enum: ['city', 'garden', 'pool', 'sea', 'any'] },
  airportPickup: Boolean
}, { _id: false });

const MetricsSchema = new Schema<IMetrics>({
  stayCount: { type: Number, default: 0 },
  totalNights: { type: Number, default: 0 },
  loyaltyScore: { type: Number, default: 50 },
  avgSatisfaction: { type: Number, default: 0 },
  avgRoomRate: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  favoriteBrand: String,
  travelFrequency: { type: Number, default: 0 },
  lastStay: Date,
  preferredDestinations: [String],
  preferredRoomTypes: [String]
}, { _id: false });

const InsightsSchema = new Schema({
  prediction: String,
  riskOfChurn: { type: Number, default: 0.5 },
  nextBestOffer: String,
  preferredTiming: String
}, { _id: false });

const PrivacySchema = new Schema({
  shareWithHotel: { type: Boolean, default: true },
  shareWithPartners: { type: Boolean, default: false },
  marketingConsent: { type: Boolean, default: false }
}, { _id: false });

const GuestTwinSchema = new Schema<IGuestTwin>({
  twinId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  guestId: {
    type: String,
    required: true,
    index: true
  },
  email: String,
  phone: String,
  name: String,
  nationality: String,
  company: String,

  stays: [StayRecordSchema],
  preferences: StayPreferenceSchema,
  preferencePatterns: [PreferencePatternSchema],
  metrics: { type: MetricsSchema, default: () => ({}) },
  insights: { type: InsightsSchema, default: () => ({}) },
  privacy: { type: PrivacySchema, default: () => ({}) },

  lastSyncedAt: Date,
}, {
  timestamps: true
});

// Indexes
GuestTwinSchema.index({ 'metrics.loyaltyScore': -1 });
GuestTwinSchema.index({ 'metrics.lastStay': -1 });
GuestTwinSchema.index({ 'insights.riskOfChurn': -1 });

export const GuestTwin = mongoose.model<IGuestTwin>('GuestTwin', GuestTwinSchema);
export default GuestTwin;
