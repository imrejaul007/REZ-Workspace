import mongoose, { Document, Schema } from 'mongoose';

// Guest preferences schema
export interface IGuestPreferences {
  roomTemperature: number;
  bedType: 'king' | 'queen' | 'twin' | 'double';
  pillowType: 'firm' | 'medium' | 'soft' | 'memory_foam' | 'down';
  smokingPreference: 'non-smoking' | 'smoking' | 'no-preference';
  floorPreference: 'high' | 'low' | 'no-preference';
  quietRoom: boolean;
  highFloor: boolean;
  nearElevator: boolean;
  lateCheckout: boolean;
  earlyCheckin: boolean;
  dietaryRestrictions: string[];
  beveragePreferences: {
    coffee: 'regular' | 'decaf' | 'none';
    tea: 'black' | 'green' | 'herbal' | 'none';
    water: 'still' | 'sparkling' | 'both';
  };
  amenities: string[];
  entertainment: string[];
  language: string;
  currency: string;
}

// Stay history entry
export interface IStayHistory {
  propertyId: string;
  propertyName: string;
  roomId: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  totalSpent: number;
  purpose: 'business' | 'leisure' | 'mixed';
  rating?: number;
  feedback?: string;
}

// Loyalty information
export interface ILoyaltyInfo {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points: number;
  lifetimePoints: number;
  memberSince: Date;
  benefits: string[];
  qualifiedNights: number;
}

// Sentiment data
export interface ISentimentData {
  overallScore: number; // -1 to 1
  lastUpdated: Date;
  sources: string[];
  positiveKeywords: string[];
  negativeKeywords: string[];
  recentMentions: {
    source: string;
    sentiment: number;
    date: Date;
    excerpt?: string;
  }[];
}

// Guest Twin document interface
export interface IGuestTwin extends Document {
  guestId: string; // External guest ID from Guest Memory service
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality?: string;
    dateOfBirth?: Date;
    vipStatus: boolean;
    corporateAccount?: string;
  };
  preferences: IGuestPreferences;
  stayHistory: IStayHistory[];
  loyalty: ILoyaltyInfo;
  sentiment: ISentimentData;
  tags: string[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastActivity: Date;
    twinVersion: string;
  };
  status: 'active' | 'inactive' | 'archived';
}

// Mongoose schema for Guest Twin
const GuestPreferencesSchema = new Schema<IGuestPreferences>(
  {
    roomTemperature: { type: Number, min: 16, max: 30, default: 22 },
    bedType: {
      type: String,
      enum: ['king', 'queen', 'twin', 'double'],
      default: 'king',
    },
    pillowType: {
      type: String,
      enum: ['firm', 'medium', 'soft', 'memory_foam', 'down'],
      default: 'medium',
    },
    smokingPreference: {
      type: String,
      enum: ['non-smoking', 'smoking', 'no-preference'],
      default: 'non-smoking',
    },
    floorPreference: {
      type: String,
      enum: ['high', 'low', 'no-preference'],
      default: 'no-preference',
    },
    quietRoom: { type: Boolean, default: false },
    highFloor: { type: Boolean, default: false },
    nearElevator: { type: Boolean, default: false },
    lateCheckout: { type: Boolean, default: false },
    earlyCheckin: { type: Boolean, default: false },
    dietaryRestrictions: [{ type: String }],
    beveragePreferences: {
      coffee: { type: String, enum: ['regular', 'decaf', 'none'], default: 'regular' },
      tea: { type: String, enum: ['black', 'green', 'herbal', 'none'], default: 'none' },
      water: { type: String, enum: ['still', 'sparkling', 'both'], default: 'still' },
    },
    amenities: [{ type: String }],
    entertainment: [{ type: String }],
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' },
  },
  { _id: false }
);

const StayHistorySchema = new Schema<IStayHistory>(
  {
    propertyId: { type: String, required: true },
    propertyName: { type: String, required: true },
    roomId: { type: String, required: true },
    roomType: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    totalSpent: { type: Number, default: 0 },
    purpose: { type: String, enum: ['business', 'leisure', 'mixed'], default: 'mixed' },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
  },
  { _id: false }
);

const LoyaltyInfoSchema = new Schema<ILoyaltyInfo>(
  {
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
      default: 'bronze',
    },
    points: { type: Number, default: 0 },
    lifetimePoints: { type: Number, default: 0 },
    memberSince: { type: Date, default: Date.now },
    benefits: [{ type: String }],
    qualifiedNights: { type: Number, default: 0 },
  },
  { _id: false }
);

const SentimentDataSchema = new Schema<ISentimentData>(
  {
    overallScore: { type: Number, min: -1, max: 1, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    sources: [{ type: String }],
    positiveKeywords: [{ type: String }],
    negativeKeywords: [{ type: String }],
    recentMentions: [
      {
        source: { type: String },
        sentiment: { type: Number, min: -1, max: 1 },
        date: { type: Date },
        excerpt: { type: String },
      },
    ],
  },
  { _id: false }
);

const GuestTwinSchema = new Schema<IGuestTwin>(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      nationality: { type: String },
      dateOfBirth: { type: Date },
      vipStatus: { type: Boolean, default: false },
      corporateAccount: { type: String },
    },
    preferences: { type: GuestPreferencesSchema, default: () => ({}) },
    stayHistory: [StayHistorySchema],
    loyalty: { type: LoyaltyInfoSchema, default: () => ({}) },
    sentiment: { type: SentimentDataSchema, default: () => ({}) },
    tags: [{ type: String }],
    metadata: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      lastActivity: { type: Date, default: Date.now },
      twinVersion: { type: String, default: '1.0.0' },
    },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
  },
  {
    timestamps: { createdAt: 'metadata.createdAt', updatedAt: 'metadata.updatedAt' },
  }
);

// Indexes
GuestTwinSchema.index({ 'profile.email': 1 });
GuestTwinSchema.index({ 'profile.vipStatus': 1 });
GuestTwinSchema.index({ 'loyalty.tier': 1 });
GuestTwinSchema.index({ tags: 1 });
GuestTwinSchema.index({ 'metadata.lastActivity': -1 });

// Pre-save middleware to update lastActivity
GuestTwinSchema.pre('save', function (next) {
  this.metadata.lastActivity = new Date();
  next();
});

export const GuestTwin = mongoose.model<IGuestTwin>('GuestTwin', GuestTwinSchema);
