/**
 * REZ Go Session Expiry Service
 *
 * Background job to:
 * - Expire abandoned sessions
 * - Release reserved inventory
 * - Clean up stale data
 */

import cron from 'node-cron';
import { GoSession } from '../models/GoSession.js';
import { releaseInventory } from './inventoryService.js';
import { goWebSocketServer } from './websocketService.js';

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

interface ExpiryResult {
  expired: number;
  released: number;
  errors: string[];
}

/**
 * Start the session expiry cron job
 */
export function startSessionExpiryJob(): void {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[SessionExpiry] Running expiry check...');
    await expireAbandonedSessions();
  });

  console.log('Session expiry job started (runs every 5 minutes)');
}

/**
 * Expire abandoned sessions
 */
async function expireAbandonedSessions(): Promise<ExpiryResult> {
  const result: ExpiryResult = {
    expired: 0,
    released: 0,
    errors: [],
  };

  const cutoffTime = new Date(Date.now() - SESSION_TIMEOUT_MS);

  try {
    // Find abandoned sessions
    const abandonedSessions = await GoSession.find({
      status: { $in: ['active', 'syncing'] },
      updatedAt: { $lt: cutoffTime },
    });

    console.log(`[SessionExpiry] Found ${abandonedSessions.length} abandoned sessions`);

    for (const session of abandonedSessions) {
      try {
        // Release inventory
        if (session.items.length > 0) {
          await releaseInventory(session.storeId, session.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          })));
          result.released++;
        }

        // Cancel session
        await GoSession.updateOne(
          { sessionId: session.sessionId },
          {
            status: 'expired',
            'metadata.expiredAt': new Date(),
            'metadata.expiredReason': 'timeout',
          }
        );

        // Notify via WebSocket
        goWebSocketServer.broadcastToStore(session.storeId, {
          type: 'session.cancelled',
          sessionId: session.sessionId,
          data: { reason: 'expired' },
          timestamp: Date.now(),
        });

        result.expired++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Session ${session.sessionId}: ${errorMsg}`);
        console.error(`[SessionExpiry] Error expiring session ${session.sessionId}:`, error);
      }
    }

    if (result.expired > 0) {
      console.log(`[SessionExpiry] Expired ${result.expired} sessions, released ${result.released} inventory reservations`);
    }
  } catch (error) {
    console.error('[SessionExpiry] Fatal error:', error);
    result.errors.push('Fatal error in expiry job');
  }

  return result;
}

/**
 * Expire a specific session manually
 */
export async function expireSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await GoSession.findOne({ sessionId });
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.status === 'completed' || session.status === 'expired') {
      return { success: false, error: 'Session already closed' };
    }

    // Release inventory
    if (session.items.length > 0) {
      await releaseInventory(session.storeId, session.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
      })));
    }

    // Cancel session
    await GoSession.updateOne(
      { sessionId },
      {
        status: 'expired',
        'metadata.expiredAt': new Date(),
        'metadata.expiredReason': 'manual',
      }
    );

    return { success: true };
  } catch (error) {
    console.error('[SessionExpiry] Error expiring session:', error);
    return { success: false, error: 'Failed to expire session' };
  }
}

/**
 * Get session expiry statistics
 */
export async function getExpiryStats(): Promise<{
  abandonedSessions: number;
  oldestSession: Date | null;
  totalActive: number;
}> {
  const cutoffTime = new Date(Date.now() - SESSION_TIMEOUT_MS);

  const [abandonedCount, oldestAbandoned, activeCount] = await Promise.all([
    GoSession.countDocuments({
      status: { $in: ['active', 'syncing'] },
      updatedAt: { $lt: cutoffTime },
    }),
    GoSession.findOne({
      status: { $in: ['active', 'syncing'] },
      updatedAt: { $lt: cutoffTime },
    }).sort({ updatedAt: 1 }).select('updatedAt'),
    GoSession.countDocuments({
      status: { $in: ['active', 'syncing'] },
    }),
  ]);

  return {
    abandonedSessions: abandonedCount,
    oldestSession: oldestAbandoned?.updatedAt || null,
    totalActive: activeCount,
  };
}

/**
 * Clean up old completed sessions (older than 30 days)
 */
export async function cleanupOldSessions(): Promise<{ deleted: number }> {
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await GoSession.deleteMany({
    status: { $in: ['completed', 'expired', 'cancelled'] },
    updatedAt: { $lt: cutoffDate },
  });

  console.log(`[SessionExpiry] Cleaned up ${result.deletedCount} old sessions`);
  return { deleted: result.deletedCount };
}

export default {
  startSessionExpiryJob,
  expireSession,
  getExpiryStats,
  cleanupOldSessions,
};
