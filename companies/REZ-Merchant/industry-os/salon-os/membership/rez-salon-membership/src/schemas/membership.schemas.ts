import { z } from 'zod';
import { MembershipType, MembershipStatus, MembershipTier, RenewalType } from '../models/Membership';

const familyMemberSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  userId: z.string().optional(),
});

export const createMembershipSchema = z.object({
  userId: z.string().min(1),
  packageId: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.nativeEnum(MembershipType),
  tier: z.nativeEnum(MembershipTier).optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  autoRenewal: z.boolean().optional(),
  renewalType: z.nativeEnum(RenewalType).optional(),
  price: z.number().positive(),
  currency: z.string().default('INR'),
  discount: z.number().min(0).max(100).optional(),
  benefits: z.array(z.string()).optional(),
  visitsRemaining: z.number().int().nonnegative().optional(),
  totalVisits: z.number().int().nonnegative().optional(),
  familyMembers: z.array(familyMemberSchema).optional(),
  corporateCode: z.string().optional(),
  corporateDiscount: z.number().min(0).max(100).optional(),
  paymentId: z.string().optional(),
  salonId: z.string().min(1),
  branchId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateMembershipSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  tier: z.nativeEnum(MembershipTier).optional(),
  status: z.nativeEnum(MembershipStatus).optional(),
  autoRenewal: z.boolean().optional(),
  renewalType: z.nativeEnum(RenewalType).optional(),
  discount: z.number().min(0).max(100).optional(),
  benefits: z.array(z.string()).optional(),
  visitsRemaining: z.number().int().nonnegative().optional(),
  familyMembers: z.array(familyMemberSchema).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const membershipQuerySchema = z.object({
  userId: z.string().optional(),
  packageId: z.string().optional(),
  type: z.nativeEnum(MembershipType).optional(),
  tier: z.nativeEnum(MembershipTier).optional(),
  status: z.nativeEnum(MembershipStatus).optional(),
  autoRenewal: z.boolean().optional(),
  corporateCode: z.string().optional(),
  salonId: z.string().optional(),
  branchId: z.string().optional(),
  expiringWithinDays: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const renewMembershipSchema = z.object({
  membershipId: z.string().min(1),
  paymentId: z.string().optional(),
  renewalType: z.nativeEnum(RenewalType).optional(),
});

export const addFamilyMemberSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  userId: z.string().optional(),
});

export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;
export type MembershipQueryInput = z.infer<typeof membershipQuerySchema>;
export type RenewMembershipInput = z.infer<typeof renewMembershipSchema>;
export type AddFamilyMemberInput = z.infer<typeof addFamilyMemberSchema>;
