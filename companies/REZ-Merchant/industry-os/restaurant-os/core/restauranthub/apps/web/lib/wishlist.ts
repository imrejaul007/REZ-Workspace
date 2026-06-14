/**
 * Wishlist management system with localStorage persistence
 * Handles favorites for products, vendors, and real estate
 */

export interface WishlistItem {
  id: string;
  type: 'product' | 'vendor' | 'property';
  name: string;
  price?: number;
  image?: string;
  vendor?: {
    id: string;
    name: string;
  };
  addedAt: string;
  metadata?: {
    category?: string;
    rating?: number;
    inStock?: boolean;
    discount?: number;
    [key: string];
  };
}

export interface WishlistState {
  items: WishlistItem[];
  lastUpdated: string;
}

const WISHLIST_STORAGE_KEY = 'restopapa_wishlist';

export class WishlistManager {
  private wishlist: WishlistState;
  private listeners: ((wishlist: WishlistState) => void)[] = [];

  constructor() {
    this.wishlist = this.loadFromStorage();
  }

  /**
   * Load wishlist from localStorage
   */
  private loadFromStorage(): WishlistState {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return {
        items: [],
        lastUpdated: new Date().toISOString()
      };
    }

    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the structure
        if (parsed.items && Array.isArray(parsed.items)) {
          return {
            items: parsed.items,
            lastUpdated: parsed.lastUpdated || new Date().toISOString()
          };
        }
      }
    } catch (error) {
      console.error('Error loading wishlist from storage:', error);
    }

    return {
      items: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save wishlist to localStorage
   */
  private saveToStorage() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      this.notifyListeners();
      return;
    }

    try {
      this.wishlist.lastUpdated = new Date().toISOString();
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(this.wishlist));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving wishlist to storage:', error);
    }
  }

  /**
   * Subscribe to wishlist changes
   */
  subscribe(listener: (wishlist: WishlistState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.wishlist));
  }

  /**
   * Add item to wishlist
   */
  addItem(item: Omit<WishlistItem, 'addedAt'>): boolean {
    try {
      // Check if item already exists
      if (this.isInWishlist(item.id, item.type)) {
        return false;
      }

      const newItem: WishlistItem = {
        ...item,
        addedAt: new Date().toISOString()
      };

      this.wishlist.items.unshift(newItem); // Add to beginning
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error adding item to wishlist:', error);
      return false;
    }
  }

  /**
   * Remove item from wishlist
   */
  removeItem(id: string, type: WishlistItem['type']): boolean {
    try {
      const initialLength = this.wishlist.items.length;
      this.wishlist.items = this.wishlist.items.filter(
        item => !(item.id === id && item.type === type)
      );
      
      if (this.wishlist.items.length < initialLength) {
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      return false;
    }
  }

  /**
   * Toggle item in wishlist
   */
  toggleItem(item: Omit<WishlistItem, 'addedAt'>): boolean {
    if (this.isInWishlist(item.id, item.type)) {
      this.removeItem(item.id, item.type);
      return false;
    } else {
      this.addItem(item);
      return true;
    }
  }

  /**
   * Check if item is in wishlist
   */
  isInWishlist(id: string, type: WishlistItem['type']): boolean {
    return this.wishlist.items.some(item => item.id === id && item.type === type);
  }

  /**
   * Get all wishlist items
   */
  getItems(): WishlistItem[] {
    return [...this.wishlist.items];
  }

  /**
   * Get items by type
   */
  getItemsByType(type: WishlistItem['type']): WishlistItem[] {
    return this.wishlist.items.filter(item => item.type === type);
  }

  /**
   * Get wishlist statistics
   */
  getStats() {
    const items = this.wishlist.items;
    const totalItems = items.length;
    const productCount = items.filter(item => item.type === 'product').length;
    const vendorCount = items.filter(item => item.type === 'vendor').length;
    const propertyCount = items.filter(item => item.type === 'property').length;
    
    const totalValue = items
      .filter(item => item.price)
      .reduce((sum, item) => sum + (item.price || 0), 0);

    const inStockCount = items.filter(item => item.metadata?.inStock !== false).length;
    const discountedCount = items.filter(item => item.metadata?.discount && item.metadata.discount > 0).length;

    return {
      totalItems,
      productCount,
      vendorCount,
      propertyCount,
      totalValue,
      inStockCount,
      discountedCount,
      lastUpdated: this.wishlist.lastUpdated
    };
  }

  /**
   * Clear entire wishlist
   */
  clearAll(): boolean {
    try {
      this.wishlist.items = [];
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      return false;
    }
  }

  /**
   * Get recently added items (last 7 days)
   */
  getRecentlyAdded(): WishlistItem[] {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return this.wishlist.items.filter(item => 
      new Date(item.addedAt) > sevenDaysAgo
    );
  }

  /**
   * Search wishlist items
   */
  searchItems(query: string): WishlistItem[] {
    if (!query.trim()) return this.getItems();
    
    const searchTerm = query.toLowerCase();
    return this.wishlist.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.vendor?.name.toLowerCase().includes(searchTerm) ||
      item.metadata?.category?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Sort wishlist items
   */
  getSortedItems(sortBy: 'date' | 'name' | 'price' | 'rating', order: 'asc' | 'desc' = 'desc'): WishlistItem[] {
    const items = [...this.wishlist.items];
    
    items.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'rating':
          comparison = (a.metadata?.rating || 0) - (b.metadata?.rating || 0);
          break;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
    
    return items;
  }

  /**
   * Export wishlist data
   */
  exportData(): string {
    return JSON.stringify({
      ...this.wishlist,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * Import wishlist data
   */
  importData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.items && Array.isArray(parsed.items)) {
        // Merge with existing items, avoiding duplicates
        const existingIds = new Set(
          this.wishlist.items.map(item => `${item.id}-${item.type}`)
        );
        
        const newItems = parsed.items.filter((item: WishlistItem) => 
          !existingIds.has(`${item.id}-${item.type}`)
        );
        
        this.wishlist.items = [...this.wishlist.items, ...newItems];
        this.saveToStorage();
        return true;
      }
    } catch (error) {
      console.error('Error importing wishlist data:', error);
    }
    return false;
  }
}

// Singleton instance
export const wishlistManager = new WishlistManager();

// React hook for using wishlist in components
export function useWishlist() {
  const [wishlistState, setWishlistState] = React.useState<WishlistState>(
    () => wishlistManager.getItems().length > 0 ? {
      items: wishlistManager.getItems(),
      lastUpdated: wishlistManager.getStats().lastUpdated
    } : { items: [], lastUpdated: new Date().toISOString() }
  );

  React.useEffect(() => {
    const unsubscribe = wishlistManager.subscribe(setWishlistState);
    return unsubscribe;
  }, []);

  const addToWishlist = React.useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
    return wishlistManager.addItem(item);
  }, []);

  const removeFromWishlist = React.useCallback((id: string, type: WishlistItem['type']) => {
    return wishlistManager.removeItem(id, type);
  }, []);

  const toggleWishlist = React.useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
    return wishlistManager.toggleItem(item);
  }, []);

  const isInWishlist = React.useCallback((id: string, type: WishlistItem['type']) => {
    return wishlistManager.isInWishlist(id, type);
  }, []);

  return {
    wishlist: wishlistState,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    getStats: () => wishlistManager.getStats(),
    searchItems: (query: string) => wishlistManager.searchItems(query),
    getSortedItems: (sortBy: 'date' | 'name' | 'price' | 'rating', order: 'asc' | 'desc' = 'desc') =>
      wishlistManager.getSortedItems(sortBy, order),
    clearAll: () => wishlistManager.clearAll()
  };
}

// Helper function to convert marketplace items to wishlist format
export function convertToWishlistItem(
  item, 
  type: WishlistItem['type']
): Omit<WishlistItem, 'addedAt'> {
  switch (type) {
    case 'product':
      return {
        id: item.id,
        type: 'product',
        name: item.name,
        price: item.price,
        image: item.images?.[0],
        vendor: {
          id: item.vendor?.id || item.vendorId,
          name: item.vendor?.name
        },
        metadata: {
          category: item.category,
          rating: item.ratings?.average || item.rating,
          inStock: item.inStock,
          discount: item.discount?.percentage,
          unit: item.unit,
          minOrderQuantity: item.minOrderQuantity
        }
      };
      
    case 'vendor':
      return {
        id: item.id,
        type: 'vendor',
        name: item.name,
        image: item.logo,
        metadata: {
          category: item.category,
          rating: item.rating,
          location: item.location,
          verified: item.certifications?.length > 0,
          reviewCount: item.reviewCount
        }
      };
      
    case 'property':
      return {
        id: item.id,
        type: 'property',
        name: item.title,
        price: item.price,
        image: item.images?.[0],
        metadata: {
          category: item.type,
          location: `${item.location?.city}, ${item.location?.state}`,
          size: item.details?.size,
          seatingCapacity: item.details?.seatingCapacity,
          furnished: item.details?.kitchenEquipped
        }
      };
      
    default:
      throw new Error(`Unsupported wishlist item type: ${type}`);
  }
}

// Additional React import for the hook
import React from 'react';