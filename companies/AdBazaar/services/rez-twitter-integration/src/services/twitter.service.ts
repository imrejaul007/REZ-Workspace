import { TwitterApi } from 'twitter-api-v2';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import {
  TwitterConfig,
  TwitterOAuthToken,
  TwitterUser,
  Tweet,
  CreateTweetRequest,
  ThreadRequest,
  ScheduledTweet,
  Mention,
  AnalyticsData,
  OAuthState,
} from '../types';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RequestRecord {
  count: number;
  resetAt: number;
}

export class TwitterService {
  private config: TwitterConfig;
  private oauthStates: Map<string, OAuthState> = new Map();
  private tenantClients: Map<string, TwitterApi> = new Map();
  private scheduledTweets: Map<string, ScheduledTweet> = new Map();
  private requestHistory: Map<string, RequestRecord> = new Map();

  private readonly rateLimitConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000,
    maxRequests: 180,
  };

  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  };

  constructor() {
    this.config = {
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      callbackUrl: process.env.TWITTER_CALLBACK_URL || 'http://localhost:4780/auth/callback',
    };

    setInterval(() => this.cleanupExpiredStates(), 3600000);
    setInterval(() => this.cleanupOldScheduledTweets(), 3600000);
  }

  private validateCredentials(): void {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Twitter OAuth credentials (clientId, clientSecret) are required');
    }
  }

  private checkRateLimit(tenantId: string): boolean {
    const now = Date.now();
    const record = this.requestHistory.get(tenantId);

    if (!record || record.resetAt < now) {
      this.requestHistory.set(tenantId, {
        count: 1,
        resetAt: now + this.rateLimitConfig.windowMs,
      });
      return true;
    }

    if (record.count >= this.rateLimitConfig.maxRequests) {
      logger.warn('Rate limit exceeded', { tenantId, resetAt: new Date(record.resetAt) });
      return false;
    }

    record.count++;
    return true;
  }

  private calculateBackoffDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt),
      this.retryConfig.maxDelay
    );
    return delay + Math.random() * 1000;
  }

  private async executeWithRetry<T>(
    tenantId: string,
    requestFn: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    if (!this.checkRateLimit(tenantId)) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;

        if (this.isNonRetryableError(error)) {
          throw error;
        }

        if (attempt < this.retryConfig.maxRetries - 1) {
          const delay = this.calculateBackoffDelay(attempt);
          logger.warn(`Retrying ${operationName}`, {
            attempt: attempt + 1,
            maxRetries: this.retryConfig.maxRetries,
            delayMs: delay,
            error: lastError.message,
          });
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error(`${operationName} failed after ${this.retryConfig.maxRetries} attempts`);
  }

  private isNonRetryableError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status;
      if (status >= 400 && status < 500 && status !== 429) {
        return true;
      }
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateOAuthUrl(tenantId: string, redirectUri?: string): string {
    this.validateCredentials();

    const codeVerifier = crypto.randomBytes(64).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    const state = uuidv4();
    const callbackUrl = redirectUri || this.config.callbackUrl;

    this.oauthStates.set(state, {
      tenantId,
      redirectUri: callbackUrl,
      codeVerifier,
      createdAt: new Date(),
    });

    const scopes = [
      'tweet.read',
      'tweet.write',
      'users.read',
      'offline.access',
      'follows.read',
      'follows.write',
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: callbackUrl,
      scope: scopes,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, state: string): Promise<TwitterOAuthToken> {
    const oauthState = this.oauthStates.get(state);
    if (!oauthState) {
      throw new Error('Invalid or expired OAuth state');
    }

    this.validateCredentials();

    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: oauthState.redirectUri,
        client_id: this.config.clientId,
        code_verifier: oauthState.codeVerifier,
      });

      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${this.config.clientId}:${this.config.clientSecret}`
          ).toString('base64')}`,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        logger.error('Token exchange failed', { status: response.status, error: errorData });
        throw new Error(`Token exchange failed: ${(errorData.error_description as string) || response.statusText}`);
      }

      const tokenData = (await response.json()) as Record<string, unknown>;
      const oauthToken: TwitterOAuthToken = {
        access_token: tokenData.access_token as string,
        refresh_token: tokenData.refresh_token as string | undefined,
        token_type: tokenData.token_type as string,
        expires_in: tokenData.expires_in as number,
        scope: tokenData.scope as string,
        expires_at: Date.now() + (tokenData.expires_in as number) * 1000,
      };

      const twitterClient = new TwitterApi(oauthToken.access_token);
      this.tenantClients.set(oauthState.tenantId, twitterClient);

      this.oauthStates.delete(state);
      return oauthToken;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to exchange code for token', { error: errorMessage });
      throw new Error(`Failed to authenticate with Twitter: ${errorMessage}`);
    }
  }

  async refreshAccessToken(refreshToken: string, tenantId: string): Promise<TwitterOAuthToken> {
    this.validateCredentials();

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
    });

    try {
      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${this.config.clientId}:${this.config.clientSecret}`
          ).toString('base64')}`,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        throw new Error(`Token refresh failed: ${(errorData.error_description as string) || response.statusText}`);
      }

      const tokenData = (await response.json()) as Record<string, unknown>;
      const oauthToken: TwitterOAuthToken = {
        access_token: tokenData.access_token as string,
        refresh_token: tokenData.refresh_token as string | undefined,
        token_type: tokenData.token_type as string,
        expires_in: tokenData.expires_in as number,
        scope: tokenData.scope as string,
        expires_at: Date.now() + (tokenData.expires_in as number) * 1000,
      };

      const twitterClient = new TwitterApi(oauthToken.access_token);
      this.tenantClients.set(tenantId, twitterClient);

      return oauthToken;
    } catch (error) {
      logger.error('Failed to refresh token', { error });
      throw new Error('Failed to refresh Twitter access token');
    }
  }

  private getClient(tenantId: string): TwitterApi {
    const client = this.tenantClients.get(tenantId);
    if (!client) {
      throw new Error('No access token found for tenant. Please authenticate first.');
    }
    return client;
  }

  setAccessToken(tenantId: string, accessToken: string, refreshToken?: string): void {
    const client = new TwitterApi(accessToken);
    this.tenantClients.set(tenantId, client);
    logger.info('Access token set for tenant', { tenantId });
  }

  async getCurrentUser(tenantId: string): Promise<TwitterUser> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const user = await client.v2.me({
        'user.fields': [
          'created_at',
          'description',
          'entities',
          'location',
          'pinned_tweet_id',
          'profile_image_url',
          'protected',
          'public_metrics',
          'url',
          'verified',
          'verified_type',
        ].join(','),
      });

      if (!user.data) {
        throw new Error('Failed to fetch user data');
      }

      return user.data as unknown as TwitterUser;
    }, 'getCurrentUser');
  }

  async getUserById(tenantId: string, userId: string): Promise<TwitterUser> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const user = await client.v2.user(userId, {
        'user.fields': [
          'created_at',
          'description',
          'entities',
          'location',
          'pinned_tweet_id',
          'profile_image_url',
          'protected',
          'public_metrics',
          'url',
          'verified',
          'verified_type',
        ].join(','),
      });

      if (!user.data) {
        throw new Error('User not found');
      }

      return user.data as unknown as TwitterUser;
    }, 'getUserById');
  }

  async getUserByUsername(tenantId: string, username: string): Promise<TwitterUser> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const user = await client.v2.userByUsername(username, {
        'user.fields': [
          'created_at',
          'description',
          'entities',
          'location',
          'pinned_tweet_id',
          'profile_image_url',
          'protected',
          'public_metrics',
          'url',
          'verified',
          'verified_type',
        ].join(','),
      });

      if (!user.data) {
        throw new Error('User not found');
      }

      return user.data as unknown as TwitterUser;
    }, 'getUserByUsername');
  }

  async createTweet(tenantId: string, tweetData: CreateTweetRequest): Promise<Tweet> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);

      const payload: Record<string, unknown> = {
        text: tweetData.text,
      };

      if (tweetData.reply) {
        payload.reply = {
          in_reply_to_tweet_id: tweetData.reply.in_reply_to_tweet_id,
          exclude_reply_user_ids: tweetData.reply.exclude_reply_user_ids,
        };
      }

      if (tweetData.quote_tweet_id) {
        payload.quote_tweet_id = tweetData.quote_tweet_id;
      }

      if (tweetData.media?.media_ids) {
        payload.media = {
          media_ids: tweetData.media.media_ids,
          tagged_user_ids: tweetData.media.tagged_user_ids,
        };
      }

      if (tweetData.poll?.options) {
        payload.poll = {
          duration_minutes: tweetData.poll.duration_minutes,
          options: tweetData.poll.options,
        };
      }

      if (tweetData.geo?.place_id) {
        payload.geo = { place_id: tweetData.geo.place_id };
      }

      if (tweetData.reply_settings) {
        payload.reply_settings = tweetData.reply_settings;
      }

      if (tweetData.super_followers_only) {
        payload.super_followers_only = tweetData.super_followers_only;
      }

      const result = await client.v2.tweet(payload.text as string, payload as Record<string, unknown>);

      if (!result.data) {
        throw new Error('Failed to create tweet');
      }

      logger.info('Tweet created', { tweetId: result.data.id, tenantId });
      return result.data as unknown as Tweet;
    }, 'createTweet');
  }

  async createThread(tenantId: string, threadData: ThreadRequest): Promise<Tweet[]> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const tweets: Tweet[] = [];

      const firstPayload: Record<string, unknown> = { text: threadData.tweets[0].text };
      if (threadData.tweets[0].media?.media_ids) {
        firstPayload.media = { media_ids: threadData.tweets[0].media.media_ids };
      }

      let result = await client.v2.tweet(
        firstPayload.text as string,
        firstPayload as Record<string, unknown>
      );

      if (!result.data) {
        throw new Error('Failed to create first tweet in thread');
      }
      tweets.push(result.data as unknown as Tweet);

      for (let i = 1; i < threadData.tweets.length; i++) {
        const tweet = threadData.tweets[i];
        const payload: Record<string, unknown> = {
          text: tweet.text,
          reply: {
            in_reply_to_tweet_id: tweets[i - 1].id,
          },
        };

        if (tweet.media?.media_ids) {
          payload.media = { media_ids: tweet.media.media_ids };
        }

        result = await client.v2.tweet(
          payload.text as string,
          payload as Record<string, unknown>
        );

        if (!result.data) {
          throw new Error(`Failed to create tweet ${i + 1} in thread`);
        }
        tweets.push(result.data as unknown as Tweet);
      }

      logger.info('Thread created', { tweetCount: tweets.length, tenantId });
      return tweets;
    }, 'createThread');
  }

  async quoteTweet(tenantId: string, tweetId: string, text?: string): Promise<Tweet> {
    return this.createTweet(tenantId, {
      text: text || '',
      quote_tweet_id: tweetId,
    });
  }

  async uploadMedia(
    tenantId: string,
    mediaData: Buffer,
    mimeType: string,
    _altText?: string
  ): Promise<{ media_id: string; media_key: string }> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);

      const result = await client.v1.uploadMedia(mediaData, { mimeType });

      // Note: Alt text requires additional API call - not directly supported by twitter-api-v2
      const mediaId = typeof result === 'string' ? result : String(result);

      logger.info('Media uploaded', { mediaId, tenantId });
      return {
        media_id: mediaId,
        media_key: `media_${mediaId}`,
      };
    }, 'uploadMedia');
  }

  async getTweet(tenantId: string, tweetId: string): Promise<Tweet> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const result = await client.v2.singleTweet(tweetId, {
        'tweet.fields': [
          'attachments',
          'author_id',
          'context_annotations',
          'conversation_id',
          'created_at',
          'edit_controls',
          'entities',
          'geo',
          'id',
          'in_reply_to_user_id',
          'non_public_metrics',
          'organic_metrics',
          'possibly_sensitive',
          'promoted_metrics',
          'public_metrics',
          'referenced_tweets',
          'reply_settings',
          'source',
          'text',
          'withheld',
        ].join(','),
        expansions: [
          'author_id',
          'attachments.media_keys',
          'in_reply_to_user_id',
          'referenced_tweets.id',
          'referenced_tweets.id.author_id',
        ].join(','),
        'user.fields': [
          'created_at',
          'description',
          'entities',
          'location',
          'pinned_tweet_id',
          'profile_image_url',
          'protected',
          'public_metrics',
          'url',
          'username',
          'verified',
          'verified_type',
        ].join(','),
        'media.fields': [
          'duration_ms',
          'height',
          'media_key',
          'non_political_content',
          'preview_image_url',
          'type',
          'url',
          'width',
          'alt_text',
          'possibly_sensitive',
        ].join(','),
      });

      if (!result.data) {
        throw new Error('Tweet not found');
      }

      return result.data as unknown as Tweet;
    }, 'getTweet');
  }

  async deleteTweet(tenantId: string, tweetId: string): Promise<boolean> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      await client.v2.deleteTweet(tweetId);
      logger.info('Tweet deleted', { tweetId, tenantId });
      return true;
    }, 'deleteTweet');
  }

  async getMentions(tenantId: string, options?: {
    maxResults?: number;
    startTime?: string;
    endTime?: string;
    paginationToken?: string;
  }): Promise<{ mentions: Mention[]; meta?: { next_token?: string; result_count?: number } }> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const user = await this.getCurrentUser(tenantId);

      const result = await client.v2.userMentionTimeline(user.id, {
        'tweet.fields': [
          'attachments',
          'author_id',
          'context_annotations',
          'conversation_id',
          'created_at',
          'entities',
          'geo',
          'id',
          'in_reply_to_user_id',
          'public_metrics',
          'referenced_tweets',
          'reply_settings',
          'source',
          'text',
        ].join(','),
        expansions: ['author_id'],
        'user.fields': [
          'created_at',
          'description',
          'entities',
          'location',
          'name',
          'pinned_tweet_id',
          'profile_image_url',
          'protected',
          'public_metrics',
          'url',
          'username',
          'verified',
        ].join(','),
        max_results: options?.maxResults || 100,
        start_time: options?.startTime,
        end_time: options?.endTime,
        pagination_token: options?.paginationToken,
      });

      const mentions: Mention[] = (result.data?.data || []).map((tweet) => {
        const author = result.data?.includes?.users?.find(
          (u) => u.id === tweet.author_id
        );
        return {
          ...(tweet as unknown as Record<string, unknown>),
          author,
        };
      }) as Mention[];

      return {
        mentions,
        meta: result.data?.meta,
      };
    }, 'getMentions');
  }

  async getReplies(tenantId: string, tweetId: string): Promise<Mention[]> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);

      const result = await client.v2.search({
        query: `conversation_id:${tweetId} -from:${tweetId}`,
        'tweet.fields': [
          'attachments',
          'author_id',
          'context_annotations',
          'conversation_id',
          'created_at',
          'entities',
          'geo',
          'id',
          'in_reply_to_user_id',
          'public_metrics',
          'referenced_tweets',
          'reply_settings',
          'source',
          'text',
        ].join(','),
        expansions: ['author_id'],
        'user.fields': [
          'created_at',
          'description',
          'entities',
          'location',
          'name',
          'pinned_tweet_id',
          'profile_image_url',
          'protected',
          'public_metrics',
          'url',
          'username',
          'verified',
        ].join(','),
        max_results: 100,
      });

      return ((result.data?.data || []) as unknown as Array<Record<string, unknown>>).map((tweet) => {
        const author = result.data?.includes?.users?.find(
          (u) => u.id === tweet.author_id
        );
        return {
          ...tweet,
          author,
        };
      }) as Mention[];
    }, 'getReplies');
  }

  async retweet(tenantId: string, tweetId: string): Promise<boolean> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const user = await this.getCurrentUser(tenantId);
      await client.v2.retweet(user.id, tweetId);
      logger.info('Tweet retweeted', { tweetId, tenantId });
      return true;
    }, 'retweet');
  }

  async unretweet(tenantId: string, tweetId: string): Promise<boolean> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const user = await this.getCurrentUser(tenantId);
      await client.v2.unretweet(user.id, tweetId);
      logger.info('Tweet unretweeted', { tweetId, tenantId });
      return true;
    }, 'unretweet');
  }

  async likeTweet(tenantId: string, tweetId: string): Promise<boolean> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const user = await this.getCurrentUser(tenantId);
      await client.v2.like(user.id, tweetId);
      logger.info('Tweet liked', { tweetId, tenantId });
      return true;
    }, 'likeTweet');
  }

  async unlikeTweet(tenantId: string, tweetId: string): Promise<boolean> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const user = await this.getCurrentUser(tenantId);
      await client.v2.unlike(user.id, tweetId);
      logger.info('Tweet unliked', { tweetId, tenantId });
      return true;
    }, 'unlikeTweet');
  }

  async followUser(tenantId: string, targetUserId: string): Promise<boolean> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const user = await this.getCurrentUser(tenantId);
      await client.v2.follow(user.id, targetUserId);
      logger.info('User followed', { targetUserId, tenantId });
      return true;
    }, 'followUser');
  }

  async unfollowUser(tenantId: string, targetUserId: string): Promise<boolean> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const user = await this.getCurrentUser(tenantId);
      await client.v2.unfollow(user.id, targetUserId);
      logger.info('User unfollowed', { targetUserId, tenantId });
      return true;
    }, 'unfollowUser');
  }

  async getFollowers(tenantId: string, userId?: string, options?: {
    maxResults?: number;
    paginationToken?: string;
  }): Promise<{ users: TwitterUser[]; meta?: { next_token?: string; result_count?: number } }> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const targetUserId = userId || (await this.getCurrentUser(tenantId)).id;

      const result = await client.v2.followers(targetUserId, {
        'user.fields': [
          'created_at',
          'description',
          'entities',
          'location',
          'pinned_tweet_id',
          'profile_image_url',
          'protected',
          'public_metrics',
          'url',
          'username',
          'verified',
          'verified_type',
        ].join(','),
        max_results: options?.maxResults || 100,
        pagination_token: options?.paginationToken,
      });

      // UserV2TimelineResult: data IS the array, meta is separate
      const meta = result.meta as { next_token?: string; result_count?: number } | undefined;
      return {
        users: (result.data || []) as unknown as TwitterUser[],
        meta: {
          next_token: meta?.next_token,
          result_count: meta?.result_count,
        },
      };
    }, 'getFollowers');
  }

  async getFollowing(tenantId: string, userId?: string, options?: {
    maxResults?: number;
    paginationToken?: string;
  }): Promise<{ users: TwitterUser[]; meta?: { next_token?: string; result_count?: number } }> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const targetUserId = userId || (await this.getCurrentUser(tenantId)).id;

      const result = await client.v2.following(targetUserId, {
        'user.fields': [
          'created_at',
          'description',
          'entities',
          'location',
          'pinned_tweet_id',
          'profile_image_url',
          'protected',
          'public_metrics',
          'url',
          'username',
          'verified',
          'verified_type',
        ].join(','),
        max_results: options?.maxResults || 100,
        pagination_token: options?.paginationToken,
      });

      const meta = result.meta as { next_token?: string; result_count?: number } | undefined;
      return {
        users: (result.data || []) as unknown as TwitterUser[],
        meta: {
          next_token: meta?.next_token,
          result_count: meta?.result_count,
        },
      };
    }, 'getFollowing');
  }

  async bookmarkTweet(tenantId: string, tweetId: string): Promise<boolean> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      await client.v2.bookmark(tweetId);
      logger.info('Tweet bookmarked', { tweetId, tenantId });
      return true;
    }, 'bookmarkTweet');
  }

  async removeBookmark(tenantId: string, tweetId: string): Promise<boolean> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      // Use direct API call for removeBookmark as it's not in twitter-api-v2
      const response = await fetch(`https://api.twitter.com/2/users/me/bookmarks/${tweetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(client as unknown as { _accessToken?: string })._accessToken || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok && response.status !== 204) {
        throw new Error(`Failed to remove bookmark: ${response.statusText}`);
      }

      logger.info('Bookmark removed', { tweetId, tenantId });
      return true;
    }, 'removeBookmark');
  }

  async getBookmarks(tenantId: string, options?: {
    maxResults?: number;
    paginationToken?: string;
  }): Promise<{ tweets: Tweet[]; meta?: { next_token?: string; result_count?: number } }> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);

      const result = await client.v2.bookmarks({
        'tweet.fields': [
          'attachments',
          'author_id',
          'context_annotations',
          'conversation_id',
          'created_at',
          'entities',
          'geo',
          'id',
          'in_reply_to_user_id',
          'public_metrics',
          'referenced_tweets',
          'reply_settings',
          'source',
          'text',
        ].join(','),
        expansions: ['author_id', 'attachments.media_keys'],
        'user.fields': [
          'created_at',
          'description',
          'entities',
          'location',
          'name',
          'pinned_tweet_id',
          'profile_image_url',
          'protected',
          'public_metrics',
          'url',
          'username',
          'verified',
        ].join(','),
        'media.fields': [
          'duration_ms',
          'height',
          'media_key',
          'preview_image_url',
          'type',
          'url',
          'width',
          'alt_text',
        ].join(','),
        max_results: options?.maxResults || 100,
        pagination_token: options?.paginationToken,
      });

      return {
        tweets: (result.data.data || []) as unknown as Tweet[],
        meta: result.data.meta,
      };
    }, 'getBookmarks');
  }

  async getTweetAnalytics(tenantId: string, tweetId: string): Promise<AnalyticsData> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);

      try {
        const result = await client.v2.singleTweet(tweetId, {
          'tweet.fields': [
            'non_public_metrics',
            'organic_metrics',
            'promoted_metrics',
            'public_metrics',
            'created_at',
          ].join(','),
        });

        const tweet = result.data as unknown as Record<string, unknown> | undefined;
        const publicMetrics = ((tweet?.public_metrics || {}) as Record<string, number>);
        const nonPublicMetrics = ((tweet?.non_public_metrics || {}) as Record<string, number>);
        const organicMetrics = ((tweet?.organic_metrics || {}) as Record<string, number>);

        return {
          tweetId,
          impressions: nonPublicMetrics.impression_count || organicMetrics.impression_count || 0,
          engagements: (publicMetrics.retweet_count || 0) +
            (publicMetrics.reply_count || 0) +
            (publicMetrics.like_count || 0),
          clicks: nonPublicMetrics.url_link_clicks || organicMetrics.url_link_clicks || 0,
          retweets: publicMetrics.retweet_count || 0,
          replies: publicMetrics.reply_count || 0,
          likes: publicMetrics.like_count || 0,
          quoteTweets: publicMetrics.quote_count || 0,
          userProfileClicks: nonPublicMetrics.user_profile_clicks || organicMetrics.user_profile_clicks || 0,
          urlClicks: nonPublicMetrics.url_link_clicks || organicMetrics.url_link_clicks || 0,
          date: (tweet?.created_at as string) || new Date().toISOString(),
        };
      } catch (error) {
        logger.error('Failed to get tweet analytics', { tweetId, tenantId, error });
        return {
          tweetId,
          impressions: 0,
          engagements: 0,
          clicks: 0,
          retweets: 0,
          replies: 0,
          likes: 0,
          quoteTweets: 0,
          userProfileClicks: 0,
          urlClicks: 0,
          date: new Date().toISOString(),
        };
      }
    }, 'getTweetAnalytics');
  }

  async getMultipleTweetsAnalytics(tenantId: string, tweetIds: string[]): Promise<AnalyticsData[]> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);

      const result = await client.v2.tweets(tweetIds, {
        'tweet.fields': [
          'non_public_metrics',
          'organic_metrics',
          'promoted_metrics',
          'public_metrics',
          'created_at',
        ].join(','),
      });

      return ((result.data || []) as unknown as Array<Record<string, unknown>>).map((tweet) => {
        const publicMetrics = ((tweet.public_metrics || {}) as Record<string, number>);
        const nonPublicMetrics = ((tweet.non_public_metrics || {}) as Record<string, number>);
        const organicMetrics = ((tweet.organic_metrics || {}) as Record<string, number>);

        return {
          tweetId: tweet.id as string,
          impressions: nonPublicMetrics.impression_count || organicMetrics.impression_count || 0,
          engagements: (publicMetrics.retweet_count || 0) +
            (publicMetrics.reply_count || 0) +
            (publicMetrics.like_count || 0),
          clicks: nonPublicMetrics.url_link_clicks || organicMetrics.url_link_clicks || 0,
          retweets: publicMetrics.retweet_count || 0,
          replies: publicMetrics.reply_count || 0,
          likes: publicMetrics.like_count || 0,
          quoteTweets: publicMetrics.quote_count || 0,
          userProfileClicks: nonPublicMetrics.user_profile_clicks || organicMetrics.user_profile_clicks || 0,
          urlClicks: nonPublicMetrics.url_link_clicks || organicMetrics.url_link_clicks || 0,
          date: (tweet.created_at as string) || new Date().toISOString(),
        };
      });
    }, 'getMultipleTweetsAnalytics');
  }

  scheduleTweet(
    tenantId: string,
    content: string,
    scheduledAt: Date,
    options?: {
      mediaIds?: string[];
      replyToId?: string;
      threadTweets?: string[];
    }
  ): ScheduledTweet {
    const schedule: ScheduledTweet = {
      id: uuidv4(),
      tenantId,
      content,
      scheduledAt,
      mediaIds: options?.mediaIds,
      replyToId: options?.replyToId,
      threadTweets: options?.threadTweets,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scheduledTweets.set(schedule.id, schedule);

    const delay = scheduledAt.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(async () => {
        await this.executeScheduledTweet(schedule.id);
      }, delay);
    } else {
      this.executeScheduledTweet(schedule.id);
    }

    logger.info('Tweet scheduled', { scheduleId: schedule.id, tenantId, scheduledAt });
    return schedule;
  }

  private async executeScheduledTweet(scheduleId: string): Promise<void> {
    const schedule = this.scheduledTweets.get(scheduleId);
    if (!schedule || schedule.status !== 'scheduled') {
      return;
    }

    try {
      const tweetData: CreateTweetRequest = {
        text: schedule.content,
      };

      if (schedule.replyToId) {
        tweetData.reply = {
          in_reply_to_tweet_id: schedule.replyToId,
        };
      }

      const tweet = await this.createTweet(schedule.tenantId, tweetData);

      schedule.status = 'posted';
      schedule.twitterTweetId = tweet.id;
      schedule.updatedAt = new Date();
      this.scheduledTweets.set(scheduleId, schedule);

      logger.info('Scheduled tweet posted', { scheduleId, tweetId: tweet.id });
    } catch (error) {
      schedule.status = 'failed';
      schedule.updatedAt = new Date();
      this.scheduledTweets.set(scheduleId, schedule);

      logger.error('Scheduled tweet failed', { scheduleId, error });
    }
  }

  private cleanupOldScheduledTweets(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
    let cleanedCount = 0;

    for (const [id, schedule] of this.scheduledTweets.entries()) {
      if (
        (schedule.status === 'posted' || schedule.status === 'failed' || schedule.status === 'cancelled') &&
        schedule.updatedAt.getTime() < cutoffTime
      ) {
        this.scheduledTweets.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up old scheduled tweets', { count: cleanedCount });
    }
  }

  getScheduledTweets(tenantId: string): ScheduledTweet[] {
    return Array.from(this.scheduledTweets.values()).filter(
      (tweet) => tweet.tenantId === tenantId
    );
  }

  getScheduledTweet(tenantId: string, scheduleId: string): ScheduledTweet | null {
    const schedule = this.scheduledTweets.get(scheduleId);
    if (!schedule || schedule.tenantId !== tenantId) {
      return null;
    }
    return schedule;
  }

  cancelScheduledTweet(tenantId: string, scheduleId: string): boolean {
    const schedule = this.scheduledTweets.get(scheduleId);
    if (!schedule || schedule.tenantId !== tenantId) {
      return false;
    }

    schedule.status = 'cancelled';
    schedule.updatedAt = new Date();
    this.scheduledTweets.set(scheduleId, schedule);

    logger.info('Scheduled tweet cancelled', { scheduleId, tenantId });
    return true;
  }

  updateScheduledTweet(
    tenantId: string,
    scheduleId: string,
    updates: { content?: string; scheduledAt?: Date; mediaIds?: string[] }
  ): ScheduledTweet | null {
    const schedule = this.scheduledTweets.get(scheduleId);
    if (!schedule || schedule.tenantId !== tenantId || schedule.status !== 'scheduled') {
      return null;
    }

    if (updates.content) {
      schedule.content = updates.content;
    }
    if (updates.scheduledAt) {
      schedule.scheduledAt = updates.scheduledAt;
      const delay = updates.scheduledAt.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(async () => {
          await this.executeScheduledTweet(scheduleId);
        }, delay);
      }
    }
    if (updates.mediaIds) {
      schedule.mediaIds = updates.mediaIds;
    }

    schedule.updatedAt = new Date();
    this.scheduledTweets.set(scheduleId, schedule);

    logger.info('Scheduled tweet updated', { scheduleId, tenantId });
    return schedule;
  }

  async searchTweets(
    tenantId: string,
    query: string,
    options?: {
      maxResults?: number;
      startTime?: string;
      endTime?: string;
      paginationToken?: string;
    }
  ): Promise<{ tweets: Tweet[]; meta?: { next_token?: string; result_count?: number } }> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);

      const result = await client.v2.search(query, {
        'tweet.fields': [
          'attachments',
          'author_id',
          'context_annotations',
          'conversation_id',
          'created_at',
          'edit_controls',
          'entities',
          'geo',
          'id',
          'in_reply_to_user_id',
          'non_public_metrics',
          'organic_metrics',
          'possibly_sensitive',
          'promoted_metrics',
          'public_metrics',
          'referenced_tweets',
          'reply_settings',
          'source',
          'text',
          'withheld',
        ].join(','),
        expansions: ['author_id', 'attachments.media_keys'],
        'user.fields': [
          'created_at',
          'description',
          'entities',
          'location',
          'name',
          'pinned_tweet_id',
          'profile_image_url',
          'protected',
          'public_metrics',
          'url',
          'username',
          'verified',
        ].join(','),
        'media.fields': [
          'duration_ms',
          'height',
          'media_key',
          'non_political_content',
          'preview_image_url',
          'type',
          'url',
          'width',
          'alt_text',
          'possibly_sensitive',
        ].join(','),
        max_results: options?.maxResults || 100,
        start_time: options?.startTime,
        end_time: options?.endTime,
      });

      return {
        tweets: (result.data?.data || []) as unknown as Tweet[],
        meta: result.data?.meta,
      };
    }, 'searchTweets');
  }

  async getUserTweets(
    tenantId: string,
    userId?: string,
    options?: {
      maxResults?: number;
      startTime?: string;
      endTime?: string;
      paginationToken?: string;
    }
  ): Promise<{ tweets: Tweet[]; meta?: { next_token?: string; result_count?: number } }> {
    return this.executeWithRetry(tenantId, async () => {
      const client = this.getClient(tenantId);
      const targetUserId = userId || (await this.getCurrentUser(tenantId)).id;

      const result = await client.v2.userTimeline(targetUserId, {
        'tweet.fields': [
          'attachments',
          'author_id',
          'context_annotations',
          'conversation_id',
          'created_at',
          'edit_controls',
          'entities',
          'geo',
          'id',
          'in_reply_to_user_id',
          'non_public_metrics',
          'organic_metrics',
          'possibly_sensitive',
          'promoted_metrics',
          'public_metrics',
          'referenced_tweets',
          'reply_settings',
          'source',
          'text',
          'withheld',
        ].join(','),
        exclude: ['replies', 'retweets'],
        max_results: options?.maxResults || 100,
        start_time: options?.startTime,
        end_time: options?.endTime,
      });

      return {
        tweets: (result.data?.data || []) as unknown as Tweet[],
        meta: result.data?.meta,
      };
    }, 'getUserTweets');
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    const expiryTime = 3600000;

    for (const [state, data] of this.oauthStates.entries()) {
      if (now - data.createdAt.getTime() > expiryTime) {
        this.oauthStates.delete(state);
      }
    }
  }

  disconnectTenant(tenantId: string): void {
    this.tenantClients.delete(tenantId);
    this.requestHistory.delete(tenantId);
    logger.info('Tenant disconnected', { tenantId });
  }

  isConnected(tenantId: string): boolean {
    return this.tenantClients.has(tenantId);
  }

  getRateLimitStatus(tenantId: string): { remaining: number; resetAt: Date; limit: number } {
    const record = this.requestHistory.get(tenantId);
    if (!record) {
      return {
        remaining: this.rateLimitConfig.maxRequests,
        resetAt: new Date(Date.now() + this.rateLimitConfig.windowMs),
        limit: this.rateLimitConfig.maxRequests,
      };
    }
    return {
      remaining: Math.max(0, this.rateLimitConfig.maxRequests - record.count),
      resetAt: new Date(record.resetAt),
      limit: this.rateLimitConfig.maxRequests,
    };
  }
}

export default new TwitterService();
