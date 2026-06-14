import { v4 as uuidv4 } from 'uuid';
import { OfflineSyncItem, UserOfflineState, SyncActionType, SyncStatus } from '../models/OfflineSync.js';
import { GoSession } from '../models/GoSession.js';
import { config } from '../config/index.js';

export interface SyncAction {
  sessionId: string;
  action: SyncActionType;
  payload: Record<string, unknown>;
  localTimestamp: Date;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export class SyncService {
  /**
   * Queue an offline action
   */
  async queueAction(
    userId: string,
    sessionId: string,
    action: SyncActionType,
    payload: Record<string, unknown>
  ): Promise<string> {
    const syncItem = new OfflineSyncItem({
      syncId: `SYNC-${uuidv4()}`,
      userId,
      sessionId,
      action,
      payload,
      localTimestamp: new Date(),
      syncAttempts: 0,
      status: 'pending',
    });

    await syncItem.save();

    // Update user offline state
    await this.updateUserOfflineState(userId, sessionId);

    return syncItem.syncId;
  }

  /**
   * Bulk sync offline actions
   */
  async syncActions(userId: string, actions: SyncAction[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    // Sort by timestamp to maintain order
    actions.sort((a, b) => a.localTimestamp.getTime() - b.localTimestamp.getTime());

    for (const action of actions) {
      try {
        await this.processAction(userId, action);
        result.synced++;
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Action ${action.action} for session ${action.sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    result.success = result.failed === 0;

    return result;
  }

  /**
   * Process a single action
   */
  private async processAction(userId: string, action: SyncAction): Promise<void> {
    const { sessionId, action: actionType, payload, localTimestamp } = action;

    switch (actionType) {
      case 'create_session':
        await this.syncCreateSession(userId, payload);
        break;

      case 'add_item':
        await this.syncAddItem(sessionId, payload);
        break;

      case 'update_item':
        await this.syncUpdateItem(sessionId, payload);
        break;

      case 'remove_item':
        await this.syncRemoveItem(sessionId, payload);
        break;

      case 'update_quantity':
        await this.syncUpdateQuantity(sessionId, payload);
        break;

      case 'checkout':
        await this.syncCheckout(sessionId, userId, payload);
        break;

      case 'cancel_session':
        await this.syncCancelSession(sessionId, userId);
        break;

      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  /**
   * Sync create session
   */
  private async syncCreateSession(userId: string, payload: Record<string, unknown>): Promise<void> {
    // Check if session already exists
    const existing = await GoSession.findOne({ sessionId: payload.sessionId as string });
    if (existing) {
      return; // Already synced
    }

    // In production, would recreate session from payload
    // For now, log the sync
    console.log(`Syncing session creation: ${payload.sessionId}`);
  }

  /**
   * Sync add item
   */
  private async syncAddItem(sessionId: string, payload: Record<string, unknown>): Promise<void> {
    const session = await GoSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    // Check if item already exists
    const existingItem = session.items.find(
      (item) => item.barcode === payload.barcode
    );

    if (existingItem) {
      // Update quantity
      existingItem.quantity += payload.quantity as number;
    } else {
      // Add new item
      session.items.push({
        productId: payload.productId as string,
        barcode: payload.barcode as string,
        name: payload.name as string,
        price: payload.price as number,
        mrp: payload.mrp as number | undefined,
        quantity: payload.quantity as number,
        cashbackPercent: payload.cashbackPercent as number || 0,
        cashbackAmount: payload.cashbackAmount as number || 0,
        scannedAt: new Date(payload.localTimestamp as string),
      });
    }

    // Recalculate totals
    session.subtotal = session.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    session.tax = Math.round(session.subtotal * 0.18 * 100) / 100;
    session.total = session.subtotal + session.tax;

    await session.save();
  }

  /**
   * Sync update item
   */
  private async syncUpdateItem(sessionId: string, payload: Record<string, unknown>): Promise<void> {
    const session = await GoSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    const itemIndex = session.items.findIndex(
      (item) => item.productId === payload.itemId
    );

    if (itemIndex < 0) {
      throw new Error('Item not found');
    }

    // Update item fields
    Object.assign(session.items[itemIndex], payload.updates);
    await session.save();
  }

  /**
   * Sync remove item
   */
  private async syncRemoveItem(sessionId: string, payload: Record<string, unknown>): Promise<void> {
    const session = await GoSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    session.items = session.items.filter(
      (item) => item.productId !== payload.itemId
    );

    // Recalculate totals
    session.subtotal = session.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    session.tax = Math.round(session.subtotal * 0.18 * 100) / 100;
    session.total = session.subtotal + session.tax;

    await session.save();
  }

  /**
   * Sync update quantity
   */
  private async syncUpdateQuantity(sessionId: string, payload: Record<string, unknown>): Promise<void> {
    const session = await GoSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    const item = session.items.find(
      (item) => item.productId === payload.itemId
    );

    if (!item) {
      throw new Error('Item not found');
    }

    item.quantity = payload.quantity as number;
    await session.save();
  }

  /**
   * Sync checkout
   */
  private async syncCheckout(
    sessionId: string,
    userId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const session = await GoSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    // Mark as syncing
    session.status = 'syncing';
    await session.save();

    // In production, would trigger payment processing
    // For now, just update status
    console.log(`Syncing checkout for session: ${sessionId}`);
  }

  /**
   * Sync cancel session
   */
  private async syncCancelSession(sessionId: string, userId: string): Promise<void> {
    await GoSession.updateOne(
      { sessionId, userId },
      {
        status: 'cancelled',
        cancelledAt: new Date(),
      }
    );
  }

  /**
   * Update user offline state
   */
  private async updateUserOfflineState(userId: string, sessionId: string): Promise<void> {
    let state = await UserOfflineState.findOne({ userId });

    if (!state) {
      state = new UserOfflineState({
        userId,
        activeSessions: [],
        localCartSnapshots: [],
        lastOnlineAt: new Date(),
      });
    }

    // Update or add session
    const sessionIndex = state.activeSessions.findIndex(
      (s) => s.sessionId === sessionId
    );

    if (sessionIndex >= 0) {
      state.activeSessions[sessionIndex].lastSyncAt = new Date();
      state.activeSessions[sessionIndex].pendingActions++;
    } else {
      state.activeSessions.push({
        sessionId,
        storeId: '', // Would be populated from payload
        lastSyncAt: new Date(),
        pendingActions: 1,
      });
    }

    await state.save();
  }

  /**
   * Get pending sync items for user
   */
  async getPendingSyncItems(userId: string): Promise<OfflineSyncItem[]> {
    return OfflineSyncItem.find({
      userId,
      status: 'pending',
    }).sort({ localTimestamp: 1 });
  }

  /**
   * Mark sync item as completed
   */
  async markCompleted(syncId: string): Promise<void> {
    await OfflineSyncItem.updateOne(
      { syncId },
      { status: 'completed' }
    );
  }

  /**
   * Mark sync item as failed
   */
  async markFailed(syncId: string, error: string): Promise<void> {
    await OfflineSyncItem.updateOne(
      { syncId },
      {
        status: 'failed',
        error,
        $inc: { syncAttempts: 1 },
        lastSyncAttempt: new Date(),
      }
    );
  }

  /**
   * Retry failed syncs
   */
  async retryFailed(userId: string): Promise<SyncResult> {
    const failedItems = await OfflineSyncItem.find({
      userId,
      status: 'failed',
      syncAttempts: { $lt: config.OFFLINE_RETRY_ATTEMPTS },
    });

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    for (const item of failedItems) {
      try {
        await this.processAction(userId, {
          sessionId: item.sessionId,
          action: item.action,
          payload: item.payload as Record<string, unknown>,
          localTimestamp: item.localTimestamp,
        });
        await this.markCompleted(item.syncId);
        result.synced++;
      } catch (error) {
        await this.markFailed(item.syncId, error instanceof Error ? error.message : 'Unknown error');
        result.failed++;
        result.errors.push(`Sync ${item.syncId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.failed === 0;
    return result;
  }

  /**
   * Cleanup old sync items
   */
  async cleanup(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await OfflineSyncItem.deleteMany({
      status: 'completed',
      updatedAt: { $lt: sevenDaysAgo },
    });

    return result.deletedCount;
  }
}

export const syncService = new SyncService();
