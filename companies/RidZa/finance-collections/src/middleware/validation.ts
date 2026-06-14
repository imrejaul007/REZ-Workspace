import { z } from 'zod';
import { PaymentChannel } from '../models/Receivable';

// Validation schemas
export const tenantIdSchema = z.string().min(1, 'Tenant ID is required').max(100);

export const receivableIdSchema = z.string().min(1, 'Receivable ID is required');

export const createReceivableSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  customerName: z.string().min(1, 'Customer name is required').max(255),
  customerEmail: z.string().email('Invalid email address').optional(),
  customerPhone: z.string().max(20).optional(),
  invoiceNumber: z.string().max(100).optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('USD'),
  dueDate: z.string().datetime({ message: 'Due date must be ISO 8601 format' }),
  issueDate: z.string().datetime({ message: 'Issue date must be ISO 8601 format' }),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateReceivableSchema = z.object({
  customerName: z.string().min(1).max(255).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().max(20).optional().or(z.literal('')),
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['pending', 'overdue', 'partial', 'paid', 'written_off']).optional(),
  notes: z.string().max(1000).optional(),
});

export const createFollowUpSchema = z.object({
  receivableId: receivableIdSchema,
  channel: z.nativeEnum(PaymentChannel, {
    errorMap: () => ({ message: 'Invalid channel. Must be email, whatsapp, sms, call, or letter' }),
  }),
  message: z.string().min(1, 'Message is required').max(2000),
  scheduledDate: z.string().datetime({ message: 'Scheduled date must be ISO 8601 format' }).optional(),
});

export const recordPaymentSchema = z.object({
  receivableId: receivableIdSchema,
  amount: z.number().positive('Payment amount must be positive'),
  paymentDate: z.string().datetime({ message: 'Payment date must be ISO 8601 format' }).optional(),
});

export const getAgingReportSchema = z.object({
  tenantId: tenantIdSchema,
  includeDetails: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
});

export const batchReminderSchema = z.object({
  channel: z.nativeEnum(PaymentChannel).default(PaymentChannel.EMAIL),
  priorityOnly: z.boolean().default(false),
});

// Type exports
export type CreateReceivableInput = z.infer<typeof createReceivableSchema>;
export type UpdateReceivableInput = z.infer<typeof updateReceivableSchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type BatchReminderInput = z.infer<typeof batchReminderSchema>;

// Validation helper
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } => {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  };
}

// Express middleware for body validation
export function validateRequest(schema: z.ZodSchema) {
  return (req: { body: unknown }, res: { status: (code: number) => { json: (data: { error: string; details: unknown }) => void } }, next: () => void) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export default {
  tenantIdSchema,
  receivableIdSchema,
  createReceivableSchema,
  updateReceivableSchema,
  createFollowUpSchema,
  recordPaymentSchema,
  getAgingReportSchema,
  batchReminderSchema,
  validateBody,
  validateRequest,
};