/**
 * REZ Merchant Service Client
 * Connects rez-app to REZ Merchant Industry OS
 */

import axios from 'axios';

// REZ Merchant Base URLs
const MERCHANT_API = process.env.EXPO_PUBLIC_REZ_MERCHANT_URL || 'https://rez-merchant.rezapp.com';
const WAITRON_API = process.env.EXPO_PUBLIC_WAITRON_URL || 'http://localhost:4821';
const STAYBOT_API = process.env.EXPO_PUBLIC_STAYBOT_URL || 'http://localhost:4840';
const SHOPFLOW_API = process.env.EXPO_PUBLIC_SHOPFLOW_URL || 'http://localhost:4830';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token';

// Industry types
export type IndustryType = 'restaurant' | 'hotel' | 'retail' | 'healthcare' | 'fitness' | 'salon' | 'grocery' | 'other';

// Merchant types
export interface Merchant {
  id: string;
  name: string;
  industry: IndustryType;
  logo?: string;
  coverImage?: string;
  description?: string;
  address?: string;
  city?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  isOpen?: boolean;
  distance?: number;
  amenities?: string[];
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  image?: string;
  available?: boolean;
  stock?: number;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  options?: string[];
}

export interface Order {
  id: string;
  merchantId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
}

// Service class
export class REZMerchantService {
  private api = axios.create({
    baseURL: MERCHANT_API,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN,
    },
  });

  // ========================
  // MERCHANT DISCOVERY
  // ========================

  async searchMerchants(params: {
    query?: string;
    industry?: IndustryType;
    city?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    limit?: number;
    offset?: number;
  }): Promise<Merchant[]> {
    try {
      const response = await this.api.get('/api/merchants/search', { params });
      return response.data?.merchants || [];
    } catch (error) {
      console.warn('REZ Merchant search unavailable:', error);
      return this.getMockMerchants(params.industry);
    }
  }

  async getMerchantById(id: string): Promise<Merchant | null> {
    try {
      const response = await this.api.get(`/api/merchants/${id}`);
      return response.data?.merchant || null;
    } catch (error) {
      console.warn('REZ Merchant get failed:', error);
      return null;
    }
  }

  async getNearbyMerchants(lat: number, lng: number, radiusKm = 5): Promise<Merchant[]> {
    try {
      const response = await this.api.get('/api/merchants/nearby', {
        params: { lat, lng, radius: radiusKm },
      });
      return response.data?.merchants || [];
    } catch (error) {
      console.warn('REZ Merchant nearby unavailable:', error);
      return this.getMockMerchants();
    }
  }

  async getFeaturedMerchants(industry?: IndustryType): Promise<Merchant[]> {
    try {
      const response = await this.api.get('/api/merchants/featured', {
        params: { industry },
      });
      return response.data?.merchants || [];
    } catch (error) {
      return this.getMockMerchants(industry);
    }
  }

  // ========================
  // RESTAURANT (WAITRON)
  // ========================

  async getRestaurants(params?: {
    cuisine?: string;
    city?: string;
    priceRange?: string;
    rating?: number;
  }): Promise<Merchant[]> {
    try {
      const response = await this.api.get('/api/restaurants', { params });
      return response.data?.restaurants || [];
    } catch (error) {
      return this.getMockMerchants('restaurant');
    }
  }

  async getRestaurantMenu(restaurantId: string): Promise<{
    categories: string[];
    items: Product[];
  }> {
    try {
      const response = await this.api.get(`/api/restaurants/${restaurantId}/menu`);
      return response.data || { categories: [], items: [] };
    } catch (error) {
      return { categories: ['Popular', 'Main Course', 'Beverages'], items: this.getMockMenuItems() };
    }
  }

  async getRestaurantReviews(restaurantId: string): Promise<Review[]> {
    try {
      const response = await this.api.get(`/api/restaurants/${restaurantId}/reviews`);
      return response.data?.reviews || [];
    } catch (error) {
      return [];
    }
  }

  // ========================
  // HOTEL (STAYBOT)
  // ========================

  async getHotels(params?: {
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
  }): Promise<Merchant[]> {
    try {
      const response = await this.api.get('/api/hotels', { params });
      return response.data?.hotels || [];
    } catch (error) {
      return this.getMockMerchants('hotel');
    }
  }

  async getHotelRooms(hotelId: string): Promise<Room[]> {
    try {
      const response = await this.api.get(`/api/hotels/${hotelId}/rooms`);
      return response.data?.rooms || [];
    } catch (error) {
      return [];
    }
  }

  async getHotelServices(hotelId: string): Promise<HotelService[]> {
    try {
      const response = await this.api.get(`/api/hotels/${hotelId}/services`);
      return response.data?.services || [];
    } catch (error) {
      return [];
    }
  }

  // ========================
  // RETAIL (SHOPFLOW)
  // ========================

  async getStores(params?: {
    category?: string;
    city?: string;
  }): Promise<Merchant[]> {
    try {
      const response = await this.api.get('/api/stores', { params });
      return response.data?.stores || [];
    } catch (error) {
      return this.getMockMerchants('retail');
    }
  }

  async getStoreProducts(storeId: string, category?: string): Promise<Product[]> {
    try {
      const response = await this.api.get(`/api/stores/${storeId}/products`, {
        params: { category },
      });
      return response.data?.products || [];
    } catch (error) {
      return this.getMockMenuItems();
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await this.api.get('/api/products/search', {
        params: { q: query },
      });
      return response.data?.products || [];
    } catch (error) {
      return this.getMockMenuItems();
    }
  }

  // ========================
  // ORDERS
  // ========================

  async createOrder(order: {
    merchantId: string;
    items: { productId: string; quantity: number; variant?: string }[];
    userId: string;
    deliveryAddress?: string;
    notes?: string;
  }): Promise<Order> {
    try {
      const response = await this.api.post('/api/orders', order);
      return response.data?.order;
    } catch (error) {
      throw new Error('Failed to create order');
    }
  }

  async getOrderStatus(orderId: string): Promise<Order | null> {
    try {
      const response = await this.api.get(`/api/orders/${orderId}`);
      return response.data?.order || null;
    } catch (error) {
      return null;
    }
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const response = await this.api.get('/api/orders/user', {
        params: { userId },
      });
      return response.data?.orders || [];
    } catch (error) {
      return [];
    }
  }

  // ========================
  // UTILITY
  // ========================

  async healthCheck(): Promise<boolean> {
    try {
      await this.api.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Review interface
interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
  helpful: number;
}

// Room interface
interface Room {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  maxGuests: number;
  amenities: string[];
  images: string[];
  available: boolean;
}

// HotelService interface
interface HotelService {
  id: string;
  name: string;
  description: string;
  price: number;
  icon?: string;
}

// Mock data helpers
function getMockMerchants(industry?: IndustryType): Merchant[] {
  const restaurantMerchants: Merchant[] = [
    { id: 'rest-1', name: 'Spice Garden', industry: 'restaurant', city: 'Mumbai', rating: 4.5, priceRange: '₹₹' },
    { id: 'rest-2', name: 'The Burger Joint', industry: 'restaurant', city: 'Mumbai', rating: 4.2, priceRange: '₹' },
    { id: 'rest-3', name: 'Pizza Palace', industry: 'restaurant', city: 'Mumbai', rating: 4.0, priceRange: '₹₹' },
  ];

  const hotelMerchants: Merchant[] = [
    { id: 'hotel-1', name: 'Grand Palace Hotel', industry: 'hotel', city: 'Mumbai', rating: 4.8 },
    { id: 'hotel-2', name: 'Seaside Resort', industry: 'hotel', city: 'Mumbai', rating: 4.5 },
  ];

  const retailMerchants: Merchant[] = [
    { id: 'retail-1', name: 'Fashion Hub', industry: 'retail', city: 'Mumbai', rating: 4.3 },
    { id: 'retail-2', name: 'Tech World', industry: 'retail', city: 'Mumbai', rating: 4.6 },
  ];

  if (industry === 'restaurant') return restaurantMerchants;
  if (industry === 'hotel') return hotelMerchants;
  if (industry === 'retail') return retailMerchants;

  return [...restaurantMerchants, ...hotelMerchants, ...retailMerchants];
}

function getMockMenuItems(): Product[] {
  return [
    { id: 'prod-1', merchantId: 'rest-1', name: 'Butter Chicken', price: 299, category: 'Main Course' },
    { id: 'prod-2', merchantId: 'rest-1', name: 'Naan', price: 49, category: 'Bread' },
    { id: 'prod-3', merchantId: 'rest-1', name: 'Lassi', price: 79, category: 'Beverages' },
    { id: 'prod-4', merchantId: 'rest-1', name: 'Biryani', price: 249, category: 'Rice' },
  ];
}

// Export singleton instance
export const rezMerchantService = new REZMerchantService();

// Export default
export default rezMerchantService;
