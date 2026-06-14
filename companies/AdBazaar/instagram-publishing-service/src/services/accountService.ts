import axios from 'axios';
import { InstagramAccount } from '../models/index.js';
import { instagramApiService } from './instagramApiService.js';
import logger from 'utils/logger.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import config from '../config/index.js';

// Types
export interface ConnectAccountInput {
  accountId: string;
  accessToken: string;
  pageId?: string;
}

export interface AccountInfo {
  instagramId: string;
  username: string;
  profilePictureUrl?: string;
  followersCount?: number;
}

// Account Service
export class AccountService {
  /**
   * Connect an Instagram Business account
   */
  async connectAccount(input: ConnectAccountInput): Promise<{ accountId: string; success: boolean }> {
    try {
      // Get page info from Facebook Graph API
      const pageInfo = await this.getFacebookPageInfo(input.accessToken, input.pageId);

      // Get Instagram business account info
      const instagramAccountInfo = await this.getInstagramBusinessAccount(
        input.accessToken,
        input.pageId || pageInfo.id
      );

      // Get Instagram media info
      const instagramMediaInfo = await this.getInstagramMediaInfo(
        input.accessToken,
        instagramAccountInfo.id
      );

      // Create or update account record
      const existingAccount = await InstagramAccount.findByAccount(input.accountId);

      if (existingAccount) {
        existingAccount.instagramId = instagramAccountInfo.id;
        existingAccount.instagramUsername = instagramAccountInfo.username;
        existingAccount.businessAccountId = instagramAccountInfo.id;
        existingAccount.accessToken = input.accessToken;
        existingAccount.pageId = input.pageId || pageInfo.id;
        existingAccount.pageName = pageInfo.name;
        existingAccount.profilePictureUrl = instagramMediaInfo.profilePictureUrl;
        existingAccount.followersCount = instagramMediaInfo.followersCount;
        existingAccount.status = 'active';
        existingAccount.permissions = ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'];
        await existingAccount.save();

        logger.info('Instagram account updated', {
          accountId: input.accountId,
          instagramId: instagramAccountInfo.id,
        });

        return { accountId: existingAccount._id.toString(), success: true };
      }

      const newAccount = new InstagramAccount({
        instagramId: instagramAccountInfo.id,
        instagramUsername: instagramAccountInfo.username,
        accountId: input.accountId,
        businessAccountId: instagramAccountInfo.id,
        accessToken: input.accessToken,
        pageId: input.pageId || pageInfo.id,
        pageName: pageInfo.name,
        profilePictureUrl: instagramMediaInfo.profilePictureUrl,
        followersCount: instagramMediaInfo.followersCount,
        status: 'active',
        permissions: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
      });

      await newAccount.save();

      logger.info('Instagram account connected', {
        accountId: input.accountId,
        instagramId: instagramAccountInfo.id,
      });

      return { accountId: newAccount._id.toString(), success: true };
    } catch (error) {
      logger.error('Failed to connect Instagram account', { error, input });
      throw error;
    }
  }

  /**
   * Disconnect an Instagram account
   */
  async disconnectAccount(accountId: string): Promise<{ success: boolean }> {
    const account = await InstagramAccount.findByAccount(accountId);
    if (!account) {
      throw new NotFoundError('Instagram account');
    }

    account.status = 'inactive';
    await account.save();

    logger.info('Instagram account disconnected', { accountId });
    return { success: true };
  }

  /**
   * Get all connected accounts
   */
  async getAccounts(): Promise<unknown[]> {
    const accounts = await InstagramAccount.find({}).sort({ createdAt: -1 });
    return accounts;
  }

  /**
   * Get account by ID
   */
  async getAccount(accountId: string): Promise<unknown> {
    const account = await InstagramAccount.findByAccount(accountId);
    if (!account) {
      throw new NotFoundError('Instagram account');
    }
    return account;
  }

  /**
   * Sync account data from Instagram
   */
  async syncAccount(accountId: string): Promise<{ account: unknown }> {
    const account = await InstagramAccount.findByAccount(accountId);
    if (!account) {
      throw new NotFoundError('Instagram account');
    }

    try {
      // Get fresh data from Instagram
      const accountInfo = await instagramApiService.getAccountInfo();

      account.instagramUsername = (accountInfo as Record<string, string>).username || account.instagramUsername;
      account.profilePictureUrl = (accountInfo as Record<string, string>).profile_picture_url || account.profilePictureUrl;
      account.followersCount = (accountInfo as Record<string, number>).followers_count || account.followersCount;
      account.recordSync();
      account.status = 'active';

      await account.save();

      logger.info('Account synced', { accountId });
      return { account };
    } catch (error) {
      logger.error('Failed to sync account', { accountId, error });
      account.markAsError(error instanceof Error ? error.message : 'Sync failed');
      await account.save();
      throw error;
    }
  }

  /**
   * Check and refresh expired tokens
   */
  async checkTokenRefresh(): Promise<{ refreshed: number }> {
    const accounts = await InstagramAccount.find({ status: 'active' });
    let refreshed = 0;

    for (const account of accounts) {
      if (account.accessTokenExpiresAt && new Date() >= account.accessTokenExpiresAt) {
        try {
          const newToken = await this.refreshAccessToken(account.accessToken);
          account.accessToken = newToken;
          account.status = 'active';
          await account.save();
          refreshed++;
          logger.info('Token refreshed', { accountId: account.accountId });
        } catch (error) {
          logger.error('Failed to refresh token', { accountId: account.accountId, error });
          account.markAsExpired();
          await account.save();
        }
      }
    }

    return { refreshed };
  }

  /**
   * Get Facebook page info
   */
  private async getFacebookPageInfo(accessToken: string, pageId?: string): Promise<{ id: string; name: string }> {
    try {
      // If pageId is provided, get that specific page
      if (pageId) {
        const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
          params: {
            fields: 'id,name',
            access_token: accessToken,
          },
        });
        return response.data;
      }

      // Otherwise, get the first page
      const response = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
        params: {
          access_token: accessToken,
        },
      });

      const pages = response.data.data;
      if (!pages || pages.length === 0) {
        throw new Error('No Facebook pages found');
      }

      return pages[0];
    } catch (error) {
      logger.error('Failed to get Facebook page info', { error });
      throw new Error('Failed to get Facebook page info');
    }
  }

  /**
   * Get Instagram business account from Facebook page
   */
  private async getInstagramBusinessAccount(
    accessToken: string,
    pageId: string
  ): Promise<{ id: string; username: string }> {
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
        params: {
          fields: 'instagram_business_account{id,username}',
          access_token: accessToken,
        },
      });

      const instagramAccount = response.data.instagram_business_account;
      if (!instagramAccount) {
        throw new Error('No Instagram business account linked to this page');
      }

      return {
        id: instagramAccount.id,
        username: instagramAccount.username,
      };
    } catch (error) {
      logger.error('Failed to get Instagram business account', { error });
      throw new Error('Failed to get Instagram business account');
    }
  }

  /**
   * Get Instagram account media info
   */
  private async getInstagramMediaInfo(
    accessToken: string,
    instagramAccountId: string
  ): Promise<{ profilePictureUrl?: string; followersCount?: number }> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${instagramAccountId}`,
        {
          params: {
            fields: 'profile_picture_url,followers_count',
            access_token: accessToken,
          },
        }
      );

      return {
        profilePictureUrl: response.data.profile_picture_url,
        followersCount: response.data.followers_count,
      };
    } catch (error) {
      logger.warn('Failed to get Instagram media info', { error });
      return {};
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(currentToken: string): Promise<string> {
    try {
      const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: config.instagram.appId,
          client_secret: config.instagram.appSecret,
          fb_exchange_token: currentToken,
        },
      });

      return response.data.access_token;
    } catch (error) {
      logger.error('Failed to refresh access token', { error });
      throw new Error('Failed to refresh access token');
    }
  }
}

// Export singleton instance
export const accountService = new AccountService();
export default accountService;