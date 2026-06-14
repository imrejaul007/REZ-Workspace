'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'dairy_free'
  | 'nut_free'
  | 'halal'
  | 'kosher'
  | 'low_carb'
  | 'keto'
  | 'paleo';

export type SpicyPreference = 'mild' | 'medium' | 'hot' | 'extra_hot';
export type PortionPreference = 'regular' | 'large' | 'small';

export interface UserPreference {
  /** Food allergies that user wants to be warned about */
  allergies: string[];
  /** Active dietary restrictions */
  dietaryRestrictions: DietaryRestriction[];
  /** Preferred spice level */
  spicyPreference: SpicyPreference;
  /** Preferred portion size */
  portionPreference: PortionPreference;
  /** Favorite dish IDs for quick reorder */
  favoriteDishIds: string[];
  /** Store-specific favorite dishes: storeSlug -> menuItemId[] */
  storeFavorites: Record<string, string[]>;
  /** Preferred payment method */
  preferredPaymentMethod: 'wallet' | 'razorpay' | 'upi' | 'counter' | null;
  /** Preferred order type per store */
  preferredOrderTypes: Record<string, 'dine_in' | 'takeaway' | 'delivery'>;
  /** Preferred pickup time (minutes from now) */
  preferredPickupMinutes: number;
  /** Last updated timestamp */
  updatedAt: string;
}

interface UserPreferencesState extends UserPreference {
  setAllergies: (allergies: string[]) => void;
  addAllergy: (allergy: string) => void;
  removeAllergy: (allergy: string) => void;
  setDietaryRestrictions: (restrictions: DietaryRestriction[]) => void;
  toggleDietaryRestriction: (restriction: DietaryRestriction) => void;
  setSpicyPreference: (pref: SpicyPreference) => void;
  setPortionPreference: (pref: PortionPreference) => void;
  addFavoriteDish: (dishId: string, storeSlug?: string) => void;
  removeFavoriteDish: (dishId: string, storeSlug?: string) => void;
  isFavoriteDish: (dishId: string) => boolean;
  setPreferredPaymentMethod: (method: UserPreference['preferredPaymentMethod']) => void;
  setPreferredOrderType: (storeSlug: string, orderType: 'dine_in' | 'takeaway' | 'delivery') => void;
  setPreferredPickupMinutes: (minutes: number) => void;
  clearPreferences: () => void;
  getProfile: () => UserPreference;
}

const DEFAULT_PREFERENCES: UserPreference = {
  allergies: [],
  dietaryRestrictions: [],
  spicyPreference: 'medium',
  portionPreference: 'regular',
  favoriteDishIds: [],
  storeFavorites: {},
  preferredPaymentMethod: null,
  preferredOrderTypes: {},
  preferredPickupMinutes: 30,
  updatedAt: new Date().toISOString(),
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PREFERENCES,

      setAllergies: (allergies) => set({ allergies, updatedAt: new Date().toISOString() }),

      addAllergy: (allergy) => {
        const current = get().allergies;
        if (!current.includes(allergy)) {
          set({ allergies: [...current, allergy], updatedAt: new Date().toISOString() });
        }
      },

      removeAllergy: (allergy) => {
        set({
          allergies: get().allergies.filter((a) => a !== allergy),
          updatedAt: new Date().toISOString(),
        });
      },

      setDietaryRestrictions: (restrictions) => set({ dietaryRestrictions: restrictions, updatedAt: new Date().toISOString() }),

      toggleDietaryRestriction: (restriction) => {
        const current = get().dietaryRestrictions;
        const updated = current.includes(restriction)
          ? current.filter((r) => r !== restriction)
          : [...current, restriction];
        set({ dietaryRestrictions: updated, updatedAt: new Date().toISOString() });
      },

      setSpicyPreference: (pref) => set({ spicyPreference: pref, updatedAt: new Date().toISOString() }),

      setPortionPreference: (pref) => set({ portionPreference: pref, updatedAt: new Date().toISOString() }),

      addFavoriteDish: (dishId, storeSlug) => {
        const { favoriteDishIds, storeFavorites } = get();
        if (!favoriteDishIds.includes(dishId)) {
          set({ favoriteDishIds: [...favoriteDishIds, dishId], updatedAt: new Date().toISOString() });
        }
        if (storeSlug) {
          const storeFavs = storeFavorites[storeSlug] || [];
          if (!storeFavs.includes(dishId)) {
            set({
              storeFavorites: { ...storeFavorites, [storeSlug]: [...storeFavs, dishId] },
              updatedAt: new Date().toISOString(),
            });
          }
        }
      },

      removeFavoriteDish: (dishId, storeSlug) => {
        set({
          favoriteDishIds: get().favoriteDishIds.filter((id) => id !== dishId),
          updatedAt: new Date().toISOString(),
        });
        if (storeSlug) {
          const storeFavs = get().storeFavorites[storeSlug] || [];
          set({
            storeFavorites: {
              ...get().storeFavorites,
              [storeSlug]: storeFavs.filter((id) => id !== dishId),
            },
            updatedAt: new Date().toISOString(),
          });
        }
      },

      isFavoriteDish: (dishId) => get().favoriteDishIds.includes(dishId),

      setPreferredPaymentMethod: (method) => set({ preferredPaymentMethod: method, updatedAt: new Date().toISOString() }),

      setPreferredOrderType: (storeSlug, orderType) => {
        set({
          preferredOrderTypes: { ...get().preferredOrderTypes, [storeSlug]: orderType },
          updatedAt: new Date().toISOString(),
        });
      },

      setPreferredPickupMinutes: (minutes) => set({ preferredPickupMinutes: minutes, updatedAt: new Date().toISOString() }),

      clearPreferences: () => set({ ...DEFAULT_PREFERENCES, updatedAt: new Date().toISOString() }),

      getProfile: () => ({
        allergies: get().allergies,
        dietaryRestrictions: get().dietaryRestrictions,
        spicyPreference: get().spicyPreference,
        portionPreference: get().portionPreference,
        favoriteDishIds: get().favoriteDishIds,
        storeFavorites: get().storeFavorites,
        preferredPaymentMethod: get().preferredPaymentMethod,
        preferredOrderTypes: get().preferredOrderTypes,
        preferredPickupMinutes: get().preferredPickupMinutes,
        updatedAt: get().updatedAt,
      }),
    }),
    { name: 'rez-user-preferences' }
  )
);
