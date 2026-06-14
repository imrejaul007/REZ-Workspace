// Twitter API Types based on Twitter API v2

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  bearerToken: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface TwitterOAuthToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
  expires_at?: number;
}

export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  created_at?: string;
  description?: string;
  entities?: {
    url?: {
      urls: Array<{ expanded_url: string }>;
    };
  };
  location?: string;
  pinned_tweet_id?: string;
  profile_image_url?: string;
  protected?: boolean;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  url?: string;
  verified?: boolean;
  verified_type?: string;
  withheld?: {
    country_codes: string[];
    scope: string;
  };
}

export interface TweetMedia {
  media_id: string;
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;
  preview_image_url?: string;
  duration_ms?: number;
  height?: number;
  width?: number;
  alt_text?: string;
  non_political_content?: string;
  possibly_sensitive?: boolean;
}

export interface Tweet {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  edit_history_tweet_ids?: string[];
  conversation_id?: string;
  in_reply_to_user_id?: string;
  referenced_tweets?: Array<{
    type: 'retweeted' | 'quoted' | 'replied_to';
    id: string;
  }>;
  attachments?: {
    media_keys?: string[];
    poll_ids?: string[];
  };
  geo?: {
    place_id: string;
  };
  context_annotations?: Array<{
    domain: {
      id: string;
      name: string;
      description: string;
    };
    entity: {
      id: string;
      name: string;
      description: string;
    };
  }>;
  entities?: {
    annotations?: Array<{
      start: number;
      end: number;
      probability: number;
      type: string;
      normalized_text: string;
    }>;
    cashtags?: Array<{ start: number; end: number; tag: string }>;
    hashtags?: Array<{ start: number; end: number; tag: string }>;
    mentions?: Array<{ start: number; end: number; username: string; id: string }>;
    urls?: Array<{
      start: number;
      end: number;
      url: string;
      expanded_url: string;
      display_url: string;
      unwound_url: string;
      status?: number;
      title?: string;
      description?: string;
      images?: Array<{ url: string; width: number; height: number }>;
    }>;
  };
  withheld?: {
    copyright: boolean;
    country_codes: string[];
    scope: string;
  };
  edit_controls?: {
    edits_remaining: string;
    is_edit_eligible: boolean;
    editable_until: string;
  };
  media?: TweetMedia[];
  non_public_metrics?: {
    impression_count: number;
    url_link_clicks?: number;
    user_profile_clicks?: number;
  };
  organic_metrics?: {
    impression_count: number;
    url_link_clicks: number;
    user_profile_clicks: number;
    retweet_count: number;
    reply_count: number;
    like_count: number;
  };
  promoted_metrics?: {
    impression_count: number;
    url_link_clicks: number;
    user_profile_clicks: number;
    retweet_count: number;
    reply_count: number;
    like_count: number;
  };
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  reply_settings?: 'everyone' | 'mentioned_users' | 'followers';
  suppression_by_client_details?: {
    marked_spam: boolean;
    marked_unsafe: boolean;
    user_no_connect: boolean;
    no_user_means_no_tweet: boolean;
  };
}

export interface CreateTweetRequest {
  text: string;
  reply?: {
    in_reply_to_tweet_id: string;
    exclude_reply_user_ids?: string[];
  };
  quote_tweet_id?: string;
  media?: {
    media_ids?: string[];
    tagged_user_ids?: string[];
  };
  poll?: {
    duration_minutes: number;
    options: string[];
  };
  direct_message_deep_link?: string;
  geo?: {
    place_id: string;
  };
  super_followers_only?: boolean;
  reply_settings?: 'everyone' | 'mentioned_users' | 'followers';
}

export interface ThreadRequest {
  tweets: CreateTweetRequest[];
}

export interface ScheduledTweet {
  id: string;
  tenantId: string;
  content: string;
  scheduledAt: Date;
  mediaIds?: string[];
  replyToId?: string;
  threadTweets?: string[];
  status: 'scheduled' | 'posted' | 'failed' | 'cancelled';
  twitterTweetId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Mention {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  conversation_id: string;
  in_reply_to_user_id?: string;
  referenced_tweets?: Array<{
    type: 'replied_to' | 'quoted' | 'retweeted';
    id: string;
  }>;
  entities?: Tweet['entities'];
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  author?: TwitterUser;
}

export interface AnalyticsData {
  tweetId: string;
  impressions: number;
  engagements: number;
  clicks: number;
  retweets: number;
  replies: number;
  likes: number;
  quoteTweets: number;
  userProfileClicks: number;
  urlClicks: number;
  date: string;
}

export interface TwitterApiResponse<T> {
  data: T;
  meta?: {
    result_count?: number;
    next_token?: string;
    previous_token?: string;
    total_tweet_count?: number;
  };
  errors?: Array<{
    title: string;
    detail: string;
    type: string;
  }>;
}

// OAuth State management
export interface OAuthState {
  tenantId: string;
  redirectUri: string;
  codeVerifier: string;
  createdAt: Date;
}

// API Routes types
export interface TenantContext {
  tenantId: string;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
