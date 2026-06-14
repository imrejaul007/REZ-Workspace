/**
 * REZ Events OS - Unified SDK
 */

import axios, { AxiosInstance } from 'axios';

export interface EventsSDKConfig {
  baseURL?: string;
  apiKey?: string;
}

class BaseClient {
  protected client: AxiosInstance;

  constructor(baseURL: string, config: EventsSDKConfig) {
    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: { 'Content-Type': 'application/json' },
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
// Events Main
// =============================================================================

export interface Event {
  id: string;
  name: string;
  date: Date;
  venue: string;
  capacity: number;
  ticketsSold: number;
  status: 'draft' | 'published' | 'ongoing' | 'completed';
}

export interface Ticket {
  id: string;
  eventId: string;
  type: 'vip' | 'general' | 'early-bird';
  price: number;
  available: number;
}

export class EventsClient extends BaseClient {
  constructor(config: EventsSDKConfig) {
    super(config.baseURL || 'http://localhost:4751', config);
  }

  async getEvents(status?: string): Promise<Event[]> {
    return this.get('/api/events', { status });
  }

  async getEvent(id: string): Promise<Event> {
    return this.get(`/api/events/${id}`);
  }

  async createEvent(data: Partial<Event>): Promise<Event> {
    return this.post('/api/events', data);
  }

  async getTickets(eventId: string): Promise<Ticket[]> {
    return this.get(`/api/events/${eventId}/tickets`);
  }
}

// =============================================================================
// Analytics
// =============================================================================

export interface EventMetrics {
  totalTickets: number;
  totalRevenue: number;
  avgTicketPrice: number;
  occupancyRate: number;
}

export class AnalyticsClient extends BaseClient {
  constructor(config: EventsSDKConfig) {
    super(config.baseURL || 'http://localhost:4752', config);
  }

  async getMetrics(eventId: string): Promise<EventMetrics> {
    return this.get(`/api/analytics/${eventId}`);
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createEventsSDK(config: EventsSDKConfig = {}): {
  events: EventsClient;
  analytics: AnalyticsClient;
} {
  return {
    events: new EventsClient(config),
    analytics: new AnalyticsClient(config),
  };
}

export default createEventsSDK;
