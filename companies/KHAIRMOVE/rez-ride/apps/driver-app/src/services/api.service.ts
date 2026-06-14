import { API_BASE_URL } from '../api/client';

const API_URL = API_BASE_URL;

class DriverApiService {
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
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  }

  // Auth - Driver-specific endpoints
  async requestOTP(phone: string) {
    return this.request('/api/auth/driver/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOTP(phone: string, otp: string) {
    const response = await this.request<{ success: boolean; token: string; refreshToken?: string; driver: any }>(
      '/api/auth/driver/verify-otp',
      {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      }
    );
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  // Driver Status
  async goOnline() {
    return this.request('/api/drivers/status', {
      method: 'POST',
      body: JSON.stringify({ status: 'online' }),
    });
  }

  async goOffline() {
    return this.request('/api/drivers/status', {
      method: 'POST',
      body: JSON.stringify({ status: 'offline' }),
    });
  }

  // Location
  async updateLocation(location: { lat: number; lng: number; heading: number; speed: number }) {
    return this.request('/api/drivers/location', {
      method: 'PUT',
      body: JSON.stringify({ location }),
    });
  }

  // Rides
  async getRideRequests() {
    return this.request('/api/drivers/requests');
  }

  async acceptRide(rideId: string) {
    return this.request(`/api/drivers/accept/${rideId}`, {
      method: 'POST',
    });
  }

  async rejectRide(rideId: string) {
    return this.request(`/api/drivers/reject/${rideId}`, {
      method: 'POST',
    });
  }

  async startRide(rideId: string, otp: string) {
    return this.request(`/api/rides/${rideId}/start`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  }

  async completeRide(rideId: string) {
    return this.request(`/api/rides/${rideId}/complete`, {
      method: 'POST',
    });
  }

  async cancelRide(rideId: string, reason: string) {
    return this.request(`/api/rides/${rideId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Earnings
  async getEarnings(dateRange?: { start: string; end: string }) {
    const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : '';
    return this.request(`/api/drivers/earnings${params}`);
  }

  async getStats() {
    return this.request('/api/drivers/stats');
  }

  // Quests
  async getQuests() {
    return this.request('/api/quests/active');
  }

  async claimQuestReward(questId: string) {
    return this.request(`/api/quests/${questId}/claim`, {
      method: 'POST',
    });
  }

  // Payouts
  async requestPayout(amount: number) {
    return this.request('/api/payouts/request', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async getPayoutHistory() {
    return this.request('/api/payouts/history');
  }

  // Chat
  async sendMessage(rideId: string, message: string) {
    return this.request(`/api/chat/${rideId}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
}

export const driverApi = new DriverApiService();
