import { z } from 'zod';

// Onboarding Step Schema
export const OnboardingStepSchema = z.object({
  stepId: z.string().min(1, 'Step ID is required'),
  name: z.string().min(1, 'Step name is required').max(100),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0),
  tasks: z.array(z.string()).optional(),
  estimatedDuration: z.number().int().min(1).default(1)
});

// Template Task Schema
export const TemplateTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(1000).optional(),
  assigneeType: z.enum(['employee', 'manager', 'hr', 'it', 'finance']),
  category: z.enum(['documentation', 'training', 'equipment', 'introduction', 'compliance', 'other']).default('other'),
  estimatedDuration: z.number().int().min(1).default(1),
  isRequired: z.boolean().default(true),
  order: z.number().int().min(0)
});

// Create Template Schema
export const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  description: z.string().max(500).optional(),
  department: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  steps: z.array(OnboardingStepSchema).optional(),
  tasks: z.array(TemplateTaskSchema).optional(),
  defaultDuration: z.number().int().min(1).max(365).default(30)
});

// Update Template Schema
export const UpdateTemplateSchema = CreateTemplateSchema.partial();

// Start Onboarding Schema
export const StartOnboardingSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  employeeName: z.string().min(1, 'Employee name is required').max(200),
  employeeEmail: z.string().email('Valid email is required'),
  templateId: z.string().min(1, 'Template ID is required'),
  startDate: z.string().datetime().or(z.date()).optional(),
  managerId: z.string().optional(),
  hrId: z.string().optional(),
  department: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  customizations: z.record(z.unknown()).optional()
});

// Complete Task Schema
export const CompleteTaskSchema = z.object({
  status: z.enum(['completed', 'in_progress', 'skipped', 'pending']).optional(),
  notes: z.string().max(1000).optional()
});

// Add Note Schema
export const AddNoteSchema = z.object({
  note: z.string().min(1, 'Note content is required').max(1000)
});

// Query Schemas
export const ListTemplatesQuerySchema = z.object({
  department: z.string().optional(),
  role: z.string().optional(),
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const ListOnboardingQuerySchema = z.object({
  employeeId: z.string().optional(),
  templateId: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'completed', 'cancelled']).optional(),
  department: z.string().optional(),
  managerId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Type exports
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
export type StartOnboardingInput = z.infer<typeof StartOnboardingSchema>;
export type CompleteTaskInput = z.infer<typeof CompleteTaskSchema>;
export type AddNoteInput = z.infer<typeof AddNoteSchema>;
export type ListTemplatesQuery = z.infer<typeof ListTemplatesQuerySchema>;
export type ListOnboardingQuery = z.infer<typeof ListOnboardingQuerySchema>;
