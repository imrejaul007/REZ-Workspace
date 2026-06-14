import { config } from '../config/index.js';

export interface WalletBalance {
  total: number;
  available: number;
  pending: number;
  cashback: number;
  coins: {
    type: string;
    amount: number;
  }[];
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  coinType: string;
  source: string;
  description: string;
  createdAt: Date;
}

class WalletIntegration {
  private walletServiceUrl: string;
  private internalToken: string;

  constructor() {
    this.walletServiceUrl = config.WALLET_SERVICE_URL;
    this.internalToken = config.INTERNAL_SERVICE_TOKEN;
  }

  /**
   * Get wallet balance
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const response = await fetch(`${this.walletServiceUrl}/internal/wallet/read/${userId}`, {
        method: 'GET',
        headers: {
          'X-Internal-Token': this.internalToken,
        },
      });

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      return data.balance?.available || 0;
    } catch (error) {
      console.error('Wallet balance error:', error);
      return 0;
    }
  }

  /**
   * Get full wallet info
   */
  async getWalletInfo(userId: string): Promise<WalletBalance | null> {
    try {
      const response = await fetch(`${this.walletServiceUrl}/internal/wallet/read/${userId}`, {
        method: 'GET',
        headers: {
          'X-Internal-Token': this.internalToken,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Wallet info error:', error);
      return null;
    }
  }

  /**
   * Credit cashback to wallet
   */
  async creditCashback(
    userId: string,
    amount: number,
    sessionId: string,
    description?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.walletServiceUrl}/internal/wallet/credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.internalToken,
        },
        body: JSON.stringify({
          userId,
          amount,
          coinType: 'cashback',
          source: 'rez-go',
          referenceId: sessionId,
          description: description || `REZ Go shopping cashback - Session ${sessionId}`,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Wallet credit error:', error);
      return false;
    }
  }

  /**
   * Debit from wallet
   */
  async debit(
    userId: string,
    amount: number,
    sessionId: string,
    description?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.walletServiceUrl}/internal/wallet/debit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.internalToken,
        },
        body: JSON.stringify({
          userId,
          amount,
          source: 'rez-go',
          referenceId: sessionId,
          description: description || `REZ Go checkout - Session ${sessionId}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Debit failed' };
      }

      const data = await response.json();
      return { success: true, transactionId: data.transactionId };
    } catch (error) {
      console.error('Wallet debit error:', error);
      return { success: false, error: 'Wallet service unavailable' };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Transaction[]> {
    try {
      const response = await fetch(
        `${this.walletServiceUrl}/internal/wallet/${userId}/transactions?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'X-Internal-Token': this.internalToken,
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.transactions || [];
    } catch (error) {
      console.error('Transaction history error:', error);
      return [];
    }
  }

  /**
   * Get cached balance for offline mode
   */
  async getCachedBalance(userId: string): Promise<{
    balance: number;
    cachedAt: Date;
  } | null> {
    // In production, would read from Redis cache
    // For now, fall back to current balance
    const balance = await this.getBalance(userId);
    return {
      balance,
      cachedAt: new Date(),
    };
  }
}

export const walletIntegration = new WalletIntegration();
