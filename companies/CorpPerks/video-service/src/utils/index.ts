import crypto from 'crypto';

// Video provider integration utilities

// Generate unique meeting room name
export function generateRoomName(prefix = 'meeting'): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}-${timestamp}-${random}`;
}

// Generate secure meeting link
export function generateMeetingLink(roomName: string, baseUrl?: string): string {
  const base = baseUrl || process.env.MEETING_BASE_URL || 'https://meet.corpperks.com';
  return `${base}/${roomName}`;
}

// Parse ISO date string to Date
export function parseDate(dateStr: string): Date {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  return date;
}

// Calculate end time from start time and duration
export function calculateEndTime(startTime: Date, durationMinutes: number): Date {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);
  return endTime;
}

// Check if meeting is starting soon (within 5 minutes)
export function isStartingSoon(startTime: Date): boolean {
  const now = new Date();
  const diff = startTime.getTime() - now.getTime();
  return diff > 0 && diff <= 5 * 60 * 1000; // 5 minutes
}

// Check if meeting has started
export function hasStarted(startTime: Date): boolean {
  return new Date() >= startTime;
}

// Check if meeting has ended
export function hasEnded(endTime: Date): boolean {
  return new Date() >= endTime;
}

// Format duration in minutes to human readable
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

// Calculate participant duration in seconds
export function calculateDuration(joinedAt: Date, leftAt?: Date): number {
  const end = leftAt || new Date();
  return Math.floor((end.getTime() - joinedAt.getTime()) / 1000);
}

// Generate unique ID
export function generateId(prefix: string): string {
  const { v4: uuidv4 } = require('uuid');
  return `${prefix}_${uuidv4()}`;
}

// Validate meeting time (not in the past)
export function isValidMeetingTime(startTime: Date): boolean {
  const now = new Date();
  // Allow meetings starting from now (with 1 minute buffer)
  now.setMinutes(now.getMinutes() - 1);
  return startTime > now;
}

// Get next occurrence for recurring meetings
export function getNextOccurrence(
  currentStart: Date,
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
): Date {
  const next = new Date(currentStart);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return next;
}

// Video provider interface
export interface VideoProvider {
  createRoom(options?: {
    name?: string;
    privacy?: 'public' | 'private';
    maxParticipants?: number;
  }): Promise<{ id: string; url: string; name: string }>;

  getRoomToken(roomName: string, userId: string): Promise<string>;

  endMeeting(roomName: string): Promise<void>;
}

// Placeholder video provider (replace with actual integration)
export const placeholderVideoProvider: VideoProvider = {
  async createRoom(options) {
    const roomName = options?.name || generateRoomName();
    const url = generateMeetingLink(roomName);

    return {
      id: roomName,
      url,
      name: roomName,
    };
  },

  async getRoomToken(roomName: string, userId: string): Promise<string> {
    // In production, integrate with actual video provider (Daily, Zoom, Jitsi, etc.)
    // This generates a placeholder token
    return `placeholder-token-${roomName}-${userId}`;
  },

  async endMeeting(roomName: string): Promise<void> {
    // In production, call video provider API to end meeting
    logger.info(`Ending meeting: ${roomName}`);
  },
};
