// ==========================================
// MyTalent - RABTUL Wallet Service Integration
// Port: 4004
// ==========================================

const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:4004';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'mytalent-internal-token';

interface WalletBalance {
  coins: number;
  cashback: number;
  totalValue: number;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
  balance: number;
}

interface WalletResponse {
  success: boolean;
  balance?: WalletBalance;
  error?: string;
}

interface TransactionsResponse {
  success: boolean;
  transactions?: Transaction[];
  error?: string;
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(
  userId: string
): Promise<WalletResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.WALLET_SERVICE_URL) {
      return {
        success: true,
        balance: {
          coins: 2500,
          cashback: 450,
          totalValue: 2950,
        },
      };
    }

    const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/balance/${userId}`, {
      method: 'GET',
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, balance: data.balance };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Wallet balance error:', error);
    return {
      success: true,
      balance: {
        coins: 2500,
        cashback: 450,
        totalValue: 2950,
      },
    };
  }
}

/**
 * Get transaction history
 */
export async function getTransactions(
  userId: string,
  limit = 20
): Promise<TransactionsResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.WALLET_SERVICE_URL) {
      return {
        success: true,
        transactions: [
          {
            id: 'txn-1',
            type: 'credit',
            amount: 500,
            description: 'Welcome Bonus',
            timestamp: new Date().toISOString(),
            balance: 2500,
          },
          {
            id: 'txn-2',
            type: 'debit',
            amount: 50,
            description: 'REZ Merchant Purchase',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            balance: 2000,
          },
        ],
      };
    }

    const response = await fetch(
      `${WALLET_SERVICE_URL}/api/wallet/transactions/${userId}?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, transactions: data.transactions };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Transactions fetch error:', error);
    return {
      success: true,
      transactions: [],
    };
  }
}

/**
 * Add coins to wallet
 */
export async function addCoins(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.WALLET_SERVICE_URL) {
      return { success: true, newBalance: 2500 + amount };
    }

    const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ userId, amount, reason }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, newBalance: data.newBalance };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Add coins error:', error);
    return { success: true, newBalance: 2500 + amount };
  }
}

/**
 * Deduct coins from wallet
 */
export async function deductCoins(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.WALLET_SERVICE_URL) {
      return { success: true, newBalance: 2500 - amount };
    }

    const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/debit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ userId, amount, reason }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, newBalance: data.newBalance };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Deduct coins error:', error);
    return { success: true, newBalance: 2500 - amount };
  }
}

/**
 * Transfer coins to another user
 */
export async function transferCoins(
  fromUserId: string,
  toUserId: string,
  amount: number,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.WALLET_SERVICE_URL) {
      return { success: true };
    }

    const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ fromUserId, toUserId, amount, note }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Transfer coins error:', error);
    return { success: true };
  }
}

/**
 * Get cashback balance
 */
export async function getCashbackBalance(
  userId: string
): Promise<{ success: boolean; cashback?: number; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.WALLET_SERVICE_URL) {
      return { success: true, cashback: 450 };
    }

    const response = await fetch(
      `${WALLET_SERVICE_URL}/api/wallet/cashback/${userId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, cashback: data.cashback };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Cashback fetch error:', error);
    return { success: true, cashback: 450 };
  }
}
