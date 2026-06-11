/**
 * GLAMAI - Type Definitions
 * Salon AI Operating System
 *
 * All TypeScript types and interfaces for the service.
 */

// ============================================
// CORE TYPES
// ============================================

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type ServiceCategory = 'Hair' | 'Skin' | 'Nails' | 'Spa' | 'Massage' | 'Makeup' | 'Other';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'netbanking';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type CampaignType = 'birthday' | 'loyalty' | 'promotion' | 'winback' | 'seasonal' | 'referral';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  version: string;
  port: number;
  environment: string;
  uptime: number;
  mongo: 'connected' | 'disconnected';
  aiEmployees: Record<string, { status: string; description: string }>;
  stats: {
    appointmentsToday: number;
    services: number;
    stylists: number;
    customers: number;
  };
  timestamp: string;
}

// ============================================
// CUSTOMER TYPES
// ============================================

export interface ICustomer {
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: Date;
  preferences: string[];
  loyaltyTier: LoyaltyTier;
  totalSpent: number;
  visits: number;
  lastVisit?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerCreateInput {
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  preferences?: string[];
  loyaltyTier?: LoyaltyTier;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyTier: LoyaltyTier;
  totalSpent: number;
  visits: number;
  lastVisit?: Date;
  preferences: string[];
}

// ============================================
// SERVICE TYPES
// ============================================

export interface IService {
  _id?: string;
  name: string;
  category: ServiceCategory;
  price: number;
  duration: number;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceCreateInput {
  name: string;
  category: ServiceCategory;
  price: number;
  duration: number;
  description?: string;
}

export interface ServiceWithScore extends IService {
  aiScore: number;
  aiReason: string;
  discount?: number;
}

// ============================================
// STYLIST TYPES
// ============================================

export interface IStylist {
  _id?: string;
  name: string;
  phone?: string;
  email?: string;
  specialties: string[];
  rating: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StylistCreateInput {
  name: string;
  phone?: string;
  email?: string;
  specialties: string[];
  rating?: number;
}

// ============================================
// APPOINTMENT TYPES
// ============================================

export interface IAppointment {
  _id?: string;
  customerId: string;
  serviceId: string;
  stylistId?: string;
  date: Date;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentCreateInput {
  customerId: string;
  serviceId: string;
  stylistId?: string;
  date: string;
  time: string;
  status?: AppointmentStatus;
  notes?: string;
}

export interface AppointmentResponse {
  appointmentId: string;
  serviceName: string;
  stylistName: string;
  dateTime: string;
  duration: number;
  price: number;
  prepInstructions: string;
  reminderMessage: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface IPayment {
  _id?: string;
  appointmentId?: string;
  customerId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CAMPAIGN TYPES
// ============================================

export interface ICampaign {
  _id?: string;
  type: CampaignType;
  subject: string;
  message: string;
  discount: number;
  validFrom: Date;
  validUntil: Date;
  targetSegment: string;
  status: CampaignStatus;
  sentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignCreateInput {
  type: CampaignType;
  targetSegment?: string;
  discount?: number;
  customMessage?: string;
  duration?: number;
}

export interface CampaignResponse {
  id: string;
  type: string;
  subject: string;
  discount: number;
  targetSegment: string;
  validUntil: Date;
  estimatedReach: number;
}

// ============================================
// AI EMPLOYEE TYPES
// ============================================

export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  status: 'operational' | 'maintenance' | 'offline';
  capabilities: string[];
}

export interface AIStatusResponse {
  success: boolean;
  active: boolean;
  aiEmployees: number;
  employees: AIEmployee[];
  timestamp: string;
}

// ============================================
// BEAUTY ADVISOR TYPES
// ============================================

export interface BeautyAdvisorRequest {
  customerId?: string;
  budget?: number;
  occasion?: string;
  preferences?: string[];
  serviceCategory?: ServiceCategory;
}

export interface BeautyAdvisorResponse {
  success: boolean;
  recommendations: ServiceWithScore[];
  aiMessage: string;
  customerProfile: {
    name: string;
    loyaltyTier: LoyaltyTier;
    totalSpent: number;
    visits: number;
    preferences: string[];
  } | null;
  timestamp: string;
}

// ============================================
// RETENTION TYPES
// ============================================

export interface RetentionAnalysis {
  riskLevel: RiskLevel;
  riskScore: number;
  daysSinceVisit: number;
  engagementScore: number;
  churnProbability: number;
}

export interface RetentionRecommendation {
  action: string;
  priority: Priority;
  expectedImpact: 'low' | 'medium' | 'high';
  aiMessage: string;
}

export interface RetentionResponse {
  success: boolean;
  customer: CustomerProfile;
  analysis: RetentionAnalysis;
  recommendations: RetentionRecommendation[];
  timestamp: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface DashboardOverview {
  totalCustomers: number;
  totalServices: number;
  totalStylists: number;
  monthlyAppointments: number;
  monthlyRevenue: number;
}

export interface TodayStats {
  appointments: number;
  scheduled: number;
  completed: number;
  estimatedRevenue: number;
}

export interface GrowthStats {
  appointmentsChange: number;
  appointmentsChangePercent: number;
}

export interface CustomerSegments {
  active: number;
  inactive: number;
}

export interface LoyaltyTiers {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}

export interface DashboardResponse {
  success: boolean;
  dashboard: {
    overview: DashboardOverview;
    today: TodayStats;
    growth: GrowthStats;
    topServices: Array<{ serviceId: string; bookings: number }>;
    customerSegments: CustomerSegments;
    loyaltyTiers: LoyaltyTiers;
  };
  timestamp: string;
}

// ============================================
// VALIDATION SCHEMAS (Zod)
// ============================================

import { z } from 'zod';

export const CustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(20),
  email: z.string().email().optional(),
  birthday: z.string().datetime().optional(),
  preferences: z.array(z.string()).optional(),
  loyaltyTier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional(),
});

export const AppointmentSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  serviceId: z.string().min(1, 'Service ID is required'),
  stylistId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).optional(),
  notes: z.string().optional(),
});

export const ServiceSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['Hair', 'Skin', 'Nails', 'Spa', 'Massage', 'Makeup', 'Other']),
  price: z.number().positive(),
  duration: z.number().int().positive(),
  description: z.string().optional(),
});

export const StylistSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  specialties: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
});

export const CampaignSchema = z.object({
  type: z.enum(['birthday', 'loyalty', 'promotion', 'winback', 'seasonal', 'referral']),
  targetSegment: z.string().optional(),
  discount: z.number().min(0).max(100).optional(),
  customMessage: z.string().optional(),
  duration: z.number().optional(),
});

// ============================================
// ERROR TYPES
// ============================================

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  STYLIST_NOT_FOUND: 'STYLIST_NOT_FOUND',
  APPOINTMENT_NOT_FOUND: 'APPOINTMENT_NOT_FOUND',
  SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
  DUPLICATE_PHONE: 'DUPLICATE_PHONE',
  DUPLICATE_SERVICE: 'DUPLICATE_SERVICE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  AUTH_RATE_LIMIT_EXCEEDED: 'AUTH_RATE_LIMIT_EXCEEDED',
  AI_RATE_LIMIT_EXCEEDED: 'AI_RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
} as const;

// ============================================
// HOOK TYPES
// ============================================

export interface WebhookPayload {
  event: string;
  payload: any;
  source: string;
  timestamp?: string;
}

export interface HOJAISyncPayload {
  entityType: string;
  action: string;
  source: string;
  data: any;
  timestamp?: string;
}