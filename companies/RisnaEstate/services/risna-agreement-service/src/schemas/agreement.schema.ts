import { z } from 'zod';

// Agreement Types
export const AgreementTypeSchema = z.enum([
  'sale_agreement',
  'noc',
  'mou',
  '租约',
  'leave_license',
  '租让协议'
]);

// Property Types
export const PropertyTypeSchema = z.enum([
  'apartment',
  'villa',
  'plot',
  'commercial',
  'land'
]);

// Area Units
export const AreaUnitSchema = z.enum(['sqft', 'sqm', 'sqyd']);

// Agreement Status
export const AgreementStatusSchema = z.enum([
  'draft',
  'pending_buyer_sign',
  'pending_seller_sign',
  'pending_witness',
  'completed',
  'registered',
  'cancelled'
]);

// Payment Status
export const PaymentStatusSchema = z.enum(['pending', 'paid', 'overdue']);

// Payment Schedule Schema
export const PaymentScheduleSchema = z.object({
  milestone: z.string().min(1, 'Milestone is required'),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().datetime().or(z.date()),
  paidAt: z.string().datetime().optional().or(z.date().optional()),
  status: PaymentStatusSchema.default('pending'),
  notes: z.string().optional()
});

// Create Agreement Schema
export const CreateAgreementSchema = z.object({
  dealId: z.string().min(1, 'Deal ID is required'),
  propertyId: z.string().min(1, 'Property ID is required'),
  buyerId: z.string().min(1, 'Buyer ID is required'),
  sellerId: z.string().min(1, 'Seller ID is required'),
  brokerId: z.string().min(1, 'Broker ID is required'),

  // Agreement Type
  type: AgreementTypeSchema,

  // Property Details
  propertyAddress: z.string().min(1, 'Property address is required'),
  propertyType: PropertyTypeSchema,
  propertyArea: z.number().positive('Property area must be positive'),
  propertyAreaUnit: AreaUnitSchema.default('sqft'),

  // Price Details
  totalPrice: z.number().positive('Total price must be positive'),
  tokenAmount: z.number().min(0).default(0),
  registrationAmount: z.number().min(0).default(0),
  stampDuty: z.number().min(0).default(0),
  gst: z.number().min(0).default(0),

  // Payment Schedule
  paymentSchedule: z.array(PaymentScheduleSchema).optional().default([]),

  // Terms
  saleConsideration: z.number().positive('Sale consideration must be positive'),
  parkingIncluded: z.boolean().default(false),
  parkingPrice: z.number().min(0).default(0),
  possessionDate: z.string().datetime().or(z.date()),
  agreementDate: z.string().datetime().or(z.date()),

  // Terms& Conditions
  terms: z.string().optional().default(''),
  specialConditions: z.string().optional().default('')
});

// Update Agreement Schema
export const UpdateAgreementSchema = z.object({
  propertyAddress: z.string().min(1).optional(),
  propertyType: PropertyTypeSchema.optional(),
  propertyArea: z.number().positive().optional(),
  propertyAreaUnit: AreaUnitSchema.optional(),

  totalPrice: z.number().positive().optional(),
  tokenAmount: z.number().min(0).optional(),
  registrationAmount: z.number().min(0).optional(),
  stampDuty: z.number().min(0).optional(),
  gst: z.number().min(0).optional(),

  paymentSchedule: z.array(PaymentScheduleSchema).optional(),

  saleConsideration: z.number().positive().optional(),
  parkingIncluded: z.boolean().optional(),
  parkingPrice: z.number().min(0).optional(),
  possessionDate: z.string().datetime().or(z.date()).optional(),
  agreementDate: z.string().datetime().or(z.date()).optional(),

  terms: z.string().optional(),
  specialConditions: z.string().optional(),

  status: AgreementStatusSchema.optional()
});

// Add Payment Schema
export const AddPaymentSchema = z.object({
  milestone: z.string().min(1, 'Milestone is required'),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().datetime().or(z.date()),
  notes: z.string().optional()
});

// Confirm Payment Schema
export const ConfirmPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  notes: z.string().optional()
});

// E-Sign Schema
export const ESignSchema = z.object({
  signature: z.string().min(1, 'Signature is required (Base64)'),
  signerName: z.string().min(1, 'Signer name is required'),
  signerEmail: z.string().email().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

// Register Agreement Schema
export const RegisterAgreementSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  registeredAtOffice: z.string().min(1, 'Registration office is required'),
  registrationDate: z.string().datetime().or(z.date()).optional()
});

// Query Agreements Schema
export const QueryAgreementsSchema = z.object({
  status: AgreementStatusSchema.optional(),
  type: AgreementTypeSchema.optional(),
  dealId: z.string().optional(),
  propertyId: z.string().optional(),
  buyerId: z.string().optional(),
  sellerId: z.string().optional(),
  brokerId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Template Selection Schema
export const TemplateSelectionSchema = z.object({
  templateType: AgreementTypeSchema
});

// Type exports
export type AgreementType = z.infer<typeof AgreementTypeSchema>;
export type PropertyType = z.infer<typeof PropertyTypeSchema>;
export type AreaUnit = z.infer<typeof AreaUnitSchema>;
export type AgreementStatus = z.infer<typeof AgreementStatusSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type PaymentScheduleInput = z.infer<typeof PaymentScheduleSchema>;
export type CreateAgreementInput = z.infer<typeof CreateAgreementSchema>;
export type UpdateAgreementInput = z.infer<typeof UpdateAgreementSchema>;
export type AddPaymentInput = z.infer<typeof AddPaymentSchema>;
export type ConfirmPaymentInput = z.infer<typeof ConfirmPaymentSchema>;
export type ESignInput = z.infer<typeof ESignSchema>;
export type RegisterAgreementInput = z.infer<typeof RegisterAgreementSchema>;
export type QueryAgreementsInput = z.infer<typeof QueryAgreementsSchema>;
export type TemplateSelectionInput = z.infer<typeof TemplateSelectionSchema>;
