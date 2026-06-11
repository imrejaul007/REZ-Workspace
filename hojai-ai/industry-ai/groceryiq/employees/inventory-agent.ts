/**
 * GroceryIQ - Inventory Agent
 *
 * AI Employee for inventory management in grocery retail.
 * Monitors stock levels, triggers reorders, manages expiry.
 */

import { createLogger } from '../src/utils/logger';

const logger = createLogger('inventory-agent');

interface StockAlert {
  sku: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  severity: 'low' | 'critical' | 'out_of_stock';
  action: string;
}

interface ReorderRecommendation {
  sku: string;
  name: string;
  currentStock: number;
  reorderQuantity: number;
  supplier: string;
  estimatedCost: number;
  leadTimeDays: number;
}

interface ExpiryAlert {
  sku: string;
  name: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  quantity: number;
  action: 'urgent' | 'promotion' | 'discard';
}

class InventoryAgent {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.GROCERYIQ_URL || 'http://localhost:4131';
  }

  /**
   * Check all stock levels and generate alerts
   */
  async checkStockLevels(): Promise<StockAlert[]> {
    logger.info('Checking stock levels...');

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/inventory/low-stock`);
      const data = await response.json();

      const alerts: StockAlert[] = data.data.map((item: any) => {
        let severity: 'low' | 'critical' | 'out_of_stock';
        if (item.quantity === 0) {
          severity = 'out_of_stock';
        } else if (item.quantity <= item.reorderPoint * 0.5) {
          severity = 'critical';
        } else {
          severity = 'low';
        }

        return {
          sku: item.sku,
          name: item.name,
          currentStock: item.quantity,
          reorderPoint: item.reorderPoint,
          severity,
          action: this.getActionForSeverity(severity, item)
        };
      });

      logger.info(`Found ${alerts.length} stock alerts`);
      return alerts;
    } catch (error) {
      logger.error('Failed to check stock levels', { error });
      return [];
    }
  }

  /**
   * Generate reorder recommendations
   */
  async generateReorderRecommendations(): Promise<ReorderRecommendation[]> {
    logger.info('Generating reorder recommendations...');

    try {
      const stockAlerts = await this.checkStockLevels();
      const criticalItems = stockAlerts.filter(a =>
        a.severity === 'critical' || a.severity === 'out_of_stock'
      );

      const recommendations: ReorderRecommendation[] = criticalItems.map(alert => ({
        sku: alert.sku,
        name: alert.name,
        currentStock: alert.currentStock,
        reorderQuantity: Math.max(alert.reorderPoint * 2, 100),
        supplier: this.getSupplierForSku(alert.sku),
        estimatedCost: this.estimateReorderCost(alert.sku),
        leadTimeDays: 7
      }));

      logger.info(`Generated ${recommendations.length} reorder recommendations`);
      return recommendations;
    } catch (error) {
      logger.error('Failed to generate reorder recommendations', { error });
      return [];
    }
  }

  /**
   * Check for expiring products
   */
  async checkExpiringProducts(daysThreshold: number = 30): Promise<ExpiryAlert[]> {
    logger.info(`Checking products expiring within ${daysThreshold} days...`);

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/inventory/expiring?days=${daysThreshold}`);
      const data = await response.json();

      const alerts: ExpiryAlert[] = data.data.map((item: any) => {
        const daysUntilExpiry = Math.ceil(
          (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        let action: 'urgent' | 'promotion' | 'discard';
        if (daysUntilExpiry <= 7) {
          action = 'urgent';
        } else if (daysUntilExpiry <= 14) {
          action = 'promotion';
        } else {
          action = 'discard';
        }

        return {
          sku: item.sku,
          name: item.name,
          expiryDate: new Date(item.expiryDate),
          daysUntilExpiry,
          quantity: item.quantity,
          action
        };
      });

      logger.info(`Found ${alerts.length} expiring products`);
      return alerts;
    } catch (error) {
      logger.error('Failed to check expiring products', { error });
      return [];
    }
  }

  /**
   * Execute reorder for a specific SKU
   */
  async executeReorder(sku: string, quantity: number): Promise<boolean> {
    logger.info(`Executing reorder for ${sku}, quantity: ${quantity}`);

    try {
      // Get supplier info
      const inventoryResponse = await fetch(`${this.apiBaseUrl}/api/inventory/${sku}`);
      const inventoryData = await inventoryResponse.json();
      const product = inventoryData.data;

      // Create purchase order
      const poResponse = await fetch(`${this.apiBaseUrl}/api/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: this.getSupplierForSku(sku),
          items: [{
            sku,
            name: product.name,
            quantity,
            unitCost: product.cost || product.price * 0.7
          }]
        })
      });

      const poData = await poResponse.json();

      if (poData.success) {
        logger.info(`Reorder created: ${poData.data.orderId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to execute reorder', { error, sku });
      return false;
    }
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<any> {
    try {
      const [overview, stockAlerts, expiringProducts] = await Promise.all([
        fetch(`${this.apiBaseUrl}/api/analytics/overview`).then(r => r.json()),
        this.checkStockLevels(),
        this.checkExpiringProducts(30)
      ]);

      return {
        totalSKUs: overview.data.totalSKUs,
        lowStockAlerts: stockAlerts.length,
        criticalAlerts: stockAlerts.filter((a: StockAlert) => a.severity === 'critical').length,
        outOfStock: stockAlerts.filter((a: StockAlert) => a.severity === 'out_of_stock').length,
        expiringProducts: expiringProducts.length,
        urgentExpiry: expiringProducts.filter((e: ExpiryAlert) => e.action === 'urgent').length,
        inventoryValue: overview.data.totalInventoryValue,
        potentialMargin: overview.data.potentialMargin
      };
    } catch (error) {
      logger.error('Failed to get dashboard summary', { error });
      return null;
    }
  }

  private getActionForSeverity(severity: string, item: any): string {
    switch (severity) {
      case 'out_of_stock':
        return `URGENT: ${item.name} is out of stock. Create purchase order immediately.`;
      case 'critical':
        return `ALERT: ${item.name} stock critical (${item.quantity}/${item.reorderPoint}). Reorder ${item.reorderQuantity || 100} units.`;
      default:
        return `NOTICE: ${item.name} below reorder point (${item.quantity}/${item.reorderPoint}).`;
    }
  }

  private getSupplierForSku(sku: string): string {
    // Map SKUs to suppliers
    const supplierMap: Record<string, string> = {
      'MILK': 'SUP-Amul',
      'BRD': 'SUP-BakeryFresh',
      'RICE': 'SUP-Kohinoor',
      'DAL': 'SUP-Kohinoor',
      'CHP': 'SUP-Pepsico',
      'COLA': 'SUP-CocaCola',
      'TEA': 'SUP-Tata',
      'OIL': 'SUP-Fortune',
      'SUGAR': 'SUP-SugarMills'
    };

    const prefix = sku.split('-')[0];
    return supplierMap[prefix] || 'SUP-Default';
  }

  private estimateReorderCost(sku: string): number {
    // Estimate based on typical costs
    return 5000; // Default estimate
  }
}

export const inventoryAgent = new InventoryAgent();
export { StockAlert, ReorderRecommendation, ExpiryAlert };
