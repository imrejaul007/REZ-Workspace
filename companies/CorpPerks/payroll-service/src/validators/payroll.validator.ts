import { z } from 'zod';

// ============================================
// PAYROLL RUN VALIDATORS
// ============================================

export const runPayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2099),
  employeeIds: z.array(z.string()).optional(),
  includeReimbursements: z.boolean().default(true),
});

export const payrollRunQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2099).optional(),
  status: z.enum(['draft', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// SALARY COMPONENT VALIDATORS
// ============================================

export const allowancesInputSchema = z.object({
  medical: z.number().min(0).optional(),
  transport: z.number().min(0).optional(),
  communication: z.number().min(0).optional(),
  education: z.number().min(0).optional(),
  food: z.number().min(0).optional(),
  other: z.number().min(0).optional(),
});

export const deductionsInputSchema = z.object({
  incomeTax: z.number().min(0).optional(),
  pf: z.number().min(0).optional(),
  esic: z.number().min(0).optional(),
  professionalTax: z.number().min(0).optional(),
  tds: z.number().min(0).optional(),
  other: z.number().min(0).optional(),
});

export const createSalaryComponentSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2099),
  basic: z.number().min(0, 'Basic salary must be positive'),
  hra: z.number().min(0, 'HRA must be positive'),
  allowances: allowancesInputSchema.optional().default({}),
  deductions: deductionsInputSchema.optional().default({}),
});

export const updateSalaryComponentSchema = createSalaryComponentSchema.partial();

// ============================================
// TAX DECLARATION VALIDATORS
// ============================================

export const declarationItemSchema = z.object({
  section: z.string().min(1, 'Section code is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  proof: z.string().optional(),
});

export const submitTaxDeclarationSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  fiscalYear: z.string().regex(/^\d{4}-\d{2}$/, 'Fiscal year must be in format YYYY-YY'),
  declarations: z.array(declarationItemSchema).min(1, 'At least one declaration is required'),
  basicSalary: z.number().min(0).optional(),
  totalAllowances: z.number().min(0).optional(),
});

export const verifyDeclarationSchema = z.object({
  section: z.string().min(1, 'Section code is required'),
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
});

// ============================================
// REIMBURSEMENT VALIDATORS
// ============================================

export const createReimbursementSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  type: z.enum(['travel', 'medical', 'meal', 'phone', 'internet', 'equipment', 'training', 'other']),
  amount: z.number().min(0, 'Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(500),
  expenseDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  receipt: z.string().optional(),
  category: z.string().optional(),
  projectCode: z.string().optional(),
});

export const updateReimbursementSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'paid']),
  rejectionReason: z.string().optional(),
  receipt: z.string().optional(),
});

export const reimbursementQuerySchema = z.object({
  employeeId: z.string().optional(),
  type: z.enum(['travel', 'medical', 'meal', 'phone', 'internet', 'equipment', 'training', 'other']).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'paid']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// SALARY ADVANCE VALIDATORS
// ============================================

export const salaryAdvanceSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  amount: z.number().min(1, 'Amount must be at least 1'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  expectedDeductionMonth: z.number().int().min(1).max(12),
  expectedDeductionYear: z.number().int().min(2020).max(2099),
});

export const approveAdvanceSchema = z.object({
  approvedAmount: z.number().min(0),
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
});

// ============================================
// PAYSLIP VALIDATORS
// ============================================

export const payslipQuerySchema = z.object({
  employeeId: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2099).optional(),
  status: z.enum(['generated', 'approved', 'paid', 'on_hold']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type RunPayrollInput = z.infer<typeof runPayrollSchema>;
export type PayrollRunQueryInput = z.infer<typeof payrollRunQuerySchema>;
export type CreateSalaryComponentInput = z.infer<typeof createSalaryComponentSchema>;
export type UpdateSalaryComponentInput = z.infer<typeof updateSalaryComponentSchema>;
export type SubmitTaxDeclarationInput = z.infer<typeof submitTaxDeclarationSchema>;
export type VerifyDeclarationInput = z.infer<typeof verifyDeclarationSchema>;
export type CreateReimbursementInput = z.infer<typeof createReimbursementSchema>;
export type UpdateReimbursementInput = z.infer<typeof updateReimbursementSchema>;
export type ReimbursementQueryInput = z.infer<typeof reimbursementQuerySchema>;
export type SalaryAdvanceInput = z.infer<typeof salaryAdvanceSchema>;
export type ApproveAdvanceInput = z.infer<typeof approveAdvanceSchema>;
export type PayslipQueryInput = z.infer<typeof payslipQuerySchema>;
