import { v4 as uuidv4 } from 'uuid';
import {
  Order,
  OrderItem,
  BillSplit,
  Payment,
  Receipt,
  Discount,
  SplitBillRequest,
  ProcessPaymentRequest,
  PaymentStatus
} from '../types';
import { orderModel } from '../models/Order';

export interface BillCalculation {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  tip: number;
  total: number;
  amountDue: number;
  amountPaid: number;
  balanceDue: number;
}

export interface SplitCalculation {
  splits: BillSplit[];
  perPersonAmount: number;
}

export class BillingService {
  private static TAX_RATE = 0.08; // 8% tax rate

  /**
   * Calculate complete bill breakdown for an order
   */
  calculateBill(order: Order, tip: number = 0): BillCalculation {
    const subtotal = order.subtotal;
    const discountAmount = order.discountAmount;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = Math.round(taxableAmount * BillingService.TAX_RATE * 100) / 100;
    const total = Math.round((taxableAmount + taxAmount + tip) * 100) / 100;
    const amountPaid = this.calculateTotalPaid(order);
    const balanceDue = Math.round((total - amountPaid) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      taxAmount,
      tip: Math.round(tip * 100) / 100,
      total,
      amountDue: total,
      amountPaid: Math.round(amountPaid * 100) / 100,
      balanceDue
    };
  }

  /**
   * Split bill by number of equal parts
   */
  splitBillEqual(order: Order, splitCount: number): SplitCalculation {
    if (splitCount < 1) {
      throw new Error('Split count must be at least 1');
    }

    const bill = this.calculateBill(order);
    const perPersonAmount = Math.round((bill.total / splitCount) * 100) / 100;

    // Distribute items round-robin
    const splits: BillSplit[] = [];
    const itemsPerSplit = Math.ceil(order.items.length / splitCount);

    for (let i = 0; i < splitCount; i++) {
      const startIndex = i * itemsPerSplit;
      const endIndex = Math.min(startIndex + itemsPerSplit, order.items.length);
      const splitItems = order.items.slice(startIndex, endIndex);

      const splitSubtotal = this.calculateSplitSubtotal(splitItems);
      const splitTax = Math.round(splitSubtotal * BillingService.TAX_RATE * 100) / 100;
      const splitDiscount = Math.round((splitSubtotal / order.subtotal) * order.discountAmount * 100) / 100;

      splits.push({
        id: orderModel.generateSplitId(),
        items: splitItems,
        amount: Math.round(splitSubtotal * 100) / 100,
        tax: splitTax,
        discount: splitDiscount,
        total: Math.round((splitSubtotal - splitDiscount + splitTax) * 100) / 100,
        paid: false
      });
    }

    // Adjust last split to account for rounding
    const totalSplitAmount = splits.reduce((sum, s) => sum + s.total, 0);
    const difference = Math.round((bill.total - totalSplitAmount) * 100) / 100;
    if (difference !== 0 && splits.length > 0) {
      splits[splits.length - 1].total = Math.round((splits[splits.length - 1].total + difference) * 100) / 100;
    }

    return {
      splits,
      perPersonAmount: bill.total / splitCount
    };
  }

  /**
   * Split bill by specific items assigned to each person
   */
  splitBillByItems(order: Order, itemAssignments: { splitIndex: number; itemId: string }[]): SplitCalculation {
    if (itemAssignments.length === 0) {
      throw new Error('Item assignments are required');
    }

    // Group items by split
    const splitGroups: Map<number, OrderItem[]> = new Map();
    const assignedItemIds = new Set<string>();

    for (const assignment of itemAssignments) {
      if (!splitGroups.has(assignment.splitIndex)) {
        splitGroups.set(assignment.splitIndex, []);
      }
      const item = order.items.find(i => i.id === assignment.itemId);
      if (!item) {
        throw new Error(`Item ${assignment.itemId} not found`);
      }
      if (assignedItemIds.has(assignment.itemId)) {
        throw new Error(`Item ${assignment.itemId} is assigned multiple times`);
      }
      splitGroups.get(assignment.splitIndex)!.push(item);
      assignedItemIds.add(assignment.itemId);
    }

    const splits: BillSplit[] = [];
    const splitCount = Math.max(...Array.from(splitGroups.keys())) + 1;

    for (let i = 0; i < splitCount; i++) {
      const items = splitGroups.get(i) || [];
      const splitSubtotal = this.calculateSplitSubtotal(items);
      const splitTax = Math.round(splitSubtotal * BillingService.TAX_RATE * 100) / 100;
      const splitDiscount = Math.round((splitSubtotal / order.subtotal) * order.discountAmount * 100) / 100;

      splits.push({
        id: orderModel.generateSplitId(),
        items,
        amount: Math.round(splitSubtotal * 100) / 100,
        tax: splitTax,
        discount: splitDiscount,
        total: Math.round((splitSubtotal - splitDiscount + splitTax) * 100) / 100,
        paid: false
      });
    }

    // Adjust totals for rounding
    const bill = this.calculateBill(order);
    const totalSplitAmount = splits.reduce((sum, s) => sum + s.total, 0);
    const difference = Math.round((bill.total - totalSplitAmount) * 100) / 100;
    if (difference !== 0 && splits.length > 0) {
      splits[splits.length - 1].total = Math.round((splits[splits.length - 1].total + difference) * 100) / 100;
    }

    return {
      splits,
      perPersonAmount: bill.total / splitCount
    };
  }

  /**
   * Split bill by specific amounts
   */
  splitBillByAmount(order: Order, amounts: number[]): SplitCalculation {
    const bill = this.calculateBill(order);
    const totalRequested = amounts.reduce((sum, amount) => sum + amount, 0);

    // Allow small variance for rounding
    const variance = Math.abs(bill.total - totalRequested);
    if (variance > 0.05) {
      throw new Error(`Split amounts ($${totalRequested.toFixed(2)}) do not match order total ($${bill.total.toFixed(2)})`);
    }

    const splits: BillSplit[] = amounts.map((amount, index) => {
      // Calculate proportional discount and tax for this split
      const proportion = amount / bill.total;
      const splitDiscount = Math.round(order.discountAmount * proportion * 100) / 100;
      const taxableAmount = amount - splitDiscount;
      const splitTax = Math.round(taxableAmount * BillingService.TAX_RATE * 100) / 100;

      return {
        id: orderModel.generateSplitId(),
        items: [], // No specific items for amount splits
        amount: Math.round(amount * 100) / 100,
        tax: splitTax,
        discount: splitDiscount,
        total: Math.round((amount + splitTax) * 100) / 100,
        paid: false
      };
    });

    return {
      splits,
      perPersonAmount: amounts[0] || 0
    };
  }

  /**
   * Process a payment on an order
   */
  processPayment(order: Order, request: ProcessPaymentRequest): Payment {
    const bill = this.calculateBill(order, request.tip || 0);
    const remainingBalance = bill.balanceDue;

    if (request.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    // Validate payment doesn't exceed remaining balance by too much
    if (request.amount > remainingBalance + 0.01) {
      // Allow small overpayment for cash
      if (request.method !== 'cash') {
        throw new Error(`Payment amount ($${request.amount}) exceeds balance due ($${remainingBalance.toFixed(2)})`);
      }
    }

    const payment: Payment = {
      id: orderModel.generatePaymentId(),
      orderId: order.id,
      method: request.method,
      amount: request.amount,
      tip: request.tip,
      status: 'completed',
      transactionId: request.transactionId,
      createdAt: new Date(),
      completedAt: new Date(),
      metadata: request.metadata
    };

    return payment;
  }

  /**
   * Calculate change due for cash payment
   */
  calculateChange(order: Order, cashReceived: number, tip: number = 0): { change: number; tip: number; totalWithTip: number } {
    const bill = this.calculateBill(order, tip);
    const change = Math.max(0, Math.round((cashReceived - bill.balanceDue) * 100) / 100);
    const actualTip = Math.max(0, Math.round((cashReceived - bill.balanceDue + (bill.amountPaid - bill.total)) * 100) / 100);

    return {
      change,
      tip: actualTip,
      totalWithTip: bill.total
    };
  }

  /**
   * Generate a receipt for an order
   */
  generateReceipt(order: Order, tip: number = 0, includeSplits: boolean = false): Receipt {
    const bill = this.calculateBill(order, tip);

    const receipt: Receipt = {
      orderId: order.id,
      receiptNumber: orderModel.generateReceiptNumber(),
      items: order.items.map(item => ({ ...item })),
      subtotal: bill.subtotal,
      tax: bill.taxAmount,
      discount: bill.discountAmount,
      tip: bill.tip,
      total: bill.total,
      payments: order.payments.map(p => ({ ...p })),
      orderDate: order.createdAt,
      printedAt: new Date()
    };

    if (includeSplits && order.splits.length > 0) {
      receipt.splitInfo = order.splits.map(split => ({
        ...split,
        items: split.items.map(item => ({ ...item }))
      }));
    }

    return receipt;
  }

  /**
   * Generate a receipt for a specific split
   */
  generateSplitReceipt(order: Order, splitId: string, tip: number = 0): Receipt {
    const split = order.splits.find(s => s.id === splitId);
    if (!split) {
      throw new Error(`Split ${splitId} not found`);
    }

    const bill = this.calculateBill(order, tip);
    const splitProportion = split.total / bill.total;
    const splitTip = Math.round(tip * splitProportion * 100) / 100;

    const receipt: Receipt = {
      orderId: order.id,
      receiptNumber: orderModel.generateReceiptNumber(),
      items: split.items.map(item => ({ ...item })),
      subtotal: split.amount,
      tax: split.tax,
      discount: split.discount,
      tip: splitTip,
      total: Math.round((split.total + splitTip) * 100) / 100,
      payments: order.payments
        .filter(p => p.splitId === splitId)
        .map(p => ({ ...p })),
      orderDate: order.createdAt,
      printedAt: new Date(),
      splitInfo: [{
        ...split,
        total: Math.round((split.total + splitTip) * 100) / 100
      }]
    };

    return receipt;
  }

  /**
   * Calculate tip suggestions based on total
   */
  calculateTipSuggestions(total: number): { fifteen: number; eighteen: number; twenty: number; custom: number } {
    return {
      fifteen: Math.round(total * 0.15 * 100) / 100,
      eighteen: Math.round(total * 0.18 * 100) / 100,
      twenty: Math.round(total * 0.20 * 100) / 100,
      custom: Math.round(total * 0.20 * 100) / 100 // Default to 20% as custom
    };
  }

  /**
   * Calculate tax breakdown
   */
  calculateTaxBreakdown(subtotal: number, discount: number = 0): {
    taxableAmount: number;
    taxRate: number;
    taxAmount: number;
  } {
    const taxableAmount = Math.round((subtotal - discount) * 100) / 100;
    const taxAmount = Math.round(taxableAmount * BillingService.TAX_RATE * 100) / 100;

    return {
      taxableAmount,
      taxRate: BillingService.TAX_RATE,
      taxAmount
    };
  }

  private calculateSplitSubtotal(items: OrderItem[]): number {
    return items.reduce((sum, item) => {
      const itemTotal = (item.unitPrice + item.modifierPrice) * item.quantity;
      return sum + itemTotal;
    }, 0);
  }

  private calculateTotalPaid(order: Order): number {
    return order.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  /**
   * Apply a discount to the order
   */
  applyDiscount(order: Order, discount: Discount): { success: boolean; newTotal: number; discountAmount: number } {
    const result = orderModel.applyDiscount(order.id, discount);

    if (!result) {
      return { success: false, newTotal: 0, discountAmount: 0 };
    }

    return {
      success: true,
      newTotal: result.total,
      discountAmount: result.discountAmount
    };
  }

  /**
   * Remove discount from order
   */
  removeDiscount(order: Order): { success: boolean; newTotal: number } {
    const result = orderModel.removeDiscount(order.id);

    if (!result) {
      return { success: false, newTotal: 0 };
    }

    return {
      success: true,
      newTotal: result.total
    };
  }

  /**
   * Validate split request
   */
  validateSplitRequest(request: SplitBillRequest, order: Order): void {
    if (request.type === 'byItem' && (!request.itemIds || request.itemIds.length === 0)) {
      throw new Error('Item IDs are required for split by items');
    }

    if (request.type === 'equal' && (!request.splitCount || request.splitCount < 2)) {
      throw new Error('Split count must be at least 2 for equal split');
    }

    if (request.type === 'byAmount' && (!request.amounts || request.amounts.length === 0)) {
      throw new Error('Amounts are required for split by amount');
    }

    if (request.type === 'byItem') {
      // Verify all item IDs belong to the order
      for (const itemId of request.itemIds || []) {
        if (!order.items.find(i => i.id === itemId)) {
          throw new Error(`Item ${itemId} not found in order`);
        }
      }
    }

    if (request.type === 'byAmount') {
      const bill = this.calculateBill(order);
      const totalAmounts = (request.amounts || []).reduce((sum, a) => sum + a, 0);
      if (Math.abs(bill.total - totalAmounts) > 0.05) {
        throw new Error('Split amounts do not match order total');
      }
    }
  }
}

export const billingService = new BillingService();
