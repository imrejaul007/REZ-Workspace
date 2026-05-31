/**
 * HOJAI AI SDK - TypeScript Client
 * Version: 1.0.0 | Date: May 30, 2026
 *
 * Usage:
 * ```typescript
 * import { HojaiClient } from '@hojai/sdk';
 *
 * const client = new HojaiClient({
 *   baseUrl: 'http://localhost:4500',
 *   tenantId: 'merchant_123'
 * });
 *
 * await client.health();
 * await client.predict('customer_456');
 * ```
 */

export interface HojaiConfig {
  baseUrl: string;
  tenantId: string;
  apiKey?: string;
}

export class HojaiClient {
  private baseUrl: string;
  private tenantId: string;
  private apiKey?: string;

  constructor(config: HojaiConfig) {
    this.baseUrl = config.baseUrl;
    this.tenantId = config.tenantId;
    this.apiKey = config.apiKey;
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Tenant-Id': this.tenantId,
      ...(this.apiKey && { 'X-API-Key': this.apiKey })
    };
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
    return res.json();
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body)
    });
    return res.json();
  }

  async health() { return this.get('/health'); }
  async predict(customerId: string) { return this.post('/api/intelligence/predict', { customerId }); }
  async createTenant(data: unknown) { return this.post('/api/governance/tenants', data); }
  async publishEvent(type: string, data: unknown) { return this.post('/api/events/publish', { type, data }); }
}

export default HojaiClient;
