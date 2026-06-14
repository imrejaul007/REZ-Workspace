import { z } from 'zod';
import { PackageType, PackageCategory, PackageStatus } from '../models/Package';

export const createPackageSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  type: z.nativeEnum(PackageType),
  category: z.nativeEnum(PackageCategory),
  services: z.array(z.string()).min(1),
  duration: z.number().int().positive(),
  price: z.number().positive(),
  currency: z.string().default('INR'),
  originalPrice: z.number().positive().optional(),
  validityDays: z.number().int().positive(),
  maxRedemptions: z.number().int().positive().optional(),
  status: z.nativeEnum(PackageStatus).optional(),
  isPrepaidCard: z.boolean().optional(),
  prepaidCardValue: z.number().positive().optional(),
  familyPlan: z.boolean().optional(),
  maxFamilyMembers: z.number().int().positive().optional(),
  corporateEligible: z.boolean().optional(),
  corporateDiscount: z.number().min(0).max(100).optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updatePackageSchema = createPackageSchema.partial();

export const packageQuerySchema = z.object({
  type: z.nativeEnum(PackageType).optional(),
  category: z.nativeEnum(PackageCategory).optional(),
  status: z.nativeEnum(PackageStatus).optional(),
  familyPlan: z.boolean().optional(),
  corporateEligible: z.boolean().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  tags: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type PackageQueryInput = z.infer<typeof packageQuerySchema>;
