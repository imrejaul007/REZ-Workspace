import { v4 as uuidv4 } from 'uuid';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type OrderType = 'room_service' | 'dine_in' | 'takeaway';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  preparationTime: number; // minutes
  allergens?: string[];
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface RoomOrder {
  id: string;
  orderNumber: string;
  hotelId: string;
  roomId?: string;
  guestId?: string;
  guestName: string;
  orderType: OrderType;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
}

export interface CreateOrderRequest {
  hotelId: string;
  roomId?: string;
  guestId?: string;
  guestName: string;
  orderType: OrderType;
  items: Omit<OrderItem, 'name'>[];
  specialInstructions?: string;
}

// Mock menu items
const MENU: MenuItem[] = [
  { id: 'm1', name: 'Continental Breakfast', description: 'Eggs, toast, fruits, juice', price: 450, category: 'Breakfast', isAvailable: true, preparationTime: 15 },
  { id: 'm2', name: 'Masala Dosa', description: 'Crispy dosa with sambar and chutney', price: 280, category: 'Breakfast', isAvailable: true, preparationTime: 12 },
  { id: 'm3', name: 'Grilled Sandwich', description: 'Cheese and veggie grilled sandwich', price: 220, category: 'Snacks', isAvailable: true, preparationTime: 10 },
  { id: 'm4', name: 'Chicken Biryani', description: 'Aromatic Hyderabadi biryani', price: 380, category: 'Main Course', isAvailable: true, preparationTime: 25 },
  { id: 'm5', name: 'Paneer Tikka', description: 'Grilled cottage cheese', price: 320, category: 'Main Course', isAvailable: true, preparationTime: 20 },
  { id: 'm6', name: 'Fresh Fruit Platter', description: 'Seasonal fruits', price: 180, category: 'Desserts', isAvailable: true, preparationTime: 5 },
  { id: 'm7', name: 'Ice Cream Sundae', description: 'Vanilla ice cream with chocolate sauce', price: 150, category: 'Desserts', isAvailable: true, preparationTime: 5 },
  { id: 'm8', name: 'Espresso', description: 'Strong Italian coffee', price: 120, category: 'Beverages', isAvailable: true, preparationTime: 3 },
  { id: 'm9', name: 'Masala Chai', description: 'Traditional Indian spiced tea', price: 50, category: 'Beverages', isAvailable: true, preparationTime: 5 },
  { id: 'm10', name: 'Mineral Water', description: '500ml bottled water', price: 40, category: 'Beverages', isAvailable: true, preparationTime: 1 },
];

// In-memory store
const orders: Map<string, RoomOrder> = new Map();

export function getMenu(): MenuItem[] {
  return MENU.filter((item) => item.isAvailable);
}

export function getMenuItem(id: string): MenuItem | undefined {
  return MENU.find((item) => item.id === id);
}

export function createOrder(request: CreateOrderRequest): RoomOrder {
  const id = uuidv4();
  const orderNumber = `RS${Date.now().toString().slice(-6)}`;

  // Get item details
  const orderItems: OrderItem[] = request.items.map((item) => {
    const menuItem = getMenuItem(item.menuItemId);
    return {
      menuItemId: item.menuItemId,
      name: menuItem?.name || 'Unknown Item',
      quantity: item.quantity,
      price: menuItem?.price || 0,
      notes: item.notes,
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.12); // 12% GST
  const total = subtotal + tax;

  // Calculate estimated delivery
  const maxPrepTime = Math.max(...orderItems.map((item) => {
    const menuItem = getMenuItem(item.menuItemId);
    return (menuItem?.preparationTime || 10) * item.quantity;
  }));
  const estimatedDelivery = new Date(Date.now() + maxPrepTime * 60 * 1000).toISOString();

  const order: RoomOrder = {
    id,
    orderNumber,
    hotelId: request.hotelId,
    roomId: request.roomId,
    guestId: request.guestId,
    guestName: request.guestName,
    orderType: request.orderType,
    items: orderItems,
    subtotal,
    tax,
    total,
    status: 'pending',
    specialInstructions: request.specialInstructions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedDelivery,
  };

  orders.set(id, order);
  return order;
}

export function getOrder(id: string): RoomOrder | undefined {
  return orders.get(id);
}

export function getOrders(filters?: {
  hotelId?: string;
  status?: OrderStatus;
  guestId?: string;
}): RoomOrder[] {
  let result = Array.from(orders.values());

  if (filters?.hotelId) {
    result = result.filter((o) => o.hotelId === filters.hotelId);
  }
  if (filters?.status) {
    result = result.filter((o) => o.status === filters.status);
  }
  if (filters?.guestId) {
    result = result.filter((o) => o.guestId === filters.guestId);
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updateOrderStatus(id: string, status: OrderStatus): RoomOrder | undefined {
  const order = orders.get(id);
  if (!order) return undefined;

  order.status = status;
  order.updatedAt = new Date().toISOString();

  // If delivered, add estimatedDelivery to actual delivery
  orders.set(id, order);
  return order;
}

export function cancelOrder(id: string): RoomOrder | undefined {
  const order = orders.get(id);
  if (!order) return undefined;

  if (order.status === 'delivered' || order.status === 'cancelled') {
    return undefined;
  }

  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();
  orders.set(id, order);
  return order;
}

export function getOrderStats(hotelId: string): {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
} {
  const hotelOrders = getOrders({ hotelId });
  return {
    totalOrders: hotelOrders.length,
    pendingOrders: hotelOrders.filter((o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing').length,
    completedOrders: hotelOrders.filter((o) => o.status === 'delivered').length,
    totalRevenue: hotelOrders.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
  };
}
