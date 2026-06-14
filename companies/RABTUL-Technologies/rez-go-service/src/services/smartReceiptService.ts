/**
 * REZ Go Smart Receipt Service
 *
 * "Google Flights for your shopping history"
 *
 * Features:
 * - Searchable receipts
 * - Natural language queries
 * - Reorder capability
 * - Expiry tracking
 * - Category insights
 */

import { Receipt } from '../models/SmartReceipt.js';
import { generateReceiptId } from './receiptService.js';

export interface ReceiptSearchResult {
  receiptId: string;
  storeName: string;
  date: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  matchedText: string;
}

export interface ExpiryAlert {
  productId: string;
  name: string;
  receiptId: string;
  expiryDate: Date;
  daysRemaining: number;
  urgency: 'critical' | 'warning' | 'info';
}

export interface ReorderSuggestion {
  productId: string;
  barcode: string;
  name: string;
  lastReceipt: string;
  lastPrice: number;
  estimatedPrice: number;
  purchaseFrequency: string;
}

/**
 * Create a smart receipt from checkout
 */
export async function createSmartReceipt(params: {
  sessionId: string;
  userId: string;
  storeId: string;
  storeName: string;
  merchantId: string;
  items: Array<{
    productId: string;
    barcode: string;
    name: string;
    quantity: number;
    price: number;
    mrp: number;
    cashbackEarned: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  totalMrp: number;
  totalSavings: number;
  cashbackEarned: number;
  paymentMethod: string;
  paymentId: string;
}): Promise<string> {
  const {
    sessionId, userId, storeId, storeName, merchantId,
    items, subtotal, tax, total, totalMrp, totalSavings, cashbackEarned,
    paymentMethod, paymentId
  } = params;

  // Generate search text
  const searchText = items.map(i => `${i.name} ${i.barcode}`).join(' ');
  const productNames = items.map(i => i.name);

  const receipt = await Receipt.create({
    receiptId: generateReceiptId(),
    sessionId,
    userId,
    storeId,
    storeName,
    merchantId,
    items: items.map(i => ({
      productId: i.productId,
      barcode: i.barcode,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      mrp: i.mrp,
      total: i.price * i.quantity,
      cashbackEarned: i.cashbackEarned,
    })),
    subtotal,
    tax,
    total,
    totalMrp,
    totalSavings,
    cashbackEarned,
    paymentMethod,
    paymentId,
    status: 'completed',
    searchText,
    productNames,
    expiryItems: [], // Would add expiry tracking here
    insights: {
      categoryBreakdown: {},
      topBrands: [],
    },
  });

  return receipt.receiptId;
}

/**
 * Search receipts with natural language
 */
export async function searchReceipts(
  userId: string,
  query: string
): Promise<ReceiptSearchResult[]> {
  const results = await Receipt.find({
    userId,
    status: 'completed',
    $or: [
      { searchText: { $regex: query, $options: 'i' } },
      { 'items.name': { $regex: query, $options: 'i' } },
      { storeName: { $regex: query, $options: 'i' } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return results.map(r => ({
    receiptId: r.receiptId,
    storeName: r.storeName || 'Unknown Store',
    date: r.createdAt.toISOString(),
    total: r.total,
    items: r.items.map(i => ({
      name: i.name,
      quantity: i.quantity,
    })),
    matchedText: query,
  }));
}

/**
 * Get user's purchase history
 */
export async function getPurchaseHistory(
  userId: string,
  options: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    storeId?: string;
  } = {}
): Promise<ReceiptSearchResult[]> {
  const { limit = 50, startDate, endDate, storeId } = options;

  const query: Record<string, unknown> = {
    userId,
    status: 'completed',
  };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) (query.createdAt as Record<string, Date>).$gte = startDate;
    if (endDate) (query.createdAt as Record<string, Date>).$lte = endDate;
  }

  if (storeId) query.storeId = storeId;

  const receipts = await Receipt.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return receipts.map(r => ({
    receiptId: r.receiptId,
    storeName: r.storeName || 'Unknown Store',
    date: r.createdAt.toISOString(),
    total: r.total,
    items: r.items.map(i => ({
      name: i.name,
      quantity: i.quantity,
    })),
    matchedText: '',
  }));
}

/**
 * Get expiry alerts
 */
export async function getExpiryAlerts(userId: string): Promise<ExpiryAlert[]> {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const receipts = await Receipt.find({
    userId,
    status: 'completed',
    'expiryItems.expiryDate': {
      $gte: now,
      $lte: thirtyDaysFromNow,
    },
  }).lean();

  const alerts: ExpiryAlert[] = [];

  for (const receipt of receipts) {
    for (const item of receipt.expiryItems) {
      if (item.expiryDate && item.tracked) {
        const expiryDate = new Date(item.expiryDate);
        const daysRemaining = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysRemaining <= 30) {
          let urgency: 'critical' | 'warning' | 'info' = 'info';
          if (daysRemaining <= 7) urgency = 'critical';
          else if (daysRemaining <= 14) urgency = 'warning';

          alerts.push({
            productId: item.productId,
            name: item.name,
            receiptId: receipt.receiptId,
            expiryDate,
            daysRemaining,
            urgency,
          });
        }
      }
    }
  }

  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Get reorder suggestions
 */
export async function getReorderSuggestions(userId: string): Promise<ReorderSuggestion[]> {
  // Get most frequently purchased items
  const receipts = await Receipt.find({ userId, status: 'completed' })
    .sort({ createdAt: -1 })
    .lean();

  const productFrequency = new Map<string, {
    productId: string;
    barcode: string;
    name: string;
    count: number;
    lastReceipt: Date;
    lastPrice: number;
    totalSpent: number;
  }>();

  for (const receipt of receipts) {
    for (const item of receipt.items) {
      const existing = productFrequency.get(item.productId);
      if (existing) {
        existing.count++;
        existing.totalSpent += item.total;
        if (receipt.createdAt > existing.lastReceipt) {
          existing.lastReceipt = receipt.createdAt;
          existing.lastPrice = item.price;
        }
      } else {
        productFrequency.set(item.productId, {
          productId: item.productId,
          barcode: item.barcode,
          name: item.name,
          count: 1,
          lastReceipt: receipt.createdAt,
          lastPrice: item.price,
          totalSpent: item.total,
        });
      }
    }
  }

  // Calculate average purchase frequency
  const firstReceipt = receipts[receipts.length - 1];
  const lastReceiptDate = receipts[0]?.createdAt || new Date();
  const firstReceiptDate = firstReceipt?.createdAt || new Date();
  const totalDays = Math.max(1,
    (lastReceiptDate.getTime() - firstReceiptDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  const suggestions: ReorderSuggestion[] = [];

  for (const [, data] of productFrequency) {
    if (data.count >= 2) { // Only items purchased multiple times
      const avgDaysBetween = totalDays / data.count;
      const daysSinceLastPurchase = Math.floor(
        (Date.now() - data.lastReceipt.getTime()) / (24 * 60 * 60 * 1000)
      );

      // If it's time to reorder based on frequency
      if (daysSinceLastPurchase >= avgDaysBetween * 0.8) {
        suggestions.push({
          productId: data.productId,
          barcode: data.barcode,
          name: data.name,
          lastReceipt: data.lastReceipt.toISOString(),
          lastPrice: data.lastPrice,
          estimatedPrice: data.totalSpent / data.count,
          purchaseFrequency: `Every ${Math.round(avgDaysBetween)} days`,
        });
      }
    }
  }

  // Sort by how overdue the reorder is
  return suggestions.sort((a, b) => {
    const aDate = new Date(a.lastReceipt).getTime();
    const bDate = new Date(b.lastReceipt).getTime();
    return bDate - aDate;
  }).slice(0, 10);
}

/**
 * Get spending insights
 */
export async function getSpendingInsights(userId: string): Promise<{
  totalSpent: number;
  totalSaved: number;
  totalCashback: number;
  averageOrderValue: number;
  topStores: Array<{ storeId: string; name: string; count: number; total: number }>;
  topCategories: Array<{ category: string; count: number; total: number }>;
  monthlyTrend: Array<{ month: string; total: number }>;
}> {
  const receipts = await Receipt.find({ userId, status: 'completed' }).lean();

  if (receipts.length === 0) {
    return {
      totalSpent: 0,
      totalSaved: 0,
      totalCashback: 0,
      averageOrderValue: 0,
      topStores: [],
      topCategories: [],
      monthlyTrend: [],
    };
  }

  const totalSpent = receipts.reduce((sum, r) => sum + r.total, 0);
  const totalSaved = receipts.reduce((sum, r) => sum + (r.totalSavings || 0), 0);
  const totalCashback = receipts.reduce((sum, r) => sum + (r.cashbackEarned || 0), 0);

  // Top stores
  const storeMap = new Map<string, { name: string; count: number; total: number }>();
  for (const r of receipts) {
    const existing = storeMap.get(r.storeId) || { name: r.storeName || '', count: 0, total: 0 };
    existing.count++;
    existing.total += r.total;
    storeMap.set(r.storeId, existing);
  }
  const topStores = Array.from(storeMap.entries())
    .map(([storeId, data]) => ({ storeId, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Monthly trend
  const monthMap = new Map<string, number>();
  for (const r of receipts) {
    const month = r.createdAt.toISOString().slice(0, 7);
    monthMap.set(month, (monthMap.get(month) || 0) + r.total);
  }
  const monthlyTrend = Array.from(monthMap.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  return {
    totalSpent,
    totalSaved,
    totalCashback,
    averageOrderValue: totalSpent / receipts.length,
    topStores,
    topCategories: [], // Would categorize items
    monthlyTrend,
  };
}

/**
 * Natural language query processing
 */
export async function processNaturalQuery(
  userId: string,
  query: string
): Promise<{
  type: 'search' | 'insights' | 'reorder' | 'expiry' | 'receipt';
  results: ReceiptSearchResult[] | ReorderSuggestion[] | ExpiryAlert[];
  summary: string;
}> {
  const lowerQuery = query.toLowerCase();

  // Detect query type
  if (lowerQuery.includes('when did i buy') || lowerQuery.includes('last time')) {
    const productName = query.replace(/when did i buy|last time i bought/i, '').trim();
    const results = await searchReceipts(userId, productName);
    return {
      type: 'receipt',
      results,
      summary: results.length > 0
        ? `You last bought ${productName} on ${new Date(results[0].date).toLocaleDateString()}`
        : `No previous purchases of ${productName} found`,
    };
  }

  if (lowerQuery.includes('reorder') || lowerQuery.includes('buy again')) {
    const suggestions = await getReorderSuggestions(userId);
    return {
      type: 'reorder',
      results: suggestions,
      summary: `Found ${suggestions.length} items you might want to reorder`,
    };
  }

  if (lowerQuery.includes('expir') || lowerQuery.includes('going to end')) {
    const alerts = await getExpiryAlerts(userId);
    return {
      type: 'expiry',
      results: alerts,
      summary: alerts.length > 0
        ? `You have ${alerts.length} items expiring soon`
        : 'No expiry alerts',
    };
  }

  if (lowerQuery.includes('how much') || lowerQuery.includes('total spent')) {
    const insights = await getSpendingInsights(userId);
    return {
      type: 'insights',
      results: [],
      summary: `You've spent ₹${insights.totalSpent.toFixed(0)} total, saved ₹${insights.totalSaved.toFixed(0)}, and earned ₹${insights.totalCashback.toFixed(0)} cashback`,
    };
  }

  // Default to search
  const results = await searchReceipts(userId, query);
  return {
    type: 'search',
    results,
    summary: `Found ${results.length} matching receipts`,
  };
}

export default {
  createSmartReceipt,
  searchReceipts,
  getPurchaseHistory,
  getExpiryAlerts,
  getReorderSuggestions,
  getSpendingInsights,
  processNaturalQuery,
};
