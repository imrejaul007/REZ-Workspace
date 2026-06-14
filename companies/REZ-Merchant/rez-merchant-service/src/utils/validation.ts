/**
 * Zod Validation Schemas
 *
 * Centralized validation schemas for API routes.
 * Import from this file to ensure consistent validation across all endpoints.
 */

import { z } from 'zod';

// ── Common Schemas ─────────────────────────────────────────────────────────────

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const dateRangeSchema = z.object({
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

// ── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase')
    .regex(/[a-z]/, 'Password must contain lowercase')
    .regex(/[0-9]/, 'Password must contain number'),
  businessName: z.string().min(2, 'Business name required').max(200),
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number'),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
});

// ── Supplier Schemas ─────────────────────────────────────────────────────────

export const createSupplierSchema = z.object({
  name: z.string().min(2, 'Name required').max(200),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/).optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().or(z.literal('')),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().or(z.literal('')),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default('India'),
  }).optional(),
  bankDetails: z.object({
    accountNumber: z.string().optional(),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional(),
    bankName: z.string().optional(),
    accountHolderName: z.string().optional(),
  }).optional(),
  creditLimit: z.number().positive().optional(),
  creditPeriodDays: z.number().int().min(0).max(365).optional(),
});

// ── Purchase Order Schemas ────────────────────────────────────────────────────

export const createPOSchema = z.object({
  supplierId: objectIdSchema,
  items: z.array(z.object({
    productId: objectIdSchema.optional(),
    name: z.string().min(1, 'Item name required'),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().optional(),
    unitPrice: z.number().nonnegative('Unit price cannot be negative'),
    hsnCode: z.string().optional(),
    taxRate: z.number().min(0).max(100).optional(),
    discount: z.number().min(0).optional(),
  })).min(1, 'At least one item required'),
  orderDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
  terms: z.string().max(2000).optional(),
});

export const updatePOStatusSchema = z.object({
  status: z.enum(['draft', 'pending', 'approved', 'sent', 'acknowledged', 'partial', 'delivered', 'cancelled']),
});

// ── Expense Schemas ─────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  type: z.enum(['supplier', 'operational', 'salary', 'rent', 'utilities', 'marketing', 'other']),
  category: z.string().min(1, 'Category required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('INR'),
  description: z.string().min(1, 'Description required').max(500),
  date: z.string().datetime().optional(),
  supplierId: objectIdSchema.optional(),
  reference: z.string().max(100).optional(),
  receiptUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

// ── Payment Schemas ──────────────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  supplierId: objectIdSchema,
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['upi', 'bank_transfer', 'cash', 'cheque', 'neft', 'rtgs', 'imps']),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  linkedInvoiceIds: z.array(objectIdSchema).optional(),
  scheduledDate: z.string().datetime().optional(),
});

// ── Customer Schemas ─────────────────────────────────────────────────────────

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name required').max(200),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/).optional(),
  type: z.enum(['individual', 'business']).default('individual'),
  companyName: z.string().max(200).optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().or(z.literal('')),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default('India'),
  }).optional(),
  creditLimit: z.number().positive().optional(),
  creditPeriodDays: z.number().int().min(0).max(365).optional(),
});

// ── Webhook Schemas ──────────────────────────────────────────────────────────

export const razorpayWebhookSchema = z.object({
  entity: z.string(),
  account_id: z.string().optional(),
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        amount: z.number(),
        currency: z.string(),
        status: z.string(),
        order_id: z.string().optional(),
        invoice_id: z.string().optional(),
      }),
    }).optional(),
    order: z.object({
      entity: z.object({
        id: z.string(),
        amount: z.number(),
        status: z.string(),
      }),
    }).optional(),
  }),
  created_at: z.number(),
});

// ── Validation Helper ────────────────────────────────────────────────────────

export type ValidationError = {
  field: string;
  message: string;
};

export function formatZodErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Middleware factory for request body validation
 */
export function validateBody<T extends z.ZodSchema>(schema: T) {
  return (data: unknown) => {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data } as { success: true; data: z.infer<T> };
    }
    return { success: false, errors: formatZodErrors(result.error) };
  };
}

// ── Vendor Portal Schemas ─────────────────────────────────────────────────────

export const vendorAccessTokenSchema = z.object({
  accessToken: z.string().min(1, 'Access token required'),
});

export const vendorQuerySchema = z.object({
  supplierId: objectIdSchema.optional(),
  merchantId: objectIdSchema.optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ── Salon Inventory Schemas ─────────────────────────────────────────────────────

export const salonInventoryProductSchema = z.object({
  storeId: objectIdSchema,
  name: z.string().min(1).max(200),
  brand: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  quantity: z.number().int().min(0).default(0),
  unit: z.string().max(50).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  cost: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  supplier: z.string().max(200).optional(),
  expiryDate: z.string().datetime().optional(),
});

export const salonInventoryStockUpdateSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
});

export const salonInventoryRestockSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const salonInventoryUsageSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
  staffId: objectIdSchema,
  notes: z.string().max(500).optional(),
});

// ── Nutrition Schemas ─────────────────────────────────────────────────────

export const nutritionPlanSchema = z.object({
  storeId: objectIdSchema.optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['weight_loss', 'muscle_gain', 'maintenance', 'custom']).optional(),
  dailyCalories: z.number().int().positive().optional(),
  proteinGrams: z.number().int().min(0).optional(),
  carbsGrams: z.number().int().min(0).optional(),
  fatGrams: z.number().int().min(0).optional(),
  meals: z.array(z.object({
    name: z.string(),
    calories: z.number().int().min(0),
    time: z.string().optional(),
  })).optional(),
  duration: z.number().int().positive().optional(),
  createdBy: objectIdSchema.optional(),
});

export const nutritionAssignSchema = z.object({
  memberId: objectIdSchema,
  assignedBy: objectIdSchema.optional(),
});

export const nutritionMealLogSchema = z.object({
  name: z.string().min(1).max(200),
  calories: z.number().int().min(0),
  date: z.string().datetime(),
  storeId: objectIdSchema.optional(),
});

// ── Check-in/out Schemas ─────────────────────────────────────────────────────

export const checkInScheduleSchema = z.object({
  bookingId: objectIdSchema,
  checkInDate: z.string().datetime(),
  checkOutDate: z.string().datetime(),
  storeId: objectIdSchema.optional(),
  roomId: z.string().optional(),
  guestName: z.string().max(200).optional(),
  guestPhone: z.string().regex(/^\+?[1-9]\d{6,14}$/).optional(),
});

export const checkInReminderSchema = z.object({
  type: z.enum(['checkin', 'checkout']),
});
