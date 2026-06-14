// Client Portal Types

export interface ClientUser {
  id: string;
  clientId: string;
  email: string;
  companyName: string;
  contactName: string;
  phone: string;
  avatar?: string;
  role: 'admin' | 'member';
  createdAt: string;
  lastLogin?: string;
}

export interface ClientProject {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  progress: number;
  startDate: string;
  endDate: string;
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
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  completionDate?: string;
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
  uploadedAt: string;
  uploadedBy: string;
}

export interface ClientInvoice {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency: 'INR' | 'USD';
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  paidDate?: string;
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
  createdAt: string;
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
  uploadedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: ClientUser;
}
