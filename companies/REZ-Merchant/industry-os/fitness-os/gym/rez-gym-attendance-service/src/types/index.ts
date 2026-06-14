import { z } from 'zod';

export const AttendanceSchema = z.object({
  attendanceId: z.string(),
  userId: z.string(),
  gymId: z.string(),
  membershipId: z.string(),
  checkInTime: z.string(),
  checkOutTime: z.string().optional(),
  sessionType: z.enum(['gym', 'class', 'personal_training']),
  sessionId: z.string().optional(),
  source: z.enum(['qr', 'manual', 'face_recognition']).default('qr'),
  isActive: z.boolean().default(true),
});

export type IAttendance = z.infer<typeof AttendanceSchema>;

export const QRSessionSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  gymId: z.string(),
  qrCode: z.string(),
  expiresAt: z.string(),
  isUsed: z.boolean().default(false),
  usedAt: z.string().optional(),
});

export type IQRSession = z.infer<typeof QRSessionSchema>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
