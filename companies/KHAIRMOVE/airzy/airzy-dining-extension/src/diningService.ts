/**
 * Dining Service
 * Airport dining and food ordering service
 */

import { AIRPORT_RESTAURANTS, getRestaurants, getRestaurant, searchRestaurants } from './restaurantData';
import {
  AirportRestaurant,
  OrderRequest,
  OrderResponse,
  RestaurantSearchParams,
  DeliveryZone,
} from './types';

/**
 * Get dining recommendations based on user's flight gate
 */
export function getRecommendations(
  airportCode: string,
  gateId: string,
  userPreferences?: { dietary?: string[]; favoriteCuisines?: string[] }
): AirportRestaurant[] {
  let restaurants = getRestaurants(airportCode);

  // Filter open restaurants
  restaurants = restaurants.filter(r => r.openNow);

  // Sort by distance from gate
  restaurants.sort((a, b) => {
    const aDist = a.distanceFromGate || 999;
    const bDist = b.distanceFromGate || 999;
    return aDist - bDist;
  });

  // Boost score for matching preferences
  if (userPreferences) {
    restaurants = restaurants.map(r => {
      let score = 0;
      if (userPreferences.dietary?.length) {
        const hasMatch = userPreferences.dietary.some(d =>
          r.dietaryOptions.some(opt => opt.type === d)
        );
        if (hasMatch) score += 10;
      }
      if (userPreferences.favoriteCuisines?.length) {
        if (userPreferences.favoriteCuisines.some(c =>
          r.cuisine.toLowerCase().includes(c.toLowerCase())
        )) {
          score += 5;
        }
      }
      return { ...r, score };
    });

    // Re-sort by score
    restaurants.sort((a, b) => (b as any).score - (a as any).score);
  }

  return restaurants.slice(0, 5);
}

/**
 * Create a food order via REZ NOW
 */
export async function createOrder(order: OrderRequest): Promise<OrderResponse> {
  const restaurant = Object.values(AIRPORT_RESTAURANTS)
    .flat()
    .find(r => r.id === order.restaurantId);

  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  // Calculate prices (mock)
  const items = order.items.map(item => {
    // Mock menu item lookup
    return {
      name: `Item ${item.menuItemId}`,
      quantity: item.quantity,
      price: 150 * item.quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const deliveryFee = order.deliveryToGate ? 50 : 0;
  const total = subtotal + deliveryFee;

  // Generate order ID
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    orderId,
    status: 'confirmed',
    estimatedTime: restaurant.waitTime || 25,
    restaurant,
    items,
    subtotal,
    deliveryFee,
    total,
    paymentStatus: 'pending',
    paymentUrl: `https://now.rez.money/${restaurant.slug}/checkout?order=${orderId}`,
  };
}

/**
 * Get delivery zones and estimates for an airport
 */
export function getDeliveryZones(airportCode: string): DeliveryZone[] {
  const restaurants = getRestaurants(airportCode);
  const zones: Map<string, DeliveryZone> = new Map();

  // Get unique gates from restaurants
  for (const restaurant of restaurants) {
    if (restaurant.gate && restaurant.delivery) {
      const gate = restaurant.gate;
      if (!zones.has(gate)) {
        zones.set(gate, {
          gate,
          estimatedTime: (restaurant.walkingTime || 15) + 10, // cooking time
          deliveryFee: 50,
          available: true,
        });
      }
    }
  }

  // Add common gates
  const commonGates: Record<string, string[]> = {
    'BLR': ['A1', 'A4', 'A8', 'A12', 'B1', 'B5', 'B8', 'B12'],
    'DEL': ['C1', 'C5', 'C10', 'C15', 'D1', 'D4'],
    'BOM': ['E1', 'E5', 'E8', 'E10'],
  };

  const airportGates = commonGates[airportCode] || [];
  for (const gate of airportGates) {
    if (!zones.has(gate)) {
      zones.set(gate, {
        gate,
        estimatedTime: 30,
        deliveryFee: 75,
        available: true,
      });
    }
  }

  return Array.from(zones.values());
}

/**
 * Get menu from REZ NOW (mock - would call actual API)
 */
export async function getMenu(restaurantId: string): Promise<any[]> {
  // Mock menu items - in production, this would call REZ NOW API
  return [
    {
      id: 'item-1',
      name: 'Margherita Pizza',
      description: 'Classic tomato and mozzarella',
      price: 299,
      category: 'Pizza',
      popular: true,
    },
    {
      id: 'item-2',
      name: 'Chicken Biryani',
      description: 'Aromatic rice with chicken',
      price: 349,
      category: 'Rice',
      popular: true,
    },
  ];
}

/**
 * Track order status
 */
export function trackOrder(orderId: string): { status: string; estimatedTime?: number } {
  // Mock tracking
  return {
    status: 'preparing',
    estimatedTime: 15,
  };
}
