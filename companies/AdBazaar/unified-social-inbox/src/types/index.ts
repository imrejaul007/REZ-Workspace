import { Request } from 'express';

export type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'whatsapp';
export type MessageSender = 'user' | 'agent';
export type MediaType = 'image' | 'video' | 'audio';
export type ConversationStatus = 'active' | 'closed' | 'snoozed';
export type Priority = 'low' | 'medium' | 'high';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface PlatformUser {
  platformUserId: string;
  username: string;
  displayName: string;
  profileImage?: string;
  followerCount?: number;
}

export interface LastMessage {
  content: string;
  sender: MessageSender;
  timestamp: Date;
}

export interface IConversation {
  id: string;
  platform: Platform;
  platformConversationId: string;
  user: PlatformUser;
  accountId: string;
  lastMessage?: LastMessage;
  unreadCount: number;
  status: ConversationStatus;
  tags: string[];
  assignee?: string;
  priority: Priority;
  sentiment?: Sentiment;
  snoozedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageSenderInfo {
  type: MessageSender;
  platformUserId?: string;
  agentId?: string;
}

export interface MessageMetadata {
  quickReply?: string;
  templateUsed?: string;
}

export interface IMessage {
  id: string;
  conversationId: string;
  platform: Platform;
  platformMessageId: string;
  sender: MessageSenderInfo;
  content: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  timestamp: Date;
  read: boolean;
  metadata?: MessageMetadata;
}

export interface IQuickReplyTemplate {
  id: string;
  name: string;
  platform: Platform | 'all';
  category: string;
  content: string;
  emoji?: string;
  variables?: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInboxSettings {
  id: string;
  accountId: string;
  autoAssign: boolean;
  assignmentRules: AssignmentRule[];
  notificationSettings: NotificationSettings;
  workingHours: WorkingHours;
  slaSettings: SLASettings;
  sentimentThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentRule {
  id: string;
  keyword: string;
  assignee: string;
  priority: Priority;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  slack: boolean;
}

export interface WorkingHours {
  enabled: boolean;
  timezone: string;
  startHour: number;
  endHour: number;
  daysOff: number[];
}

export interface SLASettings {
  firstResponseTime: number;
  resolutionTime: number;
  warningThreshold: number;
}

export interface ConversationFilters {
  platform?: Platform;
  status?: ConversationStatus;
  priority?: Priority;
  assignee?: string;
  tags?: string[];
  search?: string;
  sentiment?: Sentiment;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InboxStats {
  total: number;
  active: number;
  closed: number;
  snoozed: number;
  unread: number;
  byPlatform: Record<Platform, number>;
  byPriority: Record<Priority, number>;
  avgResponseTime: number;
  avgResolutionTime: number;
  sentimentBreakdown: Record<Sentiment, number>;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    accountId: string;
    role: string;
  };
}

export interface WebhookPayload {
  platform: Platform;
  event: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

// Socket.io Event Types
export interface SocketEvents {
  'message:new': (data: { conversationId: string; message: IMessage }) => void;
  'message:read': (data: { conversationId: string; messageId: string; userId: string }) => void;
  'conversation:updated': (data: { conversation: IConversation }) => void;
  'typing:start': (data: { conversationId: string; userId: string }) => void;
  'typing:stop': (data: { conversationId: string; userId: string }) => void;
}
