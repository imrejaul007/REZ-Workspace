import { Types } from 'mongoose';

// ==================== ENUMS ====================

export type MeetingType = '1on1' | 'skip_level' | 'team_meeting';
export type MeetingFrequency = 'weekly' | 'biweekly' | 'monthly';
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type OneOnOneStatus = 'active' | 'paused' | 'ended';
export type SentimentType = 'positive' | 'neutral' | 'negative';
export type FeedbackRating = 1 | 2 | 3 | 4 | 5;
export type ActionItemStatus = 'pending' | 'in_progress' | 'completed';

// ==================== ACTION ITEM ====================

export interface IActionItem {
  _id?: Types.ObjectId;
  itemId: string;
  meetingId: string;
  task: string;
  description?: string;
  assigneeId: string;
  assigneeName: string;
  createdById: string;
  createdByName: string;
  dueDate?: Date;
  status: ActionItemStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completedAt?: Date;
  completedNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== FEEDBACK ====================

export interface IFeedback {
  _id?: Types.ObjectId;
  feedbackId: string;
  meetingId: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  revieweeName: string;
  rating: FeedbackRating;
  feedbackType: 'meeting_prep' | 'engagement' | 'action_items' | 'communication' | 'overall';
  comment?: string;
  sentiment?: SentimentType;
  submittedAt: Date;
}

// ==================== AGENDA ====================

export interface IAgendaItem {
  _id?: Types.ObjectId;
  agendaItemId: string;
  meetingId: string;
  title: string;
  description?: string;
  topicType: 'discussion' | 'update' | 'decision' | 'feedback' | 'goal' | 'blocker' | 'other';
  proposedById: string;
  proposedByName: string;
  duration?: number; // minutes
  isCompleted: boolean;
  order: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== MEETING NOTE ====================

export interface IMeetingNote {
  _id?: Types.ObjectId;
  noteId: string;
  meetingId: string;
  authorId: string;
  authorName: string;
  content: string; // Rich text content
  sentiment?: SentimentType;
  discussionSummary?: string;
  decisions: string[];
  keyTakeaways: string[];
  actionItems: string[]; // References to ActionItem.itemId
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  isPrivate: boolean; // Private notes only visible to author
  sharedWith: string[]; // User IDs who can see this note
  createdAt: Date;
  updatedAt: Date;
}

// ==================== MEETING ====================

export interface IMeeting {
  _id?: Types.ObjectId;
  meetingId: string;
  companyId: string;
  type: MeetingType;
  title: string;
  description?: string;

  // Scheduling
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  duration: number; // minutes
  timezone?: string;

  // Participants
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  attendeeId: string;
  attendeeName: string;
  attendeeAvatar?: string;
  participantIds: string[];

  // Location/Link
  location?: string;
  meetingLink?: string;

  // Status
  status: MeetingStatus;
  cancellationReason?: string;

  // Agenda
  agenda: IAgendaItem[];
  agendaSent: boolean;

  // Notes
  notes: IMeetingNote[];
  aiSummary?: string;

  // Action Items
  actionItems: IActionItem[];

  // Feedback
  feedback: IFeedback[];

  // Recurrence (for recurring 1:1s)
  recurrence?: {
    frequency: MeetingFrequency;
    nextOccurrence?: Date;
    lastOccurrence?: Date;
    endDate?: Date;
  };

  // Integration
  calendarEventId?: string;
  outlookEventId?: string;
  googleEventId?: string;

  // Metadata
  meetingType: 'video' | 'audio' | 'in_person' | 'phone';
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 1:1 RELATIONSHIP ====================

export interface IOneOnOne {
  _id?: Types.ObjectId;
  oneOnOneId: string;
  meetingId: string; // Reference to the meeting this is based on
  companyId: string;
  managerId: string;
  managerName: string;
  managerAvatar?: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  type: MeetingType;
  frequency: MeetingFrequency;
  nextScheduled?: Date;
  lastMeeting?: Date;
  duration: number; // minutes
  preferredTime?: string; // e.g., "14:00"
  preferredDays?: number[]; // 0=Sunday, 1=Monday, etc.
  status: OneOnOneStatus;
  pausedReason?: string;
  meetingTemplate?: {
    defaultAgenda?: string[];
    defaultDuration?: number;
    includeLastMeetingReview?: boolean;
  };

  // Stats
  stats: {
    totalMeetings: number;
    completedMeetings: number;
    totalActionItems: number;
    completedActionItems: number;
    averageRating?: number;
    lastFeedbackDate?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

// ==================== API REQUEST/RESPONSE TYPES ====================

// Schedule 1:1 Request
export interface ScheduleOneOnOneRequest {
  managerId: string;
  managerName: string;
  managerAvatar?: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  type: MeetingType;
  frequency: MeetingFrequency;
  nextScheduled: string; // ISO date string
  duration?: number;
  preferredTime?: string;
  preferredDays?: number[];
  timezone?: string;
  meetingLink?: string;
}

// Add Note Request
export interface AddNoteRequest {
  content: string;
  discussionSummary?: string;
  decisions?: string[];
  keyTakeaways?: string[];
  isPrivate?: boolean;
  sharedWith?: string[];
  sentiment?: SentimentType;
}

// Add Action Item Request
export interface AddActionItemRequest {
  task: string;
  description?: string;
  assigneeId: string;
  assigneeName: string;
  dueDate?: string; // ISO date string
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// Add Agenda Item Request
export interface AddAgendaItemRequest {
  title: string;
  description?: string;
  topicType: IAgendaItem['topicType'];
  duration?: number;
}

// Submit Feedback Request
export interface SubmitFeedbackRequest {
  rating: FeedbackRating;
  feedbackType: FeedbackType;
  comment?: string;
}

// Complete Meeting Request
export interface CompleteMeetingRequest {
  actualEnd?: string; // ISO date string
  aiSummary?: string;
}

// Update Action Item Request
export interface UpdateActionItemRequest {
  status?: ActionItemStatus;
  dueDate?: string;
  completedNote?: string;
}

// ==================== FEEDBACK TYPES ====================

export type FeedbackType = 'meeting_prep' | 'engagement' | 'action_items' | 'communication' | 'overall';

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ==================== CALENDAR TYPES ====================

export interface CalendarSlot {
  start: Date;
  end: Date;
  available: boolean;
  busy?: boolean;
}

export interface WorkingHours {
  day: number; // 0=Sunday, 6=Saturday
  start: string; // "09:00"
  end: string; // "18:00"
}

export interface CalendarConflict {
  existingMeetingId: string;
  existingMeetingTitle: string;
  start: Date;
  end: Date;
}

// ==================== STATS TYPES ====================

export interface MeetingStats {
  totalMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
  upcomingMeetings: number;
  totalDuration: number; // minutes
  averageDuration: number; // minutes
  totalActionItems: number;
  completedActionItems: number;
  pendingActionItems: number;
  overdueActionItems: number;
  averageRating?: number;
}

export interface OneOnOneStats {
  totalPairs: number;
  activePairs: number;
  pausedPairs: number;
  endedPairs: number;
  upcomingMeetings: number;
  meetingsThisWeek: number;
  meetingsThisMonth: number;
  averageRating: number;
  totalActionItems: number;
  completedActionItems: number;
}

