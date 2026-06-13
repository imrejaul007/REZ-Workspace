import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// BUYER TWIN INTERFACE
// ============================================================================

export interface IBuyer extends Document {
  _id: mongoose.Types.ObjectId;

  // Identity
  buyerId: string;
  tenantId: string;

  // Profile
  profile: {
    name: {
      first: string;
      last: string;
    };
    email: string;
    phone: string;
    preferredContact: 'email' | 'phone' | 'text';
    preferredLanguage: string;
  };

  // Search Criteria
  searchCriteria: {
    propertyType: string[];
    minBedrooms?: number;
    maxBedrooms?: number;
    minBathrooms?: number;
    maxBathrooms?: number;
    minPrice?: number;
    maxPrice?: number;
    minSqft?: number;
    maxSqft?: number;
    areas: string[];
    features: string[];
    amenities: string[];
  };

  // Financing
  financing: {
    preApproved: boolean;
    preApprovalAmount?: number;
    preApprovalExpiration?: Date;
    downPaymentAmount?: number;
    downPaymentPercentage?: number;
    financingType: 'conventional' | 'fha' | 'va' | 'cash' | 'other';
    lenderName?: string;
  };

  // Timeline
  timeline: {
    urgency: 'immediate' | '1_3_months' | '3_6_months' | '6_12_months' | 'exploring';
    targetMoveDate?: Date;
    leaseEndDate?: Date;
    mustSellFirst: boolean;
  };

  // Preferences
  preferences: {
    schoolDistricts: string[];
    commuteRadiusMiles?: number;
    lifestyle: string[];
    neighborhoodPreferences: string[];
  };

  // Golden Visa
  goldenVisa: {
    interested: boolean;
    country?: string;
    investmentRange?: {
      min: number;
      max: number;
    };
    status: 'not_started' | 'documenting' | 'applying' | 'approved' | 'rejected';
  };

  // Status
  status: {
    current: 'active' | 'paused' | 'inactive' | 'closed';
    stage: 'searching' | 'viewing' | 'negotiating' | 'under_contract' | 'closed';
    lastActivity: Date;
    viewingCount: number;
  };

  // History
  history: {
    propertiesViewed: string[];
    propertiesSaved: string[];
    offersMade: number;
    offersAccepted: number;
    transactionsCompleted: number;
  };

  // Relationships
  assignedAgentId?: string;
  source: 'organic' | 'referral' | 'advertising' | 'partner';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// BUYER SCHEMA
// ============================================================================

const BuyerSchema = new Schema<IBuyer>({
  buyerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },

  // Profile
  profile: {
    name: {
      first: { type: String, required: true },
      last: { type: String, required: true }
    },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    preferredContact: {
      type: String,
      enum: ['email', 'phone', 'text'],
      default: 'email'
    },
    preferredLanguage: { type: String, default: 'en' }
  },

  // Search Criteria
  searchCriteria: {
    propertyType: [{ type: String }],
    minBedrooms: Number,
    maxBedrooms: Number,
    minBathrooms: Number,
    maxBathrooms: Number,
    minPrice: Number,
    maxPrice: Number,
    minSqft: Number,
    maxSqft: Number,
    areas: [{ type: String }],
    features: [{ type: String }],
    amenities: [{ type: String }]
  },

  // Financing
  financing: {
    preApproved: { type: Boolean, default: false },
    preApprovalAmount: Number,
    preApprovalExpiration: Date,
    downPaymentAmount: Number,
    downPaymentPercentage: Number,
    financingType: {
      type: String,
      enum: ['conventional', 'fha', 'va', 'cash', 'other'],
      default: 'conventional'
    },
    lenderName: String
  },

  // Timeline
  timeline: {
    urgency: {
      type: String,
      enum: ['immediate', '1_3_months', '3_6_months', '6_12_months', 'exploring'],
      default: 'exploring'
    },
    targetMoveDate: Date,
    leaseEndDate: Date,
    mustSellFirst: { type: Boolean, default: false }
  },

  // Preferences
  preferences: {
    schoolDistricts: [{ type: String }],
    commuteRadiusMiles: Number,
    lifestyle: [{ type: String }],
    neighborhoodPreferences: [{ type: String }]
  },

  // Golden Visa
  goldenVisa: {
    interested: { type: Boolean, default: false },
    country: String,
    investmentRange: {
      min: Number,
      max: Number
    },
    status: {
      type: String,
      enum: ['not_started', 'documenting', 'applying', 'approved', 'rejected'],
      default: 'not_started'
    }
  },

  // Status
  status: {
    current: {
      type: String,
      enum: ['active', 'paused', 'inactive', 'closed'],
      default: 'active'
    },
    stage: {
      type: String,
      enum: ['searching', 'viewing', 'negotiating', 'under_contract', 'closed'],
      default: 'searching'
    },
    lastActivity: { type: Date, default: Date.now },
    viewingCount: { type: Number, default: 0 }
  },

  // History
  history: {
    propertiesViewed: [{ type: String }],
    propertiesSaved: [{ type: String }],
    offersMade: { type: Number, default: 0 },
    offersAccepted: { type: Number, default: 0 },
    transactionsCompleted: { type: Number, default: 0 }
  },

  // Relationships
  assignedAgentId: String,
  source: {
    type: String,
    enum: ['organic', 'referral', 'advertising', 'partner'],
    default: 'organic'
  }
}, { timestamps: true });

// ============================================================================
// INDEXES
// ============================================================================

BuyerSchema.index({ buyerId: 1, tenantId: 1 });
BuyerSchema.index({ tenantId: 1, 'status.current': 1 });
BuyerSchema.index({ tenantId: 1, 'status.stage': 1 });
BuyerSchema.index({ assignedAgentId: 1 });
BuyerSchema.index({ 'searchCriteria.areas': 1 });
BuyerSchema.index({ 'searchCriteria.minPrice': 1, 'searchCriteria.maxPrice': 1 });
BuyerSchema.index({ 'timeline.urgency': 1 });
BuyerSchema.index({ 'financing.preApproved': 1 });
BuyerSchema.index({ 'goldenVisa.interested': 1 });
BuyerSchema.index({ 'status.lastActivity': -1 });

// ============================================================================
// VIRTUALS
// ============================================================================

BuyerSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

BuyerSchema.set('toJSON', { virtuals: true });
BuyerSchema.set('toObject', { virtuals: true });

// ============================================================================
// STATIC METHODS
// ============================================================================

export interface BuyerModel extends Model<IBuyer> {
  findByBuyerId(buyerId: string, tenantId?: string): Promise<IBuyer | null>;
  findByTenant(tenantId: string, options?: {
    status?: string;
    stage?: string;
    page?: number;
    limit?: number;
  }): Promise<{ buyers: IBuyer[]; total: number }>;
  findByAgent(agentId: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<{ buyers: IBuyer[]; total: number }>;
  findMatchingAreas(areaIds: string[], criteria?: {
    minPrice?: number;
    maxPrice?: number;
    propertyTypes?: string[];
  }): Promise<IBuyer[]>;
}

// ============================================================================
// COMPILE MODEL
// ============================================================================

export const Buyer = mongoose.model<IBuyer, BuyerModel>('Buyer', BuyerSchema);
