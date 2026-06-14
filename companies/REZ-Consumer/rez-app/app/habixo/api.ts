// Habixo Consumer API Client
// Connects to rez-habixo-service

import axios, { AxiosInstance } from 'axios';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface HabixoProperty {
  id: string;
  title: string;
  location: string;
  city: string;
  price: number;
  rating: number;
  reviews: number;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  guests: number;
  type: string;
  amenities: string[];
  host: { name: string; rating: number; responseRate: number };
  brand: 'habixo_stay' | 'habixo_rent' | 'habixo_match';
  status: string;
}

export interface HabixoBooking {
  id: string;
  propertyId: string;
  property: HabixoProperty;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  total: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
}

export interface FlatmateMatch {
  id: string;
  name: string;
  age: number;
  occupation: string;
  location: string;
  vibeTags: string[];
  compatibility: number;
  budget: string;
  lifestyle: {
    sleep: string;
    smoke: string;
    drink: string;
    pets: boolean;
    workFromHome: boolean;
  };
  image: string;
}

export interface SearchParams {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  amenities?: string[];
  brand?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

// ─── API Client ─────────────────────────────────────────────────────────────

const HABIXO_API_URL = process.env.EXPO_PUBLIC_HABIXO_API_URL || 'http://localhost:3007';

const apiClient: AxiosInstance = axios.create({
  baseURL: HABIXO_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Auth Interceptor ────────────────────────────────────────────────────────

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = () => authToken;

// ─── Error Handler ──────────────────────────────────────────────────────────

const handleApiError = (error: unknown): { success: false; error: string } => {
  if (axios.isAxiosError(error)) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'API Error',
    };
  }
  return { success: false, error: 'Unknown error' };
};

// ─── Properties API ───────────────────────────────────────────────────────────

export const getProperties = async (params: SearchParams = {}): Promise<{
  success: boolean;
  data?: HabixoProperty[];
  error?: string;
}> => {
  try {
    const response = await apiClient.get('/api/habixo/properties', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getProperty = async (id: string): Promise<{
  success: boolean;
  data?: HabixoProperty;
  error?: string;
}> => {
  try {
    const response = await apiClient.get(`/api/habixo/properties/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const searchProperties = async (params: SearchParams): Promise<{
  success: boolean;
  data?: HabixoProperty[];
  total?: number;
  error?: string;
}> => {
  try {
    const response = await apiClient.get('/api/habixo/search', { params });
    return {
      success: true,
      data: response.data.data,
      total: response.data.pagination?.total,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getSearchSuggestions = async (query: string): Promise<{
  success: boolean;
  data?: { cities: string[]; areas: string[]; amenities: string[] };
  error?: string;
}> => {
  try {
    const response = await apiClient.get('/api/habixo/search/suggestions', {
      params: { query },
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    return handleApiError(error);
  }
};

// ─── Bookings API ────────────────────────────────────────────────────────────

export const createBooking = async (data: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: { adults: number; children?: number; infants?: number };
}): Promise<{
  success: boolean;
  data?: HabixoBooking;
  error?: string;
}> => {
  try {
    const response = await apiClient.post('/api/habixo/bookings', data);
    return { success: true, data: response.data.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getBookings = async (status?: string): Promise<{
  success: boolean;
  data?: HabixoBooking[];
  error?: string;
}> => {
  try {
    const response = await apiClient.get('/api/habixo/bookings', {
      params: { status },
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getBooking = async (id: string): Promise<{
  success: boolean;
  data?: HabixoBooking;
  error?: string;
}> => {
  try {
    const response = await apiClient.get(`/api/habixo/bookings/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const cancelBooking = async (id: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    await apiClient.post(`/api/habixo/bookings/${id}/cancel`);
    return { success: true };
  } catch (error) {
    return handleApiError(error);
  }
};

// ─── Matching API ───────────────────────────────────────────────────────────

export const getMatchSuggestions = async (params?: {
  city?: string;
  vibeTags?: string[];
}): Promise<{
  success: boolean;
  data?: FlatmateMatch[];
  error?: string;
}> => {
  try {
    const response = await apiClient.get('/api/habixo/match/suggestions', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const createFlatmateProfile = async (data: {
  lifestyle: {
    vibeTags?: string[];
    sleepSchedule?: string;
    workFromHome?: boolean;
    smoking?: string;
    drinking?: string;
    pets?: boolean;
  };
  preferences: {
    minBudget?: number;
    maxBudget?: number;
    preferredAreas?: string[];
    moveInDate?: string;
    leaseDuration?: number;
  };
}): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    await apiClient.post('/api/habixo/match/profile', data);
    return { success: true };
  } catch (error) {
    return handleApiError(error);
  }
};

// ─── Wishlist API ───────────────────────────────────────────────────────────

export const getWishlist = async (): Promise<{
  success: boolean;
  data?: HabixoProperty[];
  error?: string;
}> => {
  try {
    const response = await apiClient.get('/api/habixo/wishlist');
    return { success: true, data: response.data.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const addToWishlist = async (propertyId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    await apiClient.post('/api/habixo/wishlist', { propertyId });
    return { success: true };
  } catch (error) {
    return handleApiError(error);
  }
};

export const removeFromWishlist = async (propertyId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    await apiClient.delete(`/api/habixo/wishlist/${propertyId}`);
    return { success: true };
  } catch (error) {
    return handleApiError(error);
  }
};

// ─── Trust API ──────────────────────────────────────────────────────────────

export const getTrustScore = async (
  entityId: string,
  type: 'property' | 'host' | 'guest'
): Promise<{
  success: boolean;
  data?: {
    score: number;
    level: string;
    components: {
      reliability: number;
      quality: number;
      behavior: number;
      reviews: number;
    };
  };
  error?: string;
}> => {
  try {
    const response = await apiClient.get(`/api/habixo/trust/${entityId}`, {
      params: { type },
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    return handleApiError(error);
  }
};

// ─── Health Check ──────────────────────────────────────────────────────────

export const checkHabixoHealth = async (): Promise<{ healthy: boolean; error?: string }> => {
  try {
    const response = await apiClient.get('/health');
    return { healthy: response.data.status === 'healthy' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { healthy: false, error: errorMessage };
  }
};
