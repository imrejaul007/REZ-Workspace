// Pinterest Account Interface
export interface IPinterestAccount {
  _id?: string;
  id: string;
  pinterestUserId: string;
  username: string;
  displayName: string;
  profileImage?: string;
  websiteUrl?: string;
  followerCount: number;
  followingCount: number;
  connectedAt: Date;
  accessToken?: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pinterest Board Interface
export interface IPinterestBoard {
  _id?: string;
  id: string;
  pinterestBoardId: string;
  accountId: string;
  name: string;
  description?: string;
  privacy: 'public' | 'secret';
  pinCount: number;
  followerCount: number;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pinterest Pin Interface
export interface IPinterestPin {
  _id?: string;
  id: string;
  pinterestPinId: string;
  boardId: string;
  accountId: string;
  title: string;
  description: string;
  link?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  altText?: string;
  keywords: string[];
  ctaLink?: string;
  viewCount: number;
  repinCount: number;
  clickCount: number;
  savedCount: number;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledTime?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Pinterest Comment Interface
export interface IPinterestComment {
  _id?: string;
  id: string;
  pinId: string;
  accountId: string;
  authorName: string;
  authorImage?: string;
  text: string;
  createdAt: Date;
  hidden: boolean;
}

// Pinterest Analytics Interface
export interface IPinterestAnalytics {
  _id?: string;
  accountId: string;
  date: Date;
  impressions: number;
  saves: number;
  clicks: number;
  repins: number;
  comments: number;
  followers: number;
  topPins: Array<{
    pinId: string;
    title: string;
    impressions: number;
  }>;
  audienceInsights?: {
    ageBreakdown: Record<string, number>;
    genderBreakdown: Record<string, number>;
    countryBreakdown: Record<string, number>;
    deviceBreakdown: Record<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}

// OAuth Token Response
export interface IOAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// Pinterest API Response Types
export interface IPinterestUser {
  id: string;
  username: string;
  display_name: string;
  profile_url?: string;
  image_url?: string;
  account_type?: string;
  website_url?: string;
  follower_count?: number;
  following_count?: number;
}

export interface IPinterestBoardResponse {
  id: string;
  name: string;
  description?: string;
  privacy: 'PUBLIC' | 'SECRET';
  created_at: string;
  pin_count?: number;
  follower_count?: number;
  cover_image?: {
    url: string;
  };
}

export interface IPinterestPinResponse {
  id: string;
  board_id: string;
  title: string;
  description?: string;
  link?: string;
  media: {
    type: 'image' | 'video';
    url: string;
  };
  alt_text?: string;
  created_at: string;
  color?: string;
  note?: string;
}

export interface IPinterestAnalyticsResponse {
  summary: {
    impressions: number;
    saves: number;
    clicks: number;
    repins: number;
    comments: number;
  };
  date_range: {
    start_date: string;
    end_date: string;
  };
}

// API Request/Response Types
export interface ICreatePinRequest {
  boardId: string;
  title: string;
  description?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  link?: string;
  altText?: string;
  keywords?: string[];
  ctaLink?: string;
}

export interface ICreateBoardRequest {
  name: string;
  description?: string;
  privacy?: 'public' | 'secret';
}

export interface IUpdatePinRequest {
  title?: string;
  description?: string;
  link?: string;
  altText?: string;
  keywords?: string[];
  ctaLink?: string;
}

export interface IUpdateBoardRequest {
  name?: string;
  description?: string;
  privacy?: 'public' | 'secret';
}

export interface ISchedulePinRequest {
  scheduledTime: string;
}

export interface ICreateIdeaPinRequest {
  boardId: string;
  title: string;
  description?: string;
  mediaUrls: string[];
  link?: string;
  altText?: string;
  keywords?: string[];
}

export interface IPaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextCursor?: string;
  };
}

// Express Extended Request
export interface IAuthRequest extends Express.Request {
  user?: {
    id: string;
    accountId?: string;
  };
}

// Error Types
export interface IApiError {
  statusCode: number;
  message: string;
  details?: Record<string, unknown>;
}
