// @ts-nocheck
/**
 * Salon API Service
 * Connects salon app screens to backend services
 *
 * Backend services:
 * - rez-salon-service (port 4010): Core salon, booking, service, availability APIs
 * - rez-salon-crm-service (port 4004): Customer management, campaigns, notifications
 */

import axios, { AxiosError } from 'axios';
import { logger } from '@/utils/logger';
import { globalDeduplicator } from '@/utils/requestDeduplicator';
import { globalConcurrencyLimiter } from '@/utils/concurrencyLimiter';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URLs - update these for production
const SALON_API = process.env.SALON_API || 'http://localhost:4010/api';
const CRM_API = process.env.SALON_CRM_API || 'http://localhost:4004/api';

// Types
export interface Salon {
  id: string;
  salonId?: string;
  name: string;
  rating: number;
  reviewCount: number;
  distance?: string;
  cashback?: string;
  priceRange?: string;
  image?: string;
  isVerified: boolean;
  category: string;
  services?: string[];
  openNow: boolean;
  address?: string;
  timing?: string;
  phone?: string;
  email?: string;
  about?: string;
  images?: string[];
  amenities?: string[];
}

export interface Service {
  id: string;
  serviceId?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration: number;
  category: string;
  image?: string;
}

export interface Stylist {
  id: string;
  stylistId?: string;
  name: string;
  image?: string;
  specialty: string;
  specialties?: string[];
  rating: number;
  reviewCount: number;
  experience: string;
  available: boolean;
  schedule?;
}

export interface Booking {
  bookingId: string;
  salonId: string;
  serviceId: string;
  stylistId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration: number;
  price: number;
  customerId?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;
  cancellationReason?: string;
}

export interface TimeSlot {
  id?: string;
  time: string;
  available: boolean;
}

export interface Customer {
  customerId: string;
  name: string;
  phone: string;
  email?: string;
  totalVisits?: number;
  lastVisit?: string;
  totalSpent?: number;
  loyaltyPoints?: number;
  preferences?: {
    preferredStylist?: string;
    preferredServices?: string[];
    notes?: string;
  };
}

export interface Review {
  id: string;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
}

// API Client Setup
const createApiClient = (baseURL: string) => {
  const client = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for auth token
  client.interceptors.request.use(async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      logger.warn('Failed to get auth token', { error });
    }
    return config;
  });

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        logger.warn('Unauthorized request to salon API');
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const salonClient = createApiClient(SALON_API);
const crmClient = createApiClient(CRM_API);

// Salon API Service
export const salonApi = {
  // ========== SALON ENDPOINTS ==========

  /**
   * Search salons with filters
   */
  async searchSalons(params: {
    city?: string;
    category?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<Salon[]> {
    const requestKey = createRequestKey('GET', '/salons/search', params);

    return globalDeduplicator.execute(requestKey, async () => {
      return globalConcurrencyLimiter.execute(async () => {
        const response = await salonClient.get('/salons/search', { params });
        return response.data.data || [];
      });
    });
  },

  /**
   * Get salon details by ID
   */
  async getSalonById(salonId: string): Promise<Salon | null> {
    const requestKey = createRequestKey('GET', `/salons/${salonId}`, {});

    return globalDeduplicator.execute(requestKey, async () => {
      return globalConcurrencyLimiter.execute(async () => {
        try {
          const response = await salonClient.get(`/salons/${salonId}`);
          return response.data.data || null;
        } catch (error) {
          if (error.response?.status === 404) {
            return null;
          }
          throw error;
        }
      });
    });
  },

  // ========== SERVICE ENDPOINTS ==========

  /**
   * Get services for a salon
   */
  async getServices(salonId: string, category?: string): Promise<Service[]> {
    const requestKey = createRequestKey('GET', `/services/salon/${salonId}`, { category });

    return globalDeduplicator.execute(requestKey, async () => {
      return globalConcurrencyLimiter.execute(async () => {
        const response = await salonClient.get(`/services/salon/${salonId}`, {
          params: { category },
        });
        return response.data.data || [];
      });
    });
  },

  /**
   * Get treatments/services (alias for getServices)
   */
  async getTreatments(merchantId: string): Promise<Service[]> {
    return this.getServices(merchantId);
  },

  // ========== BOOKING ENDPOINTS ==========

  /**
   * Get available time slots
   */
  async getAvailableSlots(params: {
    salonId: string;
    stylistId?: string;
    serviceId?: string;
    date: string;
    duration: number;
  }): Promise<TimeSlot[]> {
    const requestKey = createRequestKey('GET', '/availability/slots', params);

    return globalDeduplicator.execute(requestKey, async () => {
      return globalConcurrencyLimiter.execute(async () => {
        const response = await salonClient.get('/availability/slots', { params });
        const slots = response.data.data?.slots || [];
        return slots.map((time: string, index: number) => ({
          id: `slot-${index}`,
          time,
          available: true,
        }));
      });
    });
  },

  /**
   * Book an appointment
   */
  async createBooking(booking: {
    salonId: string;
    serviceId: string;
    stylistId?: string;
    date: string;
    startTime: string;
    duration: number;
    price: number;
    customer: {
      name: string;
      phone: string;
      email?: string;
    };
    notes?: string;
  }): Promise<Booking> {
    return globalConcurrencyLimiter.execute(async () => {
      const response = await salonClient.post('/bookings', booking);
      return response.data.data;
    });
  },

  /**
   * Get booking details
   */
  async getBooking(bookingId: string): Promise<Booking | null> {
    try {
      const response = await salonClient.get(`/bookings/${bookingId}`);
      return response.data.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get user's bookings
   */
  async getMyBookings(params?: {
    status?: string;
    from?: string;
    to?: string;
  }): Promise<Booking[]> {
    const response = await salonClient.get('/bookings', { params });
    return response.data.data || [];
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<{ bookingId: string; status: string }> {
    const response = await salonClient.post(`/bookings/${bookingId}/cancel`, { reason });
    return response.data.data;
  },

  // ========== STYLIST ENDPOINTS ==========

  /**
   * Get stylist schedule
   */
  async getStylistSchedule(stylistId: string): Promise<Stylist | null> {
    try {
      const response = await salonClient.get(`/availability/stylist/${stylistId}`);
      return response.data.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get stylists (from salon details or separate endpoint)
   */
  async getStylists(merchantId: string): Promise<Stylist[]> {
    // This would typically be part of salon details or a separate endpoint
    // For now, return empty array - implement based on backend
    logger.info('getStylists called - needs backend implementation');
    return [];
  },

  // ========== CUSTOMER/CRM ENDPOINTS ==========

  /**
   * Get customer history
   */
  async getCustomerHistory(customerId: string): Promise<{
    totalVisits: number;
    lastVisit: string;
    totalSpent: number;
    bookings: Booking[];
  } | null> {
    try {
      const response = await crmClient.get(`/customers/${customerId}/history`);
      return response.data.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get customer profile
   */
  async getCustomerProfile(customerId: string): Promise<Customer | null> {
    try {
      const response = await crmClient.get(`/customers/${customerId}`);
      return response.data.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Update customer preferences
   */
  async updateCustomerPreferences(
    customerId: string,
    preferences: {
      preferredStylist?: string;
      preferredServices?: string[];
      notes?: string;
    }
  ): Promise<Customer> {
    const response = await crmClient.patch(`/customers/${customerId}/preferences`, preferences);
    return response.data.data;
  },

  // ========== REVIEWS ENDPOINTS ==========

  /**
   * Get salon reviews
   */
  async getSalonReviews(salonId: string, limit: number = 10): Promise<Review[]> {
    const requestKey = createRequestKey('GET', `/salons/${salonId}/reviews`, { limit });

    return globalDeduplicator.execute(requestKey, async () => {
      try {
        const response = await salonClient.get(`/salons/${salonId}/reviews`, { params: { limit } });
        return response.data.data || [];
      } catch (error) {
        // Return empty array if endpoint doesn't exist
        logger.warn('Salon reviews endpoint not available');
        return [];
      }
    });
  },
};

// Convenience exports
export default salonApi;
