import { z } from 'zod';

// Promotion Validators
export const createPromotionSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  oldBandId: z.string().min(1, 'Old band ID is required'),
  newBandId: z.string().min(1, 'New band ID is required'),
  currentSalary: z.number().positive('Current salary must be positive'),
  effectiveDate: z.string().datetime({ message: 'Invalid date format' }),
  approvedBy: z.string().min(1, 'Approver ID is required'),
});

export const approvePromotionSchema = z.object({
  promotionId: z.string().min(1, 'Promotion ID is required'),
  approvedBy: z.string().min(1, 'Approver ID is required'),
});

export const rejectPromotionSchema = z.object({
  promotionId: z.string().min(1, 'Promotion ID is required'),
  rejectedBy: z.string().min(1, 'Rejector ID is required'),
  reason: z.string().min(1).max(500, 'Reason too long'),
});

export const processPromotionSchema = z.object({
  promotionId: z.string().min(1, 'Promotion ID is required'),
  processedBy: z.string().min(1, 'Processor ID is required'),
  newSalary: z.number().positive('New salary must be positive'),
});

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
