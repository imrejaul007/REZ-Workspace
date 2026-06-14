/**
 * Shared enums — re-exported from canonical location.
 * DO NOT add enum definitions here. All enums must be defined in
 * /shared-types/src/enums/index.ts (the canonical source).
 *
 * To add/modify enums, edit the canonical location only.
 */

// Re-export all enums from canonical location
export {
  CoinType,
  normalizeCoinType,
  isCanonicalCoinType,
  normalizeCoinTypeAs,
  COIN_TYPE_VALUES,
} from '@rez/shared-types/enums';

export {
  UserRole,
  Gender,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentGateway,
  COIN_PRIORITY,
  CoinTransactionType,
  CampaignStatus,
  CampaignChannel,
  NotificationType,
  NotificationChannel,
  OfferType,
  DiscountType,
  FinanceTransactionType,
  FinanceTransactionStatus,
  VerificationStatus,
  JewelryStyle,
  Theme,
  ReferralTier,
  RezPlusTier,
  PriveTier,
  LoyaltyTier,
  LocationSource,
  DocumentType,
  ProfessionType,
  ServiceType,
  EventType,
  TransactionStatus,
} from '@rez/shared-types/enums';

// CorpPerks enums
export {
  CorpRole,
  BenefitType,
  CorpCoinType,
  BookingType,
  CorporateOrderStatus,
  CorpPartnerTier,
  CorpPaymentSource,
  GSTServiceType,
  GiftCampaignType,
  TravelPurpose,
} from '@rez/shared-types/enums';
