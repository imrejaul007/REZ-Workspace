import mongoose, { Document, Schema } from 'mongoose';

// Store status enum
export type StoreStatus = 'active' | 'inactive' | 'suspended' | 'pending_setup';

// Store type enum
export type StoreType = 'grocery' | 'pharmacy' | 'cafe' | 'retail' | 'electronics' | 'fashion' | 'campus' | 'event' | 'other';

// Operating hours embedded document
export interface IOperatingHours {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
  isClosed: boolean;
}

// Cashback configuration embedded document
export interface ICashbackConfig {
  enabled: boolean;
  defaultPercent: number;
  minAmount: number;
  maxAmount?: number;
  rules: {
    type: 'product' | 'brand' | 'category' | 'time' | 'streak' | 'ai';
    value: number;
    minAmount?: number;
    maxAmount?: number;
    conditions?: Record<string, unknown>;
    productIds?: string[];
    brandIds?: string[];
    categoryIds?: string[];
  }[];
}

// Go Store document interface
export interface IGoStore extends Document {
  storeId: string;
  merchantId: string;
  name: string;
  slug: string;
  logo?: string;
  banner?: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    lat: number;
    lng: number;
  };
  phone?: string;
  email?: string;
  storeType: StoreType;
  status: StoreStatus;
  goEnabled: boolean;
  qrCode?: string;
  operatingHours: IOperatingHours[];
  timezone: string;
  taxRate: number;
  cashback: ICashbackConfig;
  products: string[]; // Array of productIds
  categories: string[];
  stats: {
    totalSessions: number;
    totalRevenue: number;
    avgCartValue: number;
    avgSessionDuration: number; // in minutes
    fraudRate: number;
  };
  settings: {
    requireExitVerification: boolean;
    allowGuestCheckout: boolean;
    maxSessionDuration: number; // in minutes
    maxItemsPerSession: number;
    enableOfflineMode: boolean;
    enableSmartOffers: boolean;
    enableAiRecommendations: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OperatingHoursSchema = new Schema<IOperatingHours>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

const CashbackRuleSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['product', 'brand', 'category', 'time', 'streak', 'ai'],
      required: true,
    },
    value: { type: Number, required: true },
    minAmount: { type: Number },
    maxAmount: { type: Number },
    conditions: { type: Schema.Types.Mixed },
    productIds: [{ type: String }],
    brandIds: [{ type: String }],
    categoryIds: [{ type: String }],
  },
  { _id: false }
);

const CashbackConfigSchema = new Schema<ICashbackConfig>(
  {
    enabled: { type: Boolean, default: true },
    defaultPercent: { type: Number, default: 2 },
    minAmount: { type: Number, default: 0 },
    maxAmount: { type: Number },
    rules: [CashbackRuleSchema],
  },
  { _id: false }
);

const StoreAddressSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const StoreStatsSchema = new Schema(
  {
    totalSessions: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    avgCartValue: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 },
    fraudRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const StoreSettingsSchema = new Schema(
  {
    requireExitVerification: { type: Boolean, default: true },
    allowGuestCheckout: { type: Boolean, default: false },
    maxSessionDuration: { type: Number, default: 120 },
    maxItemsPerSession: { type: Number, default: 100 },
    enableOfflineMode: { type: Boolean, default: true },
    enableSmartOffers: { type: Boolean, default: true },
    enableAiRecommendations: { type: Boolean, default: true },
  },
  { _id: false }
);

const GoStoreSchema = new Schema<IGoStore>(
  {
    storeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logo: { type: String },
    banner: { type: String },
    description: { type: String },
    address: { type: StoreAddressSchema, required: true },
    phone: { type: String },
    email: { type: String },
    storeType: {
      type: String,
      enum: ['grocery', 'pharmacy', 'cafe', 'retail', 'electronics', 'fashion', 'campus', 'event', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending_setup'],
      default: 'pending_setup',
    },
    goEnabled: { type: Boolean, default: false },
    qrCode: { type: String },
    operatingHours: [OperatingHoursSchema],
    timezone: { type: String, default: 'Asia/Kolkata' },
    taxRate: { type: Number, default: 18 },
    cashback: { type: CashbackConfigSchema, default: () => ({}) },
    products: [{ type: String, index: true }],
    categories: [{ type: String }],
    stats: { type: StoreStatsSchema, default: () => ({}) },
    settings: { type: StoreSettingsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
  }
);

// Indexes
GoStoreSchema.index({ merchantId: 1, status: 1 });
GoStoreSchema.index({ 'address.city': 1, 'address.pincode': 1 });
GoStoreSchema.index({ goEnabled: 1, status: 1 });
GoStoreSchema.index({ storeType: 1, status: 1 });

export const GoStore = mongoose.model<IGoStore>('GoStore', GoStoreSchema);
