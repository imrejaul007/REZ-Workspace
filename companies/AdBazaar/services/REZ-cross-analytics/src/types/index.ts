// Platform Types
export type Platform = 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'facebook' | 'youtube';

export interface PlatformCredentials {
  platform: Platform;
  accessToken?: string;
  apiKey?: string;
  apiSecret?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

// Raw Metrics from each platform
export interface TwitterMetrics {
  tweetId: string;
  impressions: number;
  engagements: number;
  likes: number;
  retweets: number;
  replies: number;
  urlClicks: number;
  profileClicks: number;
  promotedMetrics?: {
    spend: number;
    impressions: number;
    engagements: number;
  };
}

export interface InstagramMetrics {
  mediaId: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  profileVisits: number;
  websiteClicks: number;
}

export interface LinkedInMetrics {
  postId: string;
  impressions: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

export interface TikTokMetrics {
  videoId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  profileViews: number;
  watchTime: number;
  averageWatchTime: number;
}

export interface FacebookMetrics {
  postId: string;
  impressions: number;
  reach: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
}

export interface YouTubeMetrics {
  videoId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTime: number;
  subscribersGained: number;
  subscribersLost: number;
}

// Unified/Normalized Metrics
export interface UnifiedMetrics {
  platform: Platform;
  contentId: string;
  timestamp: Date;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  customMetrics?: Record<string, number>;
}

export interface AggregatedMetrics {
  platform: Platform;
  totalImpressions: number;
  totalReach: number;
  totalEngagements: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalClicks: number;
  engagementRate: number;
  averageImpressionsPerPost: number;
  postCount: number;
}

export interface CrossPlatformSummary {
  date: string;
  platforms: Platform[];
  totalImpressions: number;
  totalReach: number;
  totalEngagements: number;
  overallEngagementRate: number;
  topPlatform: Platform;
  platformBreakdown: {
    platform: Platform;
    impressions: number;
    reach: number;
    engagements: number;
    engagementRate: number;
  }[];
}

// Engagement & ROI Types
export interface EngagementMetrics {
  engagementRate: number;
  likeRate: number;
  commentRate: number;
  shareRate: number;
  clickRate: number;
}

export interface ROIMetrics {
  platform: Platform;
  spend: number;
  revenue: number;
  impressions: number;
  conversions: number;
  cpa: number; // Cost per acquisition
  roas: number; // Return on ad spend
  ctr: number; // Click-through rate
}

export interface AttributionData {
  touchpoints: {
    platform: Platform;
    timestamp: Date;
    interactionType: 'view' | 'click' | 'engagement' | 'conversion';
    weight: number;
  }[];
  attributedRevenue: number;
  attributionModel: AttributionModel;
}

export type AttributionModel = 'first-touch' | 'last-touch' | 'linear' | 'time-decay' | 'position-based';

// Report Types
export interface ReportConfig {
  id?: string;
  name: string;
  type: ReportType;
  platforms: Platform[];
  metrics: string[];
  dateRange: DateRange;
  groupBy?: 'day' | 'week' | 'month' | 'platform';
  filters?: ReportFilters;
}

export type ReportType = 'summary' | 'detailed' | 'roi' | 'engagement' | 'trends' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ReportFilters {
  platforms?: Platform[];
  contentTypes?: string[];
  minEngagement?: number;
  campaigns?: string[];
}

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  generatedAt: Date;
  dateRange: DateRange;
  summary: CrossPlatformSummary;
  metrics: AggregatedMetrics[];
  trends?: TrendData[];
  roi?: ROIMetrics[];
  exportedAt?: Date;
  exportedFormat?: 'csv' | 'pdf' | 'json';
}

export interface TrendData {
  date: string;
  platform: Platform;
  value: number;
  percentageChange?: number;
}

// Dashboard Types
export interface DashboardData {
  overview: CrossPlatformSummary;
  recentPosts: UnifiedMetrics[];
  topPerforming: {
    platform: Platform;
    contentId: string;
    metric: string;
    value: number;
  }[];
  notifications: DashboardNotification[];
  realTimeMetrics?: RealTimeMetrics;
}

export interface RealTimeMetrics {
  activeUsers: number;
  currentImpressions: number;
  currentEngagements: number;
  lastUpdated: Date;
}

export interface DashboardNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'alert';
  message: string;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Request Types
export interface MetricsRequest {
  platforms?: Platform[];
  dateRange: DateRange;
  metrics?: string[];
  limit?: number;
  offset?: number;
}

export interface TrendAnalysisRequest {
  platforms?: Platform[];
  dateRange: DateRange;
  metric: string;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

// Export Types
export interface ExportConfig {
  format: 'csv' | 'pdf' | 'json' | 'xlsx';
  includeCharts?: boolean;
  includeRawData?: boolean;
  timezone?: string;
}

// Platform-specific adapters interface
export interface PlatformAdapter {
  platform: Platform;
  fetchMetrics(credentials: PlatformCredentials, dateRange: DateRange): Promise<UnifiedMetrics[]>;
  calculateEngagement(metrics: UnifiedMetrics[]): EngagementMetrics;
  formatForExport(metrics: UnifiedMetrics[]): Record<string, unknown>[];
}
