// @ts-nocheck
import apiClient from '@/services/apiClient';
import { logger } from '@/utils/logger';

// TypeScript Interfaces
interface CreateConsultationRequest {
  storeId: string;
  consultationType: string;
  consultationDate: string; // ISO date
  consultationTime: string; // HH:MM format
  duration?: number; // default 30 minutes
  patientName: string;
  patientAge: number;
  patientPhone: string;
  patientEmail?: string;
  reasonForConsultation: string;
  medicalHistory?: string;
}

interface Consultation {
  _id: string;
  consultationNumber: string;
  storeId: string;
  userId: string;
  consultationType: string;
  consultationDate: string;
  consultationTime: string;
  duration: number;
  patientName: string;
  patientAge: number;
  patientPhone: string;
  patientEmail?: string;
  reasonForConsultation: string;
  medicalHistory?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  doctorName?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// Consultation API Service
const consultationApi = {
  /**
   * Create a new medical consultation
   * @param data - Consultation details
   * @returns Promise with API response containing consultation data
   */
  createConsultation: async (data: CreateConsultationRequest): Promise<ApiResponse<Consultation>> => {
    try {
      logger.debug('[consultationApi] Creating consultation with data:', data);
      logger.debug('[consultationApi] Store ID:', data.storeId);
      logger.debug('[consultationApi] Consultation Type:', data.consultationType);
      logger.debug('[consultationApi] Date:', data.consultationDate);
      logger.debug('[consultationApi] Time:', data.consultationTime);
      logger.debug('[consultationApi] Patient:', data.patientName);

      const response = await apiClient.post<unknown>('/consultations', data as unknown);

      logger.debug('[consultationApi] Consultation created successfully:', response);
      if (response.success && response.data) {
        logger.debug('[consultationApi] Consultation Number:', response.data.consultationNumber);
        logger.debug('[consultationApi] Status:', response.data.status);
      }

      return response as unknown;
    } catch (error) {
      logger.error('[consultationApi] Error creating consultation:', error);
      throw error;
    }
  },

  /**
   * Get all consultations for the current user
   * @returns Promise with API response containing array of consultations
   */
  getUserConsultations: async (): Promise<ApiResponse<Consultation[]>> => {
    try {
      logger.debug('[consultationApi] Fetching user consultations');

      const response = await apiClient.get<unknown>('/consultations/user');

      logger.debug('[consultationApi] User consultations fetched successfully');
      if (response.success && response.data) {
        logger.debug('[consultationApi] Total consultations:', response.data.length);
        logger.debug('[consultationApi] Consultations:', response.data);
      }

      return response as unknown;
    } catch (error) {
      logger.error('[consultationApi] Error fetching user consultations:', error);
      throw error;
    }
  },

  /**
   * Get details of a specific consultation
   * @param consultationId - ID of the consultation
   * @returns Promise with API response containing consultation data
   */
  getConsultation: async (consultationId: string): Promise<ApiResponse<Consultation>> => {
    try {
      logger.debug('[consultationApi] Fetching consultation with ID:', consultationId);

      const response = await apiClient.get<unknown>(`/consultations/${consultationId}`);

      logger.debug('[consultationApi] Consultation fetched successfully');
      if (response.success && response.data) {
        logger.debug('[consultationApi] Consultation Number:', response.data.consultationNumber);
        logger.debug('[consultationApi] Status:', response.data.status);
        logger.debug('[consultationApi] Patient:', response.data.patientName);
        logger.debug('[consultationApi] Doctor:', response.data.doctorName || 'Not assigned');
      }

      return response as unknown;
    } catch (error) {
      logger.error('[consultationApi] Error fetching consultation:', error);
      throw error;
    }
  },

  /**
   * Cancel a consultation
   * @param consultationId - ID of the consultation to cancel
   * @returns Promise with API response containing updated consultation data
   */
  cancelConsultation: async (consultationId: string): Promise<ApiResponse<Consultation>> => {
    try {
      logger.debug('[consultationApi] Cancelling consultation with ID:', consultationId);

      const response = await apiClient.put<unknown>(`/consultations/${consultationId}/cancel`, {});

      logger.debug('[consultationApi] Consultation cancelled successfully');
      if (response.success && response.data) {
        logger.debug('[consultationApi] Updated Status:', response.data.status);
        logger.debug('[consultationApi] Consultation Number:', response.data.consultationNumber);
      }

      return response as unknown;
    } catch (error) {
      logger.error('[consultationApi] Error cancelling consultation:', error);
      throw error;
    }
  },

  /**
   * Check available time slots for a store on a specific date
   * @param storeId - ID of the store/clinic
   * @param date - Date to check availability (ISO format)
   * @returns Promise with API response containing availability data
   */
  checkAvailability: async (storeId: string, date: string): Promise<ApiResponse<unknown>> => {
    try {
      logger.debug('[consultationApi] Checking availability');
      logger.debug('[consultationApi] Store ID:', storeId);
      logger.debug('[consultationApi] Date:', date);

      const response = await apiClient.get<unknown>(`/consultations/availability/${storeId}?date=${date}`);

      logger.debug('[consultationApi] Availability data fetched successfully');
      if (response.success && response.data) {
        logger.debug('[consultationApi] Availability:', response.data);
      }

      return response as unknown;
    } catch (error) {
      logger.error('[consultationApi] Error checking availability:', error);
      throw error;
    }
  },
};

// Export types for use in other files
export type {
  CreateConsultationRequest,
  Consultation,
  ApiResponse,
};

export default consultationApi;
