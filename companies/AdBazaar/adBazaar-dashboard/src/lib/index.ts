/**
 * AdBazaar Dashboard Integrations
 *
 * Central export file for all REZ Media service integrations.
 * Wire up AI, Analytics, and Social services to the dashboard.
 */

// AI Campaign Builder Integration
export {
  aiCampaignBuilder,
  useAICampaignBuilder,
  AICampaignBuilderClient,
} from './ai-integration';

export type {
  AICampaignResponse,
  CreativeResponse,
  RecommendationsResponse,
  OptimizeResponse,
  TemplatesResponse,
} from './ai-integration';

// Analytics Integration
export {
  mediaAnalytics,
  realtimeDashboard,
  analyticsService,
  MediaAnalyticsClient,
  RealtimeDashboardClient,
  AnalyticsService,
  useAnalytics,
} from './analytics-integration';

export type {
  CampaignMetrics,
  Alert,
  LiveMetricsSnapshot,
  MediaAnalyticsCampaign,
  DOOHPlacement,
  DOOHAnalytics,
  RevenueReport,
  CampaignAnalyticsResponse,
  AggregatedMetrics,
  WebSocketStats,
} from './analytics-integration';

// Social & Gamification Integration
export {
  instagramBridge,
  gamification,
  useSocialIntegration,
  InstagramBridgeClient,
  GamificationClient,
} from './social-integration';

export type {
  InstagramUser,
  InstagramConversation,
  InstagramMessage,
  InstagramComment,
  LinkSession,
  CommentAnalytics,
  SocialPlatform,
  SocialMetrics,
  GamificationMetrics,
  GamificationSummary,
} from './social-integration';

// AI Campaign Types
export type {
  AdType,
  TargetingConfig,
  BudgetAllocation,
  ChannelConfig,
  CreativeContent,
  Estimation,
  GeneratedCampaign,
  CampaignRequest,
  CreativeRequest,
} from './types/ai-campaign';
