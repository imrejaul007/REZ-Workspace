import { z } from 'zod';

// Booking Status Enum
export const BookingStatusEnum = z.enum([
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
]);
export type BookingStatus = z.infer<typeof BookingStatusEnum>;

// Booking Type Enum
export const BookingTypeEnum = z.enum(['appointment', 'walkin', 'rebooking']);
export type BookingType = z.infer<typeof BookingTypeEnum>;

// Appointment Schema
export const AppointmentSchema = z.object({
  appointmentId: z.string(),
  salonId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  customerEmail: z.string().email().optional(),
  stylistId: z.string().optional(),
  serviceIds: z.array(z.string()),
  date: z.string(), // ISO date string
  startTime: z.string(), // HH:mm format
  endTime: z.string(), // HH:mm format
  duration: z.number(), // minutes
  status: BookingStatusEnum.default('pending'),
  type: BookingTypeEnum.default('appointment'),
  notes: z.string().optional(),
  totalAmount: z.number().optional(),
  depositPaid: z.boolean().default(false),
  depositAmount: z.number().default(0),
  source: z.enum(['app', 'web', 'phone', 'walkin', 'whatsapp']).default('app'),
  reminderSent: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type IAppointment = z.infer<typeof AppointmentSchema>;

// Create Booking DTO
export const CreateBookingDTO = z.object({
  salonId: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().min(10).max(15),
  customerEmail: z.string().email().optional(),
  stylistId: z.string().optional(),
  serviceIds: z.array(z.string()).min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  stylistPreference: z.boolean().default(false),
  notes: z.string().max(500).optional(),
  source: z.enum(['app', 'web', 'phone', 'walkin', 'whatsapp']).default('app'),
});

export type ICreateBookingDTO = z.infer<typeof CreateBookingDTO>;

// Update Booking DTO
export const UpdateBookingDTO = z.object({
  stylistId: z.string().optional(),
  serviceIds: z.array(z.string()).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: BookingStatusEnum.optional(),
  notes: z.string().max(500).optional(),
});

export type IUpdateBookingDTO = z.infer<typeof UpdateBookingDTO>;

// Availability Schema
export const AvailabilitySchema = z.object({
  stylistId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: z.array(z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
    isAvailable: z.boolean(),
  })),
});

export type IAvailability = z.infer<typeof AvailabilitySchema>;

// Time Slot Response
export interface TimeSlot {
  start: string;
  end: string;
  isAvailable: boolean;
  stylistId?: string;
  stylistName?: string;
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
export interface BookingQueryParams {
  salonId?: string;
  customerId?: string;
  stylistId?: string;
  status?: BookingStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
