import mongoose, { Schema, Document } from 'mongoose';
import {
  GuestTwinDocument,
  LoyaltyTier,
  SentimentTrend,
  ChurnRisk,
  PreferredChannel
} from '../schemas/guest-twin.schema';

export interface IGuestTwinModel extends Omit<GuestTwinDocument, 'twinId'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Sub-schemas
const GuestProfileSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  nationality: { type: String },
  languagePreference: { type: String },
  accessibilityNeeds: [{ type: String }]
}, { _id: false });

const GuestLoyaltySchema = new Schema({
  tier: {
    type: String,
    enum: Object.values(LoyaltyTier),
    default: LoyaltyTier.BRONZE
  },
  pointsBalance: { type: Number, default: 0 },
  memberSince: { type: String },
  totalStays: { type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 }
}, { _id: false });

const RoomPreferencesSchema = new Schema({
  floorPreference: { type: String },
  viewPreference: { type: String },
  bedConfiguration: { type: String },
  temperatureSetting: {
    default: { type: Number },
    range: {
      min: { type: Number },
      max: { type: Number }
    }
  },
  lightingPreference: { type: String },
  noiseTolerance: { type: Number, min: 1, max: 10 }
}, { _id: false });

const DiningPreferencesSchema = new Schema({
  dietaryRestrictions: [{ type: String }],
  allergies: [{ type: String }],
  favoriteItems: [{ type: String }],
  beveragePreferences: [{ type: String }],
  typicalSpendRange: {
    min: { type: Number },
    max: { type: Number }
  }
}, { _id: false });

const AmenityPreferencesSchema = new Schema({
  spaInterests: [{ type: String }],
  fitnessHabits: { type: Boolean },
  poolUsage: { type: Boolean },
  businessAmenities: [{ type: String }]
}, { _id: false });

const CommunicationPreferencesSchema = new Schema({
  preferredChannel: {
    type: String,
    enum: Object.values(PreferredChannel),
    default: PreferredChannel.EMAIL
  },
  optIns: [{ type: String }],
  quietHours: {
    start: { type: String },
    end: { type: String }
  }
}, { _id: false });

const GuestPreferencesSchema = new Schema({
  room: { type: RoomPreferencesSchema },
  dining: { type: DiningPreferencesSchema },
  amenities: { type: AmenityPreferencesSchema },
  communication: { type: CommunicationPreferencesSchema }
}, { _id: false });

const StayPatternsSchema = new Schema({
  typicalCheckInTime: { type: String },
  typicalCheckOutTime: { type: String },
  weekendVsWeekday: { type: String },
  seasonalPatterns: [{ type: String }],
  bookingLeadTime: { type: Number }
}, { _id: false });

const GuestSentimentSchema = new Schema({
  currentScore: { type: Number, min: 0, max: 100, default: 50 },
  trend: {
    type: String,
    enum: Object.values(SentimentTrend),
    default: SentimentTrend.STABLE
  },
  lastFeedbackDate: { type: String },
  keyTopics: [{ type: String }]
}, { _id: false });

const LifetimeValueSchema = new Schema({
  clv: { type: Number, default: 0 },
  potentialClv: { type: Number },
  churnRisk: {
    type: String,
    enum: Object.values(ChurnRisk),
    default: ChurnRisk.LOW
  },
  recommendationEligibility: { type: Boolean, default: true }
}, { _id: false });

const CurrentStaySchema = new Schema({
  roomId: { type: String },
  checkIn: { type: String },
  checkOut: { type: String },
  adults: { type: Number, default: 1 },
  children: { type: Number, default: 0 },
  rateCode: { type: String },
  specialRequests: [{ type: String }],
  occasion: { type: String }
}, { _id: false });

const StayHistoryItemSchema = new Schema({
  stayId: { type: String, required: true },
  propertyId: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String },
  roomId: { type: String }
}, { _id: false });

// Main Guest Twin Schema
const GuestTwinSchema = new Schema<IGuestTwinModel>(
  {
    twinId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    guestId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    profile: {
      type: GuestProfileSchema,
      required: true
    },
    loyalty: {
      type: GuestLoyaltySchema,
      required: true,
      default: () => ({})
    },
    preferences: {
      type: GuestPreferencesSchema,
      required: true,
      default: () => ({})
    },
    stayPatterns: { type: StayPatternsSchema },
    sentiment: { type: GuestSentimentSchema },
    lifetimeValue: { type: LifetimeValueSchema },
    currentStay: { type: CurrentStaySchema },
    stayHistory: [{ type: StayHistoryItemSchema }],
    propertyIds: [{ type: String }]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for common queries
GuestTwinSchema.index({ 'profile.email': 1 });
GuestTwinSchema.index({ 'profile.phone': 1 });
GuestTwinSchema.index({ 'loyalty.tier': 1 });
GuestTwinSchema.index({ 'sentiment.currentScore': 1 });
GuestTwinSchema.index({ 'lifetimeValue.churnRisk': 1 });
GuestTwinSchema.index({ 'currentStay.checkOut': 1 });

// Instance methods
GuestTwinSchema.methods.toTwinOsEntityId = function(): string {
  return `twin.hotel.guest.${this.guestId}`;
};

GuestTwinSchema.methods.toJSON = function(): object {
  const obj = this.toObject();
  return {
    twinId: obj.twinId,
    guestId: obj.guestId,
    twinOsEntityId: this.toTwinOsEntityId(),
    profile: obj.profile,
    loyalty: obj.loyalty,
    preferences: obj.preferences,
    stayPatterns: obj.stayPatterns,
    sentiment: obj.sentiment,
    lifetimeValue: obj.lifetimeValue,
    currentStay: obj.currentStay,
    stayHistory: obj.stayHistory,
    propertyIds: obj.propertyIds,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

// Static methods
GuestTwinSchema.statics.findByGuestId = function(guestId: string) {
  return this.findOne({ guestId });
};

GuestTwinSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ 'profile.email': email });
};

GuestTwinSchema.statics.findByPhone = function(phone: string) {
  return this.findOne({ 'profile.phone': phone });
};

GuestTwinSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyIds: propertyId });
};

GuestTwinSchema.statics.findCurrentGuests = function(propertyId: string) {
  return this.find({
    propertyIds: propertyId,
    'currentStay.checkIn': { $exists: true },
    'currentStay.checkOut': { $gt: new Date().toISOString() }
  });
};

// Export model
export const GuestTwin = mongoose.model<IGuestTwinModel>('GuestTwin', GuestTwinSchema);
