import { logger } from '../logger';
// Frontend API Client - Extended with Booking

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('risna_token') : '';

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// =============================================
// PROPERTY API
// =============================================

export const propertyApi = {
  list: (params?: { type?: string; city?: string; minPrice?: number; maxPrice?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ properties: any[]; total: number }>(`/api/v1/properties${query ? `?${query}` : ''}`);
  },

  get: (id: string) => request<{ property: any }>(`/api/v1/properties/${id}`),

  search: (query: string) => request<{ properties: any[] }>(`/api/v1/properties/search?q=${encodeURIComponent(query)}`),

  featured: () => request<{ properties: any[] }>('/api/v1/properties/featured'),
};

// =============================================
// BOOKING API
// =============================================

export const bookingApi = {
  create: (data: { propertyId: string; userId: string; unitId?: string; referralCode?: string }) => {
    return request<{ success: boolean; booking: any }>('/api/v1/bookings', {
      method: 'POST',
      body: data,
    });
  },

  get: (bookingId: string) => {
    return request<{ booking: any }>(`/api/v1/bookings/${bookingId}`);
  },

  getUserBookings: (userId: string) => {
    return request<{ bookings: any[] }>(`/api/v1/bookings/user/${userId}`);
  },

  initiatePayment: (bookingId: string) => {
    return request<{ success: boolean; booking: any; razorpayOrderId: string }>(
      `/api/v1/bookings/${bookingId}/pay`,
      { method: 'POST' }
    );
  },

  confirmPayment: (bookingId: string, data: { razorpayPaymentId: string; razorpaySignature?: string }) => {
    return request<{ success: boolean; booking: any }>(
      `/api/v1/bookings/${bookingId}/confirm`,
      { method: 'POST', body: data }
    );
  },

  confirmBooking: (bookingId: string) => {
    return request<{ success: boolean; booking: any }>(
      `/api/v1/bookings/${bookingId}/confirm-booking`,
      { method: 'POST' }
    );
  },

  cancel: (bookingId: string, reason?: string) => {
    return request<{ success: boolean; booking: any }>(
      `/api/v1/bookings/${bookingId}/cancel`,
      { method: 'POST', body: { reason } }
    );
  },

  uploadDocument: (bookingId: string, data: { type: string; url: string }) => {
    return request<{ success: boolean; booking: any }>(
      `/api/v1/bookings/${bookingId}/documents`,
      { method: 'POST', body: data }
    );
  },

  getStats: () => {
    return request<{ stats: any[]; todayBookings: number }>('/api/v1/bookings/stats');
  },
};

// =============================================
// LEAD API
// =============================================

export const leadApi = {
  create: (data: { name: string; phone: string; email?: string; source?: string }) => {
    return request<{ success: boolean; lead: any }>('/api/v1/leads', {
      method: 'POST',
      body: data,
    });
  },

  list: (params?: { brokerId?: string; status?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ leads: any[]; total: number }>(`/api/v1/leads${query ? `?${query}` : ''}`);
  },

  get: (id: string) => request<{ lead: any }>(`/api/v1/leads/${id}`),

  update: (id: string, data: any) => {
    return request<{ success: boolean; lead: any }>(`/api/v1/leads/${id}`, {
      method: 'PATCH',
      body: data,
    });
  },

  getStats: () => request<{ stats: any }>('/api/v1/leads/stats'),
};

// =============================================
// INVESTMENT API
// =============================================

export const investmentApi = {
  calculateEMI: (data: { amount: number; rate: number; tenure: number }) => {
    return request<{ emi: number; totalInterest: number; totalPayment: number }>(
      '/api/v1/investment/emi',
      { method: 'POST', body: data }
    );
  },

  calculateROI: (data: { price: number; rent: number; years: number; appreciation: number }) => {
    return request<{ roi: number; totalReturn: number; breakdown: any }>(
      '/api/v1/investment/roi',
      { method: 'POST', body: data }
    );
  },

  checkGoldenVisa: (data: { amount: number; currency: string }) => {
    return request<{ eligible: boolean; program?: string; validity?: string }>(
      '/api/v1/investment/golden-visa',
      { method: 'POST', body: data }
    );
  },
};

// =============================================
// VISA API
// =============================================

export const visaApi = {
  getPrograms: () => request<{ programs: any[] }>('/api/v1/visa/programs'),

  checkEligibility: (data: { investment: number; country: string }) => {
    return request<{ eligible: boolean; programs: any[] }>(
      '/api/v1/visa/check',
      { method: 'POST', body: data }
    );
  },
};

// =============================================
// REFERRAL API
// =============================================

export const referralApi = {
  getMyCode: () => request<{ code: string; stats: any }>('/api/v1/referrals/my-code'),

  getLeaderboard: () => request<{ leaders: any[] }>('/api/v1/referrals/leaderboard'),

  getEarnings: () => request<{ total: number; pending: number; paid: number }>('/api/v1/referrals/earnings'),

  claimReward: (referralId: string) => {
    return request<{ success: boolean; amount: number }>(
      `/api/v1/referrals/${referralId}/claim`,
      { method: 'POST' }
    );
  },
};

// =============================================
// INTELLIGENCE API
// =============================================

export const intelligenceApi = {
  scoreLead: (data: { phone?: string; email?: string; source?: string }) => {
    return request<{ score: number; segment: string; tags: string[] }>(
      '/api/v1/intelligence/score',
      { method: 'POST', body: data }
    );
  },

  getRecommendations: (userId: string) => {
    return request<{ recommendations: any[] }>(`/api/v1/intelligence/recommendations/${userId}`);
  },

  getLocalityInsights: (locality: string) => {
    return request<{ insights: any }>(`/api/v1/intelligence/locality/${encodeURIComponent(locality)}`);
  },
};

// =============================================
// WEBSOCKET CLIENT
// =============================================

export const socketClient = {
  connect: (userId: string, token: string) => {
    if (typeof window === 'undefined') return null;

    const socket = new (window as any).io(process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:4121', {
      auth: { token },
    });

    socket.on('connect', () => {
      logger.info('Socket connected');
      socket.emit('user:subscribe', { userId });
    });

    socket.on('booking:update', (data: any) => {
      logger.info('Booking update:', data);
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('booking:update', { detail: data }));
    });

    socket.on('lead:new', (data: any) => {
      window.dispatchEvent(new CustomEvent('lead:new', { detail: data }));
    });

    return socket;
  },

  disconnect: (socket: any) => {
    if (socket) socket.disconnect();
  },
};
