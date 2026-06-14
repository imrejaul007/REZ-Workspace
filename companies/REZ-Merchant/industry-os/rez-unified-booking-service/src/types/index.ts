import { Types } from 'mongoose';

// ============================================
// Unified Booking Types
// ============================================

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'partial';

export interface UnifiedBooking {
  bookingId: string;
  userId: string;
  merchantId: string;
  vertical: string;
  verticalBookingId: string;
  type: string;
  status: BookingStatus;
  startDateTime: Date;
  endDateTime: Date;
  duration: number; // minutes
  partySize?: number;
  totalAmount: number;
  amountPaid: number;
  currency: string;
  paymentStatus: PaymentStatus;
  bookingData: Record<string, unknown>;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingParams {
  userId: string;
  merchantId: string;
  vertical: string;
  type: string;
  startDateTime: Date;
  duration?: number;
  partySize?: number;
  bookingData?: Record<string, unknown>;
  paymentRequired?: boolean;
}

export interface UpdateBookingParams {
  startDateTime?: Date;
  duration?: number;
  notes?: string;
  partySize?: number;
}

export interface CancelBookingParams {
  reason?: string;
  cancelledBy?: string;
}

// ============================================
// Availability Types
// ============================================

export interface AvailabilityRequest {
  vertical: string;
  merchantId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  partySize?: number;
  filters?: Record<string, unknown>;
}

export interface AvailabilitySlot {
  slotId: string;
  vertical: string;
  merchantId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  capacity: number;
  booked: number;
  available: number;
  price?: number;
  resourceId?: string; // table, room, therapist, etc.
  resourceName?: string;
  resourceType?: string;
}

export interface SearchAvailabilityResponse {
  slots: AvailabilitySlot[];
  total: number;
  hasMore: boolean;
}

export interface SearchAllVerticalsResponse {
  verticals: {
    vertical: string;
    verticalName: string;
    slots: AvailabilitySlot[];
  }[];
}

// ============================================
// Waitlist Types
// ============================================

export type WaitlistStatus = 'waiting' | 'notified' | 'booked' | 'expired' | 'cancelled';

export interface WaitlistEntry {
  entryId: string;
  userId: string;
  vertical: string;
  merchantId: string;
  date: string;
  time?: string;
  partySize: number;
  status: WaitlistStatus;
  notifiedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToWaitlistParams {
  userId: string;
  vertical: string;
  merchantId: string;
  date: string;
  time?: string;
  partySize: number;
  notificationEmail?: string;
  notificationPhone?: string;
}

// ============================================
// Payment Types
// ============================================

export interface PaymentRequest {
  paymentMethod: string;
  paymentDetails: Record<string, unknown>;
}

export interface PaymentResult {
  paymentId: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  transactionId?: string;
  errorMessage?: string;
}

export interface RefundRequest {
  amount?: number;
  reason?: string;
}

export interface RefundResult {
  refundId: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  transactionId?: string;
  errorMessage?: string;
}

export interface RefundCalculation {
  refundAmount: number;
  processingFee: number;
  originalAmount: number;
}

// ============================================
// Search Types
// ============================================

export interface MerchantSearchRequest {
  vertical: string;
  city?: string;
  lat?: number;
  lng?: number;
  radius?: number; // in km
  query?: string;
}

export interface MerchantResult {
  merchantId: string;
  name: string;
  vertical: string;
  address: string;
  city: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  reviewCount?: number;
  distance?: number;
  imageUrl?: string;
}

// ============================================
// Calendar Types
// ============================================

export interface CalendarEvent {
  eventId: string;
  bookingId: string;
  userId: string;
  merchantId: string;
  merchantName: string;
  vertical: string;
  type: string;
  status: BookingStatus;
  startDateTime: Date;
  endDateTime: Date;
  duration: number;
  partySize?: number;
  totalAmount?: number;
  notes?: string;
}

export interface UserCalendarRequest {
  userId: string;
  fromDate: Date;
  toDate: Date;
  vertical?: string;
  status?: BookingStatus;
}

export interface MerchantCalendarRequest {
  merchantId: string;
  fromDate: Date;
  toDate: Date;
  status?: BookingStatus;
}

// ============================================
// Notification Types
// ============================================

export type NotificationChannel = 'email' | 'sms' | 'push' | 'whatsapp';

export interface NotificationPayload {
  type: 'booking_confirmation' | 'booking_reminder' | 'booking_cancellation' | 'waitlist_available';
  bookingId?: string;
  userId: string;
  userEmail?: string;
  userPhone?: string;
  channels: NotificationChannel[];
  data: Record<string, unknown>;
  scheduledFor?: Date;
}

export interface NotificationResult {
  notificationId: string;
  channel: NotificationChannel;
  status: 'sent' | 'failed' | 'queued';
  errorMessage?: string;
}

// ============================================
// Vertical Proxy Types
// ============================================

export interface VerticalProxyResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface VerticalBookingResponse {
  bookingId: string;
  status: string;
  confirmationCode?: string;
  details?: Record<string, unknown>;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
    pagination?: PaginationMeta;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// Health Check Types
// ============================================

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
}

export interface ReadinessStatus {
  status: 'ready' | 'not_ready';
  checks: {
    mongodb: boolean;
    verticalServices: Record<string, boolean>;
  };
  errors?: string[];
}

// ============================================
// Error Codes
// ============================================

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BOOKING_NOT_FOUND = 'BOOKING_NOT_FOUND',
  MERCHANT_NOT_FOUND = 'MERCHANT_NOT_FOUND',
  VERTICAL_NOT_FOUND = 'VERTICAL_NOT_FOUND',
  VERTICAL_UNAVAILABLE = 'VERTICAL_UNAVAILABLE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_FAILED = 'REFUND_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// ============================================
// Express Extended Types
// ============================================

export interface AuthenticatedUser {
  userId: string;
  email?: string;
  roles?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
      startTime?: number;
    }
  }
}

export {};