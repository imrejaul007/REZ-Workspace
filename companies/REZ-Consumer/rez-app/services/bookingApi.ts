// @ts-nocheck
// Booking API Service
// Handles bookings and reservations management

import apiClient, { ApiResponse } from './apiClient';
import { logger } from '@/utils/logger';

// ===== TYPE DEFINITIONS =====

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  storeId: string;
  bookingDate: string;
  timeSlot: { start: string; end: string };
  staffId?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  customerNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBookingRequest {
  serviceId: string;
  storeId: string;
  bookingDate: string;
  timeSlot: { start: string; end: string };
  staffId?: string;
  customerNotes?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
  staffAvailable?: number;
}

export interface BookingsQueryParams {
  status?: 'upcoming' | 'past' | 'cancelled' | 'completed';
  page?: number;
  limit?: number;
  sortBy?: 'date_asc' | 'date_desc' | 'newest' | 'oldest';
}

export interface BookingsResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface RescheduleBookingRequest {
  newDate: string;
  newTimeSlot: string;
  staffId?: string;
}

// ===== SERVICE CLASS =====

class BookingService {
  /**
   * Create a new booking/reservation
   */
  async createBooking(bookingData: CreateBookingRequest): Promise<ApiResponse<Booking>> {
    try {
      // Validate required fields
      if (!bookingData.serviceId || !bookingData.storeId || !bookingData.bookingDate || !bookingData.timeSlot) {
        return {
          success: false,
          error: 'Service ID, Store ID, booking date, and time slot are required'
        };
      }

      const response = await apiClient.post<Booking>(
        '/service-bookings',
        bookingData as unknown
      );

      if (!response.success) {
        logger.error('❌ [BOOKING API] Failed to create booking:', response.error);
      } else {
        logger.debug('✅ [BOOKING API] Booking created successfully:', response.data);
      }

      return response as unknown;
    } catch (error) {
      // CA-TRV-073: Include error details for debugging
      const errorDetails = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { error: String(error) };
      logger.error('❌ [BOOKING API] Error creating booking:', errorDetails);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking',
      } as unknown;
    }
  }

  /**
   * Get user's bookings with optional filtering
   */
  async getUserBookings(
    params?: BookingsQueryParams
  ): Promise<ApiResponse<BookingsResponse>> {
    try {
      const queryParams = {
        status: params?.status,
        page: params?.page || 1,
        limit: params?.limit || 10,
        sortBy: params?.sortBy || 'date_desc'
      };

      // Filter out undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(queryParams).filter(([_, v]) => v !== undefined)
      );

      const response = await apiClient.get<BookingsResponse>(
        '/service-bookings',
        cleanParams
      );

      if (!response.success) {
        logger.error('❌ [BOOKING API] Failed to fetch user bookings:', response.error);
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [BOOKING API] Error fetching user bookings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user bookings'
      };
    }
  }

  /**
   * Get all bookings for the user (alias for getUserBookings)
   */
  async getBookings(
    params?: BookingsQueryParams
  ): Promise<ApiResponse<BookingsResponse>> {
    return this.getUserBookings(params);
  }

  /**
   * Get booking details by ID
   */
  async getBookingById(bookingId: string): Promise<ApiResponse<Booking>> {
    try {
      if (!bookingId) {
        return {
          success: false,
          error: 'Booking ID is required'
        };
      }

      const response = await apiClient.get<Booking>(`/service-bookings/${bookingId}`);

      if (!response.success) {
        logger.error('❌ [BOOKING API] Failed to fetch booking details: null as unknown,', response.error);
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [BOOKING API] Error fetching booking details: null as unknown,', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch booking details'
      };
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<ApiResponse<unknown>> {
    try {
      if (!bookingId) {
        return {
          success: false,
          error: 'Booking ID is required'
        };
      }

      const payload = reason ? { reason } : {};

      const response = await apiClient.put<unknown>(
        `/service-bookings/${bookingId}/cancel`,
        payload
      );

      if (!response.success) {
        logger.error('❌ [BOOKING API] Failed to cancel booking:', response.error);
      } else {
        logger.debug('✅ [BOOKING API] Booking cancelled successfully');
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [BOOKING API] Error cancelling booking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel booking'
      };
    }
  }

  /**
   * Reschedule a booking to a new date and time
   */
  async rescheduleBooking(
    bookingId: string,
    reschedulingData: RescheduleBookingRequest
  ): Promise<ApiResponse<Booking>> {
    try {
      if (!bookingId || !reschedulingData.newDate || !reschedulingData.newTimeSlot) {
        return {
          success: false,
          error: 'Booking ID, new date, and new time slot are required'
        };
      }

      const response = await apiClient.put<Booking>(
        `/service-bookings/${bookingId}/reschedule`,
        reschedulingData as unknown
      );

      if (!response.success) {
        logger.error('❌ [BOOKING API] Failed to reschedule booking:', response.error);
      } else {
        logger.debug('✅ [BOOKING API] Booking rescheduled successfully');
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [BOOKING API] Error rescheduling booking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reschedule booking'
      };
    }
  }

  /**
   * Get available time slots for a service on a specific date
   */
  async getAvailableSlots(
    serviceId: string,
    date: string,
    staffId?: string
  ): Promise<ApiResponse<TimeSlot[]>> {
    try {
      if (!serviceId || !date) {
        return {
          success: false,
          error: 'Service ID and date are required'
        };
      }

      const queryParams: Record<string, unknown> = { date };
      if (staffId) {
        queryParams.staffId = staffId;
      }

      const response = await apiClient.get<TimeSlot[]>(
        `/service-bookings/available-slots`,
        { serviceId, ...queryParams }
      );

      if (!response.success) {
        logger.error('❌ [BOOKING API] Failed to fetch available slots:', response.error);
      } else if (response.data) {
        // CA-TRV-074: Validate response is an array
        if (!Array.isArray(response.data)) {
          logger.error('❌ [BOOKING API] Invalid available slots response structure - not an array');
          return {
            success: false,
            error: 'Invalid response structure from server'
          };
        }
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [BOOKING API] Error fetching available slots:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch available slots'
      };
    }
  }

  /**
   * Get upcoming bookings for the user
   */
  async getUpcomingBookings(limit: number = 5): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await apiClient.get<Booking[]>(
        '/service-bookings',
        { status: 'upcoming', limit }
      );

      if (!response.success) {
        logger.error('❌ [BOOKING API] Failed to fetch upcoming bookings:', response.error);
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [BOOKING API] Error fetching upcoming bookings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch upcoming bookings'
      };
    }
  }

  /**
   * Get past bookings for the user
   */
  async getPastBookings(
    params?: Omit<BookingsQueryParams, 'status'>
  ): Promise<ApiResponse<BookingsResponse>> {
    try {
      const queryParams = {
        status: 'past' as const,
        page: params?.page || 1,
        limit: params?.limit || 10,
        sortBy: params?.sortBy || 'date_desc'
      };

      // Filter out undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(queryParams).filter(([_, v]) => v !== undefined)
      );

      const response = await apiClient.get<BookingsResponse>(
        '/service-bookings',
        cleanParams
      );

      if (!response.success) {
        logger.error('❌ [BOOKING API] Failed to fetch past bookings:', response.error);
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [BOOKING API] Error fetching past bookings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch past bookings'
      };
    }
  }

  /**
   * Get booking history for a specific store
   */
  async getStoreBookingHistory(
    storeId: string,
    params?: Omit<BookingsQueryParams, 'status'>
  ): Promise<ApiResponse<BookingsResponse>> {
    try {
      if (!storeId) {
        return {
          success: false,
          error: 'Store ID is required'
        };
      }

      const queryParams = {
        page: params?.page || 1,
        limit: params?.limit || 10,
        sortBy: params?.sortBy || 'date_desc'
      };

      // Filter out undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(queryParams).filter(([_, v]) => v !== undefined)
      );

      const response = await apiClient.get<BookingsResponse>(
        `/service-bookings`,
        { storeId, ...cleanParams }
      );

      if (!response.success) {
        logger.error('❌ [BOOKING API] Failed to fetch store booking history:', response.error);
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [BOOKING API] Error fetching store booking history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch store booking history'
      };
    }
  }

  /**
   * Get booking statistics for the user
   */
  async getBookingStats(): Promise<ApiResponse<{
    totalBookings: number;
    upcomingCount: number;
    completedCount: number;
    cancelledCount: number;
  }>> {
    try {
      const response = await apiClient.get<unknown>('/service-bookings/stats');

      if (!response.success) {
        logger.error('❌ [BOOKING API] Failed to fetch booking statistics:', response.error);
      } else if (response.data) {
        // CA-TRV-075: Validate required fields in stats response
        const requiredFields = ['totalBookings', 'upcomingCount', 'completedCount', 'cancelledCount'];
        const missingFields = requiredFields.filter(field => !(field in response.data));
        if (missingFields.length > 0) {
          logger.error('❌ [BOOKING API] Missing required fields in stats:', missingFields);
          return {
            success: false,
            error: `Invalid stats response - missing fields: ${missingFields.join(', ')}`
          };
        }
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [BOOKING API] Error fetching booking statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch booking statistics'
      };
    }
  }

  /**
   * Complete a booking (for store staff)
   */
  async completeBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    try {
      if (!bookingId) {
        return {
          success: false,
          error: 'Booking ID is required'
        };
      }

      const response = await apiClient.put<Booking>(
        `/service-bookings/${bookingId}/complete`,
        {}
      );

      if (!response.success) {
        logger.error('❌ [BOOKING API] Failed to complete booking:', response.error);
      } else {
        logger.debug('✅ [BOOKING API] Booking marked as completed');
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [BOOKING API] Error completing booking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete booking'
      };
    }
  }

  /**
   * Check availability for quick booking without full service details
   */
  async checkBookingAvailability(
    serviceId: string,
    date: string
  ): Promise<ApiResponse<{ available: boolean; slotsCount: number }>> {
    try {
      if (!serviceId || !date) {
        return {
          success: false,
          error: 'Service ID and date are required'
        };
      }

      const response = await apiClient.get<unknown>(
        `/service-bookings/available-slots`,
        { serviceId, date }
      );

      if (!response.success) {
        logger.error('❌ [BOOKING API] Failed to check availability:', response.error);
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [BOOKING API] Error checking availability:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check availability'
      };
    }
  }

  /**
   * Check if backend API is available
   */
  async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await apiClient.get<unknown>('/service-bookings/available-slots');

      if (response.success) {
        return true;
      } else {
        logger.warn('⚠️ [BOOKING API] Backend responded but with error:', response.error);
        return false;
      }
    } catch (error) {
      logger.warn('⚠️ [BOOKING API] Backend not available:', error);
      return false;
    }
  }
}

// Create singleton instance
const bookingService = new BookingService();

export default bookingService;
