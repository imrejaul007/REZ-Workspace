import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────

export interface ServiceCategory {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  iconType?: string;
  image?: string;
  cashbackPercentage: number;
  maxCashback?: number;
  isActive: boolean;
  sortOrder: number;
  serviceCount: number;
}

export interface ServicePricing {
  original: number;
  selling: number;
  discount: number;
  currency: string;
}

export interface ServiceDetails {
  duration: number;
  serviceType: 'store' | 'home' | 'online';
  maxBookingsPerSlot: number;
  requiresAddress: boolean;
  requiresPaymentUpfront: boolean;
  serviceArea?: {
    radius: number;
    unit: string;
  };
  serviceCategory: string;
}

export interface ServiceCashback {
  percentage: number;
  maxAmount?: number;
  isActive: boolean;
}

export interface MerchantService {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  productType: 'service';
  images: string[];
  pricing: ServicePricing;
  serviceDetails: ServiceDetails;
  serviceCategory: ServiceCategory | string;
  cashback: ServiceCashback;
  store: { _id: string; name: string; logo?: string } | string;
  merchantId: string;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TravelDetails {
  route?: {
    from: string;
    to: string;
    fromCode?: string;
    toCode?: string;
  };
  passengers?: {
    adults: number;
    children: number;
    infants?: number;
  };
  class?: string;
  tripType?: 'one-way' | 'round-trip';
  returnDate?: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';
// ENUM-003 FIX (2026-04-17): Aligned to canonical PaymentStatus
// Canonical: pending/processing/completed/failed/cancelled/expired/refund_initiated/refund_processing/refunded/refund_failed/partially_refunded
// Changed: 'paid' → 'completed' (canonical), 'partial' → 'partially_refunded' (canonical)
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refund_initiated'
  | 'refund_processing'
  | 'refunded'
  | 'refund_failed'
  | 'partially_refunded';
export type CashbackStatus = 'pending' | 'held' | 'credited' | 'clawed_back';
export type DepositStatus = 'paid' | 'refunded' | 'pending' | 'none';

export interface MerchantServiceBooking {
  _id: string;
  bookingNumber: string;
  user: {
    _id: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      email?: string;
    };
  };
  service: {
    _id: string;
    name: string;
    images?: string[];
    pricing?: ServicePricing;
    serviceDetails?: ServiceDetails;
  };
  serviceCategory: {
    _id: string;
    name: string;
    icon?: string;
  };
  store: {
    _id: string;
    name: string;
    logo?: string;
  };
  bookingDate: string;
  timeSlot: {
    start: string;
    end: string;
  };
  duration: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  pricing: {
    basePrice: number;
    discount: number;
    discountAmount: number;
    taxes: number;
    convenienceFee: number;
    total: number;
    cashbackEarned: number;
    cashbackPercentage: number;
    currency: string;
  };
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pnr?: string;
  eTicketUrl?: string;
  externalReference?: string;
  cashbackStatus?: CashbackStatus;
  travelDetails?: TravelDetails;
  cancellationReason?: string;
  cancelledAt?: string;
  completedAt?: string;
  depositStatus?: DepositStatus;
  depositAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingStats {
  period: string;
  totalBookings: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  shortDescription?: string;
  serviceCategoryId: string;
  storeId: string;
  price: number;
  originalPrice?: number;
  duration?: number;
  serviceType?: 'store' | 'home' | 'online';
  maxBookingsPerSlot?: number;
  requiresPaymentUpfront?: boolean;
  requiresAddress?: boolean;
  serviceArea?: { radius: number; unit: string };
  cashbackPercentage?: number;
  cashbackMaxAmount?: number;
  images?: string[];
  tags?: string[];
  isFeatured?: boolean;
  specifications?: Array<{ key: string; value: string }>;
  cancellationPolicy?: {
    freeCancellationHours?: number;
    lateCancellationFee?: 'none' | 'partial' | 'full';
    feePercentage?: number;
  };
}

export interface UpdateServiceData extends Partial<CreateServiceData> {
  isActive?: boolean;
}

export interface ListServicesParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive';
  category?: string;
  storeId?: string;
}

export interface ListBookingsParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  date?: string;
  storeId?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ── Service Class ─────────────────────────────────────────────────────────

class ServiceManagementService {
  /**
   * Get merchant's services
   */
  async getServices(
    params?: ListServicesParams
  ): Promise<{ services: MerchantService[]; pagination: Pagination }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.storeId) queryParams.append('storeId', params.storeId);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const url = queryString ? `merchant/services?${queryString}` : 'merchant/services';

      const response = await apiClient.get<unknown>(url);

      // Backend returns: { success: true, data: services[], pagination: {...} }
      return {
        services: response.data || [],
        pagination: (response as unknown).pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch services');
    }
  }

  /**
   * Get a single service by ID
   */
  async getServiceById(serviceId: string): Promise<MerchantService> {
    try {
      const response = await apiClient.get<unknown>(`merchant/services/${serviceId}`);
      if (!response.data) throw new Error('Service not found');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch service');
    }
  }

  /**
   * Create a new service
   */
  async createService(data: CreateServiceData): Promise<MerchantService> {
    try {
      const response = await apiClient.post<unknown>('merchant/services', data);
      if (!response.data) throw new Error('Failed to create service');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create service');
    }
  }

  /**
   * Update a service
   */
  async updateService(serviceId: string, data: UpdateServiceData): Promise<MerchantService> {
    try {
      const response = await apiClient.put<unknown>(`merchant/services/${serviceId}`, data);
      if (!response.data) throw new Error('Failed to update service');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update service');
    }
  }

  /**
   * Delete a service (soft delete)
   */
  async deleteService(serviceId: string): Promise<void> {
    try {
      await apiClient.delete(`merchant/services/${serviceId}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete service');
    }
  }

  /**
   * Get service categories for picker
   */
  async getCategories(): Promise<ServiceCategory[]> {
    try {
      const response = await apiClient.get<unknown>('merchant/services/categories');
      return response.data || [];
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to fetch categories'
      );
    }
  }

  /**
   * Get merchant's service bookings
   */
  async getBookings(
    params?: ListBookingsParams
  ): Promise<{ bookings: MerchantServiceBooking[]; pagination: Pagination }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.date) queryParams.append('date', params.date);
      if (params?.storeId) queryParams.append('storeId', params.storeId);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const url = queryString
        ? `merchant/services/bookings?${queryString}`
        : 'merchant/services/bookings';

      const response = await apiClient.get<unknown>(url);

      return {
        bookings: response.data || [],
        pagination: (response as unknown).pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch bookings');
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    status: string,
    options?: { assignedStaff?: string; note?: string }
  ): Promise<MerchantServiceBooking> {
    try {
      const response = await apiClient.put<unknown>(`merchant/services/bookings/${bookingId}/status`, {
        status,
        ...options,
      });
      if (!response.data) throw new Error('Failed to update booking status');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update booking');
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(params?: { storeId?: string; period?: string }): Promise<BookingStats> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.storeId) queryParams.append('storeId', params.storeId);
      if (params?.period) queryParams.append('period', params.period);

      const queryString = queryParams.toString();
      const url = queryString
        ? `merchant/services/bookings/stats?${queryString}`
        : 'merchant/services/bookings/stats';

      const response = await apiClient.get<unknown>(url);
      return (
        response.data || {
          period: 'Last 30 days',
          totalBookings: 0,
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          revenue: 0,
        }
      );
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to fetch booking stats'
      );
    }
  }
}

export const serviceManagementService = new ServiceManagementService();
