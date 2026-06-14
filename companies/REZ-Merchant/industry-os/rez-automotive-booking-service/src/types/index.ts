import { z } from 'zod';

export const BookingStatusEnum = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']);
export type BookingStatus = z.infer<typeof BookingStatusEnum>;

export interface Appointment {
  _id: string;
  bookingId: string;
  customerId: string;
  vehicleId: string;
  serviceId: string;
  technicianId?: string;
  bayNumber?: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CreateBookingSchema = z.object({
  customerId: z.string().min(1),
  vehicleId: z.string().min(1),
  serviceId: z.string().min(1),
  technicianId: z.string().optional(),
  bayNumber: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional()
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
