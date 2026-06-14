/**
 * Go4Food API - Food Aggregator Service
 * Aggregates data from multiple food platforms including REZ Merchant
 */

import { Restaurant, MenuItem, SearchResult, PriceComparison, AggregatedMenu, Cuisine } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { rezMerchantService } from './rezMerchantService.js';

interface SearchOptions {
  query?: string;
  cuisines?: string[];
  priceRange?: 'low' | 'medium' | 'high';
  minRating?: number;
  isPureVeg?: boolean;
  lat?: number;
  lng?: number;
  page: number;
  limit: number;
}

interface MenuOptions {
  restaurantId: string;
  source?: string;
  category?: string;
  isVeg?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page: number;
  limit: number;
}

// Mock data for demonstration
const mockRestaurants: Restaurant[] = [
  {
    id: 'res_1',
    name: 'Pizza Palace',
    description: 'Authentic Italian pizza with fresh ingredients',
    image: 'https://example.com/pizza.jpg',
    cuisines: ['Italian', 'Pizza', 'Fast Food'],
    rating: 4.5,
    deliveryTime: 30,
    priceForTwo: 600,
    address: '123 Main Street',
    city: 'Mumbai',
    area: 'Andheri West',
    isOpen: true,
    isPureVeg: false,
    source: 'internal',
  },
  {
    id: 'res_2',
    name: 'Green Bowl',
    description: 'Healthy vegetarian and vegan options',
    image: 'https://example.com/green.jpg',
    cuisines: ['Healthy', 'Salads', 'Vegan'],
    rating: 4.2,
    deliveryTime: 25,
    priceForTwo: 400,
    address: '456 Park Road',
    city: 'Mumbai',
    area: 'Bandra West',
    isOpen: true,
    isPureVeg: true,
    source: 'internal',
  },
  {
    id: 'res_3',
    name: 'Spice Garden',
    description: 'North Indian and Chinese cuisine',
    image: 'https://example.com/spice.jpg',
    cuisines: ['North Indian', 'Chinese', 'Biryani'],
    rating: 4.0,
    deliveryTime: 40,
    priceForTwo: 500,
    address: '789 Food Lane',
    city: 'Mumbai',
    area: 'Juhu',
    isOpen: true,
    isPureVeg: false,
    source: 'internal',
  },
];

const mockMenuItems: MenuItem[] = [
  {
    id: 'item_1',
    restaurantId: 'res_1',
    name: 'Margherita Pizza',
    description: 'Classic tomato and mozzarella',
    price: 299,
    image: 'https://example.com/margherita.jpg',
    category: 'Pizza',
    isVeg: true,
    isAvailable: true,
    rating: 4.5,
    calories: 850,
    dietary: ['veg'],
    source: 'internal',
  },
  {
    id: 'item_2',
    restaurantId: 'res_1',
    name: 'Pepperoni Pizza',
    description: 'Spicy pepperoni with cheese',
    price: 399,
    image: 'https://example.com/pepperoni.jpg',
    category: 'Pizza',
    isVeg: false,
    isAvailable: true,
    rating: 4.7,
    calories: 1100,
    dietary: [],
    source: 'internal',
  },
  {
    id: 'item_3',
    restaurantId: 'res_2',
    name: 'Quinoa Salad Bowl',
    description: 'Healthy quinoa with fresh vegetables',
    price: 249,
    image: 'https://example.com/quinoa.jpg',
    category: 'Salads',
    isVeg: true,
    isAvailable: true,
    rating: 4.3,
    calories: 350,
    dietary: ['veg', 'glutenFree'],
    source: 'internal',
  },
];

const mockCuisines: Cuisine[] = [
  { id: 'c1', name: 'Pizza', image: '🍕', restaurantCount: 45 },
  { id: 'c2', name: 'Biryani', image: '🍚', restaurantCount: 38 },
  { id: 'c3', name: 'Chinese', image: '🥡', restaurantCount: 52 },
  { id: 'c4', name: 'Italian', image: '🍝', restaurantCount: 28 },
  { id: 'c5', name: 'Healthy', image: '🥗', restaurantCount: 22 },
  { id: 'c6', name: 'Fast Food', image: '🍔', restaurantCount: 65 },
];

class FoodAggregatorService {
  /**
   * Search restaurants across all platforms (including REZ Merchant)
   */
  async searchRestaurants(options: SearchOptions): Promise<SearchResult> {
    logger.info('Searching restaurants', options);

    // Fetch from REZ Merchant
    let rezMerchantRestaurants: Restaurant[] = [];
    try {
      const merchantResult = await rezMerchantService.searchRestaurants(
        options.query || '',
        {
          cuisines: options.cuisines,
          minRating: options.minRating,
          isPureVeg: options.isPureVeg,
          page: options.page,
          limit: options.limit,
        }
      );
      rezMerchantRestaurants = merchantResult.restaurants;
      logger.info('REZ Merchant restaurants fetched', { count: rezMerchantRestaurants.length });
    } catch (error) {
      logger.warn('REZ Merchant search failed, using mock data', { error });
    }

    // Start with REZ Merchant results or fall back to mock
    let results = rezMerchantRestaurants.length > 0
      ? [...rezMerchantRestaurants]
      : [...mockRestaurants];

    // Filter by query
    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(
        r =>
          r.name.toLowerCase().includes(query) ||
          r.cuisines.some(c => c.toLowerCase().includes(query))
      );
    }

    // Filter by cuisines
    if (options.cuisines && options.cuisines.length > 0) {
      results = results.filter(r =>
        r.cuisines.some(c =>
          options.cuisines!.some(qc => c.toLowerCase().includes(qc.toLowerCase()))
        )
      );
    }

    // Filter by rating
    if (options.minRating) {
      results = results.filter(r => r.rating >= options.minRating!);
    }

    // Filter by pure veg
    if (options.isPureVeg) {
      results = results.filter(r => r.isPureVeg);
    }

    // Filter by price range
    if (options.priceRange) {
      const ranges = {
        low: [0, 300],
        medium: [300, 600],
        high: [600, Infinity],
      };
      const [min, max] = ranges[options.priceRange];
      results = results.filter(r => r.priceForTwo >= min && r.priceForTwo < max);
    }

    // Sort
    results.sort((a, b) => b.rating - a.rating);

    // Paginate
    const start = (options.page - 1) * options.limit;
    const paginated = results.slice(start, start + options.limit);

    return {
      restaurants: paginated,
      total: results.length,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(results.length / options.limit),
    };
  }

  /**
   * Get restaurant by ID
   */
  async getRestaurant(id: string, source?: string): Promise<Restaurant | null> {
    logger.info('Get restaurant', { id, source });

    // Try REZ Merchant first (unless source is explicitly external)
    if (!source || source === 'internal') {
      try {
        const merchantRestaurant = await rezMerchantService.getRestaurant(id);
        if (merchantRestaurant) {
          logger.info('Restaurant found in REZ Merchant', { id });
          return merchantRestaurant;
        }
      } catch (error) {
        logger.warn('REZ Merchant getRestaurant failed', { id, error });
      }
    }

    // Fall back to mock data
    return mockRestaurants.find(r => r.id === id) || null;
  }

  /**
   * Get restaurant menu
   */
  async getMenu(restaurantId: string, source?: string): Promise<MenuItem[]> {
    logger.info('Get menu', { restaurantId, source });

    // Try REZ Merchant first (unless source is explicitly external)
    if (!source || source === 'internal') {
      try {
        const merchantMenu = await rezMerchantService.getMenu(restaurantId);
        if (merchantMenu.items.length > 0) {
          logger.info('Menu found in REZ Merchant', { restaurantId, count: merchantMenu.items.length });
          return merchantMenu.items;
        }
      } catch (error) {
        logger.warn('REZ Merchant getMenu failed', { restaurantId, error });
      }
    }

    // Fall back to mock data
    return mockMenuItems.filter(m => m.restaurantId === restaurantId);
  }

  /**
   * Get menu items with filters
   */
  async getMenuItems(options: MenuOptions): Promise<{ items: MenuItem[]; total: number }> {
    logger.info('Get menu items', options);

    let items = mockMenuItems.filter(m => m.restaurantId === options.restaurantId);

    // Filter by category
    if (options.category) {
      items = items.filter(
        i => i.category.toLowerCase() === options.category!.toLowerCase()
      );
    }

    // Filter by veg
    if (options.isVeg) {
      items = items.filter(i => i.isVeg);
    }

    // Filter by price
    if (options.minPrice) {
      items = items.filter(i => i.price >= options.minPrice!);
    }
    if (options.maxPrice) {
      items = items.filter(i => i.price <= options.maxPrice!);
    }

    // Search
    if (options.search) {
      const search = options.search.toLowerCase();
      items = items.filter(
        i =>
          i.name.toLowerCase().includes(search) ||
          i.description.toLowerCase().includes(search)
      );
    }

    return { items, total: items.length };
  }

  /**
   * Get available cuisines
   */
  async getCuisines(): Promise<Cuisine[]> {
    return mockCuisines;
  }

  /**
   * Get categories for a restaurant
   */
  async getCategories(restaurantId: string, source?: string): Promise<string[]> {
    // Try REZ Merchant first
    if (!source || source === 'internal') {
      try {
        const merchantCategories = await rezMerchantService.getCategories(restaurantId);
        if (merchantCategories.length > 0) {
          logger.info('Categories found in REZ Merchant', { restaurantId, count: merchantCategories.length });
          return merchantCategories;
        }
      } catch (error) {
        logger.warn('REZ Merchant getCategories failed', { restaurantId, error });
      }
    }

    // Fall back to mock data
    const items = mockMenuItems.filter(m => m.restaurantId === restaurantId);
    return [...new Set(items.map(i => i.category))];
  }

  /**
   * Compare price of an item across platforms
   */
  async comparePrice(itemName: string, lat?: number, lng?: number): Promise<PriceComparison | null> {
    logger.info('Compare price', { itemName });

    // Mock comparison
    const mockPrices = [
      { source: 'internal' as const, restaurantName: 'Pizza Palace', price: 299, url: '#' },
      { source: 'swiggy' as const, restaurantName: 'Pizza Hub', price: 349, url: '#' },
      { source: 'zomato' as const, restaurantName: 'Italian Paradise', price: 279, url: '#' },
    ];

    const prices = mockPrices.filter(p =>
      itemName.toLowerCase().includes('pizza') || itemName === '*'
    );

    if (prices.length === 0) return null;

    const lowestPrice = Math.min(...prices.map(p => p.price));
    const highestPrice = Math.max(...prices.map(p => p.price));

    return {
      itemId: `compare_${Date.now()}`,
      itemName,
      prices,
      lowestPrice,
      highestPrice,
      savings: highestPrice - lowestPrice,
      savingsPercent: Math.round(((highestPrice - lowestPrice) / highestPrice) * 100),
    };
  }

  /**
   * Find best deals
   */
  async findBestDeals(
    query: string,
    cuisines?: string[],
    lat?: number,
    lng?: number
  ): Promise<AggregatedMenu[]> {
    logger.info('Find best deals', { query, cuisines });

    // Mock best deals
    return [
      {
        itemName: 'Margherita Pizza',
        items: [
          { source: 'zomato', restaurantName: 'Italian Paradise', price: 279, rating: 4.5 },
          { source: 'internal', restaurantName: 'Pizza Palace', price: 299, rating: 4.5 },
          { source: 'swiggy', restaurantName: 'Pizza Hub', price: 349, rating: 4.3 },
        ],
        bestDeal: { source: 'zomato', restaurantName: 'Italian Paradise', price: 279 },
      },
      {
        itemName: 'Quinoa Salad',
        items: [
          { source: 'internal', restaurantName: 'Green Bowl', price: 249, rating: 4.3 },
          { source: 'swiggy', restaurantName: 'Healthy Hub', price: 299, rating: 4.1 },
        ],
        bestDeal: { source: 'internal', restaurantName: 'Green Bowl', price: 249 },
      },
    ];
  }

  /**
   * Compare menu across platforms
   */
  async compareMenu(restaurantName: string, lat?: number, lng?: number): Promise<AggregatedMenu[]> {
    logger.info('Compare menu', { restaurantName });

    return [
      {
        itemName: 'Margherita Pizza',
        items: [
          { source: 'internal', restaurantName: 'Pizza Palace', price: 299, rating: 4.5 },
          { source: 'swiggy', restaurantName: 'Pizza Palace', price: 319, rating: 4.5 },
        ],
        bestDeal: { source: 'internal', restaurantName: 'Pizza Palace', price: 299 },
      },
    ];
  }

  /**
   * Smart search with AI recommendations
   */
  async smartSearch(options: SearchOptions): Promise<SearchResult> {
    return this.searchRestaurants(options);
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query: string): Promise<string[]> {
    const allSuggestions = [
      'Pizza',
      'Biryani',
      'Burger',
      'Chinese',
      'Pasta',
      'Salad',
      'Sushi',
      'Tacos',
    ];
    const q = query.toLowerCase();
    return allSuggestions.filter(s => s.toLowerCase().includes(q)).slice(0, 5);
  }

  /**
   * Get trending searches
   */
  async getTrending(lat?: number, lng?: number): Promise<{ query: string; count: number }[]> {
    return [
      { query: 'Pizza', count: 1250 },
      { query: 'Biryani', count: 980 },
      { query: 'Burger', count: 850 },
      { query: 'Chinese', count: 720 },
      { query: 'Pasta', count: 540 },
    ];
  }
}

export const foodAggregator = new FoodAggregatorService();
