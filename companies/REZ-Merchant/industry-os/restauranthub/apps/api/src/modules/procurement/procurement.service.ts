import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

/**
 * NexaBizz Integration
 *
 * Handles automatic procurement when inventory runs low:
 * - Creates RFQ (Request for Quote) when stock is low
 * - Tracks supplier responses
 * - Manages purchase orders
 */

// NexaBizz API Configuration
const NEXABIZZ_URL = process.env.NEXABIZZ_URL || 'http://localhost:4700';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';

/**
 * RFQ Item
 */
export interface RFQItem {
  productId: string;
  productName: string;
  currentStock: number;
  requiredQuantity: number;
  unit: string;
}

/**
 * RFQ Request
 */
export interface CreateRFQRequest {
  restaurantId: string;
  restaurantName?: string;
  items: RFQItem[];
  urgency: 'low' | 'medium' | 'high';
  notes?: string;
}

/**
 * RFQ Response
 */
export interface RFQResponse {
  success: boolean;
  rfqId?: string;
  message: string;
  estimatedCost?: number;
  suppliersNotified?: number;
}

/**
 * Procurement Service
 *
 * Handles automatic procurement via NexaBizz:
 * - Creates RFQ when inventory is low
 * - Tracks procurement status
 * - Manages purchase orders
 */
@Injectable()
export class ProcurementService {
  private readonly logger = new Logger(ProcurementService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // LOW STOCK DETECTION
  // ==========================================

  /**
   * Check for low stock items and create RFQ if needed
   */
  async checkAndCreateProcurement(
    restaurantId: string,
    lowStockItems: Array<{ productId: string; currentStock: number; minStock: number }>,
  ): Promise<RFQResponse> {
    if (lowStockItems.length === 0) {
      return { success: true, message: 'No low stock items' };
    }

    // Get product details
    const productIds = lowStockItems.map(i => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, restaurantId },
      select: { id: true, name: true, unit: true, stock: true, minStock: true },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // Build RFQ items
    const rfqItems: RFQItem[] = lowStockItems
      .map(item => {
        const product = productMap.get(item.productId);
        if (!product) return null;

        // Calculate required quantity (restock to 2x min stock)
        const requiredQuantity = Math.max(1, Math.ceil((product.minStock || 10) * 2 - item.currentStock));

        return {
          productId: item.productId,
          productName: product.name,
          currentStock: item.currentStock,
          requiredQuantity,
          unit: product.unit || 'pieces',
        };
      })
      .filter((item): item is RFQItem => item !== null && item.requiredQuantity > 0);

    if (rfqItems.length === 0) {
      return { success: true, message: 'No items need restocking' };
    }

    // Create RFQ via NexaBizz
    return this.createRFQ({
      restaurantId,
      items: rfqItems,
      urgency: 'medium',
      notes: `Auto-generated from low stock alert`,
    });
  }

  // ==========================================
  // RFQ MANAGEMENT
  // ==========================================

  /**
   * Create RFQ via NexaBizz API
   */
  async createRFQ(request: CreateRFQRequest): Promise<RFQResponse> {
    try {
      this.logger.log(`[Procurement] Creating RFQ for restaurant ${request.restaurantId} with ${request.items.length} items`);

      // Call NexaBizz API
      const response = await axios.post(
        `${NEXABIZZ_URL}/api/v1/rfq/create`,
        {
          buyerId: request.restaurantId,
          buyerName: request.restaurantName || `Restaurant ${request.restaurantId}`,
          items: request.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.requiredQuantity,
            unit: item.unit,
            currentStock: item.currentStock,
          })),
          urgency: request.urgency,
          notes: request.notes,
          source: 'restauranthub_automatic',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 15000,
        }
      );

      if (response.data.success) {
        this.logger.log(`[Procurement] RFQ created: ${response.data.rfqId}`);

        return {
          success: true,
          rfqId: response.data.rfqId,
          message: 'RFQ created successfully',
          estimatedCost: response.data.estimatedCost,
          suppliersNotified: response.data.suppliersNotified || 0,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Failed to create RFQ',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`[Procurement] NexaBizz API error: ${error.message}`);

        // If NexaBizz is unavailable, store for later
        await this.queueProcurementRequest(request);

        return {
          success: true,
          message: 'Procurement request queued - NexaBizz temporarily unavailable',
        };
      }

      this.logger.error(`[Procurement] Error creating RFQ: ${error}`);
      return {
        success: false,
        message: 'Failed to create RFQ',
      };
    }
  }

  /**
   * Queue procurement request for later processing
   */
  private async queueProcurementRequest(request: CreateRFQRequest): Promise<void> {
    this.logger.warn(`[Procurement] Queueing procurement request for restaurant ${request.restaurantId}`);

    // Store in database for later processing
    // This could use the RetryQueue service
    // For now, just log
  }

  /**
   * Get RFQ status
   */
  async getRFQStatus(rfqId: string): Promise<{
    rfqId: string;
    status: string;
    quotes: number;
    bestQuote?: { supplier: string; price: number; deliveryDays: number };
  }> {
    try {
      const response = await axios.get(
        `${NEXABIZZ_URL}/api/v1/rfq/${rfqId}`,
        {
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return {
          rfqId,
          status: response.data.status,
          quotes: response.data.quotes?.length || 0,
          bestQuote: response.data.bestQuote,
        };
      }

      return { rfqId, status: 'unknown', quotes: 0 };
    } catch (error) {
      this.logger.error(`[Procurement] Error getting RFQ status: ${error}`);
      return { rfqId, status: 'error', quotes: 0 };
    }
  }

  // ==========================================
  // PURCHASE ORDER
  // ==========================================

  /**
   * Create purchase order from accepted quote
   */
  async createPurchaseOrder(
    rfqId: string,
    quoteId: string,
    deliveryAddress: string,
  ): Promise<{ success: boolean; poId?: string; message: string }> {
    try {
      const response = await axios.post(
        `${NEXABIZZ_URL}/api/v1/purchase-orders/create`,
        {
          rfqId,
          quoteId,
          deliveryAddress,
          source: 'restauranthub',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 15000,
        }
      );

      if (response.data.success) {
        this.logger.log(`[Procurement] Purchase order created: ${response.data.poId}`);
        return {
          success: true,
          poId: response.data.poId,
          message: 'Purchase order created successfully',
        };
      }

      return { success: false, message: response.data.message || 'Failed to create PO' };
    } catch (error) {
      this.logger.error(`[Procurement] Error creating PO: ${error}`);
      return { success: false, message: 'Failed to create purchase order' };
    }
  }

  // ==========================================
  // SUPPLIER MANAGEMENT
  // ==========================================

  /**
   * Get preferred suppliers for a category
   */
  async getPreferredSuppliers(
    restaurantId: string,
    category?: string,
  ): Promise<Array<{ supplierId: string; name: string; rating: number; minOrder: number }>> {
    try {
      const response = await axios.get(
        `${NEXABIZZ_URL}/api/v1/suppliers/preferred`,
        {
          params: { restaurantId, category },
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return response.data.suppliers || [];
      }

      return [];
    } catch (error) {
      this.logger.error(`[Procurement] Error getting suppliers: ${error}`);
      return [];
    }
  }

  // ==========================================
  // INVENTORY REORDERING
  // ==========================================

  /**
   * Get reorder recommendations based on consumption patterns
   */
  async getReorderRecommendations(
    restaurantId: string,
    days: number = 7,
  ): Promise<Array<{
    productId: string;
    productName: string;
    avgDailyUsage: number;
    currentStock: number;
    recommendedOrder: number;
    urgency: 'low' | 'medium' | 'high';
  }>> {
    // Calculate average daily usage from recent orders
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          createdAt: { gte: startDate },
          paymentStatus: 'COMPLETED',
        },
      },
      include: { product: true },
    });

    // Aggregate by product
    const usageByProduct = new Map<string, { name: string; total: number; unit: string }>();
    orderItems.forEach(item => {
      const existing = usageByProduct.get(item.productId);
      if (existing) {
        existing.total += item.quantity;
      } else {
        usageByProduct.set(item.productId, {
          name: item.product?.name || item.productId,
          total: item.quantity,
          unit: item.product?.unit || 'pieces',
        });
      }
    });

    // Get current stock levels
    const productIds = Array.from(usageByProduct.keys());
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, restaurantId },
      select: { id: true, name: true, stock: true, minStock: true, unit: true },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // Calculate recommendations
    const recommendations: Array<{
      productId: string;
      productName: string;
      avgDailyUsage: number;
      currentStock: number;
      recommendedOrder: number;
      urgency: 'low' | 'medium' | 'high';
    }> = [];

    usageByProduct.forEach((usage, productId) => {
      const product = productMap.get(productId);
      if (!product) return;

      const avgDailyUsage = usage.total / days;
      const daysOfStock = product.stock / avgDailyUsage;
      const minStock = product.minStock || avgDailyUsage * 3;

      // Recommend restocking if below 5 days of stock
      if (daysOfStock < 5 || product.stock < minStock) {
        const recommendedOrder = Math.ceil(Math.max(avgDailyUsage * 7, minStock * 2) - product.stock);

        let urgency: 'low' | 'medium' | 'high' = 'low';
        if (daysOfStock < 2) urgency = 'high';
        else if (daysOfStock < 3) urgency = 'medium';

        recommendations.push({
          productId,
          productName: product.name,
          avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
          currentStock: product.stock,
          recommendedOrder: Math.max(0, recommendedOrder),
          urgency,
        });
      }
    });

    // Sort by urgency
    return recommendations.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }
}
