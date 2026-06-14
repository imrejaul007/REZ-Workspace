import { Item, ItemCategory, TaxCategory, ItemStatus } from '../models/Item';
import { Transaction, ITransactionItem, TransactionType, TransactionStatus } from '../models/Transaction';
import { Folio } from '../models/Folio';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Minibar Outlet Module
 * Handles minibar-specific operations including:
 * - Stock tracking
 * - Room service delivery
 * - Consumption logging
 * - Auto-charging to room
 */

export interface MinibarItem {
  itemId: string;
  itemName: string;
  itemCode: string;
  category: ItemCategory;
  unitPrice: number;
  stockQuantity: number;
  minStockLevel: number;
}

export interface MinibarConsumption {
  consumptionId: string;
  propertyId: string;
  roomNumber: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    timestamp: Date;
  }>;
  totalAmount: number;
  charged: boolean;
  folioId?: string;
  transactionId?: string;
  createdAt: Date;
}

export class MinibarOutlet {
  private outletId: string;
  private propertyId: string;

  constructor(outletId: string, propertyId: string) {
    this.outletId = outletId;
    this.propertyId = propertyId;
  }

  /**
   * Get minibar inventory
   */
  async getInventory(): Promise<MinibarItem[]> {
    const items = await Item.find({
      propertyId: this.propertyId,
      outletType: 'MINIBAR',
      outletId: this.outletId,
      status: ItemStatus.ACTIVE,
    });

    return items.map((item) => ({
      itemId: item.itemId,
      itemName: item.name,
      itemCode: item.itemCode || '',
      category: item.category as ItemCategory,
      unitPrice: item.basePrice,
      stockQuantity: 1, // Default, would come from inventory system
      minStockLevel: 2,
    }));
  }

  /**
   * Record consumption from minibar
   */
  async recordConsumption(data: {
    roomNumber: string;
    guestId?: string;
    guestName?: string;
    items: Array<{
      itemId: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
    }>;
    folioId?: string;
    autoCharge?: boolean;
    staffId?: string;
  }): Promise<MinibarConsumption> {
    const consumptionId = `MINI-${uuidv4().substring(0, 10).toUpperCase()}`;

    // Validate and enrich items with tax
    const enrichedItems: Array<{
      itemId: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      taxAmount: number;
      totalAmount: number;
    }> = [];

    for (const item of data.items) {
      const menuItem = await Item.findOne({ itemId: item.itemId });
      const taxRate = menuItem ? this.getTaxRate(menuItem.taxCategory) : 18;
      const subtotal = item.unitPrice * item.quantity;
      const taxAmount = Math.round(subtotal * taxRate) / 100;

      enrichedItems.push({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate,
        taxAmount,
        totalAmount: subtotal + taxAmount,
      });
    }

    const totalAmount = enrichedItems.reduce((sum, item) => sum + item.totalAmount, 0);

    // If auto-charge, create transaction and link to folio
    let transactionId: string | undefined;
    let charged = false;

    if (data.autoCharge && data.folioId) {
      const transactionItems: ITransactionItem[] = enrichedItems.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        category: ItemCategory.MINIBAR,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        discountRate: 0,
        discountAmount: 0,
        totalAmount: item.totalAmount,
      }));

      const transaction = new Transaction({
        transactionId: `TXN-${uuidv4().substring(0, 12).toUpperCase()}`,
        folioId: data.folioId,
        propertyId: this.propertyId,
        outletType: 'MINIBAR',
        outletId: this.outletId,
        type: TransactionType.CHARGE,
        status: TransactionStatus.COMPLETED,
        items: transactionItems,
        subtotal: enrichedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0),
        taxAmount: enrichedItems.reduce((sum, item) => sum + item.taxAmount, 0),
        discountAmount: 0,
        totalAmount,
        guestId: data.guestId,
        guestName: data.guestName,
        roomNumber: data.roomNumber,
        staffId: data.staffId,
        notes: `Minibar consumption - ${data.roomNumber}`,
        completedAt: new Date(),
      });

      await transaction.save();
      transactionId = transaction.transactionId;

      // Update folio
      await Folio.findOneAndUpdate(
        { folioId: data.folioId },
        {
          $push: { transactions: transactionId },
          $inc: { totalAmount: totalAmount, taxAmount: transaction.taxAmount },
          $set: { netAmount: totalAmount },
        }
      );

      charged = true;
    }

    const consumption: MinibarConsumption = {
      consumptionId,
      propertyId: this.propertyId,
      roomNumber: data.roomNumber,
      items: enrichedItems.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        timestamp: new Date(),
      })),
      totalAmount,
      charged,
      folioId: data.folioId,
      transactionId,
      createdAt: new Date(),
    };

    logger.info('Minibar consumption recorded', {
      consumptionId,
      roomNumber: data.roomNumber,
      items: data.items.length,
      totalAmount,
      charged,
    });

    return consumption;
  }

  /**
   * Restock minibar items
   */
  async restockItems(data: {
    items: Array<{
      itemId: string;
      quantity: number;
    }>;
    staffId: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    restockedItems: Array<{
      itemId: string;
      previousQuantity: number;
      newQuantity: number;
    }>;
  }> {
    const restockedItems: Array<{
      itemId: string;
      previousQuantity: number;
      newQuantity: number;
    }> = [];

    for (const item of data.items) {
      const menuItem = await Item.findOne({ itemId: item.itemId });
      if (menuItem) {
        // In a real system, this would update inventory
        // For now, just log the restock
        restockedItems.push({
          itemId: item.itemId,
          previousQuantity: 0, // Would come from inventory
          newQuantity: item.quantity,
        });

        logger.info('Minibar item restocked', {
          itemId: item.itemId,
          quantity: item.quantity,
          staffId: data.staffId,
        });
      }
    }

    return {
      success: true,
      restockedItems,
    };
  }

  /**
   * Get consumption history for a room
   */
  async getRoomConsumption(roomNumber: string, dateRange?: { start: Date; end: Date }): Promise<unknown[]> {
    const query: Record<string, unknown> = {
      propertyId: this.propertyId,
      outletType: 'MINIBAR',
      outletId: this.outletId,
      roomNumber,
    };

    if (dateRange) {
      query.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    return Transaction.find(query).sort({ createdAt: -1 });
  }

  /**
   * Generate daily consumption report
   */
  async getDailyReport(date: Date): Promise<{
    date: string;
    totalTransactions: number;
    totalAmount: number;
    itemsSold: Array<{
      itemName: string;
      quantity: number;
      amount: number;
    }>;
    byRoom: Array<{
      roomNumber: string;
      transactionCount: number;
      totalAmount: number;
    }>;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await Transaction.find({
      propertyId: this.propertyId,
      outletType: 'MINIBAR',
      outletId: this.outletId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      type: TransactionType.CHARGE,
    });

    // Aggregate items sold
    const itemsSoldMap: Map<string, { itemName: string; quantity: number; amount: number }> = new Map();
    const byRoomMap: Map<string, { transactionCount: number; totalAmount: number }> = new Map();

    for (const transaction of transactions) {
      for (const item of transaction.items) {
        const existing = itemsSoldMap.get(item.itemId) || {
          itemName: item.itemName,
          quantity: 0,
          amount: 0,
        };
        existing.quantity += item.quantity;
        existing.amount += item.totalAmount;
        itemsSoldMap.set(item.itemId, existing);
      }

      if (transaction.roomNumber) {
        const roomStats = byRoomMap.get(transaction.roomNumber) || {
          transactionCount: 0,
          totalAmount: 0,
        };
        roomStats.transactionCount += 1;
        roomStats.totalAmount += transaction.totalAmount;
        byRoomMap.set(transaction.roomNumber, roomStats);
      }
    }

    return {
      date: date.toISOString().split('T')[0],
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.totalAmount, 0),
      itemsSold: Array.from(itemsSoldMap.values()),
      byRoom: Array.from(byRoomMap.entries()).map(([roomNumber, stats]) => ({
        roomNumber,
        ...stats,
      })),
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
}

export default MinibarOutlet;
