/**
 * RiderCircle API Client
 * Mobile app connection to backend services
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4200';

// Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API Client Class
class ApiClient {
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
          this.token = await this.getToken();
        }
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, clear and redirect to login
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  async setToken(token: string): Promise<void> {
    this.token = token;
    await SecureStore.setItemAsync('auth_token', token);
  }

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch {
      return null;
    }
  }

  async clearToken(): Promise<void> {
    this.token = null;
    await SecureStore.deleteItemAsync('auth_token');
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed');
    }
    return response.data.data as T;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed');
    }
    return response.data.data as T;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed');
    }
    return response.data.data as T;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed');
    }
    return response.data.data as T;
  }

  // ============ RIDERS ============

  async createRider(data: CreateRiderRequest): Promise<Rider> {
    return this.post<Rider>('/api/riders', data);
  }

  async getProfile(): Promise<Rider> {
    return this.get<Rider>('/api/riders/me');
  }

  async getRider(id: string): Promise<Rider> {
    return this.get<Rider>(`/api/riders/${id}`);
  }

  async updateRider(id: string, data: Partial<CreateRiderRequest>): Promise<Rider> {
    return this.put<Rider>(`/api/riders/${id}`, data);
  }

  async getSafeQR(id: string): Promise<{ qrCode: string; displayName: string }> {
    return this.get<any>(`/api/riders/${id}/safeqr`);
  }

  async getRiderStats(id: string): Promise<RiderStats> {
    return this.get<RiderStats>(`/api/riders/${id}/stats`);
  }

  async getTrustScore(id: string): Promise<TrustScore> {
    return this.get<TrustScore>(`/api/riders/${id}/trust-score`);
  }

  async followRider(id: string): Promise<{ isFollowing: boolean }> {
    return this.post<{ isFollowing: boolean }>(`/api/riders/${id}/follow`);
  }

  async searchRiders(query: string): Promise<Rider[]> {
    return this.get<Rider[]>('/api/riders', { q: query });
  }

  // ============ BIKES ============

  async createBike(data: CreateBikeRequest): Promise<Bike> {
    return this.post<Bike>('/api/bikes', data);
  }

  async getBikes(): Promise<Bike[]> {
    return this.get<Bike[]>('/api/bikes');
  }

  async getBike(id: string): Promise<Bike> {
    return this.get<Bike>(`/api/bikes/${id}`);
  }

  async updateBike(id: string, data: Partial<CreateBikeRequest>): Promise<Bike> {
    return this.put<Bike>(`/api/bikes/${id}`, data);
  }

  async getBikeHealth(id: string): Promise<BikeHealth> {
    return this.get<BikeHealth>(`/api/bikes/${id}/health`);
  }

  async addServiceRecord(bikeId: string, data: ServiceRecord): Promise<ServiceRecord> {
    return this.post<ServiceRecord>(`/api/bikes/${bikeId}/service-record`, data);
  }

  // ============ RIDES ============

  async startRide(data: CreateRideRequest): Promise<Ride> {
    return this.post<Ride>('/api/rides', data);
  }

  async getActiveRide(): Promise<Ride | null> {
    try {
      return await this.get<Ride>('/api/rides/active');
    } catch {
      return null;
    }
  }

  async getRide(id: string): Promise<Ride> {
    return this.get<Ride>(`/api/rides/${id}`);
  }

  async addTrackPoint(rideId: string, point: GPSPoint): Promise<{ trackPoints: number; totalDistance: number }> {
    return this.post<any>(`/api/rides/${rideId}/track`, point);
  }

  async addWaypoint(rideId: string, waypoint: Waypoint): Promise<Waypoint> {
    return this.post<Waypoint>(`/api/rides/${rideId}/waypoint`, waypoint);
  }

  async pauseRide(rideId: string): Promise<Ride> {
    return this.post<Ride>(`/api/rides/${rideId}/pause`);
  }

  async resumeRide(rideId: string): Promise<Ride> {
    return this.post<Ride>(`/api/rides/${rideId}/resume`);
  }

  async completeRide(rideId: string, data?: CompleteRideRequest): Promise<Ride> {
    return this.post<Ride>(`/api/rides/${rideId}/complete`, data);
  }

  async getRideHistory(page = 1): Promise<PaginatedResponse<Ride>> {
    return this.get<PaginatedResponse<Ride>>('/api/rides', { page });
  }

  async getPublicRoutes(): Promise<Ride[]> {
    return this.get<Ride[]>('/api/rides/routes/discover');
  }

  // ============ PRESENCE ============

  async updatePresence(data: PresenceUpdate): Promise<void> {
    await this.post('/api/presence/update', data);
  }

  async goOffline(): Promise<void> {
    await this.post('/api/presence/offline');
  }

  async getNearbyRiders(lat: number, lng: number, radius = 10): Promise<{ count: number; riders: any[] }> {
    return this.get<any>('/api/presence/nearby', { lat, lng, radius });
  }

  async getLiveStats(): Promise<PresenceStats> {
    return this.get<PresenceStats>('/api/presence/stats');
  }

  // ============ GROUPS ============

  async createGroup(data: CreateGroupRequest): Promise<Group> {
    return this.post<Group>('/api/groups', data);
  }

  async getGroups(params?: { q?: string; city?: string; type?: string }): Promise<Group[]> {
    return this.get<Group[]>('/api/groups', params);
  }

  async getGroup(id: string): Promise<Group> {
    return this.get<Group>(`/api/groups/${id}`);
  }

  async joinGroup(id: string): Promise<{ status: string }> {
    return this.post<any>(`/api/groups/${id}/join`);
  }

  async leaveGroup(id: string): Promise<void> {
    await this.post(`/api/groups/${id}/leave`);
  }

  // ============ EVENTS ============

  async createEvent(data: CreateEventRequest): Promise<Event> {
    return this.post<Event>('/api/events', data);
  }

  async getEvents(params?: { type?: string; city?: string }): Promise<Event[]> {
    return this.get<Event[]>('/api/events', params);
  }

  async getEvent(id: string): Promise<Event> {
    return this.get<Event>(`/api/events/${id}`);
  }

  async rsvpEvent(id: string, status: 'going' | 'maybe'): Promise<void> {
    await this.post(`/api/events/${id}/rsvp`, { status });
  }

  async checkinEvent(id: string, type: 'start' | 'checkpoint' | 'end', location?: { coordinates: [number, number] }): Promise<void> {
    await this.post(`/api/events/${id}/checkin`, { type, location });
  }

  async getUpcomingEvents(): Promise<Event[]> {
    return this.get<Event[]>('/api/events/upcoming/list');
  }

  // ============ SOS ============

  async triggerSOS(data: SOSRequest): Promise<{ sosId: string }> {
    return this.post<any>('/api/sos', data);
  }

  async getSOS(sosId: string): Promise<SOSEvent> {
    return this.get<SOSEvent>(`/api/sos/${sosId}`);
  }

  async respondSOS(sosId: string, status: string, eta?: number): Promise<void> {
    await this.post(`/api/sos/${sosId}/respond`, { status, eta });
  }

  async rateSOS(sosId: string, rating: number, feedback?: string): Promise<void> {
    await this.post(`/api/sos/${sosId}/rate`, { rating, feedback });
  }

  // ============ MEMORIES ============

  async getMemories(page = 1): Promise<PaginatedResponse<Memory>> {
    return this.get<PaginatedResponse<Memory>>('/api/memories', { page });
  }

  async getMyMemories(page = 1): Promise<PaginatedResponse<Memory>> {
    return this.get<PaginatedResponse<Memory>>('/api/memories/me', { page });
  }

  async getMemory(id: string): Promise<Memory> {
    return this.get<Memory>(`/api/memories/${id}`);
  }

  async generateMemory(rideId: string): Promise<Memory> {
    return this.post<Memory>(`/api/memories/generate/${rideId}`);
  }

  async likeMemory(id: string): Promise<{ liked: boolean; likesCount: number }> {
    return this.post<any>(`/api/memories/${id}/like`);
  }

  // ============ HEALTH ============

  async healthCheck(): Promise<{ status: string }> {
    return this.get<any>('/api/health');
  }
}

// Types
interface CreateRiderRequest {
  displayName: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalNotes?: string;
  emergencyContacts?: {
    name: string;
    phone: string;
    relationship: string;
    isPrimary?: boolean;
  }[];
  ridingStyle?: 'commuter' | 'tourer' | 'adventure' | 'sport';
  experience?: 'beginner' | 'intermediate' | 'expert';
}

interface Rider {
  _id: string;
  displayName: string;
  avatar?: string;
  phone: string;
  bloodGroup?: string;
  emergencyContacts: any[];
  ridingStyle: string;
  experience: string;
  totalRides: number;
  totalDistance: number;
  trustScore: number;
  badges: any[];
  followersCount: number;
  followingCount: number;
  bikes: string[];
}

interface RiderStats {
  totalRides: number;
  totalDistance: number;
  trustScore: number;
  verifiedRides: number;
  badges: any[];
}

interface TrustScore {
  trustScore: number;
  level: string;
}

interface CreateBikeRequest {
  nickname: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  engineCC: number;
  fuelCapacity: number;
  odometer?: number;
  isPrimary?: boolean;
}

interface Bike {
  _id: string;
  nickname: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  odometer: number;
  overallHealth: number;
  tireHealth: { front: number; rear: number };
  chainCondition: number;
  brakeHealth: { front: number; rear: number };
}

interface BikeHealth {
  overall: number;
  status: string;
  tires: { front: number; rear: number };
  chain: number;
  brakes: { front: number; rear: number };
  recommendations: string[];
}

interface ServiceRecord {
  date: Date | string;
  type: 'regular' | 'repair' | 'upgrade' | 'accident';
  description: string;
  odometer: number;
  cost?: number;
  serviceCenter?: string;
}

interface CreateRideRequest {
  title: string;
  bikeId: string;
  startLocation: { name?: string; coordinates: [number, number]; address?: string };
}

interface GPSPoint {
  coordinates: [number, number];
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
}

interface Waypoint {
  name?: string;
  coordinates: [number, number];
  type: 'start' | 'stop' | 'fuel' | 'food' | 'viewpoint' | 'checkpoint' | 'end';
  notes?: string;
}

interface CompleteRideRequest {
  endLocation?: { name?: string; coordinates: [number, number]; address?: string };
  expenses?: { fuel?: number; tolls?: number; food?: number; accommodation?: number };
}

interface Ride {
  _id: string;
  title: string;
  status: string;
  startTime: Date;
  route: {
    distance: number;
    track: GPSPoint[];
    waypoints: Waypoint[];
  };
  stats: {
    distance: number;
    avgSpeed: number;
    maxSpeed: number;
  };
}

interface PresenceUpdate {
  coordinates: [number, number];
  altitude?: number;
  speed?: number;
  heading?: number;
  status?: 'online' | 'riding' | 'idle';
  rideId?: string;
  groupId?: string;
}

interface PresenceStats {
  total: number;
  riding: number;
  idle: number;
  online: number;
  topCities: { city: string; count: number }[];
}

interface CreateGroupRequest {
  name: string;
  description: string;
  type: 'club' | 'chapter' | 'crew' | 'community' | 'brand';
  focus: string[];
  city: string;
  state: string;
}

interface Group {
  _id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  city: string;
  memberCount: number;
  followersCount: number;
}

interface CreateEventRequest {
  title: string;
  description: string;
  type: string;
  startTime: string;
  endTime: string;
  startLocation: { name: string; coordinates: [number, number]; address: string };
}

interface Event {
  _id: string;
  title: string;
  type: string;
  startTime: Date;
  startLocation: { name: string; address: string };
  currentParticipants: number;
  maxParticipants: number;
}

interface SOSRequest {
  type: 'accident' | 'medical' | 'breakdown' | 'assistance' | 'safety_concern';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  location: { coordinates: [number, number]; address?: string };
}

interface SOSEvent {
  _id: string;
  type: string;
  severity: string;
  status: string;
  location: { coordinates: [number, number] };
}

interface Memory {
  _id: string;
  title: string;
  story: string;
  highlights: string[];
  hashtags: string[];
  stats: { distance: number; duration: number };
  coverImage?: string;
  photos: string[];
  likesCount: number;
  shareCount: number;
}

// Export singleton instance
export const api = new ApiClient();
export default api;
