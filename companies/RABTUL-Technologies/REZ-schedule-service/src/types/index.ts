// ReZ Schedule - Type Definitions
import { z } from 'zod';

// ============================================
// ZOD SCHEMAS
// ============================================

// Booking Status
export const BookingStatusSchema = z.nativeEnum({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
});
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

// Location Type
export const LocationTypeSchema = z.nativeEnum({
  IN_PERSON: 'IN_PERSON',
  PHONE_CALL: 'PHONE_CALL',
  VIDEO_CALL: 'VIDEO_CALL',
  CUSTOM_LINK: 'CUSTOM_LINK',
});
export type LocationType = z.infer<typeof LocationTypeSchema>;

// Payment Status
export const PaymentStatusSchema = z.nativeEnum({
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

// Question Type
export const QuestionTypeSchema = z.nativeEnum({
  TEXT: 'TEXT',
  TEXTAREA: 'TEXTAREA',
  SELECT: 'SELECT',
  MULTI_SELECT: 'MULTI_SELECT',
  CHECKBOX: 'CHECKBOX',
  RADIO: 'RADIO',
});
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

// Special Date Type
export const SpecialDateTypeSchema = z.nativeEnum({
  BLOCKED: 'BLOCKED',
  AVAILABLE: 'AVAILABLE',
  MODIFIED_HOURS: 'MODIFIED_HOURS',
});
export type SpecialDateType = z.infer<typeof SpecialDateTypeSchema>;

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

// Create Event Type
export const CreateEventTypeSchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  duration: z.number().int().min(5).max(480), // 5 min to 8 hours
  bufferTime: z.number().int().min(0).max(120).default(0),
  locationType: LocationTypeSchema.default('VIDEO_CALL'),
  locationAddress: z.string().optional(),
  meetingUrl: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  requiresConfirmation: z.boolean().default(false),
  disableGuests: z.boolean().default(false),
  maxBookingsPerDay: z.number().int().min(1).optional(),
  minNoticeMinutes: z.number().int().min(0).default(0),
  slotInterval: z.number().int().min(5).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().default('INR'),
  paidBooking: z.boolean().default(false),
  scheduleId: z.string().optional(), // Link to a schedule
  customQuestions: z.array(z.object({
    question: z.string(),
    type: QuestionTypeSchema.default('TEXT'),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).optional(),
});

export type CreateEventTypeInput = z.infer<typeof CreateEventTypeSchema>;

// Get Availability
export const GetAvailabilitySchema = z.object({
  eventTypeId: z.string().optional(),
  username: z.string().optional(),
  slug: z.string().optional(),
  startDate: z.string(), // ISO date
  endDate: z.string(), // ISO date
  guestTimezone: z.string().optional(),
});

export type GetAvailabilityInput = z.infer<typeof GetAvailabilitySchema>;

// Time Slot
export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

// Create Booking
export const CreateBookingSchema = z.object({
  eventTypeId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  idempotencyKey: z.string().optional(),
  timezone: z.string().default('Asia/Kolkata'),
  guestTimezone: z.string().optional(),
  // Attendee info
  attendeeName: z.string().min(1),
  attendeeEmail: z.string().email(),
  attendeePhone: z.string().optional(),
  // Responses to custom questions
  responses: z.record(z.unknown()).optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

// Cancel Booking
export const CancelBookingSchema = z.object({
  reason: z.string().optional(),
  notifyHost: z.boolean().default(true),
  notifyGuest: z.boolean().default(true),
});

export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;

// Reschedule Booking
export const RescheduleBookingSchema = z.object({
  newStartTime: z.string().datetime(),
  newEndTime: z.string().datetime(),
  notifyHost: z.boolean().default(true),
  notifyGuest: z.boolean().default(true),
});

export type RescheduleBookingInput = z.infer<typeof RescheduleBookingSchema>;

// ============================================
// RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ============================================
// AVAILABILITY TYPES
// ============================================

export interface DayAvailability {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface AvailabilityQuery {
  eventTypeId: string;
  startDate: Date;
  endDate: Date;
  guestTimezone?: string;
}

export interface SlotQuery {
  date: Date;
  startHour: number;
  startMinute: number;
  duration: number;
  slotInterval: number;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface BookingNotification {
  type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'booking_rescheduled' | 'booking_reminder';
  bookingId: string;
  bookingUid: string;
  hostEmail: string;
  hostName: string;
  attendeeEmail: string;
  attendeeName: string;
  eventTitle: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  locationType: LocationType;
  locationDetails?: Record<string, unknown>;
}
