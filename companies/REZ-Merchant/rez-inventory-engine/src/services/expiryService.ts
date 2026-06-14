import { Stock, IStock } from '../models/Stock';
import { Batch, IBatch } from '../models/Batch';
import { SKU, ISKU } from '../models/SKU';
import mongoose, { Types } from 'mongoose';

// Notification service URL with localhost fallback
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004/api/notifications/send';

export interface ExpiringStockItem {
  stock: IStock;
  sku: ISKU;
  batch: IBatch;
  daysUntilExpiry: number;
}

export interface ExpiryAlertResult {
  expiringSoon: ExpiringStockItem[];
  expired: ExpiringStockItem[];
  totalExpiringSoon: number;
  totalExpired: number;
}

class ExpiryService {
  /**
   * Get items expiring soon (within specified days)
   */
  async getExpiringSoon(storeId: string, days: number = 30): Promise<ExpiringStockItem[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    futureDate.setHours(23, 59, 59, 999);

    // Get stocks with expiry dates in range
    const stocks = await Stock.find({
      storeId,
      expiryDate: { $gte: today, $lte: futureDate },
      isExpiringSoon: true,
    });

    if (stocks.length === 0) {
      return [];
    }

    const result: ExpiringStockItem[] = [];

    for (const stock of stocks) {
      const sku = await SKU.findById(stock.skuId);
      const batch = await Batch.findOne({
        skuId: stock.skuId,
        batchNumber: stock.batchNumber,
      });

      if (sku && batch) {
        const daysUntilExpiry = this.calculateDaysUntilExpiry(stock.expiryDate!);
        result.push({
          stock,
          sku,
          batch,
          daysUntilExpiry,
        });
      }
    }

    // Sort by days until expiry (soonest first)
    result.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    return result;
  }

  /**
   * Get expired items
   */
  async getExpired(storeId: string): Promise<ExpiringStockItem[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get expired stocks
    const stocks = await Stock.find({
      storeId,
      isExpired: true,
    });

    if (stocks.length === 0) {
      return [];
    }

    const result: ExpiringStockItem[] = [];

    for (const stock of stocks) {
      const sku = await SKU.findById(stock.skuId);
      const batch = await Batch.findOne({
        skuId: stock.skuId,
        batchNumber: stock.batchNumber,
      });

      if (sku && batch) {
        const daysUntilExpiry = this.calculateDaysUntilExpiry(stock.expiryDate!);
        result.push({
          stock,
          sku,
          batch,
          daysUntilExpiry,
        });
      }
    }

    // Sort by days since expiry (most expired first)
    result.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    return result;
  }

  /**
   * Mark expired items as unavailable (reduce stock to reserved quantity)
   */
  async markExpired(storeId: string): Promise<{
    success: boolean;
    processed: number;
    message: string;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all expired stocks
      const expiredStocks = await Stock.find({
        storeId,
        isExpired: true,
        quantity: { $gt: 0 }, // Only process stocks with available quantity
      }).session(session);

      let processedCount = 0;

      for (const stock of expiredStocks) {
        // Move available quantity to reserved or deduct entirely
        // In this implementation, we mark the stock quantity as 0
        // (reserved quantity remains for orders already placed)
        const availableQty = stock.quantity - stock.reservedQuantity;

        if (availableQty > 0) {
          stock.quantity = stock.reservedQuantity;
          stock.availableQuantity = stock.reservedQuantity;
          await stock.save({ session });
          processedCount++;
        }

        // Also mark the corresponding batch
        if (stock.batchNumber) {
          await Batch.updateOne(
            {
              skuId: stock.skuId,
              batchNumber: stock.batchNumber,
            },
            {
              $set: { isExpired: true },
            },
            { session }
          );
        }
      }

      await session.commitTransaction();

      return {
        success: true,
        processed: processedCount,
        message: `Processed ${processedCount} expired stock items`,
      };
    } catch (error: any) {
      await session.abortTransaction();
      return {
        success: false,
        processed: 0,
        message: `Failed to mark expired: ${error.message}`,
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Send expiry alerts via notification service
   */
  async sendExpiryAlerts(storeId: string): Promise<{
    success: boolean;
    alertsSent: number;
    message: string;
  }> {
    try {
      const expiryData = await this.getExpiryAlertsData(storeId);

      if (expiryData.totalExpiringSoon === 0 && expiryData.totalExpired === 0) {
        return {
          success: true,
          alertsSent: 0,
          message: 'No expiry alerts to send',
        };
      }

      const alertMessage = this.formatAlertMessage(expiryData);
      console.log(`[ExpiryAlert] Store ${storeId}: ${alertMessage}`);

      // Send expiry alert via notification service
      try {
        const response = await fetch(NOTIFICATION_SERVICE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'expiry_alert',
            storeId,
            message: alertMessage,
            expiringSoon: expiryData.expiringSoon.map(item => ({
              skuId: item.sku.skuId || item.sku._id?.toString(),
              skuName: item.sku.name,
              batchNumber: item.batch.batchNumber,
              quantity: item.stock.quantity,
              daysUntilExpiry: item.daysUntilExpiry,
              expiryDate: item.stock.expiryDate,
            })),
            expired: expiryData.expired.map(item => ({
              skuId: item.sku.skuId || item.sku._id?.toString(),
              skuName: item.sku.name,
              batchNumber: item.batch.batchNumber,
              quantity: item.stock.quantity,
              daysUntilExpiry: item.daysUntilExpiry,
              expiryDate: item.stock.expiryDate,
            })),
            totalExpiringSoon: expiryData.totalExpiringSoon,
            totalExpired: expiryData.totalExpired,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Notification service error: ${response.status} - ${errorText}`);
        }

        console.log(`[ExpiryAlert] Notifications sent successfully for store ${storeId}`);
      } catch (notificationError) {
        // Log warning but don't fail - notification service may be unavailable
        console.warn(`[ExpiryAlert] Failed to send expiry notifications via notification service, logged locally`, {
          storeId,
          error: notificationError instanceof Error ? notificationError.message : String(notificationError),
        });
      }

      return {
        success: true,
        alertsSent: expiryData.totalExpiringSoon + expiryData.totalExpired,
        message: alertMessage,
      };
    } catch (error: any) {
      return {
        success: false,
        alertsSent: 0,
        message: `Failed to send expiry alerts: ${error.message}`,
      };
    }
  }

  /**
   * Get combined expiry alerts data
   */
  async getExpiryAlertsData(storeId: string): Promise<ExpiryAlertResult> {
    const [expiringSoon, expired] = await Promise.all([
      this.getExpiringSoon(storeId, 30),
      this.getExpired(storeId),
    ]);

    return {
      expiringSoon,
      expired,
      totalExpiringSoon: expiringSoon.length,
      totalExpired: expired.length,
    };
  }

  /**
   * Cleanup expired batches (remove from database)
   */
  async cleanupExpiredBatches(storeId: string, olderThanDays: number = 90): Promise<{
    success: boolean;
    deleted: number;
    message: string;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      cutoffDate.setHours(0, 0, 0, 0);

      // Find stocks with expired batches older than cutoff
      const expiredStocks = await Stock.find({
        storeId,
        isExpired: true,
        expiryDate: { $lt: cutoffDate },
      }).session(session);

      let deletedCount = 0;

      for (const stock of expiredStocks) {
        // Delete the associated batch
        if (stock.batchNumber) {
          const result = await Batch.deleteOne(
            {
              skuId: stock.skuId,
              batchNumber: stock.batchNumber,
            },
            { session }
          );
          if (result.deletedCount > 0) {
            deletedCount++;
          }
        }

        // Clear expiry fields from stock
        stock.batchNumber = undefined;
        stock.manufacturingDate = undefined;
        stock.expiryDate = undefined;
        stock.batchCostPrice = undefined;
        stock.isExpiringSoon = false;
        stock.isExpired = false;
        await stock.save({ session });
      }

      await session.commitTransaction();

      return {
        success: true,
        deleted: deletedCount,
        message: `Cleaned up ${deletedCount} expired batches`,
      };
    } catch (error: any) {
      await session.abortTransaction();
      return {
        success: false,
        deleted: 0,
        message: `Cleanup failed: ${error.message}`,
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Update expiry status for all stocks in a store
   */
  async updateExpiryStatuses(storeId: string): Promise<{
    success: boolean;
    updated: number;
    message: string;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      thirtyDaysFromNow.setHours(23, 59, 59, 999);

      // Update all stocks with expiry dates
      const stocks = await Stock.find({
        storeId,
        expiryDate: { $exists: true },
      }).session(session);

      let updatedCount = 0;

      for (const stock of stocks) {
        let needsSave = false;

        // Check if expired
        const expiryDate = new Date(stock.expiryDate!);
        expiryDate.setHours(0, 0, 0, 0);

        const wasExpired = stock.isExpired;
        stock.isExpired = expiryDate < today;

        // Check if expiring soon
        const wasExpiringSoon = stock.isExpiringSoon;
        stock.isExpiringSoon = !stock.isExpired && expiryDate <= thirtyDaysFromNow;

        if (wasExpired !== stock.isExpired || wasExpiringSoon !== stock.isExpiringSoon) {
          await stock.save({ session });
          updatedCount++;
        }

        // Also update the corresponding batch
        if (stock.batchNumber) {
          await Batch.updateOne(
            {
              skuId: stock.skuId,
              batchNumber: stock.batchNumber,
            },
            {
              $set: {
                isExpired: stock.isExpired,
                isExpiringSoon: stock.isExpiringSoon,
              },
            },
            { session }
          );
        }
      }

      await session.commitTransaction();

      return {
        success: true,
        updated: updatedCount,
        message: `Updated expiry status for ${updatedCount} stocks`,
      };
    } catch (error: any) {
      await session.abortTransaction();
      return {
        success: false,
        updated: 0,
        message: `Failed to update expiry statuses: ${error.message}`,
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Get expiry summary for a store
   */
  async getExpirySummary(storeId: string): Promise<{
    totalItems: number;
    expiringToday: number;
    expiringThisWeek: number;
    expiringThisMonth: number;
    expired: number;
    totalValueAtRisk: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    const endOfMonth = new Date(today);
    endOfMonth.setDate(endOfMonth.getDate() + 30);
    endOfMonth.setHours(23, 59, 59, 999);

    const stocks = await Stock.find({
      storeId,
      expiryDate: { $exists: true },
      quantity: { $gt: 0 },
    });

    let expiringToday = 0;
    let expiringThisWeek = 0;
    let expiringThisMonth = 0;
    let expired = 0;
    let totalValueAtRisk = 0;

    for (const stock of stocks) {
      const expiryDate = new Date(stock.expiryDate!);
      expiryDate.setHours(0, 0, 0, 0);

      const qty = stock.quantity - stock.reservedQuantity;
      const value = qty * (stock.batchCostPrice || 0);

      if (expiryDate < today) {
        expired++;
        totalValueAtRisk += value;
      } else if (expiryDate >= today && expiryDate <= endOfToday) {
        expiringToday++;
        totalValueAtRisk += value;
      } else if (expiryDate > endOfToday && expiryDate <= endOfWeek) {
        expiringThisWeek++;
        totalValueAtRisk += value;
      } else if (expiryDate > endOfWeek && expiryDate <= endOfMonth) {
        expiringThisMonth++;
        totalValueAtRisk += value;
      }
    }

    return {
      totalItems: stocks.length,
      expiringToday,
      expiringThisWeek,
      expiringThisMonth,
      expired,
      totalValueAtRisk,
    };
  }

  /**
   * Helper: Calculate days until expiry
   */
  private calculateDaysUntilExpiry(expiryDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Helper: Format alert message
   */
  private formatAlertMessage(data: ExpiryAlertResult): string {
    const parts: string[] = [];

    if (data.totalExpired > 0) {
      parts.push(`${data.totalExpired} expired`);
    }

    if (data.totalExpiringSoon > 0) {
      parts.push(`${data.totalExpiringSoon} expiring soon`);
    }

    return `Expiry alert: ${parts.join(', ')}`;
  }
}

export const expiryService = new ExpiryService();
