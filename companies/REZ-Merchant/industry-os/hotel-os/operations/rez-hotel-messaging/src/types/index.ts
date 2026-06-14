/**
 * REZ Hotel Messaging Types
 */

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'guest' | 'staff' | 'hotel' | 'system' | 'bot';
  senderName?: string;
  recipientId: string;
  recipientType: 'guest' | 'staff' | 'hotel' | 'system';
  subject?: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'system' | 'template';
  templateId?: string;
  metadata?: Record<string, any>;
  attachments?: {
    url: string;
    type: string;
    name: string;
    size: number;
  }[];
  readBy: {
    userId: string;
    readAt: Date;
  }[];
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  hotelId: string;
  guestId: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  bookingId?: string;
  source: 'pre_stay' | 'in_stay' | 'post_stay' | 'support' | 'marketing';
  status: 'active' | 'archived' | 'resolved';
  lastMessage?: {
    content: string;
    senderType: string;
    createdAt: Date;
  };
  unreadCount: Record<string, number>;
  tags?: string[];
  assignedStaffId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTemplate {
  id: string;
  hotelId?: string;
  name: string;
  category: 'greeting' | 'reminder' | 'checkout' | 'review' | 'promotion' | 'custom';
  subject?: string;
  content: string;
  variables?: string[];
  isActive: boolean;
  channels: ('in_app' | 'sms' | 'whatsapp' | 'email')[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationInput {
  hotelId: string;
  guestId: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  bookingId?: string;
  initialMessage?: string;
  source?: 'pre_stay' | 'in_stay' | 'post_stay' | 'support' | 'marketing';
}

export interface SendMessageInput {
  conversationId?: string;
  recipientId: string;
  recipientType: 'guest' | 'staff' | 'hotel' | 'system';
  subject?: string;
  content: string;
  type?: 'text' | 'image' | 'document' | 'system' | 'template';
  templateId?: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface BulkMessageInput {
  hotelId: string;
  guestIds: string[];
  subject?: string;
  content: string;
  type?: 'announcement' | 'promotion' | 'reminder' | 'survey';
  scheduleTime?: Date;
}
