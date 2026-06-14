/**
 * Wallet Service Tests
 * Tests wallet operations, balance management, and transactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Wallet Types
interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
  updatedAt: Date;
}

interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description?: string;
  balanceBefore: number;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

// Mock Redis operations
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  setEx: vi.fn(),
  incr: vi.fn(),
  decr: vi.fn()
};

vi.mock('../config/redis', () => ({
  redis: mockRedis
}));

// Wallet Service Logic (for testing)
function validateBalanceOperation(
  currentBalance: number,
  amount: number,
  operation: 'credit' | 'debit'
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be positive' };
  }
  if (operation === 'debit' && amount > currentBalance) {
    return { valid: false, error: 'Insufficient balance' };
  }
  return { valid: true };
}

function calculateNewBalance(
  currentBalance: number,
  amount: number,
  operation: 'credit' | 'debit'
): number {
  if (operation === 'credit') {
    return currentBalance + amount;
  }
  return currentBalance - amount;
}

function createTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createWalletKey(userId: string, currency: string = 'INR'): string {
  return `wallet:${currency}:${userId}`;
}

describe('Balance Operations', () => {
  describe('Credit Operations', () => {
    it('should credit positive amount', () => {
      const result = validateBalanceOperation(1000, 500, 'credit');
      expect(result.valid).toBe(true);
    });

    it('should calculate new balance after credit', () => {
      const newBalance = calculateNewBalance(1000, 500, 'credit');
      expect(newBalance).toBe(1500);
    });

    it('should credit to zero balance', () => {
      const result = validateBalanceOperation(0, 100, 'credit');
      expect(result.valid).toBe(true);
    });

    it('should credit large amounts', () => {
      const result = validateBalanceOperation(10000, 50000, 'credit');
      expect(result.valid).toBe(true);
      const newBalance = calculateNewBalance(10000, 50000, 'credit');
      expect(newBalance).toBe(60000);
    });
  });

  describe('Debit Operations', () => {
    it('should debit when sufficient balance', () => {
      const result = validateBalanceOperation(1000, 500, 'debit');
      expect(result.valid).toBe(true);
    });

    it('should calculate new balance after debit', () => {
      const newBalance = calculateNewBalance(1000, 500, 'debit');
      expect(newBalance).toBe(500);
    });

    it('should debit exact balance', () => {
      const result = validateBalanceOperation(500, 500, 'debit');
      expect(result.valid).toBe(true);
      const newBalance = calculateNewBalance(500, 500, 'debit');
      expect(newBalance).toBe(0);
    });

    it('should reject debit when insufficient balance', () => {
      const result = validateBalanceOperation(100, 500, 'debit');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Insufficient balance');
    });
  });

  describe('Invalid Operations', () => {
    it('should reject zero amount', () => {
      expect(validateBalanceOperation(1000, 0, 'credit').valid).toBe(false);
      expect(validateBalanceOperation(1000, 0, 'debit').valid).toBe(false);
    });

    it('should reject negative amount', () => {
      expect(validateBalanceOperation(1000, -100, 'credit').valid).toBe(false);
      expect(validateBalanceOperation(1000, -100, 'debit').valid).toBe(false);
    });
  });
});

describe('Transaction Creation', () => {
  it('should generate unique transaction ID', () => {
    const id1 = createTransactionId();
    const id2 = createTransactionId();
    expect(id1).not.toBe(id2);
    expect(id1.startsWith('txn_')).toBe(true);
  });

  it('should create transaction with correct structure', () => {
    const transaction: Transaction = {
      id: createTransactionId(),
      userId: 'user-123',
      type: 'credit',
      amount: 500,
      currency: 'INR',
      description: 'Wallet top-up',
      balanceBefore: 1000,
      balanceAfter: 1500,
      status: 'completed',
      createdAt: new Date()
    };

    expect(transaction.id).toBeDefined();
    expect(transaction.userId).toBe('user-123');
    expect(transaction.type).toBe('credit');
    expect(transaction.amount).toBe(500);
    expect(transaction.balanceAfter - transaction.balanceBefore).toBe(transaction.amount);
  });

  it('should maintain balance integrity', () => {
    const transaction: Transaction = {
      id: createTransactionId(),
      userId: 'user-123',
      type: 'debit',
      amount: 300,
      currency: 'INR',
      balanceBefore: 1000,
      balanceAfter: 700,
      status: 'completed',
      createdAt: new Date()
    };

    expect(transaction.balanceAfter).toBe(transaction.balanceBefore - transaction.amount);
  });
});

describe('Wallet Key Generation', () => {
  it('should create correct key for INR wallet', () => {
    const key = createWalletKey('user-123');
    expect(key).toBe('wallet:INR:user-123');
  });

  it('should create correct key for USD wallet', () => {
    const key = createWalletKey('user-123', 'USD');
    expect(key).toBe('wallet:USD:user-123');
  });

  it('should handle special characters in userId', () => {
    const key = createWalletKey('user_123_test');
    expect(key).toBe('wallet:INR:user_123_test');
  });
});

describe('Balance Validation', () => {
  function validateBalance(balance: number): { valid: boolean; error?: string } {
    if (typeof balance !== 'number') {
      return { valid: false, error: 'Balance must be a number' };
    }
    if (balance < 0) {
      return { valid: false, error: 'Balance cannot be negative' };
    }
    if (!Number.isFinite(balance)) {
      return { valid: false, error: 'Balance must be finite' };
    }
    // Balance should be in cents/paise to avoid floating point issues
    if (balance % 1 !== 0) {
      return { valid: false, error: 'Balance should be in smallest currency unit' };
    }
    return { valid: true };
  }

  it('should accept valid balance', () => {
    expect(validateBalance(0).valid).toBe(true);
    expect(validateBalance(100).valid).toBe(true);
    expect(validateBalance(1000000).valid).toBe(true);
  });

  it('should reject negative balance', () => {
    const result = validateBalance(-100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Balance cannot be negative');
  });

  it('should reject non-numeric balance', () => {
    const result = validateBalance(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Balance must be a number');
  });

  it('should reject infinity', () => {
    expect(validateBalance(Infinity).valid).toBe(false);
    expect(validateBalance(-Infinity).valid).toBe(false);
  });

  it('should reject floating point values', () => {
    const result = validateBalance(100.50);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Balance should be in smallest currency unit');
  });
});

describe('Currency Handling', () => {
  const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

  it('should support INR', () => {
    expect(SUPPORTED_CURRENCIES).toContain('INR');
  });

  it('should support multiple currencies', () => {
    expect(SUPPORTED_CURRENCIES.length).toBeGreaterThanOrEqual(4);
  });

  it('should validate currency code', () => {
    const isValidCurrency = (code: string) => SUPPORTED_CURRENCIES.includes(code);

    expect(isValidCurrency('INR')).toBe(true);
    expect(isValidCurrency('USD')).toBe(true);
    expect(isValidCurrency('ABC')).toBe(false);
    expect(isValidCurrency('inr')).toBe(false); // case sensitive
  });
});

describe('Transaction History', () => {
  interface TransactionFilter {
    userId: string;
    type?: 'credit' | 'debit';
    status?: 'completed' | 'pending' | 'failed';
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }

  function filterTransactions(
    transactions: Transaction[],
    filter: TransactionFilter
  ): Transaction[] {
    let filtered = transactions.filter(t => t.userId === filter.userId);

    if (filter.type) {
      filtered = filtered.filter(t => t.type === filter.type);
    }

    if (filter.status) {
      filtered = filtered.filter(t => t.status === filter.status);
    }

    if (filter.fromDate) {
      filtered = filtered.filter(t => t.createdAt >= filter.fromDate!);
    }

    if (filter.toDate) {
      filtered = filtered.filter(t => t.createdAt <= filter.toDate!);
    }

    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  const mockTransactions: Transaction[] = [
    { id: '1', userId: 'user-1', type: 'credit', amount: 1000, currency: 'INR', balanceBefore: 0, balanceAfter: 1000, status: 'completed', createdAt: new Date('2024-01-01') },
    { id: '2', userId: 'user-1', type: 'debit', amount: 300, currency: 'INR', balanceBefore: 1000, balanceAfter: 700, status: 'completed', createdAt: new Date('2024-01-02') },
    { id: '3', userId: 'user-1', type: 'credit', amount: 500, currency: 'INR', balanceBefore: 700, balanceAfter: 1200, status: 'pending', createdAt: new Date('2024-01-03') },
    { id: '4', userId: 'user-2', type: 'credit', amount: 200, currency: 'INR', balanceBefore: 0, balanceAfter: 200, status: 'completed', createdAt: new Date('2024-01-01') },
  ];

  it('should filter by userId', () => {
    const result = filterTransactions(mockTransactions, { userId: 'user-1' });
    expect(result.length).toBe(3);
    expect(result.every(t => t.userId === 'user-1')).toBe(true);
  });

  it('should filter by type', () => {
    const result = filterTransactions(mockTransactions, { userId: 'user-1', type: 'credit' });
    expect(result.length).toBe(2);
    expect(result.every(t => t.type === 'credit')).toBe(true);
  });

  it('should filter by status', () => {
    const result = filterTransactions(mockTransactions, { userId: 'user-1', status: 'pending' });
    expect(result.length).toBe(1);
    expect(result[0].status).toBe('pending');
  });

  it('should apply limit', () => {
    const result = filterTransactions(mockTransactions, { userId: 'user-1', limit: 2 });
    expect(result.length).toBe(2);
  });

  it('should filter by date range', () => {
    const result = filterTransactions(mockTransactions, {
      userId: 'user-1',
      fromDate: new Date('2024-01-02'),
      toDate: new Date('2024-01-02')
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('2');
  });
});

describe('Minimum Balance', () => {
  const MINIMUM_BALANCE = 0; // No minimum for wallet

  function canDebit(currentBalance: number, amount: number): boolean {
    return (currentBalance - amount) >= MINIMUM_BALANCE;
  }

  it('should allow debit maintaining minimum balance', () => {
    expect(canDebit(1000, 500)).toBe(true);
    expect(canDebit(1000, 1000)).toBe(true);
  });

  it('should reject debit below minimum', () => {
    expect(canDebit(100, 200)).toBe(false);
  });
});

describe('Maximum Transaction Limit', () => {
  const MAX_TRANSACTION_AMOUNT = 1000000; // 10 lakhs

  function validateTransactionAmount(amount: number): { valid: boolean; error?: string } {
    if (amount <= 0) {
      return { valid: false, error: 'Amount must be positive' };
    }
    if (amount > MAX_TRANSACTION_AMOUNT) {
      return { valid: false, error: 'Amount exceeds maximum transaction limit' };
    }
    return { valid: true };
  }

  it('should accept valid transaction amount', () => {
    expect(validateTransactionAmount(1000).valid).toBe(true);
    expect(validateTransactionAmount(MAX_TRANSACTION_AMOUNT).valid).toBe(true);
  });

  it('should reject amount exceeding limit', () => {
    const result = validateTransactionAmount(MAX_TRANSACTION_AMOUNT + 1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount exceeds maximum transaction limit');
  });
});
