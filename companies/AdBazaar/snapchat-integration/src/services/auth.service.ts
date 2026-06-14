import { SnapchatAdAccount } from '../models/snapchatAdAccount.model.js';
import { snapchatApiService } from './snapchatApi.service.js';
import { generateId } from '../utils/helpers.js';
import { logger } from 'utils/logger.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export interface ConnectAdAccountParams {
  organizationId: string;
  snapchatAccountId: string;
  displayName: string;
  timezone?: string;
  currency?: string;
  accessToken: string;
  refreshToken?: string;
}

class AuthService {
  async initiateOAuthFlow(organizationId: string): Promise<string> {
    const state = generateId('oauth');
    const oauthUrl = await snapchatApiService.getOAuthUrl(state);

    logger.info('OAuth flow initiated', { organizationId, state });

    return oauthUrl;
  }

  async handleOAuthCallback(code: string, organizationId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const tokens = await snapchatApiService.exchangeCodeForTokens(code);

    logger.info('OAuth callback handled', { organizationId });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async connectAdAccount(params: ConnectAdAccountParams): Promise<SnapchatAdAccount> {
    const existing = await SnapchatAdAccount.findOne({
      snapchatAccountId: params.snapchatAccountId,
      organizationId: params.organizationId,
    });

    if (existing) {
      existing.accessToken = params.accessToken;
      existing.refreshToken = params.refreshToken;
      existing.status = 'connected';
      existing.lastSyncAt = new Date();
      await existing.save();

      logger.info('Ad account reconnected', {
        organizationId: params.organizationId,
        snapchatAccountId: params.snapchatAccountId,
      });

      return existing;
    }

    const adAccount = new SnapchatAdAccount({
      id: generateId('adacc'),
      snapchatAccountId: params.snapchatAccountId,
      organizationId: params.organizationId,
      displayName: params.displayName,
      timezone: params.timezone || 'America/Los_Angeles',
      currency: params.currency || 'USD',
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      status: 'connected',
      connectedAt: new Date(),
      lastSyncAt: new Date(),
    });

    await adAccount.save();

    logger.info('Ad account connected', {
      organizationId: params.organizationId,
      snapchatAccountId: params.snapchatAccountId,
    });

    return adAccount;
  }

  async disconnectAdAccount(organizationId: string, snapchatAccountId: string): Promise<void> {
    const adAccount = await SnapchatAdAccount.findOne({
      snapchatAccountId,
      organizationId,
    });

    if (!adAccount) {
      throw new NotFoundError('Ad account not found');
    }

    adAccount.status = 'disconnected';
    adAccount.accessToken = undefined;
    adAccount.refreshToken = undefined;
    await adAccount.save();

    logger.info('Ad account disconnected', { organizationId, snapchatAccountId });
  }

  async getConnectedAccounts(organizationId: string): Promise<SnapchatAdAccount[]> {
    return SnapchatAdAccount.find({
      organizationId,
      status: 'connected',
    });
  }

  async refreshToken(organizationId: string, snapchatAccountId: string): Promise<void> {
    const adAccount = await SnapchatAdAccount.findOne({
      snapchatAccountId,
      organizationId,
    });

    if (!adAccount || !adAccount.refreshToken) {
      throw new NotFoundError('Ad account not found or no refresh token');
    }

    const tokens = await snapchatApiService.refreshAccessToken(adAccount.refreshToken);

    adAccount.accessToken = tokens.accessToken;
    adAccount.refreshToken = tokens.refreshToken;
    adAccount.lastSyncAt = new Date();
    await adAccount.save();

    logger.info('Token refreshed', { organizationId, snapchatAccountId });
  }
}

export const authService = new AuthService();
export default authService;