// Shared types for Salon Mind Service

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface Service {
  serviceId: string;
  name: string;
  basePrice: number;
  duration: number; // minutes
  category: string;
  active: boolean;
}

export interface Stylist {
  stylistId: string;
  name: string;
  level: 'junior' | 'senior' | 'master';
  specialties: string[];
  active: boolean;
}

export interface Appointment {
  appointmentId: string;
  customerId: string;
  stylistId: string;
  serviceId: string;
  date: string;
  duration: number;
  price: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
}
