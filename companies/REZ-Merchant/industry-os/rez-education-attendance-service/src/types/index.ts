import { z } from 'zod';

export const AttendanceStatusEnum = z.enum(['present', 'absent', 'late', 'excused', 'holiday']);
export type AttendanceStatus = z.infer<typeof AttendanceStatusEnum>;

export interface Attendance {
  _id: string;
  studentId: string;
  batchId: string;
  date: Date;
  status: AttendanceStatus;
  markedBy: string;
  remarks?: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const MarkAttendanceSchema = z.object({
  studentId: z.string().min(1),
  batchId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: AttendanceStatusEnum,
  remarks: z.string().max(200).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional()
});

export const BulkAttendanceSchema = z.object({
  batchId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({
    studentId: z.string().min(1),
    status: AttendanceStatusEnum,
    remarks: z.string().max(200).optional()
  }))
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
