import { z } from 'zod';

// Compensation Package Validators
export const equitySchema = z.object({
  shares: z.number().min(0).default(0),
  vestingPeriodMonths: z.number().min(0).default(48),
  strikePrice: z.number().min(0).default(0),
});

export const benefitsSchema = z.object({
  healthInsurance: z.number().min(0).default(0),
  retirement: z.number().min(0).default(0),
  allowances: z.record(z.string(), z.number()).optional(),
  otherBenefits: z.record(z.string(), z.number()).optional(),
});

export const createCompensationSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  bandId: z.string().min(1, 'Band ID is required'),
  salary: z.number().positive('Salary must be positive'),
  equity: equitySchema.optional(),
  benefits: benefitsSchema.optional(),
  effectiveDate: z.string().datetime().optional(),
});

export const updateCompensationSchema = z.object({
  salary: z.number().positive().optional(),
  equity: equitySchema.optional(),
  benefits: benefitsSchema.optional(),
  effectiveDate: z.string().datetime().optional(),
});

export type CreateCompensationInput = z.infer<typeof createCompensationSchema>;
export type UpdateCompensationInput = z.infer<typeof updateCompensationSchema>;
