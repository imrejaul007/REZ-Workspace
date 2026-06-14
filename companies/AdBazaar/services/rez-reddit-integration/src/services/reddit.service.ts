import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import {
  RedditConfig,
  RedditOAuthToken,
  RedditUser,
  RedditSubreddit,
  RedditPost,
  RedditComment,
  RedditMessage,
  RedditKarma,
  CreatePostRequest,
  CreateCommentRequest,
} from '../types';

export class RedditService {
  private config: RedditConfig;
  private tenantTokens: Map<string, RedditOAuthToken> = new Map();
  private tenantUsers: Map<string, RedditUser> = new Map();

  constructor() {
    this.config = {
      clientId: process.env.REDDIT_CLIENT_ID || '',
      clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
      userAgent: process.env.REDDIT_USER_AGENT || 'ReZ_Platform_v1.0',
      accessToken: process.env.REDDIT_ACCESS_TOKEN,
      refreshToken: process.env.REDDIT_REFRESH_TOKEN,
      callbackUrl: process.env.REDDIT_CALLBACK_URL || 'http://localhost:4786/auth/callback',
    };
  }

  private getAuthHeader(): string {
    return 'Basic ' + Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
  }

  private getClient(tenantId: string): AxiosInstance {
    const tokenData = this.tenantTokens.get(tenantId);
    const accessToken = tokenData?.access_token || this.config.accessToken;

    return axios.create({
      baseURL: 'https://oauth.reddit.com',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': this.config.userAgent,
        'Content-Type': 'application/json',
      },
    });
  }

  private getBasicClient(): AxiosInstance {
    return axios.create({
      baseURL: 'https://www.reddit.com/api/v1',
      headers: {
        Authorization: this.getAuthHeader(),
        'User-Agent': this.config.userAgent,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  // OAuth: Generate authorization URL
  generateAuthUrl(tenantId: string): string {
    const scopes = [
      'identity',
      'read',
      'submit',
      'edit',
      'delete',
      'vote',
      'save',
      'report',
      'subscribe',
      'mysubreddits',
      'flair',
      'privatemessages',
      'account',
      'livemanage',
      'structuredstyles',
      'creddits',
    ].join(' ');

    const state = Buffer.from(JSON.stringify({ tenantId, timestamp: Date.now() })).toString('base64');

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      state,
      redirect_uri: this.config.callbackUrl,
      duration: 'permanent',
      scope: scopes,
    });

    return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
  }

  // OAuth: Exchange code for token
  async exchangeCodeForToken(code: string, tenantId: string): Promise<RedditOAuthToken> {
    try {
      const response = await this.getBasicClient().post('/access_token', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.callbackUrl,
      }, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      const tokenData: RedditOAuthToken = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        token_type: response.data.token_type,
        expires_in: response.data.expires_in,
        scope: response.data.scope,
      };

      this.tenantTokens.set(tenantId, tokenData);

      // Fetch and store user info
      await this.fetchAndStoreUser(tenantId);

      logger.info('Reddit OAuth successful', { tenantId });
      return tokenData;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Reddit OAuth failed', { error: axiosError.response?.data });
      throw new Error('Failed to authenticate with Reddit');
    }
  }

  // OAuth: Refresh token
  async refreshToken(refreshToken: string, tenantId: string): Promise<RedditOAuthToken> {
    try {
      const response = await this.getBasicClient().post('/access_token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      const tokenData: RedditOAuthToken = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refreshToken,
        token_type: response.data.token_type,
        expires_in: response.data.expires_in,
        scope: response.data.scope,
      };

      this.tenantTokens.set(tenantId, tokenData);

      return tokenData;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to refresh Reddit token', { error: axiosError.response?.data });
      throw new Error('Failed to refresh Reddit access token');
    }
  }

  setAccessToken(tenantId: string, accessToken: string, refreshToken?: string): void {
    this.tenantTokens.set(tenantId, {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 0,
      scope: '*',
    });
  }

  private async fetchAndStoreUser(tenantId: string): Promise<RedditUser> {
    const user = await this.getCurrentUser(tenantId);
    this.tenantUsers.set(tenantId, user);
    return user;
  }

  // Get current user
  async getCurrentUser(tenantId: string): Promise<RedditUser> {
    const client = this.getClient(tenantId);

    try {
      const response = await client.get('/me');
      return this.mapUserData(response.data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to get current user', { error: axiosError.response?.data });
      throw new Error('Failed to get Reddit user');
    }
  }

  private mapUserData(data: Record<string, unknown>): RedditUser {
    return {
      id: data.id as string,
      name: data.name as string,
      fullname: data.fullname as string,
      created: data.created as number,
      created_utc: data.created_utc as number,
      karma_link: data.link_karma as number,
      karma_comment: data.comment_karma as number,
      karma_total: (data.link_karma as number) + (data.comment_karma as number),
      has_verified_email: data.has_verified_email as boolean,
      inbox_count: data.inbox_count as number,
      gold_creddits: data.gold_creddits as number,
      is_gold: data.is_gold as boolean,
      is_mod: data.is_mod as boolean,
      has_mail: data.has_mail as boolean,
      has_mod_mail: data.has_mod_mail as boolean,
      over_18: data.over_18 as boolean,
      is_employee: data.is_employee as boolean,
      is_suspended: data.is_suspended as boolean,
      awarder_karma: data.awarder_karma as number,
      awardee_karma: data.awardee_karma as number,
      link_karma: data.link_karma as number,
      comment_karma: data.comment_karma as number,
      total_karma: data.total_karma as number,
    };
  }

  // Get user by username
  async getUser(tenantId: string, username: string): Promise<RedditUser> {
    const client = this.getClient(tenantId);

    try {
      const response = await client.get(`/user/${username}/about`);
      return this.mapUserData(response.data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to get user', { username, error: axiosError.response?.data });
      throw new Error('User not found');
    }
  }

  // Get user karma
  async getUserKarma(tenantId: string): Promise<RedditKarma[]> {
    const client = this.getClient(tenantId);

    try {
      const response = await client.get('/me/karma');
      return response.data.data.children.map((item: Record<string, unknown>) => ({
        sr: (item.sr as Record<string, unknown>)?.name as string || '',
        comment_karma: (item.comment_karma as number) || 0,
        link_karma: (item.link_karma as number) || 0,
        awarder_karma: 0,
        awardee_karma: 0,
        total_karma: ((item.comment_karma as number) || 0) + ((item.link_karma as number) || 0),
      }));
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to get karma', { error: axiosError.response?.data });
      throw new Error('Failed to get karma');
    }
  }

  // Get subscribed subreddits
  async getSubscribedSubreddits(tenantId: string): Promise<RedditSubreddit[]> {
    const client = this.getClient(tenantId);

    try {
      const response = await client.get('/subreddits/mine/subscriber', {
        params: { limit: 100 },
      });

      return response.data.data.children.map((item: Record<string, unknown>) => this.mapSubredditData(item.data as Record<string, unknown>));
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to get subreddits', { error: axiosError.response?.data });
      throw new Error('Failed to get subreddits');
    }
  }

  // Get subreddit info
  async getSubreddit(tenantId: string, subredditName: string): Promise<RedditSubreddit> {
    const client = this.getClient(tenantId);

    try {
      const response = await client.get(`/r/${subredditName}/about`);
      return this.mapSubredditData(response.data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to get subreddit', { subredditName, error: axiosError.response?.data });
      throw new Error('Subreddit not found');
    }
  }

  private mapSubredditData(data: Record<string, unknown>): RedditSubreddit {
    return {
      id: data.id as string,
      name: data.name as string,
      display_name: data.display_name as string,
      title: data.title as string,
      url: data.url as string,
      created: data.created as number,
      created_utc: data.created_utc as number,
      subscriber_count: data.subscribers as number || 0,
      over18: data.over_18 as boolean,
      public_description: data.public_description as string,
      description: data.description as string,
      sidebar_html: data.sidebar_html as string,
      header_img: data.header_img as string,
      icon_img: data.icon_img as string,
      banner_img: data.banner_img as string,
      is_default: data.is_default as boolean,
      is_gold_only: data.gold_only as boolean,
      is_over_18: data.over_18 as boolean,
      is_private: data.subreddit_type === 'private',
      is_quarantined: data.quarantine as boolean,
      submission_type: data.submission_type as RedditSubreddit['submission_type'],
    };
  }

  // Search subreddits
  async searchSubreddits(tenantId: string, query: string): Promise<RedditSubreddit[]> {
    const client = this.getClient(tenantId);

    try {
      const response = await client.get('/subreddits/search', {
        params: { q: query, limit: 25 },
      });

      return response.data.data.children.map((item: Record<string, unknown>) => this.mapSubredditData(item.data as Record<string, unknown>));
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to search subreddits', { query, error: axiosError.response?.data });
      throw new Error('Failed to search subreddits');
    }
  }

  // Subscribe to subreddit
  async subscribe(tenantId: string, subredditName: string, action: 'sub' | 'unsub' = 'sub'): Promise<boolean> {
    const client = this.getClient(tenantId);

    try {
      await client.post('/subscribe', {
        action,
        sr_name: subredditName,
      });

      logger.info(`Reddit subscription ${action === 'sub' ? 'added' : 'removed'}`, { subredditName, tenantId });
      return true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to subscribe', { subredditName, error: axiosError.response?.data });
      throw new Error('Failed to subscribe');
    }
  }

  // Create a post
  async createPost(tenantId: string, postData: CreatePostRequest): Promise<RedditPost> {
    const client = this.getClient(tenantId);

    try {
      const payload: Record<string, unknown> = {
        sr: postData.subreddit,
        title: postData.title,
        resubmit: postData.resubmit ?? false,
        send_replies: postData.send_replies ?? true,
        nsfw: postData.nsfw ?? false,
        spoiler: postData.spoiler ?? false,
      };

      if (postData.text) {
        payload.kind = 'self';
        payload.text = postData.text;
      } else if (postData.url) {
        payload.kind = 'link';
        payload.url = postData.url;
      } else {
        throw new Error('Either text or url is required');
      }

      if (postData.flair_id) {
        payload.flair_id = postData.flair_id;
      } else if (postData.flair_text) {
        payload.flair_text = postData.flair_text;
      }

      const response = await client.post('/submit', payload);

      const postId = response.data?.json?.data?.id;
      if (!postId) {
        throw new Error('Failed to create post');
      }

      logger.info('Reddit post created', { postId, subreddit: postData.subreddit, tenantId });

      // Return the created post info
      return {
        id: postId,
        name: `t3_${postId}`,
        title: postData.title,
        selftext: postData.text,
        url: postData.url,
        permalink: `/r/${postData.subreddit}/comments/${postId}/`,
        created: Date.now() / 1000,
        created_utc: Date.now() / 1000,
        author: this.tenantUsers.get(tenantId) || {} as RedditUser,
        subreddit: {} as RedditSubreddit,
        subreddit_name_prefixed: `r/${postData.subreddit}`,
        num_comments: 0,
        score: 1,
        upvote_ratio: 1,
        ups: 1,
        downs: 0,
        over_18: postData.nsfw || false,
        spoiler: postData.spoiler || false,
        locked: false,
        archived: false,
        pinned: false,
        is_self: !!postData.text,
        is_video: false,
        domain: postData.url ? new URL(postData.url).hostname : `r/${postData.subreddit}`,
        gilded: 0,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to create post', { error: axiosError.response?.data });
      throw new Error('Failed to create post');
    }
  }

  // Get post by ID
  async getPost(tenantId: string, postId: string, subreddit?: string): Promise<RedditPost> {
    const client = this.getClient(tenantId);

    try {
      const path = subreddit ? `/r/${subreddit}/comments/${postId}` : `/comments/${postId}`;
      const response = await client.get(path);

      const postData = response.data[0]?.data?.children[0]?.data;
      if (!postData) {
        throw new Error('Post not found');
      }

      return this.mapPostData(postData);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to get post', { postId, error: axiosError.response?.data });
      throw new Error('Post not found');
    }
  }

  private mapPostData(data: Record<string, unknown>): RedditPost {
    return {
      id: data.id as string,
      name: data.name as string,
      title: data.title as string,
      body: data.selftext as string,
      selftext: data.selftext as string,
      url: data.url as string,
      permalink: data.permalink as string,
      created: data.created as number,
      created_utc: data.created_utc as number,
      author: {
        id: data.author_fullname as string || '',
        name: data.author as string,
        fullname: data.author_fullname as string || '',
        created: 0,
        created_utc: 0,
        karma_link: 0,
        karma_comment: 0,
        karma_total: 0,
        has_verified_email: false,
        gold_creddits: 0,
        is_gold: false,
        is_mod: false,
        has_mail: false,
        has_mod_mail: false,
        over_18: false,
        is_employee: false,
        is_suspended: false,
        awarder_karma: 0,
        awardee_karma: 0,
        link_karma: 0,
        comment_karma: 0,
        total_karma: 0,
      },
      subreddit: {
        id: data.subreddit_id as string || '',
        name: `t5_${data.subreddit_id}` || '',
        display_name: data.subreddit as string || '',
        title: '',
        url: `/r/${data.subreddit}` || '',
        created: 0,
        created_utc: 0,
        subscriber_count: 0,
        over18: false,
        public_description: '',
        description: '',
        is_default: false,
        is_gold_only: false,
        is_over_18: false,
        is_private: false,
        is_quarantined: false,
        submission_type: 'any',
      },
      subreddit_name_prefixed: data.subreddit_name_prefixed as string,
      num_comments: data.num_comments as number,
      score: data.score as number,
      upvote_ratio: data.upvote_ratio as number,
      ups: data.ups as number,
      downs: data.downs as number,
      over_18: data.over_18 as boolean,
      spoiler: data.spoiler as boolean,
      locked: data.locked as boolean,
      archived: data.archived as boolean,
      pinned: data.pinned as boolean,
      is_self: data.is_self as boolean,
      is_video: data.is_video as boolean,
      media: data.media as RedditPost['media'],
      preview: data.preview as RedditPost['preview'],
      link_flair_text: data.link_flair_text as string,
      link_flair_type: data.link_flair_type as string,
      author_flair_text: data.author_flair_text as string,
      author_flair_type: data.author_flair_type as string,
      domain: data.domain as string,
      approved_at_utc: data.approved_at_utc as number,
      banned_at_utc: data.banned_at_utc as number,
      mod_note: data.mod_note as string,
      saved: data.saved as boolean,
      gilded: data.gilded as number,
    };
  }

  // Delete post
  async deletePost(tenantId: string, postId: string): Promise<boolean> {
    const client = this.getClient(tenantId);

    try {
      await client.post('/del', { id: `t3_${postId}` });
      logger.info('Reddit post deleted', { postId, tenantId });
      return true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to delete post', { postId, error: axiosError.response?.data });
      throw new Error('Failed to delete post');
    }
  }

  // Edit post
  async editPost(tenantId: string, postId: string, text: string): Promise<RedditPost> {
    const client = this.getClient(tenantId);

    try {
      await client.post('/editusertext', {
        thing_id: `t3_${postId}`,
        text,
      });

      return this.getPost(tenantId, postId);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to edit post', { postId, error: axiosError.response?.data });
      throw new Error('Failed to edit post');
    }
  }

  // Create comment
  async createComment(tenantId: string, commentData: CreateCommentRequest): Promise<RedditComment> {
    const client = this.getClient(tenantId);

    try {
      const response = await client.post('/comment', {
        thing_id: commentData.thing_id || `t3_${commentData.parent}`,
        text: commentData.text,
      });

      const commentId = response.data?.json?.data?.things?.[0]?.data?.id;
      if (!commentId) {
        throw new Error('Failed to create comment');
      }

      logger.info('Reddit comment created', { commentId, parent: commentData.parent, tenantId });

      return {
        id: commentId,
        name: `t1_${commentId}`,
        link_id: `t3_${commentData.parent}`,
        parent_id: commentData.thing_id || `t3_${commentData.parent}`,
        body: commentData.text,
        created: Date.now() / 1000,
        created_utc: Date.now() / 1000,
        author: this.tenantUsers.get(tenantId) || {} as RedditUser,
        subreddit: {} as RedditSubreddit,
        subreddit_name_prefixed: `r/${commentData.subreddit}`,
        link_title: '',
        link_author: '',
        link_permalink: '',
        ups: 1,
        downs: 0,
        score: 1,
        score_hidden: false,
        archived: false,
        is_root: !commentData.thing_id?.startsWith('t1_'),
        is_submitter: true,
        pinned: false,
        stickied: false,
        collapsed: false,
        removed: false,
        deleted: false,
        approved: true,
        spam: false,
        depth: 0,
        gilded: 0,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to create comment', { error: axiosError.response?.data });
      throw new Error('Failed to create comment');
    }
  }

  // Get comments for a post
  async getPostComments(
    tenantId: string,
    postId: string,
    subreddit?: string,
    options?: {
      limit?: number;
      depth?: number;
    }
  ): Promise<RedditComment[]> {
    const client = this.getClient(tenantId);

    try {
      const path = subreddit ? `/r/${subreddit}/comments/${postId}` : `/comments/${postId}`;
      const response = await client.get(path, {
        params: {
          limit: options?.limit || 100,
          depth: options?.depth,
        },
      });

      const comments = response.data[1]?.data?.children || [];
      return comments.map((item: Record<string, unknown>) => this.mapCommentData(item.data as Record<string, unknown>));
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to get comments', { postId, error: axiosError.response?.data });
      throw new Error('Failed to get comments');
    }
  }

  private mapCommentData(data: Record<string, unknown>): RedditComment {
    return {
      id: data.id as string,
      name: data.name as string,
      link_id: data.link_id as string,
      parent_id: data.parent_id as string,
      body: data.body as string,
      body_html: data.body_html as string,
      created: data.created as number,
      created_utc: data.created_utc as number,
      author: {
        id: data.author_fullname as string || '',
        name: data.author as string,
        fullname: data.author_fullname as string || '',
        created: 0,
        created_utc: 0,
        karma_link: 0,
        karma_comment: 0,
        karma_total: 0,
        has_verified_email: false,
        gold_creddits: 0,
        is_gold: false,
        is_mod: false,
        has_mail: false,
        has_mod_mail: false,
        over_18: false,
        is_employee: false,
        is_suspended: false,
        awarder_karma: 0,
        awardee_karma: 0,
        link_karma: 0,
        comment_karma: 0,
        total_karma: 0,
      },
      subreddit: {
        id: data.subreddit_id as string || '',
        name: `t5_${data.subreddit_id}` || '',
        display_name: data.subreddit as string || '',
        title: '',
        url: `/r/${data.subreddit}` || '',
        created: 0,
        created_utc: 0,
        subscriber_count: 0,
        over18: false,
        public_description: '',
        description: '',
        is_default: false,
        is_gold_only: false,
        is_over_18: false,
        is_private: false,
        is_quarantined: false,
        submission_type: 'any',
      },
      subreddit_name_prefixed: data.subreddit_name_prefixed as string,
      link_title: data.link_title as string,
      link_author: data.link_author as string,
      link_permalink: data.permalink as string,
      ups: data.ups as number,
      downs: data.downs as number,
      score: data.score as number,
      score_hidden: data.score_hidden as boolean,
      archived: data.archived as boolean,
      is_root: data.is_root as boolean,
      is_submitter: data.is_submitter as boolean,
      pinned: data.pinned as boolean,
      stickied: data.stickied as boolean,
      collapsed: data.collapsed as boolean,
      removed: data.removed as boolean,
      deleted: data.deleted as boolean,
      approved: data.approved as boolean,
      spam: data.spam as boolean,
      mod_note: data.mod_note as string,
      author_flair_text: data.author_flair_text as string,
      link_flair_text: data.link_flair_text as string,
      num_reports: data.num_reports as number,
      report_reasons: data.report_reasons as string[],
      depth: data.depth as number,
      gilded: data.gilded as number,
    };
  }

  // Delete comment
  async deleteComment(tenantId: string, commentId: string): Promise<boolean> {
    const client = this.getClient(tenantId);

    try {
      await client.post('/del', { id: `t1_${commentId}` });
      logger.info('Reddit comment deleted', { commentId, tenantId });
      return true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to delete comment', { commentId, error: axiosError.response?.data });
      throw new Error('Failed to delete comment');
    }
  }

  // Vote on a post or comment
  async vote(tenantId: string, thingId: string, direction: 1 | 0 | -1): Promise<boolean> {
    const client = this.getClient(tenantId);

    try {
      await client.post('/vote', {
        id: thingId,
        dir: direction,
      });

      logger.info('Reddit vote cast', { thingId, direction, tenantId });
      return true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to vote', { thingId, error: axiosError.response?.data });
      throw new Error('Failed to vote');
    }
  }

  // Save a post or comment
  async save(tenantId: string, thingId: string, category?: string): Promise<boolean> {
    const client = this.getClient(tenantId);

    try {
      await client.post('/save', {
        id: thingId,
        category,
      });

      logger.info('Reddit item saved', { thingId, category, tenantId });
      return true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to save', { thingId, error: axiosError.response?.data });
      throw new Error('Failed to save');
    }
  }

  // Get inbox messages
  async getInbox(tenantId: string, options?: { limit?: number; markRead?: boolean }): Promise<RedditMessage[]> {
    const client = this.getClient(tenantId);

    try {
      const response = await client.get('/message/inbox', {
        params: { limit: options?.limit || 25 },
      });

      return response.data.data.children.map((item: Record<string, unknown>) => this.mapMessageData(item.data as Record<string, unknown>));
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      logger.error('Failed to get inbox', { error: axiosError.response?.data });
      throw new Error('Failed to get inbox');
    }
  }

  private mapMessageData(data: Record<string, unknown>): RedditMessage {
    return {
      id: data.id as string,
      name: data.name as string,
      subject: data.subject as string,
      body: data.body as string,
      body_html: data.body_html as string,
      created: data.created as number,
      created_utc: data.created_utc as number,
      author: {
        id: data.author_fullname as string || '',
        name: data.author as string || '[deleted]',
        fullname: data.author_fullname as string || '',
        created: 0,
        created_utc: 0,
        karma_link: 0,
        karma_comment: 0,
        karma_total: 0,
        has_verified_email: false,
        gold_creddits: 0,
        is_gold: false,
        is_mod: false,
        has_mail: false,
        has_mod_mail: false,
        over_18: false,
        is_employee: false,
        is_suspended: false,
        awarder_karma: 0,
        awardee_karma: 0,
        link_karma: 0,
        comment_karma: 0,
        total_karma: 0,
      },
      dest: data.dest as string,
      subreddit: data.subreddit as string,
      new: data.new as boolean,
      read: data.new !== undefined ? !data.new as boolean : false,
      was_comment: data.was_comment as boolean,
      parent_id: data.parent_id as string,
    };
  }

  // Get unread messages count
  async getUnreadCount(tenantId: string): Promise<number> {
    try {
      const user = await this.getCurrentUser(tenantId);
      return user.inbox_count || 0;
    } catch {
      return 0;
    }
  }

  // Disconnect tenant
  disconnectTenant(tenantId: string): void {
    this.tenantTokens.delete(tenantId);
    this.tenantUsers.delete(tenantId);
    logger.info('Tenant disconnected', { tenantId });
  }

  // Check if tenant is connected
  isConnected(tenantId: string): boolean {
    return this.tenantTokens.has(tenantId) || !!this.config.accessToken;
  }
}

export default new RedditService();
