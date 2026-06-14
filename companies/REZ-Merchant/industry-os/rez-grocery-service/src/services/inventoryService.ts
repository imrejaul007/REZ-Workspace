import { Product, InventoryAlert, AlertType, AlertSeverity, ProductStatus, IProduct } from '../models';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { sendLowStockWhatsApp } from '../integrations/rabtul';

export interface StockAdjustment {
  productId: string;
  quantity: number;
  reason: 'PURCHASE' | 'SALE' | 'RETURN' | 'DAMAGE' | 'EXPIRY' | 'ADJUSTMENT' | 'RECEIVED' | 'INVENTORY_COUNT';
  notes?: string;
}

export interface InventoryAlertData {
  productId: string;
  productName: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  currentStock?: number;
  reorderLevel?: number;
  expiryDate?: Date;
  daysUntilExpiry?: number;
}

export class InventoryService {
  /**
   * Get product by ID
   */
  async getProductById(productId: string): Promise<IProduct | null> {
    return Product.findOne({ productId });
  }

  /**
   * Get product by barcode
   */
  async getProductByBarcode(barcode: string): Promise<IProduct | null> {
    return Product.findOne({
      $or: [{ barcode }, { sku: barcode }]
    });
  }

  /**
   * Update stock with validation
   */
  async adjustStock(adjustment: StockAdjustment): Promise<IProduct | null> {
    const product = await Product.findOne({ productId: adjustment.productId });

    if (!product) {
      throw new Error(`Product ${adjustment.productId} not found`);
    }

    const previousStock = product.stock;
    let newStock: number;

    switch (adjustment.reason) {
      case 'PURCHASE':
      case 'RECEIVED':
      case 'RETURN':
        newStock = product.stock + Math.abs(adjustment.quantity);
        break;
      case 'SALE':
        newStock = product.stock - Math.abs(adjustment.quantity);
        if (newStock < 0) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${Math.abs(adjustment.quantity)}`
          );
        }
        break;
      case 'DAMAGE':
      case 'EXPIRY':
      case 'ADJUSTMENT':
      case 'INVENTORY_COUNT':
        newStock = product.stock + adjustment.quantity;
        if (newStock < 0) {
          throw new Error(`Adjustment would result in negative stock for ${product.name}`);
        }
        break;
      default:
        newStock = product.stock;
    }

    product.stock = Math.max(0, newStock);
    product.markModified('stock');
    await product.save();

    logger.info(
      `Stock adjusted: ${product.productId} - ${previousStock} -> ${product.stock} (${adjustment.reason})`
    );

    // Check if we need to generate alerts
    await this.checkAndCreateAlerts(product);

    return product;
  }

  /**
   * Batch stock adjustment
   */
  async batchAdjustStock(adjustments: StockAdjustment[]): Promise<{
    success: IProduct[];
    failed: { productId: string; error: string }[];
  }> {
    const results = {
      success: [] as IProduct[],
      failed: [] as { productId: string; error: string }[]
    };

    for (const adjustment of adjustments) {
      try {
        const product = await this.adjustStock(adjustment);
        if (product) {
          results.success.push(product);
        }
      } catch (error) {
        results.failed.push({
          productId: adjustment.productId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Check and create inventory alerts
   */
  async checkAndCreateAlerts(product: IProduct): Promise<void> {
    // Check for low stock
    if (product.stock <= product.reorderLevel) {
      const existingAlert = await InventoryAlert.findOne({
        productId: product.productId,
        type: AlertType.LOW_STOCK,
        isResolved: false
      });

      if (!existingAlert) {
        const severity = this.calculateStockSeverity(product.stock, product.reorderLevel);

        await this.createAlert({
          productId: product.productId,
          productName: product.name,
          type: AlertType.LOW_STOCK,
          severity,
          message: `${product.name} stock is low (${product.stock} ${product.unit}, reorder level: ${product.reorderLevel})`,
          currentStock: product.stock,
          reorderLevel: product.reorderLevel
        });

        // Send WhatsApp notification for low stock via RABTUL SDK
        try {
          await sendLowStockWhatsApp({
            merchantId: product.merchantId,
            merchantPhone: '', // Will be fetched from merchant profile
            merchantName: '',
            productId: product.productId,
            productName: product.name,
            currentStock: product.stock,
            reorderLevel: product.reorderLevel,
            category: product.category,
          });
          logger.info('Low stock WhatsApp notification sent via RABTUL SDK', {
            productId: product.productId,
            merchantId: product.merchantId,
          });
        } catch (notifyError) {
          logger.warn('Failed to send low stock WhatsApp notification', { error: notifyError });
        }
      }
    }

    // Check for out of stock
    if (product.stock === 0) {
      const existingAlert = await InventoryAlert.findOne({
        productId: product.productId,
        type: AlertType.OUT_OF_STOCK,
        isResolved: false
      });

      if (!existingAlert) {
        await this.createAlert({
          productId: product.productId,
          productName: product.name,
          type: AlertType.OUT_OF_STOCK,
          severity: AlertSeverity.CRITICAL,
          message: `${product.name} is out of stock`,
          currentStock: 0
        });

        // Send critical out of stock WhatsApp notification via RABTUL SDK
        try {
          await sendLowStockWhatsApp({
            merchantId: product.merchantId,
            merchantPhone: '',
            merchantName: '',
            productId: product.productId,
            productName: product.name,
            currentStock: 0,
            reorderLevel: product.reorderLevel,
            category: product.category,
          });
          logger.info('Out of stock WhatsApp notification sent via RABTUL SDK', {
            productId: product.productId,
            merchantId: product.merchantId,
          });
        } catch (notifyError) {
          logger.warn('Failed to send out of stock WhatsApp notification', { error: notifyError });
        }
      }
    }
  }

  /**
   * Calculate stock severity based on current stock and reorder level
   */
  private calculateStockSeverity(currentStock: number, reorderLevel: number): AlertSeverity {
    if (currentStock === 0) return AlertSeverity.CRITICAL;
    if (currentStock <= reorderLevel * 0.25) return AlertSeverity.HIGH;
    if (currentStock <= reorderLevel * 0.5) return AlertSeverity.MEDIUM;
    return AlertSeverity.LOW;
  }

  /**
   * Create a new inventory alert
   */
  async createAlert(alertData: InventoryAlertData): Promise<void> {
    const alertId = `ALT-${uuidv4().substring(0, 8).toUpperCase()}`;

    const alert = new InventoryAlert({
      alertId,
      merchantId: '', // Will be set from product
      ...alertData
    });

    await alert.save();
    logger.info(`Alert created: ${alertId} - ${alertData.type} for ${alertData.productId}`);
  }

  /**
   * Get all unresolved alerts for a merchant
   */
  async getUnresolvedAlerts(merchantId: string, type?: AlertType): Promise<InventoryAlert[]> {
    const filter: Record<string, unknown> = {
      merchantId,
      isResolved: false
    };

    if (type) {
      filter.type = type;
    }

    return InventoryAlert.find(filter)
      .sort({ severity: -1, createdAt: -1 });
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, notes?: string): Promise<InventoryAlert | null> {
    return InventoryAlert.findOneAndUpdate(
      { alertId },
      {
        $set: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy,
          resolutionNotes: notes
        }
      },
      { new: true }
    );
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(merchantId: string): Promise<IProduct[]> {
    return Product.find({
      merchantId,
      status: ProductStatus.ACTIVE,
      $expr: { $lte: ['$stock', '$reorderLevel'] }
    }).sort({ stock: 1 });
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(merchantId: string): Promise<IProduct[]> {
    return Product.find({
      merchantId,
      status: ProductStatus.OUT_OF_STOCK
    }).sort({ name: 1 });
  }

  /**
   * Get inventory valuation
   */
  async getInventoryValuation(merchantId: string): Promise<{
    totalCostValue: number;
    totalRetailValue: number;
    totalItems: number;
    totalProducts: number;
  }> {
    const products = await Product.find({ merchantId });

    return products.reduce(
      (acc, product) => ({
        totalCostValue: acc.totalCostValue + product.costPrice * product.stock,
        totalRetailValue: acc.totalRetailValue + product.sellingPrice * product.stock,
        totalItems: acc.totalItems + product.stock,
        totalProducts: acc.totalProducts + 1
      }),
      { totalCostValue: 0, totalRetailValue: 0, totalItems: 0, totalProducts: 0 }
    );
  }

  /**
   * Generate restock recommendations
   */
  async getRestockRecommendations(merchantId: string): Promise<{
    urgent: IProduct[];
    recommended: IProduct[];
    optional: IProduct[];
  }> {
    const products = await Product.find({
      merchantId,
      status: ProductStatus.ACTIVE,
      $expr: { $lte: ['$stock', '$reorderLevel'] }
    }).sort({ stock: 1 });

    const urgent = products.filter(p => p.stock === 0);
    const recommended = products.filter(
      p => p.stock > 0 && p.stock <= p.reorderLevel * 0.5
    );
    const optional = products.filter(
      p => p.stock > p.reorderLevel * 0.5 && p.stock <= p.reorderLevel
    );

    return { urgent, recommended, optional };
  }

  /**
   * Check and update product status based on stock
   */
  async updateProductStatus(productId: string): Promise<IProduct | null> {
    const product = await Product.findOne({ productId });

    if (!product) return null;

    if (product.stock === 0) {
      product.status = ProductStatus.OUT_OF_STOCK;
    } else if (product.status === ProductStatus.OUT_OF_STOCK) {
      product.status = ProductStatus.ACTIVE;
    }

    await product.save();
    return product;
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    merchantId: string,
    category: string
  ): Promise<IProduct[]> {
    return Product.find({
      merchantId,
      category: category.toUpperCase(),
      status: ProductStatus.ACTIVE
    }).sort({ name: 1 });
  }

  /**
   * Search products
   */
  async searchProducts(
    merchantId: string,
    filters: {
      query?: string;
      category?: string;
      inStock?: boolean;
      isOrganic?: boolean;
      isImported?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{ products: IProduct[]; total: number }> {
    const { query, category, inStock, isOrganic, isImported, page = 1, limit = 20 } = filters;

    const filter: Record<string, unknown> = { merchantId };

    if (category) {
      filter.category = category.toUpperCase();
    }

    if (inStock !== undefined) {
      filter.stock = inStock ? { $gt: 0 } : 0;
    }

    if (isOrganic !== undefined) {
      filter.isOrganic = isOrganic;
    }

    if (isImported !== undefined) {
      filter.isImported = isImported;
    }

    if (query) {
      filter.$text = { $search: query };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ]);

    return { products, total };
  }
}

export const inventoryService = new InventoryService();