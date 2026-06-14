// @ts-nocheck
/**
 * Creator QR - API Service
 * REZ Consumer App integration
 */

import apiClient, { ApiResponse } from './apiClient';

// ============================================
// TYPES
// ============================================

export interface Creator {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  category: string;
  tags: string[];
  socialLinks: { platform: string; url: string }[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  tier: string;
  memberSince: string;
  stats: {
    totalViews: number;
    totalBookings: number;
    totalFollowers: number;
    totalConversions: number;
  };
}

export interface Listing {
  _id: string;
  creatorId: string;
  type: 'service' | 'consulting' | 'booking' | 'promotion' | 'product';
  title: string;
  description: string;
  price: number;
  currency: string;
  delivery: 'instant' | 'scheduled' | 'manual';
  duration?: number;
  slots?: TimeSlot[];
  platform?: string;
  deliverables?: string[];
  revisions?: number;
  views: number;
  bookings: number;
  rating: number;
  active: boolean;
  createdAt: string;
}

export interface TimeSlot {
  id: string;
  day: number;
  times: string[];
}

export interface Booking {
  _id: string;
  listingId: string;
  creatorId: string;
  buyerId: string;
  date?: string;
  time?: string;
  duration?: number;
  buyerRequirements?: string;
  deliveryType: 'instant' | 'scheduled' | 'manual';
  deliveredContentUrl?: string;
  deliveryNotes?: string;
  amount: number;
  currency: string;
  platformFee: number;
  creatorEarnings: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'disputed';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  createdAt: string;
}

export interface CreatorStats {
  period: string;
  bookings: {
    total: number;
    byStatus: Record<string, number>;
  };
  earnings: {
    total: number;
    platformFees: number;
  };
  qr: {
    scans: number;
    conversions: number;
  };
  stats: Creator['stats'];
}

// ============================================
// API SERVICE
// ============================================

class CreatorQRApiService {
  private baseUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4008/api'}`;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private authHeaders() {
    return {
      Authorization: `Bearer ${apiClient.getToken()}`,
    };
  }

  // ============================================
  // CREATORS
  // ============================================

  async getCreators(params?: {
    limit?: number;
    page?: number;
    category?: string;
    sort?: string;
  }): Promise<ApiResponse<{ creators: Creator[]; total: number }>> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.page) query.append('page', params.page.toString());
    if (params?.category) query.append('category', params.category);
    if (params?.sort) query.append('sort', params.sort);

    return this.request<unknown>(`/creators?${query}`);
  }

  async getFeaturedCreators(limit?: number): Promise<ApiResponse<{ creators: Creator[] }>> {
    return this.request<unknown>(`/creators/featured?limit=${limit || 10}`);
  }

  async getCreatorById(id: string): Promise<ApiResponse<Creator>> {
    return this.request<unknown>(`/creators/${id}`);
  }

  async getCreatorByUsername(username: string): Promise<ApiResponse<Creator>> {
    return this.request<unknown>(`/creators/u/${username}`);
  }

  // ============================================
  // PROFILE MANAGEMENT
  // ============================================

  async createProfile(data: {
    username: string;
    displayName: string;
    bio?: string;
    category: string;
    tags?: string[];
    socialLinks?: { platform: string; url: string }[];
  }): Promise<ApiResponse<Creator>> {
    return this.request<unknown>('/creators', {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(data),
    });
  }

  async updateProfile(data: {
    displayName?: string;
    bio?: string;
    avatar?: string;
    coverImage?: string;
    tags?: string[];
    socialLinks?: { platform: string; url: string }[];
  }): Promise<ApiResponse<Creator>> {
    return this.request<unknown>('/creators/profile', {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // LISTINGS
  // ============================================

  async getListing(id: string): Promise<ApiResponse<Listing>> {
    return this.request<unknown>(`/listings/${id}`);
  }

  async getTrendingListings(type?: string, limit?: number): Promise<ApiResponse<{ listings: Listing[] }>> {
    const query = new URLSearchParams();
    if (type) query.append('type', type);
    if (limit) query.append('limit', limit.toString());

    return this.request<unknown>(`/listings/trending?${query}`);
  }

  async getCreatorListings(
    creatorId: string,
    params?: { type?: string; status?: string }
  ): Promise<ApiResponse<{ listings: Listing[] }>> {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);

    return this.request<unknown>(`/creators/${creatorId}/listings?${query}`);
  }

  async createListing(data: {
    type: Listing['type'];
    title: string;
    description: string;
    price: number;
    delivery?: Listing['delivery'];
    duration?: number;
    slots?: TimeSlot[];
    platform?: string;
    deliverables?: string[];
    requirements?: string[];
    includes?: string[];
  }): Promise<ApiResponse<Listing>> {
    return this.request<unknown>('/listings', {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(data),
    });
  }

  async updateListing(
    id: string,
    data: Partial<Listing>
  ): Promise<ApiResponse<Listing>> {
    return this.request<unknown>(`/listings/${id}`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify(data),
    });
  }

  async deleteListing(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/listings/${id}`, {
      method: 'DELETE',
      headers: this.authHeaders(),
    });
  }

  // ============================================
  // BOOKINGS
  // ============================================

  async createBooking(data: {
    listingId: string;
    date?: string;
    time?: string;
    duration?: number;
    buyerRequirements?: string;
  }): Promise<ApiResponse<Booking>> {
    return this.request<unknown>('/bookings', {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(data),
    });
  }

  async getMyBookings(params: {
    role: 'buyer' | 'creator';
    status?: Booking['status'];
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ bookings: Booking[]; total: number }>> {
    const query = new URLSearchParams();
    query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return this.request<unknown>(`/bookings/my?${query}`, {
      headers: this.authHeaders(),
    });
  }

  async getBooking(id: string): Promise<ApiResponse<Booking>> {
    return this.request<unknown>(`/bookings/${id}`, {
      headers: this.authHeaders(),
    });
  }

  async confirmBooking(id: string): Promise<ApiResponse<Booking>> {
    return this.request<unknown>(`/bookings/${id}/confirm`, {
      method: 'POST',
      headers: this.authHeaders(),
    });
  }

  async completeBooking(id: string): Promise<ApiResponse<Booking>> {
    return this.request<unknown>(`/bookings/${id}/complete`, {
      method: 'POST',
      headers: this.authHeaders(),
    });
  }

  async cancelBooking(id: string): Promise<ApiResponse<Booking>> {
    return this.request<unknown>(`/bookings/${id}/cancel`, {
      method: 'POST',
      headers: this.authHeaders(),
    });
  }

  async deliverBooking(
    id: string,
    data: { deliveredContentUrl?: string; deliveryNotes?: string }
  ): Promise<ApiResponse<Booking>> {
    return this.request<unknown>(`/bookings/${id}/deliver`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async getCreatorAnalytics(
    creatorId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<CreatorStats>> {
    return this.request<unknown>(`/creators/${creatorId}/analytics?period=${period}`, {
      headers: this.authHeaders(),
    });
  }

  // ============================================
  // QR RESOLUTION
  // ============================================

  async resolveQR(shortUrl: string): Promise<ApiResponse<unknown>> {
    return this.request<unknown>(`/qr/${shortUrl}`);
  }

  async getQRImage(shortUrl: string): Promise<ApiResponse<{ imageUrl: string }>> {
    return this.request<unknown>(`/qr/${shortUrl}/image`);
  }
}

// Singleton instance
const creatorQRApi = new CreatorQRApiService();

export default creatorQRApi;
export { creatorQRApi };
