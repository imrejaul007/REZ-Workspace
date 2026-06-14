/**
 * B2B Zod Validation Schemas for ReZ Merchant Platform
 * Contains validation schemas for all B2B request/response validation
 */

import { z } from 'zod';
import {
  SupplierStatus,
  POStatus,
  PaymentStatus,
  DueDatePreference,
  RFQStatus,
  QuoteStatus,
  CreditLineStatus,
  TransactionType,
  LedgerEntryType,
  DunningChannel,
  DunningPriority,
  DunningTrigger,
  PaymentMode,
  AttachmentType,
  GstTaxRate,
} from '../enums/b2b';
import {
  GST_PATTERN,
  PAN_PATTERN,
  IFSC_PATTERN,
  PHONE_PATTERN,
  MAX_NAME_LENGTH,
  MAX_NOTES_LENGTH,
  DEFAULT_CREDIT_PERIOD_DAYS,
  DEFAULT_INTEREST_RATE,
  DEFAULT_GRACE_DAYS,
  MAX_INTEREST_RATE,
} from '../constants/b2b';

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Address validation schema
 */
export const addressSchema = z.object({
  street1: z.string().max(200).optional(),
  street2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(50).default('India'),
  formatted: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

/**
 * Bank details validation schema
 */
export const bankDetailsSchema = z.object({
  bankName: z.string().max(200).optional(),
  branchName: z.string().max(200).optional(),
  accountHolderName: z.string().max(200).optional(),
  accountNumber: z.string().min(4).max(20).optional(),
  ifscCode: z.string().regex(IFSC_PATTERN, 'Invalid IFSC code format').optional().or(z.literal('')),
  swiftCode: z.string().max(11).optional(),
  accountType: z.enum(['savings', 'current']).optional(),
  upiId: z.string().max(100).optional(),
});

/**
 * Contact info validation schema
 */
export const contactInfoSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  phone: z.string().regex(PHONE_PATTERN, 'Must be 10 digit Indian phone number').optional(),
  mobile: z.string().regex(PHONE_PATTERN, 'Must be 10 digit Indian phone number').optional(),
  designation: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
});

/**
 * Attachment validation schema
 */
export const attachmentSchema = z.object({
  id: z.string().optional(),
  fileName: z.string().min(1).max(255),
  url: z.string().url(),
  mimeType: z.string().max(100),
  size: z.number().positive().max(10 * 1024 * 1024), // 10MB max
  type: z.nativeEnum(AttachmentType),
  uploadedAt: z.string().datetime().or(z.date()).optional(),
  uploadedBy: z.string().optional(),
});

// ============================================================================
// Supplier Schemas
// ============================================================================

/**
 * Create supplier validation schema
 */
export const createSupplierSchema = z.object({
  name: z.string().min(1).max(MAX_NAME_LENGTH),
  contactPerson: z.string().max(100).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  phone: z.string().regex(PHONE_PATTERN, 'Must be 10 digit Indian phone number'),
  address: addressSchema.optional(),
  gstNumber: z
    .string()
    .regex(GST_PATTERN, 'Invalid GST number format (e.g., 27AABCU9603R1ZM)')
    .optional()
    .or(z.literal('')),
  pan: z.string().regex(PAN_PATTERN, 'Invalid PAN format (e.g., AABCU9603R)').optional().or(z.literal('')),
  creditLimit: z.number().nonnegative().max(999999999).default(0),
  creditPeriodDays: z.number().int().min(0).max(365).default(DEFAULT_CREDIT_PERIOD_DAYS),
  dueDatePreference: z.nativeEnum(DueDatePreference).default(DueDatePreference.END_OF_MONTH),
  bankDetails: bankDetailsSchema.optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  paymentTerms: z.string().max(500).optional(),
  minimumOrderValue: z.number().nonnegative().optional(),
  avgDeliveryDays: z.number().int().min(0).optional(),
  contacts: z.array(contactInfoSchema).optional(),
  registrationNumber: z.string().max(50).optional(),
});

/**
 * Update supplier validation schema
 */
export const updateSupplierSchema = createSupplierSchema.partial();

/**
 * Supplier query params schema
 */
export const supplierQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(SupplierStatus).optional(),
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  tags: z.string().optional(), // comma-separated
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Purchase Order Schemas
// ============================================================================

/**
 * PO line item validation schema
 */
export const poLineItemSchema = z.object({
  id: z.string().optional(),
  productName: z.string().min(1).max(200),
  sku: z.string().max(50).optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  taxRate: z.nativeEnum(GstTaxRate).optional(),
  hsnCode: z.string().max(10).optional(),
  unit: z.string().max(20).optional(),
  description: z.string().max(500).optional(),
  expectedDeliveryDate: z.string().datetime().optional().or(z.date().optional()),
  productId: z.string().optional(),
  category: z.string().max(100).optional(),
});

/**
 * Create purchase order validation schema
 */
export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  storeId: z.string().optional(),
  items: z.array(poLineItemSchema).min(1, 'At least one item is required'),
  discount: z.number().nonnegative().default(0),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  expectedDeliveryDate: z.string().datetime().optional().or(z.date().optional()),
  billingAddress: addressSchema.optional(),
  shippingAddress: addressSchema.optional(),
  deliveryInstructions: z.string().max(1000).optional(),
  terms: z.string().max(2000).optional(),
});

/**
 * Update purchase order validation schema
 */
export const updatePurchaseOrderSchema = z.object({
  items: z.array(poLineItemSchema).min(1).optional(),
  discount: z.number().nonnegative().optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  expectedDeliveryDate: z.string().datetime().optional().or(z.date().optional()),
  billingAddress: addressSchema.optional(),
  shippingAddress: addressSchema.optional(),
  deliveryInstructions: z.string().max(1000).optional(),
});

/**
 * PO status update schema
 */
export const updatePOStatusSchema = z.object({
  status: z.nativeEnum(POStatus),
  comments: z.string().max(500).optional(),
});

/**
 * Receive PO items schema
 */
export const receivePOItemsSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string(),
      receivedQuantity: z.number().nonnegative(),
      notes: z.string().max(500).optional(),
    })
  ),
  receivedDate: z.string().datetime().or(z.date()).optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * PO query params schema
 */
export const poQuerySchema = z.object({
  search: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.nativeEnum(POStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// RFQ Schemas
// ============================================================================

/**
 * RFQ line item validation schema
 */
export const rfqLineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit: z.string().max(20).optional(),
  specifications: z.string().max(1000).optional(),
  qualityRequirements: z.string().max(1000).optional(),
  preferredDeliveryDate: z.string().datetime().optional().or(z.date().optional()),
  category: z.string().max(100).optional(),
  estimatedBudget: z.number().nonnegative().optional(),
});

/**
 * Create RFQ validation schema
 */
export const createRFQSchema = z.object({
  storeId: z.string().optional(),
  title: z.string().min(1).max(200),
  items: z.array(rfqLineItemSchema).min(1, 'At least one item is required'),
  invitedSupplierIds: z.array(z.string()).min(1, 'At least one supplier must be invited'),
  submissionDeadline: z.string().datetime().or(z.date()),
  expectedDeliveryDate: z.string().datetime().optional().or(z.date().optional()),
  terms: z.string().max(2000).optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
});

/**
 * Update RFQ validation schema
 */
export const updateRFQSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  items: z.array(rfqLineItemSchema).optional(),
  submissionDeadline: z.string().datetime().or(z.date()).optional(),
  expectedDeliveryDate: z.string().datetime().optional().or(z.date().optional()),
  terms: z.string().max(2000).optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
});

/**
 * RFQ query params schema
 */
export const rfqQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(RFQStatus).optional(),
  supplierId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Quote Schemas
// ============================================================================

/**
 * Quote line item validation schema
 */
export const quoteLineItemSchema = z.object({
  id: z.string().optional(),
  rfqLineItemId: z.string(),
  productName: z.string().min(1).max(200),
  sku: z.string().max(50).optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  taxRate: z.nativeEnum(GstTaxRate).optional(),
  hsnCode: z.string().max(10).optional(),
  leadTimeDays: z.number().int().nonnegative().optional(),
  remarks: z.string().max(500).optional(),
});

/**
 * Submit quote validation schema
 */
export const submitQuoteSchema = z.object({
  items: z.array(quoteLineItemSchema).min(1, 'At least one item is required'),
  validityDays: z.number().int().min(1).max(365).default(30),
  paymentTerms: z.string().max(500).optional(),
  deliveryPeriodDays: z.number().int().nonnegative().optional(),
  warrantyTerms: z.string().max(500).optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
});

/**
 * Quote query params schema
 */
export const quoteQuerySchema = z.object({
  search: z.string().optional(),
  rfqId: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.nativeEnum(QuoteStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('totalAmount'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================================================
// Payment Schemas
// ============================================================================

/**
 * Record payment validation schema
 */
export const recordPaymentSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  poId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  mode: z.nativeEnum(PaymentMode),
  referenceNumber: z.string().max(100).optional(),
  bankReference: z.string().max(100).optional(),
  paymentDate: z.string().datetime().or(z.date()),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  attachments: z.array(attachmentSchema).optional(),
});

/**
 * Payment query params schema
 */
export const paymentQuerySchema = z.object({
  search: z.string().optional(),
  supplierId: z.string().optional(),
  poId: z.string().optional(),
  mode: z.nativeEnum(PaymentMode).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('paymentDate'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Credit Line Schemas
// ============================================================================

/**
 * Create/update credit line validation schema
 */
export const createCreditLineSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  creditLimit: z.number().nonnegative().max(999999999),
  creditPeriodDays: z.number().int().min(0).max(365).default(DEFAULT_CREDIT_PERIOD_DAYS),
  interestRatePerMonth: z
    .number()
    .nonnegative()
    .max(MAX_INTEREST_RATE)
    .default(DEFAULT_INTEREST_RATE),
  graceDays: z.number().int().min(0).max(30).default(DEFAULT_GRACE_DAYS),
});

/**
 * Update credit line schema
 */
export const updateCreditLineSchema = createCreditLineSchema.partial().extend({
  status: z.nativeEnum(CreditLineStatus).optional(),
});

// ============================================================================
// Dunning Schemas
// ============================================================================

/**
 * Dunning step validation schema
 */
export const dunningStepSchema = z.object({
  days: z.number().int(),
  channel: z.nativeEnum(DunningChannel),
  priority: z.nativeEnum(DunningPriority),
  templateId: z.string().optional(),
  includePaymentLink: z.boolean().default(true),
  escalate: z.boolean().default(false),
  escalationContact: z.string().optional(),
});

/**
 * Create dunning config validation schema
 */
export const createDunningConfigSchema = z.object({
  name: z.string().min(1).max(100),
  isEnabled: z.boolean().default(true),
  trigger: z.nativeEnum(DunningTrigger),
  triggerValue: z.number().optional(),
  steps: z.array(dunningStepSchema).min(1, 'At least one step is required'),
  skipHolidays: z.boolean().default(true),
  maxAttemptsPerChannel: z.number().int().positive().optional(),
  businessHours: z
    .object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
      timezone: z.string().default('Asia/Kolkata'),
      excludeDays: z.array(z.number().int().min(0).max(6)).default([0]),
    })
    .optional(),
});

/**
 * Update dunning config schema
 */
export const updateDunningConfigSchema = createDunningConfigSchema.partial();

// ============================================================================
// Bank Transaction Schemas
// ============================================================================

/**
 * Create bank transaction validation schema
 */
export const createBankTransactionSchema = z.object({
  transactionDate: z.string().datetime().or(z.date()),
  valueDate: z.string().datetime().or(z.date()).optional(),
  description: z.string().min(1).max(500),
  amount: z.number(),
  transactionType: z.nativeEnum(TransactionType),
  bankReferenceNumber: z.string().max(100).optional(),
  utrNumber: z.string().max(30).optional(),
  chequeNumber: z.string().max(30).optional(),
  accountNumber: z.string().max(20).optional(),
  branchName: z.string().max(100).optional(),
  runningBalance: z.number().optional(),
  rawData: z.record(z.unknown()).optional(),
});

/**
 * Match transaction schema
 */
export const matchTransactionSchema = z.object({
  matchType: z.enum(['exact', 'contains', 'regex', 'range']),
  poId: z.string().optional(),
  paymentId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// ============================================================================
// Ledger Schemas
// ============================================================================

/**
 * Create ledger entry validation schema
 */
export const createLedgerEntrySchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  entryType: z.nativeEnum(LedgerEntryType),
  transactionType: z.nativeEnum(TransactionType),
  amount: z.number().positive(),
  referenceType: z.enum(['po', 'payment', 'credit_note', 'adjustment', 'interest']).optional(),
  referenceId: z.string().optional(),
  referenceNumber: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
  paymentDate: z.string().datetime().or(z.date()).optional(),
  interestAmount: z.number().nonnegative().optional(),
});

/**
 * Ledger query params schema
 */
export const ledgerQuerySchema = z.object({
  supplierId: z.string().optional(),
  entryType: z.nativeEnum(LedgerEntryType).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Bulk status update schema
 */
export const bulkStatusUpdateSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  status: z.nativeEnum(POStatus),
  comments: z.string().max(500).optional(),
});

/**
 * Bulk delete schema
 */
export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

// ============================================================================
// Type exports from schemas
// ============================================================================

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type CreateRFQInput = z.infer<typeof createRFQSchema>;
export type UpdateRFQInput = z.infer<typeof updateRFQSchema>;
export type SubmitQuoteInput = z.infer<typeof submitQuoteSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type CreateDunningConfigInput = z.infer<typeof createDunningConfigSchema>;
