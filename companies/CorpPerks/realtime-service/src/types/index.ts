// ==========================================
// WebSocket Event Types
// ==========================================

export type WebSocketEventType =
  | 'notification'
  | 'task_updated'
  | 'leave_status'
  | 'announcement'
  | 'message'
  | 'presence'
  | 'typing'
  | 'connection'
  | 'disconnection'
  | 'error';

// ==========================================
// Room Types
// ==========================================

export type RoomType = 'user' | 'team' | 'company' | 'project' | 'custom';

export interface Room {
  id: string;
  type: RoomType;
  name: string;
  members: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Connection Types
// ==========================================

export interface WebSocketConnection {
  id: string;
  userId: string;
  socketId: string;
  rooms: string[];
  metadata?: Record<string, unknown>;
  connectedAt: Date;
  lastActivity: Date;
  isAlive: boolean;
}

// ==========================================
// Message Types
// ==========================================

export interface WebSocketMessage {
  id: string;
  type: WebSocketEventType;
  room?: string;
  payload: unknown;
  timestamp: Date;
  senderId?: string;
}

export interface OutgoingMessage {
  type: WebSocketEventType;
  room?: string;
  payload: unknown;
  timestamp: string;
}

// ==========================================
// Presence Types
// ==========================================

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: Date;
  metadata?: {
    device?: string;
    platform?: string;
    location?: string;
  };
}

// ==========================================
// Typing Indicator Types
// ==========================================

export interface TypingIndicator {
  userId: string;
  roomId: string;
  isTyping: boolean;
  context?: string;
}

// ==========================================
// Publish Event Types
// ==========================================

export interface PublishEventPayload {
  type: WebSocketEventType;
  roomId: string;
  data: unknown;
  targetUsers?: string[];
  excludeUsers?: string[];
  persistent?: boolean;
}

// ==========================================
// Join Room Types
// ==========================================

export interface JoinRoomPayload {
  roomId: string;
  roomType: RoomType;
  userId: string;
  metadata?: Record<string, unknown>;
}

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==========================================
// User Session Types
// ==========================================

export interface UserSession {
  userId: string;
  companyId: string;
  teamId?: string;
  roles: string[];
  lastActivity: Date;
}

// ==========================================
// Redis Cache Types
// ==========================================

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt?: number;
}
