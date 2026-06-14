import { z } from 'zod';

// Transaction schemas
export const TransactionTypeSchema = z.enum(['income', 'expense', 'transfer']);
export const TransactionCategorySchema = z.enum([
  'salary', 'rent', 'utilities', 'supplies', 'marketing',
  'payroll', 'taxes', 'insurance', 'investment', 'loan', 'other'
]);

export const CreateTransactionSchema = z.object({
  tenantId: z.string().min(1),
  type: TransactionTypeSchema,
  category: TransactionCategorySchema,
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  reference: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const TransactionQuerySchema = z.object({
  tenantId: z.string().min(1),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  type: TransactionTypeSchema.optional(),
  category: TransactionCategorySchema.optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional()
});

export const PredictionRequestSchema = z.object({
  tenantId: z.string().min(1),
  features: z.array(z.object({
    name: z.string(),
    value: z.union([z.string(), z.number()])
  })),
  model: z.enum(['cashflow', 'expense', 'revenue']).default('cashflow')
});

// Analysis schemas
export const AnalyzeTransactionSchema = z.object({
  tenantId: z.string().min(1),
  transactionId: z.string().optional(),
  amount: z.number(),
  type: TransactionTypeSchema,
  category: TransactionCategorySchema,
  description: z.string().optional()
});

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
    requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString()
  };
}

// Type exports
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type TransactionCategory = z.infer<typeof TransactionCategorySchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type PredictionRequest = z.infer<typeof PredictionRequestSchema>;
