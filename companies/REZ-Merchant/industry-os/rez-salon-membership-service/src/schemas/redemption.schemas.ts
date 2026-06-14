import { z } from 'zod';
import { RedemptionType, RedemptionStatus } from '../models/Redemption';

export const createRedemptionSchema = z.object({
  membershipId: z.string().optional(),
  packageId: z.string().min(1),
  userId: z.string().min(1),
  salonId: z.string().min(1),
  branchId: z.string().optional(),
  type: z.nativeEnum(RedemptionType),
  services: z.array(z.string()).min(1),
  totalValue: z.number().positive(),
  discount: z.number().min(0).optional(),
  amountPaid: z.number().min(0),
  prepaidDeduction: z.number().min(0).optional(),
  remainingBalance: z.number().min(0).optional(),
  appointmentId: z.string().optional(),
  stylistId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateRedemptionSchema = z.object({
  status: z.nativeEnum(RedemptionStatus).optional(),
  stylistId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  cancellationReason: z.string().optional(),
});

export const redemptionQuerySchema = z.object({
  membershipId: z.string().optional(),
  packageId: z.string().optional(),
  userId: z.string().optional(),
  salonId: z.string().optional(),
  branchId: z.string().optional(),
  type: z.nativeEnum(RedemptionType).optional(),
  status: z.nativeEnum(RedemptionStatus).optional(),
  appointmentId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateRedemptionInput = z.infer<typeof createRedemptionSchema>;
export type UpdateRedemptionInput = z.infer<typeof updateRedemptionSchema>;
export type RedemptionQueryInput = z.infer<typeof redemptionQuerySchema>;
