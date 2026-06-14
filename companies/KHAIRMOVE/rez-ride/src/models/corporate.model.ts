import mongoose, { Document, Schema } from 'mongoose';

// ===========================================
// CORPORATE ACCOUNT INTERFACE
// ===========================================
export interface ICorporateAccount extends Document {
  // Company
  companyId: string;
  companyName: string;
  domain: string; // email domain (e.g., "acme.com")
  gstIn?: string;
  pan?: string;

  // Billing
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };

  // Plan
  plan: CorporatePlan;
  status: CorporateStatus;

  // Settings
  settings: CorporateSettings;

  // Budget tracking
  budget: CorporateBudget;

  // Employees
  employeeCount: number;
  enrolledEmployees: number;

  // Integration
  corpPerksId?: string; // CorpPerks company ID
  integrationEnabled: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

// ===========================================
// NESTED TYPES
// ===========================================

export enum CorporatePlan {
  STARTER = 'starter',
  GROWTH = 'growth',
  ENTERPRISE = 'enterprise',
}

export enum CorporateStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  EXPIRED = 'expired',
}

export interface CorporateSettings {
  // Ride preferences
  allowedVehicleTypes: ('auto' | 'cab' | 'suv')[];
  maxPerRideBudget?: number;
  requireApproval: boolean;
  approvalEmails?: string[];

  // Restrictions
  restrictPickupLocations?: boolean; // Only allow office locations
  allowedPickupZones?: {
    lat: number;
    lng: number;
    radiusKm: number;
    label: string;
  }[];
  restrictDropLocations?: boolean;
  allowedDropZones?: {
    lat: number;
    lng: number;
    radiusKm: number;
    label: string;
  }[];

  // Business rules
  allowedPurposes: ('commute' | 'business' | 'client' | 'pickup' | 'delivery')[];
  requirePurpose: boolean;
  requireProjectCode: boolean;

  // Notifications
  sendMonthlyReports: boolean;
  ccEmails: string[];

  // Payment
  paymentMethod: 'prepaid' | 'postpaid';
  creditLimit?: number;
  invoiceDay: number; // 1-28
}

export interface CorporateBudget {
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  lastResetDate: Date;
  nextResetDate: Date;

  // Alerts
  lowBalanceAlert: boolean;
  lowBalanceThreshold: number; // percentage

  // Department budgets
  departmentBudgets?: {
    department: string;
    budget: number;
    spent: number;
  }[];
}

// ===========================================
// CORPORATE EMPLOYEE INTERFACE
// ===========================================
export interface ICorporateEmployee extends Document {
  // Employee
  employeeId: string;
  corporateAccountId: mongoose.Types.ObjectId;
  corpPerksEmployeeId?: string; // CorpPerks employee ID

  // Personal
  name: string;
  email: string;
  phone: string;

  // Department
  department: string;
  designation?: string;
  level: string;

  // Status
  status: EmployeeCorporateStatus;

  // Ride settings
  settings: EmployeeRideSettings;

  // Budget
  rideBudget?: number;
  rideBudgetSpent: number;

  // Stats
  totalRides: number;
  totalSpend: number;
  lastRideAt?: Date;

  // Timestamps
  enrolledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum EmployeeCorporateStatus {
  ENROLLED = 'enrolled',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

export interface EmployeeRideSettings {
  maxPerRideBudget?: number;
  allowedVehicleTypes?: ('auto' | 'cab' | 'suv')[];
  restrictToCompanyRoutes: boolean;
  canBookForOthers: boolean;
  canUseScheduledRides: boolean;
}

// ===========================================
// CORPORATE RIDE INTERFACE
// ===========================================
export interface ICorporateRide extends Document {
  // Ride link
  rideId: mongoose.Types.ObjectId;

  // Corporate
  corporateAccountId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;

  // Billing
  amount: number;
  cgst: number;
  sgst: number;
  totalAmount: number;

  // Project/Department
  projectCode?: string;
  department: string;
  purpose: 'commute' | 'business' | 'client' | 'pickup' | 'delivery';

  // Status
  status: CorporateRideStatus;

  // Approval
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: Date;
  approvedAmount?: number;

  // Invoice
  invoiceNumber?: string;
  invoiceId?: string;
  invoiceUrl?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export enum CorporateRideStatus {
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum ApprovalStatus {
  NOT_REQUIRED = 'not_required',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// ===========================================
// SCHEMAS
// ===========================================

const BillingAddressSchema = new Schema({
  line1: { type: String, required: true },
  line2: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
}, { _id: false });

const ZoneSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  radiusKm: { type: Number, required: true },
  label: { type: String, required: true },
}, { _id: false });

const DepartmentBudgetSchema = new Schema({
  department: { type: String, required: true },
  budget: { type: Number, required: true },
  spent: { type: Number, default: 0 },
}, { _id: false });

const CorporateSettingsSchema = new Schema({
  allowedVehicleTypes: [{
    type: String,
    enum: ['auto', 'cab', 'suv'],
  }],
  maxPerRideBudget: Number,
  requireApproval: { type: Boolean, default: false },
  approvalEmails: [String],
  restrictPickupLocations: { type: Boolean, default: false },
  allowedPickupZones: [ZoneSchema],
  restrictDropLocations: { type: Boolean, default: false },
  allowedDropZones: [ZoneSchema],
  allowedPurposes: [{
    type: String,
    enum: ['commute', 'business', 'client', 'pickup', 'delivery'],
  }],
  requirePurpose: { type: Boolean, default: false },
  requireProjectCode: { type: Boolean, default: false },
  sendMonthlyReports: { type: Boolean, default: true },
  ccEmails: [String],
  paymentMethod: { type: String, enum: ['prepaid', 'postpaid'], default: 'prepaid' },
  creditLimit: Number,
  invoiceDay: { type: Number, default: 1, min: 1, max: 28 },
}, { _id: false });

const CorporateBudgetSchema = new Schema({
  totalBudget: { type: Number, required: true },
  spentAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true },
  billingCycle: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
  lastResetDate: { type: Date, required: true },
  nextResetDate: { type: Date, required: true },
  lowBalanceAlert: { type: Boolean, default: true },
  lowBalanceThreshold: { type: Number, default: 20 }, // 20%
  departmentBudgets: [DepartmentBudgetSchema],
}, { _id: false });

// ===========================================
// CORPORATE ACCOUNT SCHEMA
// ===========================================
const CorporateAccountSchema = new Schema<ICorporateAccount>({
  companyId: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  domain: { type: String, required: true, lowercase: true },
  gstIn: String,
  pan: String,
  billingAddress: BillingAddressSchema,
  plan: {
    type: String,
    enum: Object.values(CorporatePlan),
    default: CorporatePlan.STARTER,
  },
  status: {
    type: String,
    enum: Object.values(CorporateStatus),
    default: CorporateStatus.TRIAL,
  },
  settings: {
    type: CorporateSettingsSchema,
    default: () => ({
      allowedVehicleTypes: ['auto', 'cab', 'suv'],
      requireApproval: false,
      allowedPurposes: ['commute', 'business', 'client'],
      requirePurpose: false,
      requireProjectCode: false,
      sendMonthlyReports: true,
      ccEmails: [],
      paymentMethod: 'prepaid',
      invoiceDay: 1,
    }),
  },
  budget: {
    type: CorporateBudgetSchema,
    required: true,
  },
  employeeCount: { type: Number, default: 0 },
  enrolledEmployees: { type: Number, default: 0 },
  corpPerksId: String,
  integrationEnabled: { type: Boolean, default: false },
  expiresAt: Date,
}, {
  timestamps: true,
});

// ===========================================
// EMPLOYEE RIDE SETTINGS SCHEMA
// ===========================================
const EmployeeRideSettingsSchema = new Schema({
  maxPerRideBudget: Number,
  allowedVehicleTypes: [{
    type: String,
    enum: ['auto', 'cab', 'suv'],
  }],
  restrictToCompanyRoutes: { type: Boolean, default: false },
  canBookForOthers: { type: Boolean, default: false },
  canUseScheduledRides: { type: Boolean, default: true },
}, { _id: false });

// ===========================================
// CORPORATE EMPLOYEE SCHEMA
// ===========================================
const CorporateEmployeeSchema = new Schema<ICorporateEmployee>({
  employeeId: { type: String, required: true, unique: true },
  corporateAccountId: { type: Schema.Types.ObjectId, ref: 'CorporateAccount', required: true },
  corpPerksEmployeeId: String,
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  designation: String,
  level: { type: String, default: 'L1' },
  status: {
    type: String,
    enum: Object.values(EmployeeCorporateStatus),
    default: EmployeeCorporateStatus.ENROLLED,
  },
  settings: {
    type: EmployeeRideSettingsSchema,
    default: () => ({
      restrictToCompanyRoutes: false,
      canBookForOthers: false,
      canUseScheduledRides: true,
    }),
  },
  rideBudget: Number,
  rideBudgetSpent: { type: Number, default: 0 },
  totalRides: { type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 },
  lastRideAt: Date,
  enrolledAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// ===========================================
// CORPORATE RIDE SCHEMA
// ===========================================
const CorporateRideSchema = new Schema<ICorporateRide>({
  rideId: { type: Schema.Types.ObjectId, ref: 'Ride', required: true },
  corporateAccountId: { type: Schema.Types.ObjectId, ref: 'CorporateAccount', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'CorporateEmployee', required: true },
  amount: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  projectCode: String,
  department: { type: String, required: true },
  purpose: {
    type: String,
    enum: ['commute', 'business', 'client', 'pickup', 'delivery'],
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(CorporateRideStatus),
    default: CorporateRideStatus.COMPLETED,
  },
  approvalStatus: {
    type: String,
    enum: Object.values(ApprovalStatus),
    default: ApprovalStatus.NOT_REQUIRED,
  },
  approvedBy: String,
  approvedAt: Date,
  approvedAmount: Number,
  invoiceNumber: String,
  invoiceId: String,
  invoiceUrl: String,
}, {
  timestamps: true,
});

// ===========================================
// INDEXES
// ===========================================
CorporateAccountSchema.index({ domain: 1 }, { unique: true });
CorporateAccountSchema.index({ companyId: 1 }, { unique: true });
CorporateAccountSchema.index({ status: 1 });
CorporateEmployeeSchema.index({ corporateAccountId: 1, status: 1 });
CorporateEmployeeSchema.index({ email: 1 });
CorporateEmployeeSchema.index({ corpPerksEmployeeId: 1 });
CorporateRideSchema.index({ corporateAccountId: 1, status: 1 });
CorporateRideSchema.index({ corporateAccountId: 1, 'employeeId': 1 });
CorporateRideSchema.index({ invoiceNumber: 1 });

// ===========================================
// METHODS
// ===========================================

// Corporate Account methods
CorporateAccountSchema.methods.canUserRide = function(
  userEmail: string,
  vehicleType: string,
  amount: number
): { canRide: boolean; reason?: string } {
  // Check status
  if (this.status !== CorporateStatus.ACTIVE) {
    return { canRide: false, reason: 'Corporate account is not active' };
  }

  // Check budget
  if (this.budget.remainingAmount < amount) {
    return { canRide: false, reason: 'Insufficient corporate budget' };
  }

  // Check vehicle type
  if (!this.settings.allowedVehicleTypes.includes(vehicleType as any)) {
    return { canRide: false, reason: `Vehicle type ${vehicleType} not allowed` };
  }

  // Check max per ride
  if (this.settings.maxPerRideBudget && amount > this.settings.maxPerRideBudget) {
    return { canRide: false, reason: 'Amount exceeds maximum per ride budget' };
  }

  return { canRide: true };
};

CorporateAccountSchema.methods.addExpense = function(amount: number, department?: string) {
  this.budget.spentAmount += amount;
  this.budget.remainingAmount -= amount;

  if (department && this.budget.departmentBudgets) {
    const dept = this.budget.departmentBudgets.find((d: { department: string }) => d.department === department);
    if (dept) {
      dept.spent += amount;
    }
  }
};

// Corporate Employee methods
CorporateEmployeeSchema.methods.canBookRide = function(
  vehicleType: string,
  amount: number
): { canBook: boolean; reason?: string } {
  if (this.status !== EmployeeCorporateStatus.ENROLLED) {
    return { canBook: false, reason: 'Employee not enrolled' };
  }

  if (this.settings.maxPerRideBudget && amount > this.settings.maxPerRideBudget) {
    return { canBook: false, reason: 'Amount exceeds your ride budget' };
  }

  if (this.settings.allowedVehicleTypes && !this.settings.allowedVehicleTypes.includes(vehicleType as any)) {
    return { canBook: false, reason: 'Vehicle type not allowed' };
  }

  if (this.rideBudget && this.rideBudgetSpent + amount > this.rideBudget) {
    return { canBook: false, reason: 'Monthly ride budget exceeded' };
  }

  return { canBook: true };
};

// ===========================================
// EXPORTS
// ===========================================
export const CorporateAccount = mongoose.model<ICorporateAccount>('CorporateAccount', CorporateAccountSchema);
export const CorporateEmployee = mongoose.model<ICorporateEmployee>('CorporateEmployee', CorporateEmployeeSchema);
export const CorporateRide = mongoose.model<ICorporateRide>('CorporateRide', CorporateRideSchema);

// Type aliases for TypeScript
export type CorporateAccount = ICorporateAccount;
export type CorporateEmployee = ICorporateEmployee;
export type CorporateRide = ICorporateRide;
