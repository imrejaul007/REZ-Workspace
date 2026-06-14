// Models barrel export
export { UnifiedAccount, IUnifiedAccount } from './UnifiedAccount';
export { LoyaltyTransactionModel, ILoyaltyTransaction } from './LoyaltyTransaction';
export { LoyaltyTierModel, ILoyaltyTier } from './LoyaltyTier';
export { CrossIndustryRedemptionModel, ICrossIndustryRedemption } from './CrossIndustryRedemption';
export { LoyaltyCampaignModel, ILoyaltyCampaign } from './LoyaltyCampaign';

// Import all models for easy access
import { UnifiedAccount } from './UnifiedAccount';
import { LoyaltyTransactionModel } from './LoyaltyTransaction';
import { LoyaltyTierModel } from './LoyaltyTier';
import { CrossIndustryRedemptionModel } from './CrossIndustryRedemption';
import { LoyaltyCampaignModel } from './LoyaltyCampaign';

export const Models = {
  UnifiedAccount,
  LoyaltyTransaction: LoyaltyTransactionModel,
  LoyaltyTier: LoyaltyTierModel,
  CrossIndustryRedemption: CrossIndustryRedemptionModel,
  LoyaltyCampaign: LoyaltyCampaignModel
};

export default Models;