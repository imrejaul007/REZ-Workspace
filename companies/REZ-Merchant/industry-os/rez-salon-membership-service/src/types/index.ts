import { z } from 'zod';

// Membership Tier Enum
export const MembershipTierEnum = z.enum(['basic', 'silver', 'gold', 'platinum', 'vip']);
export type MembershipTier = z.infer<typeof MembershipTierEnum>;

// Membership Status Enum
export const MembershipStatusEnum = z.enum(['active', 'expired', 'cancelled', 'suspended', 'pending']);
export type MembershipStatus = z.infer<typeof MembershipStatusEnum>;

// Membership Plan Schema
export const MembershipPlanSchema = z.object({
  planId: z.string(),
  salonId: z.string(),
  name: z.string().min(1).max(100),
  tier: MembershipTierEnum,
  description: z.string().optional(),
  durationMonths: z.number().min(1).max(24),
  price: z.number().min(0),
  currency: z.string().default('INR'),
  discountPercent: z.number().min(0).max(100),
  pointsMultiplier: z.number().min(1).default(1),
  benefits: z.array(z.string()).default([]),
  maxVisitsPerMonth: z.number().optional(),
  freeServices: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export type IMembershipPlan = z.infer<typeof MembershipPlanSchema>;

// Membership Schema
export const MembershipSchema = z.object({
  membershipId: z.string(),
  customerId: z.string(),
  salonId: z.string(),
  planId: z.string(),
  tier: MembershipTierEnum,
  status: MembershipStatusEnum.default('active'),
  startDate: z.string(),
  endDate: z.string(),
  autoRenew: z.boolean().default(false),
  currentPoints: z.number().default(0),
  lifetimePoints: z.number().default(0),
  totalSpent: z.number().default(0),
  visitCount: z.number().default(0),
  lastVisitDate: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type IMembership = z.infer<typeof MembershipSchema>;

// Point Transaction Schema
export const PointTransactionSchema = z.object({
  transactionId: z.string(),
  membershipId: z.string(),
  customerId: z.string(),
  type: z.enum(['earn', 'redeem', 'expire', 'adjust']),
  points: z.number(),
  balance: z.number(),
  description: z.string(),
  reference: z.string().optional(),
  expiresAt: z.string().optional(),
  createdAt: z.string().optional(),
});

export type IPointTransaction = z.infer<typeof PointTransactionSchema>;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
