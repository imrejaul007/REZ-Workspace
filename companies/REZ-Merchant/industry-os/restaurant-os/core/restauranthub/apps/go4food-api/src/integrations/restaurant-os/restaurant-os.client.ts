/**
 * Restaurant OS Service Client
 * Port: 4015 (Hotel Search) / 4016 (StayOwn OTA)
 *
 * Handles restaurant data, menus, reviews, and reservations.
 */

import axios, { AxiosInstance } from 'axios';

export interface RestaurantSearchParams {
  lat?: number;
  lng?: number;
  city?: string;
  cuisines?: string[];
  priceRange?: [number, number];
  rating?: number;
  isOpen?: boolean;
  deliveryTime?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RestaurantDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;

  // Location
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;

  // Media
  coverImage?: string;
  logo?: string;
  images: string[];

  // Ratings
  rating: number;
  reviewCount: number;
  foodScore: number;
  serviceScore: number;
  hygieneScore: number;

  // Info
  cuisines: string[];
  avgPrice: number;
  costForTwo: number;

  // Timing
  isOpen: boolean;
  openingTime: string;
  closingTime: string;

  // Contact
  phone: string;
  email?: string;
  website?: string;

  // Delivery
  deliveryAvailable: boolean;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;

  // Features
  amenities: string[];
  highlights: string[];

  // Active deals
  activeDeals: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;

  // Dietary
  isVeg: boolean;
  isJain: boolean;
  isHalal: boolean;

  // Info
  category: string;
  tags: string[];
  allergens: string[];

  // Availability
  isAvailable: boolean;
  prepTime?: number;

  // Popularity
  orderCount?: number;
  avgRating?: number;
}

export interface Menu {
  id: string;
  restaurantId: string;
  name: string;
  categories: {
    id: string;
    name: string;
    items: MenuItem[];
  }[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;

  rating: number;
  title?: string;
  content: string;
  images: string[];

  // Ratings breakdown
  foodRating?: number;
  serviceRating?: number;
  ambianceRating?: number;

  // Restaurant response
  response?: {
    content: string;
    respondedAt: Date;
  };

  // Stats
  helpfulCount: number;
  isVerified: boolean;

  createdAt: Date;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface ReservationRequest {
  restaurantId: string;
  date: string;
  time: string;
  guests: number;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  restaurantId: string;
  restaurantName: string;
  userId: string;

  date: string;
  time: string;
  guests: number;

  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';

  name: string;
  phone: string;
  email?: string;
  notes?: string;

  createdAt: Date;
}

export class RestaurantOSClient {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string = process.env.RESTAURANT_OS_URL || 'http://localhost:4015',
    private readonly apiKey: string = process.env.RESTAURANT_OS_API_KEY || '',
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[RestaurantOS] API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // ===================
  // Restaurant
  // ===================

  /**
   * Search restaurants
   */
  async searchRestaurants(params: RestaurantSearchParams): Promise<{
    restaurants: RestaurantDetail[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await this.client.get('/api/restaurants', { params });
    return response.data;
  }

  /**
   * Get restaurant by ID
   */
  async getRestaurant(id: string): Promise<RestaurantDetail> {
    const response = await this.client.get<RestaurantDetail>(`/api/restaurants/${id}`);
    return response.data;
  }

  /**
   * Get nearby restaurants
   */
  async getNearbyRestaurants(
    lat: number,
    lng: number,
    radius: number = 10
  ): Promise<RestaurantDetail[]> {
    const response = await this.client.get<RestaurantDetail[]>('/api/restaurants/nearby', {
      params: { lat, lng, radius },
    });
    return response.data;
  }

  /**
   * Get restaurant by slug
   */
  async getRestaurantBySlug(slug: string): Promise<RestaurantDetail> {
    const response = await this.client.get<RestaurantDetail>(`/api/restaurants/slug/${slug}`);
    return response.data;
  }

  // ===================
  // Menu
  // ===================

  /**
   * Get restaurant menu
   */
  async getMenu(restaurantId: string): Promise<Menu> {
    const response = await this.client.get<Menu>(`/api/restaurants/${restaurantId}/menu`);
    return response.data;
  }

  /**
   * Get menu item details
   */
  async getMenuItem(restaurantId: string, itemId: string): Promise<MenuItem> {
    const response = await this.client.get<MenuItem>(
      `/api/restaurants/${restaurantId}/menu/${itemId}`
    );
    return response.data;
  }

  // ===================
  // Reviews
  // ===================

  /**
   * Get restaurant reviews
   */
  async getReviews(
    restaurantId: string,
    params?: { page?: number; limit?: number; sortBy?: 'recent' | 'rating' | 'helpful' }
  ): Promise<{
    reviews: Review[];
    total: number;
    avgRating: number;
    distribution: Record<number, number>;
  }> {
    const response = await this.client.get(`/api/restaurants/${restaurantId}/reviews`, { params });
    return response.data;
  }

  /**
   * Submit a review
   */
  async submitReview(
    restaurantId: string,
    review: {
      rating: number;
      title?: string;
      content: string;
      images?: string[];
      foodRating?: number;
      serviceRating?: number;
      ambianceRating?: number;
    }
  ): Promise<Review> {
    const response = await this.client.post<Review>(
      `/api/restaurants/${restaurantId}/reviews`,
      review
    );
    return response.data;
  }

  // ===================
  // Reservations
  // ===================

  /**
   * Get available time slots
   */
  async getAvailability(
    restaurantId: string,
    date: string,
    guests: number
  ): Promise<TimeSlot[]> {
    const response = await this.client.get<TimeSlot[]>(
      `/api/restaurants/${restaurantId}/availability`,
      {
        params: { date, guests },
      }
    );
    return response.data;
  }

  /**
   * Create a reservation
   */
  async createReservation(data: ReservationRequest): Promise<Reservation> {
    const response = await this.client.post<Reservation>('/api/reservations', data);
    return response.data;
  }

  /**
   * Get user's reservations
   */
  async getUserReservations(
    userId: string,
    params?: { status?: string; upcoming?: boolean }
  ): Promise<Reservation[]> {
    const response = await this.client.get<Reservation[]>(`/api/users/${userId}/reservations`, {
      params,
    });
    return response.data;
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(reservationId: string): Promise<void> {
    await this.client.delete(`/api/reservations/${reservationId}`);
  }

  // ===================
  // Deals & Offers
  // ===================

  /**
   * Get restaurant deals
   */
  async getRestaurantDeals(restaurantId: string): Promise<{
    deals: {
      id: string;
      title: string;
      description: string;
      type: string;
      value: number;
      code?: string;
      minOrder?: number;
      validUntil: Date;
    }[];
  }> {
    const response = await this.client.get(`/api/restaurants/${restaurantId}/deals`);
    return response.data;
  }

  // ===================
  // Analytics
  // ===================

  /**
   * Get restaurant analytics (admin)
   */
  async getRestaurantAnalytics(
    restaurantId: string,
    period: 'day' | 'week' | 'month' | 'year'
  ): Promise<{
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    topDishes: { name: string; count: number }[];
    peakHours: { hour: number; orders: number }[];
  }> {
    const response = await this.client.get(
      `/api/restaurants/${restaurantId}/analytics`,
      { params: { period } }
    );
    return response.data;
  }
}

// Singleton instance
let restaurantClientInstance: RestaurantOSClient | null = null;

export function getRestaurantOSClient(): RestaurantOSClient {
  if (!restaurantClientInstance) {
    restaurantClientInstance = new RestaurantOSClient();
  }
  return restaurantClientInstance;
}
