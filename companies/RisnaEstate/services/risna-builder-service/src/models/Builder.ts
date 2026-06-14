import mongoose, { Schema, Document } from 'mongoose';

// ===== PROJECT =====
export enum ProjectStatus {
  PLANNING = 'planning',
  LAUNCHED = 'launched',
  UNDER_CONSTRUCTION = 'under_construction',
  COMPLETED = 'completed',
  SOLD_OUT = 'sold_out'
}

export interface IProject extends Document {
  builderId: string;
  name: string;
  description?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: 'IN' | 'AE';
    pincode?: string;
    coordinates?: { lat: number; lng: number };
  };
  status: ProjectStatus;
  type: string[];
  totalUnits: number;
  availableUnits: number;
  soldUnits: number;
  priceRange: { min: number; max: number; currency: string };
  launchDate?: Date;
  possessionDate?: Date;
  completionDate?: Date;
  amenities?: string[];
  images?: string[];
  brochure?: string;
  floorPlans?: string[];
  totalArea?: number;
  carpetArea?: number;
  deletedAt?: Date;
}

// ===== TOWER/WING =====
export interface ITower extends Document {
  projectId: string;
  name: string;
  floors: number;
  unitsPerFloor: number;
  totalUnits: number;
  availableUnits: number;
  status: 'active' | 'inactive';
  deletedAt?: Date;
}

// ===== UNIT/FLAT =====
export enum UnitStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  BOOKED = 'booked',
  SOLD = 'sold',
  BLOCKED = 'blocked'
}

export interface IUnit extends Document {
  projectId: string;
  towerId?: string;
  unitNumber: string;
  floor: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  carpetArea: number;
  balconyArea?: number;
  price: { base: number; gov: number; other: number; total: number; currency: string };
  status: UnitStatus;
  facing?: string;
  view?: string;
  bookedBy?: string;
  bookedAt?: Date;
  deletedAt?: Date;
}

// ===== PAYMENT PLAN =====
export enum PaymentMilestone {
  BOOKING = 'booking',
  AGREEMENT = 'agreement',
  FOUNDATION = 'foundation',
  PLINTH = 'plinth',
  ROOFING = 'roofing',
  FLOORING = 'flooring',
  POSSESSION = 'possession'
}

export interface IPaymentPlan extends Document {
  projectId: string;
  name: string;
  description?: string;
  milestones: Array<{
    name: string;
    code: PaymentMilestone;
    percentage: number;
    amount: number;
    dueOn: string;
  }>;
  deletedAt?: Date;
}

// ===== INSTALLMENT =====
export enum InstallmentStatus {
  PENDING = 'pending',
  DUE = 'due',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

export interface IInstallment extends Document {
  projectId: string;
  unitId: string;
  customerId: string;
  milestone: PaymentMilestone;
  amount: number;
  currency: string;
  dueDate: Date;
  paidDate?: Date;
  status: InstallmentStatus;
  paymentId?: string;
  reminderSent: boolean;
  deletedAt?: Date;
}

// ===== CONSTRUCTION PROGRESS =====
export interface IConstructionProgress extends Document {
  projectId: string;
  phase: string;
  description: string;
  progress: number;
  targetDate?: Date;
  completedDate?: Date;
  images?: string[];
  notes?: string;
  deletedAt?: Date;
}

// ===== Schemes =====
export interface IScheme extends Document {
  projectId?: string;
  name: string;
  type: 'payment' | 'discount' | 'waiver';
  description?: string;
  validFrom: Date;
  validUntil: Date;
  conditions?: {
    minValue?: number;
    maxValue?: number;
    unitTypes?: string[];
  };
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    maxAmount?: number;
  };
  active: boolean;
  deletedAt?: Date;
}

// Project Schema
const ProjectAddressSchema = new Schema({
  line1: String,
  line2: String,
  city: String,
  state: String,
  country: { type: String, enum: ['IN', 'AE'], required: true },
  pincode: String,
  coordinates: { lat: Number, lng: Number }
}, { _id: false });

const PriceRangeSchema = new Schema({
  min: Number,
  max: Number,
  currency: { type: String, default: 'INR' }
}, { _id: false });

const ProjectSchema = new Schema<IProject>({
  builderId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: String,
  address: { type: ProjectAddressSchema, required: true },
  status: { type: String, enum: Object.values(ProjectStatus), default: ProjectStatus.PLANNING },
  type: [String],
  totalUnits: { type: Number, required: true },
  availableUnits: { type: Number, default: 0 },
  soldUnits: { type: Number, default: 0 },
  priceRange: { type: PriceRangeSchema },
  launchDate: Date,
  possessionDate: Date,
  completionDate: Date,
  amenities: [String],
  images: [String],
  brochure: String,
  floorPlans: [String],
  totalArea: Number,
  carpetArea: Number,
  deletedAt: Date
}, { timestamps: true });

ProjectSchema.index({ builderId: 1, status: 1 });
ProjectSchema.index({ 'address.country': 1, 'address.city': 1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);

// Tower Schema
const TowerSchema = new Schema<ITower>({
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  floors: { type: Number, required: true },
  unitsPerFloor: { type: Number, required: true },
  totalUnits: { type: Number, required: true },
  availableUnits: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  deletedAt: Date
}, { timestamps: true });

export const Tower = mongoose.model<ITower>('Tower', TowerSchema);

// Unit Price Schema
const UnitPriceSchema = new Schema({
  base: Number,
  gov: Number,
  other: Number,
  total: Number,
  currency: { type: String, default: 'INR' }
}, { _id: false });

// Unit Schema
const UnitSchema = new Schema<IUnit>({
  projectId: { type: String, required: true, index: true },
  towerId: String,
  unitNumber: { type: String, required: true },
  floor: { type: Number, required: true },
  type: { type: String, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  carpetArea: { type: Number, required: true },
  balconyArea: Number,
  price: { type: UnitPriceSchema, required: true },
  status: { type: String, enum: Object.values(UnitStatus), default: UnitStatus.AVAILABLE },
  facing: String,
  view: String,
  bookedBy: String,
  bookedAt: Date,
  deletedAt: Date
}, { timestamps: true });

UnitSchema.index({ projectId: 1, status: 1 });
UnitSchema.index({ projectId: 1, towerId: 1 });
UnitSchema.index({ price: 1 });

export const Unit = mongoose.model<IUnit>('Unit', UnitSchema);

// Payment Plan Schema
const MilestoneSchema = new Schema({
  name: String,
  code: { type: String, enum: Object.values(PaymentMilestone) },
  percentage: Number,
  amount: Number,
  dueOn: String
}, { _id: false });

const PaymentPlanSchema = new Schema<IPaymentPlan>({
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: String,
  milestones: [MilestoneSchema],
  deletedAt: Date
}, { timestamps: true });

export const PaymentPlan = mongoose.model<IPaymentPlan>('PaymentPlan', PaymentPlanSchema);

// Installment Schema
const InstallmentSchema = new Schema<IInstallment>({
  projectId: { type: String, required: true, index: true },
  unitId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  milestone: { type: String, enum: Object.values(PaymentMilestone), required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  dueDate: { type: Date, required: true },
  paidDate: Date,
  status: { type: String, enum: Object.values(InstallmentStatus), default: InstallmentStatus.PENDING },
  paymentId: String,
  reminderSent: { type: Boolean, default: false },
  deletedAt: Date
}, { timestamps: true });

InstallmentSchema.index({ customerId: 1, status: 1 });
InstallmentSchema.index({ dueDate: 1, status: 1 });

export const Installment = mongoose.model<IInstallment>('Installment', InstallmentSchema);

// Construction Progress Schema
const ConstructionProgressSchema = new Schema<IConstructionProgress>({
  projectId: { type: String, required: true, index: true },
  phase: { type: String, required: true },
  description: String,
  progress: { type: Number, min: 0, max: 100, default: 0 },
  targetDate: Date,
  completedDate: Date,
  images: [String],
  notes: String,
  deletedAt: Date
}, { timestamps: true });

export const ConstructionProgress = mongoose.model<IConstructionProgress>('ConstructionProgress', ConstructionProgressSchema);

// Scheme Schema
const DiscountSchema = new Schema({
  type: { type: String, enum: ['percentage', 'fixed'] },
  value: Number,
  maxAmount: Number
}, { _id: false });

const SchemeConditionsSchema = new Schema({
  minValue: Number,
  maxValue: Number,
  unitTypes: [String]
}, { _id: false });

const SchemeSchema = new Schema<IScheme>({
  projectId: String,
  name: { type: String, required: true },
  type: { type: String, enum: ['payment', 'discount', 'waiver'], required: true },
  description: String,
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  conditions: { type: SchemeConditionsSchema },
  discount: { type: DiscountSchema },
  active: { type: Boolean, default: true },
  deletedAt: Date
}, { timestamps: true });

SchemeSchema.index({ validFrom: 1, validUntil: 1, active: 1 });

export const Scheme = mongoose.model<IScheme>('Scheme', SchemeSchema);
