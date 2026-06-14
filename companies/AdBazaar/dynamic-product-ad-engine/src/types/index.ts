/**
 * DPA - Dynamic Product Ad Engine Types
 * TypeScript interfaces for DPA campaigns, feeds, and rendering
 */

// Element styles for ad templates
export interface ElementStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  padding?: number;
  margin?: number;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  opacity?: number;
  zIndex?: number;
}

// Position and dimensions for template elements
export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Template element types for dynamic ads
export type TemplateElementType =
  | 'product_image'
  | 'product_name'
  | 'price'
  | 'original_price'
  | 'discount'
  | 'cta'
  | 'logo'
  | 'badge'
  | 'rating'
  | 'description'
  | 'brand'
  | 'availability';

// Single element in the ad template
export interface TemplateElement {
  type: TemplateElementType;
  position: ElementPosition;
  style: ElementStyle;
  content?: string; // Static content fallback
  dynamicField?: string; // For product data binding
}

// Ad template layout types
export type LayoutType = 'grid' | 'carousel' | 'single' | 'hero' | 'collection';

// Ad template configuration
export interface AdTemplate {
  layout: LayoutType;
  dimensions: {
    width: number;
    height: number;
  };
  elements: TemplateElement[];
  backgroundColor?: string;
  borderRadius?: number;
  spacing?: number;
}

// Targeting rules for filtering products
export interface TargetingRules {
  minPrice?: number;
  maxPrice?: number;
  categories?: string[];
  excludeProducts?: string[];
  discountThreshold?: number;
  inStockOnly?: boolean;
  brandWhitelist?: string[];
  brandBlacklist?: string[];
}

// User segments for ad targeting
export interface UserTargeting {
  userSegments?: string[];
  browsingHistory?: boolean;
  cartAbandoners?: boolean;
  lookalikeAudience?: boolean;
  retargetingDays?: number;
}

// Campaign performance metrics
export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  orders: number;
  revenue: number;
  ctr: number;
  conversionRate: number;
  costPerClick: number;
  costPerOrder: number;
  roas: number;
}

// Product in a feed
export interface Product {
  productId: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  imageUrl: string;
  images?: string[];
  url: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  stockQuantity?: number;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  attributes?: Record<string, string>;
  lastUpdated: Date;
}

// Feed statistics
export interface FeedStats {
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  lastSynced: Date;
  syncErrors?: number;
}

// Feed source types
export type FeedSource = 'manual' | 'shopify' | 'woocommerce' | 'magento' | 'bigcommerce' | 'api';

// Feed sync configuration
export interface FeedSyncConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly';
  lastSync?: Date;
  nextSync?: Date;
  apiKey?: string;
  webhookUrl?: string;
}

// Product Feed document
export interface ProductFeed {
  feedId: string;
  merchantId: string;
  name: string;
  description?: string;
  source: FeedSource;
  sourceUrl?: string;
  products: Product[];
  syncConfig?: FeedSyncConfig;
  stats: FeedStats;
  status: 'active' | 'syncing' | 'paused' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

// Campaign status
export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';

// DPA Campaign document
export interface DPACampaign {
  campaignId: string;
  advertiserId: string;
  name: string;
  description?: string;
  feedId: string;
  template: AdTemplate;
  rules: TargetingRules;
  targeting: UserTargeting;
  metrics: CampaignMetrics;
  status: CampaignStatus;
  budget?: {
    daily?: number;
    total?: number;
    spent: number;
  };
  schedule?: {
    startDate?: Date;
    endDate?: Date;
    timezone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Ad rendering context (user info, session)
export interface RenderContext {
  userId?: string;
  sessionId?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  browsingHistory?: string[];
  cartItems?: string[];
  userSegments?: string[];
  preferences?: {
    language?: string;
    currency?: string;
  };
}

// Rendered ad output
export interface RenderedAd {
  adId: string;
  campaignId: string;
  product: Product;
  html: string;
  imageUrl?: string;
  clickUrl: string;
  impressionUrl?: string;
  timestamp: Date;
}

// Preview request for ad rendering
export interface PreviewRequest {
  campaignId: string;
  productId?: string;
  context?: RenderContext;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Feed upload response
export interface FeedUploadResponse {
  feedId: string;
  name: string;
  productsImported: number;
  productsUpdated: number;
  errors: string[];
}

// Campaign create request
export interface CreateCampaignRequest {
  name: string;
  advertiserId: string;
  feedId: string;
  template: AdTemplate;
  rules?: TargetingRules;
  targeting?: UserTargeting;
  budget?: {
    daily?: number;
    total?: number;
  };
  schedule?: {
    startDate?: Date;
    endDate?: Date;
  };
}

// Feed upload request
export interface FeedUploadRequest {
  name: string;
  merchantId: string;
  source: FeedSource;
  products: Omit<Product, 'lastUpdated'>[];
}

// Batch render request for multiple products
export interface BatchRenderRequest {
  campaignId: string;
  productIds?: string[];
  count: number;
  context?: RenderContext;
}

// Batch render response
export interface BatchRenderResponse {
  ads: RenderedAd[];
  totalRendered: number;
  errors: string[];
}

// Health check response
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: Date;
  dependencies: {
    mongodb: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}

// JWT payload for authentication
export interface JWTPayload {
  userId: string;
  advertiserId: string;
  role: 'advertiser' | 'admin' | 'viewer';
  permissions: string[];
  exp?: number;
  iat?: number;
}

// Express request with user context
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      advertiserId?: string;
    }
  }
}