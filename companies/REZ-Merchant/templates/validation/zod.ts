// ================================================
// REZ-Merchant Zod Validation Template
// Standardized validation schemas for all services
// ================================================

import { z } from 'zod';

// ================================================
// Common Validation Patterns
// ================================================

// ObjectId validation
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// ================================================
// Auth Validation
// ================================================
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});

// ================================================
// Merchant Validation
// ================================================
export const createMerchantSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  businessType: z.enum([
    'restaurant', 'hotel', 'salon', 'gym', 'healthcare',
    'retail', 'grocery', 'education', 'pharmacy', 'automotive', 'fashion', 'events'
  ]),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(5),
    country: z.string().min(2).default('US'),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
  }),
  taxId: z.string().optional(),
  bankDetails: z.object({
    accountNumber: z.string(),
    routingNumber: z.string(),
    bankName: z.string(),
  }).optional(),
});

export const updateMerchantSchema = createMerchantSchema.partial();

// ================================================
// Inventory Validation
// ================================================
export const createItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().min(1),
  unit: z.enum(['piece', 'kg', 'g', 'l', 'ml', 'oz', 'lb']),
  quantity: z.number().min(0),
  minQuantity: z.number().min(0).optional(),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  supplier: z.string().optional(),
  barcode: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
});

export const stockAdjustmentSchema = z.object({
  itemId: z.string(),
  adjustment: z.number().int(),
  reason: z.enum(['purchase', 'sale', 'return', 'damage', 'correction', 'transfer']),
  notes: z.string().optional(),
  reference: z.string().optional(),
});

// ================================================
// Order Validation
// ================================================
export const createOrderSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).optional(),
  })).min(1, 'At least one item is required'),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  tableNumber: z.string().optional(),
  deliveryAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
  }).optional(),
});

// ================================================
// Staff Validation
// ================================================
export const createStaffSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  role: z.enum(['admin', 'manager', 'cashier', 'server', 'cook', 'cleaner']),
  department: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  hireDate: z.string().datetime().optional(),
});

export const scheduleSchema = z.object({
  staffId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakDuration: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// ================================================
// Validation Middleware Factory
// ================================================
export const validateBody = <T>(schema: z.ZodType<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = <T>(schema: z.ZodType<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      } else {
        next(error);
      }
    }
  };
};

// Import express types
import { Request, Response, NextFunction } from 'express';