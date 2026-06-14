import { Product, InventoryAlert, AlertType, AlertSeverity, ProductStatus, IProduct } from '../models';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export interface ExpiryAlertConfig {
  criticalDays: number; // e.g., 3 days
  urgentDays: number; // e.g., 7 days
  warningDays: number; // e.g., 14 days
  noticeDays: number; // e.g., 30 days
}

export interface ExpiringProduct {
  product: IProduct;
  daysUntilExpiry: number;
  severity: AlertSeverity;
}

export class ExpiryTracker {
  private config: ExpiryAlertConfig;

  constructor() {
    // Default configuration
    this.config = {
      criticalDays: 3,
      urgentDays: 7,
      warningDays: 14,
      noticeDays: 30
    };
  }

  /**
   * Update expiry alert configuration
   */
  setConfig(config: Partial<ExpiryAlertConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Expiry tracker config updated:', this.config);
  }

  /**
   * Get current config
   */
  getConfig(): ExpiryAlertConfig {
    return { ...this.config };
  }

  /**
   * Calculate severity based on days until expiry
   */
  calculateSeverity(daysUntilExpiry: number): AlertSeverity {
    if (daysUntilExpiry <= 0) return AlertSeverity.CRITICAL;
    if (daysUntilExpiry <= this.config.criticalDays) return AlertSeverity.CRITICAL;
    if (daysUntilExpiry <= this.config.urgentDays) return AlertSeverity.HIGH;
    if (daysUntilExpiry <= this.config.warningDays) return AlertSeverity.MEDIUM;
    if (daysUntilExpiry <= this.config.noticeDays) return AlertSeverity.LOW;
    return AlertSeverity.LOW;
  }

  /**
   * Get days until expiry
   */
  getDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get all expiring products for a merchant
   */
  async getExpiringProducts(
    merchantId: string,
    daysAhead: number = this.config.noticeDays,
    includeExpired: boolean = true
  ): Promise<ExpiringProduct[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const filter: Record<string, unknown> = {
      merchantId,
      expiryDate: { $exists: true, $ne: null },
      status: { $ne: ProductStatus.DISCONTINUED }
    };

    if (includeExpired) {
      filter.expiryDate = { $lte: futureDate };
    } else {
      filter.expiryDate = { $gt: now, $lte: futureDate };
    }

    const products = await Product.find(filter).sort({ expiryDate: 1 });

    return products.map(product => ({
      product,
      daysUntilExpiry: this.getDaysUntilExpiry(product.expiryDate!),
      severity: this.calculateSeverity(this.getDaysUntilExpiry(product.expiryDate!))
    }));
  }

  /**
   * Get expired products
   */
  async getExpiredProducts(merchantId: string): Promise<IProduct[]> {
    const now = new Date();

    return Product.find({
      merchantId,
      expiryDate: { $lte: now },
      stock: { $gt: 0 },
      status: { $ne: ProductStatus.DISCONTINUED }
    }).sort({ expiryDate: 1 });
  }

  /**
   * Get products expiring within specific days
   */
  async getProductsExpiringWithin(
    merchantId: string,
    days: number
  ): Promise<ExpiringProduct[]> {
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const products = await Product.find({
      merchantId,
      expiryDate: { $gt: now, $lte: targetDate },
      stock: { $gt: 0 },
      status: { $ne: ProductStatus.DISCONTINUED }
    }).sort({ expiryDate: 1 });

    return products.map(product => ({
      product,
      daysUntilExpiry: this.getDaysUntilExpiry(product.expiryDate!),
      severity: this.calculateSeverity(this.getDaysUntilExpiry(product.expiryDate!))
    }));
  }

  /**
   * Scan and create alerts for all expiring products
   */
  async scanAndAlert(merchantId: string): Promise<{
    created: number;
    skipped: number;
    alerts: InventoryAlert[];
  }> {
    const now = new Date();
    const scanDate = new Date();
    scanDate.setDate(scanDate.getDate() + this.config.noticeDays);

    const products = await Product.find({
      merchantId,
      expiryDate: { $exists: true, $ne: null, $lte: scanDate },
      stock: { $gt: 0 },
      status: { $ne: ProductStatus.DISCONTINUED }
    });

    let created = 0;
    let skipped = 0;
    const alerts: InventoryAlert[] = [];

    for (const product of products) {
      const daysUntilExpiry = this.getDaysUntilExpiry(product.expiryDate!);
      const severity = this.calculateSeverity(daysUntilExpiry);

      // Determine alert type
      const alertType = daysUntilExpiry <= 0 ? AlertType.EXPIRED : AlertType.EXPIRING;

      // Check if an unresolved alert already exists
      const existingAlert = await InventoryAlert.findOne({
        productId: product.productId,
        type: alertType,
        isResolved: false
      });

      if (existingAlert) {
        // Update severity if changed
        if (existingAlert.severity !== severity) {
          existingAlert.severity = severity;
          existingAlert.message = this.generateAlertMessage(product, daysUntilExpiry, severity);
          await existingAlert.save();
          alerts.push(existingAlert);
        }
        skipped++;
        continue;
      }

      // Create new alert
      const alertId = `ALT-${uuidv4().substring(0, 8).toUpperCase()}`;
      const alert = new InventoryAlert({
        alertId,
        merchantId,
        productId: product.productId,
        productName: product.name,
        type: alertType,
        severity,
        message: this.generateAlertMessage(product, daysUntilExpiry, severity),
        currentStock: product.stock,
        expiryDate: product.expiryDate,
        daysUntilExpiry
      });

      await alert.save();
      alerts.push(alert);
      created++;
    }

    logger.info(
      `Expiry scan completed for merchant ${merchantId}: ${created} alerts created, ${skipped} skipped`
    );

    return { created, skipped, alerts };
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(
    product: IProduct,
    daysUntilExpiry: number,
    severity: AlertSeverity
  ): string {
    if (daysUntilExpiry <= 0) {
      return `${product.name} has EXPIRED (${Math.abs(daysUntilExpiry)} days ago)`;
    }

    const urgencyText =
      severity === AlertSeverity.CRITICAL
        ? 'CRITICAL'
        : severity === AlertSeverity.HIGH
        ? 'urgent'
        : 'expiring soon';

    return `${product.name} is ${urgencyText} - ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'} until expiry (${product.expiryDate?.toLocaleDateString()})`;
  }

  /**
   * Get expiry report for a merchant
   */
  async getExpiryReport(merchantId: string): Promise<{
    expired: ExpiringProduct[];
    critical: ExpiringProduct[];
    urgent: ExpiringProduct[];
    warning: ExpiringProduct[];
    notice: ExpiringProduct[];
    total: number;
    totalValueAtRisk: number;
  }> {
    const allExpiring = await this.getExpiringProducts(
      merchantId,
      this.config.noticeDays,
      true
    );

    const expired = allExpiring.filter(ep => ep.daysUntilExpiry <= 0);
    const critical = allExpiring.filter(
      ep => ep.daysUntilExpiry > 0 && ep.daysUntilExpiry <= this.config.criticalDays
    );
    const urgent = allExpiring.filter(
      ep =>
        ep.daysUntilExpiry > this.config.criticalDays &&
        ep.daysUntilExpiry <= this.config.urgentDays
    );
    const warning = allExpiring.filter(
      ep =>
        ep.daysUntilExpiry > this.config.urgentDays &&
        ep.daysUntilExpiry <= this.config.warningDays
    );
    const notice = allExpiring.filter(
      ep =>
        ep.daysUntilExpiry > this.config.warningDays &&
        ep.daysUntilExpiry <= this.config.noticeDays
    );

    // Calculate total value at risk (products expiring within warning period)
    const atRiskProducts = [...expired, ...critical, ...urgent, ...warning];
    const totalValueAtRisk = atRiskProducts.reduce(
      (sum, ep) => sum + ep.product.costPrice * ep.product.stock,
      0
    );

    return {
      expired,
      critical,
      urgent,
      warning,
      notice,
      total: allExpiring.length,
      totalValueAtRisk
    };
  }

  /**
   * Get products by category that are expiring
   */
  async getExpiringByCategory(merchantId: string, category: string): Promise<ExpiringProduct[]> {
    const allExpiring = await this.getExpiringProducts(
      merchantId,
      this.config.noticeDays,
      true
    );

    return allExpiring.filter(
      ep => ep.product.category.toUpperCase() === category.toUpperCase()
    );
  }

  /**
   * Mark expired products and create alerts
   */
  async markExpiredProducts(merchantId: string): Promise<{
    marked: number;
    alerts: InventoryAlert[];
  }> {
    const now = new Date();

    const expiredProducts = await Product.find({
      merchantId,
      expiryDate: { $lte: now },
      stock: { $gt: 0 },
      status: { $ne: ProductStatus.DISCONTINUED }
    });

    let marked = 0;
    const alerts: InventoryAlert[] = [];

    for (const product of expiredProducts) {
      // Check if expired alert already exists
      const existingAlert = await InventoryAlert.findOne({
        productId: product.productId,
        type: AlertType.EXPIRED,
        isResolved: false
      });

      if (!existingAlert) {
        const alertId = `ALT-${uuidv4().substring(0, 8).toUpperCase()}`;
        const alert = new InventoryAlert({
          alertId,
          merchantId,
          productId: product.productId,
          productName: product.name,
          type: AlertType.EXPIRED,
          severity: AlertSeverity.CRITICAL,
          message: this.generateAlertMessage(product, 0, AlertSeverity.CRITICAL),
          currentStock: product.stock,
          expiryDate: product.expiryDate,
          daysUntilExpiry: 0
        });

        await alert.save();
        alerts.push(alert);
      }

      marked++;
    }

    logger.info(`Marked ${marked} expired products for merchant ${merchantId}`);

    return { marked, alerts };
  }

  /**
   * Get freshness score for products
   */
  async getFreshnessScore(merchantId: string): Promise<{
    averageScore: number;
    byCategory: Record<string, number>;
    atRiskProducts: ExpiringProduct[];
  }> {
    const products = await Product.find({
      merchantId,
      expiryDate: { $exists: true, $ne: null },
      status: ProductStatus.ACTIVE
    });

    if (products.length === 0) {
      return { averageScore: 100, byCategory: {}, atRiskProducts: [] };
    }

    const expiringProducts = await this.getExpiringProducts(
      merchantId,
      this.config.noticeDays,
      true
    );

    // Calculate freshness score (100 = fresh, 0 = expired)
    const scores: number[] = [];
    const byCategory: Record<string, { total: number; count: number }> = {};

    for (const product of products) {
      const daysUntilExpiry = this.getDaysUntilExpiry(product.expiryDate!);
      let score: number;

      if (daysUntilExpiry <= 0) {
        score = 0;
      } else {
        // Score decreases as we approach expiry
        score = Math.max(0, 100 - (daysUntilExpiry / this.config.noticeDays) * 100);
      }

      scores.push(score);

      const category = product.category;
      if (!byCategory[category]) {
        byCategory[category] = { total: 0, count: 0 };
      }
      byCategory[category].total += score;
      byCategory[category].count++;
    }

    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    const categoryScores: Record<string, number> = {};
    for (const [cat, data] of Object.entries(byCategory)) {
      categoryScores[cat] = data.total / data.count;
    }

    // Products with score below 50 are at risk
    const atRiskProducts = expiringProducts.filter(
      ep => this.getDaysUntilExpiry(ep.product.expiryDate!) <= this.config.urgentDays
    );

    return {
      averageScore: Math.round(averageScore * 100) / 100,
      byCategory: categoryScores,
      atRiskProducts
    };
  }
}

export const expiryTracker = new ExpiryTracker();