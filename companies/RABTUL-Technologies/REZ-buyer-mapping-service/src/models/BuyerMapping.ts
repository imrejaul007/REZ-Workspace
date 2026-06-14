import mongoose, { Document, Schema } from 'mongoose';

// Decision Maker Roles
export type DecisionRole =
  | 'champion'
  | 'economic_buyer'
  | 'technical_buyer'
  | 'legal_buyer'
  | 'user_buyer'
  | 'executive_sponsor'
  | 'influencer'
  | 'coach';

// Influence Level
export type InfluenceLevel = 'critical' | 'high' | 'medium' | 'low';

// Contact Status
export type ContactStatus = 'identified' | 'contacted' | 'engaged' | 'qualified' | 'advocate';

// Engagement Level
export type EngagementLevel = 'none' | 'low' | 'medium' | 'high' | 'champion';

export interface IBuyerPersona {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Persona Definition
  name: string;
  description: string;
  industry?: string;
  companySize?: string[];
  revenue?: { min: number; max: number };

  // Characteristics
  painPoints: string[];
  goals: string[];
  objections: string[];
  buyingTriggers: string[];
  preferredContent: string[];
  communicationStyle: 'formal' | 'casual' | 'technical' | 'relationship';
  decisionTimeline: 'impulsive' | 'short' | 'moderate' | 'long';

  // Objection Handling
  commonObjections: {
    objection: string;
    response: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }[];

  // Meta
  usageCount: number;
  successRate?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface IContact {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Contact Info
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title?: string;
  department?: string;
  linkedInUrl?: string;
  phone?: string;

  // Company Info
  companyName: string;
  companyId?: string;
  industry?: string;
  companySize?: string;
  annualRevenue?: number;

  // Decision Maker Status
  decisionRole: DecisionRole;
  influenceLevel: InfluenceLevel;
  isPrimaryContact: boolean;

  // Engagement Tracking
  status: ContactStatus;
  engagementLevel: EngagementLevel;
  lastContactedAt?: Date;
  nextActionDate?: Date;
  lastMeetingDate?: Date;
  touchpoints: number;

  // Persona Match
  matchedPersonas: mongoose.Types.ObjectId[];

  // Notes & History
  notes?: string;
  interactionHistory: {
    type: 'call' | 'email' | 'meeting' | 'demo' | 'social';
    date: Date;
    summary: string;
    outcome?: string;
  }[];

  // Coaching
  coachRating?: number; // 1-10
  isCoach: boolean;
  coachingNotes?: string;

  // Availability & Preferences
  availability?: string;
  bestTimeToContact?: string;
  timezone?: string;
  preferredChannel: 'email' | 'phone' | 'linkedin' | 'in-person';

  // Stakeholder Map Reference
  stakeholderMapId?: mongoose.Types.ObjectId;

  // Meta
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface IStakeholderMap {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Account Reference
  accountId: string;
  accountName: string;
  industry?: string;

  // Decision Makers
  contacts: mongoose.Types.ObjectId[];

  // Organizational Structure
  orgChart?: {
    level: number;
    name: string;
    role: DecisionRole;
    contactId?: mongoose.Types.ObjectId;
  }[];

  // Buying Committee
  buyingCommittee: {
    role: DecisionRole;
    title: string;
    isFilled: boolean;
    contactId?: mongoose.Types.ObjectId;
    importance: InfluenceLevel;
  }[];

  // Relationships
  relationships: {
    fromContactId: mongoose.Types.ObjectId;
    toContactId: mongoose.Types.ObjectId;
    relationship: 'reports_to' | 'peers' | 'works_with' | 'supports';
    strength: number; // 1-10
  }[];

  // Priority Assessment
  priorityContacts: mongoose.Types.ObjectId[];
  blockers: {
    contactId: mongoose.Types.ObjectId;
    reason: string;
    mitigation?: string;
  }[];

  // Coverage Score
  coverageScore: number; // 0-100
  technicalCoverage: number;
  economicCoverage: number;
  executiveCoverage: number;

  // Status
  status: 'incomplete' | 'in_progress' | 'complete';

  // Meta
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface IBuyerMatrix {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Deal Reference
  dealId: string;
  accountId: string;

  // Stakeholder Map
  stakeholderMapId?: mongoose.Types.ObjectId;

  // Contact Matrix
  contacts: {
    contactId: mongoose.Types.ObjectId;
    email: string;
    name: string;
    title: string;
    decisionRole: DecisionRole;
    influenceLevel: InfluenceLevel;
    engagementLevel: EngagementLevel;
    contactStatus: ContactStatus;
    lastContactedAt?: Date;
    touchpoints: number;
    relationshipStrength: number; // 1-10
    sentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
    blockers: string[];
    nextActions: string[];
    isReachable: boolean;
  }[];

  // Coverage Analysis
  coverage: {
    overall: number; // 0-100
    economic: number;
    technical: number;
    champion: number;
    executive: number;
  };

  // Gap Analysis
  gaps: {
    type: 'missing_role' | 'low_influence' | 'disengaged' | 'negative';
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    recommendation: string;
    priority: number;
  }[];

  // Recommendations
  recommendations: {
    action: string;
    targetContactId?: mongoose.Types.ObjectId;
    priority: 'critical' | 'high' | 'medium' | 'low';
    reason: string;
  }[];

  // Last Analysis
  lastAnalyzedAt: Date;
  analysisVersion: number;

  // Meta
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Models
const BuyerPersonaSchema = new Schema<IBuyerPersona>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    industry: { type: String },
    companySize: [{ type: String }],
    revenue: {
      min: { type: Number },
      max: { type: Number }
    },
    painPoints: [{ type: String }],
    goals: [{ type: String }],
    objections: [{ type: String }],
    buyingTriggers: [{ type: String }],
    preferredContent: [{ type: String }],
    communicationStyle: {
      type: String,
      enum: ['formal', 'casual', 'technical', 'relationship']
    },
    decisionTimeline: {
      type: String,
      enum: ['impulsive', 'short', 'moderate', 'long']
    },
    commonObjections: [
      {
        objection: String,
        response: String,
        severity: { type: String, enum: ['critical', 'high', 'medium', 'low'] }
      }
    ],
    usageCount: { type: Number, default: 0 },
    successRate: { type: Number },
    createdBy: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const ContactSchema = new Schema<IContact>(
  {
    tenantId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String, required: true },
    title: { type: String },
    department: { type: String },
    linkedInUrl: { type: String },
    phone: { type: String },
    companyName: { type: String, required: true },
    companyId: { type: String },
    industry: { type: String },
    companySize: { type: String },
    annualRevenue: { type: Number },
    decisionRole: {
      type: String,
      enum: ['champion', 'economic_buyer', 'technical_buyer', 'legal_buyer', 'user_buyer', 'executive_sponsor', 'influencer', 'coach'],
      required: true
    },
    influenceLevel: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium'
    },
    isPrimaryContact: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['identified', 'contacted', 'engaged', 'qualified', 'advocate'],
      default: 'identified'
    },
    engagementLevel: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'champion'],
      default: 'none'
    },
    lastContactedAt: { type: Date },
    nextActionDate: { type: Date },
    lastMeetingDate: { type: Date },
    touchpoints: { type: Number, default: 0 },
    matchedPersonas: [{ type: Schema.Types.ObjectId, ref: 'BuyerPersona' }],
    notes: { type: String },
    interactionHistory: [
      {
        type: { type: String, enum: ['call', 'email', 'meeting', 'demo', 'social'] },
        date: Date,
        summary: String,
        outcome: String
      }
    ],
    coachRating: { type: Number, min: 1, max: 10 },
    isCoach: { type: Boolean, default: false },
    coachingNotes: { type: String },
    availability: { type: String },
    bestTimeToContact: { type: String },
    timezone: { type: String },
    preferredChannel: {
      type: String,
      enum: ['email', 'phone', 'linkedin', 'in-person'],
      default: 'email'
    },
    stakeholderMapId: { type: Schema.Types.ObjectId, ref: 'StakeholderMap' }
  },
  { timestamps: true }
);

// Compound indexes
ContactSchema.index({ tenantId: 1, email: 1 }, { unique: true });
ContactSchema.index({ tenantId: 1, companyId: 1 });
ContactSchema.index({ tenantId: 1, decisionRole: 1 });
ContactSchema.index({ tenantId: 1, engagementLevel: 1 });

const StakeholderMapSchema = new Schema<IStakeholderMap>(
  {
    tenantId: { type: String, required: true, index: true },
    accountId: { type: String, required: true },
    accountName: { type: String, required: true },
    industry: { type: String },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    orgChart: [
      {
        level: Number,
        name: String,
        role: String,
        contactId: Schema.Types.ObjectId
      }
    ],
    buyingCommittee: [
      {
        role: { type: String, enum: ['champion', 'economic_buyer', 'technical_buyer', 'legal_buyer', 'user_buyer', 'executive_sponsor', 'influencer', 'coach'] },
        title: String,
        isFilled: Boolean,
        contactId: Schema.Types.ObjectId,
        importance: { type: String, enum: ['critical', 'high', 'medium', 'low'] }
      }
    ],
    relationships: [
      {
        fromContactId: Schema.Types.ObjectId,
        toContactId: Schema.Types.ObjectId,
        relationship: { type: String, enum: ['reports_to', 'peers', 'works_with', 'supports'] },
        strength: { type: Number, min: 1, max: 10 }
      }
    ],
    priorityContacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    blockers: [
      {
        contactId: Schema.Types.ObjectId,
        reason: String,
        mitigation: String
      }
    ],
    coverageScore: { type: Number, default: 0 },
    technicalCoverage: { type: Number, default: 0 },
    economicCoverage: { type: Number, default: 0 },
    executiveCoverage: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['incomplete', 'in_progress', 'complete'],
      default: 'incomplete'
    },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);

StakeholderMapSchema.index({ tenantId: 1, accountId: 1 }, { unique: true });

const BuyerMatrixSchema = new Schema<IBuyerMatrix>(
  {
    tenantId: { type: String, required: true, index: true },
    dealId: { type: String, required: true },
    accountId: { type: String, required: true },
    stakeholderMapId: { type: Schema.Types.ObjectId, ref: 'StakeholderMap' },
    contacts: [
      {
        contactId: Schema.Types.ObjectId,
        email: String,
        name: String,
        title: String,
        decisionRole: String,
        influenceLevel: String,
        engagementLevel: String,
        contactStatus: String,
        lastContactedAt: Date,
        touchpoints: Number,
        relationshipStrength: { type: Number, min: 1, max: 10 },
        sentiment: { type: String, enum: ['positive', 'neutral', 'negative', 'unknown'] },
        blockers: [String],
        nextActions: [String],
        isReachable: Boolean
      }
    ],
    coverage: {
      overall: { type: Number, default: 0 },
      economic: { type: Number, default: 0 },
      technical: { type: Number, default: 0 },
      champion: { type: Number, default: 0 },
      executive: { type: Number, default: 0 }
    },
    gaps: [
      {
        type: { type: String, enum: ['missing_role', 'low_influence', 'disengaged', 'negative'] },
        description: String,
        severity: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
        recommendation: String,
        priority: Number
      }
    ],
    recommendations: [
      {
        action: String,
        targetContactId: Schema.Types.ObjectId,
        priority: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
        reason: String
      }
    ],
    lastAnalyzedAt: Date,
    analysisVersion: { type: Number, default: 1 }
  },
  { timestamps: true }
);

BuyerMatrixSchema.index({ tenantId: 1, dealId: 1 }, { unique: true });
BuyerMatrixSchema.index({ tenantId: 1, accountId: 1 });

// Export models
export const BuyerPersona = mongoose.model<IBuyerPersona>('BuyerPersona', BuyerPersonaSchema);
export const Contact = mongoose.model<IContact>('Contact', ContactSchema);
export const StakeholderMap = mongoose.model<IStakeholderMap>('StakeholderMap', StakeholderMapSchema);
export const BuyerMatrix = mongoose.model<IBuyerMatrix>('BuyerMatrix', BuyerMatrixSchema);
