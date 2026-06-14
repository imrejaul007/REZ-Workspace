// CRM Service API Client for PeopleOS

const API_BASE_URL = process.env.NEXT_PUBLIC_CRM_API_URL || 'http://localhost:4725/api';

// Types
export interface Client {
  _id: string;
  clientId: string;
  companyName: string;
  industry: string;
  website?: string;
  phone: string;
  email: string;
  address?: Address;
  contacts: Contact[];
  status: 'prospect' | 'active' | 'inactive' | 'churned';
  source: 'referral' | 'website' | 'linkedin' | 'cold_call' | 'event' | 'other';
  assignedTo: string;
  dealValue: number;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  isPrimary: boolean;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Deal {
  _id: string;
  dealId: string;
  title: string;
  description?: string;
  clientId: string;
  value: number;
  currency: 'INR' | 'USD';
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  probability: number;
  expectedClose: string;
  actualClose?: string;
  products: string[];
  owner: string;
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  activityId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'stage_change';
  title: string;
  description?: string;
  date: string;
  performedBy: string;
}

export interface Invoice {
  _id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  dealId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: 'INR' | 'USD';
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  tax?: number;
  total: number;
}

export interface Proposal {
  _id: string;
  proposalId: string;
  clientId: string;
  dealId?: string;
  title: string;
  content: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: 'INR' | 'USD';
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  stage: string;
  count: number;
  totalValue: number;
  deals: { dealId: string; title: string; value: number; probability: number }[];
}

export interface DashboardSummary {
  clientCount: number;
  activeDealsCount: number;
  openInvoicesCount: number;
  monthlyRevenue: number;
  monthlyDeals: number;
  pipeline: {
    totalValue: number;
    weightedValue: number;
    valueByStage: { stage: string; value: number; count: number }[];
  };
}

export interface RevenueAnalytics {
  totalRevenue: number;
  averageDealSize: number;
  totalDeals: number;
  revenueByMonth: { month: string; revenue: number }[];
  revenueByClient: { clientId: string; clientName: string; revenue: number }[];
}

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

// Helper function to get tenant ID
const getTenantId = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantId') || 'default';
  }
  return 'default';
};

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const tenantId = getTenantId();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Client API
export const clientApi = {
  list: (filters?: Record<string, string>) => {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return apiCall<PaginatedResponse<Client>>(`/clients${params}`);
  },

  get: (id: string) => apiCall<ApiResponse<Client>>(`/clients/${id}`),

  create: (data: Partial<Client>) =>
    apiCall<ApiResponse<Client>>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Client>) =>
    apiCall<ApiResponse<Client>>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  archive: (id: string) =>
    apiCall<ApiResponse<void>>(`/clients/${id}`, { method: 'DELETE' }),

  getContacts: (id: string) =>
    apiCall<ApiResponse<Contact[]>>(`/clients/${id}/contacts`),

  addContact: (id: string, data: Partial<Contact>) =>
    apiCall<ApiResponse<Client>>(`/clients/${id}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStats: (id: string) =>
    apiCall<ApiResponse<Record<string, unknown>>>(`/clients/${id}/stats`),
};

// Deal API
export const dealApi = {
  list: (filters?: Record<string, string>) => {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return apiCall<PaginatedResponse<Deal>>(`/deals${params}`);
  },

  get: (id: string) => apiCall<ApiResponse<Deal>>(`/deals/${id}`),

  create: (data: Partial<Deal>) =>
    apiCall<ApiResponse<Deal>>('/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Deal>) =>
    apiCall<ApiResponse<Deal>>(`/deals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  moveStage: (id: string, stage: string, lossReason?: string) =>
    apiCall<ApiResponse<Deal>>(`/deals/${id}/stage`, {
      method: 'POST',
      body: JSON.stringify({ stage, lossReason }),
    }),

  addActivity: (id: string, data: Partial<Activity>) =>
    apiCall<ApiResponse<Deal>>(`/deals/${id}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPipeline: () => apiCall<ApiResponse<PipelineStage[]>>('/deals/pipeline'),
};

// Invoice API
export const invoiceApi = {
  list: (filters?: Record<string, string>) => {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return apiCall<PaginatedResponse<Invoice>>(`/invoices${params}`);
  },

  get: (id: string) => apiCall<ApiResponse<Invoice>>(`/invoices/${id}`),

  create: (data: Partial<Invoice>) =>
    apiCall<ApiResponse<Invoice>>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Invoice>) =>
    apiCall<ApiResponse<Invoice>>(`/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  send: (id: string) =>
    apiCall<ApiResponse<Invoice>>(`/invoices/${id}/send`, { method: 'POST' }),

  markPaid: (id: string, paymentMethod?: string, paymentReference?: string) =>
    apiCall<ApiResponse<Invoice>>(`/invoices/${id}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, paymentReference }),
    }),

  cancel: (id: string) =>
    apiCall<ApiResponse<Invoice>>(`/invoices/${id}/cancel`, { method: 'POST' }),

  getOverdue: () => apiCall<ApiResponse<Invoice[]>>('/invoices/overdue'),
};

// Proposal API
export const proposalApi = {
  list: (filters?: Record<string, string>) => {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return apiCall<PaginatedResponse<Proposal>>(`/proposals${params}`);
  },

  get: (id: string) => apiCall<ApiResponse<Proposal>>(`/proposals/${id}`),

  create: (data: Partial<Proposal>) =>
    apiCall<ApiResponse<Proposal>>('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Proposal>) =>
    apiCall<ApiResponse<Proposal>>(`/proposals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  send: (id: string) =>
    apiCall<ApiResponse<Proposal>>(`/proposals/${id}/send`, { method: 'POST' }),

  accept: (id: string, signatureData: string) =>
    apiCall<ApiResponse<Proposal>>(`/proposals/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ signatureData }),
    }),

  reject: (id: string) =>
    apiCall<ApiResponse<Proposal>>(`/proposals/${id}/reject`, { method: 'POST' }),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => apiCall<ApiResponse<DashboardSummary>>('/analytics/dashboard'),

  getRevenue: (months?: number) =>
    apiCall<ApiResponse<RevenueAnalytics>>(
      `/analytics/revenue${months ? `?months=${months}` : ''}`
    ),

  getPipeline: () =>
    apiCall<ApiResponse<DashboardSummary['pipeline']>>('/analytics/pipeline'),

  getConversion: (months?: number) =>
    apiCall<ApiResponse<Record<string, unknown>>>(
      `/analytics/conversion${months ? `?months=${months}` : ''}`
    ),

  getForecasting: () => apiCall<ApiResponse<Record<string, unknown>>>('/analytics/forecasting'),
};

// Export all APIs
export const crmApi = {
  client: clientApi,
  deal: dealApi,
  invoice: invoiceApi,
  proposal: proposalApi,
  analytics: analyticsApi,
};

export default crmApi;
