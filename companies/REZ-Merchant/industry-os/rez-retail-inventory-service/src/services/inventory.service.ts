import { PurchaseOrder, IPurchaseOrder, IPurchaseOrderItem } from '../models/PurchaseOrder';
import { alertService } from './alert.service';
import { PurchaseOrderStatus, AlertType, StockReport } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';

export class InventoryService {
  private readonly CACHE_TTL = 1800;

  /**
   * Create a purchase order
   */
  async createPurchaseOrder(data: {
    supplierId: string;
    supplierName: string;
    items: Omit<IPurchaseOrderItem, 'id' | 'totalCost'>[];
    expectedDeliveryDate?: Date;
    notes?: string;
    createdBy: string;
    warehouseId?: string;
  }): Promise<IPurchaseOrder> {
    try {
      const items = data.items.map(item => ({
        ...item,
        id: uuidv4(),
        totalCost: item.quantity * item.unitCost,
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);

      const purchaseOrder = new PurchaseOrder({
        id: uuidv4(),
        orderNumber: PurchaseOrder.generateOrderNumber(),
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        items,
        totalAmount,
        expectedDeliveryDate: data.expectedDeliveryDate,
        notes: data.notes,
        createdBy: data.createdBy,
        warehouseId: data.warehouseId,
        status: PurchaseOrderStatus.DRAFT,
      });

      await purchaseOrder.save();
      logger.info(`Purchase order created: ${purchaseOrder.orderNumber}`);

      return purchaseOrder.toJSON();
    } catch (error) {
      logger.error('Error creating purchase order:', error);
      throw error;
    }
  }

  /**
   * Get purchase order by ID
   */
  async getPurchaseOrder(id: string): Promise<IPurchaseOrder | null> {
    const cacheKey = `po:${id}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const order = await PurchaseOrder.findOne({ id });
      if (!order) return null;

      const result = order.toJSON();
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Error fetching purchase order:', error);
      return await PurchaseOrder.findOne({ id }).then(o => o?.toJSON() || null);
    }
  }

  /**
   * Update purchase order status
   */
  async updateOrderStatus(id: string, status: PurchaseOrderStatus, userId?: string): Promise<IPurchaseOrder | null> {
    try {
      const order = await PurchaseOrder.findOne({ id });
      if (!order) return null;

      order.status = status;

      if (status === PurchaseOrderStatus.APPROVED && userId) {
        order.approvedBy = userId;
      }

      if (status === PurchaseOrderStatus.RECEIVED) {
        order.actualDeliveryDate = new Date();
      }

      await order.save();
      await this.invalidateCache(id);

      logger.info(`Purchase order ${order.orderNumber} status updated to ${status}`);
      return order.toJSON();
    } catch (error) {
      logger.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Receive inventory against purchase order
   */
  async receiveInventory(
    orderId: string,
    items: { productId: string; quantity: number }[],
    userId: string
  ): Promise<IPurchaseOrder | null> {
    try {
      const order = await PurchaseOrder.findOne({ id: orderId });
      if (!order) return null;

      for (const received of items) {
        const item = order.items.find(i => i.productId === received.productId);
        if (item) {
          item.receivedQuantity += received.quantity;
        }
      }

      // Check if fully received
      const allReceived = order.items.every(i => i.receivedQuantity >= i.quantity);
      if (allReceived) {
        order.status = PurchaseOrderStatus.RECEIVED;
        order.actualDeliveryDate = new Date();
      } else {
        order.status = PurchaseOrderStatus.PARTIAL_RECEIVED;
      }

      await order.save();
      await this.invalidateCache(orderId);

      logger.info(`Inventory received for PO ${order.orderNumber}`);
      return order.toJSON();
    } catch (error) {
      logger.error('Error receiving inventory:', error);
      throw error;
    }
  }

  /**
   * List purchase orders
   */
  async listPurchaseOrders(
    filter: { supplierId?: string; status?: PurchaseOrderStatus } = {},
    page = 1,
    limit = 20
  ): Promise<{ orders: IPurchaseOrder[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filter.supplierId) {
      query.supplierId = filter.supplierId;
    }
    if (filter.status) {
      query.status = filter.status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      PurchaseOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PurchaseOrder.countDocuments(query),
    ]);

    return {
      orders: orders.map(o => o.toJSON()),
      total,
    };
  }

  /**
   * Get pending orders
   */
  async getPendingOrders(): Promise<IPurchaseOrder[]> {
    const orders = await PurchaseOrder.getPendingOrders();
    return orders.map(o => o.toJSON());
  }

  /**
   * Cancel purchase order
   */
  async cancelOrder(id: string): Promise<IPurchaseOrder | null> {
    try {
      const order = await PurchaseOrder.findOne({ id });
      if (!order) return null;

      if (![PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.PENDING].includes(order.status)) {
        throw new Error('Cannot cancel order in current status');
      }

      order.status = PurchaseOrderStatus.CANCELLED;
      await order.save();
      await this.invalidateCache(id);

      logger.info(`Purchase order ${order.orderNumber} cancelled`);
      return order.toJSON();
    } catch (error) {
      logger.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Get purchase order statistics
   */
  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    inTransit: number;
    received: number;
    totalValue: number;
  }> {
    const stats = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          value: { $sum: '$totalAmount' },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      inTransit: 0,
      received: 0,
      totalValue: 0,
    };

    stats.forEach(s => {
      result.total += s.count;
      result.totalValue += s.value;
      if (s._id === PurchaseOrderStatus.PENDING || s._id === PurchaseOrderStatus.APPROVED) {
        result.pending += s.count;
      } else if (s._id === PurchaseOrderStatus.ORDERED || s._id === PurchaseOrderStatus.SHIPPED) {
        result.inTransit += s.count;
      } else if (s._id === PurchaseOrderStatus.RECEIVED) {
        result.received += s.count;
      }
    });

    return result;
  }

  /**
   * Generate stock report
   */
  async generateStockReport(): Promise<StockReport[]> {
    // This would integrate with the retail service to get actual inventory
    // For now, returning a placeholder structure
    return [];
  }

  /**
   * Check stock levels and create alerts
   */
  async checkStockLevels(inventory: {
    productId: string;
    sku: string;
    productName: string;
    quantity: number;
    reorderPoint: number;
    reorderQuantity: number;
  }): Promise<void> {
    try {
      if (inventory.quantity <= 0) {
        await alertService.createAlert({
          productId: inventory.productId,
          sku: inventory.sku,
          productName: inventory.productName,
          alertType: AlertType.OUT_OF_STOCK,
          currentStock: inventory.quantity,
          threshold: inventory.reorderPoint,
        });
      } else if (inventory.quantity <= inventory.reorderPoint) {
        await alertService.createAlert({
          productId: inventory.productId,
          sku: inventory.sku,
          productName: inventory.productName,
          alertType: AlertType.LOW_STOCK,
          currentStock: inventory.quantity,
          threshold: inventory.reorderPoint,
        });

        // Also suggest reorder
        await alertService.createAlert({
          productId: inventory.productId,
          sku: inventory.sku,
          productName: inventory.productName,
          alertType: AlertType.REORDER_SUGGESTED,
          currentStock: inventory.quantity,
          threshold: inventory.reorderPoint,
          suggestedAction: `Suggested order quantity: ${inventory.reorderQuantity}`,
        });
      }
    } catch (error) {
      logger.error('Error checking stock levels:', error);
    }
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache(orderId: string): Promise<void> {
    try {
      await redisClient.del(`po:${orderId}`);
    } catch (error) {
      logger.warn('Cache invalidation failed:', error);
    }
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
