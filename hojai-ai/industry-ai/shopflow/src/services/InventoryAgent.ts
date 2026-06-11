import { Product, Inventory, IInventory, IProduct } from '../models';
import { logger } from '../utils/logger';

export interface LowStockItem {
  product: IProduct;
  inventory: IInventory;
  shortage: number;
  urgency: 'critical' | 'low' | 'moderate';
}

export interface ReorderRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  suggestedQuantity: number;
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface InventoryCheckResult {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  inStockCount: number;
  totalValue: number;
  lowStockItems: LowStockItem[];
  recommendations: ReorderRecommendation[];
  timestamp: Date;
}

export class InventoryAgent {
  private TAX_RATE = 0.08;

  async checkLowStock(threshold?: number): Promise<InventoryCheckResult> {
    try {
      const products = await Product.find({ isActive: true });
      const lowStockItems: LowStockItem[] = [];
      const recommendations: ReorderRecommendation[] = [];

      let outOfStockCount = 0;
      let inStockCount = 0;
      let totalValue = 0;

      for (const product of products) {
        const inventory = await Inventory.findOne({ productId: product._id });
        const currentStock = inventory?.quantity ?? 0;
        const effectiveThreshold = threshold ?? product.lowStockThreshold;

        totalValue += currentStock * product.cost;

        if (currentStock === 0) {
          outOfStockCount++;
        } else if (currentStock <= effectiveThreshold) {
          lowStockItems.push({
            product,
            inventory: inventory!,
            shortage: effectiveThreshold - currentStock,
            urgency: currentStock === 0 ? 'critical' : currentStock <= effectiveThreshold / 2 ? 'moderate' : 'low',
          });
        } else {
          inStockCount++;
        }
      }

      // Generate reorder recommendations
      for (const item of lowStockItems) {
        const suggestedQty = item.inventory
          ? item.inventory.maxStock - item.inventory.quantity
          : item.product.lowStockThreshold * 2;

        const estimatedCost = suggestedQty * item.product.cost;
        const daysUntilStockout = this.estimateDaysUntilStockout(item.product, item.inventory?.quantity ?? 0);

        let priority: 'high' | 'medium' | 'low' = 'low';
        let reason = 'Stock below threshold';

        if (item.urgency === 'critical' || daysUntilStockout < 3) {
          priority = 'high';
          reason = `Critical: Out of stock or will deplete in ${daysUntilStockout} days`;
        } else if (daysUntilStockout < 7 || item.urgency === 'moderate') {
          priority = 'medium';
          reason = `Will deplete in approximately ${daysUntilStockout} days`;
        }

        recommendations.push({
          productId: item.product._id.toString(),
          productName: item.product.name,
          currentStock: item.inventory?.quantity ?? 0,
          suggestedQuantity: Math.max(suggestedQty, 1),
          estimatedCost,
          priority,
          reason,
        });
      }

      // Sort recommendations by priority
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      logger.info('Inventory check completed', {
        totalProducts: products.length,
        lowStockCount: lowStockItems.length,
        outOfStockCount,
      });

      return {
        totalProducts: products.length,
        lowStockCount: lowStockItems.length,
        outOfStockCount,
        inStockCount,
        totalValue: Math.round(totalValue * 100) / 100,
        lowStockItems,
        recommendations,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Inventory check failed', { error });
      throw error;
    }
  }

  async autoReorder(reorderList?: string[]): Promise<{
    success: boolean;
    reorderedItems: ReorderRecommendation[];
    totalCost: number;
    message: string;
  }> {
    try {
      const checkResult = await this.checkLowStock();
      let itemsToReorder = checkResult.recommendations;

      if (reorderList && reorderList.length > 0) {
        itemsToReorder = itemsToReorder.filter((item) =>
          reorderList.includes(item.productId)
        );
      }

      // Filter to only high and medium priority
      itemsToReorder = itemsToReorder.filter(
        (item) => item.priority === 'high' || item.priority === 'medium'
      );

      let totalCost = 0;

      for (const item of itemsToReorder) {
        const inventory = await Inventory.findOne({ productId: item.productId });

        if (inventory) {
          inventory.quantity += item.suggestedQuantity;
          inventory.lastRestocked = new Date();
          await inventory.save();
        } else {
          await Inventory.create({
            productId: item.productId,
            quantity: item.suggestedQuantity,
            lastRestocked: new Date(),
            minStock: 5,
            maxStock: 100,
          });
        }

        // Update product stock
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.suggestedQuantity },
        });

        totalCost += item.estimatedCost;
      }

      logger.info('Auto reorder completed', {
        itemsReordered: itemsToReorder.length,
        totalCost,
      });

      return {
        success: true,
        reorderedItems: itemsToReorder,
        totalCost: Math.round(totalCost * 100) / 100,
        message: `Successfully reordered ${itemsToReorder.length} items for a total of $${totalCost.toFixed(2)}`,
      };
    } catch (error) {
      logger.error('Auto reorder failed', { error });
      throw error;
    }
  }

  private estimateDaysUntilStockout(product: IProduct, currentStock: number): number {
    // Simplified estimation - assume average daily sales of 2 units
    const avgDailySales = 2;
    if (currentStock === 0) return 0;
    return Math.floor(currentStock / avgDailySales);
  }

  async getInventoryHealth(): Promise<{
    score: number;
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      stockTurnoverRate: number;
      avgStockDays: number;
      deadStockCount: number;
      overstockValue: number;
    };
  }> {
    const products = await Product.find({ isActive: true });
    const inventories = await Inventory.find();

    let deadStockCount = 0;
    let overstockValue = 0;
    let totalStockValue = 0;
    let totalItems = 0;

    for (const product of products) {
      const inventory = inventories.find(
        (inv) => inv.productId.toString() === product._id.toString()
      );
      const qty = inventory?.quantity ?? 0;

      totalStockValue += qty * product.cost;
      totalItems += qty;

      if (qty === 0) deadStockCount++;
      if (inventory && qty > inventory.maxStock) {
        overstockValue += (qty - inventory.maxStock) * product.cost;
      }
    }

    const score = Math.max(
      0,
      100 - (deadStockCount / Math.max(products.length, 1)) * 50 - (overstockValue / Math.max(totalStockValue, 1)) * 30
    );

    return {
      score: Math.round(score),
      status: score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'critical',
      metrics: {
        stockTurnoverRate: totalItems > 0 ? (products.length / Math.max(totalItems, 1)) * 30 : 0,
        avgStockDays: totalItems > 0 ? Math.round(totalItems / Math.max(products.length, 1) * 5) : 0,
        deadStockCount,
        overstockValue: Math.round(overstockValue * 100) / 100,
      },
    };
  }
}

export const inventoryAgent = new InventoryAgent();
export default inventoryAgent;