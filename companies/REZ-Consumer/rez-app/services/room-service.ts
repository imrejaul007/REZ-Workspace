/**
 * Room Service API Client
 *
 * Consumer-side API client for the Room Service Hub backend.
 * Provides typed methods for:
 * - GET /room-service/:hotelId/:roomId - Get room info
 * - GET /room-service/menu/:hotelId - Get services menu
 * - POST /room-service/order - Place service order
 * - GET /room-service/bill/:bookingId - Get current bill
 * - POST /room-service/checkout - Process checkout
 */

import apiClient, { ApiResponse } from './apiClient';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RoomServiceInfo {
  hotelId: string;
  hotelName: string;
  roomId: string;
  roomNumber: string;
  services: Service[];
  amenities: string[];
  checkIn?: string;
  checkOut?: string;
  guestName?: string;
  bookingId?: string;
}

export interface Service {
  id: string;
  name: string;
  icon: string;
  description: string;
  actionType: 'food' | 'housekeeping' | 'laundry' | 'concierge' | 'checkout' | 'minibar' | 'spa' | 'transport';
  actionData?: Record<string, string>;
  estimatedTime?: string;
  priceRange?: string;
}

export interface ServicesMenu {
  food: Service[];
  housekeeping: Service[];
  laundry: Service[];
  concierge: Service[];
  minibar: Service[];
  spa: Service[];
  transport: Service[];
}

export interface ServiceItem {
  id: string;
  name: string;
  quantity: number;
  pricePaise: number;
}

export interface ServiceOrderRequest {
  bookingId: string;
  hotelId: string;
  roomId: string;
  serviceType: 'food' | 'housekeeping' | 'laundry' | 'concierge' | 'minibar' | 'spa' | 'transport';
  items: ServiceItem[];
  specialInstructions?: string;
}

export interface ServiceOrderResponse {
  success: boolean;
  orderId?: string;
  estimatedTime?: string;
  totalPaise?: number;
  error?: string;
}

export interface Charge {
  id: string;
  description: string;
  amountPaise: number;
  category: string;
  date: string;
}

export interface BillResponse {
  charges: Charge[];
  subtotalPaise: number;
  taxesPaise: number;
  totalPaise: number;
}

export interface CheckoutRequest {
  bookingId: string;
  hotelId: string;
  roomId: string;
  paymentMethod?: 'upi' | 'card' | 'cash' | 'wallet';
  paymentData?: {
    upiId?: string;
    cardLast4?: string;
  };
}

export interface CheckoutResponse {
  success: boolean;
  checkoutId?: string;
  totalAmountPaise: number;
  serviceChargesPaise: number;
  roomChargesPaise: number;
  taxesPaise: number;
  balanceDuePaise: number;
  paymentLink?: string;
  error?: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

export const MOCK_ROOM_SERVICE_INFO = (
  hotelId: string,
  roomId: string,
  checkIn?: string,
  checkOut?: string
): RoomServiceInfo => ({
  hotelId,
  hotelName: 'Grand ReZ Hotel',
  roomId,
  roomNumber: `Room ${roomId.slice(-4)}`,
  services: [
    {
      id: 'room-service-food',
      name: 'Order Food',
      icon: 'restaurant',
      description: 'Order from our curated menu',
      actionType: 'food',
      actionData: { hotelId, roomId },
    },
    {
      id: 'room-service-housekeeping',
      name: 'Housekeeping',
      icon: 'sparkles',
      description: 'Request room cleaning or amenities',
      actionType: 'housekeeping',
      actionData: { hotelId, roomId },
    },
    {
      id: 'room-service-concierge',
      name: 'Concierge',
      icon: 'headset',
      description: 'Get assistance with reservations, transportation',
      actionType: 'concierge',
    },
    {
      id: 'room-service-checkout',
      name: 'Express Checkout',
      icon: 'card',
      description: 'Review and pay your bill',
      actionType: 'checkout',
      actionData: { hotelId },
    },
  ],
  amenities: ['Free WiFi', 'Mini Bar', 'Room Service', 'Housekeeping', 'Laundry'],
  checkIn,
  checkOut,
});

export const MOCK_SERVICES_MENU: ServicesMenu = {
  food: [
    {
      id: 'breakfast',
      name: 'Breakfast',
      icon: 'cafe-outline',
      description: 'Continental & Indian breakfast',
      actionType: 'food',
      estimatedTime: '20-30 mins',
      priceRange: '₹300-800',
    },
    {
      id: 'lunch',
      name: 'Lunch',
      icon: 'restaurant-outline',
      description: 'Multi-cuisine lunch buffet',
      actionType: 'food',
      estimatedTime: '30-45 mins',
      priceRange: '₹500-1200',
    },
    {
      id: 'dinner',
      name: 'Dinner',
      icon: 'moon-outline',
      description: 'Dinner with live counters',
      actionType: 'food',
      estimatedTime: '30-45 mins',
      priceRange: '₹600-1500',
    },
    {
      id: 'late-night',
      name: 'Late Night Snacks',
      icon: 'snow-outline',
      description: 'Sandwiches, noodles, beverages',
      actionType: 'food',
      estimatedTime: '15-20 mins',
      priceRange: '₹200-500',
    },
  ],
  housekeeping: [
    {
      id: 'room-cleaning',
      name: 'Room Cleaning',
      icon: 'sparkles-outline',
      description: 'Full room cleaning service',
      actionType: 'housekeeping',
      estimatedTime: '30-45 mins',
    },
    {
      id: 'extra-towels',
      name: 'Extra Towels',
      icon: 'water-outline',
      description: 'Fresh towels delivered',
      actionType: 'housekeeping',
      estimatedTime: '10-15 mins',
    },
    {
      id: 'turn-down',
      name: 'Turn Down Service',
      icon: 'bed-outline',
      description: 'Evening bed preparation',
      actionType: 'housekeeping',
      estimatedTime: '15-20 mins',
    },
    {
      id: 'amenities',
      name: 'Extra Amenities',
      icon: 'gift-outline',
      description: 'Toiletries, slippers, robes',
      actionType: 'housekeeping',
      estimatedTime: '10-15 mins',
    },
  ],
  laundry: [
    {
      id: 'wash-fold',
      name: 'Wash & Fold',
      icon: 'shirt-outline',
      description: 'Regular laundry service',
      actionType: 'laundry',
      estimatedTime: '4-6 hours',
      priceRange: '₹50-200/item',
    },
    {
      id: 'dry-clean',
      name: 'Dry Cleaning',
      icon: 'briefcase-outline',
      description: 'Premium dry cleaning',
      actionType: 'laundry',
      estimatedTime: '24 hours',
      priceRange: '₹150-500/item',
    },
    {
      id: 'ironing',
      name: 'Express Ironing',
      icon: 'flash-outline',
      description: 'Quick ironing service',
      actionType: 'laundry',
      estimatedTime: '1-2 hours',
      priceRange: '₹30-100/item',
    },
  ],
  concierge: [
    {
      id: 'taxi',
      name: 'Book a Taxi',
      icon: 'car-outline',
      description: 'Airport/station transfers',
      actionType: 'concierge',
      estimatedTime: 'Instant booking',
    },
    {
      id: 'restaurant',
      name: 'Restaurant Booking',
      icon: 'calendar-outline',
      description: 'Book tables at partner restaurants',
      actionType: 'concierge',
      estimatedTime: 'Instant confirmation',
    },
    {
      id: 'tour',
      name: 'City Tours',
      icon: 'map-outline',
      description: 'Guided city tours & sightseeing',
      actionType: 'concierge',
      estimatedTime: 'Varies',
    },
    {
      id: 'medical',
      name: 'Medical Assistance',
      icon: 'medkit-outline',
      description: 'Doctor on call, pharmacy',
      actionType: 'concierge',
      estimatedTime: '30-60 mins',
    },
  ],
  minibar: [
    {
      id: 'beverages',
      name: 'Beverages',
      icon: 'beer-outline',
      description: 'Soft drinks, juices, water',
      actionType: 'minibar',
      estimatedTime: '5-10 mins',
      priceRange: '₹50-300',
    },
    {
      id: 'snacks',
      name: 'Snacks',
      icon: 'pizza-outline',
      description: 'Chips, nuts, chocolates',
      actionType: 'minibar',
      estimatedTime: '5-10 mins',
      priceRange: '₹100-500',
    },
    {
      id: 'liquor',
      name: 'Premium Liquor',
      icon: 'wine-outline',
      description: 'Wines, spirits, beer',
      actionType: 'minibar',
      estimatedTime: '5-10 mins',
      priceRange: '₹300-2000',
    },
  ],
  spa: [
    {
      id: 'massage',
      name: 'Swedish Massage',
      icon: 'hand-right-outline',
      description: '60 min relaxing massage',
      actionType: 'spa',
      estimatedTime: '60 mins',
      priceRange: '₹1500-3000',
    },
    {
      id: 'facial',
      name: 'Facial Treatment',
      icon: 'happy-outline',
      description: 'Rejuvenating facial',
      actionType: 'spa',
      estimatedTime: '45-60 mins',
      priceRange: '₹1200-2500',
    },
    {
      id: 'steam',
      name: 'Steam & Sauna',
      icon: 'thermometer-outline',
      description: 'Access to steam room',
      actionType: 'spa',
      estimatedTime: '30 mins',
      priceRange: '₹500-800',
    },
  ],
  transport: [
    {
      id: 'airport-pickup',
      name: 'Airport Pickup',
      icon: 'airplane-outline',
      description: 'AC car from airport',
      actionType: 'transport',
      estimatedTime: 'Pre-booked',
      priceRange: '₹800-1500',
    },
    {
      id: 'local-tour',
      name: 'Local Sightseeing',
      icon: 'location-outline',
      description: 'AC car for city tour',
      actionType: 'transport',
      estimatedTime: '4-8 hours',
      priceRange: '₹2000-5000',
    },
  ],
};

// ─── API Methods ───────────────────────────────────────────────────────────────

/**
 * Get room service info for a hotel room
 */
export async function getRoomServiceInfo(
  hotelId: string,
  roomId: string,
  token?: string,
  options?: { timeout?: number }
): Promise<{ data: RoomServiceInfo | null; error: string | null }> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response: ApiResponse<RoomServiceInfo> = await apiClient.get(
      `/room-service/${hotelId}/${roomId}`,
      undefined,
      { headers, timeout: options?.timeout }
    );

    if (response.success && response.data) {
      return { data: response.data, error: null };
    }

    return { data: null, error: response.error || 'Failed to fetch room info' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Get services menu for a hotel
 */
export async function getServicesMenu(
  hotelId: string,
  options?: { timeout?: number }
): Promise<{ data: ServicesMenu | null; error: string | null }> {
  try {
    const response: ApiResponse<ServicesMenu> = await apiClient.get(
      `/room-service/menu/${hotelId}`,
      undefined,
      { timeout: options?.timeout }
    );

    if (response.success && response.data) {
      return { data: response.data, error: null };
    }

    return { data: null, error: response.error || 'Failed to fetch menu' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Place a service order
 */
export async function placeServiceOrder(
  order: ServiceOrderRequest,
  options?: { timeout?: number }
): Promise<{ data: ServiceOrderResponse | null; error: string | null }> {
  try {
    const response: ApiResponse<ServiceOrderResponse> = await apiClient.post(
      '/room-service/order',
      order,
      { timeout: options?.timeout }
    );

    if (response.success && response.data) {
      return { data: response.data, error: null };
    }

    return { data: null, error: response.error || 'Failed to place order' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Get current bill/charges for a booking
 */
export async function getBill(
  bookingId: string,
  options?: { timeout?: number }
): Promise<{ data: BillResponse | null; error: string | null }> {
  try {
    const response: ApiResponse<BillResponse> = await apiClient.get(
      `/room-service/bill/${bookingId}`,
      undefined,
      { timeout: options?.timeout }
    );

    if (response.success && response.data) {
      return { data: response.data, error: null };
    }

    return { data: null, error: response.error || 'Failed to fetch bill' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Process guest checkout
 */
export async function processCheckout(
  checkout: CheckoutRequest,
  options?: { timeout?: number }
): Promise<{ data: CheckoutResponse | null; error: string | null }> {
  try {
    const response: ApiResponse<CheckoutResponse> = await apiClient.post(
      '/room-service/checkout',
      checkout,
      { timeout: options?.timeout }
    );

    if (response.success && response.data) {
      return { data: response.data, error: null };
    }

    return { data: null, error: response.error || 'Checkout failed' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

// ─── Export all types ──────────────────────────────────────────────────────────

export type {
  ApiResponse,
};
