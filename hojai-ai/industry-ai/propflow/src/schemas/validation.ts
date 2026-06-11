/**
 * PROPFLOW - Real Estate AI Operating System
 * Zod Validation Schemas
 */

import { z } from 'zod';

// ============================================
// PROPERTY SCHEMAS
// ============================================

export const propertyTypeSchema = z.enum(['apartment', 'villa', 'plot', 'commercial', 'office', 'penthouse', 'townhouse']);
export const propertyStatusSchema = z.enum(['available', 'sold', 'reserved', 'under-construction', 'unavailable']);

export const locationSchema = z.object({
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  pincode: z.string().min(1).max(20),
  locality: z.string().min(1).max(100),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

export const specificationsSchema = z.object({
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(15).optional(),
  area: z.number().positive(),
  areaUnit: z.enum(['sqft', 'sqm', 'sqyd']).default('sqft'),
  floor: z.number().int().min(0).optional(),
  totalFloors: z.number().int().min(1).optional(),
  parkingSpaces: z.number().int().min(0).optional()
});

export const createPropertySchema = z.object({
  title: z.string().min(1).max(200),
  type: propertyTypeSchema,
  status: propertyStatusSchema.default('available'),
  price: z.number().positive(),
  pricePerSqft: z.number().positive().optional(),
  location: locationSchema,
  specifications: specificationsSchema,
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  description: z.string().max(5000).optional(),
  ownerId: z.string().min(1),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  createdBy: z.string().optional()
});

export const updatePropertySchema = createPropertySchema.partial();

// ============================================
// LEAD SCHEMAS
// ============================================

export const leadSourceSchema = z.enum(['website', 'phone', 'walkin', 'referral', 'agent', 'social', 'advertisement']);
export const leadStatusSchema = z.enum(['new', 'contacted', 'qualified', 'visiting', 'negotiating', 'closed-won', 'closed-lost']);
export const leadScoreTierSchema = z.enum(['hot', 'warm', 'cold']);

export const budgetSchema = z.object({
  min: z.number().min(0).default(0),
  max: z.number().positive()
});

export const leadRequirementsSchema = z.object({
  type: propertyTypeSchema.optional(),
  bedrooms: z.number().int().min(1).max(10).optional(),
  bathrooms: z.number().int().min(1).max(10).optional(),
  location: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  minArea: z.number().positive().optional(),
  maxArea: z.number().positive().optional()
});

export const createLeadSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  email: z.string().email().optional(),
  source: leadSourceSchema,
  budget: budgetSchema,
  requirements: leadRequirementsSchema.optional(),
  notes: z.string().max(1000).optional(),
  assignedAgentId: z.string().optional(),
  followUpDate: z.string().datetime().optional()
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
  email: z.string().email().optional(),
  source: leadSourceSchema.optional(),
  budget: budgetSchema.optional(),
  requirements: leadRequirementsSchema.optional(),
  status: leadStatusSchema.optional(),
  score: z.number().int().min(0).max(100).optional(),
  assignedAgentId: z.string().optional(),
  lastContact: z.string().datetime().optional(),
  notes: z.array(z.string()).optional()
});

// ============================================
// SITE VISIT SCHEMAS
// ============================================

export const visitStatusSchema = z.enum(['scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show']);

export const createSiteVisitSchema = z.object({
  propertyId: z.string().min(1),
  leadId: z.string().min(1),
  date: z.string().datetime(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'),
  duration: z.number().int().min(15).max(180).default(30),
  agentId: z.string().optional(),
  notes: z.string().max(500).optional(),
  reminderEnabled: z.boolean().default(true)
});

export const updateSiteVisitSchema = z.object({
  date: z.string().datetime().optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format').optional(),
  status: visitStatusSchema.optional(),
  feedback: z.string().max(1000).optional(),
  notes: z.string().max(500).optional(),
  rating: z.number().int().min(1).max(5).optional()
});

// ============================================
// DEAL SCHEMAS
// ============================================

export const dealStageSchema = z.enum(['negotiating', 'accepted', 'documents', 'registered', 'closed']);
export const dealStatusSchema = z.enum(['active', 'won', 'lost', 'cancelled']);

export const createDealSchema = z.object({
  propertyId: z.string().min(1),
  leadId: z.string().min(1),
  offerPrice: z.number().positive(),
  askingPrice: z.number().positive().optional(),
  agentId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  expectedCloseDate: z.string().datetime().optional()
});

export const updateDealStageSchema = z.object({
  stage: dealStageSchema,
  notes: z.string().max(1000).optional(),
  closeReason: z.string().max(500).optional()
});

// ============================================
// USER / AUTH SCHEMAS
// ============================================

export const registerUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  password: z.string().min(8).max(100),
  role: z.enum(['admin', 'agent', 'manager', 'viewer']).default('agent'),
  assignedRegion: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100)
});

// ============================================
// ANALYTICS SCHEMAS
// ============================================

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  groupBy: z.enum(['day', 'week', 'month', 'source', 'status', 'type']).optional()
});

// ============================================
// AI SCHEMAS
// ============================================

export const propertyMatchRequestSchema = z.object({
  budget: budgetSchema,
  requirements: leadRequirementsSchema.optional(),
  location: z.string().optional(),
  propertyTypes: z.array(propertyTypeSchema).optional(),
  excludePropertyIds: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(50).default(10)
});

export const leadQualifyRequestSchema = z.object({
  leadId: z.string().min(1)
});

export const visitScheduleRequestSchema = z.object({
  leadId: z.string().min(1),
  propertyId: z.string().min(1),
  preferredDates: z.array(z.string().datetime()).min(1),
  preferredTimes: z.array(z.string()).optional(),
  notes: z.string().max(500).optional()
});

// Type exports
export type PropertyType = z.infer<typeof propertyTypeSchema>;
export type PropertyStatus = z.infer<typeof propertyStatusSchema>;
export type LeadSource = z.infer<typeof leadSourceSchema>;
export type LeadStatus = z.infer<typeof leadStatusSchema>;
export type VisitStatus = z.infer<typeof visitStatusSchema>;
export type DealStage = z.infer<typeof dealStageSchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type CreateProperty = z.infer<typeof createPropertySchema>;
export type UpdateProperty = z.infer<typeof updatePropertySchema>;
export type CreateLead = z.infer<typeof createLeadSchema>;
export type UpdateLead = z.infer<typeof updateLeadSchema>;
export type CreateSiteVisit = z.infer<typeof createSiteVisitSchema>;
export type UpdateSiteVisit = z.infer<typeof updateSiteVisitSchema>;
export type CreateDeal = z.infer<typeof createDealSchema>;
export type UpdateDealStage = z.infer<typeof updateDealStageSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type Login = z.infer<typeof loginSchema>;
export type PropertyMatchRequest = z.infer<typeof propertyMatchRequestSchema>;
export type LeadQualifyRequest = z.infer<typeof leadQualifyRequestSchema>;
export type VisitScheduleRequest = z.infer<typeof visitScheduleRequestSchema>;