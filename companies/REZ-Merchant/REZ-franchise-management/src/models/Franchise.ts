import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFranchise extends Document {
  name: string;
  franchiseCode: string;
  ownerId: Types.ObjectId;
  franchiseeId?: Types.ObjectId;
  type: 'owned' | 'franchise';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    coordinates?: { lat: number; lng: number };
  };
  contact: {
    phone: string;
    email: string;
    managerName?: string;
  };
  businessHours: {
    open: string;
    close: string;
    is24Hours: boolean;
    closedDays?: string[];
  };
  license: {
    fssai?: string;
    gst: string;
    pan: string;
    shopAct?: string;
  };
  bankDetails: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
    accountHolder: string;
  };
  royalty: {
    percentage: number;
    paymentCycle: 'monthly' | 'quarterly';
    lastPaidAt?: Date;
  };
  revenueShare: {
    franchiseShare: number;
    companyShare: number;
  };
  targets: {
    monthlyTarget: number;
    achievementPercentage: number;
  };
  rating?: number;
  totalOrders: number;
  totalRevenue: number;
  isActive: boolean;
  openedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFranchiseUser extends Document {
  franchiseId: Types.ObjectId;
  userId: Types.ObjectId;
  role: 'owner' | 'manager' | 'staff';
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFranchisePerformance extends Document {
  franchiseId: Types.ObjectId;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  metrics: {
    orders: number;
    revenue: number;
    avgOrderValue: number;
    customerCount: number;
    newCustomers: number;
    returningCustomers: number;
    ratings: { count: number; avg: number };
    inventoryTurnover: number;
  };
  createdAt: Date;
}

const FranchiseSchema = new Schema({
  name: { type: String, required: true, index: true },
  franchiseCode: { type: String, required: true, unique: true, index: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  franchiseeId: { type: Schema.Types.ObjectId, ref: 'Franchisee' },
  type: { type: String, enum: ['owned', 'franchise'], required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'pending'], default: 'pending' },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: String,
    coordinates: { lat: Number, lng: Number },
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    managerName: String,
  },
  businessHours: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '22:00' },
    is24Hours: { type: Boolean, default: false },
    closedDays: [String],
  },
  license: {
    fssai: String,
    gst: { type: String, required: true },
    pan: { type: String, required: true },
    shopAct: String,
  },
  bankDetails: {
    accountNumber: String,
    ifsc: String,
    bankName: String,
    accountHolder: String,
  },
  royalty: {
    percentage: { type: Number, default: 5 },
    paymentCycle: { type: String, enum: ['monthly', 'quarterly'], default: 'monthly' },
    lastPaidAt: Date,
  },
  revenueShare: {
    franchiseShare: { type: Number, default: 70 },
    companyShare: { type: Number, default: 30 },
  },
  targets: {
    monthlyTarget: { type: Number, default: 100000 },
    achievementPercentage: { type: Number, default: 0 },
  },
  rating: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  openedAt: { type: Date, default: Date.now },
}, { timestamps: true });

FranchiseSchema.index({ status: 1, isActive: 1 });
FranchiseSchema.index({ 'address.city': 1, 'address.state': 1 });

const FranchiseUserSchema = new Schema({
  franchiseId: { type: Schema.Types.ObjectId, ref: 'Franchise', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['owner', 'manager', 'staff'], required: true },
  permissions: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

FranchiseUserSchema.index({ franchiseId: 1, userId: 1 }, { unique: true });

const FranchisePerformanceSchema = new Schema({
  franchiseId: { type: Schema.Types.ObjectId, ref: 'Franchise', required: true, index: true },
  period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  date: { type: Date, required: true },
  metrics: {
    orders: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    avgOrderValue: { type: Number, default: 0 },
    customerCount: { type: Number, default: 0 },
    newCustomers: { type: Number, default: 0 },
    returningCustomers: { type: Number, default: 0 },
    ratings: {
      count: { type: Number, default: 0 },
      avg: { type: Number, default: 0 },
    },
    inventoryTurnover: { type: Number, default: 0 },
  },
}, { timestamps: true });

FranchisePerformanceSchema.index({ franchiseId: 1, date: -1 });

export const Franchise = mongoose.models.Franchise || mongoose.model<IFranchise>('Franchise', FranchiseSchema);
export const FranchiseUser = mongoose.models.FranchiseUser || mongoose.model<IFranchiseUser>('FranchiseUser', FranchiseUserSchema);
export const FranchisePerformance = mongoose.models.FranchisePerformance || mongoose.model<IFranchisePerformance>('FranchisePerformance', FranchisePerformanceSchema);
