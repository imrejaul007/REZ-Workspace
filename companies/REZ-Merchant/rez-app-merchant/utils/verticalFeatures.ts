/**
 * verticalFeatures.ts — Vertical + Mode-based feature visibility
 *
 * Maps business verticals (restaurant, salon, hotel, grocery, general)
 * AND merchant mode (simple | growth | advanced) to the set of features
 * each merchant should see.
 *
 * Mode is stored in merchant preferences (AsyncStorage).
 * New merchants default to 'simple'. Existing merchants stay at 'advanced' until they opt in.
 */

export type BusinessVertical = 'restaurant' | 'salon' | 'hotel' | 'grocery' | 'general';
export type MerchantMode = 'simple' | 'growth' | 'advanced';

/** Canonical feature keys that map to dashboard routes / tabs.
 *  Exported so UI components can type-check their modeGate guards. */
export type FeatureKey =
  | 'orders'
  | 'menu'
  | 'pos'
  | 'kds'
  | 'dine-in'
  | 'recipes'
  | 'discounts'
  | 'categories'
  | 'analytics'
  | 'team'
  | 'customers'
  | 'payments'
  | 'reports'
  | 'appointments'
  | 'services'
  | 'service-packages'
  | 'consultation-forms'
  | 'staff-shifts'
  | 'treatment-rooms'
  | 'hotel-ota'
  | 'products'
  | 'inventory'
  | 'purchase-orders'
  | 'marketing'
  | 'campaigns'
  | 'loyalty'
  | 'broadcast'
  | 'settings';

type FeatureMap = Record<BusinessVertical, Record<MerchantMode, FeatureKey[]>>;

const VERTICAL_FEATURES: FeatureMap = {
  restaurant: {
    simple: ['pos', 'customers', 'orders'],
    growth: ['pos', 'customers', 'orders', 'discounts', 'analytics', 'loyalty', 'broadcast'],
    advanced: [
      'orders',
      'menu',
      'pos',
      'kds',
      'dine-in',
      'recipes',
      'discounts',
      'categories',
      'analytics',
      'team',
      'customers',
      'payments',
      'reports',
      'loyalty',
      'broadcast',
      'campaigns',
    ],
  },
  salon: {
    simple: ['appointments', 'customers', 'team'],
    growth: ['appointments', 'services', 'customers', 'team', 'analytics', 'loyalty', 'broadcast'],
    advanced: [
      'appointments',
      'services',
      'service-packages',
      'consultation-forms',
      'staff-shifts',
      'customers',
      'analytics',
      'team',
      'payments',
      'reports',
      'loyalty',
      'broadcast',
      'campaigns',
    ],
  },
  hotel: {
    simple: ['hotel-ota', 'customers', 'orders'],
    growth: ['hotel-ota', 'orders', 'customers', 'analytics', 'loyalty'],
    advanced: [
      'hotel-ota',
      'orders',
      'customers',
      'analytics',
      'team',
      'payments',
      'reports',
      'loyalty',
    ],
  },
  grocery: {
    simple: ['pos', 'customers', 'products'],
    growth: ['pos', 'products', 'customers', 'orders', 'analytics', 'loyalty'],
    advanced: [
      'products',
      'inventory',
      'categories',
      'purchase-orders',
      'pos',
      'orders',
      'customers',
      'analytics',
      'team',
      'payments',
      'reports',
    ],
  },
  general: {
    simple: ['orders', 'products', 'customers'],
    growth: ['orders', 'products', 'customers', 'analytics', 'loyalty', 'broadcast'],
    advanced: [
      'orders',
      'products',
      'analytics',
      'marketing',
      'campaigns',
      'pos',
      'customers',
      'team',
      'payments',
      'reports',
      'discounts',
      'loyalty',
      'broadcast',
      'settings',
    ],
  },
};

/**
 * Normalise a raw businessCategory string to a known vertical.
 * Falls back to 'general' when the category is unrecognised.
 */
function normaliseVertical(businessCategory: string): BusinessVertical {
  const lower = (businessCategory ?? '').toLowerCase().trim();

  if (['restaurant', 'food', 'cafe', 'bakery', 'cloud kitchen'].includes(lower)) {
    return 'restaurant';
  }
  if (['salon', 'spa', 'beauty', 'barber', 'wellness'].includes(lower)) {
    return 'salon';
  }
  if (['hotel', 'hostel', 'resort', 'lodge', 'motel'].includes(lower)) {
    return 'hotel';
  }
  if (['grocery', 'supermarket', 'convenience', 'kirana'].includes(lower)) {
    return 'grocery';
  }
  return 'general';
}

/**
 * Check whether a specific feature should be visible for a given vertical + mode.
 */
export function isFeatureVisibleForVertical(
  feature: FeatureKey,
  businessCategory: string,
  mode: MerchantMode = 'advanced'
): boolean {
  const vertical = normaliseVertical(businessCategory);
  return VERTICAL_FEATURES[vertical][mode].includes(feature);
}

/**
 * Return the full list of visible features for a given vertical + mode.
 */
export function getVisibleFeatures(
  businessCategory: string,
  mode: MerchantMode = 'advanced'
): FeatureKey[] {
  const vertical = normaliseVertical(businessCategory);
  return [...VERTICAL_FEATURES[vertical][mode]];
}

/**
 * Return the resolved vertical key for a raw businessCategory string.
 */
export function resolveVertical(businessCategory: string): BusinessVertical {
  return normaliseVertical(businessCategory);
}

/**
 * Get features for a specific mode without needing businessCategory.
 * Use when you only care about mode-level filtering.
 */
export function getFeaturesForMode(mode: MerchantMode, vertical: BusinessVertical): FeatureKey[] {
  return [...VERTICAL_FEATURES[vertical][mode]];
}

/**
 * All available modes in display order.
 */
export const MERCHANT_MODES: { value: MerchantMode; label: string; description: string }[] = [
  { value: 'simple', label: 'Simple', description: 'Core tools only' },
  { value: 'growth', label: 'Growth', description: 'Marketing + loyalty' },
  { value: 'advanced', label: 'Advanced', description: 'Full feature set' },
];
