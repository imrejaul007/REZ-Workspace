import { z } from 'zod';

export const WorkflowActionSchema = z.enum(['approve', 'reject', 'notify', 'complete']);
export const WorkflowStatusSchema = z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']);
export const InstanceStatusSchema = z.enum(['pending', 'in_progress', 'approved', 'rejected', 'cancelled']);
export const ConditionOperatorSchema = z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'contains', 'in']);

export const ConditionSchema = z.object({
  field: z.string().min(1),
  operator: ConditionOperatorSchema,
  value: z.unknown()
});

export const WorkflowStepInputSchema = z.object({
  name: z.string().min(1).max(200),
  approverId: z.string().optional(),
  approverName: z.string().max(200).optional(),
  approverEmail: z.string().email().optional(),
  action: WorkflowActionSchema,
  actionLabel: z.string().max(100).optional(),
  instructions: z.string().max(1000).optional(),
  timeout: z.number().int().positive().optional(),
  timeoutAction: z.enum(['auto_approve', 'auto_reject', 'escalate', 'notify']).optional(),
  condition: z.object({
    field: z.string(),
    operator: ConditionOperatorSchema,
    value: z.unknown()
  }).optional()
});

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(100),
  type: z.string().min(1).max(100),
  ownerId: z.string().min(1),
  ownerName: z.string().max(200).optional(),
  departmentId: z.string().optional(),
  status: WorkflowStatusSchema.default('draft'),
  steps: z.array(WorkflowStepInputSchema).min(1).max(20),
  conditions: z.array(ConditionSchema).max(10).optional(),
  variables: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(100).optional(),
  type: z.string().min(1).max(100).optional(),
  status: WorkflowStatusSchema.optional(),
  steps: z.array(WorkflowStepInputSchema).min(1).max(20).optional(),
  conditions: z.array(ConditionSchema).max(10).optional(),
  variables: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const InitiateWorkflowSchema = z.object({
  workflowId: z.string().min(1),
  initiatorId: z.string().min(1),
  initiatorName: z.string().max(200).optional(),
  data: z.record(z.unknown()).default({}),
  dueDate: z.string().datetime().or(z.date()).optional()
});

export const ApproveStepSchema = z.object({
  stepIndex: z.number().int().min(0).optional(),
  comments: z.string().max(2000).optional(),
  action: WorkflowActionSchema.optional()
});

export const RejectWorkflowSchema = z.object({
  stepIndex: z.number().int().min(0).optional(),
  reason: z.string().min(1).max(2000)
});

export const CancelWorkflowSchema = z.object({
  reason: z.string().min(1).max(2000)
});

export const WorkflowQuerySchema = z.object({
  ownerId: z.string().optional(),
  departmentId: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  status: WorkflowStatusSchema.optional(),
  page: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).default(1),
  limit: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).default(20)
});

export const InstanceQuerySchema = z.object({
  workflowId: z.string().optional(),
  initiatorId: z.string().optional(),
  status: InstanceStatusSchema.optional(),
  page: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).default(1),
  limit: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).default(20)
});

export const PendingApprovalsQuerySchema = z.object({
  userId: z.string().min(1),
  status: InstanceStatusSchema.optional(),
  page: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).default(1),
  limit: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).default(20)
});

export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowSchema>;
export type InitiateWorkflowInput = z.infer<typeof InitiateWorkflowSchema>;
export type ApproveStepInput = z.infer<typeof ApproveStepSchema>;
export type RejectWorkflowInput = z.infer<typeof RejectWorkflowSchema>;
export type CancelWorkflowInput = z.infer<typeof CancelWorkflowSchema>;
export type WorkflowQueryInput = z.infer<typeof WorkflowQuerySchema>;
export type InstanceQueryInput = z.infer<typeof InstanceQuerySchema>;
export type PendingApprovalsQueryInput = z.infer<typeof PendingApprovalsQuerySchema>;
