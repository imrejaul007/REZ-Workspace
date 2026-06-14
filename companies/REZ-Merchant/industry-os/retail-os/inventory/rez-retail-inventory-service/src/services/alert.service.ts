import { StockAlert, IStockAlert } from '../models/StockAlert';
import { AlertType, AlertSeverity, AlertStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export class AlertService {
  /**
   * Create a stock alert
   */
  async createAlert(data: {
    productId: string;
    sku: string;
    productName: string;
    alertType: AlertType;
    currentStock: number;
    threshold: number;
    message?: string;
    suggestedAction?: string;
  }): Promise<IStockAlert> {
    try {
      // Check if active alert already exists for this product and type
      const existingAlert = await StockAlert.findOne({
        productId: data.productId,
        alertType: data.alertType,
        status: AlertStatus.ACTIVE,
      });

      if (existingAlert) {
        // Update existing alert
        existingAlert.currentStock = data.currentStock;
        existingAlert.threshold = data.threshold;
        existingAlert.message = data.message || existingAlert.message;
        await existingAlert.save();
        return existingAlert.toJSON();
      }

      const alert = new StockAlert({
        id: uuidv4(),
        productId: data.productId,
        sku: data.sku,
        productName: data.productName,
        alertType: data.alertType,
        currentStock: data.currentStock,
        threshold: data.threshold,
        message: data.message || this.generateMessage(data),
        suggestedAction: data.suggestedAction || this.generateSuggestion(data),
        severity: this.determineSeverity(data.alertType),
      });

      await alert.save();
      logger.info(`Alert created: ${data.alertType} for product ${data.productId}`);

      return alert.toJSON();
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(severity?: AlertSeverity): Promise<IStockAlert[]> {
    const alerts = await StockAlert.getActiveAlerts(severity);
    return alerts.map(a => a.toJSON());
  }

  /**
   * Get alerts by product
   */
  async getAlertsByProduct(productId: string): Promise<IStockAlert[]> {
    const alerts = await StockAlert.find({ productId }).sort({ createdAt: -1 });
    return alerts.map(a => a.toJSON());
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<IStockAlert | null> {
    try {
      const alert = await StockAlert.findOne({ id: alertId });
      if (!alert) return null;

      alert.status = AlertStatus.ACKNOWLEDGED;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();
      await alert.save();

      logger.info(`Alert ${alertId} acknowledged by ${userId}`);
      return alert.toJSON();
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, userId: string): Promise<IStockAlert | null> {
    try {
      const alert = await StockAlert.findOne({ id: alertId });
      if (!alert) return null;

      alert.status = AlertStatus.RESOLVED;
      alert.resolvedBy = userId;
      alert.resolvedAt = new Date();
      await alert.save();

      logger.info(`Alert ${alertId} resolved by ${userId}`);
      return alert.toJSON();
    } catch (error) {
      logger.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(alertId: string): Promise<IStockAlert | null> {
    try {
      const alert = await StockAlert.findOne({ id: alertId });
      if (!alert) return null;

      alert.status = AlertStatus.DISMISSED;
      await alert.save();

      return alert.toJSON();
    } catch (error) {
      logger.error('Error dismissing alert:', error);
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<{
    totalActive: number;
    bySeverity: Record<AlertSeverity, number>;
    byType: Record<AlertType, number>;
    recentCount: number;
  }> {
    const activeAlerts = await StockAlert.find({ status: AlertStatus.ACTIVE });

    const bySeverity: Record<AlertSeverity, number> = {
      [AlertSeverity.INFO]: 0,
      [AlertSeverity.WARNING]: 0,
      [AlertSeverity.CRITICAL]: 0,
    };

    const byType: Record<AlertType, number> = {
      [AlertType.LOW_STOCK]: 0,
      [AlertType.OUT_OF_STOCK]: 0,
      [AlertType.OVERSTOCK]: 0,
      [AlertType.EXPIRING_SOON]: 0,
      [AlertType.REORDER_SUGGESTED]: 0,
    };

    activeAlerts.forEach(alert => {
      bySeverity[alert.severity as AlertSeverity]++;
      byType[alert.alertType as AlertType]++;
    });

    // Count alerts from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentCount = await StockAlert.countDocuments({
      createdAt: { $gte: yesterday },
    });

    return {
      totalActive: activeAlerts.length,
      bySeverity,
      byType,
      recentCount,
    };
  }

  /**
   * Auto-resolve alerts when stock is replenished
   */
  async checkAndResolveAlerts(productId: string, newStock: number): Promise<void> {
    try {
      const alerts = await StockAlert.find({
        productId,
        status: AlertStatus.ACTIVE,
      });

      for (const alert of alerts) {
        if (alert.alertType === AlertType.OUT_OF_STOCK && newStock > 0) {
          alert.status = AlertStatus.RESOLVED;
          alert.resolvedAt = new Date();
          await alert.save();
          logger.info(`Alert ${alert.id} auto-resolved for product ${productId}`);
        } else if (alert.alertType === AlertType.LOW_STOCK && newStock > alert.threshold) {
          alert.status = AlertStatus.RESOLVED;
          alert.resolvedAt = new Date();
          await alert.save();
          logger.info(`Alert ${alert.id} auto-resolved for product ${productId}`);
        }
      }
    } catch (error) {
      logger.error('Error checking alerts:', error);
    }
  }

  /**
   * Generate alert message
   */
  private generateMessage(data: { alertType: AlertType; currentStock: number; threshold: number }): string {
    switch (data.alertType) {
      case AlertType.OUT_OF_STOCK:
        return `Product is out of stock. Current stock: 0`;
      case AlertType.LOW_STOCK:
        return `Product stock is low (${data.currentStock}). Reorder point: ${data.threshold}`;
      case AlertType.OVERSTOCK:
        return `Product is overstocked. Current stock: ${data.currentStock}`;
      case AlertType.REORDER_SUGGESTED:
        return `Stock below reorder point. Consider placing a purchase order.`;
      default:
        return `Stock alert for product. Current: ${data.currentStock}`;
    }
  }

  /**
   * Generate suggested action
   */
  private generateSuggestion(data: { alertType: AlertType; currentStock: number; threshold: number }): string {
    switch (data.alertType) {
      case AlertType.OUT_OF_STOCK:
        return 'Urgent: Place a purchase order immediately to replenish stock.';
      case AlertType.LOW_STOCK:
        return `Reorder ${data.threshold * 2 - data.currentStock} units to maintain optimal stock levels.`;
      case AlertType.OVERSTOCK:
        return 'Consider promotional activities or discounts to move excess inventory.';
      case AlertType.REORDER_SUGGESTED:
        return 'Review supplier lead times and place order if automatic reorder is not enabled.';
      default:
        return 'Review inventory levels and take appropriate action.';
    }
  }

  /**
   * Determine severity based on alert type
   */
  private determineSeverity(alertType: AlertType): AlertSeverity {
    switch (alertType) {
      case AlertType.OUT_OF_STOCK:
        return AlertSeverity.CRITICAL;
      case AlertType.LOW_STOCK:
      case AlertType.REORDER_SUGGESTED:
        return AlertSeverity.WARNING;
      default:
        return AlertSeverity.INFO;
    }
  }
}

export const alertService = new AlertService();
export default alertService;
