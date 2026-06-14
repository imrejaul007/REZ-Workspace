// Post Types
export interface Post {
  id: string;
  content: string;
  platforms: Platform[];
  scheduledAt?: string;
  publishedAt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  media?: Media[];
  analytics?: PostAnalytics;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: string;
  url: string;
  type: 'image' | 'video' | 'gif';
  thumbnail?: string;
  alt?: string;
}

export interface Platform {
  id: string;
  name: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'tiktok' | 'reddit';
  connected: boolean;
  username?: string;
  avatar?: string;
}

// Calendar Types
export interface CalendarEvent {
  id: string;
  postId?: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: 'post' | 'draft' | 'meeting' | 'reminder';
  color: string;
}

export interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledAt: string;
  status: 'scheduled' | 'published' | 'failed';
}

// Analytics Types
export interface AnalyticsData {
  totalPosts: number;
  totalEngagement: number;
  totalReach: number;
  engagementRate: number;
  topPerformingPost?: Post;
  postsByDay: { date: string; count: number }[];
  engagementByPlatform: { platform: string; engagement: number }[];
  recentActivity: ActivityItem[];
}

export interface PostAnalytics {
  impressions: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
}

export interface ActivityItem {
  id: string;
  type: 'post_published' | 'post_scheduled' | 'engagement' | 'follower_gain';
  platform: string;
  description: string;
  timestamp: string;
  metric?: number;
}

// Content Creation Types
export interface Draft {
  id: string;
  content: string;
  media: Media[];
  platforms: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Quick Action Types
export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  action: 'create_post' | 'schedule' | 'view_analytics' | 'check_queue' | 'reply';
  color: string;
}

// Offline Types
export interface OfflineAction {
  id: string;
  type: 'create_post' | 'update_post' | 'delete_post' | 'sync_media';
  payload: any;
  timestamp: string;
  synced: boolean;
}

export interface SyncStatus {
  lastSyncAt: string;
  pendingActions: number;
  isOnline: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Navigation Types
export type RootTabParamList = {
  home: undefined;
  create: undefined;
  calendar: undefined;
  analytics: undefined;
  profile: undefined;
};
