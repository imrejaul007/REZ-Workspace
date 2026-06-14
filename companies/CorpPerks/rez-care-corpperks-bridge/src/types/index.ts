import { z } from 'zod';

// ============= ID Generation =
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}${random}`.toUpperCase();
}

export const generateTicketId = () => generateId('TICKET');
export const generateMessageId = () => generateId('MSG');
export const generateSessionId = () => generateId('SESSION');

// ============= Support Ticket =
export type TicketStatus = 'open' | 'in_progress' | 'pending_customer' | 'resolved' | 'closed' | 'escalated';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';
export type TicketCategory = 'benefits' | 'enrollment' | 'claims' | 'payroll' | 'hr_policy' | 'technical' | 'feedback' | 'other';
export type TicketSource = 'app' | 'chat' | 'whatsapp' | 'email' | 'phone' | 'chatbot';

export interface TicketAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface TicketComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'employee' | 'agent' | 'bot';
  content: string;
  attachments: TicketAttachment[];
  isInternal: boolean;
  createdAt: Date;
}

export interface ITicket {
  ticketId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  companyId: string;
  department?: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  source: TicketSource;
  subject: string;
  description: string;
  attachments: TicketAttachment[];
  comments: TicketComment[];
  assignedTo?: string;
  assignedToName?: string;
  resolution?: string;
  slaDeadline?: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  tags: string[];
  metadata?: Record<string, unknown>;
  satisfactionRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTicketDTO {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  companyId: string;
  department?: string;
  category: TicketCategory;
  priority?: TicketPriority;
  source?: TicketSource;
  subject: string;
  description: string;
  attachments?: TicketAttachment[];
  tags?: string[];
}

export interface UpdateTicketDTO {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  assignedToName?: string;
  tags?: string[];
  resolution?: string;
}

export interface AddCommentDTO {
  authorId: string;
  authorName: string;
  authorRole: 'employee' | 'agent' | 'bot';
  content: string;
  attachments?: TicketAttachment[];
  isInternal?: boolean;
}

// ============= WhatsApp Support =
export type WhatsAppSessionStatus = 'active' | 'idle' | 'closed';

export interface WhatsAppSession {
  id: string;
  sessionId: string;
  employeeId: string;
  employeeName: string;
  companyId: string;
  phoneNumber: string;
  status: WhatsAppSessionStatus;
  lastMessageAt?: Date;
  messageCount: number;
  createdAt: Date;
  closedAt?: Date;
}

export interface WhatsAppMessage {
  id: string;
  sessionId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: Record<string, unknown>;
}

// ============= Support Analytics =
export interface TicketMetrics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  escalated: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  firstResponseTime: number;
  satisfactionScore?: number;
}

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  ticketsAssigned: number;
  ticketsResolved: number;
  avgResolutionTime: number;
  avgResponseTime: number;
  satisfactionScore?: number;
}

// ============= API Response =
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============= Validation Schemas =
export const createTicketSchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  employeeEmail: z.string().email(),
  companyId: z.string().min(1),
  department: z.string().optional(),
  category: z.enum(['benefits', 'enrollment', 'claims', 'payroll', 'hr_policy', 'technical', 'feedback', 'other']),
  priority: z.enum(['low', 'normal', 'high', 'urgent', 'critical']).optional().default('normal'),
  source: z.enum(['app', 'chat', 'whatsapp', 'email', 'phone', 'chatbot']).optional().default('app'),
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    url: z.string(),
    mimeType: z.string(),
    size: z.number(),
  })).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'pending_customer', 'resolved', 'closed', 'escalated']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent', 'critical']).optional(),
  assignedTo: z.string().optional(),
  assignedToName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  resolution: z.string().optional(),
});

export const addCommentSchema = z.object({
  authorId: z.string().min(1),
  authorName: z.string().min(1),
  authorRole: z.enum(['employee', 'agent', 'bot']),
  content: z.string().min(1).max(5000),
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    url: z.string(),
    mimeType: z.string(),
    size: z.number(),
  })).optional(),
  isInternal: z.boolean().optional().default(false),
});

export const ticketQuerySchema = z.object({
  companyId: z.string().min(1),
  employeeId: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'pending_customer', 'resolved', 'closed', 'escalated']).optional(),
  category: z.enum(['benefits', 'enrollment', 'claims', 'payroll', 'hr_policy', 'technical', 'feedback', 'other']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent', 'critical']).optional(),
  assignedTo: z.string().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
});
