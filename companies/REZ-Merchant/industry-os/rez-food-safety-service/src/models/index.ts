/**
 * Food Safety Models
 * FSSAI Compliance & HACCP Tracking
 */

import mongoose, { Document, Schema } from 'mongoose';

// ============================================================
// TEMPERATURE LOG
// ============================================================

export interface ITemperatureLog extends Document {
  merchantId: string;
  restaurantId: string;
  coldRoomId?: string;
  foodItemId: string;
  foodName: string;
  zone: 'freezer' | 'chiller' | 'hot-hold' | 'ambient';
  temperature: number; // in Celsius
  status: 'normal' | 'warning' | 'critical';
  recordedBy: string;
  recordedAt: Date;
  notes?: string;
  createdAt: Date;
}

const temperatureLogSchema = new Schema<ITemperatureLog>({
  merchantId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  coldRoomId: String,
  foodItemId: { type: String, required: true },
  foodName: { type: String, required: true },
  zone: {
    type: String,
    enum: ['freezer', 'chiller', 'hot-hold', 'ambient'],
    required: true
  },
  temperature: { type: Number, required: true },
  status: {
    type: String,
    enum: ['normal', 'warning', 'critical'],
    default: 'normal'
  },
  recordedBy: { type: String, required: true },
  recordedAt: { type: Date, default: Date.now },
  notes: String,
}, { timestamps: true });

temperatureLogSchema.index({ restaurantId: 1, recordedAt: -1 });
temperatureLogSchema.index({ foodItemId: 1 });

export const TemperatureLog = mongoose.model<ITemperatureLog>('TemperatureLog', temperatureLogSchema);

// ============================================================
// EXPIRY TRACKING
// ============================================================

export interface IExpiryTracking extends Document {
  merchantId: string;
  restaurantId: string;
  itemId: string;
  itemName: string;
  category: string;
  batchNumber?: string;
  manufacturingDate: Date;
  expiryDate: Date;
  quantity: number;
  unit: string;
  status: 'fresh' | 'expiring-soon' | 'expired' | 'disposed';
  disposedAt?: Date;
  disposedQuantity?: number;
  disposalReason?: string;
  disposedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expiryTrackingSchema = new Schema<IExpiryTracking>({
  merchantId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  batchNumber: String,
  manufacturingDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true, index: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  status: {
    type: String,
    enum: ['fresh', 'expiring-soon', 'expired', 'disposed'],
    default: 'fresh'
  },
  disposedAt: Date,
  disposedQuantity: Number,
  disposalReason: String,
  disposedBy: String,
}, { timestamps: true });

expiryTrackingSchema.index({ restaurantId: 1, status: 1, expiryDate: 1 });

export const ExpiryTracking = mongoose.model<IExpiryTracking>('ExpiryTracking', expiryTrackingSchema);

// ============================================================
// HACCP CHECKLIST
// ============================================================

export interface IHACCPCheck extends Document {
  merchantId: string;
  restaurantId: string;
  checklistId: string;
  checklistName: string;
  checkType: 'temperature' | 'cleanliness' | 'storage' | 'handling' | 'general';
  checklistItems: Array<{
    item: string;
    status: 'compliant' | 'non-compliant' | 'na';
    notes?: string;
    imageUrl?: string;
  }>;
  checkedBy: string;
  checkedAt: Date;
  overallStatus: 'passed' | 'failed' | 'partial';
  correctiveAction?: string;
  supervisorApproval?: string;
  approvedAt?: Date;
  createdAt: Date;
}

const haccpCheckSchema = new Schema<IHACCPCheck>({
  merchantId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  checklistId: { type: String, required: true },
  checklistName: { type: String, required: true },
  checkType: {
    type: String,
    enum: ['temperature', 'cleanliness', 'storage', 'handling', 'general'],
    required: true
  },
  checklistItems: [{
    item: String,
    status: { type: String, enum: ['compliant', 'non-compliant', 'na'] },
    notes: String,
    imageUrl: String
  }],
  checkedBy: { type: String, required: true },
  checkedAt: { type: Date, default: Date.now },
  overallStatus: {
    type: String,
    enum: ['passed', 'failed', 'partial'],
    required: true
  },
  correctiveAction: String,
  supervisorApproval: String,
  approvedAt: Date,
}, { timestamps: true });

haccpCheckSchema.index({ restaurantId: 1, checkedAt: -1 });
haccpCheckSchema.index({ checkType: 1, checkedAt: -1 });

export const HACCPCheck = mongoose.model<IHACCPCheck>('HACCPCheck', haccpCheckSchema);

// ============================================================
// FOOD SAFETY INCIDENT
// ============================================================

export interface IFoodIncident extends Document {
  merchantId: string;
  restaurantId: string;
  incidentId: string;
  type: 'contamination' | 'allergy-reaction' | 'foreign-body' | 'spoilage' | 'temperature-breach' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedItems: string[];
  affectedCustomers?: number;
  immediateAction: string;
  rootCause?: string;
  correctiveAction: string;
  reportedBy: string;
  reportedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  escalatedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const foodIncidentSchema = new Schema<IFoodIncident>({
  merchantId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  incidentId: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['contamination', 'allergy-reaction', 'foreign-body', 'spoilage', 'temperature-breach', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  description: { type: String, required: true },
  affectedItems: [String],
  affectedCustomers: Number,
  immediateAction: { type: String, required: true },
  rootCause: String,
  correctiveAction: String,
  reportedBy: { type: String, required: true },
  reportedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  resolvedBy: String,
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'escalated'],
    default: 'open'
  },
  escalatedTo: String,
}, { timestamps: true });

foodIncidentSchema.index({ restaurantId: 1, status: 1 });
foodIncidentSchema.index({ incidentId: 1 });

export const FoodIncident = mongoose.model<IFoodIncident>('FoodIncident', foodIncidentSchema);

// ============================================================
// ALLERGEN MANAGEMENT
// ============================================================

export interface IAllergenProfile extends Document {
  merchantId: string;
  restaurantId: string;
  itemId: string;
  itemName: string;
  allergens: Array<{
    type: string;
    severity: 'trace' | 'may-contain' | 'present';
  }>;
  dietaryFlags: string[]; // vegan, vegetarian, jain, halal, kosher
  lastUpdated: Date;
  updatedBy: string;
}

const allergenProfileSchema = new Schema<IAllergenProfile>({
  merchantId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  itemId: { type: String, required: true, index: true },
  itemName: { type: String, required: true },
  allergens: [{
    type: String,
    severity: { type: String, enum: ['trace', 'may-contain', 'present'] }
  }],
  dietaryFlags: [String],
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: String,
});

allergenProfileSchema.index({ itemId: 1 }, { unique: true });

export const AllergenProfile = mongoose.model<IAllergenProfile>('AllergenProfile', allergenProfileSchema);
