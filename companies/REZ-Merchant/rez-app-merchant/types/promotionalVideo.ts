import { QueryOptions } from './api';

// Product summary for video associations
export interface ProductSummary {
  _id: string;
  name: string;
  images: string[];
  pricing?: {
    mrp: number;
    selling?: number;
  };
  store?: {
    _id: string;
    name: string;
    slug: string;
  };
}

// Store summary for video associations
export interface StoreSummary {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
}

// Video engagement stats
export interface VideoEngagement {
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

// Video metadata
export interface VideoMetadata {
  duration: number; // In seconds (max 180)
  fileSize?: number;
  resolution?: string;
  format?: string;
  uploadedAt: string;
  lastModified?: string;
}

// Main promotional video interface
export interface PromotionalVideo {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnail: string;
  publicId?: string; // Cloudinary public ID for deletion

  // Associations
  stores: StoreSummary[];
  products: ProductSummary[];

  // Content info
  contentType: 'merchant';
  category: 'featured' | 'tutorial' | 'review';
  tags: string[];

  // Engagement & Analytics
  engagement: VideoEngagement;
  metadata: VideoMetadata;

  // Status
  isPublished: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'flagged';

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Request to create a new promotional video
export interface CreateVideoRequest {
  title: string;
  description?: string;
  storeId: string;
  videoUrl: string;
  thumbnailUrl: string;
  products: string[]; // Product IDs (min 1 required)
  tags?: string[];
  category?: 'featured' | 'tutorial' | 'review';
  duration: number; // In seconds (max 180)
  publicId?: string; // Cloudinary public ID
}

// Request to update a promotional video
export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  products?: string[]; // Product IDs (min 1 required if provided)
  tags?: string[];
  category?: 'featured' | 'tutorial' | 'review';
  isPublished?: boolean;
}

// Filter options for listing videos
export interface VideoFilters extends QueryOptions {
  storeId?: string;
  category?: 'featured' | 'tutorial' | 'review';
  isPublished?: boolean;
  sortBy?: 'newest' | 'popular' | 'views';
}

// Response for video list
export interface VideoListResponse {
  videos: PromotionalVideo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Single video response
export interface VideoResponse {
  success: boolean;
  data: {
    video: PromotionalVideo;
  };
}

// Analytics for a single video
export interface SingleVideoAnalytics {
  videoId: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number; // (likes + shares + comments) / views * 100
  avgWatchTime?: number; // In seconds
  createdAt: string;
}

// Recent activity entry
export interface AnalyticsActivity {
  date: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

// Best performing video summary
export interface BestPerformingVideo {
  _id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  engagement: VideoEngagement;
}

// Store video analytics response
export interface StoreVideoAnalytics {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  avgEngagementRate: number;
  bestPerforming: BestPerformingVideo | null;
  recentActivity: AnalyticsActivity[];
  videoPerformance: SingleVideoAnalytics[];
}

// Analytics response
export interface AnalyticsResponse {
  success: boolean;
  data: StoreVideoAnalytics;
}

// Video upload state management
export interface VideoUploadState {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  videoUri: string | null;
  thumbnailUri: string | null;
  duration: number;
  isValidDuration: boolean;
}

// Product selection state
export interface ProductSelectionState {
  selectedProducts: ProductSummary[];
  searchQuery: string;
  isSearching: boolean;
  availableProducts: ProductSummary[];
}

// Form state for video upload modal
export interface VideoFormState {
  title: string;
  description: string;
  tags: string[];
  category: 'featured' | 'tutorial' | 'review';
  selectedProducts: string[];
}

// Validation result
export interface VideoValidation {
  isValid: boolean;
  errors: {
    title?: string;
    video?: string;
    duration?: string;
    products?: string;
  };
}

// Video events for real-time updates
export interface VideoEvent {
  id: string;
  videoId: string;
  type: 'created' | 'updated' | 'deleted' | 'views_updated' | 'engagement_updated';
  data: Partial<PromotionalVideo>;
  timestamp: string;
  storeId: string;
}
