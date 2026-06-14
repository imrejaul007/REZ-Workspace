import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
export const createQuoteSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  customerCompany: z.string().optional(),
  customerAddress: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).optional(),
    tax: z.number().min(0).optional()
  })).optional(),
  discount: z.number().min(0).optional(),
  taxRate: z.number().min(0).optional(),
  currency: z.string().optional(),
  validUntil: z.string().or(z.date()),
  notes: z.string().optional(),
  terms: z.string().optional(),
  createdBy: z.string()
});

export const updateQuoteSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerCompany: z.string().optional(),
  customerAddress: z.string().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).optional(),
    tax: z.number().min(0).optional()
  })).optional(),
  discount: z.number().min(0).optional(),
  taxRate: z.number().min(0).optional(),
  validUntil: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  updatedBy: z.string().optional()
});

// Middleware
export const validateCreateQuote = (req: Request, res: Response, next: NextFunction) => {
  try {
    createQuoteSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    next(error);
  }
};

export const validateUpdateQuote = (req: Request, res: Response, next: NextFunction) => {
  try {
    updateQuoteSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    next(error);
  }
};