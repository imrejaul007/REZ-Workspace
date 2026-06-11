/**
 * LEDGERAI - Validation Middleware
 * Zod-based request validation
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import logger from './logger';

// ============================================
// VALIDATION SCHEMAS
// ============================================

// Account Schemas
export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20).toUpperCase(),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  category: z.enum(['cash', 'bank', 'accounts_receivable', 'inventory', 'accounts_payable',
                    'credit_card', 'loan', 'equity', 'sales', 'cost_of_sales',
                    'operating_expense', 'other_income', 'other_expense']),
  balance: z.number().optional().default(0),
  description: z.string().max(500).optional(),
  parentId: z.string().optional()
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(20).toUpperCase().optional(),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']).optional(),
  category: z.enum(['cash', 'bank', 'accounts_receivable', 'inventory', 'accounts_payable',
                    'credit_card', 'loan', 'equity', 'sales', 'cost_of_sales',
                    'operating_expense', 'other_income', 'other_expense']).optional(),
  balance: z.number().optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional()
});

// Transaction Schemas
export const createTransactionSchema = z.object({
  date: z.string().or(z.date()).transform(val => new Date(val)),
  description: z.string().min(1).max(500),
  accounts: z.array(z.object({
    accountId: z.string().min(1),
    debit: z.number().min(0).optional().default(0),
    credit: z.number().min(0).optional().default(0)
  })).min(2),
  amount: z.number().min(0),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional()
});

// Invoice Schemas
export const createInvoiceSchema = z.object({
  customerId: z.string().min(1),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().optional(),
  customerAddress: z.string().max(500).optional(),
  customerPhone: z.string().max(50).optional(),
  items: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().int().positive(),
    rate: z.number().min(0),
    taxRate: z.number().min(0).max(100).optional().default(0)
  })).min(1),
  taxRate: z.number().min(0).max(100).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  dueDate: z.string().or(z.date()).transform(val => new Date(val)),
  notes: z.string().max(1000).optional(),
  terms: z.string().max(1000).optional()
});

export const updateInvoiceSchema = z.object({
  customerName: z.string().min(1).max(200).optional(),
  customerEmail: z.string().email().optional(),
  customerAddress: z.string().max(500).optional(),
  customerPhone: z.string().max(50).optional(),
  items: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().int().positive(),
    rate: z.number().min(0),
    taxRate: z.number().min(0).max(100).optional()
  })).min(1).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  dueDate: z.string().or(z.date()).transform(val => new Date(val)).optional(),
  notes: z.string().max(1000).optional(),
  terms: z.string().max(1000).optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled', 'refunded']).optional()
});

export const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['cash', 'check', 'bank_transfer', 'credit_card', 'other']),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional()
});

// Budget Schemas
export const createBudgetSchema = z.object({
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.string().or(z.date()).transform(val => new Date(val)),
  endDate: z.string().or(z.date()).transform(val => new Date(val)),
  budgeted: z.number().positive()
});

export const updateBudgetSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  subcategory: z.string().max(100).optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  startDate: z.string().or(z.date()).transform(val => new Date(val)).optional(),
  endDate: z.string().or(z.date()).transform(val => new Date(val)).optional(),
  budgeted: z.number().positive().optional()
});

// User Schemas
export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'accountant', 'user']).optional().default('user')
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// AI Schemas
export const categorizeSchema = z.object({
  description: z.string().min(1).max(500),
  amount: z.number().optional(),
  date: z.string().or(z.date()).transform(val => new Date(val)).optional()
});

export const reconcileSchema = z.object({
  transactionIds: z.array(z.string()).min(1)
});

// ============================================
// VALIDATION MIDDLEWARE FACTORY
// ============================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  data?: unknown;
  errors?: ValidationError[];
}

export const validate = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors
        });

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors
        });
        return;
      }

      logger.error('Unexpected validation error', { error });
      res.status(500).json({
        success: false,
        error: 'Validation error',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

// Query validation for GET requests
export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        res.status(400).json({
          success: false,
          error: 'Query validation failed',
          code: 'QUERY_VALIDATION_ERROR',
          details: errors
        });
        return;
      }

      next();
    }
  };
};

// Param validation
export const validateParams = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedParams = schema.parse(req.params);
      req.params = validatedParams as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          code: 'INVALID_PARAMS'
        });
        return;
      }

      next();
    }
  };
};

// Validate ObjectId
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
export const objectIdsArraySchema = z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'));

export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];

    if (!id) {
      res.status(400).json({
        success: false,
        error: `Missing ${paramName} parameter`,
        code: 'MISSING_PARAM'
      });
      return;
    }

    const result = objectIdSchema.safeParse(id);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: `Invalid ${paramName}`,
        code: 'INVALID_ID'
      });
      return;
    }

    next();
  };
};