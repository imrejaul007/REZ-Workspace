import { z } from 'zod';

export const createPoolSchema = z.object({
  name: z.string().min(1).max(200),
  organizationId: z.string().min(1),
  totalBudget: z.number().positive(),
  currency: z.string().optional().default('INR'),
  description: z.string().max(1000).optional(),
  settings: z.object({
    minBalance: z.number().min(0).optional(),
    autoReplenish: z.boolean().optional(),
    replenishThreshold: z.number().min(0).optional(),
    maxAllocationPercent: z.number().min(1).max(100).optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updatePoolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  settings: z.object({
    minBalance: z.number().min(0).optional(),
    autoReplenish: z.boolean().optional(),
    replenishThreshold: z.number().min(0).optional(),
    maxAllocationPercent: z.number().min(1).max(100).optional(),
  }).optional(),
  status: z.enum(['active', 'inactive', 'frozen']).optional(),
});

export const createAllocationSchema = z.object({
  campaignId: z.string().min(1),
  campaignName: z.string().max(200).optional(),
  amount: z.number().positive(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  priority: z.number().min(1).max(10).optional(),
  settings: z.object({
    dailyLimit: z.number().positive().optional(),
    pacingStrategy: z.enum(['even', 'frontload', 'backload']).optional(),
    autoPauseThreshold: z.number().min(0).max(100).optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateAllocationSchema = z.object({
  amount: z.number().positive().optional(),
  endDate: z.string().datetime().optional(),
  priority: z.number().min(1).max(10).optional(),
  status: z.enum(['pending', 'active', 'paused', 'exhausted', 'cancelled']).optional(),
  settings: z.object({
    dailyLimit: z.number().positive().optional(),
    pacingStrategy: z.enum(['even', 'frontload', 'backload']).optional(),
    autoPauseThreshold: z.number().min(0).max(100).optional(),
  }).optional(),
});

export const contributeSchema = z.object({
  source: z.string().min(1),
  sourceType: z.enum(['organization', 'campaign', 'manual', 'refund', 'transfer']),
  amount: z.number().positive(),
  currency: z.string().optional().default('INR'),
  reference: z.string().optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const spendSchema = z.object({
  campaignId: z.string().min(1),
  amount: z.number().positive(),
  reference: z.string().min(1),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const transferSchema = z.object({
  toPoolId: z.string().min(1),
  amount: z.number().positive(),
  reference: z.string().optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const transactionQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum(['allocation', 'contribution', 'spend', 'refund', 'transfer_in', 'transfer_out', 'adjustment', 'reversal']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  skip: z.coerce.number().min(0).optional().default(0),
});

export const poolQuerySchema = z.object({
  organizationId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'frozen']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  skip: z.coerce.number().min(0).optional().default(0),
});

export const allocationQuerySchema = z.object({
  campaignId: z.string().optional(),
  status: z.enum(['pending', 'active', 'paused', 'exhausted', 'cancelled']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  skip: z.coerce.number().min(0).optional().default(0),
});

export type CreatePoolInput = z.infer<typeof createPoolSchema>;
export type UpdatePoolInput = z.infer<typeof updatePoolSchema>;
export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
export type UpdateAllocationInput = z.infer<typeof updateAllocationSchema>;
export type ContributeInput = z.infer<typeof contributeSchema>;
export type SpendInput = z.infer<typeof spendSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
export type PoolQueryInput = z.infer<typeof poolQuerySchema>;
export type AllocationQueryInput = z.infer<typeof allocationQuerySchema>;