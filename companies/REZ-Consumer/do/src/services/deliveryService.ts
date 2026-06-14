import axios, { AxiosError } from 'axios';

const DELIVERY_API = process.env.EXPO_PUBLIC_DELIVERY_API || 'http://localhost:3012/api';
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Safe request wrapper with error handling
async function safeRequest<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  endpoint: string,
  data?: unknown,
  token?: string
): Promise<T> {
  try {
    const response = await axios.request<T>({
      method,
      url: `${DELIVERY_API}${endpoint}`,
      data,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message || axiosError.message;

      switch (axiosError.code) {
        case 'ECONNABORTED':
          throw new Error('Request timed out. Please try again.');
        case 'ERR_NETWORK':
          throw new Error('Network error. Please check your connection.');
        case 'ECONNREFUSED':
          throw new Error('Delivery service is unavailable.');
        default:
          throw new Error(message || 'Request failed');
      }
    }
    throw new Error('An unexpected error occurred');
  }
}

export interface DeliveryOrder {
  id: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDelivery?: string;
  rider?: {
    name: string;
    phone: string;
    location?: { lat: number; lng: number };
  };
}

export interface Location {
  lat: number;
  lng: number;
}

export const deliveryService = {
  /**
   * Get delivery order by ID
   */
  async getOrder(orderId: string, token?: string): Promise<DeliveryOrder> {
    if (!orderId || typeof orderId !== 'string') {
      throw new Error('Invalid order ID');
    }
    return safeRequest<DeliveryOrder>('get', `/orders/${encodeURIComponent(orderId)}`, undefined, token);
  },

  /**
   * Track rider location in real-time
   */
  async trackRider(deliveryId: string, token?: string): Promise<Location | null> {
    if (!deliveryId || typeof deliveryId !== 'string') {
      throw new Error('Invalid delivery ID');
    }
    try {
      const response = await safeRequest<{ location: Location }>(
        'get',
        `/track/${encodeURIComponent(deliveryId)}`,
        undefined,
        token
      );
      return response.location;
    } catch {
      return null;
    }
  },

  /**
   * Get available riders for assignment
   */
  async getRiders(token?: string): Promise<unknown[]> {
    try {
      const response = await safeRequest<{ riders: unknown[] }>(
        'get',
        '/riders/available',
        undefined,
        token
      );
      return response.riders || [];
    } catch {
      return [];
    }
  },

  /**
   * Update delivery status
   */
  async updateStatus(
    deliveryId: string,
    status: string,
    token?: string
  ): Promise<{ success: boolean }> {
    if (!deliveryId || typeof deliveryId !== 'string') {
      throw new Error('Invalid delivery ID');
    }

    const validStatuses = ['pending', 'assigned', 'picked_up', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return safeRequest<{ success: boolean }>(
      'put',
      `/orders/${encodeURIComponent(deliveryId)}/status`,
      { status },
      token
    );
  },

  // ==================== DRIVER APP SPECIFIC ====================

  /**
   * Accept a delivery (driver action)
   */
  async acceptDelivery(deliveryId: string, token?: string): Promise<{ success: boolean; order?: DeliveryOrder }> {
    if (!deliveryId || typeof deliveryId !== 'string') {
      throw new Error('Invalid delivery ID');
    }
    return safeRequest<{ success: boolean; order?: DeliveryOrder }>(
      'post',
      '/riders/accept',
      { deliveryId },
      token
    );
  },

  /**
   * Update driver location (for tracking)
   */
  async updateLocation(
    deliveryId: string,
    location: Location,
    token?: string
  ): Promise<{ success: boolean }> {
    if (!deliveryId || typeof deliveryId !== 'string') {
      throw new Error('Invalid delivery ID');
    }
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      throw new Error('Invalid location coordinates');
    }

    return safeRequest<{ success: boolean }>(
      'post',
      '/track/update',
      { deliveryId, location },
      token
    );
  },

  /**
   * Mark delivery as complete
   */
  async completeDelivery(deliveryId: string, token?: string): Promise<{ success: boolean }> {
    if (!deliveryId || typeof deliveryId !== 'string') {
      throw new Error('Invalid delivery ID');
    }
    return safeRequest<{ success: boolean }>(
      'post',
      `/orders/${encodeURIComponent(deliveryId)}/complete`,
      undefined,
      token
    );
  },
};

export default deliveryService;
