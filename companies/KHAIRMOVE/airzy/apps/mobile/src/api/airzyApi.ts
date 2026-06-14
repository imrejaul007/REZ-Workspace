/**
 * Airzy API Client
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4500/api/v1';

class AirzyApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        if (!this.token) {
          this.token = await AsyncStorage.getItem('airzy_token');
        }
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        config.headers['X-Platform'] = 'mobile';
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('airzy_token', token);
  }

  async logout() {
    this.token = null;
    await AsyncStorage.removeItem('airzy_token');
  }

  // ============================================
  // FLIGHT ENDPOINTS
  // ============================================

  async searchFlights(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: { adults: number; children?: number; infants?: number };
    cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
    directOnly?: boolean;
  }) {
    const response = await this.client.post('/flights/search', params);
    return response.data;
  }

  async bookFlight(params: {
    userId: string;
    offer;
    travelers: unknown[];
    contact;
    paymentMethod: string;
  }) {
    const response = await this.client.post('/flights/book', params);
    return response.data;
  }

  async getBookings(userId: string, status?: string) {
    const response = await this.client.get(`/flights/bookings/${userId}`, {
      params: { status },
    });
    return response.data;
  }

  async getBooking(bookingId: string) {
    const response = await this.client.get(`/flights/booking/${bookingId}`);
    return response.data;
  }

  async cancelBooking(bookingId: string, userId: string, reason?: string) {
    const response = await this.client.post(`/flights/booking/${bookingId}/cancel`, {
      userId,
      reason,
    });
    return response.data;
  }

  async getAirports(keyword: string) {
    const response = await this.client.get('/flights/airports/suggest', {
      params: { keyword },
    });
    return response.data;
  }

  async getFlightStatus(carrierCode: string, flightNumber: string, date?: string) {
    const response = await this.client.get(
      `/flights/status/${carrierCode}/${flightNumber}`,
      { params: { date } }
    );
    return response.data;
  }

  // ============================================
  // LOUNGE ENDPOINTS
  // ============================================

  async searchLounges(params: {
    airport: string;
    terminal?: string;
    date: string;
    guests: number;
    travelerClass?: 'economy' | 'business' | 'first';
  }) {
    const response = await this.client.post('/lounges/search', params);
    return response.data;
  }

  async getLounge(loungeId: string) {
    const response = await this.client.get(`/lounges/${loungeId}`);
    return response.data;
  }

  async checkLoungeAvailability(loungeId: string, date: string, guests: number) {
    const response = await this.client.post(`/lounges/${loungeId}/availability`, {
      date,
      guests,
    });
    return response.data;
  }

  async bookLounge(params: {
    userId: string;
    loungeId: string;
    date: string;
    slot?: string;
    guests: number;
    membershipId?: string;
    membershipType?: 'dreamfolks' | 'priority_pass' | 'airzy';
  }) {
    const response = await this.client.post('/lounges/book', params);
    return response.data;
  }

  async getLoungeBookings(userId: string, status?: string) {
    const response = await this.client.get(`/lounges/bookings/${userId}`, {
      params: { status },
    });
    return response.data;
  }

  async checkInLounge(bookingId: string, checkinCode?: string) {
    const response = await this.client.post(`/lounges/booking/${bookingId}/checkin`, {
      checkinCode,
    });
    return response.data;
  }

  async getMembership(userId: string) {
    const response = await this.client.get(`/lounges/membership/${userId}`);
    return response.data;
  }

  async validateMembership(membershipId: string, membershipType: string, loungeId?: string) {
    const response = await this.client.post('/lounges/validate-membership', {
      membershipId,
      membershipType,
      loungeId,
    });
    return response.data;
  }

  // ============================================
  // ITINERARY ENDPOINTS
  // ============================================

  async createItinerary(params: {
    userId: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    coverImage?: string;
    travelerCount: number;
  }) {
    const response = await this.client.post('/itineraries', params);
    return response.data;
  }

  async getItineraries(userId: string, params?: {
    status?: string;
    upcoming?: boolean;
    past?: boolean;
  }) {
    const response = await this.client.get(`/itineraries/${userId}`, { params });
    return response.data;
  }

  async getItinerary(itineraryId: string) {
    const response = await this.client.get(`/itinerary/${itineraryId}`);
    return response.data;
  }

  async updateItinerary(itineraryId: string, updates) {
    const response = await this.client.patch(`/itinerary/${itineraryId}`, updates);
    return response.data;
  }

  async addSegment(itineraryId: string, segment) {
    const response = await this.client.post(`/itinerary/${itineraryId}/segments`, segment);
    return response.data;
  }

  async updateSegment(itineraryId: string, segmentId: string, updates) {
    const response = await this.client.patch(
      `/itinerary/${itineraryId}/segments/${segmentId}`,
      updates
    );
    return response.data;
  }

  async getUpcoming(userId: string, days?: number) {
    const response = await this.client.get(`/upcoming/${userId}`, {
      params: { days },
    });
    return response.data;
  }

  // ============================================
  // WALLET ENDPOINTS
  // ============================================

  async getMembership(userId: string) {
    const response = await this.client.get(`/membership/${userId}`);
    return response.data;
  }

  async upgradeMembership(userId: string, tier: string) {
    const response = await this.client.post('/membership/upgrade', {
      userId,
      tier,
    });
    return response.data;
  }

  async getTiers() {
    const response = await this.client.get('/membership/tiers');
    return response.data;
  }

  async getBalance(userId: string) {
    const response = await this.client.get(`/coins/balance/${userId}`);
    return response.data;
  }

  async getTransactions(userId: string, params?: { page?: number; limit?: number; type?: string }) {
    const response = await this.client.get(`/coins/transactions/${userId}`, { params });
    return response.data;
  }

  async calculateCoins(amount: number, source: string, tier?: string) {
    const response = await this.client.get('/coins/calculator', {
      params: { amount, source, tier },
    });
    return response.data;
  }

  // ============================================
  // AI ENDPOINTS
  // ============================================

  async getRecommendations(userId: string, context?: string) {
    const response = await this.client.get(`/recommendations/${userId}`, {
      params: { context },
    });
    return response.data;
  }

  async getTripContext(userId: string) {
    const response = await this.client.get(`/trip-context/${userId}`);
    return response.data;
  }

  async getPersonalizedTips(userId: string) {
    const response = await this.client.get(`/travel-tips/${userId}`);
    return response.data;
  }

  // ============================================
  // AIRPORT INFO
  // ============================================

  async getAirports(keyword?: string, code?: string) {
    const response = await this.client.get('/airports', {
      params: { keyword, code },
    });
    return response.data;
  }
}

// Export singleton instance
export const airzyApi = new AirzyApiClient();
export default airzyApi;
