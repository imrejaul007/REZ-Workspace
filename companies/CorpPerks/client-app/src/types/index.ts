// ==========================================
// CorpPerks Client App - Type Definitions
// ==========================================

// Client Types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyId: string;
  avatar?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  contractStartDate: string;
  contractEndDate: string;
  status: 'active' | 'inactive' | 'prospect';
}

// Project Types
export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string;
  status: 'active' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  progress: number;
  teamMembers: ProjectTeamMember[];
  milestones: Milestone[];
  tasks: ProjectTask[];
  documents: ProjectDocument[];
  totalHours: number;
  billableHours: number;
  lastUpdated: string;
}

export interface ProjectTeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  designation: string;
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  deliverables?: string[];
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

// Invoice Types
export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'settled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  paymentMethod?: string;
  transactionId?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  hours?: number;
  serviceType?: string;
}

// Message Types
export interface Conversation {
  id: string;
  projectId?: string;
  projectName?: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'client' | 'team_member' | 'account_manager';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  attachments?: MessageAttachment[];
  timestamp: string;
  readBy: string[];
  isRead: boolean;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

// Dashboard Types
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pendingInvoices: number;
  totalRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  upcomingDeadlines: UpcomingDeadline[];
  recentActivity: Activity[];
  monthlyRevenue: MonthlyRevenue[];
}

export interface UpcomingDeadline {
  id: string;
  type: 'milestone' | 'invoice' | 'project_end';
  title: string;
  date: string;
  projectId?: string;
  projectName?: string;
}

export interface Activity {
  id: string;
  type: 'project_update' | 'invoice_sent' | 'invoice_paid' | 'message_received' | 'task_completed' | 'milestone_reached';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  amount: number;
  invoices: number;
}

// API Response Types
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
  pageSize: number;
  hasMore: boolean;
}

// Navigation Types
export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Projects: undefined;
  Invoices: undefined;
  Messages: undefined;
};

export type ProjectStackParamList = {
  ProjectList: undefined;
  ProjectDetail: { projectId: string };
  ProjectTasks: { projectId: string };
  ProjectDocuments: { projectId: string };
};

export type InvoiceStackParamList = {
  InvoiceList: undefined;
  InvoiceDetail: { invoiceId: string };
};

export type MessageStackParamList = {
  ConversationList: undefined;
  Chat: { conversationId: string };
};
