/**
 * Airzy Dining Extension Types
 * Airport dining and food ordering integration
 */

export interface AirportRestaurant {
  id: string;
  name: string;
  cuisine: string;
  airport: string;
  terminal: string;
  gate?: string;
  location: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  logoUrl?: string;
  slug: string;  // REZ NOW slug for ordering
  distanceFromGate?: number;  // meters
  walkingTime?: number;  // minutes
  openNow: boolean;
  openingHours: string;
  delivery: boolean;
  pickup: boolean;
  dineIn: boolean;
  menuHighlights: string[];
  dietaryOptions: DietaryOption[];
  waitTime?: number;  // minutes
}

export interface DietaryOption {
  type: 'vegetarian' | 'vegan' | 'gluten-free' | 'halal' | 'jain';
  icon: string;
  label: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  category: string;
  dietary: DietaryOption[];
  popular: boolean;
  preparationTime?: number;  // minutes
  calories?: number;
  customization?: {
    required: boolean;
    options: string[];
  };
}

export interface OrderRequest {
  restaurantId: string;
  userId: string;
  items: { menuItemId: string; quantity: number; customizations?: string[] }[];
  deliveryToGate?: string;
  pickupTime?: string;
  notes?: string;
  paymentMethod: 'airzy-coins' | 'razorpay' | 'upi';
}

export interface OrderResponse {
  orderId: string;
  status: 'confirmed' | 'preparing' | 'ready' | 'delivered';
  estimatedTime: number;  // minutes
  restaurant: AirportRestaurant;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: 'pending' | 'completed';
  paymentUrl?: string;
}

export interface RestaurantSearchParams {
  airportCode: string;
  terminal?: string;
  gate?: string;
  cuisine?: string;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  dietary?: DietaryOption['type'][];
  delivery?: boolean;
  openNow?: boolean;
  sortBy?: 'distance' | 'rating' | 'price' | 'delivery-time';
}

export interface DeliveryZone {
  gate: string;
  estimatedTime: number;
  deliveryFee: number;
  available: boolean;
}

export interface UserPreferences {
  favoriteCuisines: string[];
  dietaryRestrictions: DietaryOption['type'][];
  recentOrders: string[];  // restaurant IDs
  savedRestaurants: string[];  // restaurant IDs
}
