import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deduct inventory when an order is placed
   * This is called from OrdersService to track stock consumption
   */
  async deductInventory(params: {
    restaurantId: string;
    items: Array<{ productId: string; quantity: number }>;
    orderId: string;
    orderNumber: string;
  }): Promise<{
    success: boolean;
    deducted: Array<{ productId: string; quantity: number }>;
    lowStockAlerts: Array<{ productId: string; currentStock: number; minStock: number }>;
  }> {
    const { restaurantId, items, orderId, orderNumber } = params;
    const deducted: Array<{ productId: string; quantity: number }> = [];
    const lowStockAlerts: Array<{ productId: string; currentStock: number; minStock: number }> = [];

    try {
      for (const item of items) {
        // Get product with current stock
        const product = await this.prisma.product.findFirst({
          where: {
            id: item.productId,
            restaurantId,
          },
        });

        if (!product) {
          this.logger.warn(`[Inventory] Product ${item.productId} not found for restaurant ${restaurantId}`);
          continue;
        }

        // Calculate new stock level
        const currentStock = product.stock || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        const previousStock = currentStock;

        // Update product stock
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        // Record stock movement
        await this.prisma.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: -item.quantity,
            previousStock: previousStock,
            newStock: newStock,
            reason: 'SALE',
            referenceId: orderId,
          },
        });

        deducted.push({ productId: item.productId, quantity: item.quantity });

        // Check if low stock alert needed
        if (product.minStock && newStock <= product.minStock) {
          lowStockAlerts.push({
            productId: item.productId,
            currentStock: newStock,
            minStock: product.minStock,
          });
          this.logger.warn(`[Inventory] Low stock alert: ${product.name} (${item.productId}) - Current: ${newStock}, Min: ${product.minStock}`);
        }
      }

      this.logger.log(`[Inventory] Deducted stock for order ${orderNumber}: ${deducted.length} items`);

      return {
        success: true,
        deducted,
        lowStockAlerts,
      };
    } catch (error) {
      this.logger.error(`[Inventory] Failed to deduct inventory for order ${orderNumber}:`, error);
      return {
        success: false,
        deducted,
        lowStockAlerts,
      };
    }
  }

  /**
   * Returns InventoryBatch records for products owned by the given restaurant.
   * The join path is: InventoryBatch -> Product -> Restaurant (via restaurantId).
   */
  async getBatchesForRestaurant(restaurantId: string) {
    const batches = await this.prisma.inventoryBatch.findMany({
      where: {
        product: { restaurantId },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            unit: true,
            costPrice: true,
            price: true,
            stock: true,
            minStock: true,
            maxStock: true,
            sku: true,
            category: {
              select: { id: true, name: true },
            },
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return batches;
  }

  async getStockMovementsForRestaurant(restaurantId: string, limit = 50) {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        product: { restaurantId },
      },
      include: {
        product: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return movements;
  }
}
