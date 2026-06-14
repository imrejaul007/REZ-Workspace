/**
 * REZ Unified Loyalty Service
 *
 * Central loyalty management with coin economy and tier system
 * Port: 4015
 *
 * Features:
 * - Coin types: REZ, Prive, Branded, Promo, Cashback, Referral
 * - Loyalty tiers: Bronze, Silver, Gold, Platinum
 * - Cross-merchant loyalty
 * - Wallet integration
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { CoinRegistry } from './services/coinRegistry';
import { TierEngine } from './services/tierEngine';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const PORT = parseInt(process.env.PORT || '4015', 10);

// Initialize services
const coinRegistry = new CoinRegistry();
const tierEngine = new TierEngine();

// Types
interface LoyaltyUser {
  id: string;
  user_id: string;
  tier: string;
  lifetime_spend: number;
  points_balance: number;
  coins: Record<string, number>;
  referral_code?: string;
  referred_by?: string;
  joined_at: string;
  last_activity: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: 'earn' | 'redeem' | 'transfer' | 'expire';
  coin_type: string;
  amount: number;
  source: string;
  merchant_id?: string;
  order_id?: string;
  created_at: string;
}

// In-memory storage
const users = new Map<string, LoyaltyUser>();
const transactions = new Map<string, Transaction[]>();

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-unified-loyalty',
    version: '1.0.0',
    users_count: users.size,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// USER MANAGEMENT
// ============================================

// Get or create user
app.post('/api/users', (req: Request, res: Response) => {
  try {
    const { user_id, referral_code, referred_by } = req.body;

    if (!user_id) {
      res.status(400).json({ error: 'Missing required field: user_id' });
      return;
    }

    // Check if user exists
    const existingUser = Array.from(users.values()).find(u => u.user_id === user_id);
    if (existingUser) {
      res.json({ success: true, user: existingUser, created: false });
      return;
    }

    // Create new user
    const user: LoyaltyUser = {
      id: uuidv4(),
      user_id,
      tier: 'bronze',
      lifetime_spend: 0,
      points_balance: 0,
      coins: {
        rez: 0,
        prive: 0,
        branded: 0,
        promo: 0,
        cashback: 0,
        referral: 0
      },
      referral_code: referral_code || `REF${Date.now().toString(36).toUpperCase()}`,
      referred_by: referred_by,
      joined_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };

    users.set(user.id, user);
    transactions.set(user.id, []);

    res.json({ success: true, user, created: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get user
app.get('/api/users/:userId', (req: Request, res: Response) => {
  const user = Array.from(users.values()).find(u => u.user_id === req.params.userId);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
});

// Update user spend
app.post('/api/users/:userId/spend', (req: Request, res: Response) => {
  const user = Array.from(users.values()).find(u => u.user_id === req.params.userId);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { amount } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Missing or invalid field: amount' });
    return;
  }

  user.lifetime_spend += amount;
  user.last_activity = new Date().toISOString();

  // Check for tier upgrade
  const newTier = tierEngine.getTierForSpend(user.lifetime_spend);
  const tierChanged = user.tier !== newTier;
  if (tierChanged) {
    user.tier = newTier;
  }

  users.set(user.id, user);

  res.json({
    success: true,
    user,
    tier_changed: tierChanged,
    points_earned: Math.floor(amount * 0.01) // 1% back
  });
});

// ============================================
// COIN OPERATIONS
// ============================================

// Earn coins
app.post('/api/coins/earn', (req: Request, res: Response) => {
  try {
    const { user_id, coin_type, amount, source, merchant_id, order_id } = req.body;

    if (!user_id || !coin_type || !amount || !source) {
      res.status(400).json({ error: 'Missing required fields: user_id, coin_type, amount, source' });
      return;
    }

    let user = Array.from(users.values()).find(u => u.user_id === user_id);
    if (!user) {
      // Auto-create user
      user = {
        id: uuidv4(),
        user_id,
        tier: 'bronze',
        lifetime_spend: 0,
        points_balance: 0,
        coins: { rez: 0, prive: 0, branded: 0, promo: 0, cashback: 0, referral: 0 },
        referral_code: `REF${Date.now().toString(36).toUpperCase()}`,
        joined_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      };
      users.set(user.id, user);
      transactions.set(user.id, []);
    }

    // Apply tier multiplier
    const multiplier = tierEngine.getEarningMultiplier(user.tier, coin_type);
    const finalAmount = Math.floor(amount * multiplier);

    // Update balance
    if (!user.coins[coin_type]) {
      user.coins[coin_type] = 0;
    }
    user.coins[coin_type] += finalAmount;
    user.points_balance += finalAmount;
    user.last_activity = new Date().toISOString();

    // Record transaction
    const transaction: Transaction = {
      id: uuidv4(),
      user_id,
      type: 'earn',
      coin_type,
      amount: finalAmount,
      source,
      merchant_id,
      order_id,
      created_at: new Date().toISOString()
    };

    const userTransactions = transactions.get(user.id) || [];
    userTransactions.push(transaction);
    transactions.set(user.id, userTransactions);

    users.set(user.id, user);

    res.json({
      success: true,
      coins_earned: finalAmount,
      multiplier_applied: multiplier,
      new_balance: user.coins[coin_type],
      transaction_id: transaction.id
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Redeem coins
app.post('/api/coins/redeem', (req: Request, res: Response) => {
  try {
    const { user_id, coin_type, amount, destination, order_id } = req.body;

    if (!user_id || !coin_type || !amount) {
      res.status(400).json({ error: 'Missing required fields: user_id, coin_type, amount' });
      return;
    }

    const user = Array.from(users.values()).find(u => u.user_id === user_id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const balance = user.coins[coin_type] || 0;

    if (balance < amount) {
      res.status(400).json({
        error: 'Insufficient balance',
        available: balance,
        requested: amount
      });
      return;
    }

    // Check if coin type is redeemable
    const redeemResult = coinRegistry.isRedeemable(coin_type, user.tier);
    if (!redeemResult.can_redeem) {
      res.status(400).json({ error: redeemResult.reason });
      return;
    }

    // Deduct coins
    user.coins[coin_type] -= amount;
    user.points_balance -= amount;
    user.last_activity = new Date().toISOString();

    // Record transaction
    const transaction: Transaction = {
      id: uuidv4(),
      user_id,
      type: 'redeem',
      coin_type,
      amount,
      source: destination || 'redemption',
      order_id,
      created_at: new Date().toISOString()
    };

    const userTransactions = transactions.get(user.id) || [];
    userTransactions.push(transaction);
    transactions.set(user.id, userTransactions);

    users.set(user.id, user);

    res.json({
      success: true,
      coins_redeemed: amount,
      new_balance: user.coins[coin_type],
      transaction_id: transaction.id,
      value_in_currency: coinRegistry.toCurrency(coin_type, amount)
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Transfer coins
app.post('/api/coins/transfer', (req: Request, res: Response) => {
  try {
    const { from_user_id, to_user_id, coin_type, amount } = req.body;

    if (!from_user_id || !to_user_id || !coin_type || !amount) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const fromUser = Array.from(users.values()).find(u => u.user_id === from_user_id);
    const toUser = Array.from(users.values()).find(u => u.user_id === to_user_id);

    if (!fromUser || !toUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if ((fromUser.coins[coin_type] || 0) < amount) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    // Deduct from sender
    fromUser.coins[coin_type] -= amount;
    fromUser.points_balance -= amount;

    // Add to recipient
    toUser.coins[coin_type] = (toUser.coins[coin_type] || 0) + amount;
    toUser.points_balance += amount;

    // Record transactions
    const deductionTx: Transaction = {
      id: uuidv4(),
      user_id: from_user_id,
      type: 'transfer',
      coin_type,
      amount: -amount,
      source: `transfer_to:${to_user_id}`,
      created_at: new Date().toISOString()
    };

    const creditTx: Transaction = {
      id: uuidv4(),
      user_id: to_user_id,
      type: 'transfer',
      coin_type,
      amount,
      source: `transfer_from:${from_user_id}`,
      created_at: new Date().toISOString()
    };

    transactions.get(fromUser.id)?.push(deductionTx);
    transactions.get(toUser.id)?.push(creditTx);

    users.set(fromUser.id, fromUser);
    users.set(toUser.id, toUser);

    res.json({
      success: true,
      from_balance: fromUser.coins[coin_type],
      to_balance: toUser.coins[coin_type]
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get coin balance
app.get('/api/users/:userId/coins', (req: Request, res: Response) => {
  const user = Array.from(users.values()).find(u => u.user_id === req.params.userId);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user_id: user.user_id,
    total_points: user.points_balance,
    coins: user.coins,
    tier: user.tier
  });
});

// ============================================
// TIER MANAGEMENT
// ============================================

// Get tier info
app.get('/api/tiers', (req: Request, res: Response) => {
  res.json({ tiers: tierEngine.getAllTiers() });
});

app.get('/api/tiers/:tier', (req: Request, res: Response) => {
  const tier = tierEngine.getTierInfo(req.params.tier.toLowerCase());

  if (!tier) {
    res.status(404).json({ error: 'Tier not found' });
    return;
  }

  res.json({ tier });
});

// Check tier benefits
app.post('/api/users/:userId/tier/benefits', (req: Request, res: Response) => {
  const user = Array.from(users.values()).find(u => u.user_id === req.params.userId);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user_tier: user.tier,
    benefits: tierEngine.getTierBenefits(user.tier),
    next_tier: tierEngine.getNextTier(user.tier),
    spend_to_next: tierEngine.getSpendToNextTier(user.lifetime_spend)
  });
});

// ============================================
// REFERRAL MANAGEMENT
// ============================================

// Get referral info
app.get('/api/users/:userId/referral', (req: Request, res: Response) => {
  const user = Array.from(users.values()).find(u => u.user_id === req.params.userId);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Count referrals
  const referrals = Array.from(users.values()).filter(u => u.referred_by === user.referral_code);
  const totalEarned = referrals.reduce((sum, r) => sum + (r.coins.referral || 0), 0);

  res.json({
    referral_code: user.referral_code,
    referral_count: referrals.length,
    referral_earnings: totalEarned,
    referral_rate: tierEngine.getReferralBonus(user.tier)
  });
});

// ============================================
// TRANSACTION HISTORY
// ============================================

app.get('/api/users/:userId/transactions', (req: Request, res: Response) => {
  const user = Array.from(users.values()).find(u => u.user_id === req.params.userId);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const userTransactions = transactions.get(user.id) || [];
  const { type, coin_type, limit = 50 } = req.query;

  let result = userTransactions;

  if (type) result = result.filter(t => t.type === type);
  if (coin_type) result = result.filter(t => t.coin_type === coin_type);

  result = result.slice(-(parseInt(limit as string)));

  res.json({
    transactions: result,
    count: result.length,
    total_points: user.points_balance
  });
});

// ============================================
// COIN TYPES INFO
// ============================================

app.get('/api/coin-types', (req: Request, res: Response) => {
  res.json({
    coin_types: coinRegistry.getAllCoinTypes()
  });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Loyalty Error]', err);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`REZ Unified Loyalty - Port ${PORT}`);
  console.log(`  → Users: POST /api/users`);
  console.log(`  → Earn: POST /api/coins/earn`);
  console.log(`  → Redeem: POST /api/coins/redeem`);
  console.log(`  → Transfer: POST /api/coins/transfer`);
  console.log(`  → Tiers: GET /api/tiers`);
  console.log(`  → Referrals: GET /api/users/:id/referral`);
});

export default app;
