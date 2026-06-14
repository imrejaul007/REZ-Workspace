/**
 * REZ Room Service Types
 */

export interface MenuItem {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  category: string;
  price: number;
  prepTime: number;
  calories?: number;
  dietary: string[];
  allergens?: string[];
  isAvailable: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  customizations?: string[];
}

export interface Order {
  _id?: string;
  id?: string;
  orderNumber: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  hotelId: string;
  items: OrderItem[];
  subtotal: number;
  taxes: number;
  serviceCharge: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  specialInstructions?: string;
  deliveryNotes?: string;
  estimatedDeliveryTime?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'refunded'
  | 'failed';

export interface GuestPreferences {
  _id?: string;
  guestId: string;
  dietaryRestrictions: string[];
  allergies: string[];
  favoriteItems: string[];
  preferredDeliveryTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableReservation {
  _id?: string;
  id?: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  hotelId: string;
  date: Date;
  time: string;
  partySize: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  guestId: string;
  guestName: string;
  roomNumber: string;
  hotelId: string;
  items: {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
    customizations?: string[];
  }[];
  specialInstructions?: string;
  deliveryNotes?: string;
}

export interface UpdateOrderInput {
  items?: CreateOrderInput['items'];
  specialInstructions?: string;
  deliveryNotes?: string;
}

export interface Bill {
  orderNumber: string;
  guestName: string;
  roomNumber: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  taxes: number;
  serviceCharge: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  orderDate: Date;
}
