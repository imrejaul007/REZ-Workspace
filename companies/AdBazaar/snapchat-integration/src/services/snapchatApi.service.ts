import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import { logger } from 'utils/logger.js';
import { ExternalServiceError } from '../utils/errors.js';

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SnapchatAdAccountResponse {
  id: string;
  organization_id: string;
  display_name: string;
  timezone: string;
  currency: string;
}

export interface SnapchatCampaignResponse {
  id: string;
  ad_account_id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget_micro: number;
  total_budget_micro: number;
  start_time: string;
  end_time?: string;
  targeting?: Record<string, unknown>;
}

export interface SnapchatAdResponse {
  id: string;
  campaign_id: string;
  name: string;
  type: string;
  status: string;
  creative?: Record<string, unknown>;
}

export interface SnapchatAudienceResponse {
  id: string;
  ad_account_id: string;
  name: string;
  description: string;
  size: number;
  source: string;
  status: string;
}

export interface PixelEvent {
  event_type: string;
  timestamp: number;
  user_id?: string;
  email?: string;
  phone?: string;
  pixel_id: string;
  event_data?: Record<string, unknown>;
}

class SnapchatApiService {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.snapchat.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async getOAuthUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: config.snapchat.clientId,
      redirect_uri: config.snapchat.redirectUrl,
      response_type: 'code',
      scope: 'snapchat-marketing-api',
      state,
    });

    return `${config.snapchat.oauthUrl}/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    try {
      const response = await axios.post(
        `${config.snapchat.oauthUrl}/access_token`,
        new URLSearchParams({
          client_id: config.snapchat.clientId,
          client_secret: config.snapchat.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: config.snapchat.redirectUrl,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const data = response.data;
      this.accessToken = data.access_token;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      logger.error('Failed to exchange code for tokens', { error });
      throw new ExternalServiceError('Failed to authenticate with Snapchat');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      const response = await axios.post(
        `${config.snapchat.oauthUrl}/access_token`,
        new URLSearchParams({
          client_id: config.snapchat.clientId,
          client_secret: config.snapchat.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const data = response.data;
      this.accessToken = data.access_token;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      logger.error('Failed to refresh access token', { error });
      throw new ExternalServiceError('Failed to refresh Snapchat token');
    }
  }

  async getAdAccounts(): Promise<SnapchatAdAccountResponse[]> {
    try {
      const response = await this.client.get('/adaccounts');
      return response.data.adaccounts || [];
    } catch (error) {
      logger.error('Failed to get ad accounts', { error });
      throw new ExternalServiceError('Failed to fetch ad accounts from Snapchat');
    }
  }

  async getAdAccount(adAccountId: string): Promise<SnapchatAdAccountResponse> {
    try {
      const response = await this.client.get(`/adaccounts/${adAccountId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get ad account', { adAccountId, error });
      throw new ExternalServiceError('Failed to fetch ad account from Snapchat');
    }
  }

  async createCampaign(
    adAccountId: string,
    campaign: Partial<SnapchatCampaignResponse>
  ): Promise<SnapchatCampaignResponse> {
    try {
      const response = await this.client.post(
        `/adaccounts/${adAccountId}/campaigns`,
        campaign
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to create campaign', { adAccountId, error });
      throw new ExternalServiceError('Failed to create campaign in Snapchat');
    }
  }

  async getCampaigns(adAccountId: string): Promise<SnapchatCampaignResponse[]> {
    try {
      const response = await this.client.get(`/adaccounts/${adAccountId}/campaigns`);
      return response.data.campaigns || [];
    } catch (error) {
      logger.error('Failed to get campaigns', { adAccountId, error });
      throw new ExternalServiceError('Failed to fetch campaigns from Snapchat');
    }
  }

  async getCampaign(adAccountId: string, campaignId: string): Promise<SnapchatCampaignResponse> {
    try {
      const response = await this.client.get(
        `/adaccounts/${adAccountId}/campaigns/${campaignId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to get campaign', { adAccountId, campaignId, error });
      throw new ExternalServiceError('Failed to fetch campaign from Snapchat');
    }
  }

  async updateCampaign(
    adAccountId: string,
    campaignId: string,
    updates: Partial<SnapchatCampaignResponse>
  ): Promise<SnapchatCampaignResponse> {
    try {
      const response = await this.client.patch(
        `/adaccounts/${adAccountId}/campaigns/${campaignId}`,
        updates
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to update campaign', { adAccountId, campaignId, error });
      throw new ExternalServiceError('Failed to update campaign in Snapchat');
    }
  }

  async startCampaign(adAccountId: string, campaignId: string): Promise<void> {
    try {
      await this.client.post(`/adaccounts/${adAccountId}/campaigns/${campaignId}/start`);
    } catch (error) {
      logger.error('Failed to start campaign', { adAccountId, campaignId, error });
      throw new ExternalServiceError('Failed to start campaign in Snapchat');
    }
  }

  async pauseCampaign(adAccountId: string, campaignId: string): Promise<void> {
    try {
      await this.client.post(`/adaccounts/${adAccountId}/campaigns/${campaignId}/pause`);
    } catch (error) {
      logger.error('Failed to pause campaign', { adAccountId, campaignId, error });
      throw new ExternalServiceError('Failed to pause campaign in Snapchat');
    }
  }

  async getCampaignAnalytics(
    adAccountId: string,
    campaignId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.get(
        `/adaccounts/${adAccountId}/campaigns/${campaignId}/stats`,
        {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to get campaign analytics', { adAccountId, campaignId, error });
      throw new ExternalServiceError('Failed to fetch campaign analytics from Snapchat');
    }
  }

  async createAd(
    adAccountId: string,
    campaignId: string,
    ad: Partial<SnapchatAdResponse>
  ): Promise<SnapchatAdResponse> {
    try {
      const response = await this.client.post(
        `/adaccounts/${adAccountId}/campaigns/${campaignId}/ads`,
        ad
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to create ad', { adAccountId, campaignId, error });
      throw new ExternalServiceError('Failed to create ad in Snapchat');
    }
  }

  async getAds(adAccountId: string, campaignId: string): Promise<SnapchatAdResponse[]> {
    try {
      const response = await this.client.get(
        `/adaccounts/${adAccountId}/campaigns/${campaignId}/ads`
      );
      return response.data.ads || [];
    } catch (error) {
      logger.error('Failed to get ads', { adAccountId, campaignId, error });
      throw new ExternalServiceError('Failed to fetch ads from Snapchat');
    }
  }

  async getAdAnalytics(
    adAccountId: string,
    adId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.get(
        `/adaccounts/${adAccountId}/ads/${adId}/stats`,
        {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to get ad analytics', { adAccountId, adId, error });
      throw new ExternalServiceError('Failed to fetch ad analytics from Snapchat');
    }
  }

  async getAudiences(adAccountId: string): Promise<SnapchatAudienceResponse[]> {
    try {
      const response = await this.client.get(`/adaccounts/${adAccountId}/customaudiences`);
      return response.data.custom_audiences || [];
    } catch (error) {
      logger.error('Failed to get audiences', { adAccountId, error });
      throw new ExternalServiceError('Failed to fetch audiences from Snapchat');
    }
  }

  async createAudience(
    adAccountId: string,
    audience: Partial<SnapchatAudienceResponse>
  ): Promise<SnapchatAudienceResponse> {
    try {
      const response = await this.client.post(
        `/adaccounts/${adAccountId}/customaudiences`,
        audience
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to create audience', { adAccountId, error });
      throw new ExternalServiceError('Failed to create audience in Snapchat');
    }
  }

  async createPixel(adAccountId: string, name: string): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.post(`/adaccounts/${adAccountId}/pixels`, { name });
      return response.data;
    } catch (error) {
      logger.error('Failed to create pixel', { adAccountId, error });
      throw new ExternalServiceError('Failed to create pixel in Snapchat');
    }
  }

  async getPixelEvents(
    adAccountId: string,
    pixelId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.get(
        `/adaccounts/${adAccountId}/pixels/${pixelId}/events`,
        {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to get pixel events', { adAccountId, pixelId, error });
      throw new ExternalServiceError('Failed to fetch pixel events from Snapchat');
    }
  }
}

export const snapchatApiService = new SnapchatApiService();
export default snapchatApiService;