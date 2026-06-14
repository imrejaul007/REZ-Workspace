import mongoose, { Document, Schema } from 'mongoose';

export enum PackageType {
  HAIR = 'hair',
  SKIN = 'skin',
  NAILS = 'nails',
  MAKEUP = 'makeup',
  MASSAGE = 'massage',
  SPA = 'spa',
  DENTAL = 'dental',
  OTHER = 'other',
}

export enum PackageCategory {
  CUT_WASH_STYLE = 'cut_wash_style',
  COLOR_CUT = 'color_cut',
  HAIR_TREATMENT = 'hair_treatment',
  FACIAL = 'facial',
  BODY_TREATMENT = 'body_treatment',
  NAIL_CARE = 'nail_care',
  MAKEUP_ARTISTRY = 'makeup_artistry',
  RELAXATION = 'relaxation',
  COMBO = 'combo',
  CUSTOM = 'custom',
}

export enum PackageStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
}

export interface IPackage extends Document {
  packageId: string;
  name: string;
  description: string;
  type: PackageType;
  category: PackageCategory;
  services: string[];
  duration: number; // in minutes
  price: number;
  currency: string;
  originalPrice?: number;
  validityDays: number;
  maxRedemptions?: number;
  status: PackageStatus;
  isPrepaidCard: boolean;
  prepaidCardValue?: number;
  familyPlan: boolean;
  maxFamilyMembers?: number;
  corporateEligible: boolean;
  corporateDiscount?: number;
  images?: string[];
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>(
  {
    packageId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: Object.values(PackageType), required: true, index: true },
    category: { type: String, enum: Object.values(PackageCategory), required: true },
    services: { type: [String], required: true },
    duration: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    originalPrice: { type: Number, min: 0 },
    validityDays: { type: Number, required: true, min: 1 },
    maxRedemptions: { type: Number, min: 1 },
    status: { type: String, enum: Object.values(PackageStatus), default: PackageStatus.ACTIVE },
    isPrepaidCard: { type: Boolean, default: false },
    prepaidCardValue: { type: Number },
    familyPlan: { type: Boolean, default: false },
    maxFamilyMembers: { type: Number, min: 1 },
    corporateEligible: { type: Boolean, default: false },
    corporateDiscount: { type: Number, min: 0, max: 100 },
    images: { type: [String] },
    tags: { type: [String], index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexes
PackageSchema.index({ status: 1, type: 1 });
PackageSchema.index({ price: 1 });
PackageSchema.index({ familyPlan: 1 });
PackageSchema.index({ corporateEligible: 1 });
PackageSchema.index({ tags: 1 });

export const Package = mongoose.model<IPackage>('Package', PackageSchema);
