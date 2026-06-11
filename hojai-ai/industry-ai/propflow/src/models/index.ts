/**
 * PROPFLOW - Real Estate AI Operating System
 * Production-Ready MongoDB Models
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================
// PROPERTY MODEL
// ============================================

export interface IProperty extends Document {
  title: string;
  type: 'apartment' | 'villa' | 'plot' | 'commercial' | 'office' | 'penthouse' | 'townhouse';
  status: 'available' | 'sold' | 'reserved' | 'under-construction' | 'unavailable';
  price: number;
  pricePerSqft?: number;
  location: {
    address: string;
    city: string;
    pincode: string;
    locality: string;
    latitude?: number;
    longitude?: number;
  };
  specifications: {
    bedrooms?: number;
    bathrooms?: number;
    area: number;
    areaUnit: 'sqft' | 'sqm' | 'sqyd';
    floor?: number;
    totalFloors?: number;
    parkingSpaces?: number;
  };
  amenities: string[];
  images: string[];
  description?: string;
  ownerId: string;
  ownerName?: string;
  ownerPhone?: string;
  createdBy?: string;
  viewCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    type: {
      type: String,
      required: true,
      enum: ['apartment', 'villa', 'plot', 'commercial', 'office', 'penthouse', 'townhouse'],
      lowercase: true
    },
    status: {
      type: String,
      required: true,
      enum: ['available', 'sold', 'reserved', 'under-construction', 'unavailable'],
      default: 'available',
      lowercase: true
    },
    price: { type: Number, required: true, min: 0 },
    pricePerSqft: { type: Number },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String },
      locality: { type: String, required: true },
      latitude: { type: Number },
      longitude: { type: Number }
    },
    specifications: {
      bedrooms: { type: Number, min: 0 },
      bathrooms: { type: Number, min: 0 },
      area: { type: Number, required: true, min: 1 },
      areaUnit: { type: String, enum: ['sqft', 'sqm', 'sqyd'], default: 'sqft' },
      floor: { type: Number },
      totalFloors: { type: Number },
      parkingSpaces: { type: Number, min: 0 }
    },
    amenities: [{ type: String }],
    images: [{ type: String }],
    description: { type: String, maxlength: 5000 },
    ownerId: { type: String, required: true },
    ownerName: { type: String },
    ownerPhone: { type: String },
    createdBy: { type: String },
    viewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Indexes
PropertySchema.index({ status: 1, type: 1 });
PropertySchema.index({ price: 1 });
PropertySchema.index({ 'location.city': 1, 'location.locality': 1 });
PropertySchema.index({ 'specifications.bedrooms': 1 });
PropertySchema.index({ ownerId: 1 });
PropertySchema.index({ createdAt: -1 });
PropertySchema.index({ title: 'text', 'location.locality': 'text', description: 'text' });

// ============================================
// LEAD MODEL
// ============================================

export interface ILead extends Document {
  name: string;
  phone: string;
  email?: string;
  source: 'website' | 'phone' | 'walkin' | 'referral' | 'agent' | 'social' | 'advertisement';
  budget: { min: number; max: number };
  requirements?: {
    type?: string;
    bedrooms?: number;
    bathrooms?: number;
    location?: string;
    amenities?: string[];
    minArea?: number;
    maxArea?: number;
  };
  status: 'new' | 'contacted' | 'qualified' | 'visiting' | 'negotiating' | 'closed-won' | 'closed-lost';
  score: number;
  scoreTier: 'hot' | 'warm' | 'cold';
  qualificationFactors: string[];
  assignedAgentId?: string;
  lastContact?: Date;
  nextFollowUp?: Date;
  notes: string[];
  propertyInterests: Types.ObjectId[];
  visitCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    source: {
      type: String,
      required: true,
      enum: ['website', 'phone', 'walkin', 'referral', 'agent', 'social', 'advertisement'],
      lowercase: true
    },
    budget: {
      min: { type: Number, default: 0, min: 0 },
      max: { type: Number, required: true, min: 0 }
    },
    requirements: {
      type: { type: String },
      bedrooms: { type: Number },
      bathrooms: { type: Number },
      location: { type: String },
      amenities: [{ type: String }],
      minArea: { type: Number },
      maxArea: { type: Number }
    },
    status: {
      type: String,
      required: true,
      enum: ['new', 'contacted', 'qualified', 'visiting', 'negotiating', 'closed-won', 'closed-lost'],
      default: 'new',
      lowercase: true
    },
    score: { type: Number, default: 50, min: 0, max: 100 },
    scoreTier: { type: String, enum: ['hot', 'warm', 'cold'], default: 'warm' },
    qualificationFactors: [{ type: String }],
    assignedAgentId: { type: String },
    lastContact: { type: Date },
    nextFollowUp: { type: Date },
    notes: [{ type: String }],
    propertyInterests: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
    visitCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Indexes
LeadSchema.index({ status: 1 });
LeadSchema.index({ source: 1 });
LeadSchema.index({ score: -1 });
LeadSchema.index({ scoreTier: 1 });
LeadSchema.index({ assignedAgentId: 1 });
LeadSchema.index({ nextFollowUp: 1 });
LeadSchema.index({ phone: 1 });
LeadSchema.index({ email: 1 });
LeadSchema.index({ createdAt: -1 });

// ============================================
// SITE VISIT MODEL
// ============================================

export interface ISiteVisit extends Document {
  propertyId: Types.ObjectId;
  leadId: Types.ObjectId;
  date: Date;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no-show';
  feedback?: string;
  rating?: number;
  agentId?: string;
  notes?: string;
  reminderSent: boolean;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SiteVisitSchema = new Schema<ISiteVisit>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    duration: { type: Number, default: 30 },
    status: {
      type: String,
      required: true,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show'],
      default: 'scheduled',
      lowercase: true
    },
    feedback: { type: String, maxlength: 1000 },
    rating: { type: Number, min: 1, max: 5 },
    agentId: { type: String },
    notes: { type: String, maxlength: 500 },
    reminderSent: { type: Boolean, default: false },
    confirmedAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes
SiteVisitSchema.index({ leadId: 1, status: 1 });
SiteVisitSchema.index({ propertyId: 1, status: 1 });
SiteVisitSchema.index({ date: 1, status: 1 });
SiteVisitSchema.index({ agentId: 1 });
SiteVisitSchema.index({ createdAt: -1 });

// ============================================
// DEAL MODEL
// ============================================

export interface IDeal extends Document {
  propertyId: Types.ObjectId;
  leadId: Types.ObjectId;
  offerPrice: number;
  askingPrice?: number;
  status: 'negotiating' | 'accepted' | 'documents' | 'registered' | 'closed';
  stage: 'negotiating' | 'accepted' | 'documents' | 'registered' | 'closed';
  probability: number;
  agentId?: string;
  notes: string[];
  expectedCloseDate?: Date;
  closedAt?: Date;
  closeReason?: string;
  commission?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    offerPrice: { type: Number, required: true, min: 0 },
    askingPrice: { type: Number },
    status: {
      type: String,
      required: true,
      enum: ['negotiating', 'accepted', 'documents', 'registered', 'closed'],
      default: 'negotiating',
      lowercase: true
    },
    stage: {
      type: String,
      required: true,
      enum: ['negotiating', 'accepted', 'documents', 'registered', 'closed'],
      default: 'negotiating',
      lowercase: true
    },
    probability: { type: Number, default: 50, min: 0, max: 100 },
    agentId: { type: String },
    notes: [{ type: String }],
    expectedCloseDate: { type: Date },
    closedAt: { type: Date },
    closeReason: { type: String },
    commission: { type: Number }
  },
  { timestamps: true }
);

// Indexes
DealSchema.index({ status: 1, stage: 1 });
DealSchema.index({ leadId: 1 });
DealSchema.index({ propertyId: 1 });
DealSchema.index({ agentId: 1 });
DealSchema.index({ createdAt: -1 });
DealSchema.index({ closedAt: -1 });

// ============================================
// USER MODEL
// ============================================

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'agent' | 'manager' | 'viewer';
  assignedRegion?: string;
  isActive: boolean;
  lastLogin?: Date;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'agent', 'manager', 'viewer'],
      default: 'agent',
      lowercase: true
    },
    assignedRegion: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ============================================
// EXPORT MODELS
// ============================================

export const Property = mongoose.model<IProperty>('Property', PropertySchema);
export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
export const SiteVisit = mongoose.model<ISiteVisit>('SiteVisit', SiteVisitSchema);
export const Deal = mongoose.model<IDeal>('Deal', DealSchema);
export const User = mongoose.model<IUser>('User', UserSchema);

export const Models = { Property, Lead, SiteVisit, Deal, User };
export default Models;