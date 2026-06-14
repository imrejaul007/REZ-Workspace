import mongoose, { Schema, Document } from 'mongoose';
import { Gender, UserRole, Theme, AddressLabel, OrderFrequency, PriceRange, NotificationChannel, PaymentMethod as SharedPaymentMethod } from '@rez/shared-types';
import { encryptPII, decryptPII } from '@rez/rez-shared';

// ─── User Profile Schema ──────────────────────────────────────────────────────

// Canonical enum value arrays for Mongoose schema
const GENDER_VALUES: string[] = Object.values(Gender);
const USER_ROLE_VALUES: string[] = Object.values(UserRole);

// User segment type for profile-service (marketing segments - different from canonical UserSegment)
export type ProfileUserSegment = 'normal' | 'verified' | 'student' | 'pro' | 'creator' | 'business' | 'influencer' | 'host' | 'vip';
const USER_SEGMENT_VALUES: string[] = ['normal', 'verified', 'student', 'pro', 'creator', 'business', 'influencer', 'host', 'vip'];

export interface IUserProfile extends Document {
  userId: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  // DB-HEALTH-022: Using canonical Gender enum from @rez/shared-types
  gender?: Gender;
  // DB-HEALTH-022: Using canonical UserRole enum from @rez/shared-types
  role: UserRole;
  // Profile marketing segment (distinct from canonical UserSegment)
  segment: ProfileUserSegment;
  isVerified: boolean;
  isOnboarded: boolean;
  // DB-HEALTH-020: Soft delete field
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    phone: { type: String },
    email: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    avatar: { type: String },
    bio: { type: String },
    dateOfBirth: { type: String },
    // DB-HEALTH-022: Using canonical Gender enum from @rez/shared-types
    gender: { type: String, enum: GENDER_VALUES },
    // DB-HEALTH-022: Using canonical UserRole enum from @rez/shared-types
    role: {
      type: String,
      enum: USER_ROLE_VALUES,
      default: UserRole.USER,
    },
    // Profile marketing segment (distinct from canonical UserSegment)
    segment: {
      type: String,
      enum: USER_SEGMENT_VALUES,
      default: 'normal',
    },
    isVerified: { type: Boolean, default: false },
    isOnboarded: { type: Boolean, default: false },
    // DB-HEALTH-020: Soft delete field
    deletedAt: Date,
  },
  { timestamps: true },
);

UserProfileSchema.index({ email: 1 }, { sparse: true });
UserProfileSchema.index({ phone: 1 }, { sparse: true });

// DB-HEALTH-021: Soft delete index
UserProfileSchema.index({ deletedAt: 1 });

// PII Encryption middleware for UserProfile
UserProfileSchema.pre('save', function (next) {
    if (this.isModified('phone')) {
        this.phone = encryptPII(this.phone);
    }
    if (this.isModified('email')) {
        this.email = encryptPII(this.email);
    }
    next();
});

UserProfileSchema.post('init', function () {
    this.phone = decryptPII(this.phone);
    this.email = decryptPII(this.email);
});

UserProfileSchema.post('findOne', function (doc) {
    if (doc) {
        doc.phone = decryptPII(doc.phone);
        doc.email = decryptPII(doc.email);
    }
});

UserProfileSchema.post('find', function (docs) {
    if (Array.isArray(docs)) {
        docs.forEach((doc) => {
            if (doc) {
                doc.phone = decryptPII(doc.phone);
                doc.email = decryptPII(doc.email);
            }
        });
    }
});

// ─── User Preferences Schema ──────────────────────────────────────────────────

// Canonical enum value arrays for UserPreferences
const THEME_VALUES: string[] = Object.values(Theme);
const NOTIFICATION_CHANNEL_VALUES: string[] = Object.values(NotificationChannel);

export interface IUserPreferences extends Document {
  userId: string;
  language: string;
  currency: string;
  // DB-HEALTH-022: Using canonical Theme enum from @rez/shared-types
  theme: Theme;
  notifications: {
    push: boolean;
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'INR' },
    // DB-HEALTH-022: Using canonical Theme enum from @rez/shared-types
    theme: { type: String, enum: THEME_VALUES, default: Theme.LIGHT },
    notifications: {
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

// ─── Address Schema ──────────────────────────────────────────────────────────

// Canonical enum value arrays for Address
const ADDRESS_LABEL_VALUES: string[] = Object.values(AddressLabel);

export interface IAddress extends Document {
  userId: string;
  addressId: string;
  // DB-HEALTH-022: Using canonical AddressLabel enum from @rez/shared-types
  label: AddressLabel;
  name?: string;
  phone?: string;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: { type: String, required: true, index: true },
    addressId: { type: String, required: true },
    // DB-HEALTH-022: Using canonical AddressLabel enum from @rez/shared-types
    label: { type: String, enum: ADDRESS_LABEL_VALUES, default: AddressLabel.OTHER },
    name: { type: String },
    phone: { type: String },
    address: { type: String, required: true },
    landmark: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    isDefault: { type: Boolean, default: false },
    instructions: { type: String },
  },
  { timestamps: true },
);

AddressSchema.index({ userId: 1, addressId: 1 }, { unique: true });

// PII Encryption middleware for Address
AddressSchema.pre('save', function (next) {
    if (this.isModified('phone')) {
        this.phone = encryptPII(this.phone);
    }
    if (this.isModified('address')) {
        this.address = encryptPII(this.address);
    }
    if (this.isModified('landmark')) {
        this.landmark = encryptPII(this.landmark);
    }
    next();
});

AddressSchema.post('init', function () {
    this.phone = decryptPII(this.phone);
    this.address = decryptPII(this.address);
    this.landmark = decryptPII(this.landmark);
});

AddressSchema.post('findOne', function (doc) {
    if (doc) {
        doc.phone = decryptPII(doc.phone);
        doc.address = decryptPII(doc.address);
        doc.landmark = decryptPII(doc.landmark);
    }
});

AddressSchema.post('find', function (docs) {
    if (Array.isArray(docs)) {
        docs.forEach((doc) => {
            if (doc) {
                doc.phone = decryptPII(doc.phone);
                doc.address = decryptPII(doc.address);
                doc.landmark = decryptPII(doc.landmark);
            }
        });
    }
});

// ─── Payment Method Schema ────────────────────────────────────────────────────

// Canonical enum value arrays for PaymentMethod
const PAYMENT_METHOD_VALUES: string[] = Object.values(SharedPaymentMethod);

export interface IPaymentMethod extends Document {
  userId: string;
  methodId: string;
  // DB-HEALTH-022: Using canonical PaymentMethod enum from @rez/shared-types
  type: SharedPaymentMethod;
  isDefault: boolean;
  upi?: { id: string };
  card?: { last4: string; brand: string; expiry: string };
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    userId: { type: String, required: true, index: true },
    methodId: { type: String, required: true },
    // DB-HEALTH-022: Using canonical PaymentMethod enum from @rez/shared-types
    type: { type: String, enum: PAYMENT_METHOD_VALUES, required: true },
    isDefault: { type: Boolean, default: false },
    upi: {
      id: { type: String },
    },
    card: {
      last4: { type: String },
      brand: { type: String },
      expiry: { type: String },
    },
  },
  { timestamps: true },
);

PaymentMethodSchema.index({ userId: 1, methodId: 1 }, { unique: true });

// ─── User Hidden KB Schema ────────────────────────────────────────────────────

// Canonical enum value arrays for UserHiddenKB
const ORDER_FREQUENCY_VALUES: string[] = Object.values(OrderFrequency);
const PRICE_RANGE_VALUES: string[] = Object.values(PriceRange);

export interface IUserHiddenKB extends Document {
  userId: string;
  // DB-HEALTH-019: Soft delete field
  deletedAt?: Date;
  behavioral: {
    avgOrderValue: number;
    // DB-HEALTH-022: Using canonical OrderFrequency enum from @rez/shared-types
    orderFrequency: OrderFrequency;
    preferredCuisine: string[];
    // DB-HEALTH-022: Using canonical PriceRange enum from @rez/shared-types
    preferredPriceRange: PriceRange;
    diningTime: string;
    partySize: number;
    leadTime: number;
  };
  intents: {
    lastIntent: string;
    dormantScore: number;
    predictedNext: string;
    churnRisk: number;
    ltv: number;
  };
  engagement: {
    lastActive: Date;
    sessionCount: number;
    avgSessionDuration: number;
    conversionRate: number;
    npsScore?: number;
  };
  insights: {
    preferences: string[];
    triggers: string[];
    barriers: string[];
    bestTimeToNudge: Date;
    preferredChannel: 'push' | 'sms' | 'whatsapp';
    sensitivityToDiscount: number;
    brandAffinity: Record<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserHiddenKBSchema = new Schema<IUserHiddenKB>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    // DB-HEALTH-019: Soft delete field
    deletedAt: Date,
    behavioral: {
      avgOrderValue: { type: Number, default: 0 },
      // DB-HEALTH-022: Using canonical OrderFrequency enum from @rez/shared-types
      orderFrequency: { type: String, enum: ORDER_FREQUENCY_VALUES, default: OrderFrequency.OCCASIONAL },
      preferredCuisine: { type: [String], default: [] },
      // DB-HEALTH-022: Using canonical PriceRange enum from @rez/shared-types
      preferredPriceRange: { type: String, enum: PRICE_RANGE_VALUES, default: PriceRange.MID },
      diningTime: { type: String, default: 'dinner' },
      partySize: { type: Number, default: 1 },
      leadTime: { type: Number, default: 2 },
    },
    intents: {
      lastIntent: { type: String, default: '' },
      dormantScore: { type: Number, default: 0 },
      predictedNext: { type: String, default: '' },
      churnRisk: { type: Number, default: 0 },
      ltv: { type: Number, default: 0 },
    },
    engagement: {
      lastActive: { type: Date, default: Date.now },
      sessionCount: { type: Number, default: 0 },
      avgSessionDuration: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      npsScore: { type: Number },
    },
    insights: {
      preferences: { type: [String], default: [] },
      triggers: { type: [String], default: [] },
      barriers: { type: [String], default: [] },
      bestTimeToNudge: { type: Date, default: Date.now },
      preferredChannel: { type: String, enum: ['push', 'sms', 'whatsapp'], default: 'push' },
      sensitivityToDiscount: { type: Number, default: 0.5 },
      brandAffinity: { type: Map, of: Number, default: {} },
    },
  },
  { timestamps: true },
);

// DB-HEALTH-018: Indexes for UserHiddenKB queries
UserHiddenKBSchema.index({ 'behavioral.orderFrequency': 1 });
UserHiddenKBSchema.index({ 'intents.churnRisk': -1 });
UserHiddenKBSchema.index({ 'intents.ltv': -1 });
UserHiddenKBSchema.index({ 'engagement.lastActive': -1 });

// DB-HEALTH-019: Soft delete index
UserHiddenKBSchema.index({ deletedAt: 1 });

// ─── Export Models ────────────────────────────────────────────────────────────

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
export const UserPreferences = mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);
export const Address = mongoose.model<IAddress>('Address', AddressSchema);
export const PaymentMethod = mongoose.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema);
export const UserHiddenKB = mongoose.model<IUserHiddenKB>('UserHiddenKB', UserHiddenKBSchema);

// ─── Creator Profile (Unified) ─────────────────────────────────────────────────
// Same creator profile across: Creator QR, Prive, Wallet, Auth
export { CreatorProfile, ICreatorProfile, CreatorStatus, CreatorTier, CreatorCategory } from './CreatorProfile';
import { CreatorProfile as CreatorProfileModel } from './CreatorProfile';
export const Creator = CreatorProfileModel;
