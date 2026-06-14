// Support Portal Types

export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'hr_policy' | 'payroll' | 'benefits' | 'leave' | 'onboarding' | 'performance' | 'other';
export type MessageType = 'text' | 'image' | 'file' | 'system';
export type ChatStatus = 'online' | 'offline' | 'busy';
export type KnowledgeBaseCategory = 'policies' | 'procedures' | 'faq' | 'guides' | 'training';

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  avatar?: string;
  chatStatus: ChatStatus;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  employee: Employee;
  assignedTo?: Employee;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  slaDeadline?: Date;
  tags: string[];
  messages: TicketMessage[];
  attachments: Attachment[];
  satisfactionRating?: number;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: Employee;
  content: string;
  type: MessageType;
  createdAt: Date;
  isInternal: boolean;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ChatSession {
  id: string;
  employee: Employee;
  supportAgent: Employee;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'ended';
  messages: ChatMessage[];
  isTyping: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: Employee | 'agent';
  content: string;
  type: MessageType;
  createdAt: Date;
  isRead: boolean;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: KnowledgeBaseCategory;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
  author: Employee;
  isPublished: boolean;
  relatedArticles: string[];
}

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut: string;
  category: string;
}

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  avgResolutionTime: number;
  slaCompliance: number;
  avgCsat: number;
}

export interface ReportData {
  ticketsByStatus: Record<TicketStatus, number>;
  ticketsByPriority: Record<TicketPriority, number>;
  ticketsByCategory: Record<TicketCategory, number>;
  resolutionTimeTrend: Array<{ date: string; avgTime: number }>;
  volumeTrend: Array<{ date: string; count: number }>;
  agentPerformance: Array<{
    agent: Employee;
    ticketsResolved: number;
    avgResponseTime: number;
    avgResolutionTime: number;
  }>;
  categoryBreakdown: Array<{ category: TicketCategory; count: number; avgTime: number }>;
}

// Form schemas
export interface CreateTicketInput {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  employeeId: string;
  tags?: string[];
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
  tags?: string[];
}

export interface SendMessageInput {
  ticketId: string;
  content: string;
  type?: MessageType;
  isInternal?: boolean;
  attachments?: File[];
}

export interface ChatMessageInput {
  sessionId: string;
  content: string;
  type?: MessageType;
}
