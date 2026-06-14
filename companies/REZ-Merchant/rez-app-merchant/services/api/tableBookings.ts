import { apiClient } from './client';

// Table Booking Interfaces
export interface TableBooking {
  _id: string;
  bookingNumber: string;
  storeId;
  userId;
  bookingDate: string;
  bookingTime: string;
  partySize: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TableBookingStats {
  total: number;
  confirmed: number;
  pending: number;
  completed: number;
  cancelled: number;
  noShow: number;
  todayCount: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  remainingCapacity: number;
  bookingsCount: number;
}

class TableBookingService {
  /**
   * Get table bookings for a store
   */
  async getStoreTableBookings(
    storeId: string,
    params?: { date?: string; status?: string; page?: number; limit?: number }
  ): Promise<{ bookings: TableBooking[]; stats: TableBookingStats; pagination: Pagination }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.append('date', params.date);
      if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const url = queryString
        ? `merchant/table-bookings/store/${storeId}?${queryString}`
        : `merchant/table-bookings/store/${storeId}`;

      const response = await apiClient.get<unknown>(url);

      const bookings: TableBooking[] = response.data?.bookings || [];

      // Compute stats client-side from bookings
      const today = new Date().toISOString().split('T')[0];
      const stats: TableBookingStats = {
        total: response.data?.pagination?.total || bookings.length,
        confirmed: bookings.filter((b) => b.status === 'confirmed').length,
        pending: bookings.filter((b) => b.status === 'pending').length,
        completed: bookings.filter((b) => b.status === 'completed').length,
        cancelled: bookings.filter((b) => b.status === 'cancelled').length,
        noShow: bookings.filter((b) => b.status === 'no_show').length,
        todayCount: bookings.filter((b) => b.bookingDate?.startsWith(today)).length,
      };

      return {
        bookings,
        stats,
        pagination: response.data?.pagination || {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to get table bookings'
      );
    }
  }

  /**
   * Update booking status (confirm, complete, cancel)
   */
  async updateBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  ): Promise<TableBooking> {
    try {
      const response = await apiClient.put<unknown>(`merchant/table-bookings/${bookingId}/status`, {
        status,
      });
      if (!response.data) {
        throw new Error('Failed to update booking status');
      }
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to update booking status'
      );
    }
  }

  /**
   * Get all bookings across all merchant's stores
   */
  async getMerchantTableBookings(params?: {
    date?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    bookings: TableBooking[];
    stores: { _id: string; name: string }[];
    stats: TableBookingStats;
    pagination: Pagination;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.append('date', params.date);
      if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const url = queryString
        ? `merchant/table-bookings/merchant?${queryString}`
        : 'merchant/table-bookings/merchant';

      const response = await apiClient.get<unknown>(url);

      const bookings: TableBooking[] = response.data?.bookings || [];
      const stores = response.data?.stores || [];

      const today = new Date().toISOString().split('T')[0];
      const stats: TableBookingStats = {
        total: response.data?.pagination?.total || bookings.length,
        confirmed: bookings.filter((b) => b.status === 'confirmed').length,
        pending: bookings.filter((b) => b.status === 'pending').length,
        completed: bookings.filter((b) => b.status === 'completed').length,
        cancelled: bookings.filter((b) => b.status === 'cancelled').length,
        noShow: bookings.filter((b) => b.status === 'no_show').length,
        todayCount: bookings.filter((b) => b.bookingDate?.startsWith(today)).length,
      };

      return {
        bookings,
        stores,
        stats,
        pagination: response.data?.pagination || {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to get merchant bookings'
      );
    }
  }

  /**
   * Check table availability for a store on a date
   */
  async checkAvailability(
    storeId: string,
    date: string
  ): Promise<{ timeSlots: TimeSlot[]; totalBookings: number; storeName: string }> {
    try {
      // MA-BROKEN-FIX: Added merchant/ prefix — table-bookings/* routes go to monolith
      // (404), but merchant/table-bookings/* routes to merchant-service (working path).
      const response = await apiClient.get<unknown>(
        `merchant/table-bookings/availability/${storeId}?date=${date}`
      );
      if (response.data) {
        return {
          timeSlots: response.data.timeSlots || [],
          totalBookings: response.data.totalBookings || 0,
          storeName: response.data.storeName || '',
        };
      }
      return { timeSlots: [], totalBookings: 0, storeName: '' };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to check availability'
      );
    }
  }
}

export const tableBookingService = new TableBookingService();
export default tableBookingService;
