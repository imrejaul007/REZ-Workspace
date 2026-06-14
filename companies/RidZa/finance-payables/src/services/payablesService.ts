/**
 * Payables Service - Business logic for bills, vendors, and payments
 */
import { v4 as uuidv4 } from 'uuid';
import { VendorModel, IVendor } from '../models/Vendor';
import { BillModel, IBill } from '../models/Bill';
import { processPayment, sendNotification, trackEvent } from '../integrations/rabtulClient';
import {
  CreateVendorInput,
  UpdateVendorInput,
  VendorQueryInput,
  CreateBillInput,
  UpdateBillInput,
  BillQueryInput,
  ProcessPaymentInput,
  ScheduleQueryInput,
} from '../validators';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler';
import { PaymentSchedule, CashFlowSuggestion } from '../types';

// ============ VENDOR SERVICE ============

export class VendorService {
  /**
   * Create a new vendor
   */
  async createVendor(input: CreateVendorInput): Promise<IVendor> {
    // Check for duplicate email within tenant
    const existingVendor = await VendorModel.findOne({
      tenantId: input.tenantId,
      email: input.email.toLowerCase(),
    });

    if (existingVendor) {
      throw new ConflictError('Vendor with this email already exists');
    }

    const vendorId = `VND-${uuidv4().slice(0, 8).toUpperCase()}`;

    const vendor = new VendorModel({
      vendorId,
      tenantId: input.tenantId,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      gstin: input.gstin,
      pan: input.pan,
      address: input.address,
      bankDetails: input.bankDetails,
      paymentTerms: input.paymentTerms ?? 'net30',
      customPaymentDays: input.customPaymentDays,
      creditLimit: input.creditLimit ?? 0,
      currentBalance: 0,
      category: input.category,
      notes: input.notes,
      status: 'active',
    });

    await vendor.save();

    // Track event
    await trackEvent('vendor_created', {
      vendorId,
      tenantId: input.tenantId,
      name: input.name,
    });

    return vendor;
  }

  /**
   * List vendors for a tenant with filtering and pagination
   */
  async listVendors(tenantId: string, query: VendorQueryInput): Promise<{
    vendors: IVendor[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const filter: Record<string, unknown> = { tenantId };

    if (query.status) {
      filter['status'] = query.status;
    }

    if (query.category) {
      filter['category'] = query.category;
    }

    if (query.search) {
      filter['$or'] = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { gstin: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [vendors, total] = await Promise.all([
      VendorModel.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VendorModel.countDocuments(filter),
    ]);

    return {
      vendors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single vendor by ID
   */
  async getVendor(tenantId: string, vendorId: string): Promise<IVendor> {
    const vendor = await VendorModel.findOne({ tenantId, vendorId }).lean();

    if (!vendor) {
      throw new NotFoundError('Vendor');
    }

    return vendor;
  }

  /**
   * Update a vendor
   */
  async updateVendor(
    tenantId: string,
    vendorId: string,
    input: UpdateVendorInput
  ): Promise<IVendor> {
    const vendor = await VendorModel.findOne({ tenantId, vendorId });

    if (!vendor) {
      throw new NotFoundError('Vendor');
    }

    // Check for email conflict
    if (input.email && input.email !== vendor.email) {
      const existing = await VendorModel.findOne({
        tenantId,
        email: input.email.toLowerCase(),
        vendorId: { $ne: vendorId },
      });

      if (existing) {
        throw new ConflictError('Vendor with this email already exists');
      }
    }

    // Update fields
    Object.assign(vendor, input);
    if (input.email) {
      vendor.email = input.email.toLowerCase();
    }

    await vendor.save();

    await trackEvent('vendor_updated', {
      vendorId,
      tenantId,
      updatedFields: Object.keys(input),
    });

    return vendor;
  }

  /**
   * Delete a vendor (soft delete - set to inactive)
   */
  async deleteVendor(tenantId: string, vendorId: string): Promise<void> {
    const vendor = await VendorModel.findOne({ tenantId, vendorId });

    if (!vendor) {
      throw new NotFoundError('Vendor');
    }

    // Check if vendor has pending bills
    const pendingBills = await BillModel.countDocuments({
      tenantId,
      vendorId,
      status: { $in: ['pending', 'approved', 'scheduled'] },
    });

    if (pendingBills > 0) {
      throw new ValidationError(
        `Cannot delete vendor with ${pendingBills} pending bill(s). Settle bills first.`
      );
    }

    // Soft delete - set status to inactive
    vendor.status = 'inactive';
    await vendor.save();

    await trackEvent('vendor_deleted', {
      vendorId,
      tenantId,
    });
  }
}

// ============ BILL SERVICE ============

export class BillService {
  /**
   * Create a new bill
   */
  async createBill(input: CreateBillInput): Promise<IBill> {
    // Verify vendor exists and is active
    const vendor = await VendorModel.findOne({
      tenantId: input.tenantId,
      vendorId: input.vendorId,
      status: 'active',
    });

    if (!vendor) {
      throw new ValidationError('Invalid or inactive vendor');
    }

    const billId = `BILL-${uuidv4().slice(0, 8).toUpperCase()}`;

    const bill = new BillModel({
      billId,
      tenantId: input.tenantId,
      vendorId: input.vendorId,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: new Date(input.invoiceDate),
      dueDate: new Date(input.dueDate),
      amount: input.amount,
      taxAmount: input.taxAmount ?? 0,
      totalAmount: input.totalAmount,
      currency: input.currency ?? 'INR',
      category: input.category,
      description: input.description,
      lineItems: input.lineItems,
      attachments: input.attachments,
      notes: input.notes,
      status: 'pending',
    });

    await bill.save();

    // Update vendor balance
    await VendorModel.updateOne(
      { tenantId: input.tenantId, vendorId: input.vendorId },
      { $inc: { currentBalance: input.totalAmount } }
    );

    await trackEvent('bill_created', {
      billId,
      tenantId: input.tenantId,
      vendorId: input.vendorId,
      amount: input.totalAmount,
    });

    return bill;
  }

  /**
   * List bills for a tenant with filtering and pagination
   */
  async listBills(tenantId: string, query: BillQueryInput): Promise<{
    bills: IBill[];
    total: number;
    page: number;
    totalPages: number;
    summary: {
      totalAmount: number;
      pendingAmount: number;
      overdueAmount: number;
      paidAmount: number;
    };
  }> {
    const filter: Record<string, unknown> = { tenantId };

    if (query.vendorId) {
      filter['vendorId'] = query.vendorId;
    }

    if (query.status) {
      filter['status'] = query.status;
    }

    if (query.category) {
      filter['category'] = query.category;
    }

    if (query.fromDate || query.toDate) {
      filter['invoiceDate'] = {};
      if (query.fromDate) {
        (filter['invoiceDate'] as Record<string, Date>)['$gte'] = new Date(query.fromDate);
      }
      if (query.toDate) {
        (filter['invoiceDate'] as Record<string, Date>)['$lte'] = new Date(query.toDate);
      }
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [bills, total] = await Promise.all([
      BillModel.find(filter)
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BillModel.countDocuments(filter),
    ]);

    // Calculate summary
    const summaryFilter = { tenantId };
    if (query.vendorId) {
      summaryFilter['vendorId'] = query.vendorId;
    }

    const aggregation = await BillModel.aggregate([
      { $match: summaryFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          pendingAmount: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'approved', 'scheduled']] }, '$totalAmount', 0] },
          },
          overdueAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, '$totalAmount', 0] },
          },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0] },
          },
        },
      },
    ]);

    const summary = aggregation[0] ?? {
      totalAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      paidAmount: 0,
    };

    return {
      bills,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary,
    };
  }

  /**
   * Get a single bill by ID
   */
  async getBill(tenantId: string, billId: string): Promise<IBill> {
    const bill = await BillModel.findOne({ tenantId, billId }).lean();

    if (!bill) {
      throw new NotFoundError('Bill');
    }

    return bill;
  }

  /**
   * Update a bill
   */
  async updateBill(
    tenantId: string,
    billId: string,
    input: UpdateBillInput
  ): Promise<IBill> {
    const bill = await BillModel.findOne({ tenantId, billId });

    if (!bill) {
      throw new NotFoundError('Bill');
    }

    // Cannot update paid bills
    if (bill.status === 'paid') {
      throw new ValidationError('Cannot update a paid bill');
    }

    // If vendor changed, verify new vendor
    if (input.vendorId && input.vendorId !== bill.vendorId) {
      const vendor = await VendorModel.findOne({
        tenantId,
        vendorId: input.vendorId,
        status: 'active',
      });

      if (!vendor) {
        throw new ValidationError('Invalid or inactive vendor');
      }
    }

    // Calculate balance change if amount changed
    const oldAmount = bill.totalAmount;
    let amountChanged = false;

    // Update fields
    if (input.invoiceDate) bill.invoiceDate = new Date(input.invoiceDate);
    if (input.dueDate) bill.dueDate = new Date(input.dueDate);
    if (input.amount !== undefined) {
      bill.amount = input.amount;
      amountChanged = true;
    }
    if (input.taxAmount !== undefined) bill.taxAmount = input.taxAmount;
    if (input.totalAmount !== undefined) {
      bill.totalAmount = input.totalAmount;
      amountChanged = true;
    }
    if (input.vendorId) bill.vendorId = input.vendorId;
    if (input.invoiceNumber) bill.invoiceNumber = input.invoiceNumber;
    if (input.currency) bill.currency = input.currency;
    if (input.category) bill.category = input.category;
    if (input.description) bill.description = input.description;
    if (input.lineItems) bill.lineItems = input.lineItems;
    if (input.attachments) bill.attachments = input.attachments;
    if (input.notes) bill.notes = input.notes;
    if (input.status) bill.status = input.status;

    await bill.save();

    // Update vendor balance if amount changed
    if (amountChanged) {
      const balanceChange = bill.totalAmount - oldAmount;
      await VendorModel.updateOne(
        { tenantId, vendorId: bill.vendorId },
        { $inc: { currentBalance: balanceChange } }
      );
    }

    await trackEvent('bill_updated', {
      billId,
      tenantId,
      updatedFields: Object.keys(input),
    });

    return bill;
  }

  /**
   * Process payment for a bill
   */
  async processBillPayment(
    tenantId: string,
    billId: string,
    userId: string,
    input: ProcessPaymentInput
  ): Promise<IBill> {
    const bill = await BillModel.findOne({ tenantId, billId });

    if (!bill) {
      throw new NotFoundError('Bill');
    }

    // Cannot pay already paid bills
    if (bill.status === 'paid') {
      throw new ValidationError('Bill is already paid');
    }

    // Cannot pay cancelled bills
    if (bill.status === 'cancelled') {
      throw new ValidationError('Cannot pay a cancelled bill');
    }

    const paymentAmount = input.amount ?? bill.totalAmount;

    // Validate payment amount
    if (paymentAmount > bill.totalAmount) {
      throw new ValidationError('Payment amount exceeds bill total');
    }

    // Get vendor for payment details
    const vendor = await VendorModel.findOne({ tenantId, vendorId: bill.vendorId });
    if (!vendor) {
      throw new ValidationError('Vendor not found');
    }

    // If scheduled for future, update bill status
    if (input.scheduledDate) {
      const scheduledDate = new Date(input.scheduledDate);
      if (scheduledDate > new Date()) {
        bill.scheduledPaymentDate = scheduledDate;
        bill.status = 'scheduled';
        bill.paymentMethod = input.paymentMethod;
        bill.paymentReference = input.paymentReference;
        bill.notes = input.notes ? `${bill.notes}\n${input.notes}` : input.notes;

        await bill.save();

        await trackEvent('bill_scheduled', {
          billId,
          tenantId,
          scheduledDate: scheduledDate.toISOString(),
          amount: paymentAmount,
        });

        return bill;
      }
    }

    // Process immediate payment via RABTUL Payment service
    try {
      const paymentResult = await processPayment({
        amount: paymentAmount,
        currency: bill.currency,
        fromAccount: 'payables-account',
        toAccount: vendor.bankDetails?.accountNumber,
        toBank: vendor.bankDetails?.bankName,
        reference: input.paymentReference ?? bill.invoiceNumber,
        description: `Payment for Bill ${bill.invoiceNumber}`,
        metadata: {
          billId,
          vendorId: bill.vendorId,
          tenantId,
          processedBy: userId,
        },
      });

      // Update bill with payment details
      bill.paidDate = new Date();
      bill.paidAmount = (bill.paidAmount ?? 0) + paymentAmount;
      bill.paymentReference = paymentResult.reference ?? input.paymentReference;
      bill.paymentMethod = input.paymentMethod;
      bill.status = paymentAmount >= bill.totalAmount ? 'paid' : 'pending';
      bill.notes = input.notes ? `${bill.notes}\n${input.notes}` : input.notes;

      await bill.save();

      // Update vendor balance
      await VendorModel.updateOne(
        { tenantId, vendorId: bill.vendorId },
        { $inc: { currentBalance: -paymentAmount } }
      );

      await trackEvent('bill_paid', {
        billId,
        tenantId,
        amount: paymentAmount,
        paymentMethod: input.paymentMethod,
        paymentReference: bill.paymentReference,
      });

      // Send notification
      await sendNotification(userId, {
        type: 'payment_success',
        title: 'Payment Processed',
        message: `Payment of ${bill.currency} ${paymentAmount.toLocaleString()} processed for bill ${bill.invoiceNumber}`,
        data: {
          billId,
          amount: paymentAmount,
          vendorName: vendor.name,
        },
      });

      return bill;
    } catch (error) {
      // Log and re-throw payment errors
      console.error('Payment processing failed:', error);
      throw new ValidationError('Payment processing failed. Please try again.');
    }
  }
}

// ============ SCHEDULE SERVICE ============

export class ScheduleService {
  /**
   * Get payment schedule with cash flow optimization suggestions
   */
  async getPaymentSchedule(
    tenantId: string,
    query: ScheduleQueryInput
  ): Promise<PaymentSchedule> {
    const now = new Date();
    const weekStart = query.fromDate ? new Date(query.fromDate) : now;
    const weekEnd = query.toDate
      ? new Date(query.toDate)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default: 30 days

    // Build filter for bills
    const filter: Record<string, unknown> = {
      tenantId,
      status: { $in: ['pending', 'approved', 'scheduled', 'overdue'] },
      dueDate: { $gte: weekStart, $lte: weekEnd },
    };

    if (query.vendorId) {
      filter['vendorId'] = query.vendorId;
    }

    // Fetch bills with vendor info
    const bills = await BillModel.find(filter)
      .sort({ dueDate: 1 })
      .lean();

    const vendors = await VendorModel.find({
      tenantId,
      status: 'active',
    }).lean();

    const vendorMap = new Map(vendors.map(v => [v.vendorId, v]));

    // Build scheduled payments
    const scheduledPayments = bills.map(bill => {
      const vendor = vendorMap.get(bill.vendorId);
      const dueDate = new Date(bill.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Determine priority based on days until due
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (daysUntilDue <= 3) priority = 'high';
      else if (daysUntilDue > 14) priority = 'low';

      // Suggest optimal payment date (take advantage of payment terms)
      let scheduledDate = new Date(dueDate);
      if (vendor && vendor.paymentTerms !== 'immediate') {
        const daysToSubtract = this.getPaymentTermsDays(vendor.paymentTerms, vendor.customPaymentDays);
        scheduledDate = new Date(dueDate.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
        if (scheduledDate < now) scheduledDate = now;
      }

      return {
        billId: bill.billId,
        vendorId: bill.vendorId,
        vendorName: vendor?.name ?? 'Unknown Vendor',
        amount: bill.totalAmount,
        dueDate,
        scheduledDate,
        priority,
      };
    });

    // Generate cash flow suggestions
    const suggestions = query.includeSuggestions
      ? this.generateCashFlowSuggestions(bills, vendorMap, scheduledPayments)
      : [];

    const totalAmount = scheduledPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      tenantId,
      weekStart,
      weekEnd,
      scheduledPayments,
      totalAmount,
      cashFlowSuggestions: suggestions,
    };
  }

  private getPaymentTermsDays(
    paymentTerms: string,
    customDays?: number
  ): number {
    switch (paymentTerms) {
      case 'immediate': return 0;
      case 'net15': return 15;
      case 'net30': return 30;
      case 'net45': return 45;
      case 'net60': return 60;
      case 'custom': return customDays ?? 30;
      default: return 30;
    }
  }

  private generateCashFlowSuggestions(
    bills: Array<{ billId: string; vendorId: string; totalAmount: number; dueDate: Date; status: string }>,
    vendorMap: Map<string, { name: string; paymentTerms: string }>,
    scheduledPayments: Array<{ billId: string; amount: number; scheduledDate: Date }>
  ): CashFlowSuggestion[] {
    const suggestions: CashFlowSuggestion[] = [];
    const now = new Date();

    // Group bills by vendor for consolidation suggestions
    const vendorBills = new Map<string, typeof bills>();
    for (const bill of bills) {
      const existing = vendorBills.get(bill.vendorId) ?? [];
      existing.push(bill);
      vendorBills.set(bill.vendorId, existing);
    }

    // Consolidation suggestions
    for (const [vendorId, vendorBillsList] of vendorBills) {
      if (vendorBillsList.length >= 2) {
        const vendor = vendorMap.get(vendorId);
        const totalAmount = vendorBillsList.reduce((sum, b) => sum + b.totalAmount, 0);
        suggestions.push({
          type: 'consolidation',
          vendorId,
          description: `Consolidate ${vendorBillsList.length} payments to ${vendor?.name ?? vendorId} (${vendor?.paymentTerms ?? 'net30'}) into single payment of ${totalAmount.toLocaleString()}`,
          impact: vendorBillsList.length >= 3 ? 'high' : 'medium',
        });
      }
    }

    // Early payment suggestions (for overdue bills)
    for (const bill of bills) {
      if (bill.status === 'overdue') {
        const vendor = vendorMap.get(bill.vendorId);
        suggestions.push({
          type: 'early_payment',
          billId: bill.billId,
          vendorId: bill.vendorId,
          description: `Pay overdue bill to ${vendor?.name ?? 'vendor'} immediately to avoid penalties`,
          impact: 'high',
        });
      }
    }

    // Delayed payment suggestions (for future bills with low priority)
    const lowPriorityBills = scheduledPayments.filter(p => p.scheduledDate > now);
    const totalLowPriority = lowPriorityBills.reduce((sum, p) => sum + p.amount, 0);
    if (totalLowPriority > 100000) {
      suggestions.push({
        type: 'delayed_payment',
        description: `Consider delaying ${scheduledPayments.filter(p => p.scheduledDate > new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)).length} low-priority payments to improve cash position`,
        potentialSavings: totalLowPriority * 0.005, // Rough estimate of interest saved
        impact: 'medium',
      });
    }

    // Sort by impact
    return suggestions.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  }
}

// Export service instances
export const vendorService = new VendorService();
export const billService = new BillService();
export const scheduleService = new ScheduleService();

export default {
  vendorService,
  billService,
  scheduleService,
};