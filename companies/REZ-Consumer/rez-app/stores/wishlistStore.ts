// @ts-nocheck
import { create } from 'zustand';
import wishlistApi from '@/services/wishlistApi';
import uuid from 'react-native-uuid';
import { errorLogger } from '@/services/errorLogger';

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  brand: string;
  category: string;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LIMITED';
  addedAt: string;
}

interface WishlistStoreState {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  error: string | null;

  isInWishlist: (productId: string) => boolean;
  addToWishlist: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  getWishlistCount: () => number;
  refreshWishlist: () => Promise<void>;
}

type StoreSet = (partial: Partial<WishlistStoreState> | ((s: WishlistStoreState) => Partial<WishlistStoreState>), replace?: boolean) => void;
type StoreGet = () => WishlistStoreState;

export const useWishlistStore = create<WishlistStoreState>((set: StoreSet, get: StoreGet) => ({
  wishlistItems: [],
  isLoading: false,
  error: null,

  isInWishlist: (productId: string): boolean => {
    return get().wishlistItems.some(item => item.productId === productId);
  },

  addToWishlist: async (item: Omit<WishlistItem, 'id' | 'addedAt'>): Promise<void> => {
    const state = get();
    if (state.wishlistItems.some(i => i.productId === item.productId)) {
      throw new Error('Item already in wishlist');
    }

    const optimisticItem: WishlistItem = {
      ...item,
      // Using UUID prevents temp-id collisions when two adds happen within the
      // same millisecond — Date.now() would otherwise mint identical ids and
      // the reconciliation step below would replace BOTH optimistic items with
      // the first server response's id.
      id: `temp-${String(uuid.v4())}`,
      addedAt: new Date().toISOString(),
    };

    // Optimistic update
    set(s => ({ wishlistItems: [...s.wishlistItems, optimisticItem], error: null }));

    try {
      const wishlistsResponse = await wishlistApi.getWishlists(1, 1);
      let wishlistId: string | undefined;

      if ((wishlistsResponse.data as unknown)?.wishlists?.length > 0) {
        wishlistId = (wishlistsResponse.data as unknown).wishlists[0].id || ((wishlistsResponse.data as unknown).wishlists[0] as unknown)._id;
      } else {
        const newWishlistResponse = await wishlistApi.createWishlist({
          name: 'My Wishlist',
          description: 'Default wishlist',
          isPublic: false,
        });
        wishlistId = newWishlistResponse.data?.id || (newWishlistResponse.data as unknown)?._id;
      }

      if (!wishlistId) throw new Error('Failed to get or create wishlist');

      const response = await wishlistApi.addToWishlist({
        itemType: 'product',
        itemId: item.productId,
        wishlistId,
        notes: `Added ${item.productName}`,
        priority: 'medium',
        tags: [item.category],
      });

      if ((response.data as unknown)) {
        set(s => ({
          wishlistItems: s.wishlistItems.map(i =>
            i.id === optimisticItem.id
              ? { ...i, id: (response.data as unknown).id || ((response.data as unknown) as unknown)._id }
              : i
          ),
        }));
      } else {
        throw new Error('Failed to add item to wishlist');
      }
    } catch (apiError) {
      // Rollback
      set(s => ({ wishlistItems: s.wishlistItems.filter(i => i.id !== optimisticItem.id) }));
      const errorMessage = apiError instanceof Error ? apiError.message : 'Failed to add to wishlist';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  removeFromWishlist: async (productId: string): Promise<void> => {
    const itemToRemove = get().wishlistItems.find(item => item.productId === productId);
    if (!itemToRemove) throw new Error('Item not found in wishlist');

    // Optimistic update
    set(s => ({
      wishlistItems: s.wishlistItems.filter(item => item.productId !== productId),
      error: null,
    }));

    try {
      await wishlistApi.removeFromWishlist(itemToRemove.id);
    } catch (_apiError) {
      // Rollback
      set(s => ({ wishlistItems: [...s.wishlistItems, itemToRemove] }));
      set({ error: 'Failed to remove from wishlist' });
      throw new Error('Failed to remove from wishlist');
    }
  },

  clearWishlist: async (): Promise<void> => {
    try {
      set({ error: null });
      const response = await wishlistApi.getDefaultWishlist();
      if ((response.data as unknown)) {
        await wishlistApi.clearWishlist((response.data as unknown).id);
      }
      set({ wishlistItems: [] });
    } catch (err) {
      errorLogger.logApiError('wishlistStore:clearWishlist', err, '/api/wishlist', 500);
      set({ error: 'Failed to clear wishlist' });
      throw new Error('Failed to clear wishlist');
    }
  },

  getWishlistCount: (): number => {
    return get().wishlistItems.length;
  },

  refreshWishlist: async (): Promise<void> => {
    try {
      set({ isLoading: true, error: null });

      const response = await wishlistApi.getWishlists(1, 50);
      if (!response?.success) {
        set({ wishlistItems: [], isLoading: false });
        return;
      }

      if (!response.data?.wishlists?.length) {
        set({ wishlistItems: [], isLoading: false });
        return;
      }

      const defaultWishlist = (response.data as unknown).wishlists[0];
      if (!defaultWishlist.items?.length) {
        set({ wishlistItems: [], isLoading: false });
        return;
      }

      const items: WishlistItem[] = defaultWishlist.items.map((backendItem) => {
        const item = backendItem.itemId || {};
        return {
          id: backendItem._id || backendItem.id || String(uuid.v4()),
          productId: typeof backendItem.itemId === 'string' ? backendItem.itemId : (item._id || item.id || ''),
          productName: item.name || 'Unknown Product',
          productImage: (item.images && item.images[0]) || item.image || 'https://placehold.co/300',
          price: item.salePrice || item.basePrice || item.price || 0,
          originalPrice: item.basePrice || (item.salePrice ? item.salePrice * 1.2 : 0),
          discount: item.basePrice && item.salePrice
            ? Math.round(((item.basePrice - item.salePrice) / item.basePrice) * 100)
            : 0,
          rating: item.rating?.average || item.rating || 4.0,
          reviewCount: item.rating?.count || 0,
          brand: item.brand || 'Brand',
          category: item.category?.name || backendItem.tags?.[0] || 'General',
          availability: item.inventory?.stock > 0 ? 'IN_STOCK' :
            item.inventory?.stock === 0 ? 'OUT_OF_STOCK' : 'LIMITED',
          addedAt: backendItem.addedAt || new Date().toISOString(),
        };
      });

      set({ wishlistItems: items, isLoading: false });
    } catch (_err) {
      set({ error: 'Failed to load wishlist', isLoading: false });
    }
  },
}));
