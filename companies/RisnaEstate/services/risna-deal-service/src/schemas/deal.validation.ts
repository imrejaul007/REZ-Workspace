import { z } from 'zod';
import { DealType, PropertyType, DealStage, DealSource, DealStatus, OfferedBy, OfferStatus, PaymentMilestoneStatus } from '../models/deal.model';

// ==============================================
// CREATE DEAL SCHEMA
// ==============================================

export const createDealSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  propertyId: z.string().min(1, 'Property ID is required'),
  brokerId: z.string().min(1, 'Broker ID is required'),
  buyerId: z.string().min(1, 'Buyer ID is required'),
  sellerId: z.string().min(1, 'Seller ID is required'),
  dealType: z.nativeEnum(DealType),
  propertyType: z.nativeEnum(PropertyType),
  askingPrice: z.number().positive('Asking price must be positive'),
  source: z.nativeEnum(DealSource).optional().default(DealSource.DIRECT),
  utmCampaign: z.string().optional(),
  utmMedium: z.string().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;

// ==============================================
// UPDATE DEAL SCHEMA
// ==============================================

export const updateDealSchema = z.object({
  negotiatedPrice: z.number().positive().optional(),
  finalPrice: z.number().positive().optional(),
  discount: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  handoverDate: z.string().datetime().optional(),
  keysHandedOver: z.boolean().optional(),
  documentsHandedOver: z.boolean().optional(),
  status: z.nativeEnum(DealStatus).optional(),
  lostReason: z.string().optional(),
  wonNotes: z.string().optional(),
});

export type UpdateDealInput = z.infer<typeof updateDealSchema>;

// ==============================================
// STAGE MANAGEMENT SCHEMA
// ==============================================

export const updateStageSchema = z.object({
  stage: z.nativeEnum(DealStage),
  notes: z.string().optional(),
});

export type UpdateStageInput = z.infer<typeof updateStageSchema>;

// ==============================================
// OFFER MANAGEMENT SCHEMA
// ==============================================

export const createOfferSchema = z.object({
  offeredBy: z.nativeEnum(OfferedBy),
  price: z.number().positive('Price must be positive'),
  notes: z.string().optional(),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;

export const updateOfferSchema = z.object({
  status: z.nativeEnum(OfferStatus),
  counteredPrice: z.number().positive().optional(),
  notes: z.string().optional(),
});

export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;

// ==============================================
// PAYMENT MILESTONE SCHEMA
// ==============================================

export const addPaymentMilestoneSchema = z.object({
  milestone: z.string().min(1, 'Milestone name is required'),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().datetime('Due date must be a valid ISO date'),
});

export type AddPaymentMilestoneInput = z.infer<typeof addPaymentMilestoneSchema>;

export const updatePaymentMilestoneSchema = z.object({
  status: z.nativeEnum(PaymentMilestoneStatus),
  paidAt: z.string().datetime().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdatePaymentMilestoneInput = z.infer<typeof updatePaymentMilestoneSchema>;

// ==============================================
// HANDOVER CHECKLIST SCHEMA
// ==============================================

export const addHandoverItemSchema = z.object({
  item: z.string().min(1, 'Item name is required'),
});

export type AddHandoverItemInput = z.infer<typeof addHandoverItemSchema>;

export const completeHandoverItemSchema = z.object({
  completed: z.boolean(),
  notes: z.string().optional(),
});

export type CompleteHandoverItemInput = z.infer<typeof completeHandoverItemSchema>;

// ==============================================
// QUERY SCHEMAS
// ==============================================

export const queryDealsSchema = z.object({
  brokerId: z.string().optional(),
  propertyId: z.string().optional(),
  leadId: z.string().optional(),
  stage: z.string().optional(),
  status: z.nativeEnum(DealStatus).optional(),
  dealType: z.nativeEnum(DealType).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  source: z.nativeEnum(DealSource).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  probability: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type QueryDealsInput = z.infer<typeof queryDealsSchema>;

// ==============================================
// PIPELINE QUERY SCHEMA
// ==============================================

export const pipelineQuerySchema = z.object({
  brokerId: z.string().optional(),
  minProbability: z.coerce.number().min(0).max(100).optional().default(0),
});

export type PipelineQueryInput = z.infer<typeof pipelineQuerySchema>;

// ==============================================
// AI SCORING SCHEMA
// ==============================================

export const aiScoreSchema = z.object({
  force: z.boolean().optional().default(false),
});

export type AIScoreInput = z.infer<typeof aiScoreSchema>;

// ==============================================
// BULK OPERATIONS SCHEMA
// ==============================================

export const bulkStageUpdateSchema = z.object({
  dealIds: z.array(z.string()).min(1, 'At least one deal ID is required'),
  stage: z.nativeEnum(DealStage),
  notes: z.string().optional(),
});

export type BulkStageUpdateInput = z.infer<typeof bulkStageUpdateSchema>;

export const bulkStatusUpdateSchema = z.object({
  dealIds: z.array(z.string()).min(1, 'At least one deal ID is required'),
  status: z.nativeEnum(DealStatus),
  notes: z.string().optional(),
});

export type BulkStatusUpdateInput = z.infer<typeof bulkStatusUpdateSchema>;

// ==============================================
// ANALYTICS SCHEMA
// ==============================================

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  brokerId: z.string().optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  groupBy: z.enum(['stage', 'source', 'broker', 'propertyType', 'dealType']).optional().default('stage'),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;