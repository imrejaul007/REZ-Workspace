import { v4 as uuidv4, v4 as uuid } from 'uuid';
import CryptoJS from 'crypto-js';
import { ApiKey, Permission, OAuthState } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthService');

const API_KEY_PREFIX = 'rzk_';
const API_KEY_LENGTH = 32;

// In-memory storage
const apiKeys: Map<string, ApiKey> = new Map();
const oauthStates: Map<string, OAuthState> = new Map();

export class AuthService {
  generateApiKey(): { key: string; keyPrefix: string } {
    const randomBytes = CryptoJS.lib.WordArray.random(API_KEY_LENGTH);
    const key = `${API_KEY_PREFIX}${randomBytes.toString(CryptoJS.enc.Base64url)}`;
    const keyPrefix = `${API_KEY_PREFIX}${randomBytes.toString(CryptoJS.enc.Base64url).substring(0, 8)}`;
    return { key, keyPrefix };
  }

  async createApiKey(tenantId: string, name: string, permissions: Permission[], expiresAt?: Date): Promise<ApiKey> {
    const { key, keyPrefix } = this.generateApiKey();

    const apiKey: ApiKey = {
      id: uuidv4(),
      tenantId,
      name,
      key,
      keyPrefix,
      permissions,
      expiresAt,
      createdAt: new Date(),
    };

    apiKeys.set(key, apiKey);
    logger.info('API key created', { apiKeyId: apiKey.id, tenantId, name });

    return apiKey;
  }

  async validateApiKey(key: string): Promise<ApiKey | null> {
    const apiKey = apiKeys.get(key);
    if (!apiKey) {
      return null;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      apiKeys.delete(key);
      logger.warn('API key expired', { apiKeyId: apiKey.id });
      return null;
    }

    // Update last used
    apiKey.lastUsed = new Date();
    apiKeys.set(key, apiKey);

    return apiKey;
  }

  async getApiKeyById(tenantId: string, id: string): Promise<ApiKey | null> {
    const apiKey = Array.from(apiKeys.values()).find(
      k => k.id === id && k.tenantId === tenantId
    );
    return apiKey || null;
  }

  async getAllApiKeys(tenantId: string): Promise<ApiKey[]> {
    return Array.from(apiKeys.values())
      .filter(k => k.tenantId === tenantId)
      .map(k => ({ ...k, key: `${k.keyPrefix}...` })); // Mask the key
  }

  async deleteApiKey(tenantId: string, id: string): Promise<boolean> {
    const apiKey = Array.from(apiKeys.values()).find(
      k => k.id === id && k.tenantId === tenantId
    );
    if (!apiKey) {
      return false;
    }

    apiKeys.delete(apiKey.key);
    logger.info('API key deleted', { apiKeyId: id, tenantId });
    return true;
  }

  async hasPermission(apiKey: ApiKey, permission: Permission): Promise<boolean> {
    return apiKey.permissions.includes(permission);
  }

  // OAuth State Management
  createOAuthState(tenantId: string, redirectUri: string): OAuthState {
    const state: OAuthState = {
      tenantId,
      redirectUri,
      state: uuidv4(),
      createdAt: new Date(),
    };

    oauthStates.set(state.state, state);
    return state;
  }

  validateOAuthState(state: string): OAuthState | null {
    const oauthState = oauthStates.get(state);
    if (!oauthState) {
      return null;
    }

    // State expires after 10 minutes
    const expiresAt = new Date(oauthState.createdAt.getTime() + 10 * 60 * 1000);
    if (expiresAt < new Date()) {
      oauthStates.delete(state);
      return null;
    }

    return oauthState;
  }

  consumeOAuthState(state: string): OAuthState | null {
    const oauthState = this.validateOAuthState(state);
    if (oauthState) {
      oauthStates.delete(state);
    }
    return oauthState;
  }

  // Signature verification for webhooks
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = CryptoJS
      .HmacSHA256(payload, secret)
      .toString(CryptoJS.enc.Hex);
    return expectedSignature === signature;
  }

  generateWebhookSignature(payload: string, secret: string): string {
    return CryptoJS
      .HmacSHA256(payload, secret)
      .toString(CryptoJS.enc.Hex);
  }
}

export const authService = new AuthService();
