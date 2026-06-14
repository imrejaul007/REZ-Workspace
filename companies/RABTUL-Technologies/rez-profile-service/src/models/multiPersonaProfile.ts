/**
 * Multi-Persona Profile Model
 * Extends the base UserProfile with multi-persona support
 */

import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';
import {
  PersonaType,
  LegacySegment,
  PersonaMetadata,
  StudentExtension,
  EmployeeExtension,
  CreatorExtension,
  BusinessExtension,
  FreelancerExtension,
  PremiumExtension,
} from '../types/persona';

// ─── PII Encryption Helpers ───────────────────────────────────────────────────

const ENCRYPTION_KEY = process.env.PROFILE_ENCRYPTION_KEY || 'default-dev-key-32-bytes-long!!!';
const ALGORITHM = 'aes-256-cbc';

function encryptField(value: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decryptField(value: string): string {
  const [ivHex, encrypted] = value.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function encryptIfNeeded(value: string | undefined): string | undefined {
  if (!value) return value;
  if (value.includes(':')) return value; // Already encrypted
  return encryptField(value);
}

function decryptIfNeeded(value: string | undefined): string | undefined {
  if (!value) return value;
  if (!value.includes(':')) return value; // Not encrypted
  try {
    return decryptField(value);
  } catch (error) {
    // Log but don't fail - return encrypted value as-is
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[MultiPersonaProfile] Decryption failed: ${errorMessage}`);
    return value; // Return as-is if decryption fails
  }
}

// ─── Schema Definitions ──────────────────────────────────────────────────────

const PersonaMetadataSchema = new Schema<PersonaMetadata>(
  {
    persona: { type: String, required: true },
    activatedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verificationData: {
      eduEmail: String,
      collegeId: String,
      companyEmail: String,
      companyName: String,
      gstNumber: String,
      merchantId: String,
    },
    apps: [{ type: String }],
    isActive: { type: Boolean, default: false },
  },
  { _id: false }
);

const StudentExtensionSchema = new Schema<StudentExtension>(
  {
    college: String,
    collegeId: String,
    eduEmail: String,
    degree: String,
    branch: String,
    yearOfGraduation: Number,
    skills: [String],
    certifications: [String],
    internships: [
      {
        company: String,
        role: String,
        duration: String,
        completed: Boolean,
      },
    ],
    portfolio: String,
  },
  { _id: false }
);

const EmployeeExtensionSchema = new Schema<EmployeeExtension>(
  {
    company: String,
    companyId: String,
    companyEmail: String,
    department: String,
    role: String,
    level: String,
    joiningDate: Date,
    managerId: String,
    employeeId: String,
    teamSize: Number,
  },
  { _id: false }
);

const CreatorExtensionSchema = new Schema<CreatorExtension>(
  {
    displayName: String,
    category: String,
    followers: Number,
    contentCount: Number,
    engagementRate: Number,
    platforms: [
      {
        platform: String,
        handle: String,
        url: String,
      },
    ],
    niches: [String],
    averageViews: Number,
    collaborationRate: Number,
  },
  { _id: false }
);

const BusinessExtensionSchema = new Schema<BusinessExtension>(
  {
    businessName: String,
    gstNumber: String,
    businessType: String,
    industry: String,
    employeeCount: String,
    annualRevenue: String,
    locations: [
      {
        type: String,
        address: String,
        city: String,
        state: String,
        pincode: String,
      },
    ],
    restaurantCount: Number,
    merchantId: String,
  },
  { _id: false }
);

const FreelancerExtensionSchema = new Schema<FreelancerExtension>(
  {
    skills: [String],
    hourlyRate: Number,
    availability: String,
    portfolio: String,
    completedGigs: Number,
    rating: Number,
    responseTime: String,
    languages: [String],
    workHistory: [
      {
        client: String,
        project: String,
        duration: String,
        rating: Number,
      },
    ],
  },
  { _id: false }
);

const PremiumExtensionSchema = new Schema<PremiumExtension>(
  {
    tier: String,
    memberSince: Date,
    renewalDate: Date,
    benefits: [String],
    conciergeEnabled: Boolean,
  },
  { _id: false }
);

// ─── Main Multi-Persona Profile Schema ─────────────────────────────────────────

const PERSONA_TYPES = ['student', 'employee', 'creator', 'business', 'freelancer', 'premium', 'normal'];
const LEGACY_SEGMENTS = ['normal', 'verified', 'student', 'pro', 'creator', 'business', 'influencer', 'host', 'vip'];

export interface IMultiPersonaProfile extends Document {
  // Core Identity
  userId: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  role: string;
  segment: LegacySegment;

  // Multi-Persona System
  primaryPersona: PersonaType;
  secondaryPersonas: PersonaType[];
  activePersona: PersonaType;
  personas: Record<PersonaType, PersonaMetadata>;

  // Persona Extensions
  studentExtension?: StudentExtension;
  employeeExtension?: EmployeeExtension;
  creatorExtension?: CreatorExtension;
  businessExtension?: BusinessExtension;
  freelancerExtension?: FreelancerExtension;
  premiumExtension?: PremiumExtension;

  // Standard Fields
  isVerified: boolean;
  isOnboarded: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MultiPersonaProfileSchema = new Schema<IMultiPersonaProfile>(
  {
    // Core Identity
    userId: { type: String, required: true, unique: true, index: true },
    phone: String,
    email: String,
    firstName: String,
    lastName: String,
    avatar: String,
    bio: String,
    dateOfBirth: String,
    gender: String,
    role: { type: String, default: 'user' },
    segment: { type: String, enum: LEGACY_SEGMENTS, default: 'normal' },

    // Multi-Persona System
    primaryPersona: { type: String, enum: PERSONA_TYPES, default: 'normal' },
    secondaryPersonas: [{ type: String, enum: PERSONA_TYPES }],
    activePersona: { type: String, enum: PERSONA_TYPES, default: 'normal' },
    personas: {
      type: Map,
      of: PersonaMetadataSchema,
      default: {},
    },

    // Persona Extensions
    studentExtension: StudentExtensionSchema,
    employeeExtension: EmployeeExtensionSchema,
    creatorExtension: CreatorExtensionSchema,
    businessExtension: BusinessExtensionSchema,
    freelancerExtension: FreelancerExtensionSchema,
    premiumExtension: PremiumExtensionSchema,

    // Standard Fields
    isVerified: { type: Boolean, default: false },
    isOnboarded: { type: Boolean, default: false },
    deletedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    // Prevent adding __t discriminator
    discriminatorKey: undefined,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

MultiPersonaProfileSchema.index({ email: 1 });
MultiPersonaProfileSchema.index({ phone: 1 });
MultiPersonaProfileSchema.index({ 'personas.student.verified': 1 });
MultiPersonaProfileSchema.index({ 'personas.employee.verified': 1 });
MultiPersonaProfileSchema.index({ primaryPersona: 1 });
MultiPersonaProfileSchema.index({ segment: 1 });

// ─── Pre-save Hook ─────────────────────────────────────────────────────────────

MultiPersonaProfileSchema.pre('save', function (next) {
  // Ensure max 3 secondary personas
  if (this.secondaryPersonas.length > 3) {
    this.secondaryPersonas = this.secondaryPersonas.slice(0, 3);
  }

  // Ensure activePersona is in personas
  if (!this.personas.get(this.activePersona)) {
    this.personas.set(this.activePersona, {
      persona: this.activePersona,
      activatedAt: new Date(),
      verified: false,
      apps: [],
      isActive: true,
    });
  }

  // Encrypt PII fields before saving
  this.email = encryptIfNeeded(this.email);
  this.phone = encryptIfNeeded(this.phone);
  this.dateOfBirth = encryptIfNeeded(this.dateOfBirth);

  // Encrypt extension PII fields
  if (this.studentExtension) {
    this.studentExtension.eduEmail = encryptIfNeeded(this.studentExtension.eduEmail);
    this.studentExtension.collegeId = encryptIfNeeded(this.studentExtension.collegeId);
  }
  if (this.employeeExtension) {
    this.employeeExtension.companyEmail = encryptIfNeeded(this.employeeExtension.companyEmail);
    this.employeeExtension.employeeId = encryptIfNeeded(this.employeeExtension.employeeId);
  }
  if (this.businessExtension) {
    this.businessExtension.gstNumber = encryptIfNeeded(this.businessExtension.gstNumber);
    this.businessExtension.panNumber = encryptIfNeeded(this.businessExtension.panNumber);
  }

  next();
});

// ─── Post-find Hooks (Decrypt on read) ─────────────────────────────────────────

MultiPersonaProfileSchema.post('find', function (docs) {
  if (Array.isArray(docs)) {
    docs.forEach((doc) => decryptProfile(doc));
  }
});

MultiPersonaProfileSchema.post('findOne', function (doc) {
  if (doc) decryptProfile(doc);
});

function decryptProfile(doc) {
  if (!doc) return;
  doc.email = decryptIfNeeded(doc.email);
  doc.phone = decryptIfNeeded(doc.phone);
  doc.dateOfBirth = decryptIfNeeded(doc.dateOfBirth);

  if (doc.studentExtension) {
    doc.studentExtension.eduEmail = decryptIfNeeded(doc.studentExtension.eduEmail);
    doc.studentExtension.collegeId = decryptIfNeeded(doc.studentExtension.collegeId);
  }
  if (doc.employeeExtension) {
    doc.employeeExtension.companyEmail = decryptIfNeeded(doc.employeeExtension.companyEmail);
    doc.employeeExtension.employeeId = decryptIfNeeded(doc.employeeExtension.employeeId);
  }
  if (doc.businessExtension) {
    doc.businessExtension.gstNumber = decryptIfNeeded(doc.businessExtension.gstNumber);
    doc.businessExtension.panNumber = decryptIfNeeded(doc.businessExtension.panNumber);
  }
}

// ─── Methods ───────────────────────────────────────────────────────────────────

MultiPersonaProfileSchema.methods.activatePersona = function (persona: PersonaType, app?: string) {
  if (!this.personas.get(persona)) {
    this.personas.set(persona, {
      persona,
      activatedAt: new Date(),
      verified: false,
      apps: [],
      isActive: false,
    });
  }

  const meta = this.personas.get(persona)!;
  if (app && !meta.apps.includes(app)) {
    meta.apps.push(app);
  }
  meta.isActive = true;

  // Deactivate other personas
  for (const [key, value] of this.personas.entries()) {
    if (key !== persona) {
      value.isActive = false;
    }
  }

  this.activePersona = persona;
  return this;
};

MultiPersonaProfileSchema.methods.deactivatePersona = function (persona: PersonaType) {
  if (this.personas.get(persona)) {
    this.personas.get(persona)!.isActive = false;
  }

  // If deactivating active persona, switch to primary
  if (this.activePersona === persona) {
    this.activePersona = this.primaryPersona;
    if (this.personas.get(this.primaryPersona)) {
      this.personas.get(this.primaryPersona)!.isActive = true;
    }
  }

  return this;
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const MultiPersonaProfile = mongoose.model<IMultiPersonaProfile>(
  'MultiPersonaProfile',
  MultiPersonaProfileSchema,
  'multi_persona_profiles'
);

export default MultiPersonaProfile;
