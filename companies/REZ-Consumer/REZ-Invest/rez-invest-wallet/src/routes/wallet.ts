import { Router, Request, Response } from 'express';
import { z } from 'zod';

export const walletRouter = Router();

// Types
interface WalletBalance {
  available: number;
  locked: number;
  total: number;
  currency: string;
}

interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'order' | 'dividend' | 'refund';
  amount: number;
  balance: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference?: string;
  description?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface RABTULBalance {
  coins: number;
  currency: string;
  equivalent: number;
}

// Mock data store
const balances = new Map<string, WalletBalance>();
const transactions = new Map<string, Transaction[]>();

// Initialize mock data
balances.set('user_123', {
  available: 100000,
  locked: 5000,
  total: 105000,
  currency: 'INR',
});

transactions.set('user_123', [
  {
    id: 'txn_001',
    userId: 'user_123',
    type: 'deposit',
    amount: 50000,
    balance: 50000,
    status: 'completed',
    reference: 'UPI/REF123456',
    description: 'Initial deposit via UPI',
    createdAt: new Date('2024-01-01'),
    completedAt: new Date('2024-01-01'),
  },
  {
    id: 'txn_002',
    userId: 'user_123',
    type: 'deposit',
    amount: 55000,
    balance: 105000,
    status: 'completed',
    reference: 'UPI/REF789012',
    description: 'Deposit via UPI',
    createdAt: new Date('2024-01-15'),
    completedAt: new Date('2024-01-15'),
  },
  {
    id: 'txn_003',
    userId: 'user_123',
    type: 'order',
    amount: -5000,
    balance: 100000,
    status: 'completed',
    reference: 'ORD_001',
    description: 'Order: BUY RELIANCE',
    createdAt: new Date('2024-01-20'),
    completedAt: new Date('2024-01-20'),
  },
  {
    id: 'txn_004',
    userId: 'user_123',
    type: 'withdrawal',
    amount: -10000,
    balance: 90000,
    status: 'pending',
    reference: 'WDL/REF345',
    description: 'Withdrawal to Bank Account',
    createdAt: new Date(),
  },
]);

// Validation schemas
const depositSchema = z.object({
  amount: z.number().positive().min(100),
  method: z.enum(['upi', 'netbanking', 'card', 'neft', 'rtgs']),
  reference: z.string().optional(),
});

const withdrawSchema = z.object({
  amount: z.number().positive().min(100),
  method: z.enum(['upi', 'bank']),
  bankAccount: z.string().optional(),
  ifsc: z.string().optional(),
});

const topupSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['rabbit_coins', 'card', 'upi']),
});

// Get wallet balance
walletRouter.get('/balance', (_req: Request, res: Response) => {
  const userId = 'user_123';
  const balance = balances.get(userId);

  if (!balance) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  res.json({
    success: true,
    balance,
  });
});

// Get full balance details with breakdown
walletRouter.get('/balance/detailed', (_req: Request, res: Response) => {
  const userId = 'user_123';
  const balance = balances.get(userId);

  if (!balance) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  // Mock additional breakdown
  const breakdown = {
    available: {
      amount: balance.available,
      description: 'Funds available for trading',
    },
    locked: {
      amount: balance.locked,
      description: 'Funds locked in open orders',
      orders: [
        { orderId: 'ORD_001', symbol: 'TCS', amount: 5000 },
      ],
    },
    pending: {
      amount: 10000,
      description: 'Pending deposits/withdrawals',
    },
    total: balance.total,
  };

  res.json({
    success: true,
    balance: breakdown,
  });
});

// Deposit funds
walletRouter.post('/deposit', async (req: Request, res: Response) => {
  try {
    const userId = 'user_123';
    const data = depositSchema.parse(req.body);

    const transaction: Transaction = {
      id: `txn_${Date.now()}`,
      userId,
      type: 'deposit',
      amount: data.amount,
      balance: 0, // Will be updated
      status: 'pending',
      reference: data.reference || `DEP_${Date.now()}`,
      description: `Deposit via ${data.method.toUpperCase()}`,
      createdAt: new Date(),
    };

    // In production, integrate with payment gateway
    // For now, mark as completed immediately
    transaction.status = 'completed';
    transaction.completedAt = new Date();

    // Update balance
    const balance = balances.get(userId);
    if (balance) {
      balance.available += data.amount;
      balance.total += data.amount;
      transaction.balance = balance.available;
    }

    const userTransactions = transactions.get(userId) || [];
    userTransactions.unshift(transaction);
    transactions.set(userId, userTransactions);

    res.json({
      success: true,
      message: 'Deposit successful',
      transaction,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Withdraw funds
walletRouter.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const userId = 'user_123';
    const data = withdrawSchema.parse(req.body);

    const balance = balances.get(userId);
    if (!balance) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (balance.available < data.amount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        available: balance.available,
        requested: data.amount,
      });
    }

    const transaction: Transaction = {
      id: `txn_${Date.now()}`,
      userId,
      type: 'withdrawal',
      amount: -data.amount,
      balance: 0,
      status: 'pending',
      reference: `WDL_${Date.now()}`,
      description: `Withdrawal to ${data.method.toUpperCase()}`,
      createdAt: new Date(),
    };

    // Update balance
    balance.available -= data.amount;
    balance.total -= data.amount;
    transaction.balance = balance.available;

    const userTransactions = transactions.get(userId) || [];
    userTransactions.unshift(transaction);
    transactions.set(userId, userTransactions);

    res.json({
      success: true,
      message: 'Withdrawal initiated',
      transaction,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction history
walletRouter.get('/transactions', (req: Request, res: Response) => {
  const userId = 'user_123';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const type = req.query.type as string | undefined;

  let userTransactions = transactions.get(userId) || [];

  // Filter by type if provided
  if (type) {
    userTransactions = userTransactions.filter((t) => t.type === type);
  }

  // Paginate
  const start = (page - 1) * limit;
  const paginatedTransactions = userTransactions.slice(start, start + limit);

  // Calculate summary
  const deposits = userTransactions
    .filter((t) => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const withdrawals = userTransactions
    .filter((t) => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  res.json({
    success: true,
    transactions: paginatedTransactions,
    pagination: {
      page,
      limit,
      total: userTransactions.length,
      pages: Math.ceil(userTransactions.length / limit),
    },
    summary: {
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      netFlow: deposits - withdrawals,
    },
  });
});

// Get transaction by ID
walletRouter.get('/transactions/:id', (req: Request, res: Response) => {
  const userId = 'user_123';
  const txnId = req.params.id;

  const userTransactions = transactions.get(userId) || [];
  const transaction = userTransactions.find((t) => t.id === txnId);

  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  res.json({
    success: true,
    transaction,
  });
});

// Get RABTUL wallet balance (RABTUL integration)
walletRouter.get('/rabbit-balance', async (_req: Request, res: Response) => {
  const userId = 'user_123';

  // Mock RABTUL wallet response
  // In production, call RABTUL-Wallet-Service
  const rabbitBalance: RABTULBalance = {
    coins: 50000,
    currency: 'RABBIT',
    equivalent: 5000, // 1 RABBIT = 0.1 INR equivalent
  };

  res.json({
    success: true,
    source: 'RABTUL-Wallet-Service',
    balance: rabbitBalance,
    conversion: {
      rate: 0.1,
      currency: 'INR',
    },
  });
});

// Top up from RABTUL wallet
walletRouter.post('/rabbit-topup', async (req: Request, res: Response) => {
  try {
    const userId = 'user_123';
    const data = topupSchema.parse(req.body);

    if (data.paymentMethod !== 'rabbit_coins') {
      return res.status(400).json({
        error: 'Invalid payment method for RABTUL topup',
      });
    }

    // In production, call RABTUL-Wallet-Service API
    // const response = await fetch(`${process.env.RABTUL_WALLET_URL}/api/deduct`, {
    //   method: 'POST',
    //   body: JSON.stringify({ userId, amount: data.amount })
    // });

    // Mock deduction from RABTUL
    const conversionRate = 0.1; // 1 RABBIT = 0.1 INR
    const convertedAmount = data.amount * conversionRate;

    // Update local balance
    const balance = balances.get(userId);
    if (balance) {
      balance.available += convertedAmount;
      balance.total += convertedAmount;
    }

    // Create transaction record
    const transaction: Transaction = {
      id: `txn_${Date.now()}`,
      userId,
      type: 'deposit',
      amount: convertedAmount,
      balance: balance?.available || 0,
      status: 'completed',
      reference: `RABBIT_TOPUP_${Date.now()}`,
      description: `Top up from RABTUL wallet (${data.amount} RABBIT)`,
      createdAt: new Date(),
      completedAt: new Date(),
    };

    const userTransactions = transactions.get(userId) || [];
    userTransactions.unshift(transaction);
    transactions.set(userId, userTransactions);

    res.json({
      success: true,
      message: 'Top up successful',
      transaction,
      conversion: {
        from: { coins: data.amount, currency: 'RABBIT' },
        to: { amount: convertedAmount, currency: 'INR' },
        rate: conversionRate,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available payment methods
walletRouter.get('/payment-methods', (_req: Request, res: Response) => {
  const methods = {
    deposit: [
      { id: 'upi', name: 'UPI', icon: 'upi', processingTime: 'Instant', minAmount: 100 },
      { id: 'netbanking', name: 'Net Banking', icon: 'bank', processingTime: '1-2 hours', minAmount: 100 },
      { id: 'card', name: 'Debit/Credit Card', icon: 'card', processingTime: 'Instant', minAmount: 100 },
      { id: 'neft', name: 'NEFT', icon: 'bank', processingTime: '2-4 hours', minAmount: 100 },
      { id: 'rtgs', name: 'RTGS', icon: 'bank', processingTime: '1-2 hours', minAmount: 100000 },
      { id: 'rabbit', name: 'RABTUL Wallet', icon: 'rabbit', processingTime: 'Instant', minAmount: 100 },
    ],
    withdrawal: [
      { id: 'upi', name: 'UPI', icon: 'upi', processingTime: '1-2 hours', minAmount: 100 },
      { id: 'bank', name: 'Bank Transfer', icon: 'bank', processingTime: '1-3 days', minAmount: 100 },
    ],
  };

  res.json({
    success: true,
    methods,
  });
});

// Lock/unlock funds (for orders)
walletRouter.post('/lock', async (req: Request, res: Response) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const userId = 'user_123';
    const balance = balances.get(userId);

    if (!balance) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (balance.available < amount) {
      return res.status(400).json({
        error: 'Insufficient available balance',
        available: balance.available,
        requested: amount,
      });
    }

    // Lock funds
    balance.available -= amount;
    balance.locked += amount;

    res.json({
      success: true,
      message: 'Funds locked successfully',
      balance,
      lockDetails: {
        orderId,
        amount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unlock funds
walletRouter.post('/unlock', async (req: Request, res: Response) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const userId = 'user_123';
    const balance = balances.get(userId);

    if (!balance) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (balance.locked < amount) {
      return res.status(400).json({
        error: 'Insufficient locked balance',
        locked: balance.locked,
        requested: amount,
      });
    }

    // Unlock funds
    balance.locked -= amount;
    balance.available += amount;

    res.json({
      success: true,
      message: 'Funds unlocked successfully',
      balance,
      unlockDetails: {
        orderId,
        amount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
