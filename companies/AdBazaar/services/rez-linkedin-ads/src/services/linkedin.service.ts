import axios, { AxiosInstance, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import {
  LinkedInConfig,
  LinkedInOAuthToken,
  LinkedInUser,
  LinkedInOrganization,
  PostRequest,
  LinkedInPost,
  SponsoredCampaign,
  SponsoredCampaignCreate,
  SponsoredCreative,
  LeadGenForm,
  LeadGenFormCreate,
  Lead,
  CampaignAnalytics,
  AnalyticsRequest,
} from '../types';

// LinkedIn API Error Codes
export enum LinkedInErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface LinkedInApiError {
  code: LinkedInErrorCode;
  message: string;
  statusCode: number;
  details?: unknown;
  retryAfter?: number;
}

export class LinkedInService {
  private config: LinkedInConfig;
  private tenantTokens: Map<string, string> = new Map();
  private tenantOrganizations: Map<string, string[]> = new Map();
  private tenantRefreshTokens: Map<string, string> = new Map();

  // Rate limiting state per tenant
  private rateLimitState: Map<string, { remaining: number; resetTime: number }> = new Map();

  constructor() {
    this.config = {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
      callbackUrl: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:4790/auth/callback',
    };
  }

  /**
   * Parse LinkedIn API error into structured format
   */
  private parseLinkedInError(error: unknown): LinkedInApiError {
    const axiosError = error as AxiosError<{ message?: string; serviceRelationCode?: number }>;
    const statusCode = axiosError.response?.status || 500;
    let code = LinkedInErrorCode.UNKNOWN;
    let message = 'An unknown error occurred';
    let retryAfter: number | undefined;

    if (axiosError.response?.headers?.['retry-after']) {
      retryAfter = parseInt(axiosError.response.headers['retry-after'] as string, 10);
    }

    switch (statusCode) {
      case 401:
        code = LinkedInErrorCode.UNAUTHORIZED;
        message = 'Invalid or expired access token';
        break;
      case 403:
        code = LinkedInErrorCode.INSUFFICIENT_PERMISSIONS;
        message = 'Insufficient permissions to perform this action';
        break;
      case 404:
        code = LinkedInErrorCode.RESOURCE_NOT_FOUND;
        message = 'The requested resource was not found';
        break;
      case 429:
        code = LinkedInErrorCode.RATE_LIMITED;
        message = 'Rate limit exceeded. Please try again later.';
        break;
      case 400:
        code = LinkedInErrorCode.INVALID_REQUEST;
        message = axiosError.response?.data?.message || 'Invalid request parameters';
        break;
      case 500:
      case 502:
      case 503:
        code = LinkedInErrorCode.INTERNAL_ERROR;
        message = 'LinkedIn API is experiencing issues';
        break;
      default:
        message = axiosError.response?.data?.message || axiosError.message || 'An unknown error occurred';
    }

    return { code, message, statusCode, details: axiosError.response?.data, retryAfter };
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: LinkedInApiError): boolean {
    return [
      LinkedInErrorCode.RATE_LIMITED,
      LinkedInErrorCode.INTERNAL_ERROR,
      LinkedInErrorCode.NETWORK_ERROR,
    ].includes(error.code);
  }

  /**
   * Exponential backoff delay calculation
   */
  private calculateBackoff(attempt: number, retryAfter?: number): number {
    if (retryAfter) {
      return retryAfter * 1000;
    }
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter (±25%)
    const jitter = delay * 0.25 * Math.random();
    return delay + jitter;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    request: () => Promise<T>,
    maxRetries: number = 3,
    tenantId?: string
  ): Promise<T> {
    let lastError: LinkedInApiError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await request();
      } catch (error) {
        lastError = this.parseLinkedInError(error);

        // Update rate limit state if available
        if (lastError.retryAfter && tenantId) {
          this.rateLimitState.set(tenantId, {
            remaining: 0,
            resetTime: Date.now() + lastError.retryAfter * 1000,
          });
        }

        // Don't retry if not retryable or max retries reached
        if (!this.isRetryable(lastError) || attempt >= maxRetries) {
          break;
        }

        const delay = this.calculateBackoff(attempt, lastError.retryAfter);
        logger.warn(`Retrying request after ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries,
          errorCode: lastError.code,
          tenantId,
        });
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createClient(accessToken: string): AxiosInstance {
    return axios.create({
      baseURL: 'https://api.linkedin.com/v2',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      timeout: 30000,
    });
  }

  private getClient(tenantId: string): AxiosInstance {
    const token = this.tenantTokens.get(tenantId) || this.config.accessToken;
    if (!token) {
      throw new Error('No access token available. Please authenticate first.');
    }
    return this.createClient(token);
  }

  /**
   * Check if tenant is rate limited
   */
  isRateLimited(tenantId: string): boolean {
    const state = this.rateLimitState.get(tenantId);
    if (!state) return false;
    return Date.now() < state.resetTime;
  }

  /**
   * Get rate limit reset time
   */
  getRateLimitReset(tenantId: string): number | null {
    const state = this.rateLimitState.get(tenantId);
    if (!state) return null;
    return state.resetTime;
  }

  // OAuth: Generate authorization URL
  generateAuthUrl(tenantId: string): string {
    if (!this.config.clientId) {
      throw new Error('LINKEDIN_CLIENT_ID is not configured');
    }

    const scopes = [
      'r_liteprofile',
      'r_emailaddress',
      'w_member_social',
      'w_organization_social',
      'rw_organization_admin',
      'r_organization_social',
      'rw_ads',
      'r_ads',
      'r_ads_reporting',
      'w_member_social',
    ].join(' ');

    const state = Buffer.from(JSON.stringify({ tenantId, requestId: uuidv4() })).toString('base64');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.callbackUrl,
      scope: scopes,
      state,
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Parse state parameter from OAuth callback
   */
  parseOAuthState(state: string): { tenantId: string; requestId: string } | null {
    try {
      return JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    } catch {
      return null;
    }
  }

  // OAuth: Exchange code for token
  async exchangeCodeForToken(code: string, state: string): Promise<LinkedInOAuthToken> {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('LinkedIn OAuth credentials not configured');
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.callbackUrl,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    try {
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      const tokenData: LinkedInOAuthToken = response.data;
      const stateData = this.parseOAuthState(state);
      const tenantId = stateData?.tenantId || state;

      this.tenantTokens.set(tenantId, tokenData.access_token);

      // Store refresh token if available
      if (tokenData.refresh_token) {
        this.tenantRefreshTokens.set(tenantId, tokenData.refresh_token);
      }

      // Fetch and store organization info
      await this.fetchAndStoreOrganizations(tenantId, tokenData.access_token);

      logger.info('LinkedIn OAuth successful', { tenantId });
      return tokenData;
    } catch (error) {
      const linkedInError = this.parseLinkedInError(error);
      logger.error('LinkedIn OAuth failed', { error: linkedInError });
      throw new Error(`OAuth failed: ${linkedInError.message}`);
    }
  }

  // OAuth: Refresh token
  async refreshToken(tenantId: string): Promise<LinkedInOAuthToken> {
    const refreshToken = this.tenantRefreshTokens.get(tenantId);

    if (!refreshToken) {
      throw new Error('No refresh token available for this tenant');
    }

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('LinkedIn OAuth credentials not configured');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    try {
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      const tokenData: LinkedInOAuthToken = response.data;
      this.tenantTokens.set(tenantId, tokenData.access_token);

      // Update refresh token if a new one was provided
      if (tokenData.refresh_token) {
        this.tenantRefreshTokens.set(tenantId, tokenData.refresh_token);
      }

      logger.info('LinkedIn token refreshed', { tenantId });
      return tokenData;
    } catch (error) {
      const linkedInError = this.parseLinkedInError(error);
      logger.error('Failed to refresh LinkedIn token', { error: linkedInError, tenantId });
      throw new Error(`Token refresh failed: ${linkedInError.message}`);
    }
  }

  /**
   * Ensure we have a valid token (refresh if needed)
   */
  async ensureValidToken(tenantId: string): Promise<string> {
    const token = this.tenantTokens.get(tenantId) || this.config.accessToken;
    if (!token) {
      throw new Error('No access token available');
    }

    try {
      // Try a lightweight API call to verify token validity
      await this.executeWithRetry(
        async () => {
          const client = this.createClient(token);
          await client.get('https://api.linkedin.com/v2/me', { params: { projection: '(id)' } });
          return true;
        },
        1,
        tenantId
      );
      return token;
    } catch {
      // Token might be invalid, try refresh
      if (this.tenantRefreshTokens.has(tenantId)) {
        try {
          const newToken = await this.refreshToken(tenantId);
          return newToken.access_token;
        } catch {
          throw new Error('Access token expired and refresh failed');
        }
      }
      throw new Error('Access token expired');
    }
  }

  setAccessToken(tenantId: string, accessToken: string, refreshToken?: string): void {
    this.tenantTokens.set(tenantId, accessToken);
    if (refreshToken) {
      this.tenantRefreshTokens.set(tenantId, refreshToken);
    }
  }

  // Get current user profile
  async getCurrentUser(tenantId: string): Promise<LinkedInUser> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);
      const response = await client.get('https://api.linkedin.com/v2/me');
      return response.data;
    }, 3, tenantId);
  }

  // Get user email
  async getUserEmail(tenantId: string): Promise<string> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);
      const response = await client.get('https://api.linkedin.com/v2/emailAddress', {
        params: {
          q: 'members',
          projection: '(elements*(handle~))',
        },
      });
      const email = response.data.elements?.[0]?.['handle~']?.emailAddress;
      if (!email) {
        throw new Error('No email address found for user');
      }
      return email;
    }, 3, tenantId);
  }

  // Get user's organizations
  async getOrganizations(tenantId: string): Promise<LinkedInOrganization[]> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);

      // Get organizational entity ACLs (permissions to manage orgs)
      const response = await client.get('https://api.linkedin.com/v2/organizationalEntityAcls', {
        params: {
          q: 'roleAssignee',
          projection: '(elements*(organizationalTarget~(localizedName),role,roleStatus))',
        },
      });

      const organizations: LinkedInOrganization[] = [];
      const elements = response.data.elements || [];

      // Fetch details for each organization in parallel
      const orgPromises = elements.map(async (element: { organizationalTarget?: string; role?: string; roleStatus?: string }) => {
        const orgUrn = element.organizationalTarget;
        if (!orgUrn) return null;

        const orgId = orgUrn.split(':').pop();
        if (!orgId) return null;

        try {
          const orgDetails = await this.getOrganization(tenantId, orgId);
          return {
            ...orgDetails,
            role: element.role,
            roleStatus: element.roleStatus,
          } as LinkedInOrganization & { role?: string; roleStatus?: string };
        } catch {
          logger.warn('Failed to fetch organization details', { orgId });
          return { id: orgId, name: 'Unknown Organization' } as LinkedInOrganization;
        }
      });

      const results = await Promise.all(orgPromises);
      return results.filter((org): org is LinkedInOrganization => org !== null);
    }, 3, tenantId);
  }

  private async fetchAndStoreOrganizations(tenantId: string, accessToken: string): Promise<void> {
    try {
      const tempClient = this.createClient(accessToken);
      const response = await tempClient.get('https://api.linkedin.com/v2/organizationalEntityAcls', {
        params: {
          q: 'roleAssignee',
          projection: '(elements*(organizationalTarget))',
        },
      });

      const orgIds = (response.data.elements || [])
        .map((e: { organizationalTarget?: string }) => e.organizationalTarget?.split(':').pop())
        .filter((id: string | undefined): id is string => !!id);

      this.tenantOrganizations.set(tenantId, orgIds);
    } catch (error) {
      logger.warn('Failed to fetch organizations', { tenantId, error });
    }
  }

  // Get organization details
  async getOrganization(tenantId: string, organizationId: string): Promise<LinkedInOrganization> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);
      const response = await client.get(`https://api.linkedin.com/v2/organizations/${organizationId}`, {
        params: {
          projection: '(id,name,displayName,website,tagline,description,foundedOn,employeeCountRange,headquarter,primaryCompanyType,companyStatus,universalName)',
        },
      });
      return response.data;
    }, 3, tenantId);
  }

  /**
   * Upload an image to LinkedIn and return the asset URN
   */
  async uploadImage(tenantId: string, imageData: Buffer, fileName: string): Promise<string> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);
      const personId = await this.getCurrentUserPersonId(tenantId);

      // First, register the upload
      const registerResponse = await client.post(
        'https://api.linkedin.com/v2/assets',
        {
          registerUploadRequest: {
            owner: `urn:li:person:${personId}`,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent',
              },
            ],
          },
        },
        {
          params: {
            action: 'registerUpload',
          },
        }
      );

      const uploadUrl = registerResponse.data.value.assetUploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;

      if (!uploadUrl) {
        throw new Error('Failed to get upload URL from LinkedIn');
      }

      const assetUrn = registerResponse.data.value.asset;

      // Upload the image
      await axios.post(uploadUrl, imageData, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Authorization': `Bearer ${this.tenantTokens.get(tenantId) || this.config.accessToken}`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      logger.info('Image uploaded to LinkedIn', { assetUrn, tenantId });
      return assetUrn;
    }, 3, tenantId);
  }

  /**
   * Upload an image for an organization
   */
  async uploadOrganizationImage(tenantId: string, organizationId: string, imageData: Buffer): Promise<string> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);

      // Register the upload
      const registerResponse = await client.post(
        'https://api.linkedin.com/v2/assets',
        {
          registerUploadRequest: {
            owner: `urn:li:organization:${organizationId}`,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent',
              },
            ],
          },
        },
        {
          params: {
            action: 'registerUpload',
          },
        }
      );

      const uploadUrl = registerResponse.data.value.assetUploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;

      if (!uploadUrl) {
        throw new Error('Failed to get upload URL from LinkedIn');
      }

      const assetUrn = registerResponse.data.value.asset;

      // Upload the image
      await axios.post(uploadUrl, imageData, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Authorization': `Bearer ${this.tenantTokens.get(tenantId) || this.config.accessToken}`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      logger.info('Organization image uploaded to LinkedIn', { assetUrn, organizationId, tenantId });
      return assetUrn;
    }, 3, tenantId);
  }

  // Create a post on personal profile
  async createPost(tenantId: string, postData: PostRequest): Promise<LinkedInPost> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);
      const personId = await this.getCurrentUserPersonId(tenantId);

      const response = await client.post('/ugcPosts', {
        ...postData,
        author: `urn:li:person:${personId}`,
      });

      const postId = response.data.id;
      logger.info('LinkedIn post created', { postId, tenantId });

      return {
        id: postId,
        author: `urn:li:person:${personId}`,
        lifecycleState: postData.lifecycleState || 'PUBLISHED',
        visibility: postData.visibility,
        created: { time: Date.now() },
        lastModified: { time: Date.now() },
        commentary: postData.commentary,
        content: postData.content,
      };
    }, 3, tenantId);
  }

  private async getCurrentUserPersonId(tenantId: string): Promise<string> {
    const user = await this.getCurrentUser(tenantId);
    return user.sub;
  }

  // Create a post on organization page
  async createOrganizationPost(tenantId: string, organizationId: string, postData: PostRequest): Promise<LinkedInPost> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);

      const response = await client.post('/ugcPosts', {
        ...postData,
        author: `urn:li:organization:${organizationId}`,
      });

      const postId = response.data.id;
      logger.info('LinkedIn organization post created', { postId, organizationId, tenantId });

      return {
        id: postId,
        author: `urn:li:organization:${organizationId}`,
        lifecycleState: postData.lifecycleState || 'PUBLISHED',
        visibility: postData.visibility,
        created: { time: Date.now() },
        lastModified: { time: Date.now() },
        commentary: postData.commentary,
        content: postData.content,
      };
    }, 3, tenantId);
  }

  // Get post by ID
  async getPost(tenantId: string, postId: string): Promise<LinkedInPost> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);
      const response = await client.get(`/ugcPosts/${postId}`, {
        params: {
          projection: '(id,author,lifecycleState,visibility,created,lastModified,commentary,content,article,image)',
        },
      });
      return response.data;
    }, 3, tenantId);
  }

  // Delete post
  async deletePost(tenantId: string, postId: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);
      await client.delete(`/ugcPosts/${postId}`);
      logger.info('LinkedIn post deleted', { postId, tenantId });
      return true;
    }, 3, tenantId);
  }

  // Get ad accounts
  async getAdAccounts(tenantId: string): Promise<Array<{ id: string; name: string; status: string; currency: string }>> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);
      const response = await client.get('/adAccounts', {
        params: {
          q: 'search',
          search: {
            status: { values: ['ACTIVE', 'LEASED', 'CLOSED'] },
          },
          projection: '(elements*(id,name,status,currency))',
        },
      });
      return response.data.elements || [];
    }, 3, tenantId);
  }

  // Create sponsored campaign
  async createCampaign(tenantId: string, accountId: string, campaignData: SponsoredCampaignCreate): Promise<SponsoredCampaign> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);

      // Validate required fields
      if (!campaignData.name) {
        throw new Error('Campaign name is required');
      }
      if (!campaignData.format) {
        throw new Error('Campaign format is required');
      }

      const response = await client.post('/adCampaignsV2', {
        account: `urn:li:sponsoredAccount:${accountId}`,
        name: campaignData.name,
        status: campaignData.status || 'DRAFT',
        runSchedule: campaignData.runSchedule,
        targeting: this.transformTargeting(campaignData.targeting),
        dailyBudget: campaignData.dailyBudget,
        totalBudget: campaignData.totalBudget,
        format: campaignData.format,
        unitCost: campaignData.unitCost,
        costType: campaignData.costType,
        optimizationTargetType: campaignData.optimizationTargetType,
      });

      const campaignId = response.data.id;
      logger.info('LinkedIn campaign created', { campaignId, accountId, tenantId });

      return {
        id: campaignId,
        account: accountId,
        name: campaignData.name,
        status: campaignData.status || 'DRAFT',
        format: campaignData.format,
      } as SponsoredCampaign;
    }, 3, tenantId);
  }

  /**
   * Transform targeting object to LinkedIn format
   */
  private transformTargeting(targeting?: SponsoredCampaign['targeting']) {
    if (!targeting) return undefined;

    const linkedinTargeting: Record<string, unknown> = {};

    if (targeting.locations?.length) {
      linkedinTargeting['urn:li:adTargetingType:locations'] = targeting.locations.map(l => l.id);
    }
    if (targeting.industries?.length) {
      linkedinTargeting['urn:li:adTargetingType:industries'] = targeting.industries.map(i => i.id);
    }
    if (targeting.jobTitles?.length) {
      linkedinTargeting['urn:li:adTargetingType:jobTitles'] = targeting.jobTitles.map(j => j.id);
    }
    if (targeting.companySizes?.length) {
      linkedinTargeting['urn:li:adTargetingType:companySizes'] = targeting.companySizes;
    }
    if (targeting.ageRanges?.length) {
      linkedinTargeting['urn:li:adTargetingType:ageRanges'] = targeting.ageRanges.map(a => a.id);
    }
    if (targeting.memberSeniority?.length) {
      linkedinTargeting['urn:li:adTargetingType:seniorities'] = targeting.memberSeniority.map(s => s.id);
    }
    if (targeting.skills?.length) {
      linkedinTargeting['urn:li:adTargetingType:skills'] = targeting.skills.map(s => s.id);
    }
    if (targeting.schools?.length) {
      linkedinTargeting['urn:li:adTargetingType:schools'] = targeting.schools.map(s => s.id);
    }
    if (targeting.yearsOfExperience?.length) {
      linkedinTargeting['urn:li:adTargetingType:yearsOfExperience'] = targeting.yearsOfExperience.map(y => y.id);
    }

    return Object.keys(linkedinTargeting).length > 0 ? linkedinTargeting : undefined;
  }

  // Get campaign
  async getCampaign(tenantId: string, campaignId: string): Promise<SponsoredCampaign> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);
      const response = await client.get(`/adCampaignsV2/${campaignId}`, {
        params: {
          projection: '(id,account,name,status,runSchedule,targeting,dailyBudget,totalBudget,format,unitCost,costType,optimizationTargetType)',
        },
      });
      return response.data;
    }, 3, tenantId);
  }

  // Get campaigns by account
  async getCampaigns(tenantId: string, accountId: string): Promise<SponsoredCampaign[]> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);
      const response = await client.get('/adCampaignsV2', {
        params: {
          q: 'search',
          search: {
            account: `urn:li:sponsoredAccount:${accountId}`,
          },
          projection: '(elements*(id,account,name,status,runSchedule,dailyBudget,totalBudget,format))',
        },
      });
      return response.data.elements || [];
    }, 3, tenantId);
  }

  // Update campaign
  async updateCampaign(tenantId: string, campaignId: string, updates: Partial<SponsoredCampaign>): Promise<SponsoredCampaign> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);

      const patchData: Record<string, unknown> = {};
      if (updates.name !== undefined) patchData.name = updates.name;
      if (updates.status !== undefined) patchData.status = updates.status;
      if (updates.runSchedule !== undefined) patchData.runSchedule = updates.runSchedule;
      if (updates.dailyBudget !== undefined) patchData.dailyBudget = updates.dailyBudget;
      if (updates.totalBudget !== undefined) patchData.totalBudget = updates.totalBudget;
      if (updates.targeting !== undefined) patchData.targeting = this.transformTargeting(updates.targeting);

      await client.post(`/adCampaignsV2/${campaignId}`, { patch: patchData });
      logger.info('LinkedIn campaign updated', { campaignId, tenantId });

      return this.getCampaign(tenantId, campaignId);
    }, 3, tenantId);
  }

  // Archive campaign
  async archiveCampaign(tenantId: string, campaignId: string): Promise<boolean> {
    try {
      await this.updateCampaign(tenantId, campaignId, { status: 'ARCHIVED' });
      logger.info('LinkedIn campaign archived', { campaignId, tenantId });
      return true;
    } catch (error) {
      logger.error('Failed to archive campaign', { campaignId, error });
      return false;
    }
  }

  // Create sponsored creative
  async createCreative(tenantId: string, creativeData: Partial<SponsoredCreative> & { campaign: string }): Promise<SponsoredCreative> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);

      // Map campaign string to URN format
      const campaignUrn = creativeData.campaign.startsWith('urn:')
        ? creativeData.campaign
        : `urn:li:sponsoredCampaign:${creativeData.campaign}`;

      const response = await client.post('/adCreativesV2', {
        name: creativeData.name || `Creative ${Date.now()}`,
        campaign: campaignUrn,
        type: creativeData.type || 'TEXT_AD',
        status: creativeData.status || 'ACTIVE',
        variables: creativeData.variables || {},
        content: creativeData.content,
      });

      const creativeId = response.data.id;
      logger.info('LinkedIn creative created', { creativeId, tenantId });

      // Destructure to avoid duplicate campaign property
      const { campaign: _campaign, ...restCreativeData } = creativeData;

      return {
        id: creativeId,
        campaign: campaignUrn,
        ...restCreativeData,
      } as SponsoredCreative;
    }, 3, tenantId);
  }

  // Get creative
  async getCreative(tenantId: string, creativeId: string): Promise<SponsoredCreative> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);
      const response = await client.get(`/adCreativesV2/${creativeId}`, {
        params: {
          projection: '(id,name,campaign,status,type,content,variables)',
        },
      });
      return response.data;
    }, 3, tenantId);
  }

  // Create lead gen form
  async createLeadGenForm(tenantId: string, organizationId: string, formData: LeadGenFormCreate): Promise<LeadGenForm> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);

      // Transform form data to LinkedIn API format
      const linkedinFormData = {
        name: formData.name,
        configuration: {
          headline: formData.title || formData.name,
          description: formData.description || '',
          customGreeting: formData.customGreeting,
          customGreetingFields: formData.customGreetingFields,
          privacyPolicyUrl: formData.privacyPolicyUrl,
          includeCompanyBranding: formData.includeCompanyBranding ?? true,
          fields: formData.fields.map(field => ({
            name: field.name,
            type: field.type,
            required: field.isRequired,
            label: field.label,
          })),
        },
        author: `urn:li:organization:${organizationId}`,
      };

      const response = await client.post('/leadGenForms', linkedinFormData);

      const formId = response.data.id;
      logger.info('LinkedIn lead gen form created', { formId, organizationId, tenantId });

      return {
        id: formId,
        name: formData.name,
        status: 'ACTIVE',
        leadFormType: 'DEFAULT',
        author: `urn:li:organization:${organizationId}`,
        created: { time: Date.now() },
        updated: { time: Date.now() },
        configuration: {
          headline: formData.title || formData.name,
          description: formData.description || '',
          customGreeting: formData.customGreeting,
          customGreetingFields: formData.customGreetingFields,
          privacyPolicyUrl: formData.privacyPolicyUrl,
          includeCompanyBranding: formData.includeCompanyBranding ?? true,
          fields: formData.fields,
          assets: [],
        },
      };
    }, 3, tenantId);
  }

  // Get lead gen form
  async getLeadGenForm(tenantId: string, formId: string): Promise<LeadGenForm> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);
      const response = await client.get(`/leadGenForms/${formId}`);
      return response.data;
    }, 3, tenantId);
  }

  // Get leads from form
  async getLeads(tenantId: string, formId: string, campaignId?: string): Promise<Lead[]> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);

      const params: Record<string, unknown> = {
        q: 'form',
        form: formId.startsWith('urn:') ? formId : `urn:li:leadGenForm:${formId}`,
      };

      if (campaignId) {
        params.campaign = campaignId.startsWith('urn:')
          ? campaignId
          : `urn:li:sponsoredCampaign:${campaignId}`;
      }

      const response = await client.get('/leadGenLeads', {
        params,
        headers: {
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      return response.data.elements || [];
    }, 3, tenantId);
  }

  // Get campaign analytics
  async getCampaignAnalytics(tenantId: string, request: AnalyticsRequest): Promise<CampaignAnalytics[]> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(tenantId);

      // Map campaign IDs to URNs
      const campaignUrns = request.campaigns.map(id =>
        id.startsWith('urn:') ? id : `urn:li:sponsoredCampaign:${id}`
      );

      // Map field names to LinkedIn analytics field format
      const fieldMapping: Record<string, string> = {
        impressions: 'impressionCount',
        clicks: 'clickCount',
        ctr: 'ctr',
        cpc: 'costInLocalCurrency',
        cpm: 'costInLocalCurrency',
        spend: 'totalSpend',
        conversions: 'conversionCount',
        leads: 'leadGenerationMailInterestedClicks',
      };

      const analyticsFields = (request.fields || []).map(f => fieldMapping[f] || f);

      const response = await client.post('/adAnalyticsV2', {
        campaigns: campaignUrns,
        dateRange: request.dateRange,
        timeGranularity: request.timeGranularity || 'SUMMARY',
        fields: analyticsFields,
      });

      const elements = response.data.elements || [];
      return elements.map((element: Record<string, unknown>) => ({
        campaign: (element.campaign as string)?.split(':').pop() || '',
        impressions: (element.impressionCount as number) || 0,
        clicks: (element.clickCount as number) || 0,
        ctr: (element.ctr as number) || 0,
        cpc: (element.costInLocalCurrency as number) || 0,
        cpm: (element.costInLocalCurrency as number) || 0,
        spend: (element.totalSpend as number) || 0,
        conversions: (element.conversionCount as number) || 0,
        conversionRate: 0,
        leads: (element.leadGenerationMailInterestedClicks as number) || 0,
        leadgenFormOpens: 0,
        leadgenFormCompletions: 0,
        costPerLeads: 0,
        dateRange: request.dateRange,
      })) as CampaignAnalytics[];
    }, 3, tenantId);
  }

  // Get pinned posts
  async getPinnedPosts(tenantId: string): Promise<LinkedInPost[]> {
    try {
      const client = this.getClient(tenantId);
      const personId = await this.getCurrentUserPersonId(tenantId);

      const response = await client.get(`/people/${personId}/socialAnnotations`, {
        params: {
          type: 'PINNED_POST',
        },
      });
      return response.data.elements || [];
    } catch (error) {
      logger.warn('Failed to get pinned posts', { tenantId, error });
      return [];
    }
  }

  // Disconnect tenant
  disconnectTenant(tenantId: string): void {
    this.tenantTokens.delete(tenantId);
    this.tenantOrganizations.delete(tenantId);
    this.tenantRefreshTokens.delete(tenantId);
    this.rateLimitState.delete(tenantId);
    logger.info('Tenant disconnected', { tenantId });
  }

  // Check if tenant is connected
  isConnected(tenantId: string): boolean {
    return this.tenantTokens.has(tenantId) || !!this.config.accessToken;
  }

  // Get connection status with details
  getConnectionStatus(tenantId: string): {
    connected: boolean;
    hasRefreshToken: boolean;
    isRateLimited: boolean;
    rateLimitReset?: number;
  } {
    return {
      connected: this.isConnected(tenantId),
      hasRefreshToken: this.tenantRefreshTokens.has(tenantId),
      isRateLimited: this.isRateLimited(tenantId),
      rateLimitReset: this.getRateLimitReset(tenantId) ?? undefined,
    };
  }
}

export default new LinkedInService();
