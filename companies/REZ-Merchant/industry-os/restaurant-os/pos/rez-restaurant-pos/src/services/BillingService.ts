import { v4 as uuidv4 } from 'uuid';
import { Bill, BillStatus, IBillItem, IBill } from '../models/Bill';
import { Payment, PaymentStatus, PaymentMethod } from '../models/Payment';
import { Invoice, InvoiceStatus } from '../models/Invoice';

interface CreateBillInput {
  orderId?: string;
  restaurantId: string;
  tableId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    discount?: number;
    notes?: string;
    assignedTo?: string[];
    isShared?: boolean;
  }>;
  offersApplied?: Array<{
    offerId: string;
    offerName: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
  }>;
  createdBy: string;
}

interface AddItemInput {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
  notes?: string;
  assignedTo?: string[];
  isShared?: boolean;
}

interface ApplyDiscountInput {
  billId: string;
  discountType: 'BILL_LEVEL' | 'ITEM_LEVEL';
  itemId?: string;
  discountType2: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountName?: string;
}

interface ApplyTipInput {
  billId: string;
  tipAmount: number;
  tipType?: 'FIXED' | 'PERCENTAGE';
}

export class BillingService {
  async createBill(input: CreateBillInput): Promise<IBill> {
    const billId = `BILL-${uuidv4().substring(0, 8).toUpperCase()}`;

    let subtotal = 0;
    let totalTaxAmount = 0;
    let totalDiscount = 0;

    const items: IBillItem[] = input.items.map((item) => {
      const taxRate = item.taxRate ?? 18;
      const discount = item.discount ?? 0;
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemTotal * discount) / 100;
      const taxableAmount = itemTotal - itemDiscount;
      const taxAmount = (taxableAmount * taxRate) / 100;
      const totalAmount = taxableAmount + taxAmount;

      subtotal += itemTotal;
      totalTaxAmount += taxAmount;
      totalDiscount += itemDiscount;

      return {
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate,
        taxAmount,
        discount,
        totalAmount,
        notes: item.notes,
        assignedTo: item.assignedTo,
        isShared: item.isShared ?? false,
      };
    });

    let totalOfferDiscount = 0;
    const offersApplied = (input.offersApplied ?? []).map((offer) => {
      let discountAmount = 0;
      if (offer.discountType === 'PERCENTAGE') {
        discountAmount = (subtotal * offer.discountValue) / 100;
      } else {
        discountAmount = offer.discountValue;
      }
      totalOfferDiscount += discountAmount;
      return {
        offerId: offer.offerId,
        offerName: offer.offerName,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        discountAmount,
      };
    });

    const effectiveSubtotal = subtotal - totalDiscount - totalOfferDiscount;
    const grandTotal = effectiveSubtotal + totalTaxAmount;

    const bill = new Bill({
      billId,
      orderId: input.orderId,
      restaurantId: input.restaurantId,
      tableId: input.tableId,
      customerId: input.customerId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      items,
      subtotal,
      totalTaxAmount,
      totalDiscount: totalDiscount + totalOfferDiscount,
      tipAmount: 0,
      grandTotal,
      offersApplied,
      status: BillStatus.OPEN,
      createdBy: input.createdBy,
    });

    await bill.save();
    return bill;
  }

  async getBill(billId: string): Promise<IBill | null> {
    return Bill.findOne({ billId });
  }

  async getBillByOrderId(orderId: string): Promise<IBill | null> {
    return Bill.findOne({ orderId });
  }

  async addItemToBill(billId: string, item: AddItemInput, createdBy: string): Promise<IBill> {
    const bill = await Bill.findOne({ billId });
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    if (bill.status !== BillStatus.OPEN) {
      throw new Error('Cannot add items to a closed or cancelled bill');
    }

    const taxRate = item.taxRate ?? 18;
    const discount = item.discount ?? 0;
    const itemTotal = item.quantity * item.unitPrice;
    const itemDiscount = (itemTotal * discount) / 100;
    const taxableAmount = itemTotal - itemDiscount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const totalAmount = taxableAmount + taxAmount;

    const newItem: IBillItem = {
      itemId: item.itemId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate,
      taxAmount,
      discount,
      totalAmount,
      notes: item.notes,
      assignedTo: item.assignedTo,
      isShared: item.isShared ?? false,
    };

    bill.items.push(newItem);

    bill.subtotal += itemTotal;
    bill.totalTaxAmount += taxAmount;
    bill.totalDiscount += itemDiscount;
    bill.grandTotal = bill.subtotal - bill.totalDiscount + bill.totalTaxAmount + bill.tipAmount;

    await bill.save();
    return bill;
  }

  async removeItemFromBill(billId: string, itemId: string, createdBy: string): Promise<IBill> {
    const bill = await Bill.findOne({ billId });
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    if (bill.status !== BillStatus.OPEN) {
      throw new Error('Cannot remove items from a closed or cancelled bill');
    }

    const itemIndex = bill.items.findIndex((i) => i.itemId === itemId);
    if (itemIndex === -1) {
      throw new Error(`Item ${itemId} not found in bill`);
    }

    const removedItem = bill.items[itemIndex];
    bill.items.splice(itemIndex, 1);

    bill.subtotal -= removedItem.quantity * removedItem.unitPrice;
    bill.totalTaxAmount -= removedItem.taxAmount;
    bill.totalDiscount -= (removedItem.quantity * removedItem.unitPrice * removedItem.discount) / 100;
    bill.grandTotal = bill.subtotal - bill.totalDiscount + bill.totalTaxAmount + bill.tipAmount;

    await bill.save();
    return bill;
  }

  async applyDiscount(input: ApplyDiscountInput): Promise<IBill> {
    const bill = await Bill.findOne({ billId: input.billId });
    if (!bill) {
      throw new Error(`Bill ${input.billId} not found`);
    }

    if (bill.status !== BillStatus.OPEN) {
      throw new Error('Cannot apply discount to a closed or cancelled bill');
    }

    let discountAmount = 0;

    if (input.discountType === 'BILL_LEVEL') {
      if (input.discountType2 === 'PERCENTAGE') {
        discountAmount = (bill.subtotal * input.discountValue) / 100;
      } else {
        discountAmount = input.discountValue;
      }
      bill.totalDiscount += discountAmount;
    } else {
      const item = bill.items.find((i) => i.itemId === input.itemId);
      if (!item) {
        throw new Error(`Item ${input.itemId} not found`);
      }

      const itemTotal = item.quantity * item.unitPrice;
      if (input.discountType2 === 'PERCENTAGE') {
        discountAmount = (itemTotal * input.discountValue) / 100;
      } else {
        discountAmount = input.discountValue;
      }

      item.discount = input.discountValue;
      bill.totalDiscount += discountAmount;
    }

    bill.grandTotal = bill.subtotal - bill.totalDiscount + bill.totalTaxAmount + bill.tipAmount;
    await bill.save();
    return bill;
  }

  async applyTip(input: ApplyTipInput): Promise<IBill> {
    const bill = await Bill.findOne({ billId: input.billId });
    if (!bill) {
      throw new Error(`Bill ${input.billId} not found`);
    }

    let tipAmount = input.tipAmount;
    if (input.tipType === 'PERCENTAGE') {
      tipAmount = (bill.grandTotal * input.tipAmount) / 100;
    }

    bill.tipAmount = tipAmount;
    bill.grandTotal = bill.subtotal - bill.totalDiscount + bill.totalTaxAmount + bill.tipAmount;

    await bill.save();
    return bill;
  }

  async closeBill(billId: string, closedBy: string): Promise<IBill> {
    const bill = await Bill.findOne({ billId });
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    if (bill.status !== BillStatus.OPEN) {
      throw new Error('Bill is not in OPEN status');
    }

    bill.status = BillStatus.CLOSED;
    bill.closedAt = new Date();

    await bill.save();
    return bill;
  }

  async cancelBill(billId: string, cancelledBy: string, reason?: string): Promise<IBill> {
    const bill = await Bill.findOne({ billId });
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    if (bill.status === BillStatus.CLOSED) {
      throw new Error('Cannot cancel a closed bill. Use refund instead.');
    }

    bill.status = BillStatus.CANCELLED;
    bill.closedAt = new Date();

    await bill.save();
    return bill;
  }

  async getBillsByRestaurant(
    restaurantId: string,
    options: {
      status?: BillStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ bills: IBill[]; total: number }> {
    const query: Record<string, unknown> = { restaurantId };

    if (options.status) {
      query.status = options.status;
    }

    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) {
        (query.createdAt as Record<string, Date>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.createdAt as Record<string, Date>).$lte = options.endDate;
      }
    }

    const [bills, total] = await Promise.all([
      Bill.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit ?? 50)
        .skip(options.skip ?? 0),
      Bill.countDocuments(query),
    ]);

    return { bills, total };
  }

  async getDailyReport(
    restaurantId: string,
    date: Date
  ): Promise<{
    totalBills: number;
    totalRevenue: number;
    totalTax: number;
    totalDiscount: number;
    totalTips: number;
    averageBillValue: number;
    billsByStatus: Record<string, number>;
    paymentsByMethod: Record<string, number>;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bills = await Bill.find({
      restaurantId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: BillStatus.CANCELLED },
    });

    const payments = await Payment.find({
      restaurantId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: PaymentStatus.COMPLETED,
    });

    const totalBills = bills.length;
    const totalRevenue = bills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalTax = bills.reduce((sum, b) => sum + b.totalTaxAmount, 0);
    const totalDiscount = bills.reduce((sum, b) => sum + b.totalDiscount, 0);
    const totalTips = bills.reduce((sum, b) => sum + b.tipAmount, 0);
    const averageBillValue = totalBills > 0 ? totalRevenue / totalBills : 0;

    const billsByStatus: Record<string, number> = {};
    bills.forEach((b) => {
      billsByStatus[b.status] = (billsByStatus[b.status] || 0) + 1;
    });

    const paymentsByMethod: Record<string, number> = {};
    payments.forEach((p) => {
      paymentsByMethod[p.paymentMethod] = (paymentsByMethod[p.paymentMethod] || 0) + p.totalAmount;
    });

    return {
      totalBills,
      totalRevenue,
      totalTax,
      totalDiscount,
      totalTips,
      averageBillValue,
      billsByStatus,
      paymentsByMethod,
    };
  }
}

export const billingService = new BillingService();
