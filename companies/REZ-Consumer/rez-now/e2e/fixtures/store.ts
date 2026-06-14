import type { StoreInfo, MenuCategory } from '../../lib/types';

// ── Shared store defaults ────────────────────────────────────────────────────

const OPERATING_HOURS = {
  monday:    { open: '09:00', close: '22:00' },
  tuesday:   { open: '09:00', close: '22:00' },
  wednesday: { open: '09:00', close: '22:00' },
  thursday:  { open: '09:00', close: '22:00' },
  friday:    { open: '09:00', close: '23:00' },
  saturday:  { open: '10:00', close: '23:00' },
  sunday:    { open: '10:00', close: '22:00' },
};

// ── Order & Pay — menu-bearing store ─────────────────────────────────────────

export const mockStore: StoreInfo = {
  id: 'store-001',
  name: 'Test Cafe',
  slug: 'test-cafe',
  logo: null,
  banner: null,
  address: '42 MG Road, Bengaluru, Karnataka 560001',
  phone: 'testcafe@upi',
  storeType: 'cafe',
  hasMenu: true,
  isProgramMerchant: true,
  estimatedPrepMinutes: 15,
  gstEnabled: true,
  gstPercent: 5,
  isOpen: true,
  operatingHours: OPERATING_HOURS,
  googlePlaceId: null,
  rewardRules: {
    baseCashbackPercent: 1,
    coinsEnabled: true,
  },
  activePromos: [
    { text: '10% off on orders above ₹300', code: 'SAVE10', bgColor: '#f0f4ff' },
  ],
};

export const mockMenuItem = {
  id: 'item-1',
  name: 'Espresso',
  description: 'Rich and bold single-origin espresso shot.',
  price: 15000, // ₹150 in paise
  originalPrice: null,
  isVeg: true,
  isAvailable: true,
  spicyLevel: 0 as const,
  image: null,
  customizations: [],
};

export const mockMenuItemNonVeg = {
  id: 'item-2',
  name: 'Chicken Sandwich',
  description: 'Grilled chicken with fresh veggies in ciabatta.',
  price: 25000, // ₹250 in paise
  originalPrice: 28000,
  isVeg: false,
  isAvailable: true,
  spicyLevel: 1 as const,
  image: null,
  customizations: [],
};

export const mockMenuItemUnavailable = {
  id: 'item-3',
  name: 'Cold Brew',
  description: 'Slow-steeped for 12 hours.',
  price: 18000,
  originalPrice: null,
  isVeg: true,
  isAvailable: false,
  spicyLevel: 0 as const,
  image: null,
  customizations: [],
};

export const mockCategories: MenuCategory[] = [
  {
    id: 'cat-1',
    name: 'Beverages',
    sortOrder: 1,
    items: [mockMenuItem, mockMenuItemUnavailable],
  },
  {
    id: 'cat-2',
    name: 'Food',
    sortOrder: 2,
    items: [mockMenuItemNonVeg],
  },
];

/**
 * Full API response shape returned by GET /api/web-ordering/store/:slug
 */
export const mockStoreMenuApiResponse = {
  success: true,
  data: {
    store: mockStore,
    categories: mockCategories,
    promotions: [],
  },
};

// ── Scan & Pay — menu-less store ─────────────────────────────────────────────

export const mockScanPayStore: StoreInfo = {
  id: 'store-002',
  name: 'Pay Store',
  slug: 'pay-store',
  logo: null,
  banner: null,
  address: '10 Brigade Road, Bengaluru, Karnataka 560001',
  phone: 'paystore@upi',
  storeType: 'retail',
  hasMenu: false,
  isProgramMerchant: true,
  estimatedPrepMinutes: 0,
  gstEnabled: false,
  gstPercent: 0,
  isOpen: true,
  operatingHours: OPERATING_HOURS,
  googlePlaceId: null,
  rewardRules: {
    baseCashbackPercent: 2,
    coinsEnabled: true,
  },
  activePromos: [],
};

/**
 * Full API response shape returned by GET /api/store-payment/store/:slug
 */
export const mockScanPayStoreApiResponse = {
  success: true,
  data: mockScanPayStore,
};

// ── Wallet ────────────────────────────────────────────────────────────────────

export const mockWalletBalance = {
  success: true,
  data: {
    coins: 500,
    rupees: 5,
    tier: 'silver' as const,
  },
};

// ── Cart validation ───────────────────────────────────────────────────────────

export const mockCartValidationOk = {
  success: true,
  data: { unavailableItems: [] },
};
