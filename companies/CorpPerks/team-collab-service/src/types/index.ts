import { ObjectId } from 'mongoose';

// ============= ID Generation =
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}${random}`.toUpperCase();
}

export const generateChannelId = () => generateId('CHAN');
export const generateMessageId = () => generateId('MSG');
export const generateAnnouncementId = () => generateId('ANNC');
export const generateMeetingId = () => generateId('MEET');

// Export generateId for knowledge and community services
export { generateId };

// ============= Attachment =
export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

// ============= Reaction =
export interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

// ============= Channel =
export type ChannelType = 'public' | 'private' | 'project' | 'direct';

export interface IChannel {
  _id: ObjectId;
  channelId: string;
  name: string;
  description: string;
  type: ChannelType;
  companyId: string;
  projectId?: string;
  members: string[];
  admins: string[];
  isArchived: boolean;
  unreadCount: Map<string, number>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChannelDTO {
  name: string;
  description?: string;
  type: ChannelType;
  companyId: string;
  projectId?: string;
  members?: string[];
  createdBy: string;
}

export interface UpdateChannelDTO {
  name?: string;
  description?: string;
  isArchived?: boolean;
}

// ============= Message =
export type MessageType = 'text' | 'file' | 'image' | 'system' | 'poll';

export interface IMessage {
  _id: ObjectId;
  messageId: string;
  channelId: string;
  threadId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: MessageType;
  attachments: Attachment[];
  reactions: Reaction[];
  mentions: string[];
  isEdited: boolean;
  isDeleted: boolean;
  replyCount: number;
  lastReplyAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageDTO {
  channelId: string;
  threadId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType?: MessageType;
  attachments?: Attachment[];
  mentions?: string[];
}

export interface UpdateMessageDTO {
  content: string;
}

export interface MessageReactionDTO {
  emoji: string;
  userId: string;
  userName: string;
}

// ============= Thread =
export interface IThread {
  _id: ObjectId;
  threadId: string;
  parentMessageId: string;
  channelId: string;
  replyCount: number;
  lastReplyAt: Date;
  participantIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============= Announcement =
export type AnnouncementCategory = 'hr' | 'company' | 'team' | 'event' | 'policy' | 'milestone';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface IAnnouncement {
  _id: ObjectId;
  announcementId: string;
  title: string;
  content: string;
  summary: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  departmentIds: string[];
  companyId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  attachments: Attachment[];
  views: number;
  viewedBy: string[];
  reactions: Reaction[];
  scheduledFor?: Date;
  expiresAt?: Date;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnnouncementDTO {
  title: string;
  content: string;
  summary?: string;
  category: AnnouncementCategory;
  priority?: AnnouncementPriority;
  departmentIds?: string[];
  companyId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  attachments?: Attachment[];
  scheduledFor?: Date;
  expiresAt?: Date;
}

export interface UpdateAnnouncementDTO {
  title?: string;
  content?: string;
  summary?: string;
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  departmentIds?: string[];
  isPublished?: boolean;
  expiresAt?: Date;
}

// ============= Meeting =
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface ActionItem {
  id: string;
  task: string;
  assigneeId: string;
  assigneeName: string;
  dueDate?: Date;
  completed: boolean;
  createdAt: Date;
}

export interface IMeeting {
  _id: ObjectId;
  meetingId: string;
  title: string;
  description: string;
  projectId?: string;
  channelId?: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  attendees: string[];
  startTime: Date;
  endTime: Date;
  duration: number;
  status: MeetingStatus;
  meetingLink?: string;
  notes?: string;
  actionItems: ActionItem[];
  recordings: string[];
  location?: string;
  meetingType: 'video' | 'audio' | 'in_person' | 'phone';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMeetingDTO {
  title: string;
  description?: string;
  projectId?: string;
  channelId?: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  attendees: string[];
  startTime: Date;
  endTime: Date;
  meetingLink?: string;
  location?: string;
  meetingType?: 'video' | 'audio' | 'in_person' | 'phone';
}

export interface UpdateMeetingDTO {
  title?: string;
  description?: string;
  attendees?: string[];
  startTime?: Date;
  endTime?: Date;
  meetingLink?: string;
  location?: string;
  status?: MeetingStatus;
}

export interface CreateActionItemDTO {
  task: string;
  assigneeId: string;
  assigneeName: string;
  dueDate?: Date;
}

// ============= Meeting Notes =
export interface IMeetingNote {
  _id: ObjectId;
  noteId: string;
  meetingId: string;
  content: string;
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  generatedBy: 'ai' | 'manual';
  generatedAt: Date;
  createdAt: Date;
}

// ============= Presence =
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface UserPresence {
  odId: string;
  status: PresenceStatus;
  lastSeen: Date;
  customStatus?: string;
}

// ============= Typing Indicator =
export interface TypingIndicator {
  channelId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

// ============= Analytics =
export interface ChannelAnalytics {
  channelId: string;
  totalMessages: number;
  activeMembers: number;
  avgResponseTime: number;
  mostActiveDay: string;
  messageByType: Record<MessageType, number>;
  topReactors: Array<{ userId: string; count: number }>;
}

export interface AnnouncementAnalytics {
  announcementId: string;
  views: number;
  uniqueViewers: number;
  avgReadTime: number;
  reactionCounts: Record<string, number>;
}

// ============= API Response =
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

// ============= Socket Events =
export interface ServerToClientEvents {
  'message:new': (message: IMessage) => void;
  'message:update': (message: IMessage) => void;
  'message:delete': (messageId: string) => void;
  'message:reaction': (messageId: string, reaction: Reaction) => void;
  'typing:update': (indicator: TypingIndicator) => void;
  'presence:update': (presence: UserPresence) => void;
  'meeting:start': (meeting: IMeeting) => void;
  'meeting:end': (meeting: IMeeting) => void;
  'meeting:update': (meeting: IMeeting) => void;
  'announcement:new': (announcement: IAnnouncement) => void;
  'channel:update': (channel: IChannel) => void;
}

export interface ClientToServerEvents {
  'channel:join': (channelId: string) => void;
  'channel:leave': (channelId: string) => void;
  'message:send': (data: CreateMessageDTO) => void;
  'message:typing': (data: { channelId: string; isTyping: boolean }) => void;
  'presence:update': (status: PresenceStatus) => void;
  'meeting:join': (meetingId: string) => void;
}

// ============= Validation Schemas =
import { z } from 'zod';

export const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['public', 'private', 'project', 'direct']),
  companyId: z.string().min(1),
  projectId: z.string().optional(),
  members: z.array(z.string()).optional(),
});

export const createMessageSchema = z.object({
  channelId: z.string().min(1),
  threadId: z.string().optional(),
  senderId: z.string().min(1),
  senderName: z.string().min(1),
  senderAvatar: z.string().url().optional(),
  content: z.string().min(1).max(10000),
  messageType: z.enum(['text', 'file', 'image', 'system', 'poll']).optional(),
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    url: z.string().url(),
    mimeType: z.string(),
    size: z.number(),
    uploadedBy: z.string(),
    uploadedAt: z.date(),
  })).optional(),
  mentions: z.array(z.string()).optional(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  summary: z.string().max(500).optional(),
  category: z.enum(['hr', 'company', 'team', 'event', 'policy', 'milestone']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  departmentIds: z.array(z.string()).optional(),
  companyId: z.string().min(1),
  authorId: z.string().min(1),
  authorName: z.string().min(1),
  authorAvatar: z.string().url().optional(),
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    url: z.string().url(),
    mimeType: z.string(),
    size: z.number(),
    uploadedBy: z.string(),
    uploadedAt: z.date(),
  })).optional(),
  scheduledFor: z.date().optional(),
  expiresAt: z.date().optional(),
});

export const createMeetingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  projectId: z.string().optional(),
  channelId: z.string().optional(),
  hostId: z.string().min(1),
  hostName: z.string().min(1),
  hostAvatar: z.string().url().optional(),
  attendees: z.array(z.string()).min(1),
  startTime: z.date(),
  endTime: z.date(),
  meetingLink: z.string().url().optional(),
  location: z.string().optional(),
  meetingType: z.enum(['video', 'audio', 'in_person', 'phone']).optional(),
});

export const createActionItemSchema = z.object({
  task: z.string().min(1).max(500),
  assigneeId: z.string().min(1),
  assigneeName: z.string().min(1),
  dueDate: z.date().optional(),
});

export const addReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
  userId: z.string().min(1),
  userName: z.string().min(1),
});
