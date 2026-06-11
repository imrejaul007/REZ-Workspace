import { Sale, Product, Customer, Inventory, ISaleItem } from '../models';
import { logger } from '../utils/logger';
import Decimal from 'decimal.js';
import { loyaltyAgent } from './LoyaltyAgent';

export interface CheckoutItem {
  productId: string;
  quantity: number;
  price?: number;
  discount?: number;
}

export interface CheckoutSession {
  id: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    price: number;
    discount: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  loyaltyPointsUsed: number;
  loyaltyDiscount: number;
  finalTotal: number;
  customerId?: string;
  paymentMethod?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
}

export interface CheckoutResult {
  success: boolean;
  saleId?: string;
  receipt?: {
    saleId: string;
    items: ISaleItem[];
    subtotal: number;
    tax: number;
    discount: number;
    loyaltyDiscount: number;
    total: number;
    paymentMethod: string;
    customerId?: string;
    customerName?: string;
    loyaltyPointsEarned: number;
    newLoyaltyBalance: number;
    timestamp: Date;
  };
  error?: string;
  code?: string;
}

export class CheckoutAgent {
  private TAX_RATE = 0.08;
  private sessions: Map<string, CheckoutSession> = new Map();
  private sessionTimeout = 15 * 60 * 1000; // 15 minutes

  async processSale(
    items: CheckoutItem[],
    customerId?: string,
    paymentMethod: string = 'cash',
    loyaltyPointsToRedeem: number = 0,
    discountCode?: string
  ): Promise<CheckoutResult> {
    const sessionId = this.generateSessionId();

    try {
      // Validate and enrich items
      const enrichedItems: Array<{
        productId: string;
        productName: string;
        sku: string;
        quantity: number;
        price: number;
        discount: number;
        subtotal: number;
      }> = [];

      let subtotal = new Decimal(0);

      for (const item of items) {
        const product = await Product.findById(item.productId);

        if (!product) {
          return {
            success: false,
            error: `Product not found: ${item.productId}`,
            code: 'PRODUCT_NOT_FOUND',
          };
        }

        if (!product.isActive) {
          return {
            success: false,
            error: `Product is not active: ${product.name}`,
            code: 'PRODUCT_INACTIVE',
          };
        }

        // Check inventory
        const inventory = await Inventory.findOne({ productId: product._id });
        const availableStock = inventory?.quantity ?? product.stock;

        if (availableStock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for ${product.name}. Available: ${availableStock}`,
            code: 'INSUFFICIENT_STOCK',
          };
        }

        const itemPrice = item.price ?? product.price;
        const itemDiscount = item.discount ?? 0;
        const itemSubtotal = new Decimal(itemPrice)
          .times(item.quantity)
          .minus(itemDiscount);

        enrichedItems.push({
          productId: product._id.toString(),
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          price: itemPrice,
          discount: itemDiscount,
          subtotal: itemSubtotal.toDecimalPlaces(2).toNumber(),
        });

        subtotal = subtotal.plus(itemSubtotal);
      }

      // Calculate totals
      const subtotalValue = subtotal.toDecimalPlaces(2).toNumber();
      const discountAmount = enrichedItems.reduce(
        (sum, item) => sum + item.discount,
        0
      );
      const afterDiscount = new Decimal(subtotalValue).minus(discountAmount);
      const tax = afterDiscount.times(this.TAX_RATE).toDecimalPlaces(2).toNumber();
      const total = afterDiscount.plus(tax).toDecimalPlaces(2).toNumber();

      // Process loyalty discount
      let loyaltyDiscount = 0;
      let loyaltyPointsUsed = 0;
      let customer = null;

      if (customerId) {
        customer = await Customer.findById(customerId);
        if (customer && loyaltyPointsToRedeem > 0) {
          const redeemResult = await loyaltyAgent.redeemPoints(
            customerId,
            loyaltyPointsToRedeem
          );
          if (redeemResult.success) {
            loyaltyDiscount = redeemResult.discountAmount;
            loyaltyPointsUsed = redeemResult.pointsRedeemed;
          }
        }
      }

      const finalTotal = new Decimal(total)
        .minus(loyaltyDiscount)
        .toDecimalPlaces(2)
        .toNumber();

      if (finalTotal < 0) {
        return {
          success: false,
          error: 'Discount exceeds total',
          code: 'DISCOUNT_EXCEEDS_TOTAL',
        };
      }

      // Create sale record
      const saleItems: ISaleItem[] = enrichedItems.map((item) => ({
        productId: item.productId as any,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        total: item.subtotal,
      }));

      const sale = new Sale({
        customerId: customer?._id,
        items: saleItems,
        subtotal: subtotalValue,
        tax,
        discount: discountAmount,
        total: finalTotal,
        paymentMethod: paymentMethod as any,
        status: 'completed',
      });

      await sale.save();

      // Update inventory
      for (const item of items) {
        const inventory = await Inventory.findOne({ productId: item.productId });
        if (inventory) {
          inventory.quantity -= item.quantity;
          await inventory.save();
        } else {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity },
          });
        }
      }

      // Update customer stats and loyalty
      let pointsEarned = 0;
      if (customer) {
        customer.totalSpent += finalTotal;
        customer.purchaseCount += 1;
        await customer.save();

        // Earn points
        const earnResult = await loyaltyAgent.earnPoints(
          customer._id.toString(),
          finalTotal
        );
        pointsEarned = earnResult.pointsEarned;
      }

      // Clear session if exists
      this.sessions.delete(sessionId);

      logger.info('Sale processed', {
        saleId: sale._id,
        customerId: customer?._id,
        total: finalTotal,
        items: items.length,
      });

      return {
        success: true,
        saleId: sale._id.toString(),
        receipt: {
          saleId: sale._id.toString(),
          items: sale.items,
          subtotal: subtotalValue,
          tax,
          discount: discountAmount,
          loyaltyDiscount,
          total: finalTotal,
          paymentMethod,
          customerId: customer?._id.toString(),
          customerName: customer?.name,
          loyaltyPointsEarned: pointsEarned,
          newLoyaltyBalance: customer?.loyaltyPoints ?? 0,
          timestamp: sale.createdAt,
        },
      };
    } catch (error) {
      logger.error('Checkout failed', { error, sessionId });
      return {
        success: false,
        error: 'Checkout process failed',
        code: 'CHECKOUT_ERROR',
      };
    }
  }

  async createSession(
    customerId?: string
  ): Promise<CheckoutSession> {
    const sessionId = this.generateSessionId();
    const now = new Date();

    const session: CheckoutSession = {
      id: sessionId,
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      loyaltyPointsUsed: 0,
      loyaltyDiscount: 0,
      finalTotal: 0,
      customerId,
      status: 'pending',
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.sessionTimeout),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async addToSession(
    sessionId: string,
    productId: string,
    quantity: number
  ): Promise<CheckoutSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'pending') {
      throw new Error('Session is not active');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check existing item
    const existingItem = session.items.find(
      (item) => item.productId === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subtotal = new Decimal(existingItem.price)
        .times(existingItem.quantity)
        .minus(existingItem.discount)
        .toDecimalPlaces(2)
        .toNumber();
    } else {
      session.items.push({
        productId: product._id.toString(),
        productName: product.name,
        sku: product.sku,
        quantity,
        price: product.price,
        discount: 0,
        subtotal: new Decimal(product.price)
          .times(quantity)
          .toDecimalPlaces(2)
          .toNumber(),
      });
    }

    // Recalculate totals
    this.recalculateSessionTotals(session);

    return session;
  }

  async removeFromSession(
    sessionId: string,
    productId: string
  ): Promise<CheckoutSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.items = session.items.filter(
      (item) => item.productId !== productId
    );

    this.recalculateSessionTotals(session);

    return session;
  }

  async completeSession(
    sessionId: string,
    paymentMethod: string
  ): Promise<CheckoutResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND',
      };
    }

    if (session.items.length === 0) {
      return {
        success: false,
        error: 'No items in cart',
        code: 'EMPTY_CART',
      };
    }

    const items = session.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const result = await this.processSale(
      items,
      session.customerId,
      paymentMethod,
      session.loyaltyPointsUsed
    );

    if (result.success) {
      this.sessions.delete(sessionId);
    } else {
      session.status = 'cancelled';
    }

    return result;
  }

  getSession(sessionId: string): CheckoutSession | undefined {
    const session = this.sessions.get(sessionId);

    if (session && new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return undefined;
    }

    return session;
  }

  async refundSale(
    saleId: string,
    items?: Array<{ productId: string; quantity: number }>
  ): Promise<{
    success: boolean;
    refundAmount: number;
    message: string;
  }> {
    try {
      const sale = await Sale.findById(saleId);
      if (!sale) {
        return {
          success: false,
          refundAmount: 0,
          message: 'Sale not found',
        };
      }

      if (sale.status === 'refunded') {
        return {
          success: false,
          refundAmount: 0,
          message: 'Sale already refunded',
        };
      }

      if (sale.status === 'cancelled') {
        return {
          success: false,
          refundAmount: 0,
          message: 'Cannot refund cancelled sale',
        };
      }

      const itemsToRefund = items ?? sale.items.map((item) => ({
        productId: item.productId.toString(),
        quantity: item.quantity,
      }));

      let refundAmount = 0;

      for (const item of itemsToRefund) {
        const saleItem = sale.items.find(
          (si) => si.productId.toString() === item.productId
        );

        if (!saleItem) continue;

        const actualQty = Math.min(item.quantity, saleItem.quantity);
        const itemRefund = new Decimal(saleItem.price)
          .times(actualQty)
          .minus(saleItem.discount / saleItem.quantity * actualQty)
          .toDecimalPlaces(2)
          .toNumber();

        refundAmount += itemRefund;

        // Restore inventory
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: actualQty },
        });
      }

      // Proportional refund
      const refundRatio = refundAmount / sale.total;
      const totalRefund = new Decimal(refundAmount)
        .plus(sale.tax * refundRatio)
        .toDecimalPlaces(2)
        .toNumber();

      // Update sale status
      sale.status = 'refunded';
      await sale.save();

      // Reverse loyalty points if customer
      if (sale.customerId) {
        const pointsToReverse = Math.floor(sale.total);
        await loyaltyAgent.adjustPoints(
          sale.customerId.toString(),
          pointsToReverse,
          'subtract'
        );

        // Update customer stats
        await Customer.findByIdAndUpdate(sale.customerId, {
          $inc: {
            totalSpent: -totalRefund,
            purchaseCount: -1,
          },
        });
      }

      logger.info('Sale refunded', {
        saleId,
        refundAmount: totalRefund,
        itemsRefunded: itemsToRefund.length,
      });

      return {
        success: true,
        refundAmount: totalRefund,
        message: `Successfully refunded $${totalRefund.toFixed(2)}`,
      };
    } catch (error) {
      logger.error('Refund failed', { error, saleId });
      return {
        success: false,
        refundAmount: 0,
        message: 'Refund process failed',
      };
    }
  }

  private recalculateSessionTotals(session: CheckoutSession): void {
    session.subtotal = session.items.reduce((sum, item) => sum + item.subtotal, 0);
    const afterDiscount = new Decimal(session.subtotal).minus(session.discount);
    session.tax = afterDiscount.times(this.TAX_RATE).toDecimalPlaces(2).toNumber();
    session.total = afterDiscount.plus(session.tax).toDecimalPlaces(2).toNumber();
    session.finalTotal = new Decimal(session.total)
      .minus(session.loyaltyDiscount)
      .toDecimalPlaces(2)
      .toNumber();
  }

  private generateSessionId(): string {
    return `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup expired sessions
  cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

export const checkoutAgent = new CheckoutAgent();
export default checkoutAgent;