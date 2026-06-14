import { z } from 'zod';

// Time format: HH:mm
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ShiftTemplate schemas
export const createShiftTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  startTime: z.string()
    .regex(timeRegex, 'Invalid time format. Use HH:mm (24-hour format)'),
  endTime: z.string()
    .regex(timeRegex, 'Invalid time format. Use HH:mm (24-hour format)'),
});

export const updateShiftTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .optional(),
  startTime: z.string()
    .regex(timeRegex, 'Invalid time format. Use HH:mm (24-hour format)')
    .optional(),
  endTime: z.string()
    .regex(timeRegex, 'Invalid time format. Use HH:mm (24-hour format)')
    .optional(),
}).refine(
  (data) => {
    // If both times are provided, start must be before end
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  },
  { message: 'Start time must be before end time' }
);

// Shift schemas
export const createShiftSchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  templateId: z.string()
    .min(1, 'Template ID is required'),
  employees: z.array(z.string())
    .min(1, 'At least one employee is required'),
  status: z.enum(['draft', 'published', 'in_progress', 'completed', 'cancelled'])
    .default('draft'),
  notes: z.string().max(500).optional(),
});

export const updateShiftSchema = z.object({
  templateId: z.string().optional(),
  employees: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'in_progress', 'completed', 'cancelled']).optional(),
  notes: z.string().max(500).optional(),
});

export const getShiftsByDateSchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
});

// ShiftSwap schemas
export const createSwapRequestSchema = z.object({
  requesterId: z.string()
    .min(1, 'Requester ID is required'),
  targetId: z.string()
    .min(1, 'Target employee ID is required'),
  shiftId: z.string()
    .min(1, 'Shift ID is required'),
  reason: z.string().max(500).optional(),
});

export const approveSwapSchema = z.object({
  swapId: z.string()
    .min(1, 'Swap ID is required'),
  action: z.enum(['approve', 'reject']),
  approvedBy: z.string()
    .min(1, 'Approver ID is required'),
});

// ShiftRequest schemas
export const createShiftRequestSchema = z.object({
  employeeId: z.string()
    .min(1, 'Employee ID is required'),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  type: z.enum(['time_off', 'swap', 'coverage', 'modify']),
  reason: z.string().max(500).optional(),
});

export const reviewShiftRequestSchema = z.object({
  requestId: z.string()
    .min(1, 'Request ID is required'),
  action: z.enum(['approve', 'reject']),
  reviewedBy: z.string()
    .min(1, 'Reviewer ID is required'),
});

// ShiftCoverage schemas
export const createCoverageSchema = z.object({
  shiftId: z.string()
    .min(1, 'Shift ID is required'),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  required: z.number()
    .int('Must be an integer')
    .min(1, 'At least 1 employee required'),
  assigned: z.number()
    .int('Must be an integer')
    .min(0, 'Cannot be negative')
    .default(0),
});

export const updateCoverageSchema = z.object({
  required: z.number()
    .int('Must be an integer')
    .min(1, 'At least 1 employee required')
    .optional(),
  assigned: z.number()
    .int('Must be an integer')
    .min(0, 'Cannot be negative')
    .optional(),
});

// Get coverage by date schema
export const getCoverageByDateSchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
});

// Bulk create shifts schema
export const bulkCreateShiftsSchema = z.object({
  dateRange: z.object({
    startDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
    endDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  }),
  templates: z.array(z.object({
    templateId: z.string().min(1, 'Template ID is required'),
    employees: z.array(z.string()).optional(),
  })),
  status: z.enum(['draft', 'published']).default('draft'),
});

// Type exports
export type CreateShiftTemplateInput = z.infer<typeof createShiftTemplateSchema>;
export type UpdateShiftTemplateInput = z.infer<typeof updateShiftTemplateSchema>;
export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
export type CreateSwapRequestInput = z.infer<typeof createSwapRequestSchema>;
export type ApproveSwapInput = z.infer<typeof approveSwapSchema>;
export type CreateShiftRequestInput = z.infer<typeof createShiftRequestSchema>;
export type ReviewShiftRequestInput = z.infer<typeof reviewShiftRequestSchema>;
export type CreateCoverageInput = z.infer<typeof createCoverageSchema>;
export type UpdateCoverageInput = z.infer<typeof updateCoverageSchema>;
export type BulkCreateShiftsInput = z.infer<typeof bulkCreateShiftsSchema>;
