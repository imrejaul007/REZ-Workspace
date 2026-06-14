import { Types } from 'mongoose';

// ==================== ENUMS ====================

export type CalendarProvider = 'google' | 'outlook' | 'apple' | 'corpperks';
export type SyncStatus = 'synced' | 'pending' | 'failed' | 'conflict';
export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';
export type AttendeeStatus = 'accepted' | 'declined' | 'tentative' | 'needs_action' | 'not_invited';

// ==================== CALENDAR CONNECTION ====================

export interface ICalendarConnection {
  _id?: Types.ObjectId;
  connectionId: string;
  userId: string;
  companyId: string;
  provider: CalendarProvider;
  email: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry: Date;
  calendarId?: string;
  calendarName?: string;
  isPrimary: boolean;
  isActive: boolean;
  lastSyncedAt?: Date;
  syncToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectCalendarRequest {
  userId: string;
  companyId: string;
  provider: CalendarProvider;
  code: string; // OAuth authorization code
  redirectUri: string;
}

export interface RefreshTokenRequest {
  connectionId: string;
  refreshToken: string;
}

// ==================== CALENDAR EVENT ====================

export interface ICalendarEvent {
  _id?: Types.ObjectId;
  eventId: string;
  externalEventId: string;
  connectionId: string;
  userId: string;
  companyId: string;
  provider: CalendarProvider;

  // Event Details
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  allDay: boolean;
  status: EventStatus;

  // Attendees
  attendees: IAttendee[];
  organizerName?: string;
  organizerEmail?: string;

  // Sync Information
  syncStatus: SyncStatus;
  externalUrl?: string;
  meetingLink?: string;
  recurringEventId?: string;

  // CorpPerks Integration
  linkedMeetingId?: string;
  linkedProjectId?: string;
  isCorpPerksEvent: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}

export interface IAttendee {
  attendeeId: string;
  email: string;
  name?: string;
  status: AttendeeStatus;
  responseComment?: string;
  isOrganizer: boolean;
  isCorpPerksUser: boolean;
  userId?: string;
}

export interface CreateEventRequest {
  userId: string;
  companyId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  timezone?: string;
  allDay?: boolean;
  attendees?: {
    email: string;
    name?: string;
  }[];
  meetingLink?: string;
  linkedMeetingId?: string;
  linkedProjectId?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  allDay?: boolean;
  attendees?: {
    email: string;
    name?: string;
    status?: AttendeeStatus;
  }[];
  meetingLink?: string;
}

export interface SyncOptions {
  connectionId: string;
  userId: string;
  companyId: string;
  provider: CalendarProvider;
  syncToken?: string;
  fullSync?: boolean;
}

// ==================== SYNC LOG ====================

export interface ISyncLog {
  _id?: Types.ObjectId;
  syncLogId: string;
  connectionId: string;
  userId: string;
  companyId: string;
  provider: CalendarProvider;
  status: 'started' | 'completed' | 'failed';
  syncType: 'full' | 'incremental';
  eventsAdded: number;
  eventsUpdated: number;
  eventsDeleted: number;
  conflicts: ISyncConflict[];
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
}

export interface ISyncConflict {
  eventId: string;
  conflictType: 'title' | 'time' | 'attendee' | 'deleted';
  localVersion: Partial<ICalendarEvent>;
  remoteVersion: Partial<ICalendarEvent>;
  resolution?: 'local' | 'remote' | 'merged';
  resolvedAt?: Date;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ==================== GOOGLE CALENDAR TYPES ====================

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string; // For all-day events
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: 'confirmed' | 'tentative' | 'cancelled';
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction' | 'not_invited';
    comment?: string;
  }[];
  organizer?: {
    email: string;
    displayName?: string;
  };
  htmlLink?: string;
  conferenceData?: {
    entryPoints?: {
      entryPointType: string;
      uri: string;
    }[];
  };
  recurringEventId?: string;
}

// ==================== OUTLOOK CALENDAR TYPES ====================

export interface OutlookCalendarEvent {
  id: string;
  subject: string;
  bodyPreview?: string;
  body?: {
    contentType: 'text' | 'html';
    content: string;
  };
  location?: {
    displayName: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      countryOrRegion?: string;
      postalCode?: string;
    };
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  isAllDay: boolean;
  showAs: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';
  attendees?: {
    emailAddress: {
      name?: string;
      address: string;
    };
    status: {
      response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded';
      time: string;
    };
    comment?: string;
    type: 'required' | 'optional' | 'resource';
  }[];
  organizer?: {
    emailAddress: {
      name?: string;
      address: string;
    };
  };
  webLink?: string;
  isRecurring?: boolean;
  recurrence?: {
    pattern?: {
      type: string;
      interval: number;
      daysOfWeek?: string[];
    };
    range?: {
      type: string;
      startDate: string;
      endDate?: string;
    };
  };
  seriesMasterId?: string;
}

// ==================== CALENDAR VIEW TYPES ====================

export interface CalendarViewEvent {
  eventId: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  status: EventStatus;
  provider: CalendarProvider;
  location?: string;
  meetingLink?: string;
  isCorpPerksEvent: boolean;
  attendees: {
    total: number;
    accepted: number;
    declined: number;
  };
}

export interface CalendarViewDay {
  date: Date;
  events: CalendarViewEvent[];
  hasConflicts: boolean;
  totalHours: number;
}

// ==================== FREE BUSY ====================

export interface FreeBusyRequest {
  userId: string;
  companyId: string;
  startTime: string;
  endTime: string;
  userEmails: string[];
}

export interface FreeBusyResult {
  email: string;
  isFree: boolean;
  intervals: {
    start: Date;
    end: Date;
    status: 'busy' | 'free' | 'workingHours' | 'tentative';
  }[];
}

export interface AvailableSlot {
  start: Date;
  end: Date;
  duration: number; // minutes
  available: boolean;
}
