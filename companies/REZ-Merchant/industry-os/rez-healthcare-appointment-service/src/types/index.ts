import { z } from 'zod';

export const AppointmentStatusEnum = z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']);
export type AppointmentStatus = z.infer<typeof AppointmentStatusEnum>;

export interface Appointment {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  date: Date;
  startTime: string;
  endTime: string;
  reason: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
}

export interface Schedule {
  _id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

export const CreateAppointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  departmentId: z.string(),
  date: z.string(),
  startTime: z.string(),
  reason: z.string()
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
