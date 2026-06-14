import { API_BASE_URL } from '../api/client';

const API_URL = API_BASE_URL;

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  async requestOTP(phone: string) {
    return this.request('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, type: 'login' }),
    });
  }

  async verifyOTP(phone: string, otp: string) {
    const response = await this.request<{ success: boolean; token: string; user: any }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  // Rides
  async createRide(pickup: any, drop: any, vehicleType: string, paymentMethod: string = 'wallet') {
    return this.request('/api/rides', {
      method: 'POST',
      body: JSON.stringify({ pickup, drop, vehicleType, paymentMethod }),
    });
  }

  async getRide(rideId: string) {
    return this.request(`/api/rides/${rideId}`);
  }

  async cancelRide(rideId: string, reason?: string) {
    return this.request(`/api/rides/${rideId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getRideHistory() {
    return this.request('/api/rides/history');
  }

  // Fares
  async getFareEstimate(pickup: any, drop: any, vehicleType: string) {
    return this.request(`/api/fares/estimate?pickupLat=${pickup.lat}&pickupLng=${pickup.lng}&dropLat=${drop.lat}&dropLng=${drop.lng}&vehicleType=${vehicleType}`);
  }

  async compareFares(pickup: any, drop: any) {
    return this.request(`/api/fares/compare?pickupLat=${pickup.lat}&pickupLng=${pickup.lng}&dropLat=${drop.lat}&dropLng=${drop.lng}`);
  }

  // Drivers
  async getNearbyDrivers(lat: number, lng: number, vehicleType: string) {
    return this.request(`/api/drivers/nearby?lat=${lat}&lng=${lng}&vehicleType=${vehicleType}`);
  }

  // Wallet
  async getWalletBalance() {
    return this.request('/api/vouchers/wallet');
  }

  async addMoney(amount: number) {
    return this.request('/api/vouchers/wallet/add', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // Vouchers
  async getVouchers() {
    return this.request('/api/vouchers');
  }

  async applyVoucher(code: string) {
    return this.request('/api/vouchers/apply', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // Support
  async createTicket(type: string, subject: string, description: string, rideId?: string) {
    return this.request('/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ userId: 'current', type, subject, description, rideId }),
    });
  }

  async getTickets() {
    return this.request('/api/tickets?userId=current');
  }

  // Surge
  async getSurge(lat: number, lng: number) {
    return this.request(`/api/surge/${lat}/${lng}`);
  }

  // Feedback
  async submitFeedback(rideId: string, rating: number, comment?: string) {
    return this.request('/api/rides/feedback', {
      method: 'POST',
      body: JSON.stringify({ rideId, rating, comment }),
    });
  }

  // Geo Search
  async searchPlaces(query: string, lat?: number, lng?: number) {
    let url = `/api/geo/search?q=${encodeURIComponent(query)}`;
    if (lat && lng) url += `&lat=${lat}&lng=${lng}`;
    return this.request(url);
  }

  async reverseGeocode(lat: number, lng: number) {
    return this.request(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
  }

  async getDistance(fromLat: number, fromLng: number, toLat: number, toLng: number) {
    return this.request(`/api/geo/distance?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}`);
  }
}

export const apiService = new ApiService();
export default apiService;
