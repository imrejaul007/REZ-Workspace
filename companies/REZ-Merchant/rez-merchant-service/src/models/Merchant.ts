import mongoose, { Document, Schema } from 'mongoose';
import { encrypt, decrypt, maskSensitiveData } from '../utils/encryption';

// Local enums (not exported in shared-types yet)
export enum MerchantPlan {
  STARTER = 'starter',
  BASIC = 'basic',
  STANDARD = 'standard',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum OnboardingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

// Canonical enum value arrays for Mongoose schema
const VERIFICATION_STATUS_VALUES: string[] = Object.values(VerificationStatus);
const MERCHANT_PLAN_VALUES: string[] = Object.values(MerchantPlan);
const ONBOARDING_STATUS_VALUES: string[] = Object.values(OnboardingStatus);

// Onboarding interfaces
export interface IOnboardingBusinessInfo {
  companyName?: string;
  businessType?: string;
  registrationNumber?: string;
  gstNumber?: string;
  panNumber?: string;
}

export interface IOnboardingStoreDetails {
  storeName?: string;
  description?: string;
  category?: string;
  logoUrl?: string;
  bannerUrl?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    landmark?: string;
  };
}

export interface IOnboardingBankDetails {
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  bankName?: string;
  branchName?: string;
}

export interface IOnboardingDocument {
  type: string; // 'business_license', 'id_proof', 'address_proof'
  url: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  uploadedAt: Date;
}

export interface IOnboardingVerification {
  documents: IOnboardingDocument[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface IOnboarding {
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  currentStep: number;
  completedSteps: number[];
  stepData: {
    businessInfo?: IOnboardingBusinessInfo;
    storeDetails?: IOnboardingStoreDetails;
    bankDetails?: IOnboardingBankDetails;
    verification?: IOnboardingVerification;
  };
  startedAt?: Date;
  completedAt?: Date;
  rejectionReason?: string;
}

// SECURITY FIX (MA-BACK-AUDIT-007): Replaced `any` types with proper interfaces.
export interface MerchantAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  coordinates?: { lat: number; lng: number };
}

export interface MerchantContact {
  phone?: string;
  email?: string;
  website?: string;
  whatsapp?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
}

export interface MerchantSocialMedia {
  twitter?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
}

export interface MerchantBusinessHours {
  [day: string]: { open: string; close: string; closed?: boolean };
}

export interface MerchantDeliveryOptions {
  enabled?: boolean;
  minOrderValue?: number;
  deliveryFee?: number;
  estimatedTime?: number;
  freeDeliveryAbove?: number;
  deliveryRadius?: number;
}

export interface MerchantPaymentMethods {
  cash?: boolean;
  upi?: boolean;
  card?: boolean;
  wallet?: string[];
  netbanking?: boolean;
}

export interface MerchantPolicies {
  cancellation?: string;
  refund?: string;
  privacy?: string;
  terms?: string;
}

export interface MerchantRatings {
  average?: number;
  count?: number;
  distribution?: { 5?: number; 4?: number; 3?: number; 2?: number; 1?: number };
}

export interface MerchantServiceArea {
  cities?: string[];
  regions?: string[];
  zones?: string[];
}

export interface MerchantReviewSummary {
  total?: number;
  average?: number;
  recent?: Array<{ rating: number; comment?: string; createdAt: Date }>;
}

// Local IMerchant extends Document for Mongoose; aligned with SharedIMerchant from @rez/shared-types
export interface IMerchant extends Document {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  phone: string;
  // DB-HEALTH-003: Soft delete field
  deletedAt?: Date;

  // GDPR Data Residency - Article 44-49 (Cross-border data transfers)
  // Supported regions: IN (India), US (United States), EU (European Union), AP (Asia Pacific)
  dataRegion?: string;
  regionChangeRequestedAt?: Date;
  regionChangeStatus?: 'pending' | 'approved' | 'rejected';

  businessAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  businessLicense?: string;
  taxId?: string;
  website?: string;
  description?: string;
  logo?: string;
  // Removed lastLogin (DM-M2) — use lastLoginAt. lastLogin was never updated on login;
  // lastLoginAt is the canonical field updated in auth.ts on every successful login.

  // Password Reset
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;

  // Email Verification
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;

  // Account Security
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIP?: string;
  refreshTokenHash?: string;
  refreshTokenMeta?: string;
  refreshTokenExpiry?: Date; // FIX-AUTH-001: Expiry for refresh tokens

  // Onboarding
  onboarding: IOnboarding;

  createdAt: Date;
  updatedAt: Date;

  // Additional properties for profile/sync features
  displayName?: string;
  tagline?: string;
  coverImage?: string;
  galleryImages?: string[];
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  // SECURITY FIX (MA-BACK-AUDIT-007): Replaced `any` with proper interfaces.
  address?: MerchantAddress;
  contact?: MerchantContact;
  socialMedia?: MerchantSocialMedia;
  businessHours?: MerchantBusinessHours;
  deliveryOptions?: MerchantDeliveryOptions;
  paymentMethods?: MerchantPaymentMethods;
  policies?: MerchantPolicies;
  ratings?: MerchantRatings;
  status?: string;
  isFeatured?: boolean;
  categories?: string[];
  tags?: string[];

  // Additional properties needed by merchant-profile route
  timezone?: string;
  serviceArea?: MerchantServiceArea;
  features?: string[];
  reviewSummary?: MerchantReviewSummary;
  verification?: {
    isVerified?: boolean;
  };
  metrics?: {
    totalOrders?: number;
    totalCustomers?: number;
    averageResponseTime?: string;
    fulfillmentRate?: number;
  };
  activePromotions?: Array<{
    id: string;
    name: string;
    discount?: number;
    expiresAt?: Date;
  }>;
  announcements?: Array<{
    id: string;
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high';
    expiresAt?: Date;
  }>;
  searchKeywords?: string[];
  sortOrder?: number;
  lastActiveAt?: Date;
  isPubliclyVisible?: boolean;
  searchable?: boolean;
  acceptingOrders?: boolean;
  showInDirectory?: boolean;
  showContact?: boolean;
  showRatings?: boolean;
  showBusinessHours?: boolean;
  allowCustomerMessages?: boolean;
  showPromotions?: boolean;

  // Virtual: single canonical status derived from verificationStatus + isActive
  readonly computedStatus?: 'approved' | 'suspended' | 'rejected' | 'pending';

  // Subscription management
  currentPlan?: string; // 'starter' | 'growth' | 'pro' | 'enterprise'
  planExpiresAt?: Date;

  // REZ OAuth2 linkage — links this merchant account to a REZ user account.
  // Used by NextaBiZ (and other partner apps) to look up the merchant via the
  // REZ user ID obtained from the OAuth2 /oauth/userinfo endpoint (sub field).
  rezUserId?: string;

  // Bank details helpers — use these instead of accessing onboarding.stepData.bankDetails directly
  getDecryptedBankDetails(): IOnboardingBankDetails | undefined;
  getMaskedBankDetails(): IOnboardingBankDetails | undefined;
}

// Merchant Schema
const MerchantSchema = new Schema<IMerchant>(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't include password in queries by default
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    businessAddress: {
      street: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      zipCode: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    // DB-HEALTH-023: Using canonical VerificationStatus enum from @rez/shared-types
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUS_VALUES,
      default: VerificationStatus.PENDING,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    businessLicense: {
      type: String,
      trim: true,
    },
    taxId: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    logo: {
      type: String,
      trim: true,
    },
    // lastLogin removed (DM-M2) — use lastLoginAt. Existing documents retain the field
    // in MongoDB but Mongoose strict mode will ignore it on reads/saves.

    // Password Reset
    resetPasswordToken: {
      type: String,
      select: false, // Don't include in queries by default
    },
    resetPasswordExpiry: {
      type: Date,
      select: false,
    },

    // Email Verification
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpiry: {
      type: Date,
      select: false,
    },

    // Account Security
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    refreshTokenMeta: {
      type: String,
      select: false,
    },
    // FIX-AUTH-001: Refresh token expiry for 30-day rotation policy
    refreshTokenExpiry: {
      type: Date,
      select: false,
    },

    // Additional optional fields
    displayName: String,
    tagline: String,
    coverImage: String,
    galleryImages: [String],
    brandColors: {
      primary: String,
      secondary: String,
      accent: String,
    },
    address: Schema.Types.Mixed,
    contact: Schema.Types.Mixed,
    socialMedia: Schema.Types.Mixed,
    businessHours: Schema.Types.Mixed,
    deliveryOptions: Schema.Types.Mixed,
    paymentMethods: Schema.Types.Mixed,
    policies: Schema.Types.Mixed,
    ratings: Schema.Types.Mixed,
    status: String,
    isFeatured: { type: Boolean, default: false },
    categories: [String],
    tags: [String],

    // Additional fields needed by merchant-profile route
    timezone: String,
    serviceArea: Schema.Types.Mixed,
    features: [String],
    reviewSummary: Schema.Types.Mixed,
    verification: {
      isVerified: { type: Boolean, default: false },
    },
    metrics: {
      totalOrders: { type: Number, default: 0 },
      totalCustomers: { type: Number, default: 0 },
      averageResponseTime: { type: String, default: '< 1 hour' },
      fulfillmentRate: { type: Number, default: 95 },
    },
    activePromotions: [Schema.Types.Mixed],
    announcements: [Schema.Types.Mixed],
    searchKeywords: [String],
    sortOrder: { type: Number, default: 0 },
    lastActiveAt: Date,
    isPubliclyVisible: { type: Boolean, default: true },
    searchable: { type: Boolean, default: true },
    acceptingOrders: { type: Boolean, default: true },
    showInDirectory: { type: Boolean, default: true },
    showContact: { type: Boolean, default: true },
    showRatings: { type: Boolean, default: true },
    showBusinessHours: { type: Boolean, default: true },
    allowCustomerMessages: { type: Boolean, default: true },
    showPromotions: { type: Boolean, default: true },

    // Subscription management
    // DB-HEALTH-023: Using canonical MerchantPlan enum from @rez/shared-types
    currentPlan: {
      type: String,
      enum: MERCHANT_PLAN_VALUES,
      default: MerchantPlan.STARTER,
      index: true,
    },
    planExpiresAt: Date,

    // REZ OAuth2 linkage — links merchant to REZ user (from OAuth2 partner SSO)
    rezUserId: {
      type: String,
      sparse: true, // sparse allows multiple null values while unique index ensures no duplicate non-null values
    },

    // DB-HEALTH-003: Soft delete field for sensitive data
    deletedAt: Date,

    // GDPR Data Residency - Article 44-49 (Cross-border data transfers)
    // Supported regions: IN (India), US (United States), EU (European Union), AP (Asia Pacific)
    dataRegion: {
      type: String,
      enum: ['IN', 'US', 'EU', 'AP'],
      default: 'IN',
    },
    // Track region change requests
    regionChangeRequestedAt: Date,
    regionChangeStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
    },

    // Onboarding
    onboarding: {
      status: {
        // DB-HEALTH-023: Using canonical OnboardingStatus enum from @rez/shared-types
        type: String,
        enum: ONBOARDING_STATUS_VALUES,
        default: OnboardingStatus.PENDING,
      },
      currentStep: {
        type: Number,
        default: 1,
        min: 1,
        max: 5,
      },
      completedSteps: [
        {
          type: Number,
          min: 1,
          max: 5,
        },
      ],
      stepData: {
        businessInfo: {
          companyName: String,
          businessType: String,
          registrationNumber: String,
          gstNumber: String,
          panNumber: String,
        },
        storeDetails: {
          storeName: String,
          description: String,
          category: String,
          logoUrl: String,
          bannerUrl: String,
          address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
            landmark: String,
          },
        },
        bankDetails: {
          accountNumber: String,
          ifscCode: String,
          accountHolderName: String,
          bankName: String,
          branchName: String,
        },
        verification: {
          documents: [
            {
              type: {
                type: String,
                enum: ['business_license', 'id_proof', 'address_proof', 'gst_certificate', 'pan_card'],
              },
              url: String,
              status: {
                type: String,
                enum: ['pending', 'verified', 'rejected'],
                default: 'pending',
              },
              rejectionReason: String,
              uploadedAt: {
                type: Date,
                default: Date.now,
              },
            },
          ],
          verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending',
          },
          verifiedAt: Date,
          verifiedBy: String,
        },
      },
      startedAt: Date,
      completedAt: Date,
      rejectionReason: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: Partial<Record<string, unknown>>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        // Mask encrypted bank details so they never appear as raw ciphertext in API responses.
        // Use doc.getMaskedBankDetails() in admin routes when plain values are needed.
        if (ret.onboarding?.stepData?.bankDetails) {
          const bd = ret.onboarding.stepData.bankDetails;
          if (bd.accountNumber) {
            try {
              bd.accountNumber = maskSensitiveData(decrypt(bd.accountNumber), 2);
            } catch {
              bd.accountNumber = '****';
            }
          }
          if (bd.ifscCode) {
            try {
              bd.ifscCode = maskSensitiveData(decrypt(bd.ifscCode), 4);
            } catch {
              bd.ifscCode = '****';
            }
          }
        }
        return ret;
      },
    },
  },
);

// R34: lastLogin virtual — service removed the lastLogin field (DM-M2) but older
// client reads still reference it. Providing a backward-compat virtual that
// returns lastLoginAt so existing queries/transforms continue to work.
MerchantSchema.virtual('lastLogin').get(function (this: IMerchant) {
  return this.lastLoginAt;
});

// Virtual: computedStatus - single canonical status derived from verificationStatus + isActive
MerchantSchema.virtual('computedStatus').get(function (this: IMerchant) {
  if (this.verificationStatus === 'rejected') {
    return 'rejected';
  }
  if (this.verificationStatus === 'verified' && this.isActive) {
    return 'approved';
  }
  if (this.verificationStatus === 'verified' && !this.isActive) {
    return 'suspended';
  }
  return 'pending';
});

// Indexes
// Note: email index is automatically created due to unique: true in schema
MerchantSchema.index({ verificationStatus: 1 });
MerchantSchema.index({ isActive: 1 });
MerchantSchema.index({ 'businessAddress.city': 1 });
MerchantSchema.index({ 'businessAddress.state': 1 });
MerchantSchema.index({ 'onboarding.status': 1 });
MerchantSchema.index({ 'onboarding.currentStep': 1 });
MerchantSchema.index({ verificationStatus: 1, isActive: 1, createdAt: -1 });
MerchantSchema.index({ phone: 1 });
MerchantSchema.index({ rezUserId: 1 }, { unique: true, sparse: true });

// DB-HEALTH-003: Soft delete index for soft-deleted merchant queries
MerchantSchema.index({ deletedAt: 1 });

// GDPR Data Retention: TTL index to auto-delete anonymized accounts after 90 days
// Only applies to accounts with deletedAt set (active accounts are not affected)
MerchantSchema.index(
  { deletedAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, partialFilterExpression: { deletedAt: { $exists: true } } },
);

// GDPR Data Residency index
MerchantSchema.index({ dataRegion: 1 });

// DB-HEALTH-004: Compound index for merchant search/listing queries
MerchantSchema.index({ isActive: 1, verificationStatus: 1, sortOrder: 1 });

// DB-INDEX: Added categories index for category-based merchant searches
MerchantSchema.index({ categories: 1 });

// ── Bank details encryption (Phase 0 - 0.1.8) ──────────────────────────────
// Encrypt accountNumber and ifscCode before every save. Uses AES-256-GCM via
// the shared encryption utility. Encrypted values are opaque JSON strings that
// look nothing like the originals, so they are safe to store in MongoDB.
//
// Detection: encrypted values start with '{"encrypted":' — used by decrypt
// guard below to avoid double-encryption on subsequent saves.
const ENCRYPTED_JSON_PREFIX = '{"encrypted":';

function isAlreadyEncrypted(value: string | undefined): boolean {
  return typeof value === 'string' && value.startsWith(ENCRYPTED_JSON_PREFIX);
}

MerchantSchema.pre('save', function (next) {
  try {
    const bankDetails = this.get('onboarding.stepData.bankDetails');
    if (bankDetails) {
      if (bankDetails.accountNumber && !isAlreadyEncrypted(bankDetails.accountNumber)) {
        bankDetails.accountNumber = encrypt(bankDetails.accountNumber.replace(/[\s-]/g, ''));
      }
      if (bankDetails.ifscCode && !isAlreadyEncrypted(bankDetails.ifscCode)) {
        bankDetails.ifscCode = encrypt(bankDetails.ifscCode.toUpperCase().trim());
      }
    }
  } catch {
    // Non-fatal: log but don't block save (field may already be encrypted or empty)
  }
  next();
});

// Helper instance methods to safely read bank details
MerchantSchema.methods.getDecryptedBankDetails = function (): IOnboardingBankDetails | undefined {
  const bankDetails = this.get('onboarding.stepData.bankDetails');
  if (!bankDetails) return undefined;
  return {
    accountNumber: bankDetails.accountNumber
      ? (() => {
        try {
          return decrypt(bankDetails.accountNumber);
        } catch {
          return bankDetails.accountNumber;
        }
      })()
      : undefined,
    ifscCode: bankDetails.ifscCode
      ? (() => {
        try {
          return decrypt(bankDetails.ifscCode);
        } catch {
          return bankDetails.ifscCode;
        }
      })()
      : undefined,
    accountHolderName: bankDetails.accountHolderName,
    bankName: bankDetails.bankName,
    branchName: bankDetails.branchName,
  };
};

MerchantSchema.methods.getMaskedBankDetails = function (): IOnboardingBankDetails | undefined {
  const bankDetails = this.get('onboarding.stepData.bankDetails');
  if (!bankDetails) return undefined;
  let accountNumber: string | undefined;
  let ifscCode: string | undefined;
  try {
    accountNumber = bankDetails.accountNumber ? maskSensitiveData(decrypt(bankDetails.accountNumber), 2) : undefined;
  } catch {
    accountNumber = '****';
  }
  try {
    ifscCode = bankDetails.ifscCode ? maskSensitiveData(decrypt(bankDetails.ifscCode), 4) : undefined;
  } catch {
    ifscCode = '****';
  }
  return {
    accountNumber,
    ifscCode,
    accountHolderName: bankDetails.accountHolderName,
    bankName: bankDetails.bankName,
    branchName: bankDetails.branchName,
  };
};

// Add static methods before creating the model
MerchantSchema.statics.update = async function (id: string, updates) {
  return await this.findByIdAndUpdate(id, updates, { new: true });
};

export const Merchant = mongoose.model<IMerchant>('Merchant', MerchantSchema);

// Export MerchantModel for backward compatibility
export { Merchant as MerchantModel };
