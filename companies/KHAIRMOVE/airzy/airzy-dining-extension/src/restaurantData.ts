/**
 * Airport Restaurant Data
 * Restaurants available at major airports
 */

import { AirportRestaurant } from './types';

// Airport restaurants integrated with REZ NOW
export const AIRPORT_RESTAURANTS: Record<string, AirportRestaurant[]> = {
  'BLR': [
    {
      id: 'blr-001',
      name: 'Tiffin',
      cuisine: 'South Indian',
      airport: 'BLR',
      terminal: 'T1',
      gate: 'A7',
      location: 'Near Gate A7-A8',
      priceRange: '$$',
      rating: 4.3,
      reviewCount: 1247,
      slug: 'tiffin-airport',
      distanceFromGate: 50,
      walkingTime: 2,
      openNow: true,
      openingHours: '06:00-22:00',
      delivery: true,
      pickup: true,
      dineIn: true,
      menuHighlights: ['Masala Dosa', 'Idli Vada', 'Filter Coffee'],
      dietaryOptions: [
        { type: 'vegetarian', icon: '🥬', label: 'Vegetarian' },
        { type: 'vegan', icon: '🌱', label: 'Vegan' },
        { type: 'jain', icon: '🙏', label: 'Jain' },
      ],
    },
    {
      id: 'blr-002',
      name: 'K一体中国',
      cuisine: 'Chinese, Thai',
      airport: 'BLR',
      terminal: 'T1',
      gate: 'A10',
      location: 'Near Gate A10-A11',
      priceRange: '$$$',
      rating: 4.5,
      reviewCount: 892,
      slug: 'kyt-chinese',
      distanceFromGate: 60,
      walkingTime: 3,
      openNow: true,
      openingHours: '07:00-21:00',
      delivery: true,
      pickup: true,
      dineIn: true,
      menuHighlights: ['Hakka Noodles', 'Manchurian', 'Thai Curry'],
      dietaryOptions: [
        { type: 'vegetarian', icon: '🥬', label: 'Vegetarian' },
      ],
    },
    {
      id: 'blr-003',
      name: 'Faasos',
      cuisine: 'Indian Wraps, Biryani',
      airport: 'BLR',
      terminal: 'T2',
      gate: 'B8',
      location: 'Near Gate B8-B9',
      priceRange: '$',
      rating: 4.1,
      reviewCount: 2341,
      slug: 'faasos-airport',
      distanceFromGate: 40,
      walkingTime: 2,
      openNow: true,
      openingHours: '08:00-20:00',
      delivery: true,
      pickup: true,
      dineIn: false,
      menuHighlights: ['Wraps', 'Biryani', 'Mojitos'],
      dietaryOptions: [
        { type: 'vegetarian', icon: '🥬', label: 'Vegetarian' },
        { type: 'halal', icon: '☪', label: 'Halal' },
      ],
    },
    {
      id: 'blr-004',
      name: 'Heritage Foods',
      cuisine: 'Snacks, Dairy',
      airport: 'BLR',
      terminal: 'T1',
      gate: 'A3',
      location: 'Near Gate A3',
      priceRange: '$',
      rating: 4.0,
      reviewCount: 567,
      slug: 'heritage-foods',
      distanceFromGate: 30,
      walkingTime: 1,
      openNow: true,
      openingHours: '24/7',
      delivery: false,
      pickup: true,
      dineIn: false,
      menuHighlights: ['Lassi', 'Poha', 'Upma'],
      dietaryOptions: [
        { type: 'vegetarian', icon: '🥬', label: 'Vegetarian' },
      ],
    },
    {
      id: 'blr-005',
      name: 'Starbucks',
      cuisine: 'Coffee, Snacks',
      airport: 'BLR',
      terminal: 'T1',
      gate: 'A5',
      location: 'Central Atrium',
      priceRange: '$$',
      rating: 4.2,
      reviewCount: 3421,
      slug: 'starbucks-blr',
      distanceFromGate: 100,
      walkingTime: 5,
      openNow: true,
      openingHours: '05:00-23:00',
      delivery: true,
      pickup: true,
      dineIn: true,
      menuHighlights: ['Cold Brew', 'Frappuccino', 'Sandwiches'],
      dietaryOptions: [
        { type: 'vegetarian', icon: '🥬', label: 'Vegetarian' },
      ],
    },
    {
      id: 'blr-006',
      name: 'Subway',
      cuisine: 'Sandwiches, Salads',
      airport: 'BLR',
      terminal: 'T2',
      gate: 'B4',
      location: 'Near Gate B4',
      priceRange: '$',
      rating: 4.0,
      reviewCount: 1823,
      slug: 'subway-blr',
      distanceFromGate: 45,
      walkingTime: 2,
      openNow: true,
      openingHours: '06:00-22:00',
      delivery: true,
      pickup: true,
      dineIn: true,
      menuHighlights: ['Subway Club', 'Veggie Delite', 'Wraps'],
      dietaryOptions: [
        { type: 'vegetarian', icon: '🥬', label: 'Vegetarian' },
        { type: 'vegan', icon: '🌱', label: 'Vegan' },
        { type: 'gluten-free', icon: '🌾', label: 'Gluten-Free' },
        { type: 'halal', icon: '☪', label: 'Halal' },
      ],
    },
  ],
  'DEL': [
    {
      id: 'del-001',
      name: 'Sagar Ratna',
      cuisine: 'South Indian, North Indian',
      airport: 'DEL',
      terminal: 'T3',
      gate: 'C5',
      location: 'Near Gate C5-C6',
      priceRange: '$$',
      rating: 4.4,
      reviewCount: 4521,
      slug: 'sagar-ratna-del',
      distanceFromGate: 55,
      walkingTime: 3,
      openNow: true,
      openingHours: '05:00-23:00',
      delivery: true,
      pickup: true,
      dineIn: true,
      menuHighlights: ['Masala Dosa', 'Paneer Butter Masala', 'Dal Makhani'],
      dietaryOptions: [
        { type: 'vegetarian', icon: '🥬', label: 'Vegetarian' },
        { type: 'jain', icon: '🙏', label: 'Jain' },
      ],
    },
    {
      id: 'del-002',
      name: 'Delhi Duty Free',
      cuisine: 'Beverages, Snacks',
      airport: 'DEL',
      terminal: 'T3',
      gate: 'C10',
      location: 'After Security',
      priceRange: '$$$',
      rating: 3.9,
      reviewCount: 2109,
      slug: 'delhi-duty-free',
      distanceFromGate: 80,
      walkingTime: 4,
      openNow: true,
      openingHours: '24/7',
      delivery: false,
      pickup: true,
      dineIn: false,
      menuHighlights: ['Coffee', 'Chocolates', 'Souvenirs'],
      dietaryOptions: [
        { type: 'vegetarian', icon: '🥬', label: 'Vegetarian' },
      ],
    },
    {
      id: 'del-003',
      name: 'Cafe Coffee Day',
      cuisine: 'Coffee, Snacks',
      airport: 'DEL',
      terminal: 'T3',
      gate: 'C15',
      location: 'Near Gate C15',
      priceRange: '$$',
      rating: 4.1,
      reviewCount: 1892,
      slug: 'ccd-del',
      distanceFromGate: 60,
      walkingTime: 3,
      openNow: true,
      openingHours: '06:00-22:00',
      delivery: true,
      pickup: true,
      dineIn: true,
      menuHighlights: ['Cold Coffee', 'Samosa', 'Pastries'],
      dietaryOptions: [
        { type: 'vegetarian', icon: '🥬', label: 'Vegetarian' },
      ],
    },
  ],
  'BOM': [
    {
      id: 'bom-001',
      name: 'Maharaja Bhog',
      cuisine: 'Rajasthani Thali',
      airport: 'BOM',
      terminal: 'T2',
      gate: 'E5',
      location: 'Near Gate E5-E6',
      priceRange: '$$$',
      rating: 4.6,
      reviewCount: 3214,
      slug: 'maharaja-bhog',
      distanceFromGate: 50,
      walkingTime: 2,
      openNow: true,
      openingHours: '11:00-22:00',
      delivery: true,
      pickup: true,
      dineIn: true,
      menuHighlights: ['Rajasthani Thali', 'Dal Baati Churma', 'Gatte Ki Sabzi'],
      dietaryOptions: [
        { type: 'vegetarian', icon: '🥬', label: 'Vegetarian' },
        { type: 'jain', icon: '🙏', label: 'Jain' },
      ],
    },
    {
      id: 'bom-002',
      name: 'Bademiya',
      cuisine: 'Mughlai, KClaude',
      airport: 'BOM',
      terminal: 'T2',
      gate: 'E8',
      location: 'Near Gate E8',
      priceRange: '$$$',
      rating: 4.3,
      reviewCount: 2876,
      slug: 'bademiya-bom',
      distanceFromGate: 70,
      walkingTime: 4,
      openNow: true,
      openingHours: '12:00-23:00',
      delivery: true,
      pickup: true,
      dineIn: true,
      menuHighlights: ['Seekh Kebab', 'Chicken Tikka', 'Butter Naan'],
      dietaryOptions: [
        { type: 'halal', icon: '☪', label: 'Halal' },
      ],
    },
  ],
};

/**
 * Get restaurants for an airport
 */
export function getRestaurants(airportCode: string): AirportRestaurant[] {
  return AIRPORT_RESTAURANTS[airportCode.toUpperCase()] || [];
}

/**
 * Get restaurant by ID
 */
export function getRestaurant(airportCode: string, restaurantId: string): AirportRestaurant | undefined {
  const restaurants = AIRPORT_RESTAURANTS[airportCode.toUpperCase()];
  return restaurants?.find(r => r.id === restaurantId);
}

/**
 * Search restaurants by criteria
 */
export function searchRestaurants(
  airportCode: string,
  filters: {
    cuisine?: string;
    priceRange?: string;
    dietary?: string[];
    delivery?: boolean;
    openNow?: boolean;
  }
): AirportRestaurant[] {
  let restaurants = getRestaurants(airportCode);

  if (filters.cuisine) {
    restaurants = restaurants.filter(r =>
      r.cuisine.toLowerCase().includes(filters.cuisine!.toLowerCase())
    );
  }

  if (filters.priceRange) {
    restaurants = restaurants.filter(r => r.priceRange === filters.priceRange);
  }

  if (filters.dietary?.length) {
    restaurants = restaurants.filter(r =>
      filters.dietary!.every(d =>
        r.dietaryOptions.some(opt => opt.type === d)
      )
    );
  }

  if (filters.delivery !== undefined) {
    restaurants = restaurants.filter(r => r.delivery === filters.delivery);
  }

  if (filters.openNow) {
    restaurants = restaurants.filter(r => r.openNow);
  }

  return restaurants;
}
