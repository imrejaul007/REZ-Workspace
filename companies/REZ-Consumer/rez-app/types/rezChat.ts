// Chat types — stubbed until @rez/chat is installed as a package
// Re-export from local types until the package is available

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'support';
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
};

export type Conversation = {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  createdAt: Date;
};

export type SupportTicket = {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
};
