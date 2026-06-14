// Client Portal Service Types

export interface ClientUser {
  id: string;
  clientId: string;
  email: string;
  password: string;
  companyName: string;
  contactName: string;
  phone: string;
  avatar?: string;
  role: 'admin' | 'member';
  createdAt: Date;
  lastLogin?: Date;
}

export interface ClientProject {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  progress: number;
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  currency: 'INR' | 'USD';
  milestones: Milestone[];
  team: TeamMember[];
  documents: Document[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  completionDate?: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ClientInvoice {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency: 'INR' | 'USD';
  status: 'pending' | 'paid' | 'overdue';
  dueDate: Date;
  paidDate?: Date;
  items: InvoiceItem[];
  pdfUrl?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ClientMessage {
  id: string;
  messageId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderType: 'client' | 'support';
  content: string;
  attachments: Document[];
  isRead: boolean;
  createdAt: Date;
}

export interface ClientDocument {
  id: string;
  documentId: string;
  name: string;
  type: 'contract' | 'invoice' | 'report' | 'proposal' | 'other';
  category: string;
  projectId?: string;
  projectName?: string;
  url: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ClientProfile {
  id: string;
  clientId: string;
  companyName: string;
  industry: string;
  website?: string;
  phone: string;
  email: string;
  address: Address;
  primaryContact: Contact;
  teamMembers: Contact[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  isPrimary: boolean;
}

export interface DashboardStats {
  clientName: string;
  activeProjects: number;
  pendingInvoices: number;
  unreadMessages: number;
  totalSpent: number;
  completedProjects: number;
  upcomingMilestones: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'project_update' | 'invoice_paid' | 'message_received' | 'document_uploaded';
  title: string;
  description: string;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<ClientUser, 'password'>;
}

export interface AuthenticatedRequest {
  userId: string;
  clientId: string;
  email: string;
}
