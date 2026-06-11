/**
 * PropFlow Connectors Index
 * Real Estate Property Management
 */

export { default as MerchantOSConnector } from './merchant-os';
export { default as HOJAIConnector } from './hojai-core';

export type {
  MerchantOSConfig,
  PropertyRecord,
  CustomerProfile,
  SiteVisitRequest,
  LeadRecord
} from './merchant-os';

export type {
  HOJAIConfig,
  IntentResult,
  PropertyContext,
  PropertyRecommendation,
  PriceAnalysis,
  AreaAnalysis
} from './hojai-core';