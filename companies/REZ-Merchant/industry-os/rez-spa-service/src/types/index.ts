import { z } from 'zod';

// Enums
export const ServiceCategoryEnum = z.enum([
  'massage',
  'facial',
  'body',
  'nail',
  'hair',
  'wellness',
  'other'
]);
export type ServiceCategory = z.infer<typeof ServiceCategoryEnum>;

export const ServiceStatusEnum = z.enum(['active', 'inactive', 'discontinued']);
export type ServiceStatus = z.infer<typeof ServiceStatusEnum>;

export const TherapistSpecialtyEnum = z.enum([
  'massage',
  'facial',
  'body',
  'nail',
  'hair',
  'makeup',
  'wellness'
]);
export type TherapistSpecialty = z.infer<typeof TherapistSpecialtyEnum>;

export const TherapistStatusEnum = z.enum(['available', 'busy', 'off', 'vacation']);
export type TherapistStatus = z.infer<typeof TherapistStatusEnum>;

// Service Types
export interface SpaService {
  _id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  duration: number; // in minutes
  price: number;
  currency: string;
  images: string[];
  benefits: string[];
  contraindications: string[];
  products: string[]; // product IDs used
  therapists: string[]; // therapist IDs certified
  status: ServiceStatus;
  isPopular: boolean;
  isFeatured: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Therapist {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialties: TherapistSpecialty[];
  certifications: string[];
  yearsOfExperience: number;
  bio: string;
  avatar: string;
  rating: number;
  totalReviews: number;
  status: TherapistStatus;
  workingHours: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
  services: string[]; // service IDs
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response Types
export interface CreateServiceRequest {
  name: string;
  description: string;
  category: ServiceCategory;
  duration: number;
  price: number;
  currency?: string;
  images?: string[];
  benefits?: string[];
  contraindications?: string[];
  products?: string[];
  therapists?: string[];
  isPopular?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {
  status?: ServiceStatus;
}

export interface CreateTherapistRequest {
  name: string;
  email: string;
  phone: string;
  specialties: TherapistSpecialty[];
  certifications?: string[];
  yearsOfExperience?: number;
  bio?: string;
  avatar?: string;
  workingHours?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
}

export interface UpdateTherapistRequest extends Partial<CreateTherapistRequest> {
  status?: TherapistStatus;
  services?: string[];
}

// Zod Schemas for Validation
export const CreateServiceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000),
  category: ServiceCategoryEnum,
  duration: z.number().min(15).max(480),
  price: z.number().min(0),
  currency: z.string().default('INR'),
  images: z.array(z.string().url()).optional(),
  benefits: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  products: z.array(z.string()).optional(),
  therapists: z.array(z.string()).optional(),
  isPopular: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

export const CreateTherapistSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  specialties: z.array(TherapistSpecialtyEnum).min(1),
  certifications: z.array(z.string()).optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  bio: z.string().max(1000).optional(),
  avatar: z.string().url().optional(),
  workingHours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
    isAvailable: z.boolean()
  })).optional()
});

export const UpdateTherapistSchema = CreateTherapistSchema.partial();

// Pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
