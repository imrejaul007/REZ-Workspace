/**
 * ReZ Menu AI - Unified Service Export
 * Single import point for all service clients
 */

// Re-export all services from their respective modules
export {
  // RABTUL
  RABTUL,
  AuthService,
  CatalogService,
  OrderService,
  PaymentService,
  WalletService,
  SearchService,
  ProfileService,
  NotificationService,
  BookingService,
} from './rabtul-api'

// ReZ Intelligence
export {
  ReZIntelligence,
  IntentService,
  DemandService,
  ScarcityService,
  PersonalizationService,
  SimilarityService,
  InsightService,
  RecoveryService,
  SegmentService,
} from './rez-intelligence-api'

// ReZ Media
export {
  ReZMedia,
  QRCampaignService,
  KarmaService,
  GamificationService,
  AbandonmentService,
  DOOHService,
} from './rez-media-api'

// CorpPerks
export {
  CorpPerks,
  MealBenefitService,
  CorporateOrderService,
  CorporateWalletService,
  RestaurantPartnerService,
  HRISService,
} from './corpperks-api'

// Re-export types
export * from './types'
