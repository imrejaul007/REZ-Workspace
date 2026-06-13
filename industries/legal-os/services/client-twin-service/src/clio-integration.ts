import { ClientTwin } from './schemas';

/**
 * Clio Practice Management Integration
 * Handles bidirectional sync between Client Twin Service and Clio
 */

export interface ClioConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

export interface ClioMatterData {
  display_number: string;
  description: string;
  client_name: string;
  status: 'open' | 'closed';
  practice_area?: string;
  open_date?: string;
  close_date?: string;
}

export interface ClioClientData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export class ClioIntegration {
  private config: ClioConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(config: ClioConfig) {
    this.config = config;
  }

  /**
   * Authenticate with Clio API using OAuth2
   */
  async authenticate(): Promise<void> {
    // Implementation would use OAuth2 flow
    // For now, tokens should be provided via environment variables
    this.accessToken = process.env.CLIO_ACCESS_TOKEN || '';
    this.refreshToken = process.env.CLIO_REFRESH_TOKEN || '';
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<void> {
    // Implementation for token refresh
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
  }

  /**
   * Sync Client Twin to Clio Matter
   */
  async syncClientToMatter(client: ClientTwin): Promise<string> {
    const matterData: ClioMatterData = {
      display_number: `CL-${client.clientId.slice(0, 8)}`,
      description: client.legalName,
      client_name: client.legalName,
      status: client.clientStatus === 'Active' ? 'open' : 'closed',
      open_date: client.dateOfOnboarding
    };

    const response = await this.makeRequest('/matters', 'POST', matterData);
    return response.data.id;
  }

  /**
   * Sync Client Twin to Clio Contact
   */
  async syncClientToContact(client: ClientTwin): Promise<string> {
    const contactData: ClioClientData = {
      first_name: client.primaryContact.name.split(' ')[0] || '',
      last_name: client.primaryContact.name.split(' ').slice(1).join(' ') || '',
      email: client.primaryContact.email,
      phone: client.primaryContact.phone,
      company_name: client.legalName,
      address: {
        street: client.billingInfo.billingAddress,
        city: '',
        state: '',
        zip: '',
        country: client.jurisdiction
      }
    };

    const response = await this.makeRequest('/contacts', 'POST', contactData);
    return response.data.id;
  }

  /**
   * Get matters from Clio
   */
  async getMatters(params?: {
    status?: string;
    client_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<ClioMatterData[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.client_id) queryParams.append('client_id', params.client_id);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await this.makeRequest(`/matters?${queryParams}`, 'GET');
    return response.data;
  }

  /**
   * Get contacts from Clio
   */
  async getContacts(params?: {
    email?: string;
    limit?: number;
  }): Promise<ClioClientData[]> {
    const queryParams = new URLSearchParams();
    if (params?.email) queryParams.append('email', params.email);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await this.makeRequest(`/contacts?${queryParams}`, 'GET');
    return response.data;
  }

  /**
   * Update matter in Clio
   */
  async updateMatter(matterId: string, data: Partial<ClioMatterData>): Promise<void> {
    await this.makeRequest(`/matters/${matterId}`, 'PUT', data);
  }

  /**
   * Make authenticated request to Clio API
   */
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: unknown
  ): Promise<{ data: unknown }> {
    const baseUrl = this.config.environment === 'sandbox'
      ? 'https://api-clio-developer.sandbox.clio.com/v4'
      : 'https://api.clio.com/v4';

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: data ? JSON.stringify({ data }) : undefined
    });

    if (response.status === 401) {
      await this.refreshAccessToken();
      return this.makeRequest(endpoint, method, data);
    }

    if (!response.ok) {
      throw new Error(`Clio API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}
