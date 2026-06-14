/**
 * Inventory Classifier Service
 * Manages inventory categorization and access control
 */

import { InventoryCategory, Platform, TenantType } from '@rez/tenant-middleware';

// ============================================================================
// INVENTORY DEFINITIONS
// ============================================================================

export interface InventoryDefinition {
  category: InventoryCategory;
  name: string;
  description: string;
  platform: Platform;
  tier: 'internal_only' | 'marketplace';
  minBudget: number;
  estimatedReach: number;
  estimatedCpm: number;
  targeting: {
    demographics: boolean;
    geo: boolean;
    behavioral: boolean;
    contextual: boolean;
  };
  formats: string[];
  features: string[];
}

/**
 * Complete inventory catalog
 */
export const INVENTORY_CATALOG: Record<InventoryCategory, InventoryDefinition> = {
  // === REZ INTERNAL INVENTORY ===

  [InventoryCategory.REZ_APP_HOME_FEED]: {
    category: InventoryCategory.REZ_APP_HOME_FEED,
    name: 'ReZ App Home Feed',
    description: 'Prime placement in ReZ App home feed',
    platform: Platform.APP,
    tier: 'internal_only',
    minBudget: 10000,
    estimatedReach: 500000,
    estimatedCpm: 150,
    targeting: { demographics: true, geo: true, behavioral: true, contextual: true },
    formats: ['banner', 'card', 'native'],
    features: ['scroll-stop', 'engagement', 'deep-link'],
  },

  [InventoryCategory.REZ_APP_RECOMMENDATION]: {
    category: InventoryCategory.REZ_APP_RECOMMENDATION,
    name: 'ReZ App Recommendations',
    description: 'AI-powered product/service recommendations',
    platform: Platform.APP,
    tier: 'internal_only',
    minBudget: 5000,
    estimatedReach: 200000,
    estimatedCpm: 200,
    targeting: { demographics: true, geo: true, behavioral: true, contextual: true },
    formats: ['product-card', 'recommendation'],
    features: ['ai-powered', 'personalized', 'high-conversion'],
  },

  [InventoryCategory.REZ_RIDE_INAPP]: {
    category: InventoryCategory.REZ_RIDE_INAPP,
    name: 'ReZ Ride In-App',
    description: 'Ad placements in ReZ Ride app',
    platform: Platform.APP,
    tier: 'internal_only',
    minBudget: 8000,
    estimatedReach: 150000,
    estimatedCpm: 120,
    targeting: { demographics: true, geo: true, behavioral: false, contextual: true },
    formats: ['splash', 'banner', 'interstitial'],
    features: ['captive-audience', 'travel-intent'],
  },

  [InventoryCategory.REZ_RIDE_EXTERNAL]: {
    category: InventoryCategory.REZ_RIDE_EXTERNAL,
    name: 'ReZ Ride External Screens',
    description: 'In-cab displays and external taxi advertising',
    platform: Platform.DOOH,
    tier: 'internal_only',
    minBudget: 15000,
    estimatedReach: 100000,
    estimatedCpm: 80,
    targeting: { demographics: false, geo: true, behavioral: false, contextual: true },
    formats: ['tablet-display', 'seat-back'],
    features: ['captive-audience', 'route-targeting'],
  },

  [InventoryCategory.AIRZY_TRAVELER]: {
    category: InventoryCategory.AIRZY_TRAVELER,
    name: 'Airzy Traveler Placements',
    description: 'Airport and travel placements for frequent travelers',
    platform: Platform.HOSPITALITY,
    tier: 'internal_only',
    minBudget: 20000,
    estimatedReach: 50000,
    estimatedCpm: 250,
    targeting: { demographics: true, geo: true, behavioral: true, contextual: true },
    formats: ['kiosk', 'banner', 'app-ads'],
    features: ['frequent-traveler', 'premium-audience', 'business'],
  },

  [InventoryCategory.AIRZY_LOUNGE]: {
    category: InventoryCategory.AIRZY_LOUNGE,
    name: 'Airzy Lounge Access',
    description: 'Premium lounge advertising for elite travelers',
    platform: Platform.HOSPITALITY,
    tier: 'internal_only',
    minBudget: 30000,
    estimatedReach: 10000,
    estimatedCpm: 500,
    targeting: { demographics: true, geo: true, behavioral: true, contextual: true },
    formats: ['digital-signage', 'tablet', 'ambient'],
    features: ['elite-audience', 'high-engagement', 'exclusive'],
  },

  [InventoryCategory.STAYOWN_GUEST]: {
    category: InventoryCategory.STAYOWN_GUEST,
    name: 'StayOwn Guest Placements',
    description: 'In-room and guest journey advertising',
    platform: Platform.HOSPITALITY,
    tier: 'internal_only',
    minBudget: 12000,
    estimatedReach: 40000,
    estimatedCpm: 180,
    targeting: { demographics: true, geo: true, behavioral: true, contextual: true },
    formats: ['room-tv', 'digital-frame', 'checkout-screen'],
    features: ['dwell-time', 'relaxed-mindset', 'local-discovery'],
  },

  [InventoryCategory.STAYOWN_LOBBY]: {
    category: InventoryCategory.STAYOWN_LOBBY,
    name: 'StayOwn Lobby Displays',
    description: 'Lobby and common area digital signage',
    platform: Platform.HOSPITALITY,
    tier: 'internal_only',
    minBudget: 8000,
    estimatedReach: 60000,
    estimatedCpm: 100,
    targeting: { demographics: false, geo: true, behavioral: false, contextual: true },
    formats: ['lobby-display', 'elevator-screen'],
    features: ['high-frequency', 'local-business'],
  },

  [InventoryCategory.CORPPERKS_EMPLOYEE]: {
    category: InventoryCategory.CORPPERKS_EMPLOYEE,
    name: 'CorpPerks Employee Network',
    description: 'Target employees of partner companies',
    platform: Platform.APP,
    tier: 'internal_only',
    minBudget: 10000,
    estimatedReach: 300000,
    estimatedCpm: 60,
    targeting: { demographics: true, geo: true, behavioral: true, contextual: false },
    formats: ['in-app', 'email', 'notification'],
    features: ['b2b-targeting', 'verified-employees', 'corporate'],
  },

  [InventoryCategory.BUZZLOCAL_COMMUNITY]: {
    category: InventoryCategory.BUZZLOCAL_COMMUNITY,
    name: 'BuzzLocal Community Screens',
    description: 'Hyperlocal community/neighborhood screens',
    platform: Platform.DOOH,
    tier: 'internal_only',
    minBudget: 5000,
    estimatedReach: 20000,
    estimatedCpm: 120,
    targeting: { demographics: false, geo: true, behavioral: false, contextual: true },
    formats: ['community-display', 'apartment-screen'],
    features: ['hyperlocal', 'community-trust', 'neighborhood'],
  },

  [InventoryCategory.REZNOW_MERCHANT]: {
    category: InventoryCategory.REZNOW_MERCHANT,
    name: 'REZ Now Merchant QR',
    description: 'QR placements on REZ Now merchant stores',
    platform: Platform.QR,
    tier: 'internal_only',
    minBudget: 3000,
    estimatedReach: 100000,
    estimatedCpm: 50,
    targeting: { demographics: true, geo: true, behavioral: true, contextual: true },
    formats: ['qr-code', 'store-signage'],
    features: ['direct-response', 'in-store', 'instant-redemption'],
  },

  [InventoryCategory.RISACARE_HEALTH]: {
    category: InventoryCategory.RISACARE_HEALTH,
    name: 'RisaCare Health Ecosystem',
    description: 'Healthcare and wellness placements',
    platform: Platform.APP,
    tier: 'internal_only',
    minBudget: 8000,
    estimatedReach: 80000,
    estimatedCpm: 100,
    targeting: { demographics: true, geo: true, behavioral: true, contextual: true },
    formats: ['in-app', 'notification', 'content-native'],
    features: ['health-conscious', 'wellness', 'prevention'],
  },

  [InventoryCategory.KARMA_LOYALTY]: {
    category: InventoryCategory.KARMA_LOYALTY,
    name: 'Karma Loyalty Placements',
    description: 'Karma reward and impact placements',
    platform: Platform.APP,
    tier: 'internal_only',
    minBudget: 5000,
    estimatedReach: 150000,
    estimatedCpm: 80,
    targeting: { demographics: true, geo: true, behavioral: true, contextual: true },
    formats: ['karma-feed', 'reward-card', 'impact-story'],
    features: ['loyalty-integration', 'cause-marketing', 'engagement'],
  },

  [InventoryCategory.REZ_WALLET_PLACEMENT]: {
    category: InventoryCategory.REZ_WALLET_PLACEMENT,
    name: 'ReZ Wallet Placements',
    description: 'Promotions within ReZ wallet experience',
    platform: Platform.APP,
    tier: 'internal_only',
    minBudget: 5000,
    estimatedReach: 200000,
    estimatedCpm: 70,
    targeting: { demographics: true, geo: true, behavioral: true, contextual: true },
    formats: ['wallet-banner', 'offer-card', 'push-notification'],
    features: ['transaction-context', 'wallet-integration', 'instant-offer'],
  },

  // === MARKETPLACE INVENTORY ===

  [InventoryCategory.DOOH_PUBLIC]: {
    category: InventoryCategory.DOOH_PUBLIC,
    name: 'Public DOOH Screens',
    description: 'Mall, transit, billboard, and other public displays',
    platform: Platform.DOOH,
    tier: 'marketplace',
    minBudget: 10000,
    estimatedReach: 500000,
    estimatedCpm: 50,
    targeting: { demographics: false, geo: true, behavioral: false, contextual: true },
    formats: ['digital-billboard', 'mall-display', 'transit-screen'],
    features: ['wide-reach', 'brand-awareness', 'programmatic'],
  },

  [InventoryCategory.QR_PUBLIC]: {
    category: InventoryCategory.QR_PUBLIC,
    name: 'Public QR Campaigns',
    description: 'QR code campaigns for offline-to-online tracking',
    platform: Platform.QR,
    tier: 'marketplace',
    minBudget: 2000,
    estimatedReach: 50000,
    estimatedCpm: 40,
    targeting: { demographics: true, geo: true, behavioral: true, contextual: true },
    formats: ['qr-poster', 'qr-packaging', 'qr-storefront'],
    features: ['offline-tracking', 'scan-to-engage', 'coin-rewards'],
  },

  [InventoryCategory.CREATOR_PUBLIC]: {
    category: InventoryCategory.CREATOR_PUBLIC,
    name: 'Creator/Influencer Inventory',
    description: 'Sponsored content via creator partnerships',
    platform: Platform.CREATOR,
    tier: 'marketplace',
    minBudget: 10000,
    estimatedReach: 100000,
    estimatedCpm: 200,
    targeting: { demographics: true, geo: false, behavioral: true, contextual: true },
    formats: ['instagram-story', 'youtube-shorts', 'tiktok-native'],
    features: ['influencer-authentic', 'social-proof', 'ugc-style'],
  },

  [InventoryCategory.WHATSAPP_PUBLIC]: {
    category: InventoryCategory.WHATSAPP_PUBLIC,
    name: 'WhatsApp Commerce Placements',
    description: 'Promotional messages via WhatsApp Business',
    platform: Platform.WHATSAPP,
    tier: 'marketplace',
    minBudget: 5000,
    estimatedReach: 200000,
    estimatedCpm: 30,
    targeting: { demographics: true, geo: true, behavioral: true, contextual: true },
    formats: ['promotional', 'catalog', 'abandoned-cart'],
    features: ['high-open-rate', 'direct-communication', 'transactional'],
  },

  [InventoryCategory.EVENT_PUBLIC]: {
    category: InventoryCategory.EVENT_PUBLIC,
    name: 'Event Inventory',
    description: 'On-site advertising at events and venues',
    platform: Platform.EVENT,
    tier: 'marketplace',
    minBudget: 20000,
    estimatedReach: 10000,
    estimatedCpm: 300,
    targeting: { demographics: false, geo: true, behavioral: false, contextual: true },
    formats: ['event-banner', 'stage-branding', 'registration-screen'],
    features: ['captive-audience', 'event-context', 'high-engagement'],
  },

  [InventoryCategory.BUZZLOCAL_PUBLIC]: {
    category: InventoryCategory.BUZZLOCAL_PUBLIC,
    name: 'BuzzLocal Public',
    description: 'Public community screen inventory',
    platform: Platform.DOOH,
    tier: 'marketplace',
    minBudget: 3000,
    estimatedReach: 15000,
    estimatedCpm: 80,
    targeting: { demographics: false, geo: true, behavioral: false, contextual: true },
    formats: ['community-screen', 'neighborhood-display'],
    features: ['hyperlocal', 'community-trust'],
  },

  [InventoryCategory.SOCIETY_PUBLIC]: {
    category: InventoryCategory.SOCIETY_PUBLIC,
    name: 'Society/Apartment Screens',
    description: 'Residential building common area displays',
    platform: Platform.DOOH,
    tier: 'marketplace',
    minBudget: 5000,
    estimatedReach: 30000,
    estimatedCpm: 60,
    targeting: { demographics: false, geo: true, behavioral: false, contextual: true },
    formats: ['lobby-display', 'elevator-screen', 'common-area'],
    features: ['residential-reach', 'family-demographic'],
  },

  [InventoryCategory.HOSPITALITY_PUBLIC]: {
    category: InventoryCategory.HOSPITALITY_PUBLIC,
    name: 'Public Hospitality Displays',
    description: 'Hotel and restaurant public screens',
    platform: Platform.HOSPITALITY,
    tier: 'marketplace',
    minBudget: 8000,
    estimatedReach: 25000,
    estimatedCpm: 100,
    targeting: { demographics: false, geo: true, behavioral: false, contextual: true },
    formats: ['restaurant-tv', 'hotel-lobby'],
    features: ['dining-context', 'travel-context'],
  },

  [InventoryCategory.RETAIL_PUBLIC]: {
    category: InventoryCategory.RETAIL_PUBLIC,
    name: 'Retail Shelf Displays',
    description: 'Digital displays at retail locations',
    platform: Platform.DOOH,
    tier: 'marketplace',
    minBudget: 10000,
    estimatedReach: 100000,
    estimatedCpm: 45,
    targeting: { demographics: false, geo: true, behavioral: false, contextual: true },
    formats: ['shelf-display', 'checkout-screen', 'endcap-digital'],
    features: ['purchase-context', 'point-of-decision'],
  },
};

// ============================================================================
// INVENTORY SERVICE
// ============================================================================

export class InventoryService {
  /**
   * Get all inventory categories
   */
  getAllInventory(): InventoryDefinition[] {
    return Object.values(INVENTORY_CATALOG);
  }

  /**
   * Get inventory by category
   */
  getInventory(category: InventoryCategory): InventoryDefinition | undefined {
    return INVENTORY_CATALOG[category];
  }

  /**
   * Get inventory by platform
   */
  getInventoryByPlatform(platform: Platform): InventoryDefinition[] {
    return Object.values(INVENTORY_CATALOG).filter(inv => inv.platform === platform);
  }

  /**
   * Get inventory accessible to tenant type
   */
  getInventoryForTenant(tenantType: TenantType): InventoryDefinition[] {
    if (tenantType === TenantType.REZ_INTERNAL) {
      return Object.values(INVENTORY_CATALOG);
    }
    return Object.values(INVENTORY_CATALOG).filter(inv => inv.tier === 'marketplace');
  }

  /**
   * Get internal-only inventory
   */
  getInternalInventory(): InventoryDefinition[] {
    return Object.values(INVENTORY_CATALOG).filter(inv => inv.tier === 'internal_only');
  }

  /**
   * Get marketplace inventory
   */
  getMarketplaceInventory(): InventoryDefinition[] {
    return Object.values(INVENTORY_CATALOG).filter(inv => inv.tier === 'marketplace');
  }

  /**
   * Get inventory by category
   */
  getCategories(): InventoryCategory[] {
    return Object.values(INVENTORY_CATALOG).map(inv => inv.category);
  }

  /**
   * Get platforms
   */
  getPlatforms(): Platform[] {
    return Object.values(Platform);
  }

  /**
   * Check if inventory requires internal access
   */
  isInternalOnly(category: InventoryCategory): boolean {
    const inv = INVENTORY_CATALOG[category];
    return inv?.tier === 'internal_only';
  }

  /**
   * Get inventory summary
   */
  getSummary(): {
    total: number;
    internal: number;
    marketplace: number;
    byPlatform: Record<Platform, number>;
  } {
    const all = Object.values(INVENTORY_CATALOG);
    const byPlatform: Record<Platform, number> = {
      [Platform.APP]: 0,
      [Platform.DOOH]: 0,
      [Platform.QR]: 0,
      [Platform.WHATSAPP]: 0,
      [Platform.CREATOR]: 0,
      [Platform.EVENT]: 0,
      [Platform.HOSPITALITY]: 0,
    };

    all.forEach(inv => {
      byPlatform[inv.platform]++;
    });

    return {
      total: all.length,
      internal: all.filter(i => i.tier === 'internal_only').length,
      marketplace: all.filter(i => i.tier === 'marketplace').length,
      byPlatform,
    };
  }
}

// Export singleton
export const inventoryService = new InventoryService();
