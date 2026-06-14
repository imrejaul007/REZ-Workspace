import { z } from 'zod';

// Service Categories
export const ServiceCategoryEnum = z.enum([
  'hair',
  'color',
  'beauty',
  'nails',
  'spa',
  'other'
]);
export type ServiceCategory = z.infer<typeof ServiceCategoryEnum>;

// Service Status
export const ServiceStatusEnum = z.enum(['active', 'inactive', 'discontinued']);
export type ServiceStatus = z.infer<typeof ServiceStatusEnum>;

// Stylist Specialization
export const StylistSpecializationEnum = z.enum([
  'haircut',
  'coloring',
  'styling',
  'makeup',
  'nails',
  'skincare',
  'massage'
]);
export type StylistSpecialization = z.infer<typeof StylistSpecializationEnum>;

// Stylist Level
export const StylistLevelEnum = z.enum(['junior', 'senior', 'master']);
export type StylistLevel = z.infer<typeof StylistLevelEnum>;

// Service Schema
export const ServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: ServiceCategoryEnum,
  subcategory: z.string().max(50).optional(),
  price: z.number().min(0),
  currency: z.string().default('INR'),
  duration: z.number().min(5).max(480), // minutes
  depositRequired: z.boolean().default(false),
  depositAmount: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
  requiresAppointment: z.boolean().default(true),
  allowsWalkin: z.boolean().default(true),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional()
});

export type IService = z.infer<typeof ServiceSchema>;

// Service Document Interface
export interface IServiceDocument extends Omit<IService, 'price' | 'duration' | 'depositRequired' | 'depositAmount' | 'isActive' | 'requiresAppointment' | 'allowsWalkin'> {
  _id: string;
  price: number;
  currency: string;
  duration: number;
  depositRequired: boolean;
  depositAmount: number;
  isActive: boolean;
  requiresAppointment: boolean;
  allowsWalkin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Stylist Schema
export const StylistSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  avatar: z.string().url().optional(),
  specializations: z.array(StylistSpecializationEnum).default([]),
  level: StylistLevelEnum.default('junior'),
  bio: z.string().max(500).optional(),
  experience: z.number().min(0).optional(), // years
  rating: z.number().min(0).max(5).optional(),
  totalReviews: z.number().min(0).default(0),
  serviceIds: z.array(z.string()).default([]),
  workingHours: z.object({
    monday: z.object({ start: z.string(), end: z.string() }).optional(),
    tuesday: z.object({ start: z.string(), end: z.string() }).optional(),
    wednesday: z.object({ start: z.string(), end: z.string() }).optional(),
    thursday: z.object({ start: z.string(), end: z.string() }).optional(),
    friday: z.object({ start: z.string(), end: z.string() }).optional(),
    saturday: z.object({ start: z.string(), end: z.string() }).optional(),
    sunday: z.object({ start: z.string(), end: z.string() }).optional()
  }).optional(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional()
});

export type IStylist = z.infer<typeof StylistSchema>;

// Stylist Document Interface
export interface IStylistDocument extends Omit<IStylist, 'experience' | 'rating' | 'totalReviews'> {
  _id: string;
  experience: number;
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

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

// Query Parameters
export interface ServiceQueryParams {
  category?: ServiceCategory;
  active?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StylistQueryParams {
  specialization?: StylistSpecialization;
  level?: StylistLevel;
  active?: boolean;
  page?: number;
  limit?: number;
}

// Create/Update DTOs
export interface CreateServiceDTO extends z.infer<typeof ServiceSchema> {}
export interface UpdateServiceDTO extends Partial<z.infer<typeof ServiceSchema>> {}

export interface CreateStylistDTO extends z.infer<typeof StylistSchema> {}
export interface UpdateStylistDTO extends Partial<z.infer<typeof StylistSchema>> {}
