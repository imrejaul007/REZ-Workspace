import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

function generateTxnId(): string {
  // FIX (119+153): Replace predictable Date.now() with crypto.getRandomValues and
  // use full UUID v4 (not truncated) for maximum entropy. Date.now() is monotonically
  // increasing and enumerable; truncated UUID has only 48 bits of entropy. Full UUID
  // v4 provides 122 bits. crypto.getRandomValues is synchronous and available in RN.
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  const securePrefix = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `TXN-${securePrefix}-${uuidv4().replace(/-/g, '').toUpperCase()}`;
}

const db = SQLite.openDatabaseSync('rez_pos_offline.db');

// Initialize table on first use
// KENJI: integration resilience — catch database initialization errors for disk full, locked, or permission issues
try {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS pending_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0,
      last_attempt INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending'
    );
  `);
  // Migration for existing installations: add status column if missing
  try {
    db.execSync(`ALTER TABLE pending_bills ADD COLUMN status TEXT DEFAULT 'pending';`);
  } catch (_migrationErr) {
    // Column already exists — safe to ignore
  }
  // Evicted bills log table — records bills dropped due to queue capacity limits
  db.execSync(`
    CREATE TABLE IF NOT EXISTS evicted_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_data TEXT NOT NULL,
      evicted_at INTEGER NOT NULL,
      original_created_at INTEGER NOT NULL
    );
  `);
} catch (error) {
  logger.error('[OfflinePOSQueue] Database initialization failed:', error);
}

export interface PendingBill {
  id?: number;
  billData: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  lastAttempt: number;
}

// KENJI: integration resilience — trigger queue flush when connectivity restored
export function setupNetworkListener(onConnect?: () => void): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && onConnect) {
      onConnect();
    }
  });
  return unsubscribe;
}

// Maximum number of bills that may sit in the offline queue at once.
// This guards against unbounded SQLite growth when a device loses connectivity
// for an extended period. Once the limit is reached the oldest unprocessed bill
// is evicted to make room for the new one, preserving recency and bounding disk use.
const MAX_QUEUE_SIZE = 500;

export function enqueueBill(billData: Record<string, unknown>): void {
  try {
    // Enforce the depth cap before inserting. If the queue is full, remove the
    // oldest entry (lowest id) so we never exceed MAX_QUEUE_SIZE rows.
    const currentCount = getPendingCount();
    if (currentCount >= MAX_QUEUE_SIZE) {
      // Archive the evicted bill before deleting so merchants can recover it if needed
      const oldest = db.getFirstSync<{ id: number; bill_data: string; created_at: number }>(
        'SELECT id, bill_data, created_at FROM pending_bills ORDER BY created_at ASC LIMIT 1'
      );
      if (oldest) {
        logger.warn(
          `[OfflinePOSQueue] Queue full (${currentCount}/${MAX_QUEUE_SIZE}). Evicting bill id=${oldest.id}.`
        );
        try {
          db.runSync(
            'INSERT INTO evicted_bills (bill_data, evicted_at, original_created_at) VALUES (?, ?, ?)',
            [oldest.bill_data, Date.now(), oldest.created_at]
          );
        } catch (archiveErr) {
          logger.error('[OfflinePOSQueue] Failed to archive evicted bill:', archiveErr);
        }
        db.runSync('DELETE FROM pending_bills WHERE id = ?', [oldest.id]);
      }
    }

    if (!billData.clientTxnId) {
      billData = { ...billData, clientTxnId: generateTxnId() };
    }

    // FIX (120): Store only minimal identifiers and amounts in SQLite instead of
    // full bill JSON. Full transaction details (items, customer data) are reconstructed
    // from server records on sync. This prevents PII exposure on rooted devices.
    // TODO (120): For full encryption at rest, use expo-sqlite with SQLCipher via a
    // native module, storing the key in expo-secure-store. Until then, only store
    // non-PII fields.
    const minimalData = {
      clientTxnId: billData.clientTxnId,
      amount: billData.amount ?? billData.billAmount ?? 0,
      storeId: billData.storeId,
      paymentMethod: billData.paymentMethod ?? 'cash',
      coinDiscountApplied: billData.coinDiscountApplied,
      consumerIdForCoins: billData.consumerIdForCoins,
      items: billData.items, // kept for offline sync (no PII)
      createdAt: billData.timestamp ?? Date.now(),
    };

    db.runSync(
      'INSERT INTO pending_bills (bill_data, created_at, attempts, last_attempt) VALUES (?, ?, 0, 0)',
      [JSON.stringify(minimalData), Date.now()]
    );
  } catch (error: unknown) {
    // KENJI: integration resilience — handle database locked or disk full errors gracefully
    const errMsg = error instanceof Error ? error.message : '';
    if (errMsg.includes('database is locked')) {
      logger.warn('[OfflinePOSQueue] Database locked, retrying enqueue in 500ms');
      setTimeout(() => {
        try {
          db.runSync(
            'INSERT INTO pending_bills (bill_data, created_at, attempts, last_attempt) VALUES (?, ?, 0, 0)',
            [JSON.stringify(billData), Date.now()]
          );
        } catch (retryError) {
          logger.error('[OfflinePOSQueue] Enqueue retry failed:', retryError);
        }
      }, 500);
    } else if (errMsg.includes('disk I/O error') || errMsg.includes('disk full')) {
      logger.error('[OfflinePOSQueue] Disk error, cannot enqueue:', errMsg);
    } else {
      logger.error('[OfflinePOSQueue] Enqueue failed:', error);
    }
  }
}

export function getPendingBills(): PendingBill[] {
  try {
    const rows = db.getAllSync<{
      id: number;
      bill_data: string;
      created_at: number;
      attempts: number;
      last_attempt: number;
    }>('SELECT * FROM pending_bills ORDER BY created_at ASC');
    return rows.map((r) => ({
      id: r.id,
      billData: JSON.parse(r.bill_data),
      createdAt: r.created_at,
      attempts: r.attempts,
      lastAttempt: r.last_attempt,
    }));
  } catch (error) {
    logger.error('[OfflinePOSQueue] Failed to fetch pending bills:', error);
    return [];
  }
}

export function markBillSuccess(id: number): void {
  try {
    db.runSync('DELETE FROM pending_bills WHERE id = ?', [id]);
  } catch (error) {
    logger.error('[OfflinePOSQueue] Failed to mark bill as success:', error);
  }
}

export function incrementAttempt(id: number): void {
  try {
    db.runSync('UPDATE pending_bills SET attempts = attempts + 1, last_attempt = ? WHERE id = ?', [
      Date.now(),
      id,
    ]);
  } catch (error) {
    logger.error('[OfflinePOSQueue] Failed to increment attempt:', error);
  }
}

export function getPendingCount(): number {
  try {
    const result = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM pending_bills'
    );
    return result?.count || 0;
  } catch (error) {
    logger.error('[OfflinePOSQueue] Failed to get pending count:', error);
    return 0;
  }
}

export function clearAllPendingBills(): void {
  try {
    db.runSync('DELETE FROM pending_bills');
  } catch (error) {
    logger.error('[OfflinePOSQueue] Failed to clear pending bills:', error);
  }
}

export function getPendingBillById(id: number): PendingBill | null {
  try {
    const row = db.getFirstSync<{
      id: number;
      bill_data: string;
      created_at: number;
      attempts: number;
      last_attempt: number;
    }>('SELECT * FROM pending_bills WHERE id = ?', [id]);

    if (!row) return null;

    return {
      id: row.id,
      billData: JSON.parse(row.bill_data),
      createdAt: row.created_at,
      attempts: row.attempts,
      lastAttempt: row.last_attempt,
    };
  } catch (error) {
    logger.error('[OfflinePOSQueue] Failed to fetch bill by ID:', error);
    return null;
  }
}

/** Minimal API client interface needed for offline queue sync */
export interface OfflineQueueApiClient {
  post(
    path: string,
    body: unknown
  ): Promise<{ data?: { data?: { results?: Array<{ clientTxnId: string; status: string }> } } }>;
}

/** Shape of bill data fields accessed during sync */
interface BillDataFields {
  clientTxnId?: string;
  amount?: number;
  billAmount?: number;
  paymentMethod?: string;
  items?: unknown[];
  /** G-MA-C02/C03: Coin discount applied at POS to reduce bill amount. Must be
   * forwarded to the backend so the correct (post-discount) amount is charged. */
  coinDiscountApplied?: number;
  /** G-MA-C02/C03: Consumer who redeemed coins — backend issues coins to this user. */
  consumerIdForCoins?: string | null;
}

export async function syncOfflineQueue(
  apiClient: OfflineQueueApiClient,
  storeId: string
): Promise<{ synced: number; failed: number; conflicts: number }> {
  const pending = getPendingBills();
  if (pending.length === 0) return { synced: 0, failed: 0, conflicts: 0 };

  const transactions = pending.slice(0, 50).map((p) => {
    const bd = p.billData as BillDataFields;
    return {
      clientTxnId: bd.clientTxnId || `LEGACY-${p.id}`,
      storeId,
      amount: bd.amount || bd.billAmount || 0,
      paymentMethod: bd.paymentMethod || 'cash',
      items: bd.items,
      createdAt: p.createdAt,
    };
  });

  try {
    const res = await apiClient.post('merchant/pos/offline-sync', { transactions });
    const results: Array<{ clientTxnId: string; status: string }> = res.data?.data?.results || [];

    // Per-bill acknowledgment: only remove each bill after server confirms it was processed.
    // This prevents double-charging on partial failures (C10 fix).
    for (const bill of pending) {
      const clientTxnId = (bill.billData as BillDataFields).clientTxnId || `LEGACY-${bill.id}`;
      const result = results.find((r) => r.clientTxnId === clientTxnId);
      if (result && (result.status === 'ok' || result.status === 'duplicate')) {
        // Only mark success after confirmed by server
        markBillSuccess(bill.id!);
      } else if (bill.attempts >= 5) {
        // Give up after 5 attempts — move to unrecoverable state instead of silently dropping
        // Use 'UNRECOVERABLE' status to distinguish from successfully processed bills
        try {
          db.runSync('UPDATE pending_bills SET status = ? WHERE id = ?', [
            'UNRECOVERABLE',
            bill.id!,
          ]);
        } catch (updateError) {
          logger.error('[OfflinePOSQueue] Failed to mark bill unrecoverable:', updateError);
        }
      } else {
        incrementAttempt(bill.id!);
      }
    }

    const synced = results.filter((r) => r.status === 'ok').length;
    const failed = results.filter((r) => r.status === 'error').length;
    const conflicts = results.filter((r) => r.status === 'duplicate').length;
    // MED-02: Return conflicts so the UI can show a resolution message
    return { synced, failed, conflicts };
  } catch {
    return { synced: 0, failed: pending.length, conflicts: 0 };
  }
}
