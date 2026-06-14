/**
 * REZ Salon OS - Unified SDK
 */

import axios, { AxiosInstance } from 'axios';

export interface SalonSDKConfig {
  baseURL?: string;
  apiKey?: string;
  internalToken?: string;
}

class BaseClient {
  protected client: AxiosInstance;

  constructor(baseURL: string, config: SalonSDKConfig) {
    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey }),
      },
    });
  }

  protected async get<T>(path: string, params?: object): Promise<T> {
    const response = await this.client.get(path, { params });
    return response.data;
  }

  protected async post<T>(path: string, data?: object): Promise<T> {
    const response = await this.client.post(path, data);
    return response.data;
  }
}

// =============================================================================
// Salon Main Client
// =============================================================================

export interface SalonService {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  category: string;
}

export interface Stylist {
  id: string;
  name: string;
  specialties: string[];
  rating: number;
  available: boolean;
}

export class SalonClient extends BaseClient {
  constructor(config: SalonSDKConfig) {
    super(config.baseURL || 'http://localhost:4901', config);
  }

  async getServices(): Promise<SalonService[]> {
    return this.get('/api/services');
  }

  async getStylists(specialty?: string): Promise<Stylist[]> {
    return this.get('/api/stylists', { specialty });
  }
}

// =============================================================================
// Booking Client
// =============================================================================

export interface Appointment {
  id: string;
  customerId: string;
  stylistId: string;
  serviceId: string;
  dateTime: Date;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
}

export class BookingClient extends BaseClient {
  constructor(config: SalonSDKConfig) {
    super(config.baseURL || 'http://localhost:4902', config);
  }

  async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
    return this.post('/api/appointments', data);
  }

  async getAppointment(id: string): Promise<Appointment> {
    return this.get(`/api/appointments/${id}`);
  }

  async getAvailableSlots(stylistId: string, date: string): Promise<string[]> {
    return this.get('/api/appointments/slots', { stylistId, date });
  }

  async cancelAppointment(id: string): Promise<void> {
    await this.post(`/api/appointments/${id}/cancel`);
  }
}

// =============================================================================
// CRM Client
// =============================================================================

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  preferences: string[];
  visitCount: number;
  lastVisit?: Date;
}

export class CRMAuthenticated extends BaseClient {
  constructor(config: SalonSDKConfig) {
    super(config.baseURL || 'http://localhost:4903', config);
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.get(`/api/customers/${id}`);
  }

  async updatePreferences(id: string, preferences: string[]): Promise<void> {
    await this.client.patch(`/api/customers/${id}/preferences`, { preferences });
  }
}

// =============================================================================
// Membership Client
// =============================================================================

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration: number; // months
  benefits: string[];
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
}

export class MembershipClient extends BaseClient {
  constructor(config: SalonSDKConfig) {
    super(config.baseURL || 'http://localhost:4904', config);
  }

  async getPlans(): Promise<MembershipPlan[]> {
    return this.get('/api/plans');
  }

  async subscribe(customerId: string, planId: string): Promise<Subscription> {
    return this.post('/api/subscriptions', { customerId, planId });
  }

  async getSubscription(customerId: string): Promise<Subscription> {
    return this.get(`/api/subscriptions/${customerId}`);
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createSalonSDK(config: SalonSDKConfig = {}): {
  salon: SalonClient;
  booking: BookingClient;
  crm: CRMAuthenticated;
  membership: MembershipClient;
} {
  return {
    salon: new SalonClient(config),
    booking: new BookingClient(config),
    crm: new CRMAuthenticated(config),
    membership: new MembershipClient(config),
  };
}

export default createSalonSDK;
