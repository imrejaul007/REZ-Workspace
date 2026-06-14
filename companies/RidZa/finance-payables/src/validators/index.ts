/**
 * Zod validation schemas for Finance Payables
 */
import { z } from 'zod';

// Address schema
const addressSchema = z.object({
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(4).max(10),
  country: z.string().max(50).default('India'),
});

// Bank details schema
const bankDetailsSchema = z.object({
  accountName: z.string().min(1).max(200),
  accountNumber: z.string().min(5).max(30),
  bankName: z.string().min(1).max(200),
  ifscCode: z.string().min(5).max(15),
  branchName: z.string().max(200).optional(),
});

// Line item schema
const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
});

// ============ VENDOR SCHEMAS ============

export const createVendorSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional().or(z.literal('')),
  address: addressSchema.optional(),
  bankDetails: bankDetailsSchema.optional(),
  paymentTerms: z.enum(['immediate', 'net15', 'net30', 'net45', 'net60', 'custom']).default('net30'),
  customPaymentDays: z.number().int().min(0).max(365).optional(),
  creditLimit: z.number().min(0).optional(),
  category: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateVendorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional().or(z.literal('')),
  address: addressSchema.optional(),
  bankDetails: bankDetailsSchema.optional(),
  paymentTerms: z.enum(['immediate', 'net15', 'net30', 'net45', 'net60', 'custom']).optional(),
  customPaymentDays: z.number().int().min(0).max(365).optional(),
  creditLimit: z.number().min(0).optional(),
  category: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['active', 'inactive', 'blocked']).optional(),
});

export const vendorQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'blocked']).optional(),
  category: z.string().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============ BILL SCHEMAS ============

export const createBillSchema = z.object({
  tenantId: z.string().min(1),
  vendorId: z.string().min(1),
  invoiceNumber: z.string().min(1).max(50),
  invoiceDate: z.string().datetime().or(z.date()),
  dueDate: z.string().datetime().or(z.date()),
  amount: z.number().positive(),
  taxAmount: z.number().min(0).default(0),
  totalAmount: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  category: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  lineItems: z.array(lineItemSchema).optional(),
  attachments: z.array(z.string().url()).max(10).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateBillSchema = z.object({
  vendorId: z.string().min(1).optional(),
  invoiceNumber: z.string().min(1).max(50).optional(),
  invoiceDate: z.string().datetime().or(z.date()).optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
  amount: z.number().positive().optional(),
  taxAmount: z.number().min(0).optional(),
  totalAmount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  category: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  lineItems: z.array(lineItemSchema).optional(),
  attachments: z.array(z.string().url()).max(10).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['draft', 'pending', 'approved', 'scheduled', 'paid', 'overdue', 'cancelled']).optional(),
});

export const billQuerySchema = z.object({
  vendorId: z.string().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'scheduled', 'paid', 'overdue', 'cancelled']).optional(),
  category: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============ PAYMENT SCHEMAS ============

export const processPaymentSchema = z.object({
  amount: z.number().positive().optional(), // If not provided, pays full amount
  paymentMethod: z.enum(['bank_transfer', 'upi', 'neft', 'rtgs', 'cash', 'cheque']).optional(),
  paymentReference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  scheduledDate: z.string().datetime().or(z.date()).optional(),
});

export const scheduleQuerySchema = z.object({
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  vendorId: z.string().optional(),
  includeSuggestions: z.coerce.boolean().default(true),
});

// ============ ID PARAM SCHEMAS ============

export const vendorIdParamsSchema = z.object({
  tenantId: z.string().min(1),
  vendorId: z.string().min(1),
});

export const billIdParamsSchema = z.object({
  tenantId: z.string().min(1),
  billId: z.string().min(1),
});

export const scheduleParamsSchema = z.object({
  tenantId: z.string().min(1),
});

// Type exports
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type VendorQueryInput = z.infer<typeof vendorQuerySchema>;
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type BillQueryInput = z.infer<typeof billQuerySchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type ScheduleQueryInput = z.infer<typeof scheduleQuerySchema>;
