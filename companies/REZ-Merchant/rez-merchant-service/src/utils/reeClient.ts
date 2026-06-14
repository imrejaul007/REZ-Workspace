/**
 * REE Client
 */

export class MerchantREEClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async request<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify(params || {}),
    });
    return response.json();
  }

  async checkFraud(merchantId: string, action: string): Promise<{ allowed: boolean; reason?: string }> {
    const result = await this.request<{ allowed: boolean; reason?: string }>('/query/fraud', { merchantId, action });
    return result;
  }
}

export const merchantREE = new MerchantREEClient(process.env.REE_URL || '', process.env.REE_API_KEY || '');
export default merchantREE;
