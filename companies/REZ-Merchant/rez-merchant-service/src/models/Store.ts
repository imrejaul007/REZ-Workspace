import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Local type definitions replacing @rez/shared-types imports.
 * These enums mirror the canonical types from rez-backend to avoid
 * cross-service dependency coupling. Keep in sync manually.
 */

// Canonical verification status for stores
export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

// Canonical store type categories
export enum StoreType {
  RESTAURANT = 'restaurant',
  CAFE = 'cafe',
  BAKERY = 'bakery',
  SALON = 'salon',
  SPA = 'spa',
  RETAIL = 'retail',
  OTHER = 'other',
}

// SECURITY FIX (MA-BACK-AUDIT-007): Replaced `any` types with proper interfaces.

// Store configuration types
export interface OperationalHours {
  [day: string]: { open: string; close: string; closed?: boolean };
}

export interface StoreAnalytics {
  totalOrders?: number;
  totalRevenue?: number;
  averageOrderValue?: number;
  popularItems?: string[];
  peakHours?: { hour: number; orders: number }[];
  [key: string]: unknown;
}

export interface PaymentSettings {
  upiEnabled?: boolean;
  cardEnabled?: boolean;
  cashEnabled?: boolean;
  walletEnabled?: string[];
  [key: string]: unknown;
}

export interface RewardRules {
  pointsPerRupee?: number;
  pointsToRupeeRatio?: number;
  minimumRedeemPoints?: number;
  [key: string]: unknown;
}

export interface BookingConfig {
  enabled?: boolean;
  maxPartySize?: number;
  slotDuration?: number;
  advanceBookingDays?: number;
  [key: string]: unknown;
}

export interface ActionButton {
  id: string;
  label: string;
  icon?: string;
  action: string;
  order?: number;
}

export interface StoreQR {
  table?: string;
  url?: string;
  qrCodeUrl?: string;
}

export interface StorePromotion {
  id: string;
  title: string;
  startDate?: Date;
  endDate?: Date;
  [key: string]: unknown;
}

// Types defined locally (VerificationStatus, StoreType) instead of importing from @rez/shared-types
// to avoid cross-service dependency coupling. See enum definitions above.

// Canonical enum value arrays for Mongoose schema
const VERIFICATION_STATUS_VALUES: string[] = Object.values(VerificationStatus);
const STORE_TYPE_VALUES: string[] = Object.values(StoreType);

// RC-1 NOTE: Merchants own their store data — writes to the stores collection ARE allowed
// from this service. This is the only exception to the source-of-truth rule.
// All other shared collections (offers, users, orders, wallets) are read-only from this service.

export interface IStore extends Document {
  merchantId: Types.ObjectId;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  /** Always stored as string[] (pre-save hook normalises bare strings). Accepts string | string[] on input. */
  banner?: string[];
  category: string;
  subcategories?: string[];
  // DB-HEALTH-003: Soft delete field for sensitive data
  deletedAt?: Date;
  location: {
    address: string;
    city: string;
    state?: string;
    pincode?: string;
    coordinates?: [number, number];
    deliveryRadius?: number;
    landmark?: string;
  };
  contact?: { phone?: string; email?: string; website?: string; whatsapp?: string };
  operationalInfo?: {
    hours?: OperationalHours;
    dineIn?: boolean;
    delivery?: boolean;
    takeaway?: boolean;
    orderingMode?: string[];
  };
  ratings?: { average: number; count: number; distribution?: { 5?: number; 4?: number; 3?: number; 2?: number; 1?: number } };
  offers?: { cashback?: number; minOrderAmount?: number; maxCashback?: number; isPartner?: boolean };
  analytics?: StoreAnalytics;
  paymentSettings?: PaymentSettings;
  rewardRules?: RewardRules;
  bookingConfig?: BookingConfig;
  actionButtons?: ActionButton[];
  storeQR?: StoreQR;
  promotions?: StorePromotion[];
  operatingHours?: OperationalHours;
  isActive: boolean;
  isListed: boolean;
  isVerified: boolean;
  /** Mirrors the status string used by rez-app-merchant.
   *  Use this instead of isVerified when you need to distinguish 'pending' from 'approved'.
   *  isVerified remains for backwards compatibility. */
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  tags?: string[];
  features?: string[];
  // DB-HEALTH-024: Using canonical StoreType enum from @rez/shared-types
  storeType?: StoreType;
  fssaiNumber?: string;
  gstNumber?: string;
  googlePlaceId?: string;
  instagramHandle?: string;
  facebookUrl?: string;
  twitterHandle?: string;
  websiteUrl?: string;
  acceptsOnlineOrders?: boolean;
  acceptsScanPay?: boolean;
  showLoyaltyStamps?: boolean;
  // REZ Now delivery config
  deliveryEnabled?: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: number;
  storeLatitude?: number;
  storeLongitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    name: { type: String, required: true, trim: true },
    // NOTE: `slug_1` unique index is owned by the rez-backend Store model on
    // the same `stores` collection. We declare the field here (no index —
    // backend creates it) and auto-generate it in the pre-save hook below to
    // avoid E11000 duplicate-null collisions when merchant-service writes a
    // new store (register, outlets, etc.).
    slug: { type: String },
    description: String,
    logo: String,
    banner: { type: [String], default: [] },
    category: { type: String, required: true },
    subcategories: [String],
    // DB-HEALTH-003: Soft delete field
    deletedAt: Date,
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: String,
      pincode: String,
      coordinates: { type: [Number] },
      deliveryRadius: { type: Number, default: 5 },
      landmark: String,
    },
    contact: { phone: String, email: String, website: String, whatsapp: String },
    operationalInfo: Schema.Types.Mixed,
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
      distribution: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
    },
    offers: Schema.Types.Mixed,
    analytics: Schema.Types.Mixed,
    paymentSettings: Schema.Types.Mixed,
    rewardRules: Schema.Types.Mixed,
    bookingConfig: Schema.Types.Mixed,
    actionButtons: Schema.Types.Mixed,
    storeQR: Schema.Types.Mixed,
    promotions: Schema.Types.Mixed,
    operatingHours: Schema.Types.Mixed,
    isActive: { type: Boolean, default: true },
    isListed: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    // DB-HEALTH-024: Using canonical VerificationStatus enum from @rez/shared-types
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUS_VALUES,
      default: VerificationStatus.PENDING,
    },
    tags: [String],
    features: [String],
    // DB-HEALTH-024: Using canonical StoreType enum from @rez/shared-types
    storeType: {
      type: String,
      enum: STORE_TYPE_VALUES,
    },
    fssaiNumber: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
    googlePlaceId: { type: String, trim: true },
    instagramHandle: { type: String, trim: true },
    facebookUrl: { type: String, trim: true },
    twitterHandle: { type: String, trim: true },
    websiteUrl: { type: String, trim: true },
    acceptsOnlineOrders: { type: Boolean },
    acceptsScanPay: { type: Boolean },
    showLoyaltyStamps: { type: Boolean },
    // REZ Now delivery config
    deliveryEnabled: { type: Boolean, default: false },
    deliveryRadiusKm: { type: Number, default: 5, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    storeLatitude: { type: Number },
    storeLongitude: { type: Number },
  },
  { timestamps: true, strict: true, strictQuery: true },
);

StoreSchema.index({ merchantId: 1 });
StoreSchema.index({ 'location.coordinates': '2dsphere' });

// DB-HEALTH-005: Soft delete index
StoreSchema.index({ deletedAt: 1 });

// DB-HEALTH-006: Compound index for store listing/search queries
StoreSchema.index({ isActive: 1, isListed: 1, category: 1 });
StoreSchema.index({ merchantId: 1, isActive: 1 });

// DB-INDEX: Added city+category index for geo-category based store searches
StoreSchema.index({ 'location.city': 1, category: 1, isActive: 1 });

/**
 * Auto-generate a unique slug from `name` when missing. The backend Store
 * model's pre-save hook does the same thing, but we need it here too
 * because writes initiated by rez-merchant-service bypass the backend
 * model entirely.
 *
 * Format: `<name-slugified>-<objectId-tail>` — the ObjectId is monotonic
 * per-millisecond + machine ID, so collisions are effectively impossible.
 */
StoreSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    const base = String(this.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'store';
    const tail = (this._id as Types.ObjectId).toString().slice(-8);
    this.slug = `${base}-${tail}`;
  }
  next();
});

// B08 FIX: The backend Store model is canonical with `merchantId`. This service
// now writes `merchantId` as the primary field. For any existing store docs that
// were written with only the legacy `merchant` field, this hook copies
// `merchant` → `merchantId` on save so queries using `merchantId` still find
// them. `merchant` is kept in sync (merchantId → merchant) so reads that still
// reference the legacy field continue working. Combined with the matching hook
// in rez-backend, both services can safely query by either field name.
StoreSchema.pre('save', function (this, next) {
  // Migrate legacy docs: populate merchantId from merchant if present
  if (this.merchant && !this.merchantId) this.merchantId = this.merchant;
  // Keep merchant in sync with merchantId for backward-compatible reads
  if (this.merchantId && !this.merchant) this.merchant = this.merchantId;

  // Normalize banner: always coerce a bare string to a single-element array
  // so downstream consumers can safely treat banner as string[].
  if (typeof this.banner === 'string') {
    this.banner = [this.banner];
  }

  next();
});

export const Store = mongoose.model<IStore>('Store', StoreSchema);
