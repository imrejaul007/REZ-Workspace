/**
 * Service Catalog Models
 * Defines all data structures for the beauty salon service catalog
 */

// ============================================
// Base Types
// ============================================

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'BRL';

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Service Model
// ============================================

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number; // minutes
  price: number;
  currency: Currency;
  requiresConsultation: boolean;
  prepTime: number; // minutes before service
  cleanupTime: number; // minutes after service
  availableStaff: string[];
  isActive: boolean;
  images: string[];
  tags: string[];
}

export interface ServiceWithTimestamps extends Service, Timestamps {}

// Input types for creating/updating services
export interface CreateServiceInput {
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  currency?: Currency;
  requiresConsultation?: boolean;
  prepTime?: number;
  cleanupTime?: number;
  availableStaff?: string[];
  images?: string[];
  tags?: string[];
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {
  isActive?: boolean;
}

// ============================================
// Category Model
// ============================================

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CreateCategoryInput {
  name: string;
  description: string;
  icon: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput extends Partial<Omit<CreateCategoryInput, 'id'>> {
  isActive?: boolean;
}

// ============================================
// Package Model
// ============================================

export interface Package {
  id: string;
  name: string;
  description: string;
  services: string[]; // service IDs
  originalPrice: number;
  packagePrice: number;
  currency: Currency;
  validityDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackageInput {
  name: string;
  description: string;
  services: string[];
  packagePrice: number;
  currency?: Currency;
  validityDays?: number;
  isActive?: boolean;
}

export interface UpdatePackageInput extends Partial<Omit<CreatePackageInput, 'id'>> {
  isActive?: boolean;
}

// ============================================
// Availability Model
// ============================================

export interface StaffAvailability {
  staffId: string;
  staffName: string;
  availableSlots: TimeSlot[];
}

export interface TimeSlot {
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  available: boolean;
}

export interface ServiceAvailability {
  serviceId: string;
  serviceName: string;
  date: string;
  totalSlots: number;
  availableSlots: number;
  staffAvailability: StaffAvailability[];
}

export interface AvailabilityQuery {
  serviceId: string;
  date: string; // YYYY-MM-DD
  staffId?: string; // optional filter for specific staff
}

// ============================================
// Booking Model (for slot calculations)
// ============================================

export interface Booking {
  id: string;
  serviceId: string;
  staffId: string;
  customerId: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
}

// ============================================
// Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// In-memory storage for demo (would be replaced with database)
// ============================================

export interface InMemoryStore {
  services: Map<string, ServiceWithTimestamps>;
  categories: Map<string, Category>;
  packages: Map<string, Package>;
  bookings: Map<string, Booking>;
}

export const createEmptyStore = (): InMemoryStore => ({
  services: new Map(),
  categories: new Map(),
  packages: new Map(),
  bookings: new Map(),
});
