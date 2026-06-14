import { z } from 'zod';

// Enums
export const KeyTypeEnum = z.enum([
  'main_door',
  'bedroom',
  'bathroom',
  'cupboard',
  'parking',
  'mailbox',
  'society',
  'other',
]);

export const DocumentTypeEnum = z.enum([
  'original_title_deed',
  'sale_agreement',
  'noc',
  'society_noc',
  'tax_receipt',
  'utility_bill',
  'insurance',
  'warranty',
  'manual',
  'other',
]);

export const ConditionEnum = z.enum(['excellent', 'good', 'fair', 'poor']);
export const FixturesEnum = z.enum(['complete', 'incomplete', 'damaged']);
export const AppliancesEnum = z.enum(['working', 'not_tested', 'damaged']);
export const ChecklistCategoryEnum = z.enum(['interior', 'exterior', 'utilities', 'documents', 'keys', 'other']);
export const DisputeStatusEnum = z.enum(['open', 'resolved', 'escalated']);
export const HandoverStatusEnum = z.enum(['scheduled', 'in_progress', 'completed', 'disputed', 'cancelled']);

// Key Schema
export const KeySchema = z.object({
  type: KeyTypeEnum,
  quantity: z.number().min(1).default(1),
  handedOver: z.boolean().default(false),
  notes: z.string().optional(),
});

// Document Schema
export const DocumentSchema = z.object({
  type: DocumentTypeEnum,
  handedOver: z.boolean().default(false),
  verified: z.boolean().default(false),
  notes: z.string().optional(),
});

// Condition Report Schema
export const ConditionReportSchema = z.object({
  interior: ConditionEnum,
  exterior: ConditionEnum,
  fixtures: FixturesEnum,
  appliances: AppliancesEnum,
  keysWorking: z.boolean(),
  electricityConnected: z.boolean(),
  waterConnected: z.boolean(),
  gasConnected: z.boolean().optional(),
  notes: z.string().optional(),
});

// Meter Reading Schema
export const MeterReadingSchema = z.object({
  reading: z.number().min(0),
  unit: z.string().default('kWh'),
  photo: z.string().url().optional(),
});

export const MeterReadingsSchema = z.object({
  electricity: MeterReadingSchema,
  water: MeterReadingSchema,
  gas: MeterReadingSchema.optional(),
});

// Checklist Item Schema
export const ChecklistItemSchema = z.object({
  item: z.string().min(1),
  category: ChecklistCategoryEnum,
  required: z.boolean().default(false),
  completed: z.boolean().default(false),
  completedAt: z.date().optional(),
  verifiedBy: z.string().optional(),
  notes: z.string().optional(),
});

// Buyer Acceptance Schema
export const BuyerAcceptanceSchema = z.object({
  accepted: z.boolean(),
  acceptedAt: z.date().optional(),
  acceptedBy: z.string(),
  signature: z.string().optional(),
  conditionAccepted: z.boolean(),
  notes: z.string().optional(),
});

// Dispute Schema
export const DisputeSchema = z.object({
  item: z.string().min(1),
  description: z.string().min(10),
  raisedBy: z.string(),
  raisedAt: z.date().optional(),
  status: DisputeStatusEnum.default('open'),
  resolution: z.string().optional(),
  resolvedAt: z.date().optional(),
});

// Feedback Schema
export const FeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comments: z.string().optional(),
  sellerFeedback: z.string().optional(),
  buyerFeedback: z.string().optional(),
});

// Create Handover Schema
export const CreateHandoverSchema = z.object({
  dealId: z.string().min(1, 'Deal ID is required'),
  agreementId: z.string().min(1, 'Agreement ID is required'),
  propertyId: z.string().min(1, 'Property ID is required'),
  buyerId: z.string().min(1, 'Buyer ID is required'),
  sellerId: z.string().min(1, 'Seller ID is required'),
  brokerId: z.string().optional(),
  propertyAddress: z.string().min(1, 'Property address is required'),
  unitNumber: z.string().optional(),
  floor: z.string().optional(),
  tower: z.string().optional(),
  notes: z.string().optional(),
});

// Schedule Handover Schema
export const ScheduleHandoverSchema = z.object({
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  scheduledBy: z.string().min(1, 'Scheduled by is required'),
});

// Reschedule Handover Schema
export const RescheduleHandoverSchema = z.object({
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  reason: z.string().min(10, 'Reason is required for rescheduling'),
});

// Check-in Schema
export const CheckInSchema = z.object({
  buyerRepresentative: z.string().min(1, 'Buyer representative name is required'),
});

// Keys Update Schema
export const KeysUpdateSchema = z.object({
  keys: z.array(KeySchema).min(1, 'At least one key entry is required'),
});

// Documents Update Schema
export const DocumentsUpdateSchema = z.object({
  documents: z.array(DocumentSchema).min(1, 'At least one document entry is required'),
});

// Condition Report Update Schema
export const ConditionReportUpdateSchema = z.object({
  conditionReport: ConditionReportSchema,
});

// Meter Readings Update Schema
export const MeterReadingsUpdateSchema = z.object({
  meterReadings: MeterReadingsSchema,
});

// Checklist Item Update Schema
export const ChecklistItemUpdateSchema = z.object({
  completed: z.boolean().optional(),
  verifiedBy: z.string().optional(),
  notes: z.string().optional(),
});

// Dispute Create Schema
export const CreateDisputeSchema = z.object({
  item: z.string().min(1, 'Item name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

// Dispute Update Schema
export const UpdateDisputeSchema = z.object({
  status: DisputeStatusEnum.optional(),
  resolution: z.string().optional(),
});

// Dispute Resolve Schema
export const ResolveDisputeSchema = z.object({
  resolution: z.string().min(10, 'Resolution must be at least 10 characters'),
});

// Acceptance Schema
export const AcceptanceSchema = z.object({
  accepted: z.boolean(),
  conditionAccepted: z.boolean(),
  signature: z.string().optional(),
  notes: z.string().optional(),
});

// Feedback Submit Schema
export const SubmitFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comments: z.string().optional(),
});

// Query Schema for listing handovers
export const ListHandoversQuerySchema = z.object({
  status: HandoverStatusEnum.optional(),
  dealId: z.string().optional(),
  propertyId: z.string().optional(),
  buyerId: z.string().optional(),
  sellerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
});

// Available Slots Query Schema
export const AvailableSlotsQuerySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  propertyId: z.string().optional(),
});

// Type exports
export type KeyType = z.infer<typeof KeyTypeEnum>;
export type DocumentType = z.infer<typeof DocumentTypeEnum>;
export type ConditionType = z.infer<typeof ConditionEnum>;
export type FixturesType = z.infer<typeof FixturesEnum>;
export type AppliancesType = z.infer<typeof AppliancesEnum>;
export type ChecklistCategory = z.infer<typeof ChecklistCategoryEnum>;
export type DisputeStatus = z.infer<typeof DisputeStatusEnum>;
export type HandoverStatus = z.infer<typeof HandoverStatusEnum>;

export type Key = z.infer<typeof KeySchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type ConditionReport = z.infer<typeof ConditionReportSchema>;
export type MeterReading = z.infer<typeof MeterReadingSchema>;
export type MeterReadings = z.infer<typeof MeterReadingsSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type BuyerAcceptance = z.infer<typeof BuyerAcceptanceSchema>;
export type Dispute = z.infer<typeof DisputeSchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;

export type CreateHandoverInput = z.infer<typeof CreateHandoverSchema>;
export type ScheduleHandoverInput = z.infer<typeof ScheduleHandoverSchema>;
export type RescheduleHandoverInput = z.infer<typeof RescheduleHandoverSchema>;
export type CheckInInput = z.infer<typeof CheckInSchema>;
export type KeysUpdateInput = z.infer<typeof KeysUpdateSchema>;
export type DocumentsUpdateInput = z.infer<typeof DocumentsUpdateSchema>;
export type ConditionReportUpdateInput = z.infer<typeof ConditionReportUpdateSchema>;
export type MeterReadingsUpdateInput = z.infer<typeof MeterReadingsUpdateSchema>;
export type ChecklistItemUpdateInput = z.infer<typeof ChecklistItemUpdateSchema>;
export type CreateDisputeInput = z.infer<typeof CreateDisputeSchema>;
export type UpdateDisputeInput = z.infer<typeof UpdateDisputeSchema>;
export type ResolveDisputeInput = z.infer<typeof ResolveDisputeSchema>;
export type AcceptanceInput = z.infer<typeof AcceptanceSchema>;
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackSchema>;
export type ListHandoversQuery = z.infer<typeof ListHandoversQuerySchema>;
export type AvailableSlotsQuery = z.infer<typeof AvailableSlotsQuerySchema>;