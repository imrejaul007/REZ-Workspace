import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

export interface VoiceOrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price?: number;
  confidence: number;
  matchedBy: 'exact' | 'fuzzy' | 'partial';
}

/**
 * Product type for voice matching (extracted from Mongoose lean).
 */
interface VoiceMatchProduct {
  _id;
  name: string;
  pricing: { selling: number; original?: number };
  variants?: Array<{ name: string; price: number }>;
  available?: boolean;
}

/**
 * Parse voice commands into structured order items.
 * Supports patterns like:
 * - "1 burger, 2 pizzas"
 * - "2 coffees and a sandwich"
 * - "burger and fries"
 * - "three burgers please"
 */
function parseVoiceOrder(text: string, availableProducts: VoiceMatchProduct[]): VoiceOrderItem[] {
  const items: VoiceOrderItem[] = [];
  const normalizedText = text.toLowerCase().trim();

  if (!normalizedText) return items;

  // Pattern 1: "1 burger, 2 pizzas" or "2 coffees"
  const quantityItemPattern = /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+([a-zA-Z][a-zA-Z\s-]*?)(?=\s*,|\s+and\s+|\s+please|\s+thanks|\s+thank\s+you|$)/gi;

  const wordToNumber: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  };

  let match;
  while ((match = quantityItemPattern.exec(normalizedText)) !== null) {
    const quantityStr = match[1].toLowerCase();
    const quantity = wordToNumber[quantityStr] || parseInt(quantityStr, 10);
    const itemName = match[2].trim();

    if (quantity > 0 && itemName.length >= 2) {
      const matchedProduct = findBestMatch(itemName, availableProducts);
      items.push({
        productId: matchedProduct?.productId,
        name: matchedProduct?.name || itemName,
        quantity,
        price: matchedProduct?.price,
        confidence: matchedProduct?.confidence || 0,
        matchedBy: matchedProduct?.matchedBy || 'partial'
      });
    }
  }

  // Pattern 2: Handle "a burger" or "an item" (single item without explicit quantity)
  if (items.length === 0) {
    const singleItemPattern = /(?:a|an)\s+([a-zA-Z][a-zA-Z\s-]+?)(?=\s*,|\s+and\s+|\s+please|\s+thanks|\s+thank\s+you|$)/i;
    const singleMatch = normalizedText.match(singleItemPattern);
    if (singleMatch && singleMatch[1]) {
      const itemName = singleMatch[1].trim();
      if (itemName.length >= 2) {
        const matchedProduct = findBestMatch(itemName, availableProducts);
        items.push({
          productId: matchedProduct?.productId,
          name: matchedProduct?.name || itemName,
          quantity: 1,
          price: matchedProduct?.price,
          confidence: matchedProduct?.confidence || 0,
          matchedBy: matchedProduct?.matchedBy || 'partial'
        });
      }
    }
  }

  return items;
}

/**
 * Find the best matching product for a voice item name.
 * Implements fuzzy matching with confidence scoring.
 */
function findBestMatch(
  itemName: string,
  products: VoiceMatchProduct[]
): { productId: string; name: string; price: number; confidence: number; matchedBy: 'exact' | 'fuzzy' | 'partial' } | null {
  const normalizedItemName = itemName.toLowerCase().replace(/[^a-z0-9\s]/g, '');

  // Exact match (case-insensitive)
  const exactMatch = products.find(p =>
    p.name.toLowerCase().replace(/[^a-z0-9\s]/g, '') === normalizedItemName
  );
  if (exactMatch) {
    return { productId: exactMatch._id.toString(), name: exactMatch.name, price: exactMatch.pricing?.selling || 0, confidence: 1.0, matchedBy: 'exact' };
  }

  // Contains match (product name contains item name or vice versa)
  const partialMatch = products.find(p => {
    const normalizedProductName = p.name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    return normalizedProductName.includes(normalizedItemName) ||
           normalizedItemName.includes(normalizedProductName) ||
           normalizedProductName.split(' ').some(word => word.length > 2 && normalizedItemName.includes(word));
  });
  if (partialMatch) {
    return { productId: partialMatch._id.toString(), name: partialMatch.name, price: partialMatch.pricing?.selling || 0, confidence: 0.8, matchedBy: 'partial' };
  }

  // Fuzzy match using Levenshtein distance for short item names
  if (normalizedItemName.length >= 3) {
    let bestMatch: VoiceMatchProduct | null = null;
    let bestDistance = Infinity;

    for (const product of products) {
      const distance = levenshteinDistance(
        normalizedItemName,
        product.name.toLowerCase().replace(/[^a-z0-9\s]/g, '')
      );
      const threshold = Math.max(normalizedItemName.length, product.name.length) * 0.3;

      if (distance < bestDistance && distance <= threshold) {
        bestDistance = distance;
        bestMatch = product;
      }
    }

    if (bestMatch) {
      const confidence = 1 - (bestDistance / Math.max(normalizedItemName.length, bestMatch.name.length));
      return { productId: bestMatch._id.toString(), name: bestMatch.name, price: bestMatch.pricing?.selling || 0, confidence, matchedBy: 'fuzzy' };
    }
  }

  return null;
}

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function errMsg(req: Request, err): string {
  const requestId = (req as unknown).res?.locals?.requestId;
  return process.env.NODE_ENV === 'production'
    ? `An error occurred. Reference: ${requestId || 'unknown'}`
    : err.message;
}

/**
 * POST /api/v1/merchant/voice/order
 * Parse voice text and return matched order items.
 */
router.post('/order', async (req: Request, res: Response) => {
  try {
    const { userId, voiceText, storeId } = req.body;

    if (!voiceText || typeof voiceText !== 'string') {
      res.status(400).json({ success: false, message: 'voiceText is required and must be a string' });
      return;
    }

    if (!userId && !storeId) {
      res.status(400).json({ success: false, message: 'Either userId or storeId is required' });
      return;
    }

    // Get store ID - either from request or user's default store
    let targetStoreId = storeId;
    if (!targetStoreId && userId) {
      const store = await Store.findOne({ merchant: req.merchantId }).select('_id').lean();
      if (store) {
        targetStoreId = store._id.toString();
      }
    }

    if (!targetStoreId) {
      res.status(400).json({ success: false, message: 'Unable to determine store. Please provide storeId.' });
      return;
    }

    // Fetch available products for this store
    const products = await Product.find({
      store: targetStoreId,
      'inventory.isAvailable': true
    }).select('_id name pricing variants available').lean();

    if (products.length === 0) {
      logger.warn(`[voice] No products found for store ${targetStoreId}`);
      res.json({
        success: true,
        data: {
          items: [],
          message: 'No menu items found for this store',
          rawText: voiceText
        }
      });
      return;
    }

    // Parse voice input
    const items = parseVoiceOrder(voiceText, products);

    // Calculate totals
    let subtotal = 0;
    const itemsWithTotals = items.map(item => {
      const itemTotal = (item.price || 0) * item.quantity;
      subtotal += itemTotal;
      return {
        ...item,
        subtotal: itemTotal
      };
    });

    logger.info(`[voice] Parsed order from "${voiceText}": ${items.length} items, subtotal: ${subtotal}`);

    // Cache parsed result for confirmation step
    const cacheKey = `voice:pending:${userId || 'anonymous'}:${Date.now()}`;
    await redis.set(cacheKey, JSON.stringify({ items: itemsWithTotals, voiceText, storeId: targetStoreId }), 'EX', 300);

    res.json({
      success: true,
      data: {
        items: itemsWithTotals,
        rawText: voiceText,
        storeId: targetStoreId,
        totals: {
          subtotal,
          estimatedTotal: subtotal // Add tax/delivery calculation as needed
        },
        confidence: items.length > 0
          ? items.reduce((sum, item) => sum + item.confidence, 0) / items.length
          : 0,
        cacheKey
      }
    });
  } catch (err: unknown) {
    logger.error('[voice] Error parsing voice order', { error: err.message });
    res.status(500).json({ success: false, message: errMsg(req, err) });
  }
});

/**
 * POST /api/v1/merchant/voice/confirm
 * Confirm a voice order from cached data.
 */
router.post('/confirm', async (req: Request, res: Response) => {
  try {
    const { cacheKey, userId, notes } = req.body;

    if (!cacheKey) {
      res.status(400).json({ success: false, message: 'cacheKey is required' });
      return;
    }

    const cachedData = await redis.get(cacheKey);
    if (!cachedData) {
      res.status(400).json({ success: false, message: 'Order expired or not found. Please re-enter your order.' });
      return;
    }

    const { items, voiceText, storeId } = JSON.parse(cachedData);

    if (!items || items.length === 0) {
      res.status(400).json({ success: false, message: 'No items in order to confirm' });
      return;
    }

    // Import Order model here to avoid circular dependency
    const { Order } = await import('../models/Order');

    // Validate userId format if provided (user creation/validation happens in customer service)
    const validUserId = userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null;

    // Generate order number
    // FIX (security): Replaced Math.random() with crypto.randomUUID()
    let orderNumber: string;
    try {
      const { randomUUID } = require('crypto');
      orderNumber = `VO-${Date.now()}-${randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase()}`;
    } catch {
      orderNumber = `VO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item) => sum + (item.subtotal || 0), 0);
    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const total = subtotal + tax;

    const order = new Order({
      orderNumber,
      user: validUserId ? new mongoose.Types.ObjectId(validUserId) : undefined,
      store: storeId,
      merchant: req.merchantId,
      items: items.map((item) => ({
        product: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      totals: {
        subtotal,
        tax,
        delivery: 0,
        discount: 0,
        cashback: 0,
        total,
        paidAmount: 0,
        platformFee: Math.round(total * 0.02 * 100) / 100, // 2% platform fee
        merchantPayout: total - Math.round(total * 0.02 * 100) / 100
      },
      payment: {
        method: 'pending',
        status: 'pending'
      },
      status: 'placed',
      deliveryType: 'pickup',
      notes: notes || `Voice order: "${voiceText}"`,
      timeline: [{
        status: 'placed',
        timestamp: new Date(),
        note: 'Order placed via voice'
      }]
    });

    await order.save();

    // Clear cached order
    await redis.del(cacheKey);

    logger.info(`[voice] Order confirmed: ${orderNumber}, ${items.length} items, total: ${total}`);

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        items: order.items,
        totals: order.totals,
        status: order.status
      }
    });
  } catch (err: unknown) {
    logger.error('[voice] Error confirming voice order', { error: err.message });
    res.status(500).json({ success: false, message: errMsg(req, err) });
  }
});

/**
 * POST /api/v1/merchant/voice/menu
 * Get available menu items for voice matching.
 */
router.post('/menu', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.body;

    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId is required' });
      return;
    }

    const products = await Product.find({
      store: storeId,
      'inventory.isAvailable': true
    }).select('name pricing variants available').lean();

    const menuItems = products.map(p => ({
      id: p._id.toString(),
      name: p.name,
      price: p.pricing?.selling || 0,
      category: (p as unknown).category,
      variants: (p as unknown).variants?.map((v) => ({ name: v.name, price: v.price })) || []
    }));

    res.json({
      success: true,
      data: {
        storeId,
        items: menuItems,
        itemCount: menuItems.length
      }
    });
  } catch (err: unknown) {
    logger.error('[voice] Error fetching menu', { error: err.message });
    res.status(500).json({ success: false, message: errMsg(req, err) });
  }
});

export default router;
