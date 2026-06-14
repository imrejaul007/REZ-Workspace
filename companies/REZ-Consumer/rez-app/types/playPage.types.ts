// @ts-nocheck
// Play Page Types for UGC Video Content
// Based on screenshots analysis and UGCDetailScreen integration

export type CategoryType = 'trending_me' | 'trending_her' | 'waist' | 'article' | 'featured';

export interface CategoryTab {
  id: string;
  title: string;
  emoji: string;
  isActive: boolean;
  type: CategoryType;
}

export interface Product {
  id: string;
  title: string;
  price: string;
  rating?: number;
  cashbackText?: string;
  image: string;
  category?: string;
  // Backend data (preserved for detailed views)
  pricing?: {
    basePrice?: number;
    salePrice?: number;
    discount?: number;
  };
  inventory?: {
    isAvailable?: boolean;
    quantity?: number;
  };
}

export type ContentType = 'merchant' | 'article' | 'ugc';

export interface UGCVideoItem {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  viewCount: string; // "2.5L" format
  description: string;
  hashtags?: string[];
  productCount?: number;
  category: CategoryType;
  contentType: ContentType; // Differentiates merchant, article, and UGC videos
  isLiked?: boolean;
  isShared?: boolean;
  products?: Product[];
  // Additional metadata
  author?: string;
  authorAvatar?: string;
  duration?: number; // in seconds
  createdAt?: string;
  likes?: number;
  shares?: number;
  comments?: number;
}

export interface VideoCardProps {
  item: UGCVideoItem;
  onPress: (item: UGCVideoItem) => void;
  onPlay?: () => void;
  onPause?: () => void;
  autoPlay?: boolean;
  showProductCount?: boolean;
  showHashtags?: boolean;
  size?: 'small' | 'medium' | 'large' | 'featured';
  style?;
}

export interface FeaturedVideoCardProps {
  item: UGCVideoItem;
  onPress: (item: UGCVideoItem) => void;
  onLike?: (itemId: string) => void;
  onShare?: (item: UGCVideoItem) => void;
  autoPlay?: boolean;
}

export interface VideoGridProps {
  items: UGCVideoItem[];
  onItemPress: (item: UGCVideoItem) => void;
  columns?: number;
  autoPlay?: boolean;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
}

export interface CategoryHeaderProps {
  categories: CategoryTab[];
  onCategoryPress: (category: CategoryTab) => void;
  activeCategory: CategoryType;
}

export interface SectionHeaderProps {
  title: string;
  showViewAll?: boolean;
  onViewAllPress?: () => void;
  style?;
}

// State Management Types
export interface PlayPageState {
  // Video data
  featuredVideo?: UGCVideoItem;
  merchantVideos: UGCVideoItem[]; // Videos from merchant app
  articleVideos: UGCVideoItem[]; // Article content
  ugcVideos: UGCVideoItem[]; // User-generated content
  trendingVideos: UGCVideoItem[]; // Legacy - can be removed later
  allVideos: UGCVideoItem[];

  // UI state
  activeCategory: CategoryType;
  categories: CategoryTab[];
  loading: boolean;
  refreshing: boolean;

  // Video playback state
  playingVideos: Set<string>; // Set of video IDs currently playing
  mutedVideos: Set<string>; // Set of video IDs that are muted

  // Pagination
  hasMoreVideos: boolean;
  currentPage: number;

  // Error handling
  error?: string;
}

export interface PlayPageActions {
  // Data fetching
  fetchVideos: (category?: CategoryType) => Promise<void>;
  refreshVideos: () => Promise<void>;
  loadMoreVideos: () => Promise<void>;

  // Category management
  setActiveCategory: (category: CategoryType) => void;

  // Video playback control
  playVideo: (videoId: string) => void;
  pauseVideo: (videoId: string) => void;
  toggleMute: (videoId: string) => void;

  // User interactions
  likeVideo: (videoId: string) => Promise<boolean>;
  shareVideo: (video: UGCVideoItem) => Promise<void>;

  // Navigation
  navigateToDetail: (video: UGCVideoItem) => void;

  // Error handling
  clearError: () => void;
}

// Navigation Types
export interface PlayScreenNavigationParams {
  category?: CategoryType;
  videoId?: string;
}

export interface UGCDetailNavigationParams {
  item: UGCVideoItem;
  fromPlayScreen?: boolean;
}

// API Response Types
export interface PlayPageApiResponse {
  featured?: UGCVideoItem;
  trending: UGCVideoItem[];
  articles: UGCVideoItem[];
  hasMore: boolean;
  nextPage?: number;
}

export interface VideoInteractionResponse {
  success: boolean;
  newCount?: number;
  message?: string;
}

// Hook Types
export interface UsePlayPageData {
  state: PlayPageState;
  actions: PlayPageActions;
}

export interface UseVideoPlayback {
  playingVideos: Set<string>;
  playVideo: (videoId: string) => void;
  pauseVideo: (videoId: string) => void;
  pauseAllVideos: () => void;
  isVideoPlaying: (videoId: string) => boolean;
}

// Constants
export const CATEGORY_TYPES: Record<CategoryType, string> = {
  trending_me: 'Trends for me',
  trending_her: 'Trends for her',
  waist: 'Waist pe',
  article: 'Article',
  featured: 'Featured'
};

export const CATEGORY_EMOJIS: Record<CategoryType, string> = {
  trending_me: '👑',
  trending_her: '👸',
  waist: '⚡',
  article: '📖',
  featured: '🌟'
};

// Video Card Size Configurations - More spacious and modern
export const VIDEO_CARD_SIZES = {
  small: {
    height: 200,
    width: '48%',
    fontSize: 13,
    padding: 16,
  },
  medium: {
    height: 280,
    width: '48%',
    fontSize: 14,
    padding: 20,
  },
  large: {
    height: 320,
    width: '100%',
    fontSize: 15,
    padding: 24,
  },
  featured: {
    height: 420,
    width: '100%',
    fontSize: 17,
    padding: 28,
  }
};

// REZ Design System Color scheme for Play Page
// Using theme constants for consistency
import { colors } from '../constants/theme';

export const PLAY_PAGE_COLORS = {
  primary: colors.primary[500], // REZ Mustard
  secondary: colors.secondary[600], // Nile Blue
  gold: colors.primary[500], // Light Mustard
  background: colors.background.secondary, // REZ Linen
  cardBackground: colors.background.primary,
  text: colors.text.primary, // Nile Blue
  textSecondary: '#1F2D3D', // Slate (not in theme)
  textTertiary: colors.text.tertiary, // Cool Gray
  textOverlay: colors.text.white,
  shadow: colors.secondary[600],
  like: colors.primary[500], // Mustard for likes
  share: colors.primary[500], // REZ Mustard
  overlay: 'rgba(0, 0, 0, 0.2)',
  border: colors.border.default,
  accent: colors.lavenderMist, // Lavender Mist
  gradient: {
    header: [colors.secondary[600], '#2d5a7b', '#3d6a8b'], // REZ Blue gradient
    heroGold: [colors.secondary[600], '#2d5a7b', colors.primary[500]], // Blue to Mustard
    videoOverlay: ['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.7)'],
    cardOverlay: ['transparent', 'rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.5)'],
    subtle: [colors.linen, colors.lavenderMist]
  }
};
