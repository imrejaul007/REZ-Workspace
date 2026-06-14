// Customer segmentation thresholds
export const SEGMENTATION = {
  VIP: {
    minVisits: 10,
    minSpend: 50000, // in cents
    minLifetimeValue: 100000,
  },
  REGULAR: {
    minVisits: 3,
    minSpend: 5000,
    minLifetimeValue: 10000,
  },
  LAPSED: {
    daysSinceLastVisit: 90,
  },
} as const;

// Loyalty points configuration
export const LOYALTY = {
  pointsPerRupee: 1, // 1 point per rupee spent
  pointsToRupeeRatio: 100, // 100 points = 1 rupee
  welcomeBonus: 100,
  birthdayBonus: 200,
  anniversaryBonus: 150,
} as const;

// Campaign types
export const CAMPAIGN_TYPES = {
  BIRTHDAY: 'birthday',
  ANNIVERSARY: 'anniversary',
  REENGAGEMENT: 'reengagement',
  LOYALTY_REWARD: 'loyalty_reward',
  NEW_MENU: 'new_menu',
  SPECIAL_OFFER: 'special_offer',
} as const;

// Outreach channels
export const OUTREACH_CHANNELS = {
  WHATSAPP: 'whatsapp',
  SMS: 'sms',
  EMAIL: 'email',
} as const;

// Segment types
export type SegmentType = 'VIP' | 'REGULAR' | 'LAPSED' | 'NEW';
export type CampaignType = keyof typeof CAMPAIGN_TYPES;
export type OutreachChannel = keyof typeof OUTREACH_CHANNELS;
