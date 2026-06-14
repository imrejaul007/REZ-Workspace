/**
 * REZ Go Smart Product Timeline Service
 *
 * "Google Flights for offline shopping"
 *
 * Features:
 * - Price history
 * - Best time to buy
 * - Price predictions
 * - Cashback history
 * - Trending popularity
 */

import { ProductPricePoint, ProductPurchase, ProductInsight } from '../models/ProductTimeline.js';
import { GoProduct } from '../models/GoProduct.js';
import { intelligenceIntegration } from './intelligenceService.js';

export interface ProductTimeline {
  productId: string;
  barcode: string;
  name: string;
  brand: string;

  // Current pricing
  currentPrice: number;
  currentMrp: number;
  currentCashback: number;

  // Price insights
  priceHistory: Array<{
    date: string;
    price: number;
    storeId: string;
  }>;
  lowestPrice: number;
  lowestPriceDate: string;
  highestPrice: number;
  highestPriceDate: string;
  averagePrice: number;
  priceTrend: 'increasing' | 'decreasing' | 'stable';

  // Timing insights
  bestTimeToBuy: {
    dayOfWeek: string;
    timeOfDay: string;
    reason: string;
  } | null;

  // Predictions
  pricePrediction: {
    nextMonthPrice: number;
    confidence: number;
    recommendation: 'buy_now' | 'wait' | 'already_low';
  };

  // Purchase history (user-specific)
  myPurchaseHistory: Array<{
    date: string;
    price: number;
    store: string;
    cashback: number;
  }>;

  // Community insights
  communityInsights: {
    purchaseCount: number;
    avgMonthlyPurchases: number;
    popularityRank: number;
  };

  // Nearby deals
  nearbyDeals: Array<{
    storeId: string;
    storeName: string;
    price: number;
    cashback: number;
    distance: string;
  }>;
}

export interface ShoppingListItem {
  productId: string;
  barcode: string;
  name: string;
  brand: string;
  lastPrice: number;
  estimatedPrice: number;
  purchaseFrequency: string;
  nextPurchaseDate: string;
  priority: 'high' | 'medium' | 'low';
  priceStatus: 'good' | 'wait' | 'expensive';
}

export interface ShoppingList {
  listId: string;
  userId: string;
  name: string;
  items: ShoppingListItem[];
  estimatedTotal: number;
  potentialCashback: number;
  generatedAt: string;
  type: 'monthly' | 'weekly' | 'custom';
}

/**
 * Get full product timeline
 */
export async function getProductTimeline(
  barcode: string,
  userId?: string
): Promise<ProductTimeline | null> {
  const product = await GoProduct.findOne({ barcode });
  if (!product) return null;

  // Get price history (last 90 days)
  const priceHistory = await ProductPricePoint.find({
    barcode,
    timestamp: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  })
    .sort({ timestamp: -1 })
    .limit(30)
    .lean();

  // Get user's purchase history
  const purchaseHistory = userId
    ? await ProductPurchase.find({ barcode, userId })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean()
    : [];

  // Get user's insight or create global
  const insight = await ProductInsight.findOne({
    barcode,
    ...(userId ? { userId } : { userId: null }),
  });

  // Calculate price trend
  const pricePoints = priceHistory.map(p => p.price);
  const trend = calculatePriceTrend(pricePoints);

  // Get community insights
  const totalPurchases = await ProductPurchase.countDocuments({ barcode });
  const last30Days = await ProductPurchase.countDocuments({
    barcode,
    timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });

  // Find nearby deals
  const nearbyDeals = await GoProduct.find({
    barcode,
    price: { $lt: product.price },
  })
    .limit(5)
    .lean();

  return {
    productId: product.productId,
    barcode: product.barcode,
    name: product.name,
    brand: product.brand || '',

    currentPrice: product.price,
    currentMrp: product.mrp,
    currentCashback: product.cashbackPercent || 0,

    priceHistory: priceHistory.map(p => ({
      date: p.timestamp.toISOString(),
      price: p.price,
      storeId: p.storeId,
    })),

    lowestPrice: insight?.lowestPrice || product.price,
    lowestPriceDate: insight?.lowestPriceDate?.toISOString() || '',
    highestPrice: insight?.highestPrice || product.price,
    highestPriceDate: insight?.highestPriceDate?.toISOString() || '',
    averagePrice: insight?.averagePrice || product.price,
    priceTrend: insight?.priceTrend || 'stable',

    bestTimeToBuy: insight?.bestTimeToBuy ? {
      dayOfWeek: getDayName(insight.bestTimeToBuy.dayOfWeek),
      timeOfDay: insight.bestTimeToBuy.timeOfDay,
      reason: `Average cashback: ₹${insight.bestTimeToBuy.averageCashback.toFixed(0)}`,
    } : null,

    pricePrediction: {
      nextMonthPrice: insight?.predictedPriceNextMonth || product.price,
      confidence: insight?.priceConfidence || 0.5,
      recommendation: getRecommendation(product.price, insight?.predictedPriceNextMonth),
    },

    myPurchaseHistory: purchaseHistory.map(p => ({
      date: p.timestamp.toISOString(),
      price: p.price,
      store: p.storeId,
      cashback: p.cashbackEarned,
    })),

    communityInsights: {
      purchaseCount: totalPurchases,
      avgMonthlyPurchases: last30Days,
      popularityRank: 0, // Would calculate from all products
    },

    nearbyDeals: nearbyDeals.map(d => ({
      storeId: d.storeId,
      storeName: d.storeId,
      price: d.price,
      cashback: d.cashbackPercent || 0,
      distance: '< 1 km',
    })),
  };
}

/**
 * Get personalized shopping list
 */
export async function generateShoppingList(
  userId: string,
  type: 'monthly' | 'weekly' | 'custom' = 'monthly'
): Promise<ShoppingList> {
  // Get user's purchase patterns
  const purchases = await ProductPurchase.find({ userId })
    .sort({ timestamp: -1 })
    .limit(100)
    .lean();

  // Group by product and calculate frequency
  const productMap = new Map<string, {
    productId: string;
    barcode: string;
    name: string;
    brand: string;
    lastPrice: number;
    purchaseCount: number;
    totalSpent: number;
    avgPrice: number;
    lastPurchaseDate: Date;
  }>();

  for (const p of purchases) {
    const existing = productMap.get(p.productId);
    if (existing) {
      existing.purchaseCount++;
      existing.totalSpent += p.total;
      existing.avgPrice = existing.totalSpent / existing.purchaseCount;
      if (p.timestamp > existing.lastPurchaseDate) {
        existing.lastPurchaseDate = p.timestamp;
      }
    } else {
      productMap.set(p.productId, {
        productId: p.productId,
        barcode: p.barcode,
        name: p.productId, // Would lookup name
        brand: '',
        lastPrice: p.price,
        purchaseCount: 1,
        totalSpent: p.total,
        avgPrice: p.price,
        lastPurchaseDate: p.timestamp,
      });
    }
  }

  // Generate items with purchase predictions
  const items: ShoppingListItem[] = [];
  let estimatedTotal = 0;
  let potentialCashback = 0;

  for (const [productId, data] of productMap) {
    // Calculate days since last purchase
    const daysSince = Math.floor(
      (Date.now() - data.lastPurchaseDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Determine purchase frequency
    const avgDaysBetween = 30 / Math.max(data.purchaseCount, 1);
    const daysUntilNextPurchase = Math.round(avgDaysBetween - daysSince);

    // Determine priority
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (daysUntilNextPurchase <= 0) priority = 'high';
    else if (daysUntilNextPurchase > 7) priority = 'low';

    // Get current price
    const product = await GoProduct.findOne({ productId });

    // Determine price status
    let priceStatus: 'good' | 'wait' | 'expensive' = 'good';
    if (product) {
      if (product.price < data.avgPrice * 0.9) priceStatus = 'good';
      else if (product.price > data.avgPrice * 1.1) priceStatus = 'expensive';
      else priceStatus = 'wait';
    }

    items.push({
      productId: data.productId,
      barcode: data.barcode,
      name: data.name,
      brand: data.brand,
      lastPrice: data.lastPrice,
      estimatedPrice: data.avgPrice,
      purchaseFrequency: `${data.purchaseCount}x/month`,
      nextPurchaseDate: new Date(Date.now() + daysUntilNextPurchase * 24 * 60 * 60 * 1000).toISOString(),
      priority,
      priceStatus,
    });

    estimatedTotal += data.avgPrice;
    potentialCashback += data.avgPrice * 0.02; // Estimate 2% cashback
  }

  // Sort by priority
  items.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return {
    listId: `LIST-${Date.now().toString(36).toUpperCase()}`,
    userId,
    name: type === 'monthly' ? 'Monthly Essentials' : type === 'weekly' ? 'Weekly Groceries' : 'Custom List',
    items,
    estimatedTotal,
    potentialCashback,
    generatedAt: new Date().toISOString(),
    type,
  };
}

/**
 * Track purchase for timeline
 */
export async function trackPurchase(params: {
  userId: string;
  productId: string;
  barcode: string;
  storeId: string;
  sessionId: string;
  price: number;
  mrp: number;
  cashbackEarned: number;
  cashbackPercent: number;
  quantity: number;
}): Promise<void> {
  const { userId, productId, barcode, storeId, sessionId, price, mrp, cashbackEarned, cashbackPercent, quantity } = params;

  // Record purchase
  await ProductPurchase.create({
    purchaseId: `PURCH-${Date.now().toString(36).toUpperCase()}`,
    userId,
    productId,
    barcode,
    storeId,
    sessionId,
    price,
    mrp,
    cashbackEarned,
    cashbackPercent,
    quantity,
    total: price * quantity,
    timestamp: new Date(),
  });

  // Record price point
  await ProductPricePoint.create({
    productId,
    barcode,
    storeId,
    price,
    mrp,
    cashback: cashbackPercent,
    timestamp: new Date(),
  });

  // Update insights
  await updateProductInsights(barcode, userId);
}

/**
 * Update product insights
 */
async function updateProductInsights(barcode: string, userId?: string): Promise<void> {
  const purchases = await ProductPurchase.find({
    barcode,
    ...(userId ? { userId } : {}),
  }).lean();

  if (purchases.length === 0) return;

  // Calculate statistics
  const prices = purchases.map(p => p.price);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  // Calculate trend
  const recentPrices = prices.slice(0, Math.min(5, prices.length));
  const olderPrices = prices.slice(Math.min(5, prices.length));
  let priceTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (recentPrices.length > 0 && olderPrices.length > 0) {
    const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length;
    if (recentAvg > olderAvg * 1.05) priceTrend = 'increasing';
    else if (recentAvg < olderAvg * 0.95) priceTrend = 'decreasing';
  }

  // Find best time to buy
  const dayTotals = new Map<number, { count: number; cashback: number }>();
  for (const p of purchases) {
    const day = p.timestamp.getDay();
    const existing = dayTotals.get(day) || { count: 0, cashback: 0 };
    existing.count++;
    existing.cashback += p.cashbackEarned;
    dayTotals.set(day, existing);
  }

  let bestDay = 0;
  let bestCashback = 0;
  for (const [day, data] of dayTotals) {
    const avgCashback = data.cashback / data.count;
    if (avgCashback > bestCashback) {
      bestCashback = avgCashback;
      bestDay = day;
    }
  }

  // Predict next month price (simple moving average)
  const predictedPriceNextMonth = averagePrice * (1 + (priceTrend === 'increasing' ? 0.02 : priceTrend === 'decreasing' ? -0.02 : 0));

  await ProductInsight.findOneAndUpdate(
    { barcode, ...(userId ? { userId } : { userId: null }) },
    {
      barcode,
      lowestPrice,
      lowestPriceDate: purchases.find(p => p.price === lowestPrice)?.timestamp || new Date(),
      highestPrice,
      highestPriceDate: purchases.find(p => p.price === highestPrice)?.timestamp || new Date(),
      averagePrice,
      priceTrend,
      purchaseCount: purchases.length,
      totalSpent: purchases.reduce((sum, p) => sum + p.total, 0),
      totalCashback: purchases.reduce((sum, p) => sum + p.cashbackEarned, 0),
      favoriteStore: getMostFrequent(purchases.map(p => p.storeId)),
      bestTimeToBuy: {
        dayOfWeek: bestDay,
        timeOfDay: '14:00', // Would analyze actual times
        averageCashback: bestCashback,
      },
      predictedPriceNextMonth,
      priceConfidence: Math.min(0.9, purchases.length * 0.1),
    },
    { upsert: true, new: true }
  );
}

// Helper functions
function calculatePriceTrend(prices: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (prices.length < 2) return 'stable';
  const recent = prices.slice(0, Math.ceil(prices.length / 2));
  const older = prices.slice(Math.ceil(prices.length / 2));
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  if (recentAvg > olderAvg * 1.05) return 'increasing';
  if (recentAvg < olderAvg * 0.95) return 'decreasing';
  return 'stable';
}

function getRecommendation(currentPrice: number, predictedPrice?: number): 'buy_now' | 'wait' | 'already_low' {
  if (!predictedPrice) return 'wait';
  if (currentPrice <= predictedPrice * 0.95) return 'already_low';
  if (currentPrice >= predictedPrice * 1.05) return 'wait';
  return 'buy_now';
}

function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Unknown';
}

function getMostFrequent(items: string[]): string {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  let maxCount = 0;
  let mostFrequent = items[0] || '';
  for (const [item, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = item;
    }
  }
  return mostFrequent;
}

export default {
  getProductTimeline,
  generateShoppingList,
  trackPurchase,
};
