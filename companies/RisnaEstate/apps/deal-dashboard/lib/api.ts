const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  deals: {
    list: (params?: { stage?: string; broker?: string; search?: string; page?: number; limit?: number }) =>
      fetchApi<{ deals: Deal[]; total: number; page: number; totalPages: number }>('/api/v1/deals', { params }),
    get: (id: string) => fetchApi<Deal>(`/api/v1/deals/${id}`),
    create: (data: Partial<Deal>) =>
      fetchApi<Deal>('/api/v1/deals', { method: 'POST', body: JSON.stringify(data) }),
    updateStage: (id: string, stage: string) =>
      fetchApi<Deal>(`/api/v1/deals/${id}/stage`, { method: 'POST', body: JSON.stringify({ stage }) }),
    update: (id: string, data: Partial<Deal>) =>
      fetchApi<Deal>(`/api/v1/deals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  agreements: {
    list: (params?: { status?: string }) =>
      fetchApi<{ agreements: Agreement[]; total: number }>('/api/v1/agreements', { params }),
    get: (id: string) => fetchApi<Agreement>(`/api/v1/agreements/${id}`),
    generate: (id: string) =>
      fetchApi<{ url: string }>(`/api/v1/agreements/${id}/generate`, { method: 'POST' }),
  },
  handovers: {
    list: (params?: { status?: string }) =>
      fetchApi<{ handovers: Handover[]; total: number }>('/api/v1/handovers', { params }),
    get: (id: string) => fetchApi<Handover>(`/api/v1/handovers/${id}`),
    complete: (id: string) =>
      fetchApi<Handover>(`/api/v1/handovers/${id}/complete`, { method: 'POST' }),
    updateChecklist: (id: string, checklist: HandoverChecklistItem[]) =>
      fetchApi<Handover>(`/api/v1/handovers/${id}/checklist`, {
        method: 'PATCH',
        body: JSON.stringify({ checklist }),
      }),
  },
  stats: {
    dashboard: () => fetchApi<DashboardStats>('/api/v1/stats/dashboard'),
    pipeline: () => fetchApi<PipelineStats[]>('/api/v1/stats/pipeline'),
  },
};

// Type definitions
export interface Deal {
  id: string;
  dealId: string;
  property: {
    id: string;
    name: string;
    address: string;
    type: string;
    image?: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  broker: {
    id: string;
    name: string;
    phone: string;
  };
  stage: DealStage;
  value: number;
  agreedValue?: number;
  createdAt: string;
  updatedAt: string;
  activities: Activity[];
  offers: Offer[];
  paymentMilestones: PaymentMilestone[];
  handover?: {
    id: string;
    scheduledDate?: string;
    status: string;
  };
}

export type DealStage =
  | 'inquiry'
  | 'site_visit'
  | 'offer'
  | 'negotiation'
  | 'agreement'
  | 'registry'
  | 'closed';

export interface Activity {
  id: string;
  type: 'stage_change' | 'note' | 'call' | 'meeting' | 'offer' | 'payment';
  description: string;
  createdAt: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export interface Offer {
  id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  createdAt: string;
  validUntil?: string;
  notes?: string;
}

export interface PaymentMilestone {
  id: string;
  name: string;
  amount: number;
  dueDate?: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Agreement {
  id: string;
  dealId: string;
  deal?: Deal;
  type: 'sale' | 'rent' | 'loan';
  status: 'draft' | 'pending_signatures' | 'registered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  signedAt?: string;
  registeredAt?: string;
  documentUrl?: string;
}

export interface Handover {
  id: string;
  dealId: string;
  deal?: Deal;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  checklist: HandoverChecklistItem[];
  notes?: string;
}

export interface HandoverChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface DashboardStats {
  totalDeals: number;
  totalValue: number;
  conversionRate: number;
  dealsByStage: Record<DealStage, number>;
  recentActivity: Activity[];
  monthlyStats: {
    dealsClosed: number;
    valueClosed: number;
    newDeals: number;
  };
}

export interface PipelineStats {
  stage: DealStage;
  count: number;
  value: number;
}
