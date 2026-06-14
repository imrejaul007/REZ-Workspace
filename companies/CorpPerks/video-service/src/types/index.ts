// Video Meeting Service Types
// Defines all interfaces for the video meeting service

// ==================== ENUMS ====================

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ParticipantStatus {
  INVITED = 'invited',
  JOINED = 'joined',
  LEFT = 'left',
  DECLINED = 'declined',
}

// ==================== MEETING ====================

// Note: _id is managed by Mongoose and excluded from API responses
export interface Meeting {
  meetingId: string;
  companyId: string;
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  hostEmail?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  timezone: string;
  link: string; // Video meeting link
  externalMeetingId?: string; // Provider's meeting ID
  videoProvider?: string; // daily, zoom, jitsi, meet
  maxParticipants: number;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  status: MeetingStatus;
  cancellationReason?: string;
  agenda?: string;
  notes?: string;
  recordingEnabled: boolean;
  recordingUrl?: string;
  waitingRoomEnabled: boolean;
  participants: Participant[];
  createdById: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  endDate?: Date;
  occurrences?: number;
  parentMeetingId?: string;
}

export interface Participant {
  participantId: string;
  userId: string;
  name: string;
  email: string;
  role: 'host' | 'co_host' | 'presenter' | 'attendee';
  status: ParticipantStatus;
  joinedAt?: Date;
  leftAt?: Date;
  duration?: number; // in seconds
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  ipAddress?: string;
}

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  hostEmail?: string;
  startTime: string; // ISO date string
  duration?: number; // in minutes, default 60
  timezone?: string;
  maxParticipants?: number;
  isRecurring?: boolean;
  recurringPattern?: Omit<RecurringPattern, 'parentMeetingId'>;
  agenda?: string;
  recordingEnabled?: boolean;
  waitingRoomEnabled?: boolean;
  participants?: Omit<Participant, 'participantId' | 'status' | 'joinedAt' | 'leftAt' | 'duration' | 'deviceInfo' | 'connectionQuality' | 'ipAddress'>[];
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  startTime?: string;
  duration?: number;
  timezone?: string;
  maxParticipants?: number;
  agenda?: string;
  recordingEnabled?: boolean;
  waitingRoomEnabled?: boolean;
}

export interface JoinMeetingRequest {
  userId: string;
  name: string;
  email: string;
  role?: 'co_host' | 'presenter' | 'attendee';
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
}

export interface LeaveMeetingRequest {
  participantId: string;
}

export interface MeetingQuery {
  companyId?: string;
  hostId?: string;
  status?: MeetingStatus;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ==================== PAGINATION ====================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

// ==================== VIDEO PROVIDER INTERFACE ====================

export interface VideoProviderConfig {
  provider: 'daily' | 'zoom' | 'jitsi' | 'meet';
  apiKey?: string;
  apiSecret?: string;
}

export interface MeetingRoom {
  id: string;
  url: string;
  name: string;
  privacy: 'public' | 'private';
  createdAt: string;
  expiresAt?: string;
}

export interface CreateRoomOptions {
  name?: string;
  privacy?: 'public' | 'private';
  expiresIn?: number; // minutes
  maxParticipants?: number;
  enableRecording?: boolean;
  enableWaitingRoom?: boolean;
}

export interface RoomTokens {
  token: string;
  roomName: string;
  userId: string;
  expiresAt: string;
}

// ==================== MEETING STATS ====================

export interface MeetingStats {
  meetingId: string;
  title: string;
  scheduledDuration: number;
  actualDuration?: number;
  participantCount: number;
  peakParticipants: number;
  averageConnectionQuality?: string;
  recordingDuration?: number;
  recordingUrl?: string;
}

export interface UserMeetingStats {
  userId: string;
  totalMeetings: number;
  hostedMeetings: number;
  attendedMeetings: number;
  totalDuration: number; // in minutes
  averageDuration: number;
  avgParticipants?: number;
}
