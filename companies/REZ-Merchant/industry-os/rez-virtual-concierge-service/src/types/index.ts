/**
 * REZ Virtual Concierge Service Types
 */

export interface Conversation {
  id: string;
  guestId: string;
  bookingId?: string;
  merchantId: string;
  messages: ConversationMessage[];
  context?: Record<string, any>;
  status: 'active' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  role: 'guest' | 'assistant' | 'system' | 'staff';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ConciergeRequest {
  id: string;
  guestId: string;
  bookingId?: string;
  merchantId: string;
  requestType: RequestType;
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: RequestStatus;
  assignedTo?: string;
  dueBy?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RequestType =
  | 'room_service'
  | 'housekeeping'
  | 'transport'
  | 'spa'
  | 'restaurant'
  | 'information'
  | 'complaint'
  | 'checkout'
  | 'checkin'
  | 'general';

export type RequestStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Recommendation {
  id: string;
  merchantId: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  rating?: number;
  relevanceScore?: number;
  tags?: string[];
  available: boolean;
  createdAt: Date;
}

export type RecommendationCategory =
  | 'dining'
  | 'spa'
  | 'transport'
  | 'activities'
  | 'attractions'
  | 'shopping'
  | 'services';

export interface CreateConversationInput {
  guestId: string;
  bookingId?: string;
  merchantId: string;
  initialMessage?: string;
}

export interface SendMessageInput {
  conversationId?: string;
  guestId: string;
  bookingId?: string;
  merchantId: string;
  message: string;
  context?: Record<string, any>;
}

export interface CreateRequestInput {
  guestId: string;
  bookingId?: string;
  merchantId: string;
  requestType: RequestType;
  subject: string;
  description: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  dueBy?: Date;
}

export interface AIResponse {
  content: string;
  suggestions?: string[];
  actions?: ConciergeAction[];
  confidence: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface ConciergeAction {
  type: 'create_request' | 'send_notification' | 'book_service' | 'provide_info';
  payload: Record<string, any>;
}

export interface ChatContext {
  guestId: string;
  bookingId?: string;
  roomNumber?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  guestName?: string;
  preferences?: Record<string, any>;
  stayDay?: number; // Day of stay (1, 2, 3, etc.)
  servicesUsed?: string[];
  complaints?: string[];
}
