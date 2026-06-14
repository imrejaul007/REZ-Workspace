/**
 * Flash deals and daily sales management system
 * Handles time-limited offers with countdown timers
 */

export interface FlashDeal {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  vendorId: string;
  vendorName: string;
  originalPrice: number;
  discountPrice: number;
  discountPercentage: number;
  startTime: string;
  endTime: string;
  totalQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  category: string;
  unit: string;
  minOrderQuantity: number;
  featured: boolean;
  metadata?: {
    description?: string;
    tags?: string[];
    condition?: string;
    [key: string];
  };
}

export interface FlashDealsState {
  deals: FlashDeal[];
  lastUpdated: string;
  nextRefresh: string;
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  expired: boolean;
}

const FLASH_DEALS_STORAGE_KEY = 'restopapa_flash_deals';
const DEALS_REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

export class FlashDealsManager {
  private dealsState: FlashDealsState;
  private listeners: ((state: FlashDealsState) => void)[] = [];
  private refreshTimer?: NodeJS.Timeout;

  constructor() {
    this.dealsState = this.loadFromStorage();
    this.startAutoRefresh();
  }

  /**
   * Load flash deals from localStorage or generate mock data
   */
  private loadFromStorage(): FlashDealsState {
    try {
      const stored = localStorage.getItem(FLASH_DEALS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.deals && Array.isArray(parsed.deals)) {
          // Filter out expired deals
          const validDeals = parsed.deals.filter((deal: FlashDeal) => 
            new Date(deal.endTime) > new Date()
          );
          
          if (validDeals.length > 0) {
            return {
              deals: validDeals,
              lastUpdated: parsed.lastUpdated || new Date().toISOString(),
              nextRefresh: parsed.nextRefresh || this.getNextRefreshTime()
            };
          }
        }
      }
    } catch (error) {
      console.error('Error loading flash deals from storage:', error);
    }
    
    return this.generateMockDeals();
  }

  /**
   * Generate mock flash deals data
   */
  private generateMockDeals(): FlashDealsState {
    const now = new Date();
    const deals: FlashDeal[] = [
      {
        id: 'flash-1',
        productId: 'product-123',
        productName: 'Premium Basmati Rice',
        productImage: '/images/products/basmati-rice.jpg',
        vendorId: 'vendor-1',
        vendorName: 'Grain Masters',
        originalPrice: 250,
        discountPrice: 199,
        discountPercentage: 20,
        startTime: now.toISOString(),
        endTime: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
        totalQuantity: 100,
        soldQuantity: 45,
        remainingQuantity: 55,
        category: 'Grains & Rice',
        unit: 'kg',
        minOrderQuantity: 1,
        featured: true,
        metadata: {
          description: 'Premium quality aged basmati rice',
          tags: ['organic', 'premium', 'aged'],
          condition: 'Flash Sale - Limited Time Only!'
        }
      },
      {
        id: 'flash-2',
        productId: 'product-124',
        productName: 'Fresh Organic Vegetables Bundle',
        vendorId: 'vendor-2',
        vendorName: 'Farm Fresh',
        originalPrice: 150,
        discountPrice: 99,
        discountPercentage: 34,
        startTime: now.toISOString(),
        endTime: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
        totalQuantity: 50,
        soldQuantity: 23,
        remainingQuantity: 27,
        category: 'Vegetables',
        unit: 'bundle',
        minOrderQuantity: 1,
        featured: true,
        metadata: {
          description: 'Mixed seasonal vegetables bundle',
          tags: ['organic', 'fresh', 'seasonal'],
          condition: 'Today Only Special!'
        }
      },
      {
        id: 'flash-3',
        productId: 'product-125',
        productName: 'Artisan Bread Variety Pack',
        vendorId: 'vendor-3',
        vendorName: 'Baker\'s Choice',
        originalPrice: 180,
        discountPrice: 120,
        discountPercentage: 33,
        startTime: now.toISOString(),
        endTime: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
        totalQuantity: 30,
        soldQuantity: 18,
        remainingQuantity: 12,
        category: 'Bakery',
        unit: 'pack',
        minOrderQuantity: 1,
        featured: false,
        metadata: {
          description: '5-piece artisan bread variety pack',
          tags: ['artisan', 'fresh', 'variety'],
          condition: 'Flash Sale - Ends Soon!'
        }
      },
      {
        id: 'flash-4',
        productId: 'product-126',
        productName: 'Premium Olive Oil',
        vendorId: 'vendor-4',
        vendorName: 'Mediterranean Imports',
        originalPrice: 350,
        discountPrice: 249,
        discountPercentage: 29,
        startTime: now.toISOString(),
        endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        totalQuantity: 80,
        soldQuantity: 32,
        remainingQuantity: 48,
        category: 'Oils & Condiments',
        unit: 'liter',
        minOrderQuantity: 1,
        featured: false,
        metadata: {
          description: 'Extra virgin cold-pressed olive oil',
          tags: ['premium', 'extra-virgin', 'imported'],
          condition: 'Daily Deal - Limited Quantity!'
        }
      },
      {
        id: 'flash-5',
        productId: 'product-127',
        productName: 'Gourmet Spice Collection',
        vendorId: 'vendor-5',
        vendorName: 'Spice Garden',
        originalPrice: 450,
        discountPrice: 299,
        discountPercentage: 34,
        startTime: now.toISOString(),
        endTime: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours
        totalQuantity: 25,
        soldQuantity: 8,
        remainingQuantity: 17,
        category: 'Spices & Seasonings',
        unit: 'set',
        minOrderQuantity: 1,
        featured: true,
        metadata: {
          description: '12-piece premium spice collection',
          tags: ['gourmet', 'premium', 'collection'],
          condition: 'Special Offer - High Demand!'
        }
      }
    ];

    const state: FlashDealsState = {
      deals,
      lastUpdated: now.toISOString(),
      nextRefresh: this.getNextRefreshTime()
    };

    this.saveToStorage(state);
    return state;
  }

  /**
   * Get next refresh time (6 hours from now)
   */
  private getNextRefreshTime(): string {
    return new Date(Date.now() + DEALS_REFRESH_INTERVAL).toISOString();
  }

  /**
   * Save flash deals to localStorage
   */
  private saveToStorage(state?: FlashDealsState) {
    try {
      const stateToSave = state || this.dealsState;
      localStorage.setItem(FLASH_DEALS_STORAGE_KEY, JSON.stringify(stateToSave));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving flash deals to storage:', error);
    }
  }

  /**
   * Subscribe to flash deals changes
   */
  subscribe(listener: (state: FlashDealsState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.dealsState));
  }

  /**
   * Start auto-refresh timer
   */
  private startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.refreshDeals();
    }, DEALS_REFRESH_INTERVAL);
  }

  /**
   * Refresh deals (remove expired, add new ones)
   */
  refreshDeals(): boolean {
    try {
      // Remove expired deals
      const now = new Date();
      const validDeals = this.dealsState.deals.filter(deal => 
        new Date(deal.endTime) > now
      );

      // If we have fewer than 3 deals, generate new ones
      if (validDeals.length < 3) {
        const newState = this.generateMockDeals();
        this.dealsState = newState;
      } else {
        this.dealsState = {
          ...this.dealsState,
          deals: validDeals,
          lastUpdated: now.toISOString(),
          nextRefresh: this.getNextRefreshTime()
        };
      }

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error refreshing flash deals:', error);
      return false;
    }
  }

  /**
   * Get all active flash deals
   */
  getActiveDeals(): FlashDeal[] {
    const now = new Date();
    return this.dealsState.deals.filter(deal => 
      new Date(deal.endTime) > now && deal.remainingQuantity > 0
    );
  }

  /**
   * Get featured flash deals
   */
  getFeaturedDeals(): FlashDeal[] {
    return this.getActiveDeals().filter(deal => deal.featured);
  }

  /**
   * Get deals by category
   */
  getDealsByCategory(category: string): FlashDeal[] {
    return this.getActiveDeals().filter(deal => 
      deal.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get deal by ID
   */
  getDealById(id: string): FlashDeal | null {
    return this.dealsState.deals.find(deal => deal.id === id) || null;
  }

  /**
   * Calculate time remaining for a deal
   */
  getTimeRemaining(endTime: string): TimeRemaining {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const total = end - now;

    if (total <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
        expired: true
      };
    }

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      total,
      expired: false
    };
  }

  /**
   * Format time remaining as string
   */
  formatTimeRemaining(endTime: string): string {
    const time = this.getTimeRemaining(endTime);
    
    if (time.expired) {
      return 'Expired';
    }

    if (time.days > 0) {
      return `${time.days}d ${time.hours}h ${time.minutes}m`;
    } else if (time.hours > 0) {
      return `${time.hours}h ${time.minutes}m`;
    } else if (time.minutes > 0) {
      return `${time.minutes}m ${time.seconds}s`;
    } else {
      return `${time.seconds}s`;
    }
  }

  /**
   * Get deal progress percentage
   */
  getDealProgress(deal: FlashDeal): number {
    if (deal.totalQuantity === 0) return 0;
    return Math.round((deal.soldQuantity / deal.totalQuantity) * 100);
  }

  /**
   * Check if deal is ending soon (less than 2 hours)
   */
  isDealEndingSoon(endTime: string): boolean {
    const time = this.getTimeRemaining(endTime);
    return !time.expired && time.total < 2 * 60 * 60 * 1000; // Less than 2 hours
  }

  /**
   * Check if deal has low stock (less than 20%)
   */
  hasLowStock(deal: FlashDeal): boolean {
    if (deal.totalQuantity === 0) return false;
    return (deal.remainingQuantity / deal.totalQuantity) < 0.2;
  }

  /**
   * Simulate purchasing a deal item
   */
  purchaseDeal(dealId: string, quantity: number): boolean {
    try {
      const dealIndex = this.dealsState.deals.findIndex(deal => deal.id === dealId);
      if (dealIndex === -1) return false;

      const deal = this.dealsState.deals[dealIndex];
      
      if (deal.remainingQuantity < quantity) {
        return false; // Insufficient stock
      }

      // Update quantities
      this.dealsState.deals[dealIndex] = {
        ...deal,
        soldQuantity: deal.soldQuantity + quantity,
        remainingQuantity: deal.remainingQuantity - quantity
      };

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error purchasing deal:', error);
      return false;
    }
  }

  /**
   * Get deals statistics
   */
  getStats() {
    const activeDeals = this.getActiveDeals();
    const totalDeals = activeDeals.length;
    const featuredDeals = activeDeals.filter(deal => deal.featured).length;
    const endingSoon = activeDeals.filter(deal => this.isDealEndingSoon(deal.endTime)).length;
    const lowStock = activeDeals.filter(deal => this.hasLowStock(deal)).length;
    
    const avgDiscount = activeDeals.reduce((sum, deal) => sum + deal.discountPercentage, 0) / totalDeals || 0;
    const totalSavings = activeDeals.reduce((sum, deal) => 
      sum + ((deal.originalPrice - deal.discountPrice) * deal.soldQuantity), 0
    );

    return {
      totalDeals,
      featuredDeals,
      endingSoon,
      lowStock,
      avgDiscount: Math.round(avgDiscount),
      totalSavings,
      lastUpdated: this.dealsState.lastUpdated,
      nextRefresh: this.dealsState.nextRefresh
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.listeners = [];
  }
}

// Singleton instance
export const flashDealsManager = new FlashDealsManager();

// React hook for using flash deals in components
export function useFlashDeals() {
  const [dealsState, setDealsState] = React.useState<FlashDealsState>(() => ({
    deals: flashDealsManager.getActiveDeals(),
    lastUpdated: flashDealsManager.getStats().lastUpdated,
    nextRefresh: flashDealsManager.getStats().nextRefresh
  }));

  React.useEffect(() => {
    const unsubscribe = flashDealsManager.subscribe(setDealsState);
    return unsubscribe;
  }, []);

  const refreshDeals = React.useCallback(() => {
    return flashDealsManager.refreshDeals();
  }, []);

  const purchaseDeal = React.useCallback((dealId: string, quantity: number) => {
    return flashDealsManager.purchaseDeal(dealId, quantity);
  }, []);

  return {
    deals: dealsState.deals,
    activeDeals: flashDealsManager.getActiveDeals(),
    featuredDeals: flashDealsManager.getFeaturedDeals(),
    getDealById: (id: string) => flashDealsManager.getDealById(id),
    getDealsByCategory: (category: string) => flashDealsManager.getDealsByCategory(category),
    getTimeRemaining: (endTime: string) => flashDealsManager.getTimeRemaining(endTime),
    formatTimeRemaining: (endTime: string) => flashDealsManager.formatTimeRemaining(endTime),
    getDealProgress: (deal: FlashDeal) => flashDealsManager.getDealProgress(deal),
    isDealEndingSoon: (endTime: string) => flashDealsManager.isDealEndingSoon(endTime),
    hasLowStock: (deal: FlashDeal) => flashDealsManager.hasLowStock(deal),
    getStats: () => flashDealsManager.getStats(),
    refreshDeals,
    purchaseDeal,
    lastUpdated: dealsState.lastUpdated,
    nextRefresh: dealsState.nextRefresh
  };
}

// Additional React import for the hook
import React from 'react';