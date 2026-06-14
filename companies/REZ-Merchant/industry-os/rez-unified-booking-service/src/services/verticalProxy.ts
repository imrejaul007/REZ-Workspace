import axios, { AxiosInstance, AxiosError } from 'axios';
import { getVerticalServiceUrl, isValidVertical } from '../config/verticals';
import { getConfig } from '../config';
import { createLogger } from '../utils/logger';
import {
  VerticalProxyResponse,
  AvailabilitySlot,
  VerticalBookingResponse,
} from '../types';

const logger = createLogger('vertical-proxy');

// Cache for axios instances per vertical
const verticalClients = new Map<string, AxiosInstance>();

/**
 * Get or create an axios client for a specific vertical service
 */
export function getVerticalClient(vertical: string): AxiosInstance {
  if (!isValidVertical(vertical)) {
    throw new Error(`Invalid vertical: ${vertical}`);
  }

  const existingClient = verticalClients.get(vertical);
  if (existingClient) {
    return existingClient;
  }

  const serviceUrl = getVerticalServiceUrl(vertical);
  if (!serviceUrl) {
    throw new Error(`No service URL configured for vertical: ${vertical}`);
  }

  const config = getConfig();

  const client = axios.create({
    baseURL: serviceUrl,
    timeout: config.VERTICAL_SERVICE_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      'X-Unified-Service': 'rez-unified-booking',
      'X-Internal-Token': config.INTERNAL_API_KEY || '',
    },
    retries: config.VERTICAL_SERVICE_RETRY_COUNT,
  });

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      logger.error('Vertical service error', {
        vertical,
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
      });
      return Promise.reject(error);
    }
  );

  verticalClients.set(vertical, client);
  return client;
}

/**
 * Clear cached client for a vertical (for testing/config reload)
 */
export function clearVerticalClient(vertical: string): void {
  verticalClients.delete(vertical);
}

/**
 * Clear all cached clients
 */
export function clearAllVerticalClients(): void {
  verticalClients.clear();
}

// ============================================
// Availability Methods
// ============================================

export interface CheckAvailabilityParams {
  merchantId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  partySize?: number;
  filters?: Record<string, unknown>;
}

export async function checkAvailability(
  vertical: string,
  params: CheckAvailabilityParams
): Promise<VerticalProxyResponse<AvailabilitySlot[]>> {
  try {
    const client = getVerticalClient(vertical);

    logger.debug('Checking availability', { vertical, params });

    const response = await client.post<{ slots: AvailabilitySlot[] }>(
      '/api/availability/check',
      {
        merchantId: params.merchantId,
        date: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
        partySize: params.partySize,
        filters: params.filters,
      }
    );

    return {
      success: true,
      data: response.data.slots || [],
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      error: {
        code: 'VERTICAL_UNAVAILABLE',
        message: `Failed to check availability for ${vertical}: ${axiosError.message}`,
        details: {
          vertical,
          status: axiosError.response?.status,
          url: axiosError.config?.url,
        },
      },
    };
  }
}

// ============================================
// Booking Methods
// ============================================

export interface CreateVerticalBookingParams {
  merchantId: string;
  userId: string;
  type: string;
  startDateTime: string;
  duration?: number;
  partySize?: number;
  bookingData?: Record<string, unknown>;
}

export async function createVerticalBooking(
  vertical: string,
  params: CreateVerticalBookingParams
): Promise<VerticalProxyResponse<VerticalBookingResponse>> {
  try {
    const client = getVerticalClient(vertical);

    logger.debug('Creating vertical booking', { vertical, params });

    const response = await client.post<VerticalBookingResponse>(
      '/api/bookings',
      params
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      error: {
        code: 'VERTICAL_UNAVAILABLE',
        message: `Failed to create booking in ${vertical}: ${axiosError.message}`,
        details: {
          vertical,
          status: axiosError.response?.status,
          url: axiosError.config?.url,
        },
      },
    };
  }
}

export async function getVerticalBooking(
  vertical: string,
  bookingId: string
): Promise<VerticalProxyResponse<VerticalBookingResponse>> {
  try {
    const client = getVerticalClient(vertical);

    logger.debug('Getting vertical booking', { vertical, bookingId });

    const response = await client.get<VerticalBookingResponse>(
      `/api/bookings/${bookingId}`
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      error: {
        code: 'VERTICAL_UNAVAILABLE',
        message: `Failed to get booking from ${vertical}: ${axiosError.message}`,
        details: {
          vertical,
          status: axiosError.response?.status,
          url: axiosError.config?.url,
        },
      },
    };
  }
}

export async function updateVerticalBooking(
  vertical: string,
  bookingId: string,
  updates: Record<string, unknown>
): Promise<VerticalProxyResponse<VerticalBookingResponse>> {
  try {
    const client = getVerticalClient(vertical);

    logger.debug('Updating vertical booking', { vertical, bookingId, updates });

    const response = await client.put<VerticalBookingResponse>(
      `/api/bookings/${bookingId}`,
      updates
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      error: {
        code: 'VERTICAL_UNAVAILABLE',
        message: `Failed to update booking in ${vertical}: ${axiosError.message}`,
        details: {
          vertical,
          status: axiosError.response?.status,
          url: axiosError.config?.url,
        },
      },
    };
  }
}

export async function deleteVerticalBooking(
  vertical: string,
  bookingId: string,
  reason?: string
): Promise<VerticalProxyResponse<{ deleted: boolean }>> {
  try {
    const client = getVerticalClient(vertical);

    logger.debug('Deleting vertical booking', { vertical, bookingId, reason });

    await client.delete(`/api/bookings/${bookingId}`, {
      data: reason ? { reason } : undefined,
    });

    return {
      success: true,
      data: { deleted: true },
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      error: {
        code: 'VERTICAL_UNAVAILABLE',
        message: `Failed to delete booking from ${vertical}: ${axiosError.message}`,
        details: {
          vertical,
          status: axiosError.response?.status,
          url: axiosError.config?.url,
        },
      },
    };
  }
}

// ============================================
// Health Check
// ============================================

export async function checkVerticalHealth(vertical: string): Promise<boolean> {
  try {
    const client = getVerticalClient(vertical);
    const response = await client.get('/health', { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

export async function checkAllVerticalHealth(): Promise<Record<string, boolean>> {
  const verticals = [
    'restaurant', 'hotel', 'salon', 'spa', 'gym',
    'education', 'events', 'automotive', 'medical',
    'tours', 'rentals', 'entertainment', 'cleaning',
    'repair', 'childcare', 'petcare', 'legal',
  ];

  const results: Record<string, boolean> = {};

  await Promise.all(
    verticals.map(async (vertical) => {
      results[vertical] = await checkVerticalHealth(vertical);
    })
  );

  return results;
}

export default {
  getVerticalClient,
  clearVerticalClient,
  clearAllVerticalClients,
  checkAvailability,
  createVerticalBooking,
  getVerticalBooking,
  updateVerticalBooking,
  deleteVerticalBooking,
  checkVerticalHealth,
  checkAllVerticalHealth,
};