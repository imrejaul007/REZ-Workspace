import axios, { AxiosInstance, AxiosError } from 'axios';
import config from '../config';
import logger from 'utils/logger.js';
import {
  IOAuthTokenResponse,
  IPinterestUser,
  IPinterestBoardResponse,
  IPinterestPinResponse,
  IPinterestAnalyticsResponse,
} from '../types';

export class PinterestApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PinterestApiError';
  }
}

export class PinterestApiClient {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || config.pinterest.accessToken;

    this.client = axios.create({
      baseURL: config.pinterest.apiUrl,
      timeout: config.service.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        logger.error('Pinterest API Error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });
        throw this.handleError(error);
      }
    );
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  private handleError(error: AxiosError): PinterestApiError {
    const statusCode = error.response?.status || 500;
    let message = 'Pinterest API request failed';
    let details: any;

    if (error.response?.data) {
      const data = error.response.data as any;
      message = data.message || data.error || message;
      details = data;
    } else if (error.code === 'ECONNABORTED') {
      message = 'Pinterest API request timeout';
    } else if (!error.response) {
      message = 'Unable to connect to Pinterest API';
    }

    return new PinterestApiError(statusCode, message, details);
  }

  // OAuth Methods
  getOAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.pinterest.appId,
      redirect_uri: config.pinterest.redirectUri,
      scope: 'boards:read boards:write pins:read pins:write user_accounts:read',
      state: state || this.generateState(),
    });

    return `${config.pinterest.oauthUrl}?${params.toString()}`;
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  async exchangeCodeForToken(code: string): Promise<IOAuthTokenResponse> {
    try {
      const response = await axios.post(
        `${config.pinterest.apiUrl}/oauth/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: config.pinterest.appId,
          client_secret: config.pinterest.appSecret,
          redirect_uri: config.pinterest.redirectUri,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<IOAuthTokenResponse> {
    try {
      const response = await axios.post(
        `${config.pinterest.apiUrl}/oauth/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: config.pinterest.appId,
          client_secret: config.pinterest.appSecret,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // User Methods
  async getCurrentUser(): Promise<IPinterestUser> {
    const response = await this.client.get('/user_account');
    return response.data;
  }

  async getUser(userId: string): Promise<IPinterestUser> {
    const response = await this.client.get(`/users/${userId}`);
    return response.data;
  }

  // Board Methods
  async getBoards(pageSize = 50, bookmark?: string): Promise<{ items: IPinterestBoardResponse[]; bookmark?: string }> {
    const params: any = { page_size: pageSize };
    if (bookmark) params.bookmark = bookmark;

    const response = await this.client.get('/boards', { params });
    return response.data;
  }

  async getBoard(boardId: string): Promise<IPinterestBoardResponse> {
    const response = await this.client.get(`/boards/${boardId}`);
    return response.data;
  }

  async createBoard(name: string, description?: string, privacy?: 'PUBLIC' | 'SECRET'): Promise<IPinterestBoardResponse> {
    const response = await this.client.post('/boards', {
      name,
      description,
      privacy: privacy || 'PUBLIC',
    });
    return response.data;
  }

  async updateBoard(boardId: string, data: { name?: string; description?: string; privacy?: 'PUBLIC' | 'SECRET' }): Promise<IPinterestBoardResponse> {
    const response = await this.client.patch(`/boards/${boardId}`, data);
    return response.data;
  }

  async deleteBoard(boardId: string): Promise<void> {
    await this.client.delete(`/boards/${boardId}`);
  }

  // Pin Methods
  async getPins(boardId: string, pageSize = 50, bookmark?: string): Promise<{ items: IPinterestPinResponse[]; bookmark?: string }> {
    const params: any = { page_size: pageSize };
    if (bookmark) params.bookmark = bookmark;

    const response = await this.client.get(`/boards/${boardId}/pins`, { params });
    return response.data;
  }

  async getPin(pinId: string): Promise<IPinterestPinResponse> {
    const response = await this.client.get(`/pins/${pinId}`);
    return response.data;
  }

  async createPin(data: {
    boardId: string;
    title: string;
    description?: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    link?: string;
    altText?: string;
  }): Promise<IPinterestPinResponse> {
    const response = await this.client.post('/pins', {
      board_id: data.boardId,
      title: data.title,
      description: data.description,
      media_source: {
        source_type: 'image_url',
        url: data.mediaUrl,
      },
      link: data.link,
      alt_text: data.altText,
    });
    return response.data;
  }

  async createPinWithUpload(data: {
    boardId: string;
    title: string;
    description?: string;
    mediaBase64: string;
    link?: string;
    altText?: string;
  }): Promise<IPinterestPinResponse> {
    const response = await this.client.post('/pins', {
      board_id: data.boardId,
      title: data.title,
      description: data.description,
      media_source: {
        source_type: 'image_base64',
        data: data.mediaBase64,
      },
      link: data.link,
      alt_text: data.altText,
    });
    return response.data;
  }

  async updatePin(pinId: string, data: { title?: string; description?: string; link?: string; alt_text?: string }): Promise<IPinterestPinResponse> {
    const response = await this.client.patch(`/pins/${pinId}`, data);
    return response.data;
  }

  async deletePin(pinId: string): Promise<void> {
    await this.client.delete(`/pins/${pinId}`);
  }

  // Idea Pin Methods (Story format)
  async createIdeaPin(data: {
    boardId: string;
    title: string;
    description?: string;
    mediaSources: Array<{ url: string; type: 'image_url' }>;
    link?: string;
    altText?: string;
  }): Promise<IPinterestPinResponse> {
    const response = await this.client.post('/pins', {
      board_id: data.boardId,
      title: data.title,
      description: data.description,
      media_sources: data.mediaSources.map((m) => ({
        source_type: m.type,
        url: m.url,
      })),
      link: data.link,
      alt_text: data.altText,
    });
    return response.data;
  }

  // Analytics Methods
  async getAnalytics(startDate: string, endDate: string, pinId?: string): Promise<IPinterestAnalyticsResponse> {
    const params: any = {
      start_date: startDate,
      end_date: endDate,
      metric_types: 'IMPRESSION,SAVE,CLICK,REPIN,COMMENT',
    };
    if (pinId) params.pin_id = pinId;

    const response = await this.client.get('/analytics', { params });
    return response.data;
  }

  async getAudienceInsights(): Promise<any> {
    const response = await this.client.get('/audience_insights');
    return response.data;
  }

  async getPinAnalytics(pinId: string, startDate: string, endDate: string): Promise<any> {
    const response = await this.client.get(`/pins/${pinId}/analytics`, {
      params: {
        start_date: startDate,
        end_date: endDate,
        metric_types: 'IMPRESSION,SAVE,CLICK,REPIN,COMMENT',
      },
    });
    return response.data;
  }

  // Comment Methods
  async getComments(pinId: string): Promise<any> {
    const response = await this.client.get(`/pins/${pinId}/comments`);
    return response.data;
  }

  async hideComment(commentId: string): Promise<void> {
    await this.client.patch(`/comments/${commentId}`, { hidden: true });
  }

  // Shopping Integration
  async addProductToPin(pinId: string, productId: string, price: string, currency: string): Promise<any> {
    const response = await this.client.post(`/pins/${pinId}/products`, {
      product_id: productId,
      price,
      currency,
    });
    return response.data;
  }

  // Rich Pins
  async validateRichPin(pinId: string): Promise<{ valid: boolean; metadata?: any }> {
    const response = await this.client.post(`/pins/${pinId}/rich_pin/validate`);
    return response.data;
  }
}

// Factory function for creating API client
export const createPinterestApiClient = (accessToken?: string): PinterestApiClient => {
  return new PinterestApiClient(accessToken);
};

export default PinterestApiClient;
