// Habixo Merchant API Client
// Connects merchant app to Habixo backend APIs
// SECURITY FIX (MA-BACK-AUDIT-005): Replaced console.error with structured logger.
// Console logging can leak sensitive data to stdout and isn't structured for production observability.
import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '@/utils/logger';

// API Configuration
const HABIXO_API_BASE_URL = process.env.EXPO_PUBLIC_HABIXO_API_URL || 'http://localhost:3007';

// Create axios instance with default configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: HABIXO_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token storage
let authToken: string | null = null;

export const setHostAuthToken = (token: string | null) => {
  authToken = token;
};

// Request interceptor for auth token
apiClient.interceptors.request.use(
  async (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      logger.warn('API: Unauthorized - redirect to login');
    }
    return Promise.reject(error);
  }
);

// Types for API responses
export interface HabixoProperty {
  id: string;
  propertyId: string;
  title: string;
  type: 'habixo_stay' | 'habixo_rent' | 'habixo_match';
  status: 'active' | 'draft' | 'inactive';
  location: string;
  city: string;
  image: string;
  price: number;
  rating: number;
  bookings: number;
  earnings: number;
  occupancy: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabixoBooking {
  id: string;
  guestName: string;
  guestAvatar: string;
  propertyId: string;
  property: string;
  propertyImage: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  amount: number;
  status: 'upcoming' | 'pending' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'refunded';
  hostId: string;
  createdAt: string;
}

export interface HabixoEarnings {
  total: number;
  thisMonth: number;
  pendingPayout: number;
  nextPayoutDate: string;
  monthlyEarnings: Array<{ month: string; amount: number }>;
  propertyEarnings: Array<{
    propertyId: string;
    name: string;
    earnings: number;
    bookings: number;
    percentage: number;
  }>;
}

export interface HostProfile {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  totalProperties: number;
  responseRate: number;
  avgRating: number;
  superhost: boolean;
  avatar: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API Functions

/**
 * Get all properties for a host
 * GET /api/habixo/properties/host/:hostId
 */
export async function getHostProperties(hostId: string): Promise<HabixoProperty[]> {
  try {
    const response = await apiClient.get<HabixoProperty[]>(
      `/api/habixo/properties/host/${hostId}`
    );
    return response.data;
  } catch (error) {
    logger.error('API: Failed to fetch host properties', { error, hostId });
    throw handleApiError(error);
  }
}

/**
 * Get all bookings for a host
 * GET /api/habixo/bookings?hostId=
 */
export async function getHostBookings(hostId: string): Promise<HabixoBooking[]> {
  try {
    const response = await apiClient.get<HabixoBooking[]>(
      '/api/habixo/bookings',
      { params: { hostId } }
    );
    return response.data;
  } catch (error) {
    logger.error('API: Failed to fetch host bookings', { error, hostId });
    throw handleApiError(error);
  }
}

/**
 * Get earnings data for a host
 * GET /api/habixo/host/earnings
 */
export async function getHostEarnings(hostId: string): Promise<HabixoEarnings> {
  try {
    const response = await apiClient.get<HabixoEarnings>(
      '/api/habixo/host/earnings',
      { params: { hostId } }
    );
    return response.data;
  } catch (error) {
    logger.error('API: Failed to fetch host earnings', { error, hostId });
    throw handleApiError(error);
  }
}

/**
 * Update a property
 * PUT /api/habixo/properties/:id
 */
export async function updateProperty(
  id: string,
  data: Partial<HabixoProperty>
): Promise<HabixoProperty> {
  try {
    const response = await apiClient.put<HabixoProperty>(
      `/api/habixo/properties/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    logger.error('API: Failed to update property', { error, propertyId: id });
    throw handleApiError(error);
  }
}

/**
 * Mark a booking as completed
 * POST /api/habixo/bookings/:id/complete
 */
export async function updateBookingStatus(
  id: string,
  status: 'completed' | 'cancelled'
): Promise<HabixoBooking> {
  try {
    const response = await apiClient.post<HabixoBooking>(
      `/api/habixo/bookings/${id}/complete`,
      { status }
    );
    return response.data;
  } catch (error) {
    logger.error('API: Failed to update booking status', { error, bookingId: id, status });
    throw handleApiError(error);
  }
}

/**
 * Get host profile
 * GET /api/habixo/host/profile
 */
export async function getHostProfile(hostId: string): Promise<HostProfile> {
  try {
    const response = await apiClient.get<HostProfile>(
      '/api/habixo/host/profile',
      { params: { hostId } }
    );
    return response.data;
  } catch (error) {
    logger.error('API: Failed to fetch host profile', { error, hostId });
    throw handleApiError(error);
  }
}

// Error handling utility
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    return {
      message: error.response?.data?.message || error.message || 'An error occurred',
      code: error.code,
      status: error.response?.status,
    };
  }
  return {
    message: 'An unexpected error occurred',
  };
}

// Export default api client for custom requests
export default apiClient;
