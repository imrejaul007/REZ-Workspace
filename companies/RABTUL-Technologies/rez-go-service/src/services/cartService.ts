import { v4 as uuidv4 } from 'uuid';
import { GoSession, IGoSession, IGoCartItem } from '../models/GoSession.js';
import { GoProduct, IGoProduct } from '../models/GoProduct.js';
import { sessionService } from './sessionService.js';
import { cashbackService } from './cashbackService.js';

export interface AddItemParams {
  sessionId: string;
  userId: string;
  barcode: string;
  quantity?: number;
  weight?: number;
}

export interface UpdateItemParams {
  sessionId: string;
  userId: string;
  itemId: string;
  quantity: number;
}

export interface RemoveItemParams {
  sessionId: string;
  userId: string;
  itemId: string;
}

export class CartService {
  /**
   * Add item to cart
   */
  async addItem(params: AddItemParams): Promise<IGoSession> {
    const { sessionId, userId, barcode, quantity = 1, weight } = params;

    // Get session
    const session = await sessionService.getSessionForUser(sessionId, userId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Session is not active');
    }

    // Check max items
    if (session.items.length >= 100) {
      throw new Error('Maximum items limit reached (100)');
    }

    // Look up product
    const product = await GoProduct.findOne({
      barcode,
      storeIds: session.storeId,
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isAvailable) {
      throw new Error('Product is not available');
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    // Check if item already exists in cart
    const existingItemIndex = session.items.findIndex(
      (item) => item.barcode === barcode && !weight
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      const existingItem = session.items[existingItemIndex];
      existingItem.quantity += quantity;
      existingItem.scannedAt = new Date();
    } else {
      // Calculate cashback for this item
      const cashback = await cashbackService.calculateItemCashback(
        session.storeId,
        session.userId,
        product,
        quantity
      );

      // Add new item
      const newItem: IGoCartItem = {
        productId: product.productId,
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        quantity,
        weight,
        cashbackPercent: cashback.percent,
        cashbackAmount: cashback.amount,
        imageUrl: product.imageUrl,
        category: product.category,
        brand: product.brand,
        scannedAt: new Date(),
      };

      session.items.push(newItem);
    }

    // Recalculate totals
    sessionService.recalculateTotals(session);

    await session.save();

    return session;
  }

  /**
   * Add item by barcode scan
   */
  async addItemByScan(params: AddItemParams): Promise<{
    session: IGoSession;
    item: IGoCartItem;
    isNew: boolean;
  }> {
    const { sessionId, userId, barcode, quantity = 1, weight } = params;

    // Get session
    const session = await sessionService.getSessionForUser(sessionId, userId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Look up product
    const product = await GoProduct.findOne({
      barcode,
      storeIds: session.storeId,
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Check if item already exists
    const existingItemIndex = session.items.findIndex(
      (item) => item.barcode === barcode && !weight
    );

    const isNew = existingItemIndex < 0;
    let item: IGoCartItem;

    if (existingItemIndex >= 0) {
      // Update existing item
      const existingItem = session.items[existingItemIndex];
      existingItem.quantity += quantity;
      existingItem.scannedAt = new Date();
      item = existingItem;
    } else {
      // Calculate cashback
      const cashback = await cashbackService.calculateItemCashback(
        session.storeId,
        session.userId,
        product,
        quantity
      );

      // Create new item
      item = {
        productId: product.productId,
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        quantity,
        weight,
        cashbackPercent: cashback.percent,
        cashbackAmount: cashback.amount,
        imageUrl: product.imageUrl,
        category: product.category,
        brand: product.brand,
        scannedAt: new Date(),
      };

      session.items.push(item);
    }

    // Recalculate totals
    sessionService.recalculateTotals(session);

    await session.save();

    return { session, item, isNew };
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(params: UpdateItemParams): Promise<IGoSession> {
    const { sessionId, userId, itemId, quantity } = params;

    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    const session = await sessionService.getSessionForUser(sessionId, userId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Session is not active');
    }

    const itemIndex = session.items.findIndex((item) => item.productId === itemId);
    if (itemIndex < 0) {
      throw new Error('Item not found in cart');
    }

    session.items[itemIndex].quantity = quantity;

    // Recalculate totals
    sessionService.recalculateTotals(session);

    await session.save();

    return session;
  }

  /**
   * Remove item from cart
   */
  async removeItem(params: RemoveItemParams): Promise<IGoSession> {
    const { sessionId, userId, itemId } = params;

    const session = await sessionService.getSessionForUser(sessionId, userId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Session is not active');
    }

    const itemIndex = session.items.findIndex((item) => item.productId === itemId);
    if (itemIndex < 0) {
      throw new Error('Item not found in cart');
    }

    session.items.splice(itemIndex, 1);

    // Recalculate totals
    sessionService.recalculateTotals(session);

    await session.save();

    return session;
  }

  /**
   * Clear cart
   */
  async clearCart(sessionId: string, userId: string): Promise<IGoSession> {
    const session = await sessionService.getSessionForUser(sessionId, userId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.items = [];
    sessionService.recalculateTotals(session);

    await session.save();

    return session;
  }

  /**
   * Get cart summary
   */
  async getCartSummary(sessionId: string, userId: string): Promise<{
    itemCount: number;
    uniqueItems: number;
    subtotal: number;
    tax: number;
    total: number;
    cashbackEarned: number;
    totalSavings: number;
    items: IGoCartItem[];
  } | null> {
    const session = await sessionService.getSessionForUser(sessionId, userId);
    if (!session) {
      return null;
    }

    return {
      itemCount: session.items.reduce((sum, item) => sum + item.quantity, 0),
      uniqueItems: session.items.length,
      subtotal: session.subtotal,
      tax: session.tax,
      total: session.total,
      cashbackEarned: session.cashbackEarned,
      totalSavings: session.savings.totalSaved,
      items: session.items,
    };
  }
}

export const cartService = new CartService();
