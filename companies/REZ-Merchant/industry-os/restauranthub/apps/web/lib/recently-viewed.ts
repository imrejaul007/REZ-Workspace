/**
 * Recently viewed items tracking system with localStorage persistence
 * Tracks user browsing history for products, vendors, and properties
 */

export interface RecentlyViewedItem {
  id: string;
  type: 'product' | 'vendor' | 'property';
  name: string;
  price?: number;
  image?: string;
  vendor?: {
    id: string;
    name: string;
  };
  viewedAt: string;
  metadata?: {
    category?: string;
    rating?: number;
    location?: string;
    [key: string];
  };
}

export interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  lastUpdated: string;
}

const RECENTLY_VIEWED_STORAGE_KEY = 'restopapa_recently_viewed';
const MAX_RECENTLY_VIEWED_ITEMS = 50; // Keep last 50 items

export class RecentlyViewedManager {
  private recentlyViewed: RecentlyViewedState;
  private listeners: ((state: RecentlyViewedState) => void)[] = [];

  constructor() {
    this.recentlyViewed = this.loadFromStorage();
  }

  /**
   * Load recently viewed from localStorage
   */
  private loadFromStorage(): RecentlyViewedState {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.items && Array.isArray(parsed.items)) {
          return {
            items: parsed.items,
            lastUpdated: parsed.lastUpdated || new Date().toISOString()
          };
        }
      }
    } catch (error) {
      console.error('Error loading recently viewed from storage:', error);
    }
    
    return {
      items: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save recently viewed to localStorage
   */
  private saveToStorage() {
    try {
      this.recentlyViewed.lastUpdated = new Date().toISOString();
      localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(this.recentlyViewed));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving recently viewed to storage:', error);
    }
  }

  /**
   * Subscribe to recently viewed changes
   */
  subscribe(listener: (state: RecentlyViewedState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.recentlyViewed));
  }

  /**
   * Add item to recently viewed
   */
  addItem(item: Omit<RecentlyViewedItem, 'viewedAt'>): boolean {
    try {
      // Remove existing item if present
      this.recentlyViewed.items = this.recentlyViewed.items.filter(
        existing => !(existing.id === item.id && existing.type === item.type)
      );

      // Add to beginning of array
      const newItem: RecentlyViewedItem = {
        ...item,
        viewedAt: new Date().toISOString()
      };

      this.recentlyViewed.items.unshift(newItem);

      // Keep only the most recent items
      if (this.recentlyViewed.items.length > MAX_RECENTLY_VIEWED_ITEMS) {
        this.recentlyViewed.items = this.recentlyViewed.items.slice(0, MAX_RECENTLY_VIEWED_ITEMS);
      }

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error adding item to recently viewed:', error);
      return false;
    }
  }

  /**
   * Get all recently viewed items
   */
  getItems(): RecentlyViewedItem[] {
    return [...this.recentlyViewed.items];
  }

  /**
   * Get recently viewed items by type
   */
  getItemsByType(type: RecentlyViewedItem['type']): RecentlyViewedItem[] {
    return this.recentlyViewed.items.filter(item => item.type === type);
  }

  /**
   * Get recent items (within specified hours)
   */
  getRecentItems(hoursAgo: number = 24): RecentlyViewedItem[] {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursAgo);
    
    return this.recentlyViewed.items.filter(item => 
      new Date(item.viewedAt) > cutoffTime
    );
  }

  /**
   * Clear all recently viewed items
   */
  clearAll(): boolean {
    try {
      this.recentlyViewed.items = [];
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
      return false;
    }
  }

  /**
   * Clear items older than specified days
   */
  clearOldItems(daysOld: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const initialLength = this.recentlyViewed.items.length;
    this.recentlyViewed.items = this.recentlyViewed.items.filter(item =>
      new Date(item.viewedAt) > cutoffDate
    );
    
    const removedCount = initialLength - this.recentlyViewed.items.length;
    if (removedCount > 0) {
      this.saveToStorage();
    }
    
    return removedCount;
  }

  /**
   * Get statistics
   */
  getStats() {
    const items = this.recentlyViewed.items;
    const totalItems = items.length;
    const productCount = items.filter(item => item.type === 'product').length;
    const vendorCount = items.filter(item => item.type === 'vendor').length;
    const propertyCount = items.filter(item => item.type === 'property').length;

    // Recent activity (last 24 hours)
    const recent24h = this.getRecentItems(24);
    const recentCount = recent24h.length;

    // Most viewed categories
    const categories = items
      .map(item => item.metadata?.category)
      .filter(Boolean)
      .reduce((acc, category) => {
        acc[category as string] = (acc[category as string] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topCategory = Object.keys(categories).length > 0 
      ? Object.entries(categories).sort(([,a], [,b]) => b - a)[0]
      : null;

    return {
      totalItems,
      productCount,
      vendorCount,
      propertyCount,
      recentCount,
      topCategory: topCategory ? { name: topCategory[0], count: topCategory[1] } : null,
      lastUpdated: this.recentlyViewed.lastUpdated
    };
  }

  /**
   * Search recently viewed items
   */
  searchItems(query: string): RecentlyViewedItem[] {
    if (!query.trim()) return this.getItems();
    
    const searchTerm = query.toLowerCase();
    return this.recentlyViewed.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.vendor?.name.toLowerCase().includes(searchTerm) ||
      item.metadata?.category?.toLowerCase().includes(searchTerm) ||
      item.metadata?.location?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get items grouped by date
   */
  getItemsByDate(): Record<string, RecentlyViewedItem[]> {
    const grouped = this.recentlyViewed.items.reduce((acc, item) => {
      const date = new Date(item.viewedAt).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as Record<string, RecentlyViewedItem[]>);

    return grouped;
  }

  /**
   * Remove specific item
   */
  removeItem(id: string, type: RecentlyViewedItem['type']): boolean {
    try {
      const initialLength = this.recentlyViewed.items.length;
      this.recentlyViewed.items = this.recentlyViewed.items.filter(
        item => !(item.id === id && item.type === type)
      );
      
      if (this.recentlyViewed.items.length < initialLength) {
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing item from recently viewed:', error);
      return false;
    }
  }
}

// Singleton instance
export const recentlyViewedManager = new RecentlyViewedManager();

// React hook for using recently viewed in components
export function useRecentlyViewed() {
  const [recentlyViewedState, setRecentlyViewedState] = React.useState<RecentlyViewedState>(
    () => ({
      items: recentlyViewedManager.getItems(),
      lastUpdated: recentlyViewedManager.getStats().lastUpdated
    })
  );

  React.useEffect(() => {
    const unsubscribe = recentlyViewedManager.subscribe(setRecentlyViewedState);
    return unsubscribe;
  }, []);

  const addToRecentlyViewed = React.useCallback((item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    return recentlyViewedManager.addItem(item);
  }, []);

  const removeFromRecentlyViewed = React.useCallback((id: string, type: RecentlyViewedItem['type']) => {
    return recentlyViewedManager.removeItem(id, type);
  }, []);

  return {
    recentlyViewed: recentlyViewedState,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    getStats: () => recentlyViewedManager.getStats(),
    getRecentItems: (hoursAgo?: number) => recentlyViewedManager.getRecentItems(hoursAgo),
    searchItems: (query: string) => recentlyViewedManager.searchItems(query),
    getItemsByDate: () => recentlyViewedManager.getItemsByDate(),
    clearAll: () => recentlyViewedManager.clearAll(),
    clearOldItems: (daysOld?: number) => recentlyViewedManager.clearOldItems(daysOld)
  };
}

// Helper function to convert marketplace items to recently viewed format
export function convertToRecentlyViewedItem(
  item, 
  type: RecentlyViewedItem['type']
): Omit<RecentlyViewedItem, 'viewedAt'> {
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
          unit: item.unit
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
          location: item.location
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
          size: item.details?.size
        }
      };
      
    default:
      throw new Error(`Unsupported recently viewed item type: ${type}`);
  }
}

// Auto-cleanup old items on initialization
if (typeof window !== 'undefined') {
  // Clean up items older than 30 days on app load
  setTimeout(() => {
    recentlyViewedManager.clearOldItems(30);
  }, 1000);
}

// Additional React import for the hook
import React from 'react';