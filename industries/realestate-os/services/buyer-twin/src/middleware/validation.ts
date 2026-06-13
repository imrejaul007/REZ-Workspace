import { z } from 'zod';

// ============================================================================
// BUYER VALIDATION SCHEMAS
// ============================================================================

// Profile Schema
export const ProfileSchema = z.object({
  name: z.object({
    first: z.string().min(1, 'First name is required'),
    last: z.string().min(1, 'Last name is required')
  }),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  preferredContact: z.enum(['email', 'phone', 'text']).optional(),
  preferredLanguage: z.string().optional()
});

// Search Criteria Schema (base, without refine)
const SearchCriteriaBaseSchema = z.object({
  propertyType: z.array(z.string()).optional(),
  minBedrooms: z.number().int().min(0).optional(),
  maxBedrooms: z.number().int().min(0).optional(),
  minBathrooms: z.number().int().min(0).optional(),
  maxBathrooms: z.number().int().min(0).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minSqft: z.number().min(0).optional(),
  maxSqft: z.number().min(0).optional(),
  areas: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional()
});

export const SearchCriteriaSchema = SearchCriteriaBaseSchema;

// Financing Schema
export const FinancingSchema = z.object({
  preApproved: z.boolean().optional(),
  preApprovalAmount: z.number().min(0).optional(),
  preApprovalExpiration: z.string().datetime().optional().or(z.date().optional()),
  downPaymentAmount: z.number().min(0).optional(),
  downPaymentPercentage: z.number().min(0).max(100).optional(),
  financingType: z.enum(['conventional', 'fha', 'va', 'cash', 'other']).optional(),
  lenderName: z.string().optional()
});

// Timeline Schema
export const TimelineSchema = z.object({
  urgency: z.enum(['immediate', '1_3_months', '3_6_months', '6_12_months', 'exploring']).optional(),
  targetMoveDate: z.string().datetime().optional().or(z.date().optional()),
  leaseEndDate: z.string().datetime().optional().or(z.date().optional()),
  mustSellFirst: z.boolean().optional()
});

// Preferences Schema
export const PreferencesSchema = z.object({
  schoolDistricts: z.array(z.string()).optional(),
  commuteRadiusMiles: z.number().min(0).optional(),
  lifestyle: z.array(z.string()).optional(),
  neighborhoodPreferences: z.array(z.string()).optional()
});

// Golden Visa Schema
export const GoldenVisaSchema = z.object({
  interested: z.boolean().optional(),
  country: z.string().optional(),
  investmentRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }).optional(),
  status: z.enum(['not_started', 'documenting', 'applying', 'approved', 'rejected']).optional()
});

// Status Schema
export const StatusSchema = z.object({
  current: z.enum(['active', 'paused', 'inactive', 'closed']).optional(),
  stage: z.enum(['searching', 'viewing', 'negotiating', 'under_contract', 'closed']).optional(),
  lastActivity: z.string().datetime().optional().or(z.date().optional()),
  viewingCount: z.number().int().min(0).optional()
});

// History Schema
export const HistorySchema = z.object({
  propertiesViewed: z.array(z.string()).optional(),
  propertiesSaved: z.array(z.string()).optional(),
  offersMade: z.number().int().min(0).optional(),
  offersAccepted: z.number().int().min(0).optional(),
  transactionsCompleted: z.number().int().min(0).optional()
});

// ============================================================================
// CREATE BUYER SCHEMA
// ============================================================================

export const CreateBuyerSchema = z.object({
  buyerId: z.string().min(1, 'Buyer ID is required'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  profile: ProfileSchema,
  searchCriteria: SearchCriteriaSchema.optional(),
  financing: FinancingSchema.optional(),
  timeline: TimelineSchema.optional(),
  preferences: PreferencesSchema.optional(),
  goldenVisa: GoldenVisaSchema.optional(),
  assignedAgentId: z.string().optional(),
  source: z.enum(['organic', 'referral', 'advertising', 'partner']).optional()
});

// ============================================================================
// UPDATE BUYER SCHEMA
// ============================================================================

export const UpdateBuyerSchema = z.object({
  profile: z.object({
    name: z.object({
      first: z.string().min(1).optional(),
      last: z.string().min(1).optional()
    }).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
    preferredContact: z.enum(['email', 'phone', 'text']).optional(),
    preferredLanguage: z.string().optional()
  }).optional(),
  searchCriteria: SearchCriteriaSchema.optional(),
  financing: FinancingSchema.optional(),
  timeline: TimelineSchema.optional(),
  preferences: PreferencesSchema.optional(),
  goldenVisa: GoldenVisaSchema.optional(),
  status: StatusSchema.optional(),
  history: HistorySchema.optional(),
  assignedAgentId: z.string().optional()
});

// ============================================================================
// PROPERTY INTERACTION SCHEMA
// ============================================================================

export const PropertyInteractionSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  action: z.enum(['view', 'save', 'unfavorite', 'offer', 'inquiry'])
});

// ============================================================================
// MATCHING CRITERIA SCHEMA
// ============================================================================

export const MatchingCriteriaSchema = z.object({
  areas: z.array(z.string()).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  propertyTypes: z.array(z.string()).optional(),
  minBedrooms: z.number().int().min(0).optional(),
  maxBedrooms: z.number().int().min(0).optional(),
  features: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).optional()
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateBuyerInput = z.infer<typeof CreateBuyerSchema>;
export type UpdateBuyerInput = z.infer<typeof UpdateBuyerSchema>;
export type PropertyInteractionInput = z.infer<typeof PropertyInteractionSchema>;
export type MatchingCriteriaInput = z.infer<typeof MatchingCriteriaSchema>;
