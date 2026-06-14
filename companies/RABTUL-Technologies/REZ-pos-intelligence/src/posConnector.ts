/**
 * REZ POS → Offline Tracker Connector
 *
 * Connects POS systems to REZ Intelligence
 *
 * POS generates:
 * - Offline purchases
 * - Bill amounts
 * - Item-level data
 * - Payment methods
 *
 * This connects to:
 * - REZ-offline-commerce-tracker
 * - REZ-commerce-graph
 * - REZ-attribution
 */

import axios from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const OFFLINE_TRACKER_URL = process.env.OFFLINE_TRACKER_URL || 'http://localhost:4125';
const GRAPH_SERVICE_URL = process.env.GRAPH_SERVICE_URL || 'http://localhost:4129';
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:4004';

// ============================================================================
// Types
// ============================================================================

export interface POSTransaction {
  transactionId: string;
  merchantId: string;
  storeId: string;
  userId?: string;
  items: POSItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'wallet' | 'mixed';
  cashGiven?: number;
  changeGiven?: number;
  customerPhone?: string;
  loyaltyId?: string;
  timestamp: string;
}

export interface POSItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
  sku?: string;
}

export interface POSConnection {
  posId: string;
  merchantId: string;
  storeId: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'connected' | 'syncing' | 'error';
  lastSync?: string;
  errorMessage?: string;
}

// ============================================================================
// POS Intelligence Connector
// ============================================================================

class POSIntelligenceConnector {
  private connections: Map<string, POSConnection> = new Map();

  // ============================================
  // Connection Management
  // ============================================

  /**
   * Register a POS system
   */
  async registerPOS(config: {
    posId: string;
    merchantId: string;
    storeId: string;
    location: { lat: number; lng: number };
  }): Promise<POSConnection> {
    const connection: POSConnection = {
      posId: config.posId,
      merchantId: config.merchantId,
      storeId: config.storeId,
      location: config.location,
      status: 'connected'
    };

    this.connections.set(config.posId, connection);
    return connection;
  }

  // ============================================
  // Transaction Processing
  // ============================================

  /**
   * Process POS transaction → Send to Intelligence
   */
  async processTransaction(transaction: POSTransaction): Promise<{
    tracked: boolean;
    purchaseId?: string;
    cashback?: number;
  }> {
    const result = {
      tracked: false,
      purchaseId: undefined as string | undefined,
      cashback: undefined as number | undefined
    };

    try {
      // 1. Send to Offline Commerce Tracker
      const offlineResult = await this.sendToOfflineTracker(transaction);
      result.purchaseId = offlineResult.purchaseId;

      // 2. Update Commerce Graph
      await this.updateCommerceGraph(transaction);

      // 3. Calculate and apply cashback
      if (transaction.userId) {
        const cashbackResult = await this.processCashback(transaction);
        result.cashback = cashbackResult.cashbackAmount;
      }

      // 4. Emit events
      await this.emitEvents(transaction);

      result.tracked = true;
    } catch (error) {
      console.error('POS transaction processing failed:', error);
      // Still return success - we don't want to block POS
      result.tracked = true;
    }

    return result;
  }

  // ============================================
  // Private Methods
  // ============================================

  private async sendToOfflineTracker(transaction: POSTransaction): Promise<{ purchaseId: string }> {
    const response = await axios.post(
      `${OFFLINE_TRACKER_URL}/api/purchases`,
      {
        userId: transaction.userId || 'walk_in',
        merchantId: transaction.merchantId,
        storeId: transaction.storeId,
        billAmount: transaction.total,
        items: transaction.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          category: item.category
        })),
        paymentMethod: transaction.paymentMethod,
        timestamp: transaction.timestamp,
        source: 'pos',
        metadata: {
          posId: this.getConnectionPOSId(transaction.merchantId),
          loyaltyId: transaction.loyaltyId,
          customerPhone: transaction.customerPhone
        }
      },
      { timeout: 5000 }
    );

    return { purchaseId: response.data.purchaseId };
  }

  private async updateCommerceGraph(transaction: POSTransaction): Promise<void> {
    if (!transaction.userId) return;

    await axios.post(
      `${GRAPH_SERVICE_URL}/api/edges`,
      {
        type: 'purchased_from',
        from: { type: 'user', id: transaction.userId },
        to: { type: 'merchant', id: transaction.merchantId },
        weight: this.calculateWeight(transaction.total),
        properties: {
          transactionId: transaction.transactionId,
          amount: transaction.total,
          items: transaction.items.length,
          paymentMethod: transaction.paymentMethod,
          timestamp: transaction.timestamp
        }
      }
    );
  }

  private async processCashback(transaction: POSTransaction): Promise<{ cashbackAmount: number }> {
    // Calculate 5% cashback (configurable)
    const cashbackPercent = 5;
    const cashbackAmount = Math.round(transaction.total * cashbackPercent / 100);

    if (cashbackAmount > 0) {
      await axios.post(
        `${WALLET_SERVICE_URL}/api/wallet/credit`,
        {
          userId: transaction.userId,
          amount: cashbackAmount,
          type: 'cashback',
          source: 'pos',
          merchantId: transaction.merchantId,
          reference: transaction.transactionId
        },
        { timeout: 5000 }
      );
    }

    return { cashbackAmount };
  }

  private async emitEvents(transaction: POSTransaction): Promise<void> {
    // Emit to Event Bus
    await axios.post(
      `${process.env.EVENT_BUS_URL || 'http://localhost:4025'}/api/events`,
      {
        type: 'pos.transaction',
        userId: transaction.userId,
        merchantId: transaction.merchantId,
        data: {
          transactionId: transaction.transactionId,
          amount: transaction.total,
          items: transaction.items.length,
          paymentMethod: transaction.paymentMethod,
          cashback: transaction.userId ? Math.round(transaction.total * 0.05) : 0
        }
      }
    );
  }

  private getConnectionPOSId(merchantId: string): string | undefined {
    for (const [posId, conn] of this.connections) {
      if (conn.merchantId === merchantId) return posId;
    }
    return undefined;
  }

  private calculateWeight(amount: number): number {
    return Math.min(amount / 100, 5); // Max weight of 5 for ₹500+
  }

  // ============================================
  // Analytics
  // ============================================

  /**
   * Get POS analytics for merchant
   */
  async getMerchantAnalytics(merchantId: string): Promise<{
    totalTransactions: number;
    totalRevenue: number;
    avgTransactionValue: number;
    topItems: { name: string; quantity: number }[];
    paymentMethodBreakdown: Record<string, number>;
    hourlyVolume: Record<number, number>;
  }> {
    const response = await axios.get(
      `${OFFLINE_TRACKER_URL}/api/analytics/merchant/${merchantId}`,
      { timeout: 5000 }
    );
    return response.data;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const posConnector = new POSIntelligenceConnector();
export default posConnector;
