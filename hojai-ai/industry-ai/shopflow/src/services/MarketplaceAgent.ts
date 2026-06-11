/**
 * Marketplace Agent - ShopFlow AI
 * Manages marketplace operations, seller onboarding, and multi-vendor retail
 */

import axios from 'axios';

// Types
export interface Marketplace {
  marketplaceId: string;
  name: string;
  description: string;
  sellerIds: string[];
  productCount: number;
  commission: CommissionStructure;
  status: 'active' | 'inactive' | 'maintenance';
  policies: MarketplacePolicies;
}

export interface CommissionStructure {
  defaultRate: number;
  categoryRates: { category: string; rate: number }[];
  volumeDiscounts: { minRevenue: number; discountPercent: number }[];
}

export interface MarketplacePolicies {
  sellerApproval: 'automatic' | 'manual' | 'invite_only';
  productApproval: 'automatic' | 'manual';
  returnWindowDays: number;
  disputeResolution: string;
  fulfillment: 'seller' | 'marketplace' | 'hybrid';
}

export interface Seller {
  sellerId: string;
  marketplaceId: string;
  businessName: string;
  contact: SellerContact;
  address: Address;
  businessType: 'individual' | 'proprietorship' | 'company';
  gstin?: string;
  pan?: string;
  bankAccount: BankAccount;
  rating: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  products: string[];
  performance: SellerPerformance;
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerContact {
  name: string;
  email: string;
  phone: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface BankAccount {
  accountNumber: string;
  ifsc: string;
  bankName: string;
  accountHolder: string;
}

export interface SellerPerformance {
  period: { start: Date; end: Date };
  metrics: {
    totalOrders: number;
    fulfilledOrders: number;
    cancellationRate: number;
    returnRate: number;
    avgDeliveryDays: number;
    onTimeDeliveryRate: number;
    productQualityScore: number;
    serviceScore: number;
    responseTime: number;
    revenue: number;
  };
  level: 'new' | 'bronze' | 'silver' | 'gold' | 'platinum';
  badges: string[];
}

export interface MarketplaceProduct {
  productId: string;
  marketplaceId: string;
  sellerId: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  brand?: string;
  images: string[];
  pricing: ProductPricing;
  inventory: ProductInventory;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'inactive';
  fulfillment: { mode: 'seller' | 'marketplace'; handlingDays: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductPricing {
  mrp: number;
  sellingPrice: number;
  cost: number;
  shippingCharge: number;
  discount: number;
  taxRate: number;
}

export interface ProductInventory {
  available: number;
  reserved: number;
  warehouseLocation: string;
}

export interface Order {
  orderId: string;
  marketplaceId: string;
  orderNumber: string;
  customerId: string;
  sellerId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  shippingAddress: Address;
  billingAddress: Address;
  payment: PaymentDetails;
  timeline: OrderEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  itemId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned';
}

export interface PaymentDetails {
  method: 'prepaid' | 'cod' | 'upi' | 'card';
  status: 'pending' | 'captured' | 'refunded';
  transactionId?: string;
  payoutStatus: 'pending' | 'processed' | 'held';
  payoutDate?: Date;
}

export interface OrderEvent {
  eventId: string;
  type: string;
  description: string;
  timestamp: Date;
  actor: 'system' | 'seller' | 'customer' | 'marketplace';
}

export interface Dispute {
  disputeId: string;
  orderId: string;
  productId: string;
  sellerId: string;
  customerId: string;
  type: 'product_not_received' | 'product_damaged' | 'product_wrong' | 'refund_request' | 'return_request';
  reason: string;
  amount: number;
  status: 'open' | 'under_review' | 'resolved' | 'escalated' | 'closed';
  resolution?: { type: 'refund' | 'replacement' | 'partial_refund'; amount?: number };
  timeline: DisputeEvent[];
  createdAt: Date;
  resolvedAt?: Date;
}

export interface DisputeEvent {
  timestamp: Date;
  actor: string;
  action: string;
  comment?: string;
}

export interface Payout {
  payoutId: string;
  sellerId: string;
  period: { start: Date; end: Date };
  orders: string[];
  grossAmount: number;
  commission: number;
  fees: number;
  refunds: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  processedAt?: Date;
}

export class MarketplaceAgent {
  private shopflowBaseUrl: string;

  constructor() {
    this.shopflowBaseUrl = process.env.SHOPFLOW_BASE_URL || 'http://localhost:4830';
  }

  /**
   * Create a marketplace
   */
  async createMarketplace(marketplaceData: Partial<Marketplace>): Promise<Marketplace> {
    const marketplaceId = `MKT-${Date.now()}`;

    return {
      marketplaceId,
      name: marketplaceData.name || 'New Marketplace',
      description: marketplaceData.description || '',
      sellerIds: [],
      productCount: 0,
      commission: marketplaceData.commission || {
        defaultRate: 15,
        categoryRates: [
          { category: 'electronics', rate: 10 },
          { category: 'fashion', rate: 18 },
          { category: 'grocery', rate: 8 }
        ],
        volumeDiscounts: [
          { minRevenue: 100000, discountPercent: 2 },
          { minRevenue: 500000, discountPercent: 5 },
          { minRevenue: 1000000, discountPercent: 8 }
        ]
      },
      status: 'active',
      policies: marketplaceData.policies || {
        sellerApproval: 'manual',
        productApproval: 'automatic',
        returnWindowDays: 7,
        disputeResolution: 'marketplace_arbitration',
        fulfillment: 'hybrid'
      }
    };
  }

  /**
   * Onboard a seller
   */
  async onboardSeller(
    marketplaceId: string,
    sellerData: Partial<Seller>
  ): Promise<Seller> {
    const sellerId = `SEL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    return {
      sellerId,
      marketplaceId,
      businessName: sellerData.businessName || '',
      contact: sellerData.contact || { name: '', email: '', phone: '' },
      address: sellerData.address || { street: '', city: '', state: '', postalCode: '', country: 'India' },
      businessType: sellerData.businessType || 'proprietorship',
      gstin: sellerData.gstin,
      pan: sellerData.pan,
      bankAccount: sellerData.bankAccount || { accountNumber: '', ifsc: '', bankName: '', accountHolder: '' },
      rating: 0,
      status: 'pending',
      products: [],
      performance: {
        period: { start: new Date(), end: new Date() },
        metrics: {
          totalOrders: 0,
          fulfilledOrders: 0,
          cancellationRate: 0,
          returnRate: 0,
          avgDeliveryDays: 0,
          onTimeDeliveryRate: 0,
          productQualityScore: 0,
          serviceScore: 0,
          responseTime: 0,
          revenue: 0
        },
        level: 'new',
        badges: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Approve seller
   */
  async approveSeller(sellerId: string): Promise<Seller> {
    return {
      sellerId,
      marketplaceId: '',
      businessName: '',
      contact: { name: '', email: '', phone: '' },
      address: { street: '', city: '', state: '', postalCode: '', country: '' },
      businessType: 'proprietorship',
      rating: 5,
      status: 'approved',
      products: [],
      performance: {
        period: { start: new Date(), end: new Date() },
        metrics: {
          totalOrders: 0, fulfilledOrders: 0, cancellationRate: 0, returnRate: 0,
          avgDeliveryDays: 0, onTimeDeliveryRate: 0, productQualityScore: 5,
          serviceScore: 5, responseTime: 0, revenue: 0
        },
        level: 'bronze',
        badges: ['New Seller']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * List a product on marketplace
   */
  async listProduct(
    marketplaceId: string,
    sellerId: string,
    productData: Partial<MarketplaceProduct>
  ): Promise<MarketplaceProduct> {
    const productId = `PROD-${Date.now()}`;

    return {
      productId,
      marketplaceId,
      sellerId,
      sku: productData.sku || `SKU-${productId}`,
      name: productData.name || '',
      description: productData.description || '',
      category: productData.category || '',
      brand: productData.brand,
      images: productData.images || [],
      pricing: productData.pricing || {
        mrp: 0,
        sellingPrice: 0,
        cost: 0,
        shippingCharge: 0,
        discount: 0,
        taxRate: 18
      },
      inventory: productData.inventory || {
        available: 0,
        reserved: 0,
        warehouseLocation: ''
      },
      status: 'pending',
      fulfillment: productData.fulfillment || { mode: 'seller', handlingDays: 3 },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Create order
   */
  async createOrder(
    marketplaceId: string,
    orderData: {
      customerId: string;
      sellerId: string;
      items: { productId: string; quantity: number; unitPrice: number }[];
      shippingAddress: Address;
    }
  ): Promise<Order> {
    const orderId = `ORD-${Date.now()}`;
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

    const items: OrderItem[] = orderData.items.map((item, i) => ({
      itemId: `ITEM-${orderId}-${i}`,
      productId: item.productId,
      productName: '',
      sku: '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
      status: 'pending' as const
    }));

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    return {
      orderId,
      marketplaceId,
      orderNumber,
      customerId: orderData.customerId,
      sellerId: orderData.sellerId,
      items,
      subtotal,
      shipping: 50,
      tax: subtotal * 0.18,
      total: subtotal * 1.18 + 50,
      status: 'pending',
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.shippingAddress,
      payment: {
        method: 'prepaid',
        status: 'pending',
        payoutStatus: 'pending'
      },
      timeline: [{
        eventId: `EVT-${Date.now()}`,
        type: 'order_placed',
        description: 'Order placed successfully',
        timestamp: new Date(),
        actor: 'customer'
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    notes?: string
  ): Promise<Order> {
    const timeline: OrderEvent = {
      eventId: `EVT-${Date.now()}`,
      type: status,
      description: notes || `Order status updated to ${status}`,
      timestamp: new Date(),
      actor: 'system'
    };

    return {
      orderId,
      marketplaceId: '',
      orderNumber: '',
      customerId: '',
      sellerId: '',
      items: [],
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      status,
      shippingAddress: { street: '', city: '', state: '', postalCode: '', country: '' },
      billingAddress: { street: '', city: '', state: '', postalCode: '', country: '' },
      payment: { method: 'prepaid', status: 'pending', payoutStatus: 'pending' },
      timeline: [timeline],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Open dispute
   */
  async openDispute(
    orderId: string,
    type: Dispute['type'],
    reason: string,
    amount: number
  ): Promise<Dispute> {
    return {
      disputeId: `DSP-${Date.now()}`,
      orderId,
      productId: '',
      sellerId: '',
      customerId: '',
      type,
      reason,
      amount,
      status: 'open',
      timeline: [{
        timestamp: new Date(),
        actor: 'customer',
        action: 'dispute_opened',
        comment: reason
      }],
      createdAt: new Date()
    };
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    disputeId: string,
    resolution: Dispute['resolution']
  ): Promise<Dispute> {
    return {
      disputeId,
      orderId: '',
      productId: '',
      sellerId: '',
      customerId: '',
      type: 'refund_request',
      reason: '',
      amount: 0,
      status: 'resolved',
      resolution,
      timeline: [{
        timestamp: new Date(),
        actor: 'marketplace',
        action: 'dispute_resolved',
        comment: `Resolved with ${resolution?.type}`
      }],
      createdAt: new Date(),
      resolvedAt: new Date()
    };
  }

  /**
   * Process seller payout
   */
  async processPayout(
    sellerId: string,
    period: { start: Date; end: Date }
  ): Promise<Payout> {
    const payoutId = `PAY-${Date.now()}`;
    const grossAmount = Math.random() * 500000 + 50000;
    const commission = grossAmount * 0.15;

    return {
      payoutId,
      sellerId,
      period,
      orders: [],
      grossAmount,
      commission,
      fees: 500,
      refunds: Math.random() * 5000,
      netAmount: grossAmount - commission - 500,
      status: 'pending'
    };
  }

  /**
   * Get seller analytics
   */
  async getSellerAnalytics(
    sellerId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    summary: SellerPerformance['metrics'];
    trends: { date: Date; orders: number; revenue: number }[];
    topProducts: { productId: string; name: string; units: number; revenue: number }[];
  }> {
    return {
      summary: {
        totalOrders: 500,
        fulfilledOrders: 485,
        cancellationRate: 2,
        returnRate: 3,
        avgDeliveryDays: 4,
        onTimeDeliveryRate: 95,
        productQualityScore: 4.5,
        serviceScore: 4.3,
        responseTime: 2,
        revenue: 2500000
      },
      trends: [],
      topProducts: []
    };
  }

  /**
   * Calculate commission for seller
   */
  async calculateCommission(
    sellerId: string,
    revenue: number
  ): Promise<{
    grossRevenue: number;
    commissionRate: number;
    commissionAmount: number;
    finalPayout: number;
  }> {
    let rate = 15;
    if (revenue >= 1000000) rate = 7;
    else if (revenue >= 500000) rate = 10;
    else if (revenue >= 100000) rate = 13;

    return {
      grossRevenue: revenue,
      commissionRate: rate,
      commissionAmount: revenue * (rate / 100),
      finalPayout: revenue - (revenue * (rate / 100))
    };
  }

  /**
   * Get marketplace insights
   */
  async getMarketplaceInsights(
    marketplaceId: string
  ): Promise<{
    totalSellers: number;
    totalProducts: number;
    totalOrders: number;
    gmv: number;
    avgOrderValue: number;
    topCategories: { category: string; revenue: number; growth: number }[];
    sellerLevelDistribution: Record<string, number>;
  }> {
    return {
      totalSellers: 500,
      totalProducts: 50000,
      totalOrders: 100000,
      gmv: 50000000,
      avgOrderValue: 500,
      topCategories: [
        { category: 'Electronics', revenue: 15000000, growth: 25 },
        { category: 'Fashion', revenue: 12000000, growth: 15 },
        { category: 'Home', revenue: 8000000, growth: 30 }
      ],
      sellerLevelDistribution: {
        new: 200,
        bronze: 150,
        silver: 100,
        gold: 40,
        platinum: 10
      }
    };
  }
}

export const marketplaceAgent = new MarketplaceAgent();