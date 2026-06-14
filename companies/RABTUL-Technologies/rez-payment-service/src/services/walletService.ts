export interface CreditCoinsParams {
  userId: string;
  amount: number;
  paymentId: string;
  razorpayOrderId: string;
  source: 'payment' | 'refund' | 'bonus' | 'manual';
  description: string;
  metadata?: Record<string, unknown>;
}

export interface WalletBalance {
  userId: string;
  coins: number;
  lastUpdated: Date;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceAfter: number;
  source: string;
  referenceId?: string;
  description: string;
  createdAt: Date;
}

export interface IWalletService {
  creditCoins(params: CreditCoinsParams): Promise<TransactionRecord>;
  debitCoins(
    userId: string,
    amount: number,
    source: string,
    description: string
  ): Promise<TransactionRecord>;
  getBalance(userId: string): Promise<WalletBalance>;
  getTransactionHistory(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<TransactionRecord[]>;
  reverseCoins(
    transactionId: string,
    reason: string
  ): Promise<TransactionRecord>;
}

export class WalletService implements IWalletService {
  async creditCoins(params: CreditCoinsParams): Promise<TransactionRecord> {
    throw new Error('WalletService.creditCoins() must be implemented');
  }

  async debitCoins(
    userId: string,
    amount: number,
    source: string,
    description: string
  ): Promise<TransactionRecord> {
    throw new Error('WalletService.debitCoins() must be implemented');
  }

  async getBalance(userId: string): Promise<WalletBalance> {
    throw new Error('WalletService.getBalance() must be implemented');
  }

  async getTransactionHistory(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<TransactionRecord[]> {
    throw new Error('WalletService.getTransactionHistory() must be implemented');
  }

  async reverseCoins(
    transactionId: string,
    reason: string
  ): Promise<TransactionRecord> {
    throw new Error('WalletService.reverseCoins() must be implemented');
  }
}
