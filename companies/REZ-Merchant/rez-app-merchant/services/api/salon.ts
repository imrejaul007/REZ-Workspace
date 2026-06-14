/**
 * Salon API Service - Salon management for merchant app
 *
 * Provides methods for:
 * - Booking management
 * - Customer management
 * - Service management
 * - Earnings tracking
 * - Time slot blocking
 */

import { apiClient } from './client';

// ============================================================================
// Types
// ============================================================================

export interface SalonBooking {
  _id: string;
  storeId: string;
  appointmentNumber?: string;
  customerName: string;
  customerPhone: string;
  customerId?: string;
  serviceType: string;
  serviceId?: string;
  appointmentDate: string;
  appointmentTime: string;
  endTime?: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  staffId?: string;
  staffName?: string;
  price?: number;
  commissionAmount?: number;
  notes?: string;
  specialInstructions?: string;
  isWalkin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalonCustomer {
  _id: string;
  storeId: string;
  name: string;
  phone: string;
  email?: string;
  visitCount: number;
  lastVisitDate?: string;
  loyaltyPoints: number;
  notes?: string;
  preferences?: string[];
  serviceHistory?: SalonServiceHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface SalonServiceHistory {
  _id?: string;
  serviceName: string;
  date: string;
  amount: number;
  stylist?: string;
  staff?: string;
}

export interface SalonService {
  _id: string;
  storeId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: string;
  isActive: boolean;
  commissionRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  bookingId?: string;
}

export interface BlockedSlot {
  _id: string;
  storeId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt: string;
}

export interface SalonStats {
  todayBookings: number;
  completedToday: number;
  weekBookings: number;
  revenueThisWeek: number;
  earnings?: ChartData[];
}

export interface ChartData {
  date: string;
  value: number;
  label?: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  totalRevenue: number;
  totalCommission: number;
  servicesCompleted: number;
  pendingPayout: number;
  chartData: ChartData[];
}

export interface EarningTransaction {
  _id: string;
  storeId: string;
  bookingId: string;
  customerName: string;
  serviceName: string;
  amount: number;
  earnings: number;
  commission: number;
  date: string;
  status: 'completed' | 'pending' | 'paid';
}

export interface StaffEarning {
  staffId: string;
  staffName: string;
  servicesCount: number;
  earnings: number;
  commission: number;
}

export interface BookingNotification {
  _id: string;
  type: 'new_booking' | 'cancelled' | 'rescheduled';
  bookingId: string;
  customerName: string;
  serviceType: string;
  appointmentTime: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// Salon Service
// ============================================================================

class SalonServiceAPI {
  private baseUrl = '/merchant/salon';

  // -------------------------------------------------------------------------
  // Bookings
  // -------------------------------------------------------------------------

  async getTodayBookings(storeId: string): Promise<SalonBooking[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await apiClient.get<ApiResponse<SalonBooking[]>>(
      `${this.baseUrl}/bookings`,
      { params: { storeId, date: today } }
    );
    return response.data.data || [];
  }

  async getUpcomingBookings(
    storeId: string,
    options?: { limit?: number; staffId?: string }
  ): Promise<SalonBooking[]> {
    const response = await apiClient.get<ApiResponse<SalonBooking[]>>(
      `${this.baseUrl}/bookings/upcoming`,
      { params: { storeId, ...options } }
    );
    return response.data.data || [];
  }

  async getBookingsByDate(
    storeId: string,
    date: string,
    options?: { status?: string; staffId?: string }
  ): Promise<SalonBooking[]> {
    const response = await apiClient.get<ApiResponse<SalonBooking[]>>(
      `${this.baseUrl}/bookings`,
      { params: { storeId, date, ...options } }
    );
    return response.data.data || [];
  }

  async getBooking(bookingId: string): Promise<SalonBooking> {
    const response = await apiClient.get<ApiResponse<SalonBooking>>(
      `${this.baseUrl}/bookings/${bookingId}`
    );
    return response.data.data;
  }

  async createBooking(
    storeId: string,
    data: Partial<SalonBooking>
  ): Promise<SalonBooking> {
    const response = await apiClient.post<ApiResponse<SalonBooking>>(
      `${this.baseUrl}/bookings`,
      { ...data, storeId }
    );
    return response.data.data;
  }

  async updateBooking(
    bookingId: string,
    data: Partial<SalonBooking>
  ): Promise<SalonBooking> {
    const response = await apiClient.patch<ApiResponse<SalonBooking>>(
      `${this.baseUrl}/bookings/${bookingId}`,
      data
    );
    return response.data.data;
  }

  async updateBookingStatus(
    bookingId: string,
    status: SalonBooking['status']
  ): Promise<SalonBooking> {
    return this.updateBooking(bookingId, { status });
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<SalonBooking> {
    const response = await apiClient.post<ApiResponse<SalonBooking>>(
      `${this.baseUrl}/bookings/${bookingId}/cancel`,
      { reason }
    );
    return response.data.data;
  }

  async walkinCheckin(
    storeId: string,
    data: {
      customerName: string;
      customerPhone: string;
      serviceId: string;
      staffId?: string;
      notes?: string;
    }
  ): Promise<SalonBooking> {
    const response = await apiClient.post<ApiResponse<SalonBooking>>(
      `${this.baseUrl}/walkin`,
      { storeId, ...data }
    );
    return response.data.data;
  }

  // -------------------------------------------------------------------------
  // Time Slots & Blocking
  // -------------------------------------------------------------------------

  async getAvailableSlots(
    storeId: string,
    date: string,
    serviceId?: string
  ): Promise<TimeSlot[]> {
    const response = await apiClient.get<ApiResponse<TimeSlot[]>>(
      `${this.baseUrl}/slots/available`,
      { params: { storeId, date, serviceId } }
    );
    return response.data.data || [];
  }

  async getBlockedSlots(
    storeId: string,
    date: string
  ): Promise<BlockedSlot[]> {
    const response = await apiClient.get<ApiResponse<BlockedSlot[]>>(
      `${this.baseUrl}/slots/blocked`,
      { params: { storeId, date } }
    );
    return response.data.data || [];
  }

  async blockTimeSlot(
    storeId: string,
    data: {
      date: string;
      startTime: string;
      endTime: string;
      reason?: string;
    }
  ): Promise<BlockedSlot> {
    const response = await apiClient.post<ApiResponse<BlockedSlot>>(
      `${this.baseUrl}/slots/block`,
      { storeId, ...data }
    );
    return response.data.data;
  }

  async unblockTimeSlot(slotId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/slots/block/${slotId}`);
  }

  // -------------------------------------------------------------------------
  // Customers
  // -------------------------------------------------------------------------

  async getCustomers(
    storeId: string,
    options?: { search?: string; sortBy?: string }
  ): Promise<SalonCustomer[]> {
    const response = await apiClient.get<ApiResponse<SalonCustomer[]>>(
      `${this.baseUrl}/customers`,
      { params: { storeId, ...options } }
    );
    return response.data.data || [];
  }

  async getCustomer(customerId: string): Promise<SalonCustomer> {
    const response = await apiClient.get<ApiResponse<SalonCustomer>>(
      `${this.baseUrl}/customers/${customerId}`
    );
    return response.data.data;
  }

  async addCustomer(
    storeId: string,
    data: { name: string; phone: string; email?: string }
  ): Promise<SalonCustomer> {
    const response = await apiClient.post<ApiResponse<SalonCustomer>>(
      `${this.baseUrl}/customers`,
      { storeId, ...data }
    );
    return response.data.data;
  }

  async updateCustomer(
    customerId: string,
    data: Partial<SalonCustomer>
  ): Promise<SalonCustomer> {
    const response = await apiClient.patch<ApiResponse<SalonCustomer>>(
      `${this.baseUrl}/customers/${customerId}`,
      data
    );
    return response.data.data;
  }

  async updateCustomerNotes(
    customerId: string,
    notes: string
  ): Promise<SalonCustomer> {
    return this.updateCustomer(customerId, { notes });
  }

  // -------------------------------------------------------------------------
  // Services
  // -------------------------------------------------------------------------

  async getServices(storeId: string): Promise<SalonService[]> {
    const response = await apiClient.get<ApiResponse<SalonService[]>>(
      `${this.baseUrl}/services`,
      { params: { storeId } }
    );
    return response.data.data || [];
  }

  async getService(serviceId: string): Promise<SalonService> {
    const response = await apiClient.get<ApiResponse<SalonService>>(
      `${this.baseUrl}/services/${serviceId}`
    );
    return response.data.data;
  }

  async createService(
    storeId: string,
    data: Partial<SalonService>
  ): Promise<SalonService> {
    const response = await apiClient.post<ApiResponse<SalonService>>(
      `${this.baseUrl}/services`,
      { storeId, ...data }
    );
    return response.data.data;
  }

  async updateService(
    serviceId: string,
    data: Partial<SalonService>
  ): Promise<SalonService> {
    const response = await apiClient.patch<ApiResponse<SalonService>>(
      `${this.baseUrl}/services/${serviceId}`,
      data
    );
    return response.data.data;
  }

  async deleteService(serviceId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/services/${serviceId}`);
  }

  async getServiceCategories(
    storeId: string
  ): Promise<ServiceCategory[]> {
    const response = await apiClient.get<ApiResponse<ServiceCategory[]>>(
      `${this.baseUrl}/services/categories`,
      { params: { storeId } }
    );
    return response.data.data || [];
  }

  // -------------------------------------------------------------------------
  // Earnings
  // -------------------------------------------------------------------------

  async getStats(storeId: string): Promise<SalonStats> {
    const response = await apiClient.get<ApiResponse<SalonStats>>(
      `${this.baseUrl}/stats`,
      { params: { storeId } }
    );
    return response.data.data;
  }

  async getEarningsSummary(
    storeId: string,
    period: 'today' | 'week' | 'month'
  ): Promise<EarningsSummary> {
    const response = await apiClient.get<ApiResponse<EarningsSummary>>(
      `${this.baseUrl}/earnings/summary`,
      { params: { storeId, period } }
    );
    return response.data.data;
  }

  async getEarningTransactions(
    storeId: string,
    period: 'today' | 'week' | 'month'
  ): Promise<EarningTransaction[]> {
    const response = await apiClient.get<ApiResponse<EarningTransaction[]>>(
      `${this.baseUrl}/earnings/transactions`,
      { params: { storeId, period } }
    );
    return response.data.data || [];
  }

  async getStaffEarnings(
    storeId: string,
    period: 'today' | 'week' | 'month'
  ): Promise<StaffEarning[]> {
    const response = await apiClient.get<ApiResponse<StaffEarning[]>>(
      `${this.baseUrl}/earnings/staff`,
      { params: { storeId, period } }
    );
    return response.data.data || [];
  }

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------

  async getNewBookingNotifications(
    storeId: string
  ): Promise<{ count: number; notifications: BookingNotification[] }> {
    const response = await apiClient.get<ApiResponse<{
      count: number;
      notifications: BookingNotification[];
    }>>(`${this.baseUrl}/notifications/new-bookings`, {
      params: { storeId },
    });
    return response.data.data || { count: 0, notifications: [] };
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/notifications/${notificationId}/read`);
  }

  async markAllNotificationsRead(storeId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/notifications/mark-all-read`, { storeId });
  }
}

export const salonService = new SalonServiceAPI();
