import { z } from 'zod';

// Invoice types
export const InvoiceTypeSchema = z.enum(['sales', 'purchase', 'credit', 'debit']);
export const InvoiceStatusSchema = z.enum(['draft', 'pending', 'paid', 'cancelled']);

export const CreateInvoiceSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  type: InvoiceTypeSchema,
  amount: z.number().positive('Amount must be positive'),
  party: z.string().min(1, 'Party name is required'),
  ledger: z.string().min(1, 'Ledger name is required'),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    rate: z.number().positive(),
    tax: z.number().min(0).max(100).optional()
  })).optional()
});

export const InvoiceQuerySchema = z.object({
  tenantId: z.string().min(1),
  status: InvoiceStatusSchema.optional(),
  type: InvoiceTypeSchema.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional()
});

export type InvoiceType = z.infer<typeof InvoiceTypeSchema>;
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type InvoiceQuery = z.infer<typeof InvoiceQuerySchema>;

// Ledger types
export const CreateLedgerEntrySchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  ledger: z.string().min(1, 'Ledger name is required'),
  debit: z.number().min(0).optional(),
  credit: z.number().min(0).optional(),
  narration: z.string().optional(),
  reference: z.string().optional(),
  date: z.string().datetime().optional()
});

export const LedgerQuerySchema = z.object({
  tenantId: z.string().min(1),
  ledger: z.string().min(1),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional()
});

export type CreateLedgerEntryInput = z.infer<typeof CreateLedgerEntrySchema>;
export type LedgerQuery = z.infer<typeof LedgerQuerySchema>;

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
  timestamp: string;
}

export function createResponse<T>(success: boolean, data?: T, error?: ApiResponse['error']): ApiResponse<T> {
  return {
    success,
    data,
    error,
    requestId: generateRequestId(),
    timestamp: new Date().toISOString()
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
