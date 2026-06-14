/**
 * MongoDB Models for RisaCare Pharmacy Integration
 */

import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// MEDICINE SCHEMA
// ============================================

export const MedicineSchema = new Schema({
  medicineId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  genericName: { type: String, index: true },
  brand: { type: String },
  manufacturer: { type: String },
  composition: { type: String },
  strength: { type: String },
  dosageForm: {
    type: String,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'patch', 'gel', 'powder', 'suspension', 'solution']
  },
  packSize: { type: String },
  price: { type: Number },
  mrp: { type: Number },
  prescriptionRequired: { type: Boolean, default: false },
  schedule: {
    type: String,
    enum: ['OTC', 'Schedule H', 'Schedule H1', 'Schedule X', 'Schedule G'],
    default: 'OTC'
  },
  category: { type: String, index: true },
  subcategory: { type: String },
  images: [{ type: String }],
  description: { type: String },
  indications: [{ type: String }],
  contraindications: [{ type: String }],
  sideEffects: [{ type: String }],
  storageInstructions: { type: String },
  country: { type: String, default: 'India' },
  isActive: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  stock: { type: Number, default: 0 },
  suppliers: [{
    supplierId: String,
    price: Number,
    stock: Number,
    leadTime: Number
  }]
}, { timestamps: true });

export interface IMedicine extends Document {
  medicineId: string;
  name: string;
  genericName?: string;
  brand?: string;
  manufacturer?: string;
  composition?: string;
  strength?: string;
  dosageForm: string;
  packSize?: string;
  price?: number;
  mrp?: number;
  prescriptionRequired: boolean;
  schedule: string;
  category?: string;
  subcategory?: string;
  images?: string[];
  description?: string;
  indications?: string[];
  contraindications?: string[];
  sideEffects?: string[];
  storageInstructions?: string;
  country: string;
  isActive: boolean;
  isAvailable: boolean;
  stock: number;
  suppliers?: any[];
}

export const Medicine = mongoose.model<IMedicine>('Medicine', MedicineSchema);

// ============================================
// ORDER SCHEMA
// ============================================

export const PharmacyOrderSchema = new Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  orderNumber: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  provider: {
    type: String,
    enum: ['onemg', 'pharmeasy', 'netmeds', 'apollo', 'tata_1mg', 'local_pharmacy'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['cart', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'cart',
    index: true
  },
  items: [{
    medicineId: String,
    name: String,
    genericName: String,
    manufacturer: String,
    strength: String,
    dosageForm: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number,
    prescriptionRequired: Boolean,
    prescriptionUrl: String,
    discount: Number
  }],
  prescription: {
    required: { type: Boolean, default: false },
    uploaded: { type: Boolean, default: false },
    prescriptionUrl: String,
    verified: { type: Boolean, default: false },
    verifiedBy: String,
    verifiedAt: Date
  },
  shippingAddress: {
    name: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    addressType: { type: String, enum: ['home', 'work', 'other'], default: 'home' }
  },
  billingAddress: {
    name: String,
    phone: String,
    addressLine1: String,
    city: String,
    state: String,
    pincode: String
  },
  pricing: {
    subtotal: Number,
    discount: Number,
    couponDiscount: Number,
    shipping: Number,
    handlingFee: Number,
    tax: Number,
    total: Number,
    currency: { type: String, default: 'INR' }
  },
  payment: {
    method: { type: String, enum: ['prepaid', 'cod', 'wallet', 'upi', 'card'] },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'] },
    transactionId: String,
    paidAt: Date
  },
  delivery: {
    estimatedDelivery: Date,
    actualDelivery: Date,
    trackingNumber: String,
    trackingUrl: String,
    courier: String
  },
  pharmacyId: String,
  notes: String,
  isPrescriptionValid: { type: Boolean, default: true },
  cancelledAt: Date,
  cancellationReason: String,
  cancelledBy: String
}, { timestamps: true });

PharmacyOrderSchema.index({ userId: 1, status: 1 });
PharmacyOrderSchema.index({ 'items.medicineId': 1 });
PharmacyOrderSchema.index({ createdAt: -1 });

export interface IPharmacyOrder extends Document {
  orderId: string;
  orderNumber: string;
  userId: string;
  provider: string;
  status: string;
  items: any[];
  prescription: any;
  shippingAddress: any;
  billingAddress: any;
  pricing: any;
  payment: any;
  delivery: any;
  pharmacyId?: string;
  notes?: string;
  isPrescriptionValid: boolean;
}

export const PharmacyOrder = mongoose.model<IPharmacyOrder>('PharmacyOrder', PharmacyOrderSchema);

// ============================================
// PRESCRIPTION SCHEMA
// ============================================

export const PrescriptionSchema = new Schema({
  prescriptionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  prescriptionNumber: { type: String },
  doctorName: String,
  doctorRegistrationNumber: String,
  hospitalClinic: String,
  prescriptionDate: Date,
  validUntil: Date,
  diagnosis: String,
  medicines: [{
    medicineName: String,
    genericName: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  testReports: [{
    testName: String,
    result: String,
    unit: String,
    referenceRange: String
  }],
  imageUrls: [{ type: String }],
  status: {
    type: String,
    enum: ['uploaded', 'pending_verification', 'verified', 'expired', 'rejected'],
    default: 'uploaded'
  },
  verifiedBy: String,
  verifiedAt: Date,
  rejectionReason: String,
  isOtpVerified: { type: Boolean, default: false },
  otpVerifiedAt: Date
}, { timestamps: true });

PrescriptionSchema.index({ userId: 1, status: 1 });

export interface IPrescription extends Document {
  prescriptionId: string;
  userId: string;
  prescriptionNumber?: string;
  doctorName?: string;
  doctorRegistrationNumber?: string;
  hospitalClinic?: string;
  prescriptionDate?: Date;
  validUntil?: Date;
  diagnosis?: string;
  medicines: any[];
  testReports?: any[];
  imageUrls: string[];
  status: string;
}

export const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);

// ============================================
// PHARMACY SCHEMA
// ============================================

export const PharmacySchema = new Schema({
  pharmacyId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['retail', 'online', 'chain', 'hospital', 'compounding'],
    required: true
  },
  licenseNumber: { type: String, required: true },
  licenseExpiry: Date,
  gstNumber: String,
  address: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  contact: {
    phone: String,
    alternatePhone: String,
    email: String,
    website: String
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
    holidays: [String]
  },
  delivery: {
    available: { type: Boolean, default: false },
    minOrderValue: Number,
    deliveryFee: Number,
    freeDeliveryAbove: Number,
    estimatedDeliveryTime: String,
    pincodes: [String]
  },
  services: [{
    type: { type: String, enum: ['prescription', 'otc', 'home_delivery', 'online_consultation', 'teleconsult', 'health_checkup', 'compounding'] },
    available: { type: Boolean, default: true }
  }],
  categories: [String],
  paymentMethods: [{
    type: { type: String, enum: ['cash', 'card', 'upi', 'netbanking', 'wallet', 'cod'] },
    enabled: { type: Boolean, default: true }
  }],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

PharmacySchema.index({ 'address.city': 1, 'address.pincode': 1 });
PharmacySchema.index({ 'address.coordinates': '2dsphere' });
PharmacySchema.index({ name: 'text' });

export interface IPharmacy extends Document {
  pharmacyId: string;
  name: string;
  type: string;
  licenseNumber: string;
  licenseExpiry?: Date;
  gstNumber?: string;
  address: any;
  contact: any;
  operatingHours: any;
  delivery: any;
  services: any[];
  categories: string[];
  paymentMethods: any[];
  rating: any;
  isVerified: boolean;
  isActive: boolean;
}

export const Pharmacy = mongoose.model<IPharmacy>('Pharmacy', PharmacySchema);

// ============================================
// CART SCHEMA
// ============================================

export const CartSchema = new Schema({
  cartId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  items: [{
    medicineId: String,
    name: String,
    genericName: String,
    manufacturer: String,
    strength: String,
    dosageForm: String,
    quantity: { type: Number, default: 1 },
    unitPrice: Number,
    mrp: Number,
    discount: Number,
    totalPrice: Number,
    prescriptionRequired: Boolean,
    maxQuantity: Number
  }],
  prescriptionRequired: { type: Boolean, default: false },
  subtotal: Number,
  discount: Number,
  total: Number,
  expiresAt: Date
}, { timestamps: true });

export interface ICart extends Document {
  cartId: string;
  userId: string;
  items: any[];
  prescriptionRequired: boolean;
  subtotal: number;
  discount: number;
  total: number;
}

export const Cart = mongoose.model<ICart>('Cart', CartSchema);

// ============================================
// MEDICINE REVIEW SCHEMA
// ============================================

export const MedicineReviewSchema = new Schema({
  reviewId: { type: String, required: true, unique: true, index: true },
  medicineId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: String,
  review: String,
  effectiveness: { type: Number, min: 1, max: 5 },
  sideEffects: { type: Number, min: 1, max: 5 },
  easeOfUse: { type: Number, min: 1, max: 5 },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  isVerifiedPurchase: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  reportedCount: { type: Number, default: 0 }
}, { timestamps: true });

MedicineReviewSchema.index({ medicineId: 1, rating: -1 });

export interface IMedicineReview extends Document {
  reviewId: string;
  medicineId: string;
  userId: string;
  rating: number;
  title?: string;
  review?: string;
  effectiveness?: number;
  sideEffects?: number;
  easeOfUse?: number;
  upvotes: number;
  downvotes: number;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
}

export const MedicineReview = mongoose.model<IMedicineReview>('MedicineReview', MedicineReviewSchema);

export default {
  Medicine,
  PharmacyOrder,
  Prescription,
  Pharmacy,
  Cart,
  MedicineReview
};
