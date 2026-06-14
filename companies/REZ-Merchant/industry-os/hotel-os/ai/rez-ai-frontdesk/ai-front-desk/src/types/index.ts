/**
 * Type definitions for AI Front Desk Service
 */

// Guest Types
export interface GuestData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  checkIn: Date;
  checkOut: Date;
  roomNumber: string;
  preferences: string[];
  requests: string[];
  createdAt: Date;
}

export interface GuestInput {
  name: string;
  phone: string;
  email?: string;
  checkIn: Date;
  checkOut: Date;
  roomNumber: string;
  preferences?: string[];
}

// Service Request Types
export type ServiceRequestType = 'room_service' | 'housekeeping' | 'concierge' | 'maintenance' | 'taxi';
export type ServiceRequestStatus = 'pending' | 'in_progress' | 'completed';
export type ServiceRequestPriority = 'low' | 'medium' | 'high';

export interface ServiceRequestData {
  id: string;
  guestId?: string;
  roomNumber: string;
  type: ServiceRequestType;
  description: string;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  createdAt: Date;
  completedAt?: Date;
}

export interface ServiceRequestInput {
  guestId?: string;
  roomNumber?: string;
  type: ServiceRequestType;
  description: string;
  priority?: ServiceRequestPriority;
}

// Booking Types
export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface BookingData {
  id: string;
  guestId?: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: Date;
}

export interface BookingInput {
  guestId?: string;
  roomType?: string;
  checkIn: Date;
  checkOut: Date;
  guests?: number;
  totalAmount?: number;
}

// Conversation Types
export interface ConversationMessage {
  id: string;
  role: 'guest' | 'ai' | 'staff';
  content: string;
  timestamp: Date;
}

export interface ConversationData {
  id: string;
  guestId?: string;
  roomNumber: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard Types
export interface DashboardStats {
  activeGuests: number;
  pendingRequests: number;
  todayCheckOuts: number;
  occupancyRate: string;
  requestsByType: Record<string, number>;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

// Concierge Types
export interface ConciergeQueryInput {
  guestId?: string;
  query: string;
}

export interface ConciergeResponse {
  response: string;
  suggestions?: string[];
  guestId?: string;
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  database: string;
  timestamp: string;
}