export { campaignService, CreateCampaignSchema, UpdateCampaignSchema, CampaignFilters } from './campaignService';
export { keywordService, AddKeywordSchema, UpdateKeywordSchema, KeywordFilters } from './keywordService';
export { bidService, SetBidSchema, BidStrategy } from './bidService';
export { analyticsService, PerformanceMetrics, TimeSeriesData, KeywordPerformance, AudienceInsight } from './analyticsService';
export {
  recommendationService,
  KeywordRecommendation,
  AudienceRecommendation,
  CreativeRecommendation,
  BudgetRecommendation,
  CampaignOptimization
} from './recommendationService';