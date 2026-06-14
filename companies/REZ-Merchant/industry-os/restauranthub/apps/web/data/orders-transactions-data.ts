import logger from './utils/logger';

// Orders and Transactions Data for RestoPapa
// 200+ sample orders with varied statuses and realistic payment data

import { allDummyCustomers, allDummyVendors } from './comprehensive-dummy-data';
import { allDummyProducts } from './products-services-data';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
  customizations?: string[];
}

export interface DeliveryInfo {
  type: 'delivery' | 'pickup' | 'dine_in';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: { lat: number; lng: number };
  };
  deliveryTime?: string;
  pickupTime?: string;
  tableNumber?: string;
  deliveryInstructions?: string;
  deliveryFee: number;
}

export interface PaymentInfo {
  id: string;
  method: 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cash' | 'wallet';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partial_refund';
  transactionId: string;
  amount: number;
  currency: 'USD';
  cardLast4?: string;
  cardBrand?: 'visa' | 'mastercard' | 'amex' | 'discover';
  processingFee: number;
  refundAmount?: number;
  refundDate?: string;
  paymentDate: string;
  receipt?: {
    url: string;
    number: string;
  };
}

export interface OrderTracking {
  status: 'placed' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled';
  timestamp: string;
  message: string;
  location?: { lat: number; lng: number };
  estimatedTime?: string;
  actualTime?: string;
  assignedStaff?: {
    id: string;
    name: string;
    role: string;
    photo: string;
    phone?: string;
  };
}

export interface DummyOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vendorId: string;
  vendorName: string;
  vendorLogo: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  totalAmount: number;
  currency: 'USD';
  orderType: 'delivery' | 'pickup' | 'dine_in';
  status: 'placed' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentInfo: PaymentInfo;
  deliveryInfo: DeliveryInfo;
  tracking: OrderTracking[];
  specialInstructions?: string;
  ratings?: {
    food: number;
    service: number;
    delivery: number;
    overall: number;
    comment?: string;
    ratedAt?: string;
  };
  couponCode?: string;
  discountAmount?: number;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  placedAt: string;
  updatedAt: string;
  isReorder: boolean;
  previousOrderId?: string;
}

// Helper function to generate random order items
const generateOrderItems = (vendorId: string, count: number = 3): OrderItem[] => {
  const vendorProducts = allDummyProducts.filter(p => p.vendorId === vendorId && p.isAvailable);
  const selectedProducts = [];
  
  for (let i = 0; i < Math.min(count, vendorProducts.length); i++) {
    const product = vendorProducts[Math.floor(Math.random() * vendorProducts.length)];
    if (!selectedProducts.find(p => p.id === product.id)) {
      selectedProducts.push(product);
    }
  }

  return selectedProducts.map((product, index) => {
    const quantity = Math.floor(Math.random() * 3) + 1;
    return {
      id: `item_${product.id}_${index + 1}`,
      productId: product.id,
      productName: product.name,
      productImage: product.images[0],
      quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
      specialInstructions: Math.random() > 0.7 ? [
        "Extra spicy", "No onions", "Well done", "On the side", 
        "Light sauce", "Extra cheese", "No pickles", "Gluten free"
      ][Math.floor(Math.random() * 8)] : undefined,
      customizations: Math.random() > 0.8 ? [
        "Extra sauce", "Add avocado", "Substitute fries", "Make it spicy"
      ] : undefined
    };
  });
};

// Generate tracking history
const generateOrderTracking = (status: string, orderDate: Date): OrderTracking[] => {
  const statuses: OrderTracking['status'][] = ['placed', 'confirmed', 'preparing'];
  
  if (['ready', 'picked_up', 'out_for_delivery', 'delivered'].includes(status)) {
    statuses.push('ready');
  }
  if (['picked_up', 'out_for_delivery', 'delivered'].includes(status)) {
    statuses.push('picked_up', 'out_for_delivery');
  }
  if (status === 'delivered') {
    statuses.push('delivered');
  }
  if (status === 'cancelled') {
    statuses.push('cancelled');
  }

  return statuses.map((trackStatus, index) => {
    const timestamp = new Date(orderDate.getTime() + (index * 15 * 60 * 1000)); // 15 min intervals
    
    const messages = {
      placed: "Order placed successfully",
      confirmed: "Order confirmed by restaurant",
      preparing: "Kitchen is preparing your order",
      ready: "Order is ready for pickup",
      picked_up: "Order picked up by delivery driver",
      out_for_delivery: "Order is on the way",
      delivered: "Order delivered successfully",
      cancelled: "Order cancelled"
    };

    return {
      status: trackStatus,
      timestamp: timestamp.toISOString(),
      message: messages[trackStatus],
      location: trackStatus === 'out_for_delivery' ? 
        { lat: 40.7589 + Math.random() * 0.1, lng: -73.9851 + Math.random() * 0.1 } : undefined,
      estimatedTime: index === 0 ? "30-45 minutes" : undefined,
      actualTime: trackStatus === 'delivered' ? timestamp.toLocaleTimeString() : undefined,
      assignedStaff: ['preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(trackStatus) ? {
        id: `staff_${Math.floor(Math.random() * 100)}`,
        name: ["Alex Johnson", "Maria Garcia", "David Kim", "Sarah Wilson"][Math.floor(Math.random() * 4)],
        role: trackStatus === 'preparing' ? 'Chef' : trackStatus === 'ready' ? 'Kitchen Manager' : 'Delivery Driver',
        photo: `/staff/staff${Math.floor(Math.random() * 10) + 1}.jpg`,
        phone: trackStatus === 'out_for_delivery' ? `+1-555-${Math.floor(Math.random() * 9000) + 1000}` : undefined
      } : undefined
    };
  });
};

// Generate payment info
const generatePaymentInfo = (totalAmount: number, orderDate: Date): PaymentInfo => {
  const methods = ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'wallet'] as const;
  const statuses = ['completed', 'completed', 'completed', 'completed', 'processing', 'failed', 'refunded', 'partial_refund'] as const;
  const cardBrands = ['visa', 'mastercard', 'amex', 'discover'] as const;
  
  const method = methods[Math.floor(Math.random() * methods.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const processingFee = Math.round((totalAmount * 0.029 + 0.30) * 100) / 100; // 2.9% + $0.30

  return {
    id: `pay_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    method,
    status,
    transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
    amount: totalAmount,
    currency: 'USD',
    cardLast4: ['credit_card', 'debit_card'].includes(method) ? 
      String(Math.floor(Math.random() * 9999)).padStart(4, '0') : undefined,
    cardBrand: ['credit_card', 'debit_card'].includes(method) ? 
      cardBrands[Math.floor(Math.random() * cardBrands.length)] : undefined,
    processingFee,
    refundAmount: status === 'refunded' ? totalAmount : 
      status === 'partial_refund' ? Math.round(totalAmount * 0.5 * 100) / 100 : undefined,
    refundDate: ['refunded', 'partial_refund'].includes(status) ? 
      new Date(orderDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    paymentDate: orderDate.toISOString(),
    receipt: {
      url: `/receipts/receipt_${Date.now()}.pdf`,
      number: `RCP-${Math.floor(Math.random() * 1000000)}`
    }
  };
};

// Generate 250 dummy orders
export const generateDummyOrders = (count: number = 250): DummyOrder[] => {
  const orders: DummyOrder[] = [];
  const orderStatuses = ['delivered', 'delivered', 'delivered', 'out_for_delivery', 'preparing', 'confirmed', 'placed', 'cancelled'] as const;
  const orderTypes = ['delivery', 'pickup', 'dine_in'] as const;
  const coupons = ['SAVE10', 'NEWUSER', 'WEEKEND20', 'LOYAL15', '', '', '', '']; // More empty = less coupon usage

  for (let i = 0; i < count; i++) {
    const customer = allDummyCustomers[Math.floor(Math.random() * allDummyCustomers.length)];
    const vendor = allDummyVendors[Math.floor(Math.random() * allDummyVendors.length)];
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30)); // Orders from last 30 days
    orderDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    const items = generateOrderItems(vendor.id, Math.floor(Math.random() * 4) + 1);
    const subtotal = Math.round(items.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100;
    const tax = Math.round(subtotal * 0.08875 * 100) / 100; // NYC tax rate
    const tip = Math.round(subtotal * (0.15 + Math.random() * 0.1) * 100) / 100; // 15-25% tip
    const deliveryFee = Math.random() > 0.3 ? Math.round((2 + Math.random() * 3) * 100) / 100 : 0; // $2-$5 or free
    const couponCode = coupons[Math.floor(Math.random() * coupons.length)];
    const discountAmount = couponCode ? Math.round(subtotal * (couponCode.includes('10') ? 0.1 : 0.15) * 100) / 100 : 0;
    const totalAmount = Math.round((subtotal + tax + tip + deliveryFee - discountAmount) * 100) / 100;

    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];

    const deliveryInfo: DeliveryInfo = {
      type: orderType,
      address: orderType === 'delivery' ? {
        street: customer.location.address,
        city: customer.location.city,
        state: customer.location.state,
        zipCode: customer.location.zipCode,
        coordinates: customer.location.coordinates
      } : undefined,
      deliveryTime: orderType === 'delivery' ? 
        new Date(orderDate.getTime() + (30 + Math.random() * 30) * 60 * 1000).toISOString() : undefined,
      pickupTime: orderType === 'pickup' ? 
        new Date(orderDate.getTime() + (15 + Math.random() * 15) * 60 * 1000).toISOString() : undefined,
      tableNumber: orderType === 'dine_in' ? `Table ${Math.floor(Math.random() * 20) + 1}` : undefined,
      deliveryInstructions: orderType === 'delivery' && Math.random() > 0.6 ? [
        "Leave at door", "Ring doorbell", "Call when arrived", "Meet at lobby", 
        "Use side entrance", "Apt 2B", "Leave with doorman"
      ][Math.floor(Math.random() * 7)] : undefined,
      deliveryFee
    };

    const order: DummyOrder = {
      id: `order_${String(i + 1).padStart(4, '0')}`,
      orderNumber: `#RH${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.mobile,
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      vendorLogo: vendor.logo,
      items,
      subtotal,
      tax,
      tip,
      deliveryFee,
      totalAmount,
      currency: 'USD',
      orderType,
      status,
      paymentInfo: generatePaymentInfo(totalAmount, orderDate),
      deliveryInfo,
      tracking: generateOrderTracking(status, orderDate),
      specialInstructions: Math.random() > 0.7 ? [
        "Please call when arrived", "Extra napkins", "No contact delivery", 
        "Ring twice", "Leave at door", "Allergic to nuts"
      ][Math.floor(Math.random() * 6)] : undefined,
      ratings: status === 'delivered' && Math.random() > 0.3 ? {
        food: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        service: Math.floor(Math.random() * 2) + 4,
        delivery: Math.floor(Math.random() * 2) + 4,
        overall: Math.floor(Math.random() * 2) + 4,
        comment: Math.random() > 0.5 ? [
          "Great food, fast delivery!", "Amazing taste, will order again", 
          "Perfect as always", "Could be better", "Exceeded expectations"
        ][Math.floor(Math.random() * 5)] : undefined,
        ratedAt: new Date(orderDate.getTime() + 2 * 60 * 60 * 1000).toISOString()
      } : undefined,
      couponCode: couponCode || undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      estimatedDeliveryTime: new Date(orderDate.getTime() + (25 + Math.random() * 20) * 60 * 1000).toISOString(),
      actualDeliveryTime: status === 'delivered' ? 
        new Date(orderDate.getTime() + (20 + Math.random() * 30) * 60 * 1000).toISOString() : undefined,
      placedAt: orderDate.toISOString(),
      updatedAt: new Date(orderDate.getTime() + Math.random() * 60 * 60 * 1000).toISOString(),
      isReorder: Math.random() > 0.8,
      previousOrderId: Math.random() > 0.8 ? `order_${String(Math.floor(Math.random() * i)).padStart(4, '0')}` : undefined
    };

    orders.push(order);
  }

  return orders.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
};

export const allDummyOrders = generateDummyOrders(250);

// Generate order analytics
export const orderAnalytics = {
  totalOrders: allDummyOrders.length,
  totalRevenue: Math.round(allDummyOrders.reduce((sum, order) => sum + order.totalAmount, 0) * 100) / 100,
  averageOrderValue: Math.round((allDummyOrders.reduce((sum, order) => sum + order.totalAmount, 0) / allDummyOrders.length) * 100) / 100,
  statusBreakdown: {
    delivered: allDummyOrders.filter(o => o.status === 'delivered').length,
    out_for_delivery: allDummyOrders.filter(o => o.status === 'out_for_delivery').length,
    preparing: allDummyOrders.filter(o => o.status === 'preparing').length,
    confirmed: allDummyOrders.filter(o => o.status === 'confirmed').length,
    placed: allDummyOrders.filter(o => o.status === 'placed').length,
    cancelled: allDummyOrders.filter(o => o.status === 'cancelled').length
  },
  paymentMethodBreakdown: {
    credit_card: allDummyOrders.filter(o => o.paymentInfo.method === 'credit_card').length,
    debit_card: allDummyOrders.filter(o => o.paymentInfo.method === 'debit_card').length,
    paypal: allDummyOrders.filter(o => o.paymentInfo.method === 'paypal').length,
    apple_pay: allDummyOrders.filter(o => o.paymentInfo.method === 'apple_pay').length,
    google_pay: allDummyOrders.filter(o => o.paymentInfo.method === 'google_pay').length,
    wallet: allDummyOrders.filter(o => o.paymentInfo.method === 'wallet').length
  },
  orderTypeBreakdown: {
    delivery: allDummyOrders.filter(o => o.orderType === 'delivery').length,
    pickup: allDummyOrders.filter(o => o.orderType === 'pickup').length,
    dine_in: allDummyOrders.filter(o => o.orderType === 'dine_in').length
  },
  topVendors: Object.entries(
    allDummyOrders.reduce((acc, order) => {
      acc[order.vendorId] = (acc[order.vendorId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([vendorId, orderCount]) => {
    const vendor = allDummyVendors.find(v => v.id === vendorId);
    return {
      vendorId,
      vendorName: vendor?.businessName || 'Unknown',
      orderCount,
      revenue: Math.round(
        allDummyOrders
          .filter(o => o.vendorId === vendorId)
          .reduce((sum, order) => sum + order.totalAmount, 0) * 100
      ) / 100
    };
  })
};

logger.info(`Generated ${allDummyOrders.length} orders`);
logger.info(`Total revenue: $${orderAnalytics.totalRevenue}`);
logger.info(`Average order value: $${orderAnalytics.averageOrderValue}`);