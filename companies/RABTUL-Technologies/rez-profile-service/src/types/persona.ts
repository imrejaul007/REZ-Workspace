/**
 * REZ Persona Types
 * Multi-persona architecture for unified identity layer
 */

// ─── Persona Types ─────────────────────────────────────────────────────────────

export type PersonaType =
  | 'student'      // Insight Campus users
  | 'employee'     // HR App / CorpPerks users
  | 'creator'      // Rendez / content creators
  | 'business'     // nextaBizz / RestoPapa merchants
  | 'freelancer'   // Gigzy / freelance workers
  | 'premium'      // ReZ Privé members
  | 'normal';      // Default REZ app users

// Legacy segment types (for backward compatibility)
export type LegacySegment =
  | 'normal'
  | 'verified'
  | 'student'
  | 'pro'
  | 'creator'
  | 'business'
  | 'influencer'
  | 'host'
  | 'vip';

// ─── Persona Metadata ─────────────────────────────────────────────────────────

export interface PersonaMetadata {
  persona: PersonaType;
  activatedAt: Date;
  verified: boolean;
  verificationData?: {
    eduEmail?: string;
    collegeId?: string;
    companyEmail?: string;
    companyName?: string;
    gstNumber?: string;
    merchantId?: string;
  };
  apps: string[]; // Which apps activated this persona
  isActive: boolean;
}

// ─── Student Extension ─────────────────────────────────────────────────────────

export interface StudentExtension {
  college?: string;
  collegeId?: string;
  eduEmail?: string;
  degree?: string;
  branch?: string;
  yearOfGraduation?: number;
  skills?: string[];
  certifications?: string[];
  internships?: {
    company: string;
    role: string;
    duration: string;
    completed: boolean;
  }[];
  portfolio?: string;
}

// ─── Employee Extension ────────────────────────────────────────────────────────

export interface EmployeeExtension {
  company?: string;
  companyId?: string;
  companyEmail?: string;
  department?: string;
  role?: string;
  level?: string;
  joiningDate?: Date;
  managerId?: string;
  employeeId?: string;
  teamSize?: number;
}

// ─── Creator Extension ─────────────────────────────────────────────────────────

export interface CreatorExtension {
  displayName?: string;
  category?: string;
  followers?: number;
  contentCount?: number;
  engagementRate?: number;
  platforms?: {
    platform: string;
    handle: string;
    url?: string;
  }[];
  niches?: string[];
  averageViews?: number;
  collaborationRate?: number;
}

// ─── Business Extension ────────────────────────────────────────────────────────

export interface BusinessExtension {
  businessName?: string;
  gstNumber?: string;
  businessType?: string;
  industry?: string;
  employeeCount?: string;
  annualRevenue?: string;
  locations?: {
    type: 'warehouse' | 'office' | 'store' | 'other';
    address: string;
    city: string;
    state: string;
    pincode: string;
  }[];
  restaurantCount?: number;
  merchantId?: string;
}

// ─── Freelancer Extension ─────────────────────────────────────────────────────

export interface FreelancerExtension {
  skills?: string[];
  hourlyRate?: number;
  availability?: 'full-time' | 'part-time' | 'hourly';
  portfolio?: string;
  completedGigs?: number;
  rating?: number;
  responseTime?: string;
  languages?: string[];
  workHistory?: {
    client: string;
    project: string;
    duration: string;
    rating: number;
  }[];
}

// ─── Premium Extension ──────────────────────────────────────────────────────────

export interface PremiumExtension {
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  memberSince?: Date;
  renewalDate?: Date;
  benefits?: string[];
  conciergeEnabled?: boolean;
}

// ─── Extended User Profile (with Multi-Persona) ─────────────────────────────────

export interface MultiPersonaProfile {
  // Core Identity
  userId: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  role: string;

  // Legacy segment (for backward compatibility)
  segment: LegacySegment;

  // ─── NEW: Multi-Persona System ───────────────────────────────────────────

  // Primary persona (user-selected, shows in UI)
  primaryPersona: PersonaType;

  // Secondary personas (up to 3, user-activated based on verification)
  secondaryPersonas: PersonaType[];

  // Currently active persona (context-aware)
  activePersona: PersonaType;

  // Persona metadata (activation info, verification status)
  personas: Record<PersonaType, PersonaMetadata>;

  // ─── Persona Extensions ────────────────────────────────────────────────────

  // App-specific data stored in profile
  studentExtension?: StudentExtension;
  employeeExtension?: EmployeeExtension;
  creatorExtension?: CreatorExtension;
  businessExtension?: BusinessExtension;
  freelancerExtension?: FreelancerExtension;
  premiumExtension?: PremiumExtension;

  // ─── Standard Fields ────────────────────────────────────────────────────────

  isVerified: boolean;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Persona Activation Request ─────────────────────────────────────────────────

export interface PersonaActivationRequest {
  persona: PersonaType;
  verificationData?: PersonaMetadata['verificationData'];
}

// ─── Persona Validation Map ───────────────────────────────────────────────────

export const PersonaVerificationRequirements: Record<PersonaType, {
  required: string[];
  optional: string[];
}> = {
  student: {
    required: ['eduEmail'],
    optional: ['collegeId', 'college'],
  },
  employee: {
    required: ['companyEmail'],
    optional: ['companyName', 'companyId'],
  },
  creator: {
    required: [],
    optional: ['displayName', 'platforms'],
  },
  business: {
    required: ['gstNumber'],
    optional: ['businessName', 'businessType'],
  },
  freelancer: {
    required: [],
    optional: ['skills', 'portfolio'],
  },
  premium: {
    required: [],
    optional: ['tier'],
  },
  normal: {
    required: [],
    optional: [],
  },
};

// ─── Default Persona Metadata ─────────────────────────────────────────────────

export function createDefaultPersonaMetadata(persona: PersonaType): PersonaMetadata {
  return {
    persona,
    activatedAt: new Date(),
    verified: false,
    apps: [],
    isActive: false,
  };
}
