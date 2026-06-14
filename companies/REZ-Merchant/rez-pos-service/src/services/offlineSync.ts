/**
 * Offline POS Sync Service
 * Handles offline order creation and synchronization when connection is restored
 */

import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IOfflineOrder {
  _id: mongoose.Types.ObjectId;
  offlineId: string; // Client-generated UUID
  merchantId: string;
  storeId: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    modifiers?: Array<{ name: string; price: number }>;
    notes?: string;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet';
  paymentStatus: 'pending' | 'completed';
  staffId?: string;
  tableId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  status: 'pending' | 'synced' | 'failed';
  syncError?: string;
  syncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Offline metadata
  deviceId: string;
  appVersion: string;
  location?: { lat: number; lng: number };
}

const OfflineOrderSchema = new Schema<IOfflineOrder>(
  {
    offlineId: { type: String, required: true, unique: true, index: true },
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    items: [
      {
        itemId: String,
        name: String,
        quantity: Number,
        price: Number,
        modifiers: [{ name: String, price: Number }],
        notes: String,
      },
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    staffId: String,
    tableId: String,
    customerId: String,
    customerName: String,
    customerPhone: String,
    orderType: {
      type: String,
      enum: ['dine-in', 'takeaway', 'delivery'],
      default: 'dine-in',
    },
    status: {
      type: String,
      enum: ['pending', 'synced', 'failed'],
      default: 'pending',
      index: true,
    },
    syncError: String,
    syncedAt: Date,
    deviceId: { type: String, required: true, index: true },
    appVersion: String,
    location: {
      lat: Number,
      lng: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for sync operations
OfflineOrderSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
OfflineOrderSchema.index({ offlineId: 1, merchantId: 1 });

export const OfflineOrder =
  mongoose.models.OfflineOrder ||
  mongoose.model<IOfflineOrder>('OfflineOrder', OfflineOrderSchema);

/**
 * Conflict Resolution Strategy
 * Uses Last-Write-Wins with offlineId tiebreaker
 */
export interface SyncConflict {
  offlineOrder: IOfflineOrder;
  serverOrder?: any;
  conflictType: 'duplicate' | 'modified' | 'missing';
  resolution: 'keep_offline' | 'keep_server' | 'merge' | 'manual';
}

/**
 * Sync Service Class
 */
export class OfflineSyncService {
  private conflictResolutionStrategy: 'offline_wins' | 'server_wins' | 'manual' = 'offline_wins';

  /**
   * Queue an order created offline
   */
  async queueOrder(order: Partial<IOfflineOrder>): Promise<IOfflineOrder> {
    const offlineOrder = new OfflineOrder({
      ...order,
      offlineId: order.offlineId || uuidv4(),
      status: 'pending',
    });
    await offlineOrder.save();
    return offlineOrder;
  }

  /**
   * Get all pending orders for a merchant
   */
  async getPendingOrders(merchantId: string): Promise<IOfflineOrder[]> {
    return OfflineOrder.find({
      merchantId,
      status: 'pending',
    }).sort({ createdAt: 1 });
  }

  /**
   * Sync a single order to the server
   */
  async syncOrder(offlineOrderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const offlineOrder = await OfflineOrder.findById(offlineOrderId);
      if (!offlineOrder) {
        return { success: false, error: 'Order not found' };
      }

      // Call the main order service to create the order
      const response = await fetch(`${process.env.MERCHANT_SERVICE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
        },
        body: JSON.stringify({
          merchantId: offlineOrder.merchantId,
          storeId: offlineOrder.storeId,
          items: offlineOrder.items,
          subtotal: offlineOrder.subtotal,
          tax: offlineOrder.tax,
          discount: offlineOrder.discount,
          total: offlineOrder.total,
          paymentMethod: offlineOrder.paymentMethod,
          paymentStatus: offlineOrder.paymentStatus,
          staffId: offlineOrder.staffId,
          tableId: offlineOrder.tableId,
          customerId: offlineOrder.customerId,
          customerName: offlineOrder.customerName,
          customerPhone: offlineOrder.customerPhone,
          orderType: offlineOrder.orderType,
          source: 'offline_sync',
          sourceOfflineId: offlineOrder.offlineId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        offlineOrder.status = 'failed';
        offlineOrder.syncError = error;
        await offlineOrder.save();
        return { success: false, error };
      }

      // Mark as synced
      offlineOrder.status = 'synced';
      offlineOrder.syncedAt = new Date();
      await offlineOrder.save();

      return { success: true };
    } catch (error) {
      const offlineOrder = await OfflineOrder.findById(offlineOrderId);
      if (offlineOrder) {
        offlineOrder.status = 'failed';
        offlineOrder.syncError = error instanceof Error ? error.message : 'Unknown error';
        await offlineOrder.save();
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Bulk sync all pending orders
   */
  async syncAllPending(merchantId: string): Promise<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
  }> {
    const pending = await this.getPendingOrders(merchantId);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const order of pending) {
      const result = await this.syncOrder(order._id.toString());
      if (result.success) {
        success++;
      } else {
        failed++;
        errors.push(`Order ${order.offlineId}: ${result.error}`);
      }
    }

    return { total: pending.length, success, failed, errors };
  }

  /**
   * Detect and resolve conflicts
   */
  async detectConflicts(offlineOrder: IOfflineOrder): Promise<SyncConflict> {
    // Check if order with same offlineId exists on server
    const serverOrder = await this.findServerOrderByOfflineId(offlineOrder.offlineId);

    if (!serverOrder) {
      return {
        offlineOrder,
        conflictType: 'missing',
        resolution: 'keep_offline',
      };
    }

    // Check for duplicates
    if (serverOrder.sourceOfflineId === offlineOrder.offlineId) {
      // Same order, check for modifications
      if (serverOrder.updatedAt > offlineOrder.updatedAt) {
        return {
          offlineOrder,
          serverOrder,
          conflictType: 'modified',
          resolution: 'server_wins',
        };
      }
      return {
        offlineOrder,
        serverOrder,
        conflictType: 'duplicate',
        resolution: 'keep_offline',
      };
    }

    return {
      offlineOrder,
      serverOrder,
      conflictType: 'modified',
      resolution: this.conflictResolutionStrategy === 'offline_wins' ? 'keep_offline' : 'keep_server',
    };
  }

  /**
   * Resolve a conflict manually
   */
  async resolveConflict(
    offlineOrderId: string,
    resolution: 'keep_offline' | 'keep_server' | 'merge',
    mergedData?: Partial<IOfflineOrder>
  ): Promise<IOfflineOrder> {
    const offlineOrder = await OfflineOrder.findById(offlineOrderId);
    if (!offlineOrder) {
      throw new Error('Order not found');
    }

    const conflict = await this.detectConflicts(offlineOrder);

    if (resolution === 'keep_offline') {
      await this.syncOrder(offlineOrderId);
    } else if (resolution === 'keep_server') {
      offlineOrder.status = 'synced';
      offlineOrder.syncedAt = new Date();
      await offlineOrder.save();
    } else if (resolution === 'merge' && mergedData) {
      Object.assign(offlineOrder, mergedData);
      await this.syncOrder(offlineOrderId);
    }

    return offlineOrder;
  }

  /**
   * Find server order by offline ID
   */
  private async findServerOrderByOfflineId(offlineId: string): Promise<any> {
    // This would call the merchant service to find the order
    try {
      const response = await fetch(
        `${process.env.MERCHANT_SERVICE_URL}/api/orders/search?sourceOfflineId=${offlineId}`,
        {
          headers: {
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.data?.[0];
      }
    } catch {
      // Service unavailable
    }
    return null;
  }

  /**
   * Get sync status for a merchant
   */
  async getSyncStatus(merchantId: string): Promise<{
    pending: number;
    synced: number;
    failed: number;
    lastSyncAt: Date | null;
    oldestPending: Date | null;
  }> {
    const [pending, synced, failed] = await Promise.all([
      OfflineOrder.countDocuments({ merchantId, status: 'pending' }),
      OfflineOrder.countDocuments({ merchantId, status: 'synced' }),
      OfflineOrder.countDocuments({ merchantId, status: 'failed' }),
    ]);

    const lastSynced = await OfflineOrder.findOne({
      merchantId,
      status: 'synced',
    })
      .sort({ syncedAt: -1 })
      .select('syncedAt');

    const oldestPendingOrder = await OfflineOrder.findOne({
      merchantId,
      status: 'pending',
    })
      .sort({ createdAt: 1 })
      .select('createdAt');

    return {
      pending,
      synced,
      failed,
      lastSyncAt: lastSynced?.syncedAt || null,
      oldestPending: oldestPendingOrder?.createdAt || null,
    };
  }

  /**
   * Retry failed orders
   */
  async retryFailed(merchantId: string): Promise<{
    total: number;
    success: number;
    failed: number;
  }> {
    const failedOrders = await OfflineOrder.find({
      merchantId,
      status: 'failed',
    });

    let success = 0;
    let failed = 0;

    for (const order of failedOrders) {
      // Reset status to pending before retry
      order.status = 'pending';
      order.syncError = undefined;
      await order.save();

      const result = await this.syncOrder(order._id.toString());
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    return { total: failedOrders.length, success, failed };
  }

  /**
   * Clear synced orders older than X days
   */
  async cleanupSyncedOrders(merchantId: string, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await OfflineOrder.deleteMany({
      merchantId,
      status: 'synced',
      syncedAt: { $lt: cutoffDate },
    });

    return result.deletedCount || 0;
  }
}

export const offlineSyncService = new OfflineSyncService();
