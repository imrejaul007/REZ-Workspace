/**
 * Go4Food API - Type Definitions
 */

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  cuisines: string[];
  rating: number;
  deliveryTime: number; // minutes
  priceForTwo: number;
  address: string;
  city: string;
  area: string;
  latitude?: number;
  longitude?: number;
  isOpen: boolean;
  isPureVeg: boolean;
  source: 'swiggy' | 'zomato' | 'ubereats' | 'internal';
  sourceId?: string;
  sourceUrl?: string;
  menuUrl?: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  isVeg: boolean;
  isAvailable: boolean;
  rating?: number;
  calories?: number;
  dietary?: ('veg' | 'vegan' | 'glutenFree')[];
  allergens?: string[];
  customizations?: MenuItemCustomization[];
  source: 'swiggy' | 'zomato' | 'ubereats' | 'internal';
}

export interface MenuItemCustomization {
  id: string;
  name: string;
  options: {
    id: string;
    name: string;
    price: number;
  }[];
  required: boolean;
  maxSelect: number;
}

export interface SearchParams {
  query?: string;
  cuisines?: string[];
  priceRange?: 'low' | 'medium' | 'high';
  rating?: number;
  deliveryTime?: number;
  isPureVeg?: boolean;
  lat?: number;
  lng?: number;
  radius?: number; // km
  page?: number;
  limit?: number;
}

export interface SearchResult {
  restaurants: Restaurant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PriceComparison {
  itemId: string;
  itemName: string;
  prices: {
    source: Restaurant['source'];
    restaurantName: string;
    price: number;
    url: string;
  }[];
  lowestPrice: number;
  highestPrice: number;
  savings: number; // savings if lowest vs highest
  savingsPercent: number;
}

export interface AggregatedMenu {
  itemName: string;
  items: {
    source: Restaurant['source'];
    restaurantName: string;
    price: number;
    rating?: number;
    image?: string;
  }[];
  bestDeal: {
    source: Restaurant['source'];
    restaurantName: string;
    price: number;
  };
}

export interface Cuisine {
  id: string;
  name: string;
  image: string;
  restaurantCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
