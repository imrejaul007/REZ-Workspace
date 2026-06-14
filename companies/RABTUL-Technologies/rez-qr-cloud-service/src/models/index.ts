import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// MERCHANT MODEL
// ============================================

export interface IMerchant extends Document {
  name: string;
  slug: string;
  type: 'restaurant' | 'hotel' | 'retail' | 'salon' | 'other';
  phone: string;
  email?: string;
  address?: string;
  logo?: string;
  apiKey: string;
  settings: {
    acceptOrders: boolean;
    deliveryEnabled: boolean;
    takeawayEnabled: boolean;
    tablesEnabled: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  type: { type: String, enum: ['restaurant', 'hotel', 'retail', 'salon', 'other'], required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  logo: { type: String },
  apiKey: { type: String, required: true, unique: true },
  settings: {
    acceptOrders: { type: Boolean, default: true },
    deliveryEnabled: { type: Boolean, default: false },
    takeawayEnabled: { type: Boolean, default: true },
    tablesEnabled: { type: Boolean, default: false },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Merchant = mongoose.model<IMerchant>('Merchant', MerchantSchema);

// ============================================
// QR CODE MODEL
// ============================================

export interface IQRCode extends Document {
  merchantId: mongoose.Types.ObjectId;
  type: 'menu' | 'payment' | 'info' | 'verify' | 'creator' | 'ads' | 'table';
  targetId?: string;
  name: string;
  url: string;
  shortCode: string;
  qrCodeDataUrl?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  scans: number;
  createdAt: Date;
  updatedAt: Date;
}

const QRCodeSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
  type: { type: String, enum: ['menu', 'payment', 'info', 'verify', 'creator', 'ads', 'table'], required: true },
  targetId: { type: String },
  name: { type: String, required: true },
  url: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  qrCodeDataUrl: { type: String },
  metadata: { type: Schema.Types.Mixed },
  isActive: { type: Boolean, default: true },
  scans: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes
QRCodeSchema.index({ merchantId: 1, type: 1 });

export const QRCode = mongoose.model<IQRCode>('QRCode', QRCodeSchema);

// ============================================
// CATEGORY MODEL
// ============================================

export interface ICategory extends Document {
  merchantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

const CategorySchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

CategorySchema.index({ merchantId: 1, isActive: 1 });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);

// ============================================
// MENU ITEM MODEL
// ============================================

export interface IMenuItem extends Document {
  merchantId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  isVeg?: boolean;
  isBestseller?: boolean;
  preparationTime?: number;
  allergens?: string[];
  calories?: number;
  options?: Array<{ id: string; name: string; price: number }>;
  addons?: Array<{ id: string; name: string; price: number }>;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String },
  isAvailable: { type: Boolean, default: true },
  isVeg: { type: Boolean },
  isBestseller: { type: Boolean, default: false },
  preparationTime: { type: Number },
  allergens: [{ type: String }],
  calories: { type: Number },
  options: [{
    id: { type: String },
    name: { type: String },
    price: { type: Number },
  }],
  addons: [{
    id: { type: String },
    name: { type: String },
    price: { type: Number },
  }],
}, { timestamps: true });

MenuItemSchema.index({ merchantId: 1, categoryId: 1, isAvailable: 1 });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);

// ============================================
// ORDER MODEL
// ============================================

export interface IOrder extends Document {
  merchantId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerPhone: string;
  customerName?: string;
  type: 'dine_in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  items: Array<{
    itemId: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
    options?: Array<{ id: string; name: string; price: number }>;
    addons?: Array<{ id: string; name: string; price: number }>;
    notes?: string;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
  qrId?: mongoose.Types.ObjectId;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Merchant' },
  customerPhone: { type: String, required: true },
  customerName: { type: String },
  type: { type: String, enum: ['dine_in', 'takeaway', 'delivery'], required: true },
  tableNumber: { type: String },
  items: [{
    itemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    options: [{
      id: { type: String },
      name: { type: String },
      price: { type: Number },
    }],
    addons: [{
      id: { type: String },
      name: { type: String },
      price: { type: Number },
    }],
    notes: { type: String },
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: { type: String },
  qrId: { type: Schema.Types.ObjectId, ref: 'QRCode' },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
}, { timestamps: true });

OrderSchema.index({ merchantId: 1, createdAt: -1 });
OrderSchema.index({ merchantId: 1, status: 1 });
OrderSchema.index({ customerPhone: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

// ============================================
// SCAN EVENT MODEL
// ============================================

export interface IScanEvent extends Document {
  qrId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  customerId?: string;
  deviceId?: string;
  location?: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
}

const ScanEventSchema = new Schema({
  qrId: { type: Schema.Types.ObjectId, ref: 'QRCode', required: true },
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
  customerId: { type: String },
  deviceId: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  timestamp: { type: Date, default: Date.now },
});

ScanEventSchema.index({ merchantId: 1, timestamp: -1 });
ScanEventSchema.index({ qrId: 1, timestamp: -1 });

export const ScanEvent = mongoose.model<IScanEvent>('ScanEvent', ScanEventSchema);

// ============================================
// OFFER MODEL
// ============================================

export interface IOffer extends Document {
  merchantId: mongoose.Types.ObjectId;
  qrId?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: 'percentage' | 'flat' | 'buy_x_get_y' | 'free_item';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  createdAt: Date;
}

const OfferSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
  qrId: { type: Schema.Types.ObjectId, ref: 'QRCode' },
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['percentage', 'flat', 'buy_x_get_y', 'free_item'], required: true },
  value: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 },
}, { timestamps: true });

export const Offer = mongoose.model<IOffer>('Offer', OfferSchema);
