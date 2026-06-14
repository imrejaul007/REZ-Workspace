// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.rez-delivery.com/v1';
const API_TIMEOUT = 30000; // 30 seconds

// Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Custom fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        code: `HTTP_${response.status}`,
        message: errorData.message || `HTTP error ${response.status}`,
        details: errorData.details,
      } as ApiError;
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Generic request handler
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetchWithTimeout(url, options);
  const data = await response.json();

  return data as T;
}

// API Methods
export const api = {
  // Orders
  orders: {
    list: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      source?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.status) searchParams.set('status', params.status);
      if (params?.source) searchParams.set('source', params.source);

      const query = searchParams.toString();
      return request<PaginatedResponse<Order>>(`/orders${query ? `?${query}` : ''}`);
    },

    get: (id: string) => request<Order>(`/orders/${id}`),

    create: (order: CreateOrderInput) =>
      request<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      }),

    update: (id: string, updates: Partial<Order>) =>
      request<Order>(`/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),

    updateStatus: (id: string, status: OrderStatus) =>
      request<Order>(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),

    assignRider: (orderId: string, riderId: string) =>
      request<Order>(`/orders/${orderId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ riderId }),
      }),

    cancel: (id: string, reason: string) =>
      request<Order>(`/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  // Riders
  riders: {
    list: (params?: { status?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);

      const query = searchParams.toString();
      return request<PaginatedResponse<Rider>>(`/riders${query ? `?${query}` : ''}`);
    },

    get: (id: string) => request<Rider>(`/riders/${id}`),

    updateStatus: (id: string, status: RiderStatus) =>
      request<Rider>(`/riders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),

    getLocation: (id: string) =>
      request<{ lat: number; lng: number; updatedAt: string }>(
        `/riders/${id}/location`
      ),

    getStats: (id: string) =>
      request<RiderStats>(`/riders/${id}/stats`),
  },

  // Analytics
  analytics: {
    dashboard: () => request<DashboardStats>('/analytics/dashboard'),

    orders: (params: {
      startDate: string;
      endDate: string;
      groupBy?: 'hour' | 'day' | 'week' | 'month';
    }) => {
      const searchParams = new URLSearchParams(params as Record<string, string>);
      return request<OrderAnalytics>(`/analytics/orders?${searchParams}`);
    },

    riders: (params: { startDate: string; endDate: string }) => {
      const searchParams = new URLSearchParams(params as Record<string, string>);
      return request<RiderAnalytics>(`/analytics/riders?${searchParams}`);
    },

    performance: () => request<PerformanceMetrics>('/analytics/performance'),
  },

  // Tracking
  tracking: {
    getOrderTracking: (trackingOrderId: string) =>
      request<OrderTracking>(`/tracking/order/${trackingOrderId}`),

    subscribe: (
      _orderId: string,
      onUpdate: (update: TrackingUpdate) => void
    ) => {
      // In production, this would be a WebSocket connection
      const wsUrlBase = API_BASE_URL.replace('http', 'ws');
      // URL for WebSocket connection (used by WebSocket implementation if needed)
      void wsUrlBase; // Acknowledge variable is available for future WebSocket implementation

      // Simulated WebSocket for demo
      const intervalId = setInterval(() => {
        onUpdate({
          type: 'location',
          data: {
            lat: 39.783 + Math.random() * 0.01,
            lng: -89.645 + Math.random() * 0.01,
          },
          timestamp: new Date().toISOString(),
        });
      }, 5000);

      return () => clearInterval(intervalId);
    },
  },
};

// Data Types (should match backend)
export interface Order {
  id: string;
  customer: string;
  phone: string;
  address: string;
  items: OrderItem[];
  status: OrderStatus;
  source: 'app' | 'web' | 'phone';
  time: string;
  amount: number;
  rider?: string;
  deliveryFee?: number;
  notes?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  options?: string[];
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface CreateOrderInput {
  customer: string;
  phone: string;
  address: string;
  items: { id: string; quantity: number }[];
  notes?: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  status: RiderStatus;
  rating: number;
  totalDeliveries: number;
  successRate: number;
  avgDeliveryTime: number;
  earnings: number;
  vehicle: 'bike' | 'scooter' | 'car';
  currentOrder?: string;
  location?: { lat: number; lng: number };
}

export type RiderStatus = 'online' | 'offline' | 'busy';

export interface RiderStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageRating: number;
  averageDeliveryTime: number;
  totalEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
}

export interface DashboardStats {
  activeOrders: number;
  ridersOnline: number;
  avgDeliveryTime: number;
  successRate: number;
  todayOrders: number;
  todayRevenue: number;
  weeklyGrowth: number;
}

export interface OrderAnalytics {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  averageDeliveryTime: number;
  ordersByHour: { hour: number; count: number }[];
  ordersByDay: { date: string; count: number }[];
  revenueByDay: { date: string; revenue: number }[];
}

export interface RiderAnalytics {
  topRiders: {
    rider: Rider;
    deliveries: number;
    rating: number;
  }[];
  riderUtilization: { status: string; count: number }[];
}

export interface PerformanceMetrics {
  onTimeDeliveryRate: number;
  customerSatisfactionScore: number;
  orderAccuracyRate: number;
  averagePreparationTime: number;
  peakHours: { hour: number; orderCount: number }[];
}

export interface OrderTracking {
  orderId: string;
  status: OrderStatus;
  rider?: {
    id: string;
    name: string;
    phone: string;
    location: { lat: number; lng: number };
  };
  pickup: { lat: number; lng: number; address: string };
  delivery: { lat: number; lng: number; address: string };
  estimatedArrival: string;
  route?: { lat: number; lng: number }[];
}

export interface TrackingUpdate {
  type: 'location' | 'status' | 'eta';
  data: unknown;
  timestamp: string;
}

export default api;
