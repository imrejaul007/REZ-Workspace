import { apiClient, PaginatedResponse } from './client';

export interface OrderItem {
  id?: string;
  menuItemId?: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations?;
  specialInstructions?: string;
  menuItem?: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
}

export interface OrderCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface OrderVendor {
  id: string;
  businessName: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress: string;
  city: string;
  state: string;
  averageRating?: number;
}

export interface OrderRestaurant {
  id: string;
  businessName: string;
  businessPhone?: string;
  businessEmail?: string;
  address: string;
  city: string;
  state: string;
  averageRating?: number;
}

export interface OrderStatusHistory {
  id: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  customerId: string;
  restaurantId?: string;
  vendorId?: string;
  
  // Pricing
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  
  // Payment
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  paymentId?: string;
  
  // Delivery
  deliveryAddress?;
  deliveryTime?: string;
  estimatedTime?: string;
  actualTime?: string;
  
  // Notes
  customerNotes?: string;
  kitchenNotes?: string;
  
  // Timing
  preparationTime?: number;
  deliveryDuration?: number;
  
  // Relations
  items: OrderItem[];
  customer: OrderCustomer;
  restaurant?: OrderRestaurant;
  vendor?: OrderVendor;
  statusHistory?: OrderStatusHistory[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expectedDelivery?: string;
}

export interface CreateOrderData {
  restaurantId?: string;
  vendorId?: string;
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  items: Omit<OrderItem, 'id'>[];
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  deliveryAddress?;
  customerNotes?: string;
  kitchenNotes?: string;
}

export interface UpdateOrderData {
  status?: Order['status'];
  paymentMethod?: Order['paymentMethod'];
  paymentStatus?: Order['paymentStatus'];
  paymentId?: string;
  customerNotes?: string;
  kitchenNotes?: string;
  preparationTime?: number;
  deliveryDuration?: number;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: Order['status'];
  type?: Order['type'];
  customerId?: string;
  restaurantId?: string;
  vendorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  preparingOrders: number;
  readyOrders: number;
  dispatchedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  processingOrders: number;
  totalRevenue: number;
}

export const ordersApi = {
  // Get all orders with filtering
  getOrders: async (params?: OrderQueryParams): Promise<PaginatedResponse<Order>> => {
    return apiClient.getPaginated('/orders', params);
  },

  // Get single order by ID
  getOrder: async (id: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  // Create new order
  createOrder: async (data: CreateOrderData): Promise<Order> => {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data;
  },

  // Update order
  updateOrder: async (id: string, data: UpdateOrderData): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/orders/${id}`, data);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id: string, reason: string): Promise<Order> => {
    const response = await apiClient.post<Order>(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  // Get order statistics
  getOrderStats: async (): Promise<OrderStats> => {
    const response = await apiClient.get<OrderStats>('/orders/stats');
    return response.data;
  },

  // Search orders
  searchOrders: async (query: string, filters?: Omit<OrderQueryParams, 'search'>): Promise<Order[]> => {
    const response = await apiClient.search<Order>('/orders', query, filters);
    return response.data;
  },
};