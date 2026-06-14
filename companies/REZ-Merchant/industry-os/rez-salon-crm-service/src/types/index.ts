import { z } from 'zod';

// Customer Segment Enum
export const CustomerSegmentEnum = z.enum([
  'new',
  'regular',
  'vip',
  'at_risk',
  'churned',
  'inactive'
]);
export type CustomerSegment = z.infer<typeof CustomerSegmentEnum>;

// Customer Schema
export const CustomerSchema = z.object({
  customerId: z.string(),
  salonId: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional(),
  preferences: z.object({
    preferredStylistId: z.string().optional(),
    preferredServices: z.array(z.string()).default([]),
    preferredDays: z.array(z.string()).default([]),
    preferredTimes: z.array(z.string()).default([]),
    notes: z.string().optional(),
  }).optional(),
  segment: CustomerSegmentEnum.default('new'),
  totalVisits: z.number().default(0),
  totalSpent: z.number().default(0),
  lastVisitDate: z.string().optional(),
  averageOrderValue: z.number().default(0),
  membershipId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ICustomer = z.infer<typeof CustomerSchema>;

// Visit Schema
export const VisitSchema = z.object({
  visitId: z.string(),
  customerId: z.string(),
  salonId: z.string(),
  appointmentId: z.string().optional(),
  stylistId: z.string().optional(),
  services: z.array(z.object({
    serviceId: z.string(),
    name: z.string(),
    price: z.number(),
  })).default([]),
  products: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number().default(1),
  })).default([]),
  totalAmount: z.number().default(0),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'wallet', 'mixed']).optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  visitDate: z.string(),
  createdAt: z.string().optional(),
});

export type IVisit = z.infer<typeof VisitSchema>;

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
