import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisine: string[];
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  images: string[];
  rating: number;
  reviewCount: number;
  priceRange: string;
  isActive: boolean;
  isVerified: boolean;
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  features: string[];
  deliveryRadius: number;
  minimumOrder: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
  tags: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRestaurantRequest {
  name: string;
  description?: string;
  cuisine: string[];
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  priceRange: string;
  openingHours: Restaurant['openingHours'];
  features: string[];
  deliveryRadius: number;
  minimumOrder: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
}

export interface RestaurantFilters {
  cuisine?: string[];
  priceRange?: string[];
  rating?: number;
  features?: string[];
  city?: string;
  isOpen?: boolean;
  delivery?: boolean;
  sortBy?: 'rating' | 'distance' | 'deliveryTime' | 'priceRange';
  sortOrder?: 'asc' | 'desc';
}

export interface RestaurantAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  customerCount: number;
  rating: number;
  reviewCount: number;
  popularItems: Array<{
    itemId: string;
    name: string;
    orderCount: number;
    revenue: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  busyHours: Array<{
    hour: number;
    orderCount: number;
  }>;
}

class RestaurantsApi {
  async getRestaurants(
    filters?: RestaurantFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Restaurant>> {
    const params = { ...filters, page, limit };
    return apiClient.getPaginated<Restaurant>('/restaurants', params);
  }

  async getRestaurant(id: string): Promise<ApiResponse<Restaurant>> {
    return apiClient.get<Restaurant>(`/restaurants/${id}`);
  }

  async createRestaurant(data: CreateRestaurantRequest): Promise<ApiResponse<Restaurant>> {
    return apiClient.post<Restaurant>('/restaurants', data);
  }

  async updateRestaurant(id: string, data: Partial<CreateRestaurantRequest>): Promise<ApiResponse<Restaurant>> {
    return apiClient.put<Restaurant>(`/restaurants/${id}`, data);
  }

  async deleteRestaurant(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/restaurants/${id}`);
  }

  async searchRestaurants(query: string, filters?: RestaurantFilters): Promise<ApiResponse<Restaurant[]>> {
    return apiClient.search<Restaurant>('/restaurants/search', query, filters);
  }

  async getRestaurantAnalytics(id: string, period?: '7d' | '30d' | '90d' | '1y'): Promise<ApiResponse<RestaurantAnalytics>> {
    const params = period ? { period } : {};
    return apiClient.get<RestaurantAnalytics>(`/restaurants/${id}/analytics`, { params });
  }

  async getRestaurantDashboard(id: string): Promise<ApiResponse<RestaurantAnalytics>> {
    return apiClient.get<RestaurantAnalytics>(`/restaurants/${id}/dashboard`);
  }

  async verifyRestaurant(id: string, documents: File[]): Promise<ApiResponse<void>> {
    const formData = new FormData();
    documents.forEach((doc, index) => {
      formData.append(`document_${index}`, doc);
    });

    const response = await apiClient.post(`/restaurants/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async toggleRestaurantStatus(id: string, isActive: boolean): Promise<ApiResponse<Restaurant>> {
    const endpoint = isActive ? 'activate' : 'deactivate';
    return apiClient.patch<Restaurant>(`/restaurants/${id}/${endpoint}`);
  }

  async uploadRestaurantImages(id: string, images: File[]): Promise<ApiResponse<string[]>> {
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append(`image_${index}`, image);
    });

    const response = await apiClient.post(`/restaurants/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async getNearbyRestaurants(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<ApiResponse<Restaurant[]>> {
    const params = { lat: latitude, lng: longitude, radius };
    return apiClient.get<Restaurant[]>('/restaurants/nearby', { params });
  }

  async getRestaurantMenu(id: string): Promise<ApiResponse<unknown[]>> {
    return apiClient.get<unknown[]>(`/restaurants/${id}/menu`);
  }

  async getRestaurantReviews(
    id: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<unknown>> {
    return apiClient.getPaginated<unknown>(`/restaurants/${id}/reviews`, { page, limit });
  }
}

export const restaurantsApi = new RestaurantsApi();