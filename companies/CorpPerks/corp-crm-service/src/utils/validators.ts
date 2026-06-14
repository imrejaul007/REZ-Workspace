import { z } from 'zod';

// ============================================================================
// Common Validators
// ============================================================================

export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export const contactSchema = z.object({
  contactId: z.string().optional(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
});

export const activitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note', 'task', 'stage_change']),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  date: z.coerce.date(),
  performedBy: z.string().min(1, 'Performer ID is required'),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// Client Validators
// ============================================================================

export const createClientSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  industry: z.string().min(1, 'Industry is required').max(100),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().min(5, 'Phone is required').max(20),
  email: z.string().email('Invalid email'),
  address: addressSchema.optional(),
  contacts: z.array(contactSchema).optional(),
  status: z.enum(['prospect', 'active', 'inactive', 'churned']).optional(),
  source: z.enum(['referral', 'website', 'linkedin', 'cold_call', 'event', 'other']).optional(),
  assignedTo: z.string().min(1, 'Assigned employee ID is required'),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const addContactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

// ============================================================================
// Deal Validators
// ============================================================================

export const createDealSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  clientId: z.string().min(1, 'Client ID is required'),
  value: z.number().min(0, 'Value cannot be negative'),
  currency: z.enum(['INR', 'USD']).default('INR'),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedClose: z.coerce.date(),
  products: z.array(z.string()).optional(),
  owner: z.string().min(1, 'Owner ID is required'),
  notes: z.string().max(2000).optional(),
});

export const updateDealSchema = createDealSchema.partial().omit({ clientId: true });

export const moveStageSchema = z.object({
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
  lossReason: z.string().optional(),
});

export const addActivitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note', 'task']),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  date: z.coerce.date(),
  performedBy: z.string().min(1),
});

// ============================================================================
// Proposal Validators
// ============================================================================

export const createProposalSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  dealId: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  currency: z.enum(['INR', 'USD']).default('INR'),
  validUntil: z.coerce.date(),
});

export const updateProposalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  items: z.array(invoiceItemSchema).optional(),
  subtotal: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  validUntil: z.coerce.date().optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']).optional(),
});

export const signProposalSchema = z.object({
  signatureData: z.string().min(1, 'Signature data is required'),
});

// ============================================================================
// Invoice Validators
// ============================================================================

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  dealId: z.string().optional(),
  proposalId: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  currency: z.enum(['INR', 'USD']).default('INR'),
  dueDate: z.coerce.date(),
  notes: z.string().max(2000).optional(),
});

export const updateInvoiceSchema = z.object({
  items: z.array(invoiceItemSchema).optional(),
  subtotal: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']).optional(),
  notes: z.string().max(2000).optional(),
});

export const markPaidSchema = z.object({
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
});

// ============================================================================
// Filter Validators
// ============================================================================

export const clientFiltersSchema = z.object({
  status: z.enum(['prospect', 'active', 'inactive', 'churned']).optional(),
  source: z.enum(['referral', 'website', 'linkedin', 'cold_call', 'event', 'other']).optional(),
  industry: z.string().optional(),
  assignedTo: z.string().optional(),
  search: z.string().optional(),
  minDealValue: z.coerce.number().optional(),
  maxDealValue: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const dealFiltersSchema = z.object({
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  owner: z.string().optional(),
  clientId: z.string().optional(),
  minValue: z.coerce.number().optional(),
  maxValue: z.coerce.number().optional(),
  expectedCloseFrom: z.coerce.date().optional(),
  expectedCloseTo: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const invoiceFiltersSchema = z.object({
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']).optional(),
  clientId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  minTotal: z.coerce.number().optional(),
  maxTotal: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================================================
// Analytics Validators
// ============================================================================

export const analyticsDateRangeSchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  months: z.coerce.number().int().positive().max(24).default(12),
});
