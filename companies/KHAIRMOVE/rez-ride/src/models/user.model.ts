import mongoose, { Document, Schema } from 'mongoose';
import { BusinessRuleError } from '../common/exceptions';

// ===========================================
// USER INTERFACE
// ===========================================
export interface IUser extends Document {
  // Auth
  phone: string;
  email?: string;

  // Profile
  name?: string;
  photoUrl?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';

  // Verification
  isPhoneVerified: boolean;
  isEmailVerified: boolean;

  // Addresses (Saved Places)
  addresses: IUserAddress[];

  // Preferences
  preferences: IUserPreferences;

  // Stats
  totalRides: number;
  totalSpent: number;

  // Wallet
  walletBalance: number;
  rideCredits: number;
  serviceCredits: number;

  // Loyalty
  loyaltyPoints: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';

  // Referral
  referralCode: string;
  referralCount: number;

  // Device
  deviceTokens: IDeviceToken[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastRideAt?: Date;
}

// ===========================================
// USER ADDRESS INTERFACE
// ===========================================
export interface IUserAddress {
  id: string;
  type: 'home' | 'work' | 'other';
  label?: string;
  lat: number;
  lng: number;
  address: string;
  landmark?: string;
  instructions?: string;
  isDefault: boolean;
}

// ===========================================
// USER PREFERENCES INTERFACE
// ===========================================
export interface IUserPreferences {
  preferredVehicleType?: 'auto' | 'cab' | 'suv';
  preferredPaymentMethod?: 'wallet' | 'upi' | 'card';
  shareTripEnabled: boolean;
  notificationsEnabled: boolean;
  language: string;
  currency: string;
}

// ===========================================
// DEVICE TOKEN INTERFACE
// ===========================================
export interface IDeviceToken {
  platform: 'ios' | 'android' | 'web';
  token: string;
  deviceId?: string;
  isActive: boolean;
}

// ===========================================
// USER SCHEMA
// ===========================================
const UserAddressSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['home', 'work', 'other'], required: true },
  label: String,
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, required: true },
  landmark: String,
  instructions: String,
  isDefault: { type: Boolean, default: false },
}, { _id: false });

const UserPreferencesSchema = new Schema({
  preferredVehicleType: { type: String, enum: ['auto', 'cab', 'suv'] },
  preferredPaymentMethod: { type: String, enum: ['wallet', 'upi', 'card'] },
  shareTripEnabled: { type: Boolean, default: true },
  notificationsEnabled: { type: Boolean, default: true },
  language: { type: String, default: 'en' },
  currency: { type: String, default: 'INR' },
}, { _id: false });

const DeviceTokenSchema = new Schema({
  platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
  token: { type: String, required: true },
  deviceId: String,
  isActive: { type: Boolean, default: true },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  // Auth
  phone: { type: String, required: true, unique: true, index: true },
  email: { type: String, sparse: true, lowercase: true },

  // Profile
  name: String,
  photoUrl: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },

  // Verification
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },

  // Addresses
  addresses: [UserAddressSchema],

  // Preferences
  preferences: {
    type: UserPreferencesSchema,
    default: () => ({})
  },

  // Stats
  totalRides: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },

  // Wallet
  walletBalance: { type: Number, default: 0 },
  rideCredits: { type: Number, default: 0 },
  serviceCredits: { type: Number, default: 0 },

  // Loyalty
  loyaltyPoints: { type: Number, default: 0 },
  loyaltyTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },

  // Referral
  referralCode: { type: String, unique: true, sparse: true },
  referralCount: { type: Number, default: 0 },

  // Device tokens
  deviceTokens: [DeviceTokenSchema],

  // Timestamps
  lastRideAt: Date,
}, {
  timestamps: true,
});

// ===========================================
// INDEXES
// ===========================================
UserSchema.index({ email: 1 });
UserSchema.index({ 'addresses.type': 1 });
UserSchema.index({ loyaltyTier: 1 });
UserSchema.index({ createdAt: -1 });

// ===========================================
// VIRTUALS
// ===========================================
UserSchema.virtual('defaultAddress').get(function() {
  return this.addresses?.find(a => a.isDefault) || this.addresses?.[0];
});

UserSchema.virtual('homeAddress').get(function() {
  return this.addresses?.find(a => a.type === 'home');
});

UserSchema.virtual('workAddress').get(function() {
  return this.addresses?.find(a => a.type === 'work');
});

// ===========================================
// METHODS
// ===========================================
UserSchema.methods.addAddress = function(address: IUserAddress) {
  // If this is default, unset other defaults
  if (address.isDefault) {
    this.addresses.forEach((a: IUserAddress) => { a.isDefault = false; });
  }

  this.addresses.push(address);
};

UserSchema.methods.removeAddress = function(addressId: string) {
  this.addresses = this.addresses.filter((a: IUserAddress) => a.id !== addressId);
};

UserSchema.methods.setDefaultAddress = function(addressId: string) {
  this.addresses.forEach((a: IUserAddress) => {
    a.isDefault = a.id === addressId;
  });
};

UserSchema.methods.creditRideCredits = function(amount: number) {
  this.rideCredits += amount;
  this.walletBalance += amount;
};

UserSchema.methods.debitRideCredits = function(amount: number) {
  if (this.rideCredits < amount) {
    throw new BusinessRuleError('Insufficient ride credits', 'INSUFFICIENT_CREDITS');
  }
  this.rideCredits -= amount;
  this.walletBalance -= amount;
};

UserSchema.methods.addDeviceToken = function(token: IDeviceToken) {
  // Remove old token with same deviceId or token
  this.deviceTokens = this.deviceTokens.filter(
    (t: IDeviceToken) => t.token !== token.token && t.deviceId !== token.deviceId
  );
  this.deviceTokens.push(token);
};

UserSchema.methods.removeDeviceToken = function(token: string) {
  this.deviceTokens = this.deviceTokens.filter((t: IDeviceToken) => t.token !== token);
};

// ===========================================
// STATICS
// ===========================================
UserSchema.statics.findByPhone = function(phone: string) {
  return this.findOne({ phone });
};

UserSchema.statics.findByReferralCode = function(code: string) {
  return this.findOne({ referralCode: code });
};

export const User = mongoose.model<IUser>('User', UserSchema);

// Type alias for TypeScript - use this for type annotations
export type User = IUser;
