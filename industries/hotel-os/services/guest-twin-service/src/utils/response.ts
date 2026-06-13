import axios, { AxiosInstance } from 'axios';

// ============================================================================
// SERVICE CLIENT BASE
// ============================================================================

export interface ServiceClientConfig {
  baseURL: string;
  apiKey?: string;
  internalToken?: string;
  timeout?: number;
}

export abstract class ServiceClient {
  protected client: AxiosInstance;

  constructor(config: ServiceClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey }),
        ...(config.internalToken && { 'X-Internal-Token': config.internalToken }),
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`[${this.constructor.name}] API Error:`, error.message);
        return Promise.reject(error);
      }
    );
  }

  protected async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(path, { params });
    return response.data;
  }

  protected async post<T>(path: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(path, data);
    return response.data;
  }

  protected async put<T>(path: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(path, data);
    return response.data;
  }

  protected async delete<T>(path: string): Promise<T> {
    const response = await this.client.delete<T>(path);
    return response.data;
  }
}

// ============================================================================
// GUEST MEMORY CLIENT
// ============================================================================

export class GuestMemoryClient extends ServiceClient {
  constructor(config: ServiceClientConfig) {
    super(config);
  }

  async getGuest(guest_id: string): Promise<any> {
    return this.get(`/api/v1/guests/${guest_id}`);
  }

  async createGuest(data: any): Promise<any> {
    return this.post('/api/v1/guests', data);
  }

  async updatePreferences(guest_id: string, preferences: any): Promise<any> {
    return this.put(`/api/v1/guests/${guest_id}/preferences`, preferences);
  }

  async getStayHistory(guest_id: string): Promise<any> {
    return this.get(`/api/v1/guests/${guest_id}/stays`);
  }
}

// ============================================================================
// REZ LOYALTY CLIENT
// ============================================================================

export class RezLoyaltyClient extends ServiceClient {
  constructor(config: ServiceClientConfig) {
    super(config);
  }

  async getMember(member_id: string): Promise<any> {
    return this.get(`/api/v1/members/${member_id}`);
  }

  async updateTier(member_id: string, tier: string): Promise<any> {
    return this.put(`/api/v1/members/${member_id}/tier`, { tier });
  }

  async getPoints(member_id: string): Promise<any> {
    return this.get(`/api/v1/members/${member_id}/points`);
  }

  async addPoints(member_id: string, points: number, description: string): Promise<any> {
    return this.post(`/api/v1/members/${member_id}/points`, { points, description });
  }
}

// ============================================================================
// REZ POS CLIENT
// ============================================================================

export class RezPosClient extends ServiceClient {
  constructor(config: ServiceClientConfig) {
    super(config);
  }

  async getTransaction(transaction_id: string): Promise<any> {
    return this.get(`/api/v1/transactions/${transaction_id}`);
  }

  async createCharge(guest_id: string, amount: number, description: string): Promise<any> {
    return this.post('/api/v1/charges', { guest_id, amount, description });
  }

  async getGuestFolio(guest_id: string): Promise<any> {
    return this.get(`/api/v1/folio/${guest_id}`);
  }
}

// ============================================================================
// BRAND PULSE CLIENT
// ============================================================================

export class BrandPulseClient extends ServiceClient {
  constructor(config: ServiceClientConfig) {
    super(config);
  }

  async getSentiment(brand_id: string): Promise<any> {
    return this.get(`/api/v1/sentiment/${brand_id}`);
  }

  async analyzeText(text: string): Promise<any> {
    return this.post('/api/v1/sentiment/analyze', { text });
  }

  async getReviews(brand_id: string, limit?: number): Promise<any> {
    return this.get(`/api/v1/reviews`, { brand_id, limit });
  }
}

// ============================================================================
// CLIENT FACTORY
// ============================================================================

let guestMemoryClient: GuestMemoryClient | null = null;
let rezLoyaltyClient: RezLoyaltyClient | null = null;
let rezPosClient: RezPosClient | null = null;
let brandPulseClient: BrandPulseClient | null = null;

export function getGuestMemoryClient(): GuestMemoryClient {
  if (!guestMemoryClient) {
    guestMemoryClient = new GuestMemoryClient({
      baseURL: process.env.GUEST_MEMORY_URL || 'http://localhost:8447',
      apiKey: process.env.GUEST_MEMORY_API_KEY,
      internalToken: process.env.INTERNAL_SERVICE_TOKEN,
    });
  }
  return guestMemoryClient;
}

export function getRezLoyaltyClient(): RezLoyaltyClient {
  if (!rezLoyaltyClient) {
    rezLoyaltyClient = new RezLoyaltyClient({
      baseURL: process.env.REZ_LOYALTY_URL || 'http://localhost:8450',
      internalToken: process.env.INTERNAL_SERVICE_TOKEN,
    });
  }
  return rezLoyaltyClient;
}

export function getRezPosClient(): RezPosClient {
  if (!rezPosClient) {
    rezPosClient = new RezPosClient({
      baseURL: process.env.REZ_POS_URL || 'http://localhost:8449',
      internalToken: process.env.INTERNAL_SERVICE_TOKEN,
    });
  }
  return rezPosClient;
}

export function getBrandPulseClient(): BrandPulseClient {
  if (!brandPulseClient) {
    brandPulseClient = new BrandPulseClient({
      baseURL: process.env.BRANDPULSE_URL || 'http://localhost:8451',
      internalToken: process.env.INTERNAL_SERVICE_TOKEN,
    });
  }
  return brandPulseClient;
}