// ============================================================================
// SUTAR Gateway - OAuth Integration
// External authentication provider integration
// ============================================================================

import { randomBytes, createHmac } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type {
  OAuthProvider,
  OAuthToken,
  OAuthUserInfo,
  ApiResponse,
} from '../types/index.js';

export interface OAuthConfig {
  providers: Map<string, OAuthProvider>;
  defaultScopes: string[];
  tokenRefreshThreshold: number;
}

export interface OAuthCallbackRequest {
  code: string;
  state: string;
  provider: string;
}

export interface OAuthState {
  redirectUri: string;
  scopes: string[];
  provider: string;
  createdAt: string;
}

export interface AuthorizationUrlParams {
  provider: string;
  redirectUri: string;
  scopes?: string[];
  state?: string;
}

export class OAuthService {
  private providers: Map<string, OAuthProvider> = new Map();
  private states: Map<string, OAuthState> = new Map();
  private tokens: Map<string, OAuthToken> = new Map(); // userId:provider -> token
  private defaultScopes: string[];
  private tokenRefreshThreshold: number;
  private listeners: Set<(event: OAuthEvent) => void> = new Set();

  constructor(defaultScopes: string[] = ['openid', 'profile', 'email']) {
    this.defaultScopes = defaultScopes;
    this.tokenRefreshThreshold = 300; // 5 minutes before expiry
    this.initializeDefaultProviders();
  }

  // ---------------------------------------------------------------------------
  // Provider Management
  // ---------------------------------------------------------------------------

  private initializeDefaultProviders(): void {
    // Google OAuth
    this.registerProvider({
      id: 'google',
      name: 'Google',
      type: 'google',
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
      scopes: ['openid', 'email', 'profile'],
      redirectUri: process.env.OAUTH_REDIRECT_URI ?? 'http://localhost:4140/api/v1/oauth/callback',
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    });

    // GitHub OAuth
    this.registerProvider({
      id: 'github',
      name: 'GitHub',
      type: 'github',
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      scopes: ['read:user', 'user:email'],
      redirectUri: process.env.OAUTH_REDIRECT_URI ?? 'http://localhost:4140/api/v1/oauth/callback',
      enabled: !!process.env.GITHUB_CLIENT_ID,
    });

    // Microsoft OAuth
    this.registerProvider({
      id: 'microsoft',
      name: 'Microsoft',
      type: 'microsoft',
      clientId: process.env.MICROSOFT_CLIENT_ID ?? '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? '',
      authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
      scopes: ['openid', 'email', 'profile'],
      redirectUri: process.env.OAUTH_REDIRECT_URI ?? 'http://localhost:4140/api/v1/oauth/callback',
      enabled: !!process.env.MICROSOFT_CLIENT_ID,
    });
  }

  registerProvider(provider: OAuthProvider): ApiResponse<OAuthProvider> {
    if (this.providers.has(provider.id)) {
      return this.errorResponse('Provider already registered');
    }

    this.providers.set(provider.id, provider);
    this.emit({
      type: 'provider_registered',
      providerId: provider.id,
      timestamp: new Date().toISOString(),
    });

    return this.successResponse(provider, 'Provider registered successfully');
  }

  updateProvider(providerId: string, updates: Partial<OAuthProvider>): ApiResponse<OAuthProvider> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return this.errorResponse('Provider not found');
    }

    const updated = { ...provider, ...updates, id: providerId };
    this.providers.set(providerId, updated);

    return this.successResponse(updated, 'Provider updated successfully');
  }

  removeProvider(providerId: string): ApiResponse<{ providerId: string }> {
    if (!this.providers.has(providerId)) {
      return this.errorResponse('Provider not found');
    }

    this.providers.delete(providerId);
    return this.successResponse({ providerId }, 'Provider removed successfully');
  }

  getProvider(providerId: string): ApiResponse<OAuthProvider | null> {
    const provider = this.providers.get(providerId);
    return this.successResponse(provider ?? null);
  }

  listProviders(): ApiResponse<OAuthProvider[]> {
    const providers = Array.from(this.providers.values());
    return this.successResponse(providers);
  }

  // ---------------------------------------------------------------------------
  // Authorization URL Generation
  // ---------------------------------------------------------------------------

  generateAuthorizationUrl(params: AuthorizationUrlParams): ApiResponse<{
    url: string;
    state: string;
  }> {
    const provider = this.providers.get(params.provider);
    if (!provider) {
      return this.errorResponse('Provider not found');
    }

    if (!provider.enabled) {
      return this.errorResponse('Provider is not enabled');
    }

    // Generate state for CSRF protection
    const state = params.state ?? randomBytes(16).toString('hex');

    // Store state
    this.states.set(state, {
      redirectUri: params.redirectUri,
      scopes: params.scopes ?? provider.scopes,
      provider: params.provider,
      createdAt: new Date().toISOString(),
    });

    // Clean up old states
    this.cleanupStates();

    // Build authorization URL
    const scopes = (params.scopes ?? provider.scopes).join(' ');
    const url = new URL(provider.authorizationUrl);
    url.searchParams.set('client_id', provider.clientId);
    url.searchParams.set('redirect_uri', provider.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scopes);
    url.searchParams.set('state', state);

    return this.successResponse({
      url: url.toString(),
      state,
    });
  }

  // ---------------------------------------------------------------------------
  // Token Exchange
  // ---------------------------------------------------------------------------

  async exchangeCode(request: OAuthCallbackRequest): ApiResponse<{
    token: OAuthToken;
    userInfo: OAuthUserInfo;
  }> {
    const state = this.states.get(request.state);
    if (!state) {
      return this.errorResponse('Invalid or expired state');
    }

    const provider = this.providers.get(state.provider);
    if (!provider) {
      return this.errorResponse('Provider not found');
    }

    // Delete the state
    this.states.delete(request.state);

    try {
      // Exchange code for token
      const tokenResponse = await this.fetchToken(provider, request.code, state.redirectUri);

      // Get user info
      const userInfo = await this.fetchUserInfo(provider, tokenResponse.accessToken);

      // Store token
      const token: OAuthToken = {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        tokenType: tokenResponse.tokenType ?? 'Bearer',
        expiresIn: tokenResponse.expiresIn,
        scope: tokenResponse.scope,
        expiresAt: new Date(Date.now() + (tokenResponse.expiresIn * 1000)),
      };

      const tokenKey = `${userInfo.id}:${provider.id}`;
      this.tokens.set(tokenKey, token);

      this.emit({
        type: 'token_exchanged',
        provider: provider.id,
        userId: userInfo.id,
        timestamp: new Date().toISOString(),
      });

      return this.successResponse({ token, userInfo });
    } catch (error) {
      return this.errorResponse(
        error instanceof Error ? error.message : 'Token exchange failed'
      );
    }
  }

  private async fetchToken(
    provider: OAuthProvider,
    code: string,
    redirectUri: string
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn: number;
    scope: string;
  }> {
    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token fetch failed: ${error}`);
    }

    return response.json();
  }

  private async fetchUserInfo(
    provider: OAuthProvider,
    accessToken: string
  ): Promise<OAuthUserInfo> {
    const response = await fetch(provider.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();

    // Normalize user info based on provider
    return this.normalizeUserInfo(provider.type, data);
  }

  private normalizeUserInfo(
    providerType: OAuthProvider['type'],
    data: Record<string, unknown>
  ): OAuthUserInfo {
    switch (providerType) {
      case 'google':
        return {
          id: String(data.sub ?? data.id),
          provider: 'google',
          email: data.email as string,
          name: data.name as string,
          picture: data.picture as string,
          metadata: data,
        };

      case 'github':
        return {
          id: String(data.id),
          provider: 'github',
          email: (data.email as string) ?? undefined,
          name: (data.name as string) ?? (data.login as string),
          picture: data.avatar_url as string,
          metadata: data,
        };

      case 'microsoft':
        return {
          id: String(data.id),
          provider: 'microsoft',
          email: data.userPrincipalName as string,
          name: data.displayName as string,
          picture: undefined,
          metadata: data,
        };

      default:
        return {
          id: String(data.id ?? data.sub ?? uuidv4()),
          provider: providerType,
          email: data.email as string,
          name: data.name as string,
          picture: data.picture as string,
          metadata: data,
        };
    }
  }

  // ---------------------------------------------------------------------------
  // Token Refresh
  // ---------------------------------------------------------------------------

  async refreshToken(userId: string, providerId: string): ApiResponse<OAuthToken> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return this.errorResponse('Provider not found');
    }

    const tokenKey = `${userId}:${providerId}`;
    const existingToken = this.tokens.get(tokenKey);

    if (!existingToken?.refreshToken) {
      return this.errorResponse('No refresh token available');
    }

    try {
      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          client_id: provider.clientId,
          client_secret: provider.clientSecret,
          refresh_token: existingToken.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      const newToken: OAuthToken = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? existingToken.refreshToken,
        tokenType: data.token_type ?? 'Bearer',
        expiresIn: data.expires_in,
        scope: data.scope ?? existingToken.scope,
        expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
      };

      this.tokens.set(tokenKey, newToken);

      return this.successResponse(newToken, 'Token refreshed successfully');
    } catch (error) {
      return this.errorResponse(
        error instanceof Error ? error.message : 'Token refresh failed'
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Token Validation
  // ---------------------------------------------------------------------------

  getToken(userId: string, providerId: string): ApiResponse<OAuthToken | null> {
    const tokenKey = `${userId}:${providerId}`;
    const token = this.tokens.get(tokenKey);

    if (!token) {
      return this.successResponse(null);
    }

    // Check if token needs refresh
    const timeUntilExpiry = token.expiresAt.getTime() - Date.now();
    if (timeUntilExpiry < this.tokenRefreshThreshold * 1000) {
      // Token is expiring soon
      return this.successResponse({ ...token, expiresAt: token.expiresAt });
    }

    return this.successResponse(token);
  }

  isTokenValid(userId: string, providerId: string): boolean {
    const tokenKey = `${userId}:${providerId}`;
    const token = this.tokens.get(tokenKey);

    if (!token) return false;

    return Date.now() < token.expiresAt.getTime();
  }

  revokeToken(userId: string, providerId: string): ApiResponse<{ revoked: boolean }> {
    const tokenKey = `${userId}:${providerId}`;
    const deleted = this.tokens.delete(tokenKey);

    this.emit({
      type: 'token_revoked',
      provider: providerId,
      userId,
      timestamp: new Date().toISOString(),
    });

    return this.successResponse({ revoked: deleted });
  }

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  private cleanupStates(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [state, data] of this.states) {
      const createdAt = new Date(data.createdAt).getTime();
      if (now - createdAt > maxAge) {
        this.states.delete(state);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Event System
  // ---------------------------------------------------------------------------

  onEvent(listener: (event: OAuthEvent) => void): void {
    this.listeners.add(listener);
  }

  offEvent(listener: (event: OAuthEvent) => void): void {
    this.listeners.delete(listener);
  }

  private emit(event: OAuthEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[OAuth] Event listener error:', error);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private successResponse<T>(data: T, message?: string): ApiResponse<T> {
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  private errorResponse<T>(error: string): ApiResponse<T> {
    return { success: false, error, timestamp: new Date().toISOString() };
  }

  getStats(): {
    providers: number;
    enabledProviders: number;
    tokens: number;
    states: number;
  } {
    let enabled = 0;
    for (const provider of this.providers.values()) {
      if (provider.enabled) enabled++;
    }

    return {
      providers: this.providers.size,
      enabledProviders: enabled,
      tokens: this.tokens.size,
      states: this.states.size,
    };
  }
}

// ============================================================================
// Types and Singleton
// ============================================================================

export interface OAuthEvent {
  type: 'provider_registered' | 'token_exchanged' | 'token_revoked' | 'token_refreshed';
  provider?: string;
  userId?: string;
  providerId?: string;
  timestamp: string;
}

export const oauthService = new OAuthService();
