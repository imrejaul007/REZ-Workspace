/**
 * Supplier Agent - ShopFlow AI
 * Manages supplier relationships, procurement, and supply chain operations
 */

import axios from 'axios';

// Types
export interface Supplier {
  supplierId: string;
  name: string;
  code: string;
  contact: {
    email: string;
    phone: string;
    address: Address;
  };
  categories: string[];
  rating: number;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  paymentTerms: PaymentTerms;
  certifications: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentTerms {
  days: number;
  method: 'prepaid' | 'net30' | 'net60' | 'cod';
  discount?: { percent: number; days: number };
}

export interface PurchaseOrder {
  orderId: string;
  supplierId: string;
  orderNumber: string;
  items: PurchaseOrderItem[];
  status: 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'received' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  shippingCost: number;
  expectedDelivery: Date;
  actualDelivery?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  itemId: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
  receivedQuantity: number;
  status: 'pending' | 'partial' | 'fulfilled';
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  period: { start: Date; end: Date };
  metrics: {
    onTimeDeliveryRate: number;
    fillRate: number;
    orderAccuracy: number;
    qualityScore: number;
    responseTime: number;
    totalOrders: number;
    totalValue: number;
    returnsRate: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  issues: SupplierIssue[];
}

export interface SupplierIssue {
  issueId: string;
  type: 'quality' | 'delivery' | 'pricing' | 'documentation';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedAt: Date;
  resolvedAt?: Date;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface SupplyForecast {
  productId: string;
  sku: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  daysOfSupply: number;
  forecastDemand: number;
  leadTimeDays: number;
  recommendedOrderDate: Date;
  suggestedQuantity: number;
  supplierId?: string;
  supplierName?: string;
  confidence: number;
}

export interface SupplierContract {
  contractId: string;
  supplierId: string;
  title: string;
  type: 'master_agreement' | 'volume_discount' | 'exclusive' | 'consignment';
  effectiveDate: Date;
  expirationDate: Date;
  terms: ContractTerms;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  documents: { name: string; url: string }[];
}

export interface ContractTerms {
  paymentTerms: string;
  deliveryTerms: string;
  minimumOrder: number;
  maximumOrder?: number;
  volumeDiscounts?: VolumeDiscount[];
  exclusivity: boolean;
  autoRenew: boolean;
}

export interface VolumeDiscount {
  minQuantity: number;
  maxQuantity: number;
  discountPercent: number;
}

export class SupplierAgent {
  private shopflowBaseUrl: string;

  constructor() {
    this.shopflowBaseUrl = process.env.SHOPFLOW_BASE_URL || 'http://localhost:4830';
  }

  /**
   * Create a new supplier
   */
  async createSupplier(supplierData: Partial<Supplier>): Promise<Supplier> {
    const supplierId = `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    return {
      supplierId,
      name: supplierData.name || 'New Supplier',
      code: `SUP-${supplierId}`,
      contact: supplierData.contact || {
        email: '',
        phone: '',
        address: { street: '', city: '', state: '', postalCode: '', country: 'India' }
      },
      categories: supplierData.categories || [],
      rating: 0,
      status: 'pending',
      paymentTerms: supplierData.paymentTerms || { days: 30, method: 'net30' },
      certifications: supplierData.certifications || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get supplier by ID
   */
  async getSupplier(supplierId: string): Promise<Supplier | null> {
    try {
      const { data } = await axios.get(`${this.shopflowBaseUrl}/api/suppliers/${supplierId}`);
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Evaluate supplier performance
   */
  async evaluatePerformance(
    supplierId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<SupplierPerformance> {
    const start = dateRange?.start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = dateRange?.end || new Date();

    return {
      supplierId,
      supplierName: '',
      period: { start, end },
      metrics: {
        onTimeDeliveryRate: 95,
        fillRate: 98,
        orderAccuracy: 99,
        qualityScore: 4.5,
        responseTime: 4,
        totalOrders: 150,
        totalValue: 2500000,
        returnsRate: 1.5
      },
      trend: 'stable',
      issues: []
    };
  }

  /**
   * Create a purchase order
   */
  async createPurchaseOrder(
    supplierId: string,
    items: { productId: string; quantity: number; unitCost: number }[]
  ): Promise<PurchaseOrder> {
    const orderId = `PO-${Date.now()}`;
    const orderItems: PurchaseOrderItem[] = items.map((item, i) => ({
      itemId: `POI-${orderId}-${i}`,
      productId: item.productId,
      sku: '',
      name: '',
      quantity: item.quantity,
      unitCost: item.unitCost,
      total: item.quantity * item.unitCost,
      receivedQuantity: 0,
      status: 'pending'
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);

    return {
      orderId,
      supplierId,
      orderNumber: `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      items: orderItems,
      status: 'draft',
      subtotal,
      tax: subtotal * 0.18,
      total: subtotal * 1.18,
      shippingCost: 0,
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Submit purchase order to supplier
   */
  async submitPurchaseOrder(orderId: string): Promise<PurchaseOrder> {
    return {
      orderId,
      supplierId: '',
      orderNumber: '',
      items: [],
      status: 'submitted',
      subtotal: 0,
      tax: 0,
      total: 0,
      shippingCost: 0,
      expectedDelivery: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Receive purchase order items
   */
  async receiveOrderItem(
    orderId: string,
    itemId: string,
    quantity: number,
    condition: 'good' | 'damaged' | 'rejected' = 'good'
  ): Promise<PurchaseOrderItem> {
    return {
      itemId,
      productId: '',
      sku: '',
      name: '',
      quantity,
      unitCost: 0,
      total: 0,
      receivedQuantity: quantity,
      status: condition === 'good' ? 'fulfilled' : 'partial'
    };
  }

  /**
   * Forecast supply needs
   */
  async forecastSupply(productIds: string[]): Promise<SupplyForecast[]> {
    const forecasts: SupplyForecast[] = [];

    for (const productId of productIds) {
      const { data: product } = await axios.get(`${this.shopflowBaseUrl}/api/products/${productId}`)
        .catch(() => ({ data: null }));

      forecasts.push({
        productId,
        sku: product?.sku || '',
        currentStock: product?.stock || 0,
        safetyStock: 20,
        reorderPoint: 50,
        reorderQuantity: 200,
        daysOfSupply: 30,
        forecastDemand: 100,
        leadTimeDays: 7,
        recommendedOrderDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        suggestedQuantity: 200,
        confidence: 0.85
      });
    }

    return forecasts;
  }

  /**
   * Create supplier contract
   */
  async createContract(
    supplierId: string,
    contractData: Partial<SupplierContract>
  ): Promise<SupplierContract> {
    return {
      contractId: `CONTRACT-${Date.now()}`,
      supplierId,
      title: contractData.title || 'Supply Agreement',
      type: contractData.type || 'master_agreement',
      effectiveDate: contractData.effectiveDate || new Date(),
      expirationDate: contractData.expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      terms: contractData.terms || {
        paymentTerms: 'Net 30',
        deliveryTerms: 'FOB Destination',
        minimumOrder: 10000,
        exclusivity: false,
        autoRenew: true
      },
      status: 'draft',
      documents: []
    };
  }

  /**
   * Negotiate better terms with supplier
   */
  async negotiateTerms(
    supplierId: string,
    currentTerms: PaymentTerms,
    targetImprovement: 'discount' | 'extended_terms' | 'volume_pricing'
  ): Promise<{
    currentTerms: PaymentTerms;
    proposedTerms: PaymentTerms;
    savings: number;
    negotiationStrength: 'strong' | 'moderate' | 'weak';
  }> {
    const savingsEstimate = Math.random() * 100000;

    return {
      currentTerms,
      proposedTerms: {
        ...currentTerms,
        discount: targetImprovement === 'discount'
          ? { percent: 3, days: 10 }
          : currentTerms.discount
      },
      savings: savingsEstimate,
      negotiationStrength: 'moderate'
    };
  }

  /**
   * Compare suppliers for a product
   */
  async compareSuppliers(
    productId: string
  ): Promise<{
    suppliers: {
      supplierId: string;
      name: string;
      unitCost: number;
      leadTime: number;
      rating: number;
      totalScore: number;
    }[];
    recommendedSupplierId: string;
  }> {
    return {
      suppliers: [
        { supplierId: 'SUP-001', name: 'Supplier A', unitCost: 150, leadTime: 5, rating: 4.5, totalScore: 90 },
        { supplierId: 'SUP-002', name: 'Supplier B', unitCost: 145, leadTime: 7, rating: 4.2, totalScore: 88 },
        { supplierId: 'SUP-003', name: 'Supplier C', unitCost: 155, leadTime: 3, rating: 4.8, totalScore: 92 }
      ],
      recommendedSupplierId: 'SUP-003'
    };
  }
}

export const supplierAgent = new SupplierAgent();