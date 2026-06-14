/**
 * REZ POS Loyalty Integration Service
 *
 * Connects ALL POS systems to unified loyalty:
 * - NexTaBizz (Merchant OS)
 * - KDS (Kitchen Display System)
 * - REZ NOW (Quick Commerce)
 * - Restaurant POS
 *
 * Flow:
 * POS Sale → Calculate coins → Award coins → Update tier → Send notification
 */

import express, { Request, Response } from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';

const app = express();
const PORT = parseInt(process.env.PORT || '4095', 10);

app.use(express.json());

// ============================================
// SERVICE URLs
// ============================================

const SERVICES = {
  loyalty: process.env.LOYALTY_URL || 'http://localhost:4097',
  wallet: process.env.WALLET_URL || 'http://localhost:4004',
  ecosystem: process.env.ECOSYSTEM_URL || 'http://localhost:4105',
  karma: process.env.KARMA_URL || 'http://localhost:3009',
  notifications: process.env.NOTIFICATIONS_URL || 'http://localhost:4011',
};

// ============================================
// TYPES
// ============================================

interface POS Sale {
  posType: 'nextabizz' | 'kds' | 'reznow' | 'restaurant' | 'generic';
  merchantId: string;
  userId?: string;
  orderId: string;
  amount: number;
  items: POSItem[];
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet';
  customerPhone?: string;
  timestamp: Date;
}

interface POSItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}

interface LoyaltyReward {
  coinsEarned: number;
  tierMultiplier: number;
  bonusCoins: number;
  newTier?: string;
}

interface MerchantConfig {
  merchantId: string;
  name: string;
  earningRate: number;
  tierEnabled: boolean;
  tierBenefits: Record<string, { extraEarning: number; freeDelivery: boolean };
  notificationsEnabled: boolean;
}

// In-memory stores
const merchantConfigs = new Map<string, MerchantConfig>();
const transactions = new Map<string, POSSale[]>();

// Default earning rate: 1 coin per ₹1
const DEFAULT_EARNING_RATE = 1;

// ============================================
// TIER MULTIPLIERS
// ============================================

const TIER_MULTIPLIERS: Record<string, number> = {
  BRONZE: 1.0,
  SILVER: 1.25,
  GOLD: 1.5,
  PLATINUM: 2.0,
};

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Calculate loyalty reward for a sale
 */
async function calculateReward(sale: POSSale): Promise<LoyaltyReward> {
  // Get merchant config
  const config = merchantConfigs.get(sale.merchantId) || {
    merchantId: sale.merchantId,
    earningRate: DEFAULT_EARNING_RATE,
    tierEnabled: true,
  };

  // Base coins = amount × earning rate
  const baseCoins = Math.floor(sale.amount * config.earningRate);

  // Get user tier (mock - would call loyalty service)
  const userTier = await getUserTier(sale.userId || sale.customerPhone || 'unknown');

  // Apply tier multiplier
  const tierMultiplier = TIER_MULTIPLIERS[userTier] || 1.0;

  // Calculate coins
  let coinsEarned = Math.floor(baseCoins * tierMultiplier);

  // Bonus for digital payment
  let bonusCoins = 0;
  if (sale.paymentMethod === 'upi') {
    bonusCoins = Math.floor(coinsEarned * 0.1); // 10% bonus for UPI
  }

  // Bonus for first purchase
  const isFirstPurchase = await isFirstPurchaseAtMerchant(sale.userId || sale.customerPhone || '', sale.merchantId);
  if (isFirstPurchase) {
    bonusCoins += 50; // 50 coin welcome bonus
  }

  // Calculate new tier
  const lifetimeCoins = await getLifetimeCoins(sale.userId || sale.customerPhone || '');
  const newTier = calculateNewTier(lifetimeCoins + coinsEarned);

  return {
    coinsEarned: coinsEarned + bonusCoins,
    tierMultiplier,
    bonusCoins,
    newTier: newTier !== userTier ? newTier : undefined,
  };
}

function calculateNewTier(lifetimeCoins: number): string {
  if (lifetimeCoins >= 50000) return 'PLATINUM';
  if (lifetimeCoins >= 20000) return 'GOLD';
  if (lifetimeCoins >= 5000) return 'SILVER';
  return 'BRONZE';
}

async function getUserTier(userId: string): Promise<string> {
  try {
    const response = await fetch(`${SERVICES.loyalty}/api/tier/${userId}`, { timeout: 5000 });
    const data = await response.json();
    return data.currentTier || 'BRONZE';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[POSLoyalty] getUserTier failed for ${userId}: ${errorMessage}`);
    return 'BRONZE';
  }
}

async function getLifetimeCoins(userId: string): Promise<number> {
  try {
    const response = await fetch(`${SERVICES.loyalty}/api/balance/${userId}`, { timeout: 5000 });
    const data = await response.json();
    return data.lifetimeEarned || 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[POSLoyalty] getLifetimeCoins failed for ${userId}: ${errorMessage}`);
    return 0;
  }
}

async function isFirstPurchaseAtMerchant(userId: string, merchantId: string): Promise<boolean> {
  const key = `${userId}_${merchantId}`;
  const purchases = transactions.get(key) || [];
  return purchases.length === 0;
}

async function awardCoins(userId: string, coins: number, merchantId: string, orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Send to loyalty service
    const [loyaltyRes, ecosystemRes] = await Promise.allSettled([
      fetch(`${SERVICES.loyalty}/api/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: coins,
          source: 'POS_PURCHASE',
          description: `Purchase at merchant ${merchantId}`,
          referenceId: orderId,
        }),
        timeout: 5000,
      }),
      fetch(`${SERVICES.ecosystem}/api/v1/signals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          source: 'POS',
          action: 'purchase',
          data: {
            merchantId,
            orderId,
            coins,
          },
        }),
        timeout: 5000,
      }),
    ]);

    const loyaltyOk = loyaltyRes.status === 'fulfilled' && loyaltyRes.value.ok;
    const ecosystemOk = ecosystemRes.status === 'fulfilled' && ecosystemRes.value.ok;

    if (!loyaltyOk) {
      const error = loyaltyRes.status === 'rejected' ? loyaltyRes.reason : 'Loyalty service returned error';
      console.error(`[POSLoyalty] awardCoins failed: ${error}`);
      return { success: false, error: String(error) };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[POSLoyalty] awardCoins failed for ${userId}: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

async function sendNotification(userId: string, message: string): Promise<void> {
  try {
    await fetch(`${SERVICES.notifications}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        type: 'loyalty',
        message,
      }),
      timeout: 5000,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[POSLoyalty] sendNotification failed for ${userId}: ${errorMessage}`);
  }
}

// ============================================
// API ENDPOINTS
// ============================================

// Health
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'pos-loyalty-integration',
    version: '1.0.0',
    connectedServices: Object.keys(SERVICES),
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// POS SALE ENDPOINT
// ============================================

/**
 * Process a POS sale and award loyalty coins
 */
app.post('/api/v1/pos/sale', async (req: Request, res: Response) => {
  const sale: POSSale = req.body;

  // Validate
  if (!sale.merchantId || !sale.orderId || !sale.amount) {
    return res.status(400).json({
      error: 'merchantId, orderId, and amount required',
    });
  }

  // Get user ID
  const userId = sale.userId || sale.customerPhone;
  if (!userId) {
    return res.status(400).json({
      error: 'userId or customerPhone required',
    });
  }

  // Calculate reward
  const reward = await calculateReward(sale);

  // Award coins
  await awardCoins(userId, reward.coinsEarned, sale.merchantId, sale.orderId);

  // Store transaction
  const key = `${userId}_${sale.merchantId}`;
  const purchases = transactions.get(key) || [];
  purchases.push({ ...sale, ...reward });
  transactions.set(key, purchases);

  // Send notification
  const tierMsg = reward.newTier ? ` You've reached ${reward.newTier} tier!` : '';
  await sendNotification(
    userId,
    `You earned ${reward.coinsEarned} REZ Coins!${tierMsg}`
  );

  res.json({
    success: true,
    orderId: sale.orderId,
    coinsEarned: reward.coinsEarned,
    bonusCoins: reward.bonusCoins,
    tier: reward.newTier || 'unchanged',
    message: `Earned ${reward.coinsEarned} REZ Coins!`,
  });
});

// ============================================
// QR SCAN ENDPOINT
// ============================================

/**
 * Process QR scan for check-in bonus
 */
app.post('/api/v1/pos/scan', async (req: Request, res: Response) => {
  const { userId, merchantId, scanType } = req.body;

  if (!userId || !merchantId) {
    return res.status(400).json({
      error: 'userId and merchantId required',
    });
  }

  // Scan bonuses by type
  const scanBonuses: Record<string, number> = {
    checkin: 10,
    menu: 5,
    review: 25,
    referral: 50,
  };

  const coins = scanBonuses[scanType] || 10;

  // Award coins
  await awardCoins(userId, coins, merchantId, `scan_${Date.now()}`);

  // Update karma score
  await fetch(`${SERVICES.karma}/api/karma/earn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      action: scanType === 'checkin' ? 'qr_scan' : 'engagement',
      points: coins,
    }),
  });

  res.json({
    success: true,
    coinsEarned: coins,
    message: `Earned ${coins} coins for ${scanType}!`,
  });
});

// ============================================
// MERCHANT CONFIG ENDPOINT
// ============================================

/**
 * Get merchant loyalty config
 */
app.get('/api/v1/merchant/:merchantId/config', (req: Request, res: Response) => {
  const config = merchantConfigs.get(req.params.merchantId) || {
    merchantId: req.params.merchantId,
    earningRate: DEFAULT_EARNING_RATE,
    tierEnabled: true,
    tierBenefits: {},
    notificationsEnabled: true,
  };

  res.json({ config });
});

/**
 * Update merchant loyalty config
 */
app.put('/api/v1/merchant/:merchantId/config', (req: Request, res: Response) => {
  const config: MerchantConfig = {
    merchantId: req.params.merchantId,
    ...req.body,
  };

  merchantConfigs.set(req.params.merchantId, config);

  res.json({ success: true, config });
});

// ============================================
// REDEMPTION ENDPOINT
// ============================================

/**
 * Redeem coins at POS
 */
app.post('/api/v1/pos/redeem', async (req: Request, res: Response) => {
  const { userId, merchantId, orderId, coinsToRedeem } = req.body;

  if (!userId || !merchantId || coinsToRedeem === undefined) {
    return res.status(400).json({
      error: 'userId, merchantId, and coinsToRedeem required',
    });
  }

  // Get merchant config for discount rate
  const config = merchantConfigs.get(merchantId) || { merchantId, earningRate: 1 };
  const discountRate = config.earningRate * 10; // ₹10 per 100 coins

  const discount = Math.floor(coinsToRedeem * discountRate / 100);

  // Redeem coins
  await fetch(`${SERVICES.loyalty}/api/v1/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      amount: coinsToRedeem,
      description: `Redeemed at merchant ${merchantId}`,
      referenceId: orderId,
    }),
  });

  res.json({
    success: true,
    coinsRedeemed: coinsToRedeem,
    discount,
    message: `Saved ₹${discount}!`,
  });
});

// ============================================
// CUSTOMER ENDPOINTS
// ============================================

/**
 * Get customer balance at merchant
 */
app.get('/api/v1/customer/:userId/balance', async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    // Get balance from loyalty
    const [loyaltyRes, walletRes] = await Promise.all([
      fetch(`${SERVICES.loyalty}/api/balance/${userId}`).catch(() => null),
      fetch(`${SERVICES.wallet}/api/v1/wallet/${userId}`).catch(() => null),
    ]);

    const loyalty = loyaltyRes ? await loyaltyRes.json() : { available: 0 };
    const wallet = walletRes ? await walletRes.json() : { balance: 0 };

    const tier = await getUserTier(userId);

    res.json({
      userId,
      coins: loyalty.available || 0,
      walletBalance: wallet.balance || 0,
      tier,
      tierMultiplier: TIER_MULTIPLIERS[tier] || 1,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[POSLoyalty] Customer balance fetch failed for ${userId}: ${errorMessage}`);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

/**
 * Get customer history at merchant
 */
app.get('/api/v1/customer/:userId/history', (req: Request, res: Response) => {
  const { merchantId } = req.query;
  const key = `${req.params.userId}_${merchantId}`;
  const history = transactions.get(key) || [];

  res.json({
    userId: req.params.userId,
    merchantId,
    purchases: history.length,
    totalSpent: history.reduce((sum, t) => sum + t.amount, 0),
    totalCoins: history.reduce((sum, t) => sum + (t as unknown).coinsEarned || 0, 0),
    recentPurchases: history.slice(-10),
  });
});

// ============================================
// KDS SPECIFIC ENDPOINTS
// ============================================

/**
 * KDS: Track order completion and award bonus
 */
app.post('/api/v1/kds/order-complete', async (req: Request, res: Response) => {
  const { orderId, userId, merchantId, items } = req.body;

  // Bonus for completing order
  const bonusCoins = Math.floor(items?.length * 2 || 5);

  if (userId) {
    await awardCoins(userId, bonusCoins, merchantId, `kds_${orderId}`);
  }

  res.json({
    success: true,
    bonusCoins,
    message: bonusCoins > 0 ? `Earned ${bonusCoins} bonus coins!` : 'No bonus earned',
  });
});

/**
 * KDS: Track reorder and award loyalty bonus
 */
app.post('/api/v1/kds/reorder', async (req: Request, res: Response) => {
  const { userId, merchantId, orderId } = req.body;

  // Reorder bonus (10% extra coins)
  const baseCoins = 10;
  const bonusCoins = Math.floor(baseCoins * 1.1);

  if (userId) {
    await awardCoins(userId, bonusCoins, merchantId, `reorder_${orderId}`);
  }

  res.json({
    success: true,
    bonusCoins,
    message: 'Reorder bonus applied!',
  });
});

// ============================================
// REZ NOW SPECIFIC ENDPOINTS
// ============================================

/**
 * REZ NOW: Process delivery bonus
 */
app.post('/api/v1/reznow/delivery-complete', async (req: Request, res: Response) => {
  const { orderId, userId, deliveryTime } = req.body;

  // Bonus for fast delivery (under 30 mins)
  const isFast = deliveryTime && deliveryTime < 30;
  const bonusCoins = isFast ? 15 : 5;

  if (userId) {
    await awardCoins(userId, bonusCoins, 'REZ_NOW', `delivery_${orderId}`);
  }

  res.json({
    success: true,
    bonusCoins,
    message: isFast ? 'Fast delivery bonus!' : 'Thanks for ordering!',
  });
});

/**
 * REZ NOW: First order bonus
 */
app.post('/api/v1/reznow/first-order', async (req: Request, res: Response) => {
  const { userId, orderId } = req.body;

  // First order bonus
  const bonusCoins = 100;

  if (userId) {
    await awardCoins(userId, bonusCoins, 'REZ_NOW', `first_${orderId}`);
    await sendNotification(
      userId,
      'Welcome bonus! You earned 100 REZ Coins on your first order!'
    );
  }

  res.json({
    success: true,
    bonusCoins,
    message: 'Welcome bonus! 100 REZ Coins earned!',
  });
});

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

/**
 * Get merchant loyalty stats
 */
app.get('/api/v1/merchant/:merchantId/stats', (req: Request, res: Response) => {
  let totalTransactions = 0;
  let totalCoins = 0;
  let totalAmount = 0;
  const customers = new Set<string>();

  transactions.forEach((purchases, key) => {
    const merchantPurchases = purchases.filter(p => p.merchantId === req.params.merchantId);
    merchantPurchases.forEach(p => {
      totalTransactions++;
      totalCoins += (p as unknown).coinsEarned || 0;
      totalAmount += p.amount;
      customers.add(key.split('_')[0]);
    });
  });

  res.json({
    merchantId: req.params.merchantId,
    totalTransactions,
    totalCoinsAwarded: totalCoins,
    totalAmount,
    uniqueCustomers: customers.size,
    avgOrderValue: totalTransactions > 0 ? totalAmount / totalTransactions : 0,
    avgCoinsPerCustomer: customers.size > 0 ? totalCoins / customers.size : 0,
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  logger.info(`POS Loyalty Integration running on port ${PORT}`);
  logger.info('');
  logger.info('Connected POS Systems:');
  logger.info('  • NexTaBizz (Merchant OS)');
  logger.info('  • KDS (Kitchen Display System)');
  logger.info('  • REZ NOW (Quick Commerce)');
  logger.info('  • Restaurant POS (Generic)');
  logger.info('');
  logger.info('Features:');
  logger.info('  • Automatic coin earning on sale');
  logger.info('  • QR scan rewards');
  logger.info('  • Tier multipliers');
  logger.info('  • UPI bonus');
  logger.info('  • First purchase bonus');
  logger.info('  • Redemption at POS');
  logger.info('  • KDS order completion bonus');
  logger.info('  • REZ NOW delivery bonus');
});

export { app };
