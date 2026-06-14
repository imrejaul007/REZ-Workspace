import {
  ClientUser,
  ClientProject,
  ClientInvoice,
  ClientMessage,
  ClientDocument,
  ClientProfile,
  DashboardStats,
  Activity,
} from '../types/index.js';

// Mock Users (demo client accounts)
export const mockUsers: ClientUser[] = [
  {
    id: 'usr-001',
    clientId: 'clt-001',
    email: 'demo@corpperks.com',
    password: '$2a$10$XQxBtMLOqK8vQZ7pQZ7QZ.ABC123xyz', // "demo123" - hashed
    companyName: 'Acme Corporation',
    contactName: 'John Smith',
    phone: '+91 98765 43210',
    role: 'admin',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date('2024-05-28'),
  },
  {
    id: 'usr-002',
    clientId: 'clt-002',
    email: 'tech@globex.io',
    password: '$2a$10$YQyBtMLOqK8vQZ7pQZ7QZ.ABC123xyz', // "tech123"
    companyName: 'Globex Technologies',
    contactName: 'Sarah Chen',
    phone: '+91 99876 54321',
    role: 'admin',
    createdAt: new Date('2024-02-20'),
    lastLogin: new Date('2024-05-27'),
  },
  {
    id: 'usr-003',
    clientId: 'clt-003',
    email: 'hello@startupx.in',
    password: '$2a$10$ZRyBtMLOqK8vQZ7pQZ7QZ.ABC123xyz', // "startup123"
    companyName: 'StartupX India',
    contactName: 'Raj Patel',
    phone: '+91 91234 56789',
    role: 'member',
    createdAt: new Date('2024-03-10'),
  },
];

// Mock Projects
export const mockProjects: ClientProject[] = [
  {
    id: 'prj-001',
    projectId: 'PRJ-ACME-001',
    name: 'Employee Onboarding Platform',
    description: 'Custom onboarding portal with automated workflows and document management',
    status: 'in_progress',
    progress: 72,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-06-30'),
    budget: 2500000,
    spent: 1800000,
    currency: 'INR',
    milestones: [
      { id: 'ms-001', name: 'Requirements Gathering', description: 'Initial requirements collection', dueDate: new Date('2024-03-15'), status: 'completed', completionDate: new Date('2024-03-14') },
      { id: 'ms-002', name: 'Design Phase', description: 'UI/UX design and prototyping', dueDate: new Date('2024-04-01'), status: 'completed', completionDate: new Date('2024-04-03') },
      { id: 'ms-003', name: 'Development Sprint 1', description: 'Core features development', dueDate: new Date('2024-05-15'), status: 'completed', completionDate: new Date('2024-05-12') },
      { id: 'ms-004', name: 'Development Sprint 2', description: 'Advanced features', dueDate: new Date('2024-06-01'), status: 'in_progress', dueDate: new Date('2024-06-01') },
      { id: 'ms-005', name: 'QA & Testing', description: 'Quality assurance and testing', dueDate: new Date('2024-06-15'), status: 'pending' },
      { id: 'ms-006', name: 'Deployment', description: 'Production deployment', dueDate: new Date('2024-06-30'), status: 'pending' },
    ],
    team: [
      { id: 'tm-001', name: 'Priya Sharma', email: 'priya@corpperks.com', role: 'Project Manager' },
      { id: 'tm-002', name: 'Amit Kumar', email: 'amit@corpperks.com', role: 'Lead Developer' },
      { id: 'tm-003', name: 'Neha Gupta', email: 'neha@corpperks.com', role: 'UI/UX Designer' },
      { id: 'tm-004', name: 'Vikram Singh', email: 'vikram@corpperks.com', role: 'QA Engineer' },
    ],
    documents: [
      { id: 'doc-001', name: 'Project Proposal.pdf', type: 'application/pdf', url: '/documents/prj-001/proposal.pdf', size: 2048576, uploadedAt: new Date('2024-03-01'), uploadedBy: 'Priya Sharma' },
      { id: 'doc-002', name: 'SRS Document.pdf', type: 'application/pdf', url: '/documents/prj-001/srs.pdf', size: 3145728, uploadedAt: new Date('2024-03-10'), uploadedBy: 'Amit Kumar' },
      { id: 'doc-003', name: 'UI Mockups.zip', type: 'application/zip', url: '/documents/prj-001/mockups.zip', size: 15728640, uploadedAt: new Date('2024-03-25'), uploadedBy: 'Neha Gupta' },
    ],
  },
  {
    id: 'prj-002',
    projectId: 'PRJ-ACME-002',
    name: 'HR Analytics Dashboard',
    description: 'Real-time HR metrics and analytics dashboard with AI-powered insights',
    status: 'review',
    progress: 95,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-05-31'),
    budget: 1800000,
    spent: 1710000,
    currency: 'INR',
    milestones: [
      { id: 'ms-101', name: 'Data Integration', description: 'Connect to HR systems', dueDate: new Date('2024-03-01'), status: 'completed', completionDate: new Date('2024-02-28') },
      { id: 'ms-102', name: 'Dashboard Development', description: 'Build analytics views', dueDate: new Date('2024-04-15'), status: 'completed', completionDate: new Date('2024-04-10') },
      { id: 'ms-103', name: 'AI Insights Engine', description: 'Implement ML models', dueDate: new Date('2024-05-10'), status: 'completed', completionDate: new Date('2024-05-08') },
      { id: 'ms-104', name: 'Client Review', description: 'Final review and feedback', dueDate: new Date('2024-05-31'), status: 'in_progress' },
    ],
    team: [
      { id: 'tm-005', name: 'Rajesh Verma', email: 'rajesh@corpperks.com', role: 'Technical Lead' },
      { id: 'tm-006', name: 'Pooja Reddy', email: 'pooja@corpperks.com', role: 'Data Analyst' },
      { id: 'tm-007', name: 'Suresh Iyer', email: 'suresh@corpperks.com', role: 'ML Engineer' },
    ],
    documents: [
      { id: 'doc-101', name: 'Technical Architecture.pdf', type: 'application/pdf', url: '/documents/prj-002/architecture.pdf', size: 4194304, uploadedAt: new Date('2024-02-15'), uploadedBy: 'Rajesh Verma' },
      { id: 'doc-102', name: 'ML Model Documentation.pdf', type: 'application/pdf', url: '/documents/prj-002/ml-docs.pdf', size: 2097152, uploadedAt: new Date('2024-04-20'), uploadedBy: 'Suresh Iyer' },
    ],
  },
  {
    id: 'prj-003',
    projectId: 'PRJ-ACME-003',
    name: 'Mobile App - Employee Self-Service',
    description: 'Native mobile application for employee self-service features',
    status: 'planning',
    progress: 15,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-09-30'),
    budget: 3200000,
    spent: 480000,
    currency: 'INR',
    milestones: [
      { id: 'ms-201', name: 'Project Kickoff', description: 'Initial planning meeting', dueDate: new Date('2024-06-05'), status: 'completed', completionDate: new Date('2024-06-03') },
      { id: 'ms-202', name: 'Requirements Definition', description: 'Detailed requirements gathering', dueDate: new Date('2024-06-20'), status: 'in_progress' },
      { id: 'ms-203', name: 'Design Phase', description: 'UI/UX and prototyping', dueDate: new Date('2024-07-10'), status: 'pending' },
      { id: 'ms-204', name: 'iOS Development', description: 'iOS app development', dueDate: new Date('2024-08-15'), status: 'pending' },
      { id: 'ms-205', name: 'Android Development', description: 'Android app development', dueDate: new Date('2024-08-30'), status: 'pending' },
      { id: 'ms-206', name: 'App Store Submission', description: 'Submit to app stores', dueDate: new Date('2024-09-30'), status: 'pending' },
    ],
    team: [
      { id: 'tm-001', name: 'Priya Sharma', email: 'priya@corpperks.com', role: 'Project Manager' },
      { id: 'tm-008', name: 'Arjun Nair', email: 'arjun@corpperks.com', role: 'iOS Developer' },
      { id: 'tm-009', name: 'Meera Joshi', email: 'meera@corpperks.com', role: 'Android Developer' },
    ],
    documents: [
      { id: 'doc-201', name: 'Project Charter.pdf', type: 'application/pdf', url: '/documents/prj-003/charter.pdf', size: 1048576, uploadedAt: new Date('2024-06-01'), uploadedBy: 'Priya Sharma' },
    ],
  },
];

// Mock Invoices
export const mockInvoices: ClientInvoice[] = [
  {
    id: 'inv-001',
    invoiceId: 'INV-ACME-2024-001',
    invoiceNumber: 'INV-ACME-2024-001',
    amount: 500000,
    currency: 'INR',
    status: 'paid',
    dueDate: new Date('2024-04-15'),
    paidDate: new Date('2024-04-12'),
    items: [
      { description: 'Project Management - Month 1', quantity: 1, unitPrice: 150000, total: 150000 },
      { description: 'Design Services', quantity: 40, unitPrice: 5000, total: 200000 },
      { description: 'Development Services', quantity: 30, unitPrice: 5000, total: 150000 },
    ],
    pdfUrl: '/invoices/INV-ACME-2024-001.pdf',
  },
  {
    id: 'inv-002',
    invoiceId: 'INV-ACME-2024-002',
    invoiceNumber: 'INV-ACME-2024-002',
    amount: 750000,
    currency: 'INR',
    status: 'paid',
    dueDate: new Date('2024-05-15'),
    paidDate: new Date('2024-05-10'),
    items: [
      { description: 'Project Management - Month 2', quantity: 1, unitPrice: 150000, total: 150000 },
      { description: 'Development Sprint 1', quantity: 1, unitPrice: 600000, total: 600000 },
    ],
    pdfUrl: '/invoices/INV-ACME-2024-002.pdf',
  },
  {
    id: 'inv-003',
    invoiceId: 'INV-ACME-2024-003',
    invoiceNumber: 'INV-ACME-2024-003',
    amount: 550000,
    currency: 'INR',
    status: 'pending',
    dueDate: new Date('2024-06-15'),
    items: [
      { description: 'Project Management - Month 3', quantity: 1, unitPrice: 150000, total: 150000 },
      { description: 'Development Sprint 2', quantity: 1, unitPrice: 400000, total: 400000 },
    ],
    pdfUrl: '/invoices/INV-ACME-2024-003.pdf',
  },
  {
    id: 'inv-004',
    invoiceId: 'INV-ACME-2024-004',
    invoiceNumber: 'INV-ACME-2024-004',
    amount: 350000,
    currency: 'INR',
    status: 'pending',
    dueDate: new Date('2024-06-30'),
    items: [
      { description: 'HR Analytics - Phase 1 Completion', quantity: 1, unitPrice: 350000, total: 350000 },
    ],
    pdfUrl: '/invoices/INV-ACME-2024-004.pdf',
  },
  {
    id: 'inv-005',
    invoiceId: 'INV-GLOBEX-2024-001',
    invoiceNumber: 'INV-GLOBEX-2024-001',
    amount: 200000,
    currency: 'INR',
    status: 'overdue',
    dueDate: new Date('2024-04-30'),
    items: [
      { description: 'Consulting Services - April', quantity: 1, unitPrice: 200000, total: 200000 },
    ],
    pdfUrl: '/invoices/INV-GLOBEX-2024-001.pdf',
  },
];

// Mock Messages
export const mockMessages: ClientMessage[] = [
  {
    id: 'msg-001',
    messageId: 'MSG-001',
    senderId: 'usr-001',
    senderName: 'John Smith',
    senderType: 'client',
    content: 'Hi team, wanted to check on the progress of the onboarding platform. Are we on track for the June deadline?',
    attachments: [],
    isRead: true,
    createdAt: new Date('2024-05-25T10:30:00'),
  },
  {
    id: 'msg-002',
    messageId: 'MSG-002',
    senderId: 'tm-001',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://i.pravatar.cc/150?u=priya',
    senderType: 'support',
    content: 'Hi John! Yes, we are on track. Development Sprint 2 is progressing well at 80% completion. QA starts next week as planned.',
    attachments: [],
    isRead: true,
    createdAt: new Date('2024-05-25T11:15:00'),
  },
  {
    id: 'msg-003',
    messageId: 'MSG-003',
    senderId: 'tm-001',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://i.pravatar.cc/150?u=priya',
    senderType: 'support',
    content: 'I have uploaded the latest sprint report to the project documents section. Please review and let us know if you have any questions.',
    attachments: [
      { id: 'att-001', name: 'Sprint-4-Report.pdf', type: 'application/pdf', url: '/documents/sprint-4-report.pdf', size: 1048576, uploadedAt: new Date('2024-05-25'), uploadedBy: 'Priya Sharma' },
    ],
    isRead: true,
    createdAt: new Date('2024-05-25T11:20:00'),
  },
  {
    id: 'msg-004',
    messageId: 'MSG-004',
    senderId: 'usr-001',
    senderName: 'John Smith',
    senderType: 'client',
    content: 'Great! I will review the report. One quick question - will the mobile-responsive version be included in the initial launch?',
    attachments: [],
    isRead: true,
    createdAt: new Date('2024-05-26T09:00:00'),
  },
  {
    id: 'msg-005',
    messageId: 'MSG-005',
    senderId: 'tm-002',
    senderName: 'Amit Kumar',
    senderAvatar: 'https://i.pravatar.cc/150?u=amit',
    senderType: 'support',
    content: 'Hi John! Yes, the mobile-responsive design is part of the core requirements and will be included in the June 30th launch. We have been implementing responsive layouts throughout development.',
    attachments: [],
    isRead: false,
    createdAt: new Date('2024-05-26T10:30:00'),
  },
];

// Mock Documents
export const mockDocuments: ClientDocument[] = [
  {
    id: 'cdoc-001',
    documentId: 'DOC-CONTRACT-001',
    name: 'Master Service Agreement',
    type: 'contract',
    category: 'Legal',
    url: '/documents/contracts/msa-acme.pdf',
    size: 524288,
    uploadedAt: new Date('2024-01-10'),
    uploadedBy: 'CorpPerks Legal',
  },
  {
    id: 'cdoc-002',
    documentId: 'DOC-PROPOSAL-001',
    name: 'Employee Onboarding Platform Proposal',
    type: 'proposal',
    category: 'Project',
    projectId: 'prj-001',
    projectName: 'Employee Onboarding Platform',
    url: '/documents/proposals/onboarding-proposal.pdf',
    size: 2097152,
    uploadedAt: new Date('2024-02-15'),
    uploadedBy: 'Sales Team',
  },
  {
    id: 'cdoc-003',
    documentId: 'DOC-INV-001',
    name: 'Invoice - March 2024',
    type: 'invoice',
    category: 'Billing',
    url: '/documents/invoices/INV-ACME-2024-001.pdf',
    size: 104857,
    uploadedAt: new Date('2024-04-01'),
    uploadedBy: 'Finance Team',
  },
  {
    id: 'cdoc-004',
    documentId: 'DOC-INV-002',
    name: 'Invoice - April 2024',
    type: 'invoice',
    category: 'Billing',
    url: '/documents/invoices/INV-ACME-2024-002.pdf',
    size: 104857,
    uploadedAt: new Date('2024-05-01'),
    uploadedBy: 'Finance Team',
  },
  {
    id: 'cdoc-005',
    documentId: 'DOC-REPORT-001',
    name: 'Q1 2024 Project Status Report',
    type: 'report',
    category: 'Reports',
    url: '/documents/reports/q1-2024-status.pdf',
    size: 3145728,
    uploadedAt: new Date('2024-04-15'),
    uploadedBy: 'Project Management',
  },
  {
    id: 'cdoc-006',
    documentId: 'DOC-PROPOSAL-002',
    name: 'HR Analytics Dashboard Proposal',
    type: 'proposal',
    category: 'Project',
    projectId: 'prj-002',
    projectName: 'HR Analytics Dashboard',
    url: '/documents/proposals/hr-analytics-proposal.pdf',
    size: 1572864,
    uploadedAt: new Date('2024-01-20'),
    uploadedBy: 'Sales Team',
  },
];

// Mock Profile
export const mockProfiles: Record<string, ClientProfile> = {
  'clt-001': {
    id: 'prof-001',
    clientId: 'clt-001',
    companyName: 'Acme Corporation',
    industry: 'Technology',
    website: 'https://acme-corp.com',
    phone: '+91 98765 43210',
    email: 'contact@acme-corp.com',
    address: {
      street: '123 Tech Park, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      postalCode: '201301',
      country: 'India',
    },
    primaryContact: {
      id: 'ct-001',
      name: 'John Smith',
      email: 'john.smith@acme-corp.com',
      phone: '+91 98765 43210',
      designation: 'Chief Technology Officer',
      isPrimary: true,
    },
    teamMembers: [
      { id: 'ct-001', name: 'John Smith', email: 'john.smith@acme-corp.com', phone: '+91 98765 43210', designation: 'CTO', isPrimary: true },
      { id: 'ct-002', name: 'Emily Davis', email: 'emily.davis@acme-corp.com', phone: '+91 98765 43211', designation: 'HR Director', isPrimary: false },
      { id: 'ct-003', name: 'Michael Brown', email: 'michael.brown@acme-corp.com', phone: '+91 98765 43212', designation: 'Procurement Manager', isPrimary: false },
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-05-20'),
  },
};

// Mock Dashboard Stats
export const mockDashboardStats: Record<string, DashboardStats> = {
  'clt-001': {
    clientName: 'Acme Corporation',
    activeProjects: 3,
    pendingInvoices: 2,
    unreadMessages: 1,
    totalSpent: 3990000,
    completedProjects: 12,
    upcomingMilestones: 4,
    recentActivity: [
      { id: 'act-001', type: 'project_update', title: 'Sprint 4 Completed', description: 'Development Sprint 2 is 80% complete', timestamp: new Date('2024-05-25T17:00:00') },
      { id: 'act-002', type: 'message_received', title: 'New Message from Amit', description: 'Re: Mobile-responsive version', timestamp: new Date('2024-05-26T10:30:00') },
      { id: 'act-003', type: 'document_uploaded', title: 'Sprint Report Uploaded', description: 'Sprint-4-Report.pdf shared by Priya', timestamp: new Date('2024-05-25T11:20:00') },
      { id: 'act-004', type: 'invoice_paid', title: 'Invoice Paid', description: 'INV-ACME-2024-002 for ₹7,50,000', timestamp: new Date('2024-05-10T14:30:00') },
    ],
  },
};

// Helper to get client data by email
export function getUserByEmail(email: string): ClientUser | undefined {
  return mockUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
}

export function getProjectsByClientId(clientId: string): ClientProject[] {
  // In production, filter by actual clientId
  if (clientId === 'clt-001') {
    return mockProjects;
  }
  return [];
}

export function getInvoicesByClientId(clientId: string): ClientInvoice[] {
  if (clientId === 'clt-001') {
    return mockInvoices;
  }
  return mockInvoices.filter(inv => inv.invoiceId.includes('GLOBEX'));
}

export function getMessagesByClientId(clientId: string): ClientMessage[] {
  if (clientId === 'clt-001') {
    return mockMessages;
  }
  return [];
}

export function getDocumentsByClientId(clientId: string): ClientDocument[] {
  if (clientId === 'clt-001') {
    return mockDocuments;
  }
  return [];
}

export function getProfileByClientId(clientId: string): ClientProfile | undefined {
  return mockProfiles[clientId];
}

export function getDashboardStatsByClientId(clientId: string): DashboardStats | undefined {
  return mockDashboardStats[clientId];
}
