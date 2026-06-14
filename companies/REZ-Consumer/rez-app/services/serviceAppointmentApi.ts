// @ts-nocheck
// Service Appointment API Service
// Handles service appointment booking operations (salon, spa, etc.)

import apiClient, { ApiResponse } from './apiClient';
import { logger } from '@/utils/logger';

// TypeScript Interfaces
export interface ServiceAppointmentRequest {
  storeId: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  specialInstructions?: string;
  staffMember?: string;
  /** Staff MongoDB ObjectId — passed through to backend Joi schema */
  staffId?: string;
  /** Staff display name — passed alongside staffId */
  staffName?: string;
  /** @deprecated Use serviceType instead */
  serviceId?: string;
  /** @deprecated Use appointmentDate instead */
  date?: string;
  /** @deprecated Use appointmentTime instead */
  time?: string;
  /** @deprecated Use specialInstructions instead */
  notes?: string;
}

export interface ServiceAppointment {
  id: string;
  appointmentId: string;
  storeId: string;
  store: {
    id: string;
    name: string;
    logo?: string;
    address: string;
    phone: string;
  };
  serviceId: string;
  service: {
    id: string;
    name: string;
    description?: string;
    price: number;
    duration: number;
  };
  userId: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'cancelled' | 'completed' | 'no_show';
  confirmationCode?: string;
  staffMember?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  staffAvailable?: number;
}

export interface ServiceAvailability {
  date: string;
  slots: TimeSlot[];
  fullyBooked: boolean;
}

export interface ServiceAppointmentsResponse {
  appointments: ServiceAppointment[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

class ServiceAppointmentApi {
  /**
   * Create a new service appointment
   * POST /api/service-appointments
   */
  async createServiceAppointment(data: ServiceAppointmentRequest): Promise<ApiResponse<ServiceAppointment>> {
    logger.debug('\n┌─────────────────────────────────────────┐');
    logger.debug('│ SERVICE APPOINTMENT API - CREATE        │');
    logger.debug('└─────────────────────────────────────────┘');
    logger.debug('📅 Appointment Data:', JSON.stringify(data, null, 2));

    try {
      const response = await apiClient.post<ServiceAppointment>('/service-appointments', data as unknown);

      if (response.success) {
        logger.debug('✅ [SERVICE APPOINTMENT API] Appointment created successfully');
        logger.debug('📝 Appointment ID:', response.data?.appointmentId);
        logger.debug('🎫 Confirmation Code:', response.data?.confirmationCode);
      } else {
        logger.error('❌ [SERVICE APPOINTMENT API] Failed to create appointment:', response.error);
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [SERVICE APPOINTMENT API] Create appointment error:', error);
      throw error;
    }
  }

  /**
   * Get all service appointments for the current user
   * GET /api/service-appointments/user
   */
  async getUserServiceAppointments(
    page: number = 1,
    limit: number = 20,
    status?: ServiceAppointment['status']
  ): Promise<ApiResponse<ServiceAppointmentsResponse>> {
    logger.debug('\n┌─────────────────────────────────────────┐');
    logger.debug('│ SERVICE APPOINTMENT API - GET USER APPTS│');
    logger.debug('└─────────────────────────────────────────┘');
    logger.debug('📄 Page:', page);
    logger.debug('📊 Limit:', limit);
    logger.debug('📌 Status Filter:', status || 'all');

    try {
      const params: Record<string, unknown> = { page, limit };
      if (status) {
        params.status = status;
      }

      const response = await apiClient.get<ServiceAppointmentsResponse>('/service-appointments/user', params);

      if (response.success) {
        logger.debug('✅ [SERVICE APPOINTMENT API] User appointments fetched successfully');
        logger.debug('📊 Total appointments:', response.data?.pagination.total);
        logger.debug('📄 Current page:', response.data?.pagination.current);
      } else {
        logger.error('❌ [SERVICE APPOINTMENT API] Failed to fetch user appointments:', response.error);
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [SERVICE APPOINTMENT API] Get user appointments error:', error);
      throw error;
    }
  }

  /**
   * Get a specific service appointment by ID
   * GET /api/service-appointments/:appointmentId
   */
  async getServiceAppointment(appointmentId: string): Promise<ApiResponse<ServiceAppointment>> {
    logger.debug('\n┌─────────────────────────────────────────┐');
    logger.debug('│ SERVICE APPOINTMENT API - GET APPT      │');
    logger.debug('└─────────────────────────────────────────┘');
    logger.debug('🎫 Appointment ID:', appointmentId);

    try {
      const response = await apiClient.get<ServiceAppointment>(`/service-appointments/${appointmentId}`);

      if (response.success) {
        logger.debug('✅ [SERVICE APPOINTMENT API] Appointment details fetched successfully');
        logger.debug('📝 Status:', response.data?.status);
        logger.debug('🏪 Store:', response.data?.store.name);
        logger.debug('💇 Service:', response.data?.service.name);
      } else {
        logger.error('❌ [SERVICE APPOINTMENT API] Failed to fetch appointment:', response.error);
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [SERVICE APPOINTMENT API] Get appointment error:', error);
      throw error;
    }
  }

  /**
   * Cancel a service appointment
   * PUT /api/service-appointments/:appointmentId/cancel
   */
  async cancelServiceAppointment(
    appointmentId: string,
    reason?: string
  ): Promise<ApiResponse<{ message: string; appointment: ServiceAppointment }>> {
    logger.debug('\n┌─────────────────────────────────────────┐');
    logger.debug('│ SERVICE APPOINTMENT API - CANCEL        │');
    logger.debug('└─────────────────────────────────────────┘');
    logger.debug('🎫 Appointment ID:', appointmentId);
    logger.debug('📝 Reason:', reason || 'Not provided');

    try {
      const response = await apiClient.put<{ message: string; appointment: ServiceAppointment }>(
        `/service-appointments/${appointmentId}/cancel`,
        { reason }
      );

      if (response.success) {
        logger.debug('✅ [SERVICE APPOINTMENT API] Appointment cancelled successfully');
        logger.debug('📝 New Status:', response.data?.appointment.status);
      } else {
        logger.error('❌ [SERVICE APPOINTMENT API] Failed to cancel appointment:', response.error);
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [SERVICE APPOINTMENT API] Cancel appointment error:', error);
      throw error;
    }
  }

  /**
   * Check service availability for a specific store, date, and time
   * GET /api/service-appointments/availability/:storeId
   */
  async checkAvailability(
    storeId: string,
    date: string,
    time?: string,
    serviceId?: string
  ): Promise<ApiResponse<ServiceAvailability>> {
    logger.debug('\n┌─────────────────────────────────────────┐');
    logger.debug('│ SERVICE APPOINTMENT API - CHECK AVAIL   │');
    logger.debug('└─────────────────────────────────────────┘');
    logger.debug('🏪 Store ID:', storeId);
    logger.debug('📅 Date:', date);
    logger.debug('⏰ Time:', time || 'all');
    logger.debug('💇 Service ID:', serviceId || 'unknown');

    try {
      const params: Record<string, unknown> = { date };
      if (time) {
        params.time = time;
      }
      if (serviceId) {
        params.serviceId = serviceId;
      }

      const response = await apiClient.get<ServiceAvailability>(
        `/service-appointments/availability/${storeId}`,
        params
      );

      if (response.success) {
        logger.debug('✅ [SERVICE APPOINTMENT API] Availability checked successfully');
        logger.debug('📊 Total slots:', response.data?.slots.length);
        logger.debug('🚫 Fully booked:', response.data?.fullyBooked);
      } else {
        logger.error('❌ [SERVICE APPOINTMENT API] Failed to check availability:', response.error);
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [SERVICE APPOINTMENT API] Check availability error:', error);
      throw error;
    }
  }

  /**
   * Get available time slots for a specific date
   * GET /api/service-appointments/slots/:storeId
   */
  async getAvailableSlots(
    storeId: string,
    date: string,
    serviceId?: string
  ): Promise<ApiResponse<TimeSlot[]>> {
    logger.debug('\n┌─────────────────────────────────────────┐');
    logger.debug('│ SERVICE APPOINTMENT API - GET SLOTS     │');
    logger.debug('└─────────────────────────────────────────┘');
    logger.debug('🏪 Store ID:', storeId);
    logger.debug('📅 Date:', date);
    logger.debug('💇 Service ID:', serviceId || 'unknown');

    try {
      const params: Record<string, unknown> = { date };
      if (serviceId) {
        params.serviceId = serviceId;
      }

      const response = await apiClient.get<TimeSlot[]>(
        `/service-appointments/slots/${storeId}`,
        params
      );

      if (response.success) {
        logger.debug('✅ [SERVICE APPOINTMENT API] Available slots fetched successfully');
        logger.debug('📊 Available slots:', response.data?.filter(s => s.available).length);
      } else {
        logger.error('❌ [SERVICE APPOINTMENT API] Failed to fetch slots:', response.error);
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [SERVICE APPOINTMENT API] Get slots error:', error);
      throw error;
    }
  }

  /**
   * Get services offered by a store
   * GET /api/service-appointments/services/:storeId
   */
  async getStoreServices(storeId: string): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    duration: number;
    category?: string;
  }>>> {
    logger.debug('\n┌─────────────────────────────────────────┐');
    logger.debug('│ SERVICE APPOINTMENT API - GET SERVICES  │');
    logger.debug('└─────────────────────────────────────────┘');
    logger.debug('🏪 Store ID:', storeId);

    try {
      const response = await apiClient.get<Array<{
        id: string;
        name: string;
        description?: string;
        price: number;
        duration: number;
        category?: string;
      }>>(`/service-appointments/services/${storeId}`);

      if (response.success) {
        logger.debug('✅ [SERVICE APPOINTMENT API] Services fetched successfully');
        logger.debug('📊 Total services:', response.data?.length);
      } else {
        logger.error('❌ [SERVICE APPOINTMENT API] Failed to fetch services:', response.error);
      }

      return response as unknown;
    } catch (error) {
      logger.error('❌ [SERVICE APPOINTMENT API] Get services error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const serviceAppointmentApi = new ServiceAppointmentApi();

export default serviceAppointmentApi;
