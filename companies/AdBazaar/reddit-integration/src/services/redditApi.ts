import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { redditApiCalls, redditApiLatency } from '../config/metrics';
import { RedditAccount } from '../models';

interface RedditTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface RedditPostResponse {
  id: string;
  name: string;
  subreddit: string;
  title: string;
  selftext?: string;
  url?: string;
  permalink: string;
  created_utc: number;
  score: number;
  ups: number;
  downs: number;
  num_comments: number;
  total_awards_received: number;
  over_18: boolean;
  spoiler: boolean;
  edited: boolean | number;
  locked: boolean;
  distinguished: string | null;
  link_flair_text?: string;
  archived: boolean;
}

interface RedditCommentResponse {
  id: string;
  name: string;
  link_id: string;
  parent_id: string;
  body: string;
  created_utc: number;
  score: number;
  ups: number;
  downs: number;
  total_awards_received: number;
  edited: boolean | number;
  distinguished: string | null;
  depth: number;
  replies?: RedditCommentResponse[];
}

interface RedditSubredditResponse {
  id: string;
  display_name: string;
  title: string;
  public_description: string;
  description: string;
  subscribers: number;
  accounts_active: number;
  icon_img: string;
  banner_img: string;
  over18: boolean;
  quarantine: boolean;
  lang: string;
  subreddit_type: string;
}

class RedditApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.reddit.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': config.reddit.userAgent,
      },
    });
  }

  private async getAccessToken(accountId: string): Promise<string> {
    const account = await RedditAccount.findById(accountId);
    if (!account) {
      throw new Error('Reddit account not found');
    }

    if (account.needsRefresh()) {
      return await this.refreshAccessToken(account);
    }

    return account.accessToken;
  }

  private async refreshAccessToken(account: any): Promise<string> {
    try {
      const response = await axios.post(
        config.reddit.tokenUrl,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: account.refreshToken,
        }),
        {
          auth: {
            username: config.reddit.clientId,
            password: config.reddit.clientSecret,
          },
          headers: {
            'User-Agent': config.reddit.userAgent,
          },
        }
      );

      const tokenData = response.data as RedditTokenResponse;
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      account.accessToken = tokenData.access_token;
      if (tokenData.refresh_token) {
        account.refreshToken = tokenData.refresh_token;
      }
      account.tokenExpiresAt = expiresAt;
      await account.save();

      logger.info('Reddit access token refreshed', { accountId: account._id });
      return tokenData.access_token;
    } catch (error) {
      logger.error('Failed to refresh Reddit token', { error, accountId: account._id });
      throw new Error('Failed to refresh access token');
    }
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    accountId?: string,
    params?: any
  ): Promise<T> {
    const start = Date.now();
    const endpointKey = endpoint.split('/').slice(-2, -1)[0] || endpoint;

    try {
      let headers: any = {};

      if (accountId) {
        const token = await this.getAccessToken(accountId);
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.client.request<T>({
        method,
        url: endpoint,
        data,
        params,
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const duration = (Date.now() - start) / 1000;
      redditApiCalls.inc({ endpoint, method, status: 'success' });
      redditApiLatency.observe({ endpoint: endpointKey, method }, duration);

      return response.data;
    } catch (error: any) {
      const duration = (Date.now() - start) / 1000;
      redditApiCalls.inc({ endpoint, method, status: 'error' });
      redditApiLatency.observe({ endpoint: endpointKey, method }, duration);

      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message;

      logger.error('Reddit API request failed', {
        endpoint,
        method,
        statusCode,
        error: errorMessage,
        duration,
      });

      throw new Error(`Reddit API error: ${errorMessage}`);
    }
  }

  // OAuth methods
  async getAuthorizationUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: config.reddit.clientId,
      response_type: 'code',
      state,
      redirect_uri: config.reddit.redirectUri,
      duration: 'permanent',
      scope: 'read submit vote identity history save',
    });

    return `${config.reddit.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<RedditTokenResponse> {
    try {
      const response = await axios.post(
        config.reddit.tokenUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: config.reddit.redirectUri,
        }),
        {
          auth: {
            username: config.reddit.clientId,
            password: config.reddit.clientSecret,
          },
          headers: {
            'User-Agent': config.reddit.userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      logger.info('Reddit OAuth token exchange successful');
      return response.data as RedditTokenResponse;
    } catch (error) {
      logger.error('Reddit OAuth token exchange failed', { error });
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  // User methods
  async getMe(accessToken: string): Promise<any> {
    return this.makeRequest('GET', '/api/v1/me', undefined, undefined, undefined);
  }

  // Post methods
  async createPost(
    accountId: string,
    subreddit: string,
    data: {
      title: string;
      content?: string;
      url?: string;
      nsfw?: boolean;
      spoiler?: boolean;
      flair?: string;
    }
  ): Promise<RedditPostResponse> {
    const formData = new URLSearchParams();
    formData.append('sr', subreddit);
    formData.append('title', data.title);
    formData.append('kind', data.url ? 'link' : 'self');

    if (data.url) {
      formData.append('url', data.url);
    } else if (data.content) {
      formData.append('text', data.content);
    }

    if (data.nsfw) formData.append('nsfw', 'true');
    if (data.spoiler) formData.append('spoiler', 'true');
    if (data.flair) formData.append('flair_text', data.flair);

    return this.makeRequest('POST', '/api/submit', formData.toString(), accountId);
  }

  async getPost(postId: string, accountId?: string): Promise<RedditPostResponse> {
    const fullId = postId.startsWith('t3_') ? postId : `t3_${postId}`;
    return this.makeRequest('GET', `/comments/${postId}.json`, undefined, accountId);
  }

  async deletePost(postId: string, accountId: string): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('id', postId.startsWith('t3_') ? postId : `t3_${postId}`);
    await this.makeRequest('POST', '/api/del', formData.toString(), accountId);
  }

  async updatePost(
    postId: string,
    accountId: string,
    data: { title?: string; content?: string }
  ): Promise<RedditPostResponse> {
    const formData = new URLSearchParams();
    formData.append('thing_id', postId.startsWith('t3_') ? postId : `t3_${postId}`);
    if (data.title) formData.append('title', data.title);
    if (data.content !== undefined) formData.append('text', data.content);

    return this.makeRequest('POST', '/api/editusertext', formData.toString(), accountId);
  }

  // Comment methods
  async createComment(
    accountId: string,
    parentId: string,
    content: string
  ): Promise<RedditCommentResponse> {
    const formData = new URLSearchParams();
    formData.append('parent', parentId);
    formData.append('text', content);

    const response = await this.makeRequest<{ jso: { data: { things: any[] } } }>(
      'POST',
      '/api/comment',
      formData.toString(),
      accountId
    );

    return response.jso.data.things[0].data;
  }

  async getComments(
    postId: string,
    accountId?: string,
    limit: number = 100
  ): Promise<RedditCommentResponse[]> {
    const response = await this.makeRequest<any[]>(
      'GET',
      `/comments/${postId}`,
      undefined,
      accountId,
      { limit }
    );

    const comments = response[1]?.data?.children || [];
    return this.flattenComments(comments);
  }

  private flattenComments(comments: any[], depth: number = 0): any[] {
    const result: any[] = [];
    for (const comment of comments) {
      if (comment.kind === 't1') {
        result.push({ ...comment.data, depth });
        if (comment.data.replies && comment.data.replies.data) {
          result.push(...this.flattenComments(comment.data.replies.data.children, depth + 1));
        }
      }
    }
    return result;
  }

  async deleteComment(commentId: string, accountId: string): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('id', commentId.startsWith('t1_') ? commentId : `t1_${commentId}`);
    await this.makeRequest('POST', '/api/del', formData.toString(), accountId);
  }

  // Vote method
  async vote(
    accountId: string,
    targetId: string,
    direction: -1 | 0 | 1
  ): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('id', targetId);
    formData.append('dir', direction.toString());
    await this.makeRequest('POST', '/api/vote', formData.toString(), accountId);
  }

  // Subreddit methods
  async getSubredditInfo(subreddit: string): Promise<RedditSubredditResponse> {
    return this.makeRequest('GET', `/r/${subreddit}/about.json`);
  }

  async searchSubreddits(query: string, limit: number = 25): Promise<RedditSubredditResponse[]> {
    const response = await this.makeRequest<{ data: { children: any[] } }>(
      'GET',
      '/subreddits/by_name.json',
      undefined,
      undefined,
      { names: query }
    );

    return response.data.children.map((c) => c.data);
  }

  // Analytics methods
  async getSubredditPosts(
    subreddit: string,
    sort: 'hot' | 'new' | 'top' | 'rising' = 'hot',
    limit: number = 25
  ): Promise<RedditPostResponse[]> {
    const response = await this.makeRequest<{ data: { children: any[] } }>(
      'GET',
      `/r/${subreddit}/${sort}.json`,
      undefined,
      undefined,
      { limit }
    );

    return response.data.children.map((c) => c.data);
  }

  async getTrendingPosts(subreddits: string[], limit: number = 10): Promise<RedditPostResponse[]> {
    const allPosts: RedditPostResponse[] = [];

    for (const subreddit of subreddits) {
      try {
        const posts = await this.getSubredditPosts(subreddit, 'top', limit);
        allPosts.push(...posts);
      } catch (error) {
        logger.warn(`Failed to fetch posts from r/${subreddit}`, { error });
      }
    }

    return allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Saved posts
  async savePost(accountId: string, postId: string): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('id', postId);
    formData.append('category', '');
    await this.makeRequest('POST', '/api/save', formData.toString(), accountId);
  }

  async unsavePost(accountId: string, postId: string): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('id', postId);
    await this.makeRequest('POST', '/api/unsave', formData.toString(), accountId);
  }
}

export const redditApi = new RedditApiService();
export default redditApi;