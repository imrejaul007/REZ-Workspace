/**
 * Cross-Wallet Identity - UNIFIED WALLET ACROSS PLATFORMS
 * One balance for points + cash + crypto + giftcards
 */

export interface CrossWalletIdentity {
  user_id: string;

  // All wallets
  wallets: Wallet[];

  // Aggregated balance
  total_balance: TotalBalance;

  // Transactions
  transactions: TransactionSummary;

  // Cross-platform links
  linked_accounts: LinkedAccount[];
}

export interface Wallet {
  wallet_id: string;
  type: 'points' | 'cash' | 'crypto' | 'giftcard';
  provider: string;
  balance: number;
  currency: string;
  linked: boolean;
  created_at: string;
  last_transaction: string;
}

export interface TotalBalance {
  points: number;
  cash_usd: number;
  crypto_usd: number;
  giftcards_usd: number;
  total_usd: number;
}

export interface TransactionSummary {
  total_count: number;
  total_volume_usd: number;
  by_wallet_type: Record<string, number>;
  by_category: Record<string, number>;
  last_30_days: Transaction[];
}

export interface Transaction {
  transaction_id: string;
  wallet_id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  usd_value: number;
  merchant_id?: string;
  order_id?: string;
  created_at: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface LinkedAccount {
  platform: string;
  user_id: string;
  wallet_address?: string;
  linked_at: string;
  verified: boolean;
}
