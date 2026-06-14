// ==========================================
// CorpPerks Client App - API Service
// ==========================================

import {
  Client,
  Project,
  Invoice,
  Conversation,
  Message,
  DashboardStats,
  ApiResponse,
} from '../types';

// API Base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4006';
const INTERNAL_TOKEN = process.env.EXPO_PUBLIC_INTERNAL_TOKEN || 'client-app-internal-token';

// ==========================================
// Mock Data for Development
// ==========================================

const mockClient: Client = {
  id: 'client-001',
  name: 'Rahul Mehta',
  email: 'rahul.mehta@techcorp.com',
  phone: '+91 98765 43210',
  companyName: 'TechCorp Solutions',
  companyId: 'comp-001',
  avatar: 'https://i.pravatar.cc/150?u=rahul',
  address: '123 Tech Park, Whitefield, Bangalore - 560066',
  gstin: '29AABCU9603R1ZM',
  pan: 'AABCU9603R',
  contractStartDate: '2025-01-01',
  contractEndDate: '2026-12-31',
  status: 'active',
};

const mockProjects: Project[] = [
  {
    id: 'proj-001',
    clientId: 'client-001',
    clientName: 'TechCorp Solutions',
    name: 'E-Commerce Platform Development',
    description: 'Building a modern e-commerce platform with React Native mobile app and Node.js backend',
    status: 'active',
    priority: 'high',
    startDate: '2026-01-15',
    endDate: '2026-08-15',
    budget: 2500000,
    spent: 1250000,
    progress: 50,
    totalHours: 800,
    billableHours: 720,
    lastUpdated: '2026-05-30T10:30:00',
    teamMembers: [
      {
        id: 'tm-001',
        name: 'Priya Sharma',
        email: 'priya@corpperks.com',
        avatar: 'https://i.pravatar.cc/150?u=priya',
        role: 'Project Manager',
        designation: 'Senior PM',
      },
      {
        id: 'tm-002',
        name: 'Vikram Rao',
        email: 'vikram@corpperks.com',
        avatar: 'https://i.pravatar.cc/150?u=vikram',
        role: 'Tech Lead',
        designation: 'Tech Lead',
      },
    ],
    milestones: [
      {
        id: 'ms-001',
        name: 'Phase 1: MVP Launch',
        description: 'Core shopping functionality',
        dueDate: '2026-04-15',
        status: 'completed',
        progress: 100,
      },
      {
        id: 'ms-002',
        name: 'Phase 2: Mobile App',
        description: 'iOS and Android apps',
        dueDate: '2026-06-30',
        status: 'in_progress',
        progress: 60,
      },
      {
        id: 'ms-003',
        name: 'Phase 3: Analytics Dashboard',
        description: 'Business intelligence features',
        dueDate: '2026-08-15',
        status: 'pending',
        progress: 0,
      },
    ],
    tasks: [
      {
        id: 'task-001',
        title: 'Implement payment gateway integration',
        assigneeId: 'tm-002',
        assigneeName: 'Vikram Rao',
        status: 'done',
        priority: 'high',
        dueDate: '2026-06-01',
        estimatedHours: 16,
        actualHours: 14,
      },
      {
        id: 'task-002',
        title: 'Design product catalog screens',
        assigneeId: 'tm-001',
        assigneeName: 'Priya Sharma',
        status: 'review',
        priority: 'medium',
        dueDate: '2026-06-05',
        estimatedHours: 12,
        actualHours: 10,
      },
    ],
    documents: [
      {
        id: 'doc-001',
        name: 'Technical Architecture.pdf',
        type: 'pdf',
        size: 2500000,
        uploadedBy: 'Vikram Rao',
        uploadedAt: '2026-01-20T14:00:00',
        url: '/docs/architecture.pdf',
      },
    ],
  },
  {
    id: 'proj-002',
    clientId: 'client-001',
    clientName: 'TechCorp Solutions',
    name: 'CRM Implementation',
    description: 'Custom CRM solution with sales automation and reporting',
    status: 'in_progress',
    priority: 'medium',
    startDate: '2026-03-01',
    endDate: '2026-09-30',
    budget: 1800000,
    spent: 450000,
    progress: 25,
    totalHours: 600,
    billableHours: 500,
    lastUpdated: '2026-05-29T16:00:00',
    teamMembers: [
      {
        id: 'tm-001',
        name: 'Priya Sharma',
        email: 'priya@corpperks.com',
        avatar: 'https://i.pravatar.cc/150?u=priya',
        role: 'Project Manager',
        designation: 'Senior PM',
      },
    ],
    milestones: [
      {
        id: 'ms-004',
        name: 'Requirements Analysis',
        description: 'Gather and document requirements',
        dueDate: '2026-04-30',
        status: 'completed',
        progress: 100,
      },
      {
        id: 'ms-005',
        name: 'Core Modules Development',
        description: 'Contact and deal management',
        dueDate: '2026-07-31',
        status: 'in_progress',
        progress: 35,
      },
    ],
    tasks: [],
    documents: [],
  },
  {
    id: 'proj-003',
    clientId: 'client-001',
    clientName: 'TechCorp Solutions',
    name: 'Website Redesign',
    description: 'Complete redesign of corporate website with modern UI/UX',
    status: 'completed',
    priority: 'low',
    startDate: '2025-10-01',
    endDate: '2026-02-28',
    budget: 800000,
    spent: 780000,
    progress: 100,
    totalHours: 400,
    billableHours: 380,
    lastUpdated: '2026-02-28T18:00:00',
    teamMembers: [],
    milestones: [],
    tasks: [],
    documents: [],
  },
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    clientId: 'client-001',
    clientName: 'TechCorp Solutions',
    projectId: 'proj-001',
    projectName: 'E-Commerce Platform Development',
    invoiceNumber: 'INV-2026-001',
    amount: 500000,
    tax: 90000,
    total: 590000,
    currency: 'INR',
    status: 'paid',
    issueDate: '2026-03-15',
    dueDate: '2026-04-15',
    paidDate: '2026-04-10',
    items: [
      {
        id: 'item-001',
        description: 'Mobile App Development - Phase 1',
        quantity: 1,
        rate: 400000,
        amount: 400000,
        serviceType: 'development',
      },
      {
        id: 'item-002',
        description: 'UI/UX Design',
        quantity: 1,
        rate: 100000,
        amount: 100000,
        serviceType: 'design',
      },
    ],
    notes: 'Thank you for your business!',
    paymentMethod: 'UPI',
    transactionId: 'TXN123456789',
  },
  {
    id: 'inv-002',
    clientId: 'client-001',
    clientName: 'TechCorp Solutions',
    projectId: 'proj-001',
    projectName: 'E-Commerce Platform Development',
    invoiceNumber: 'INV-2026-002',
    amount: 500000,
    tax: 90000,
    total: 590000,
    currency: 'INR',
    status: 'pending',
    issueDate: '2026-05-01',
    dueDate: '2026-06-01',
    items: [
      {
        id: 'item-003',
        description: 'Mobile App Development - Phase 2',
        quantity: 1,
        rate: 500000,
        amount: 500000,
        serviceType: 'development',
      },
    ],
  },
  {
    id: 'inv-003',
    clientId: 'client-001',
    clientName: 'TechCorp Solutions',
    projectId: 'proj-002',
    projectName: 'CRM Implementation',
    invoiceNumber: 'INV-2026-003',
    amount: 225000,
    tax: 40500,
    total: 265500,
    currency: 'INR',
    status: 'sent',
    issueDate: '2026-05-15',
    dueDate: '2026-06-15',
    items: [
      {
        id: 'item-004',
        description: 'Requirements Analysis & Planning',
        quantity: 1,
        rate: 225000,
        amount: 225000,
        serviceType: 'consulting',
      },
    ],
  },
  {
    id: 'inv-004',
    clientId: 'client-001',
    clientName: 'TechCorp Solutions',
    projectId: 'proj-003',
    projectName: 'Website Redesign',
    invoiceNumber: 'INV-2026-004',
    amount: 400000,
    tax: 72000,
    total: 472000,
    currency: 'INR',
    status: 'overdue',
    issueDate: '2026-02-01',
    dueDate: '2026-03-01',
    items: [
      {
        id: 'item-005',
        description: 'Website Development & Deployment',
        quantity: 1,
        rate: 400000,
        amount: 400000,
        serviceType: 'development',
      },
    ],
  },
];

const mockConversations: Conversation[] = [
  {
    id: 'conv-001',
    projectId: 'proj-001',
    projectName: 'E-Commerce Platform Development',
    participants: [
      {
        id: 'tm-001',
        name: 'Priya Sharma',
        email: 'priya@corpperks.com',
        avatar: 'https://i.pravatar.cc/150?u=priya',
        role: 'team_member',
      },
      {
        id: 'client-001',
        name: 'Rahul Mehta',
        email: 'rahul.mehta@techcorp.com',
        avatar: 'https://i.pravatar.cc/150?u=rahul',
        role: 'client',
      },
    ],
    lastMessage: {
      id: 'msg-003',
      conversationId: 'conv-001',
      senderId: 'client-001',
      senderName: 'Rahul Mehta',
      content: 'Can we schedule a call to discuss the mobile app timeline?',
      type: 'text',
      timestamp: '2026-05-30T09:30:00',
      readBy: ['client-001'],
      isRead: false,
    },
    unreadCount: 2,
    createdAt: '2026-01-15T10:00:00',
    updatedAt: '2026-05-30T09:30:00',
  },
  {
    id: 'conv-002',
    projectId: 'proj-002',
    projectName: 'CRM Implementation',
    participants: [
      {
        id: 'tm-001',
        name: 'Priya Sharma',
        email: 'priya@corpperks.com',
        avatar: 'https://i.pravatar.cc/150?u=priya',
        role: 'team_member',
      },
      {
        id: 'client-001',
        name: 'Rahul Mehta',
        email: 'rahul.mehta@techcorp.com',
        avatar: 'https://i.pravatar.cc/150?u=rahul',
        role: 'client',
      },
    ],
    lastMessage: {
      id: 'msg-005',
      conversationId: 'conv-002',
      senderId: 'tm-001',
      senderName: 'Priya Sharma',
      content: 'The requirements document is ready for your review.',
      type: 'text',
      timestamp: '2026-05-29T16:00:00',
      readBy: ['tm-001', 'client-001'],
      isRead: true,
    },
    unreadCount: 0,
    createdAt: '2026-03-01T10:00:00',
    updatedAt: '2026-05-29T16:00:00',
  },
];

const mockMessages: Record<string, Message[]> = {
  'conv-001': [
    {
      id: 'msg-001',
      conversationId: 'conv-001',
      senderId: 'tm-001',
      senderName: 'Priya Sharma',
      senderAvatar: 'https://i.pravatar.cc/150?u=priya',
      content: 'Hi Rahul! Phase 1 is now complete. The mobile app MVP is ready for testing.',
      type: 'text',
      timestamp: '2026-05-29T14:00:00',
      readBy: ['tm-001', 'client-001'],
      isRead: true,
    },
    {
      id: 'msg-002',
      conversationId: 'conv-001',
      senderId: 'client-001',
      senderName: 'Rahul Mehta',
      senderAvatar: 'https://i.pravatar.cc/150?u=rahul',
      content: 'Great to hear! I will review the app today.',
      type: 'text',
      timestamp: '2026-05-30T09:00:00',
      readBy: ['client-001'],
      isRead: true,
    },
    {
      id: 'msg-003',
      conversationId: 'conv-001',
      senderId: 'client-001',
      senderName: 'Rahul Mehta',
      senderAvatar: 'https://i.pravatar.cc/150?u=rahul',
      content: 'Can we schedule a call to discuss the mobile app timeline?',
      type: 'text',
      timestamp: '2026-05-30T09:30:00',
      readBy: ['client-001'],
      isRead: false,
    },
  ],
  'conv-002': [
    {
      id: 'msg-004',
      conversationId: 'conv-002',
      senderId: 'client-001',
      senderName: 'Rahul Mehta',
      senderAvatar: 'https://i.pravatar.cc/150?u=rahul',
      content: 'Can you send over the requirements document?',
      type: 'text',
      timestamp: '2026-05-29T15:00:00',
      readBy: ['client-001'],
      isRead: true,
    },
    {
      id: 'msg-005',
      conversationId: 'conv-002',
      senderId: 'tm-001',
      senderName: 'Priya Sharma',
      senderAvatar: 'https://i.pravatar.cc/150?u=priya',
      content: 'The requirements document is ready for your review.',
      type: 'text',
      timestamp: '2026-05-29T16:00:00',
      readBy: ['tm-001', 'client-001'],
      isRead: true,
    },
  ],
};

// ==========================================
// API Client Class
// ==========================================

class ApiService {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.token,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data || data };
      }

      return { success: false, error: data.message || 'Request failed' };
    } catch (error) {
      logger.error('API Error:', error);
      return { success: true, data: null as unknown as T };
    }
  }

  // Client APIs
  async getClient(): Promise<ApiResponse<Client>> {
    return { success: true, data: mockClient };
  }

  // Dashboard APIs
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const stats: DashboardStats = {
      totalProjects: 3,
      activeProjects: 2,
      completedProjects: 1,
      pendingInvoices: 2,
      totalRevenue: 2120000,
      outstandingAmount: 1327500,
      overdueAmount: 472000,
      upcomingDeadlines: [
        {
          id: 'deadline-001',
          type: 'milestone',
          title: 'Mobile App Beta Release',
          date: '2026-06-30',
          projectId: 'proj-001',
          projectName: 'E-Commerce Platform Development',
        },
        {
          id: 'deadline-002',
          type: 'invoice',
          title: 'Invoice #INV-2026-002 Due',
          date: '2026-06-01',
        },
      ],
      recentActivity: [
        {
          id: 'act-001',
          type: 'project_update',
          title: 'Phase 2 Development Started',
          description: 'Mobile app Phase 2 development has begun',
          timestamp: '2026-05-15T10:00:00',
          metadata: { projectId: 'proj-001' },
        },
        {
          id: 'act-002',
          type: 'invoice_paid',
          title: 'Invoice Paid',
          description: 'Invoice #INV-2026-001 has been paid',
          timestamp: '2026-04-10T14:30:00',
          metadata: { invoiceId: 'inv-001' },
        },
        {
          id: 'act-003',
          type: 'message_received',
          title: 'New Message',
          description: 'Priya Sharma sent you a message',
          timestamp: '2026-05-29T14:00:00',
        },
      ],
      monthlyRevenue: [
        { month: 'Jan', year: 2026, amount: 0, invoices: 0 },
        { month: 'Feb', year: 2026, amount: 472000, invoices: 1 },
        { month: 'Mar', year: 2026, amount: 590000, invoices: 1 },
        { month: 'Apr', year: 2026, amount: 0, invoices: 0 },
        { month: 'May', year: 2026, amount: 855500, invoices: 2 },
        { month: 'Jun', year: 2026, amount: 0, invoices: 0 },
      ],
    };
    return { success: true, data: stats };
  }

  // Project APIs
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return { success: true, data: mockProjects };
  }

  async getProject(projectId: string): Promise<ApiResponse<Project | undefined>> {
    const project = mockProjects.find((p) => p.id === projectId);
    return { success: true, data: project };
  }

  // Invoice APIs
  async getInvoices(status?: string): Promise<ApiResponse<Invoice[]>> {
    if (status) {
      return {
        success: true,
        data: mockInvoices.filter((inv) => inv.status === status),
      };
    }
    return { success: true, data: mockInvoices };
  }

  async getInvoice(invoiceId: string): Promise<ApiResponse<Invoice | undefined>> {
    const invoice = mockInvoices.find((inv) => inv.id === invoiceId);
    return { success: true, data: invoice };
  }

  // Message APIs
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return { success: true, data: mockConversations };
  }

  async getMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    return {
      success: true,
      data: mockMessages[conversationId] || [],
    };
  }

  async sendMessage(
    conversationId: string,
    content: string
  ): Promise<ApiResponse<Message>> {
    const message: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: 'client-001',
      senderName: 'Rahul Mehta',
      senderAvatar: 'https://i.pravatar.cc/150?u=rahul',
      content,
      type: 'text',
      timestamp: new Date().toISOString(),
      readBy: ['client-001'],
      isRead: false,
    };
    return { success: true, data: message };
  }
}

// Export singleton instance
export const api = new ApiService(API_BASE_URL, INTERNAL_TOKEN);
export default api;
