import { Item, ItemCategory, TaxCategory, ItemStatus } from '../models/Item';
import { Transaction, ITransactionItem, TransactionType, TransactionStatus } from '../models/Transaction';
import { Folio } from '../models/Folio';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Restaurant Outlet Module
 * Handles restaurant-specific operations including:
 * - Order management
 * - Table service
 * - Takeaway/Delivery orders
 * - GST invoice generation
 */

export interface RestaurantOrder {
  orderId: string;
  propertyId: string;
  outletId: string;
  orderType: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  tableNumber?: string;
  guestId?: string;
  guestName?: string;
  roomNumber?: string;
  items: RestaurantOrderItem[];
  guestCount: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  specialInstructions?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface RestaurantOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  modifiers?: string[];
  specialInstructions?: string;
}

export class RestaurantOutlet {
  private outletId: string;
  private propertyId: string;

  constructor(outletId: string, propertyId: string) {
    this.outletId = outletId;
    this.propertyId = propertyId;
  }

  /**
   * Get restaurant menu items
   */
  async getMenu(category?: string): Promise<unknown[]> {
    const query: Record<string, unknown> = {
      propertyId: this.propertyId,
      outletType: 'RESTAURANT',
      outletId: this.outletId,
      status: ItemStatus.ACTIVE,
      isAvailable: true,
    };

    if (category) {
      query.category = category;
    }

    return Item.find(query);
  }

  /**
   * Create a new restaurant order
   */
  async createOrder(data: {
    orderType: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
    tableNumber?: string;
    guestId?: string;
    guestName?: string;
    roomNumber?: string;
    items: RestaurantOrderItem[];
    guestCount: number;
    folioId?: string;
    specialInstructions?: string;
    staffId?: string;
    staffName?: string;
  }): Promise<RestaurantOrder> {
    const orderId = `REST-${uuidv4().substring(0, 10).toUpperCase()}`;

    // Calculate item totals with GST
    const transactionItems: ITransactionItem[] = await Promise.all(
      data.items.map(async (item) => {
        const menuItem = await Item.findOne({ itemId: item.itemId });
        if (!menuItem) {
          throw new Error(`Menu item not found: ${item.itemId}`);
        }

        const subtotal = item.unitPrice * item.quantity;
        const taxRate = this.getTaxRate(menuItem.taxCategory);
        const taxAmount = this.calculateTax(subtotal, taxRate);
        const discountAmount = 0;

        return {
          itemId: item.itemId,
          itemName: item.itemName,
          itemCode: menuItem.itemCode,
          category: menuItem.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate,
          taxAmount,
          discountRate: 0,
          discountAmount,
          totalAmount: subtotal + taxAmount - discountAmount,
          notes: item.specialInstructions,
          modifiers: item.modifiers,
        };
      })
    );

    const subtotal = transactionItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxAmount = transactionItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const discountAmount = transactionItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Create transaction record
    const transaction = new Transaction({
      transactionId: `TXN-${uuidv4().substring(0, 12).toUpperCase()}`,
      folioId: data.folioId,
      propertyId: this.propertyId,
      outletType: 'RESTAURANT',
      outletId: this.outletId,
      type: TransactionType.CHARGE,
      status: TransactionStatus.PENDING,
      items: transactionItems,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      guestId: data.guestId,
      guestName: data.guestName,
      roomNumber: data.roomNumber,
      tableNumber: data.tableNumber,
      staffId: data.staffId,
      staffName: data.staffName,
      guestCount: data.guestCount,
      notes: data.specialInstructions,
      orderId,
    });

    await transaction.save();

    // Add to folio if specified
    if (data.folioId) {
      await Folio.findOneAndUpdate(
        { folioId: data.folioId },
        {
          $push: { transactions: transaction.transactionId },
          $inc: { totalAmount: totalAmount, taxAmount: taxAmount },
        }
      );

      // Recalculate net amount
      await Folio.findOneAndUpdate(
        { folioId: data.folioId },
        { $set: { netAmount: totalAmount + taxAmount } }
      );
    }

    logger.info('Restaurant order created', {
      orderId,
      transactionId: transaction.transactionId,
      totalAmount,
      guestName: data.guestName,
    });

    return {
      orderId,
      propertyId: this.propertyId,
      outletId: this.outletId,
      orderType: data.orderType,
      tableNumber: data.tableNumber,
      guestId: data.guestId,
      guestName: data.guestName,
      roomNumber: data.roomNumber,
      items: data.items,
      guestCount: data.guestCount,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      status: 'PENDING',
      specialInstructions: data.specialInstructions,
      createdAt: transaction.createdAt,
    };
  }

  /**
   * Complete an order
   */
  async completeOrder(orderId: string, staffId?: string): Promise<void> {
    const transaction = await Transaction.findOne({ orderId });
    if (!transaction) {
      throw new Error(`Order not found: ${orderId}`);
    }

    transaction.status = TransactionStatus.COMPLETED;
    transaction.completedAt = new Date();
    if (staffId) {
      transaction.staffId = staffId;
    }

    await transaction.save();

    logger.info('Restaurant order completed', { orderId, transactionId: transaction.transactionId });
  }

  /**
   * Apply discount to an order
   */
  async applyDiscount(
    orderId: string,
    discountPercentage: number,
    discountReason: string
  ): Promise<void> {
    const transaction = await Transaction.findOne({ orderId });
    if (!transaction) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const subtotal = transaction.subtotal;
    const discountAmount = (subtotal * discountPercentage) / 100;
    transaction.discountAmount = discountAmount;
    transaction.totalAmount = subtotal + transaction.taxAmount - discountAmount;
    transaction.notes = transaction.notes
      ? `${transaction.notes}\nDiscount: ${discountReason} (${discountPercentage}%)`
      : `Discount: ${discountReason} (${discountPercentage}%)`;

    await transaction.save();

    // Update folio if linked
    if (transaction.folioId) {
      await Folio.findOneAndUpdate(
        { folioId: transaction.folioId },
        {
          $inc: { discountAmount: -discountAmount },
          $set: { netAmount: transaction.totalAmount },
        }
      );
    }

    logger.info('Discount applied to restaurant order', {
      orderId,
      discountPercentage,
      discountAmount,
    });
  }

  /**
   * Generate GST invoice for order
   */
  async generateGSTInvoice(orderId: string): Promise<{
    invoiceId: string;
    invoiceNumber: string;
    orderId: string;
    subtotal: number;
    taxBreakdown: Array<{ taxType: string; rate: number; amount: number }>;
    totalTax: number;
    totalAmount: number;
  }> {
    const transaction = await Transaction.findOne({ orderId });
    if (!transaction) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new Error('Can only generate invoice for completed orders');
    }

    const invoiceId = `INV-${uuidv4().substring(0, 12).toUpperCase()}`;
    const invoiceNumber = `REST/INV/${new Date().getFullYear()}/${invoiceId}`;

    // Tax breakdown by rate
    const taxBreakdown: Map<number, { rate: number; amount: number }> = new Map();
    for (const item of transaction.items) {
      const existing = taxBreakdown.get(item.taxRate) || { rate: item.taxRate, amount: 0 };
      existing.amount += item.taxAmount;
      taxBreakdown.set(item.taxRate, existing);
    }

    transaction.gstInvoiceId = invoiceId;
    transaction.gstInvoiceNumber = invoiceNumber;
    await transaction.save();

    logger.info('GST invoice generated for restaurant order', {
      orderId,
      invoiceId,
      invoiceNumber,
    });

    return {
      invoiceId,
      invoiceNumber,
      orderId,
      subtotal: transaction.subtotal,
      taxBreakdown: Array.from(taxBreakdown.values()).map((t) => ({
        taxType: `GST@${t.rate}%`,
        rate: t.rate,
        amount: Math.round(t.amount * 100) / 100,
      })),
      totalTax: transaction.taxAmount,
      totalAmount: transaction.totalAmount,
    };
  }

  /**
   * Get tax rate based on category
   */
  private getTaxRate(taxCategory: TaxCategory): number {
    const rates: Record<TaxCategory, number> = {
      [TaxCategory.GST_5]: 5,
      [TaxCategory.GST_12]: 12,
      [TaxCategory.GST_18]: 18,
      [TaxCategory.GST_28]: 28,
      [TaxCategory.EXEMPT]: 0,
      [TaxCategory.ZERO_RATED]: 0,
    };
    return rates[taxCategory] || 18;
  }

  /**
   * Calculate tax amount
   */
  private calculateTax(amount: number, rate: number): number {
    return Math.round(amount * rate) / 100;
  }

  /**
   * Get active orders
   */
  async getActiveOrders(): Promise<unknown[]> {
    return Transaction.find({
      propertyId: this.propertyId,
      outletType: 'RESTAURANT',
      outletId: this.outletId,
      status: TransactionStatus.PENDING,
    }).sort({ createdAt: 1 });
  }

  /**
   * Get orders by table
   */
  async getOrdersByTable(tableNumber: string): Promise<unknown[]> {
    return Transaction.find({
      propertyId: this.propertyId,
      outletType: 'RESTAURANT',
      outletId: this.outletId,
      tableNumber,
      status: TransactionStatus.PENDING,
    });
  }
}

export default RestaurantOutlet;
