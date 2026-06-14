/**
 * RABTUL Wallet Service Client
 * Port: 4004
 *
 * Handles wallet balance, transactions, and cashback.
 */

import axios, { AxiosInstance } from 'axios';

export interface WalletBalance {
  balance: number;
  currency: string;
  cashbackBalance: number;
  bonusBalance: number;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  balance: number;
  description: string;
  reference?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export interface CashbackRule {
  id: string;
  name: string;
  percentage: number;
  minOrderValue: number;
  maxCashback: number;
  description: string;
}

export class RabtulWalletClient {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string = process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
    private readonly apiKey: string = process.env.RABTUL_WALLET_API_KEY || '',
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[RabtulWallet] API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Get user's wallet balance
   */
  async getBalance(userId: string): Promise<WalletBalance> {
    const response = await this.client.get<WalletBalance>(`/wallets/${userId}/balance`);
    return response.data;
  }

  /**
   * Get wallet transactions
   */
  async getTransactions(
    userId: string,
    params?: {
      page?: number;
      limit?: number;
      type?: 'credit' | 'debit';
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await this.client.get(`/wallets/${userId}/transactions`, { params });
    return response.data;
  }

  /**
   * Add cashback to wallet
   */
  async addCashback(
    userId: string,
    amount: number,
    description: string,
    reference?: string
  ): Promise<Transaction> {
    const response = await this.client.post<Transaction>(`/wallets/${userId}/cashback`, {
      amount,
      description,
      reference,
    });
    return response.data;
  }

  /**
   * Apply cashback to order
   */
  async applyCashback(
    userId: string,
    orderId: string,
    amount: number
  ): Promise<{ success: boolean; newBalance: number }> {
    const response = await this.client.post(`/wallets/${userId}/apply`, {
      orderId,
      amount,
    });
    return response.data;
  }

  /**
   * Get cashback balance
   */
  async getCashbackBalance(userId: string): Promise<number> {
    const balance = await this.getBalance(userId);
    return balance.cashbackBalance;
  }

  /**
   * Get active cashback rules
   */
  async getCashbackRules(): Promise<CashbackRule[]> {
    const response = await this.client.get<CashbackRule[]>('/cashback/rules');
    return response.data;
  }

  /**
   * Calculate cashback for an order
   */
  async calculateCashback(orderId: string, orderAmount: number): Promise<{
    eligible: boolean;
    cashbackAmount: number;
    rules: string[];
  }> {
    const response = await this.client.post('/cashback/calculate', {
      orderId,
      orderAmount,
    });
    return response.data;
  }

  /**
   * Withdraw to bank
   */
  async withdrawToBank(
    userId: string,
    amount: number,
    bankAccountId: string
  ): Promise<{ success: boolean; transactionId: string }> {
    const response = await this.client.post(`/wallets/${userId}/withdraw`, {
      amount,
      bankAccountId,
    });
    return response.data;
  }

  /**
   * Add bonus to wallet (admin only)
   */
  async addBonus(
    userId: string,
    amount: number,
    description: string
  ): Promise<Transaction> {
    const response = await this.client.post<Transaction>(`/wallets/${userId}/bonus`, {
      amount,
      description,
    });
    return response.data;
  }

  /**
   * Get ReZ Coins balance
   */
  async getRezCoinsBalance(userId: string): Promise<number> {
    const response = await this.client.get<{ coins: number }>(`/wallets/${userId}/coins`);
    return response.data.coins;
  }

  /**
   * Convert ReZ Coins to cashback
   */
  async convertCoinsToCashback(userId: string, coins: number): Promise<{
    coinsConverted: number;
    cashbackAmount: number;
  }> {
    const response = await this.client.post(`/wallets/${userId}/coins/convert`, {
      coins,
    });
    return response.data;
  }
}

// Singleton instance
let walletClientInstance: RabtulWalletClient | null = null;

export function getRabtulWalletClient(): RabtulWalletClient {
  if (!walletClientInstance) {
    walletClientInstance = new RabtulWalletClient();
  }
  return walletClientInstance;
}
