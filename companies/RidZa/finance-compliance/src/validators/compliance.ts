/**
 * Input Validation with Zod
 * GST, TDS, and Payroll compliance request schemas
 */
import { z } from 'zod';
import { GstSlab, TdsSection } from '../models/Compliance';

// GSTIN pattern: 15 characters (2 digits + 5 letters + 4 digits + 1 letter + 1 digit + 1 letter + 1 digit)
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

// PAN pattern: 10 characters (5 letters + 4 digits + 1 letter)
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// HSN code: 2-8 digits
const HSN_PATTERN = /^\d{2,8}$/;

// Invoice number pattern (alphanumeric, 1-16 chars)
const INVOICE_NUMBER_PATTERN = /^[A-Za-z0-9\-\/]{1,16}$/;

// ============ GST Schemas ============

/**
 * GST Invoice input schema
 */
export const GstInvoiceInputSchema = z.object({
  invoiceNumber: z.string().regex(INVOICE_NUMBER_PATTERN, 'Invalid invoice number format'),
  invoiceDate: z.string().datetime({ message: 'Invalid date format, use ISO 8601' }),
  supplierGstin: z.string().regex(GSTIN_PATTERN, 'Invalid supplier GSTIN format'),
  recipientGstin: z.string().regex(GSTIN_PATTERN, 'Invalid recipient GSTIN format'),
  hsnCode: z.string().regex(HSN_PATTERN, 'Invalid HSN code format (2-8 digits)'),
  taxableValue: z.number().min(0, 'Taxable value cannot be negative'),
  cgst: z.number().min(0).optional(),
  sgst: z.number().min(0).optional(),
  igst: z.number().min(0).optional(),
  totalGst: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  placeOfSupply: z.string().min(2, 'Place of supply is required'),
  reverseCharge: z.boolean().default(false),
});

/**
 * GST Calculation Input Schema
 */
export const GstCalculationInputSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  invoices: z.array(
    z.object({
      invoiceNumber: z.string().optional(),
      taxableValue: z.number().min(0, 'Taxable value must be non-negative'),
      hsnCode: z.string().regex(HSN_PATTERN, 'Invalid HSN code format'),
      isInterState: z.boolean().default(false),
      reverseCharge: z.boolean().default(false),
    })
  ).min(1, 'At least one invoice is required'),
});

/**
 * GST Record creation schema
 */
export const GstRecordCreateSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  financialYear: z.string().regex(/^\d{4}-\d{4}$/, 'Invalid financial year format (YYYY-YYYY)'),
  period: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  invoices: z.array(GstInvoiceInputSchema).min(1),
});

/**
 * GST Bulk calculation request
 */
export const GstBulkCalculateSchema = z.object({
  tenantId: z.string().min(1),
  invoices: z.array(z.object({
    taxableValue: z.number().min(0),
    hsnCode: z.string().regex(HSN_PATTERN),
    isInterState: z.boolean(),
    reverseCharge: z.boolean().optional(),
  })).min(1).max(1000, 'Maximum 1000 invoices per request'),
});

// ============ TDS Schemas ============

/**
 * TDS Section enum values
 */
const TDS_SECTIONS = [
  '194A', '194C', '194H', '194I', '194J', '194Q'
] as const;

/**
 * TDS Deduction Input Schema
 */
export const TdsDeductionInputSchema = z.object({
  section: z.enum(TDS_SECTIONS, {
    errorMap: () => ({ message: 'Invalid TDS section' }),
  }),
  panOfDeductee: z.string().regex(PAN_PATTERN, 'Invalid PAN format').optional(),
  nameOfDeductee: z.string().min(1, 'Name is required'),
  paymentAmount: z.number().min(1, 'Payment amount must be positive'),
  dateOfPayment: z.string().datetime(),
  natureOfPayment: z.string().min(1, 'Nature of payment is required'),
});

/**
 * TDS Calculation Input Schema
 */
export const TdsCalculationInputSchema = z.object({
  section: z.enum(TDS_SECTIONS),
  paymentAmount: z.number().min(1),
  panAvailable: z.boolean().default(true),
  isIndividualOrHuf: z.boolean().optional(),
});

/**
 * Tenant TDS Request Schema
 */
export const TenantTdsRequestSchema = z.object({
  tenantId: z.string().min(1),
  financialYear: z.string().regex(/^\d{4}-\d{4}$/),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  deductions: z.array(TdsDeductionInputSchema).min(1),
});

/**
 * TDS Record creation schema
 */
export const TdsRecordCreateSchema = z.object({
  tenantId: z.string().min(1),
  financialYear: z.string().regex(/^\d{4}-\d{4}$/),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  deductions: z.array(TdsDeductionInputSchema).min(1),
});

// ============ Payroll Schemas ============

/**
 * Payroll Employee Input Schema
 */
export const PayrollEmployeeInputSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  employeePan: z.string().regex(PAN_PATTERN, 'Invalid PAN format'),
  basicSalary: z.number().min(0, 'Basic salary cannot be negative'),
  hra: z.number().min(0).default(0),
  allowances: z.number().min(0).default(0),
  epf: z.number().min(0).optional(),
  esic: z.boolean().default(false),
  professionalTax: z.number().min(0).optional(),
});

/**
 * Payroll Compliance Request Schema
 */
export const PayrollComplianceRequestSchema = z.object({
  tenantId: z.string().min(1),
  financialYear: z.string().regex(/^\d{4}-\d{4}$/),
  employees: z.array(PayrollEmployeeInputSchema).min(1, 'At least one employee is required'),
});

/**
 * Salary TDS Input Schema
 */
export const SalaryTdsInputSchema = z.object({
  grossSalary: z.number().min(0),
  hra: z.number().min(0).optional(),
  standardDeduction: z.number().min(0).optional(),
  section80C: z.number().min(0).optional(),
  section80D: z.number().min(0).optional(),
  nps: z.number().min(0).optional(),
});

// ============ Filing Reminder Schemas ============

/**
 * Filing Reminder Query Schema
 */
export const FilingReminderQuerySchema = z.object({
  tenantId: z.string().min(1),
  daysAhead: z.coerce.number().min(1).max(365).default(30),
});

// ============ Validation Helper ============

export type GstCalculationInput = z.infer<typeof GstCalculationInputSchema>;
export type GstBulkCalculateInput = z.infer<typeof GstBulkCalculateSchema>;
export type TdsCalculationInput = z.infer<typeof TdsCalculationInputSchema>;
export type TenantTdsInput = z.infer<typeof TenantTdsRequestSchema>;
export type PayrollInput = z.infer<typeof PayrollComplianceRequestSchema>;
export type SalaryInput = z.infer<typeof SalaryTdsInputSchema>;
export type FilingReminderInput = z.infer<typeof FilingReminderQuerySchema>;

/**
 * Validate and parse request body with Zod
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map(
    (err) => `${err.path.join('.')}: ${err.message}`
  );

  return { success: false, errors };
}

/**
 * Express middleware for body validation
 */
export function validate<T>(schema: z.ZodSchema<T>) {
  return (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction): void => {
    const result = validateBody(schema, req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: result.errors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

export default {
  GstInvoiceInputSchema,
  GstCalculationInputSchema,
  GstRecordCreateSchema,
  GstBulkCalculateSchema,
  TdsDeductionInputSchema,
  TdsCalculationInputSchema,
  TenantTdsRequestSchema,
  TdsRecordCreateSchema,
  PayrollEmployeeInputSchema,
  PayrollComplianceRequestSchema,
  SalaryTdsInputSchema,
  FilingReminderQuerySchema,
  validateBody,
  validate,
};