import { z } from 'zod';

export const BookingStatusEnum = z.enum([
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
]);
export type BookingStatus = z.infer<typeof BookingStatusEnum>;

export const PaymentStatusEnum = z.enum(['pending', 'paid', 'refunded', 'failed']);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export interface Appointment {
  _id: string;
  bookingId: string;
  customerId: string;
  serviceId: string;
  therapistId: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: BookingStatus;
  notes: string;
  specialRequests: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  therapistId: string;
  isAvailable: boolean;
  serviceId?: string;
}

export interface CreateBookingRequest {
  customerId: string;
  serviceId: string;
  therapistId?: string;
  date: string;
  startTime: string;
  notes?: string;
  specialRequests?: string;
}

export interface UpdateBookingRequest {
  therapistId?: string;
  date?: string;
  startTime?: string;
  notes?: string;
  specialRequests?: string;
  status?: BookingStatus;
}

export interface AvailabilityQuery {
  therapistId?: string;
  serviceId?: string;
  date: string;
  duration?: number;
}

export const CreateBookingSchema = z.object({
  customerId: z.string().min(1),
  serviceId: z.string().min(1),
  therapistId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().max(500).optional(),
  specialRequests: z.string().max(500).optional()
});

export const UpdateBookingSchema = CreateBookingSchema.partial();

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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
