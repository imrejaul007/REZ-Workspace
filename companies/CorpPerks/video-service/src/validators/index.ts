import { z } from 'zod';
import { MeetingStatus, ParticipantStatus } from '../types';

// ==================== MEETING VALIDATORS ====================

const RecurringPatternSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  endDate: z.string().optional(),
  occurrences: z.number().positive().optional(),
});

const DeviceInfoSchema = z.object({
  browser: z.string().optional(),
  os: z.string().optional(),
  device: z.string().optional(),
});

const ParticipantInputSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['host', 'co_host', 'presenter', 'attendee']).optional(),
});

export const CreateMeetingSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  hostId: z.string().min(1),
  hostName: z.string().min(1),
  hostEmail: z.string().email().optional(),
  startTime: z.string().datetime(),
  duration: z.number().positive().max(480).optional(),
  timezone: z.string().optional(),
  maxParticipants: z.number().positive().max(1000).optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: RecurringPatternSchema.optional(),
  agenda: z.string().max(5000).optional(),
  recordingEnabled: z.boolean().optional(),
  waitingRoomEnabled: z.boolean().optional(),
  participants: z.array(ParticipantInputSchema).optional(),
});

export const UpdateMeetingSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  startTime: z.string().datetime().optional(),
  duration: z.number().positive().max(480).optional(),
  timezone: z.string().optional(),
  maxParticipants: z.number().positive().max(1000).optional(),
  agenda: z.string().max(5000).optional(),
  recordingEnabled: z.boolean().optional(),
  waitingRoomEnabled: z.boolean().optional(),
});

export const JoinMeetingSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['co_host', 'presenter', 'attendee']).optional(),
  deviceInfo: DeviceInfoSchema.optional(),
});

export const LeaveMeetingSchema = z.object({
  participantId: z.string().min(1),
});

export const MeetingQuerySchema = z.object({
  companyId: z.string().optional(),
  hostId: z.string().optional(),
  status: z.nativeEnum(MeetingStatus).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().positive().max(100)).optional(),
  sortBy: z.enum(['startTime', 'title', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ==================== TYPES ====================

export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof UpdateMeetingSchema>;
export type JoinMeetingInput = z.infer<typeof JoinMeetingSchema>;
export type LeaveMeetingInput = z.infer<typeof LeaveMeetingSchema>;
export type MeetingQueryInput = z.infer<typeof MeetingQuerySchema>;
