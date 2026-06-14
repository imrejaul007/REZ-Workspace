/**
 * Barrel export for Try components and utilities
 * Part of ReZ Try Simplified UX Architecture
 */

// Components
export { default as ProfileDrawer } from './ProfileDrawer';
export { default as CoinBalancePill } from './CoinBalancePill';
export { default as MissionProgressMini } from './MissionProgressMini';
export { default as BundlesUpsellCard } from './BundlesUpsellCard';
export { default as CampaignBanner } from './CampaignBanner';

// Re-export component types
export type {
  ProfileDrawerProps,
  Tier,
  CategoryBadge,
  Mission,
} from './ProfileDrawer';

export type {
  CoinBalancePillProps,
  CoinTier,
} from './CoinBalancePill';

// Utilities - explicit exports to avoid conflicts
export {
  needsToBuyCoins,
  getCoinTier,
  formatCoins,
  COIN_PACKS,
  getRecommendedPack,
  getRecommendedPackDetails,
  COIN_VISIBILITY,
  getCoinVisibilityLevel,
  shouldPulseCoinBadge,
  getCoinUrgencyMessage,
  shouldPromptCoinPurchase,
  getCoinsNeededText,
  shouldShowBundlesUpsellSimple,
} from './coinUtils';

export {
  getPrimaryMission,
  getActiveMissions,
  getTimeRemaining,
  isMissionUrgent,
  getMissionProgress,
  isMissionCompletable,
  formatMissionReward,
} from './missionUtils';

export {
  Bundle,
  ActiveBundle,
  BundleVisibility,
  BundleSavings,
  BundleStatus,
  shouldShowBundlesUpsell,
  shouldShowBundlesUpsellWithRecommendation,
  getBundleSavings,
  formatBundleSavings,
  getPricePerTrial,
  getBundleEffectiveValue,
  getBundleStatus,
  getDaysRemaining,
  formatExpiryDate,
  getSlotsRemaining,
  sortBundlesByValue,
  getBestValueBundle,
  getFeaturedBundles,
  isGoodDeal,
  getBundleDisplayTitle,
  getBundleShortDescription,
  getBundleFullDescription,
} from './bundleUtils';

export {
  Campaign,
  CampaignVisibility,
  CampaignProgress,
  CampaignStatus,
  TYPE_BADGES,
  TYPE_LABELS,
  TYPE_COLORS,
  getVisibleCampaigns,
  getTopCampaign,
  shouldShowCampaignBanner,
  getCampaignProgress,
  formatCampaignProgress,
  isAlmostComplete,
  getCampaignUrgency,
  getCampaignStatus,
  getDaysUntilStart,
  getCampaignDaysRemaining,
  formatEndDate,
  getCampaignBadge,
  getCampaignTypeLabel,
  getCampaignTypeColor,
  getCampaignDisplayTitle,
  getCampaignShortDescription,
  getUrgencyColor,
  filterByType,
  sortByPriority,
  getActiveCampaignsSorted,
} from './campaignUtils';
