/**
 * useMerchantCapabilities
 *
 * Derives which feature categories are relevant for the active store based on:
 *   1. serviceCapabilities flags (explicit, set during onboarding)
 *   2. category slug/name heuristics (fallback when capabilities are sparse)
 *
 * This is the single source of truth for category-based feature gating in
 * the merchant app. Add new capabilities here; consume them anywhere.
 */

import { useMemo } from 'react';
import { useStore } from '@/contexts/StoreContext';

export interface MerchantCapabilities {
  // ── Core type flags ───────────────────────────────────────────────────────
  isFood: boolean; // Restaurant, café, bakery, cloud kitchen, QSR
  isService: boolean; // Salon, spa, beauty, barbershop
  isConsultation: boolean; // Clinic, doctor, dentist, tutor, lawyer
  isRetail: boolean; // Boutique, pharmacy, hardware, electronics
  isTravelOrEvent: boolean; // Travel agency, hotel, event venue

  // ── Feature flags derived from type ───────────────────────────────────────
  hasKitchenDisplay: boolean;
  hasDineIn: boolean;
  hasTableBookings: boolean;
  hasAggregatorOrders: boolean;
  hasRecipeCosting: boolean;
  hasWasteTracking: boolean;
  hasFoodCostReport: boolean;
  hasMenuEngineering: boolean;
  hasWaiterMode: boolean;

  hasAppointments: boolean;
  hasStaffRota: boolean;
  hasServiceListing: boolean;

  hasInventoryManagement: boolean;
  hasPurchaseOrders: boolean;
  hasSuppliers: boolean;

  // ── Universal (all merchant types) ────────────────────────────────────────
  hasPOS: boolean;
  hasOrders: boolean;
  hasProducts: boolean;
  hasAnalytics: boolean;
  hasCRM: boolean;
  hasMarketing: boolean;
  hasDocuments: boolean;
  hasFinance: boolean;
  hasTeam: boolean;

  // ── Raw derived type string for display ───────────────────────────────────
  merchantType: 'food' | 'service' | 'consultation' | 'retail' | 'travel' | 'general';
  merchantTypeLabel: string;
}

// Slug/name patterns — case-insensitive substring match
const FOOD_PATTERNS = [
  'food',
  'restaurant',
  'cafe',
  'café',
  'kitchen',
  'bakery',
  'qsr',
  'dhaba',
  'biryani',
  'pizza',
  'burger',
  'juice',
  'tea',
  'snack',
  'sweet',
  'mithai',
  'caterer',
  'tiffin',
];
const SERVICE_PATTERNS = [
  'salon',
  'spa',
  'beauty',
  'barber',
  'hair',
  'nail',
  'tattoo',
  'massage',
  'grooming',
  'parlour',
  'parlor',
  'threading',
  'waxing',
  'makeup',
  'bridal',
];
const CONSULTATION_PATTERNS = [
  'clinic',
  'doctor',
  'dentist',
  'dental',
  'physio',
  'health',
  'medic',
  'hospital',
  'optician',
  'eye care',
  'tutor',
  'coaching',
  'lawyer',
  'ca ',
  'chartered',
  'consultant',
  'therapist',
];
const RETAIL_PATTERNS = [
  'retail',
  'shop',
  'store',
  'boutique',
  'fashion',
  'cloth',
  'apparel',
  'pharmacy',
  'chemist',
  'hardware',
  'electronics',
  'grocery',
  'kirana',
  'stationery',
  'book',
  'toy',
  'sport',
  'jewel',
  'furniture',
  'gift',
];
const TRAVEL_PATTERNS = [
  'travel',
  'tour',
  'hotel',
  'resort',
  'stay',
  'hostel',
  'event',
  'venue',
  'banquet',
  'wedding',
  'party',
];

function matchesAny(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

function deriveMerchantType(
  categorySlug: string,
  categoryName: string,
  capabilities?: {
    dineIn?: { enabled?: boolean };
    tableBooking?: { enabled?: boolean };
    homeDelivery?: { enabled?: boolean };
  }
): MerchantCapabilities['merchantType'] {
  const combined = `${categorySlug} ${categoryName}`;

  // Capability-first check (strongest signal)
  if (capabilities?.dineIn?.enabled || capabilities?.tableBooking?.enabled) return 'food';
  if (capabilities?.homeDelivery?.enabled && matchesAny(combined, FOOD_PATTERNS)) return 'food';

  if (matchesAny(combined, FOOD_PATTERNS)) return 'food';
  if (matchesAny(combined, SERVICE_PATTERNS)) return 'service';
  if (matchesAny(combined, CONSULTATION_PATTERNS)) return 'consultation';
  if (matchesAny(combined, RETAIL_PATTERNS)) return 'retail';
  if (matchesAny(combined, TRAVEL_PATTERNS)) return 'travel';
  return 'general';
}

const TYPE_LABELS: Record<MerchantCapabilities['merchantType'], string> = {
  food: 'Restaurant / Food',
  service: 'Salon / Beauty',
  consultation: 'Clinic / Consultation',
  retail: 'Retail / Shop',
  travel: 'Travel / Events',
  general: 'Business',
};

export function useMerchantCapabilities(): MerchantCapabilities {
  const { activeStore } = useStore();

  return useMemo<MerchantCapabilities>(() => {
    const slug = activeStore?.category?.slug || '';
    const name = activeStore?.category?.name || '';
    const caps = activeStore?.serviceCapabilities;

    const type = deriveMerchantType(slug, name, caps);

    const isFood = type === 'food';
    const isService = type === 'service';
    const isConsultation = type === 'consultation';
    const isRetail = type === 'retail';
    const isTravelOrEvent = type === 'travel';

    return {
      isFood,
      isService,
      isConsultation,
      isRetail,
      isTravelOrEvent,

      // Food-only features
      hasKitchenDisplay: isFood,
      hasDineIn: isFood && caps?.dineIn?.enabled !== false,
      hasTableBookings: isFood && caps?.tableBooking?.enabled !== false,
      hasAggregatorOrders: isFood,
      hasRecipeCosting: isFood,
      hasWasteTracking: isFood,
      hasFoodCostReport: isFood,
      hasMenuEngineering: isFood,
      hasWaiterMode: isFood && caps?.dineIn?.enabled !== false,

      // Service / consultation features
      hasAppointments: isService || isConsultation,
      hasStaffRota: isService || isConsultation,
      hasServiceListing: isService || isConsultation || isTravelOrEvent,

      // Retail / supply chain features
      hasInventoryManagement: isRetail || isFood,
      hasPurchaseOrders: isRetail || isFood,
      hasSuppliers: isRetail || isFood,

      // Universal
      hasPOS: true,
      hasOrders: true,
      hasProducts: !isConsultation, // consultations use services, not products
      hasAnalytics: true,
      hasCRM: true,
      hasMarketing: true,
      hasDocuments: true,
      hasFinance: true,
      hasTeam: true,

      merchantType: type,
      merchantTypeLabel: TYPE_LABELS[type],
    };
  }, [activeStore]);
}
