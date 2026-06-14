import { Stock } from '../models/Stock';
import { SKU } from '../models/SKU';
import { Batch } from '../models/Batch';

export interface LowStockAlert {
  skuId: string;
  skuCode: string;
  skuName: string;
  storeId: string;
  currentQuantity: number;
  minStock: number;
  reorderPoint: number;
  deficit: number;
  urgency: 'critical' | 'warning';
}

export interface ExpiryAlert {
  skuId: string;
  skuCode: string;
  skuName: string;
  batchNumber: string;
  storeId: string;
  quantity: number;
  expiryDate: Date;
  daysUntilExpiry: number;
  urgency: 'expired' | 'critical' | 'warning';
}

export interface AlertSummary {
  lowStockAlerts: LowStockAlert[];
  expiryAlerts: ExpiryAlert[];
  totalAlerts: number;
  criticalAlerts: number;
}

class AlertService {
  private expiryAlertDays = 30; // Default: alert 30 days before expiry

  /**
   * Check for low stock on a single SKU
   */
  async checkLowStock(skuId: string, storeId: string): Promise<boolean> {
    const stock = await Stock.findOne({ skuId, storeId });
    if (!stock) {
      return false;
    }

    const sku = await SKU.findById(skuId);
    if (!sku) {
      return false;
    }

    return stock.quantity <= sku.minStock;
  }

  /**
   * Get all low stock alerts
   */
  async getLowStockAlerts(storeId?: string): Promise<LowStockAlert[]> {
    const matchStage: any = { lowStockAlert: true };
    if (storeId) {
      matchStage.storeId = storeId;
    }

    const stocks = await Stock.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'skus',
          localField: 'skuId',
          foreignField: '_id',
          as: 'sku',
        },
      },
      { $unwind: '$sku' },
      {
        $match: {
          'sku.status': 'active',
        },
      },
      {
        $project: {
          skuId: '$sku._id',
          skuCode: '$sku.sku',
          skuName: '$sku.name',
          storeId: 1,
          currentQuantity: '$quantity',
          minStock: '$sku.minStock',
          reorderPoint: '$sku.reorderPoint',
          deficit: { $subtract: ['$sku.minStock', '$quantity'] },
        },
      },
      { $sort: { deficit: -1 } },
    ]);

    return stocks.map((stock) => ({
      ...stock,
      skuId: stock.skuId.toString(),
      urgency: stock.deficit > stock.reorderPoint ? 'critical' : 'warning',
    }));
  }

  /**
   * Get all expiry alerts
   */
  async getExpiryAlerts(storeId?: string, daysBeforeExpiry?: number): Promise<ExpiryAlert[]> {
    const alertDays = daysBeforeExpiry || this.expiryAlertDays;
    const today = new Date();
    const alertDate = new Date();
    alertDate.setDate(today.getDate() + alertDays);

    const matchStage: any = {
      $or: [
        { expiryDate: { $lte: today }, isExpired: false },
        {
          expiryDate: { $gt: today, $lte: alertDate },
          isExpired: false,
        },
      ],
      quantity: { $gt: 0 },
    };

    if (storeId) {
      matchStage.storeId = storeId;
    }

    const batches = await Batch.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'skus',
          localField: 'skuId',
          foreignField: '_id',
          as: 'sku',
        },
      },
      { $unwind: '$sku' },
      {
        $match: {
          'sku.status': 'active',
        },
      },
      {
        $project: {
          skuId: '$sku._id',
          skuCode: '$sku.sku',
          skuName: '$sku.name',
          storeId: '$sku.storeId',
          batchNumber: 1,
          quantity: 1,
          expiryDate: 1,
          manufacturingDate: 1,
        },
      },
      { $sort: { expiryDate: 1 } },
    ]);

    return batches.map((batch) => {
      const daysUntilExpiry = Math.ceil(
        (new Date(batch.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let urgency: 'expired' | 'critical' | 'warning';
      if (daysUntilExpiry <= 0) {
        urgency = 'expired';
      } else if (daysUntilExpiry <= 7) {
        urgency = 'critical';
      } else {
        urgency = 'warning';
      }

      return {
        ...batch,
        skuId: batch.skuId.toString(),
        expiryDate: batch.expiryDate,
        daysUntilExpiry,
        urgency,
      };
    });
  }

  /**
   * Get complete alert summary
   */
  async getAlertSummary(storeId?: string): Promise<AlertSummary> {
    const [lowStockAlerts, expiryAlerts] = await Promise.all([
      this.getLowStockAlerts(storeId),
      this.getExpiryAlerts(storeId),
    ]);

    const criticalAlerts =
      lowStockAlerts.filter((a) => a.urgency === 'critical').length +
      expiryAlerts.filter((a) => a.urgency === 'expired' || a.urgency === 'critical').length;

    return {
      lowStockAlerts,
      expiryAlerts,
      totalAlerts: lowStockAlerts.length + expiryAlerts.length,
      criticalAlerts,
    };
  }

  /**
   * Update low stock alerts based on current stock levels
   */
  async updateLowStockAlerts(storeId?: string): Promise<number> {
    const matchStage: any = {};
    if (storeId) {
      matchStage.storeId = storeId;
    }

    // Get all stocks
    const stocks = await Stock.find(matchStage);
    let updatedCount = 0;

    for (const stock of stocks) {
      const sku = await SKU.findById(stock.skuId);
      if (!sku || sku.status !== 'active') {
        continue;
      }

      const shouldAlert = stock.quantity <= sku.minStock;
      if (stock.lowStockAlert !== shouldAlert) {
        stock.lowStockAlert = shouldAlert;
        await stock.save();
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * Mark expired batches
   */
  async markExpiredBatches(): Promise<number> {
    const today = new Date();
    const result = await Batch.updateMany(
      {
        expiryDate: { $lte: today },
        isExpired: false,
      },
      {
        isExpired: true,
        isExpiringSoon: false,
      }
    );

    return result.modifiedCount;
  }

  /**
   * Update isExpiringSoon status for batches
   */
  async updateExpiringSoonStatus(): Promise<number> {
    const today = new Date();
    const alertDate = new Date();
    alertDate.setDate(today.getDate() + this.expiryAlertDays);

    // Set batches that are expiring soon
    const setExpiring = await Batch.updateMany(
      {
        expiryDate: { $gt: today, $lte: alertDate },
        isExpired: false,
        isExpiringSoon: false,
      },
      { isExpiringSoon: true }
    );

    // Clear batches that are no longer expiring soon
    const clearExpiring = await Batch.updateMany(
      {
        expiryDate: { $gt: alertDate },
        isExpiringSoon: true,
      },
      { isExpiringSoon: false }
    );

    return setExpiring.modifiedCount + clearExpiring.modifiedCount;
  }

  /**
   * Get alerts by category
   */
  async getAlertsByCategory(storeId?: string): Promise<any[]> {
    const [lowStockAlerts, expiryAlerts] = await Promise.all([
      this.getLowStockAlerts(storeId),
      this.getExpiryAlerts(storeId),
    ]);

    const getCategoryFromSkuId = async (skuId: string): Promise<string> => {
      const sku = await SKU.findById(skuId);
      return sku?.category || 'Unknown';
    };

    const lowStockByCategory: Record<string, number> = {};
    const expiryByCategory: Record<string, number> = {};

    for (const alert of lowStockAlerts) {
      const category = await getCategoryFromSkuId(alert.skuId);
      lowStockByCategory[category] = (lowStockByCategory[category] || 0) + 1;
    }

    for (const alert of expiryAlerts) {
      const category = await getCategoryFromSkuId(alert.skuId);
      expiryByCategory[category] = (expiryByCategory[category] || 0) + 1;
    }

    const categories = new Set([
      ...Object.keys(lowStockByCategory),
      ...Object.keys(expiryByCategory),
    ]);

    return Array.from(categories).map((category) => ({
      category,
      lowStockCount: lowStockByCategory[category] || 0,
      expiryCount: expiryByCategory[category] || 0,
      totalAlerts: (lowStockByCategory[category] || 0) + (expiryByCategory[category] || 0),
    }));
  }

  /**
   * Schedule periodic expiry alerts (can be called by a cron job)
   */
  async scheduleExpiryAlerts(storeId?: string): Promise<ExpiryAlert[]> {
    await this.markExpiredBatches();
    await this.updateExpiringSoonStatus();
    return this.getExpiryAlerts(storeId, 7); // Return critical alerts (7 days)
  }

  /**
   * Get stock movement forecast based on sales velocity
   */
  async getStockForecast(skuId: string, storeId: string, daysAhead: number = 30): Promise<{
    currentStock: number;
    estimatedStock: number;
    daysUntilStockout: number | null;
    daysUntilReorderPoint: number | null;
    recommendedOrderQuantity: number;
  } | null> {
    const stock = await Stock.findOne({ skuId, storeId });
    const sku = await SKU.findById(skuId);

    if (!stock || !sku) {
      return null;
    }

    // Calculate average daily sales (simplified - would need sales history in production)
    const lastSale = stock.lastSold ? new Date(stock.lastSold) : new Date();
    const daysSinceLastSale = Math.max(
      1,
      Math.ceil((Date.now() - lastSale.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Assume minimum 1 sale per day if no recent sales data
    const estimatedDailySales = Math.max(0.1, 1 / daysSinceLastSale);
    const estimatedStock = Math.floor(
      stock.quantity - estimatedDailySales * daysAhead
    );

    const daysUntilStockout =
      stock.quantity > 0
        ? Math.ceil(stock.quantity / estimatedDailySales)
        : 0;

    const daysUntilReorderPoint =
      stock.quantity > sku.reorderPoint
        ? Math.ceil((stock.quantity - sku.reorderPoint) / estimatedDailySales)
        : 0;

    const recommendedOrderQuantity = sku.maxStock
      ? Math.max(0, sku.maxStock - stock.quantity)
      : sku.reorderPoint * 3;

    return {
      currentStock: stock.quantity,
      estimatedStock: Math.max(0, estimatedStock),
      daysUntilStockout: daysUntilStockout || null,
      daysUntilReorderPoint: daysUntilReorderPoint || null,
      recommendedOrderQuantity,
    };
  }

  /**
   * Set the expiry alert days threshold
   */
  setExpiryAlertDays(days: number): void {
    this.expiryAlertDays = days;
  }
}

export const alertService = new AlertService();
