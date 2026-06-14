/**
 * Tally/ERP Export Service
 * Generates Tally-compatible XML format for accounting software integration
 * Supports: Sales invoices, Purchase data, Expenses, GST data (GSTR1, GSTR3B)
 */

import mongoose, { Types } from 'mongoose';
import { Order } from '../models/Order';
import { Store } from '../models/Store';
import { Merchant } from '../models/Merchant';
import { Expense } from '../models/Expense';

// Tally XML format types
export interface TallyVoucher {
  voucherKey: string;
  voucherType: string;
  voucherNumber: string;
  date: string;
  partyLedgerName: string;
  ledgerEntries: TallyLedgerEntry[];
  inventoryEntries?: TallyInventoryEntry[];
}

export interface TallyLedgerEntry {
  ledgerName: string;
  amount: number;
  isDebit: boolean;
  gstType?: string;
  rate?: number;
}

export interface TallyInventoryEntry {
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  batchAllocations?: {
    batchName: string;
    quantity: number;
    godown?: string;
  }[];
}

// GST Data types
export interface GSTR1Record {
  invoiceNumber: string;
  invoiceDate: string;
  customerGstin: string;
  customerName: string;
  invoiceValue: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  placeOfSupply: string;
  reverseCharge: boolean;
  invoiceType: string;
}

export interface GSTR3BRecord {
  period: string;
  gstin: string;
  taxpayerName: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalTax: number;
  interStateSupplies: {
    taxableValue: number;
    amount: number;
  };
  intraStateSupplies: {
    taxableValue: number;
    amount: number;
  };
  nilRatedSupplies: number;
  exemptedSupplies: number;
  nonGstSupplies: number;
}

// Configuration constants
const TALLY_COMPANY_HEADER = `<HEADER>
<VERSION>1</VERSION>
< Tanjastamp="No">
<TallBaseLang>en-IN</TallBaseLang>
</HEADER>`;

const GST_RATE_MAPPING: Record<number, { cgst: number; sgst: number; igst: number }> = {
  0: { cgst: 0, sgst: 0, igst: 0 },
  5: { cgst: 2.5, sgst: 2.5, igst: 5 },
  12: { cgst: 6, sgst: 6, igst: 12 },
  18: { cgst: 9, sgst: 9, igst: 18 },
  28: { cgst: 14, sgst: 14, igst: 28 },
};

export class TallyExportService {
  /**
   * Generate Tally XML for sales invoices
   */
  static async generateSalesXML(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const store = await Store.findOne({ _id: storeId, merchantId });
    if (!store) {
      throw new Error('Store not found');
    }

    const merchant = await Merchant.findById(merchantId).lean();
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const orders = await Order.find({
      store: storeId,
      createdAt: { $gte: startDate, $lt: endDate },
      status: { $in: ['delivered', 'completed'] },
    }).lean();

    const vouchers = await this.ordersToVouchers(orders, store, merchant);

    return this.generateTallyXML(vouchers, 'Sales');
  }

  /**
   * Generate Tally XML for purchase data
   */
  static async generatePurchaseXML(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const store = await Store.findOne({ _id: storeId, merchantId });
    if (!store) {
      throw new Error('Store not found');
    }

    const merchant = await Merchant.findById(merchantId).lean();
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Get expenses that are purchases (category includes 'purchase' or 'supplier')
    const purchases = await Expense.find({
      merchantId,
      storeId,
      date: { $gte: startDate, $lt: endDate },
      category: { $in: ['purchase', 'supplier', 'inventory', 'stock'] },
    }).lean();

    const vouchers = this.expensesToVouchers(purchases, store, merchant);

    return this.generateTallyXML(vouchers, 'Purchase');
  }

  /**
   * Generate Tally XML for expenses
   */
  static async generateExpenseXML(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const store = await Store.findOne({ _id: storeId, merchantId });
    if (!store) {
      throw new Error('Store not found');
    }

    const merchant = await Merchant.findById(merchantId).lean();
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const expenses = await Expense.find({
      merchantId,
      storeId,
      date: { $gte: startDate, $lt: endDate },
    }).lean();

    const vouchers = this.expensesToVouchers(expenses, store, merchant);

    return this.generateTallyXML(vouchers, 'Payment');
  }

  /**
   * Generate GSTR-1 data for a period
   */
  static async generateGSTR1(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    month: number,
    year: number
  ): Promise<{ data: GSTR1Record[]; summary: unknown }> {
    const store = await Store.findOne({ _id: storeId, merchantId });
    if (!store) {
      throw new Error('Store not found');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const orders = await Order.find({
      store: storeId,
      createdAt: { $gte: startDate, $lt: endDate },
      status: { $in: ['delivered', 'completed', 'paid'] },
    }).lean();

    const gstr1Records: GSTR1Record[] = orders.map((order) => {
      const subtotal = order.totals?.subtotal || 0;
      const tax = order.totals?.tax || 0;
      const total = order.totals?.total || 0;

      // Calculate CGST/SGST/IGST (assuming intra-state, split evenly)
      const cgst = tax / 2;
      const sgst = tax / 2;
      const igst = 0;
      const cess = 0;

      // Determine invoice type based on amount (B2B if > 250000)
      const invoiceType = total > 250000 ? 'B2B' : 'B2C';

      return {
        invoiceNumber: order.orderNumber,
        invoiceDate: new Date(order.createdAt).toISOString().split('T')[0],
        customerGstin: 'URP', // Unregistered Person for B2C
        customerName: order.user?.toString() || 'Cash Customer',
        invoiceValue: total,
        taxableValue: subtotal,
        cgst,
        sgst,
        igst,
        cess,
        placeOfSupply: store.location?.state || 'Unknown',
        reverseCharge: false,
        invoiceType,
      };
    });

    const summary = {
      totalInvoices: gstr1Records.length,
      totalTaxableValue: gstr1Records.reduce((sum, r) => sum + r.taxableValue, 0),
      totalCGST: gstr1Records.reduce((sum, r) => sum + r.cgst, 0),
      totalSGST: gstr1Records.reduce((sum, r) => sum + r.sgst, 0),
      totalIGST: gstr1Records.reduce((sum, r) => sum + r.igst, 0),
      totalCess: gstr1Records.reduce((sum, r) => sum + r.cess, 0),
      totalInvoiceValue: gstr1Records.reduce((sum, r) => sum + r.invoiceValue, 0),
    };

    return { data: gstr1Records, summary };
  }

  /**
   * Generate GSTR-3B data for a period
   */
  static async generateGSTR3B(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    month: number,
    year: number
  ): Promise<GSTR3BRecord> {
    const store = await Store.findOne({ _id: storeId, merchantId });
    if (!store) {
      throw new Error('Store not found');
    }

    const merchant = await Merchant.findById(merchantId).lean();
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const orders = await Order.aggregate([
      {
        $match: {
          store: new mongoose.Types.ObjectId(storeId.toString()),
          createdAt: { $gte: startDate, $lt: endDate },
          status: { $in: ['delivered', 'completed', 'paid'] },
        },
      },
      {
        $group: {
          _id: null,
          totalSubtotal: { $sum: '$totals.subtotal' },
          totalTax: { $sum: '$totals.tax' },
          totalDelivery: { $sum: '$totals.delivery' },
          totalDiscount: { $sum: '$totals.discount' },
          totalRevenue: { $sum: '$totals.total' },
          count: { $sum: 1 },
        },
      },
    ]);

    const orderStats = orders[0] || {
      totalSubtotal: 0,
      totalTax: 0,
      totalDelivery: 0,
      totalDiscount: 0,
      totalRevenue: 0,
      count: 0,
    };

    const taxableValue = orderStats.totalSubtotal;
    const totalTax = orderStats.totalTax;
    const state = store.location?.state || '';

    // Assume intra-state unless GST number indicates otherwise
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    const igst = 0;
    const cess = 0;

    const gstr3b: GSTR3BRecord = {
      period: `${month.toString().padStart(2, '0')}-${year}`,
      gstin: store.gstNumber || merchant.onboarding?.stepData?.businessInfo?.gstNumber || '',
      taxpayerName: store.name || merchant.businessName,
      taxableValue,
      cgst,
      sgst,
      igst,
      cess,
      totalTax: cgst + sgst + igst + cess,
      interStateSupplies: {
        taxableValue: 0, // No IGST for intra-state
        amount: 0,
      },
      intraStateSupplies: {
        taxableValue,
        amount: totalTax,
      },
      nilRatedSupplies: 0,
      exemptedSupplies: 0,
      nonGstSupplies: orderStats.totalDelivery || 0,
    };

    return gstr3b;
  }

  /**
   * Generate comprehensive sales report for accounting
   */
  static async generateSalesReport(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<{
    sales: unknown[];
    purchases: unknown[];
    expenses: unknown[];
    summary;
  }> {
    const [salesOrders, purchaseExpenses, otherExpenses] = await Promise.all([
      Order.find({
        store: storeId,
        createdAt: { $gte: startDate, $lt: endDate },
        status: { $in: ['delivered', 'completed'] },
      }).lean(),
      Expense.find({
        merchantId,
        storeId,
        date: { $gte: startDate, $lt: endDate },
        category: { $in: ['purchase', 'supplier', 'inventory', 'stock'] },
      }).lean(),
      Expense.find({
        merchantId,
        storeId,
        date: { $gte: startDate, $lt: endDate },
        category: { $nin: ['purchase', 'supplier', 'inventory', 'stock'] },
      }).lean(),
    ]);

    const sales = salesOrders.map((order) => ({
      date: order.createdAt,
      reference: order.orderNumber,
      type: 'Sale',
      description: `Order - ${order.orderNumber}`,
      amount: order.totals?.total || 0,
      tax: order.totals?.tax || 0,
      paymentMethod: order.payment?.method || 'unknown',
      status: order.status,
    }));

    const purchases = purchaseExpenses.map((expense) => ({
      date: expense.date,
      reference: expense._id.toString().slice(-8),
      type: 'Purchase',
      description: expense.title || expense.description || 'Purchase',
      amount: expense.amount || 0,
      category: expense.category,
      vendor: expense.vendor,
    }));

    const expenses = otherExpenses.map((expense) => ({
      date: expense.date,
      reference: expense._id.toString().slice(-8),
      type: 'Expense',
      description: expense.title || expense.description || 'Expense',
      amount: expense.amount || 0,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
    }));

    const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
    const totalTax = sales.reduce((sum, s) => sum + s.tax, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      sales,
      purchases,
      expenses,
      summary: {
        period: { start: startDate, end: endDate },
        totalSales,
        totalTax,
        totalPurchases,
        totalExpenses,
        netIncome: totalSales - totalPurchases - totalExpenses,
        salesCount: sales.length,
        purchaseCount: purchases.length,
        expenseCount: expenses.length,
      },
    };
  }

  /**
   * Convert orders to Tally vouchers
   */
  private static async ordersToVouchers(
    orders: unknown[],
    store,
    merchant: unknown
  ): Promise<TallyVoucher[]> {
    const vouchers: TallyVoucher[] = [];

    for (const order of orders) {
      const subtotal = order.totals?.subtotal || 0;
      const tax = order.totals?.tax || 0;
      const delivery = order.totals?.delivery || 0;
      const discount = order.totals?.discount || 0;
      const total = order.totals?.total || 0;

      const voucherNumber = order.orderNumber || `ORD-${order._id.toString().slice(-6)}`;
      const voucherDate = new Date(order.createdAt).toISOString().split('T')[0].replace(/-/g, '');

      // Split tax into CGST and SGST (intra-state)
      const cgst = tax / 2;
      const sgst = tax / 2;

      const voucher: TallyVoucher = {
        voucherKey: order._id.toString(),
        voucherType: 'Sales',
        voucherNumber,
        date: voucherDate,
        partyLedgerName: 'Cash', // Default to Cash for B2C
        ledgerEntries: [
          // Debit entry - Customer/Party
          {
            ledgerName: 'Sundry Debtors',
            amount: total,
            isDebit: true,
          },
          // Credit entry - Sales (taxable value only)
          {
            ledgerName: 'Sales',
            amount: -(subtotal),
            isDebit: false,
          },
          // Credit entry - CGST
          {
            ledgerName: 'Output CGST',
            amount: -cgst,
            isDebit: false,
            gstType: 'CGST',
            rate: 9,
          },
          // Credit entry - SGST
          {
            ledgerName: 'Output SGST',
            amount: -sgst,
            isDebit: false,
            gstType: 'SGST',
            rate: 9,
          },
        ],
      };

      // Add delivery as separate entry if present
      if (delivery > 0) {
        voucher.ledgerEntries.push({
          ledgerName: 'Delivery Charges',
          amount: -delivery,
          isDebit: false,
        });
      }

      // Add discount as negative entry
      if (discount > 0) {
        voucher.ledgerEntries.push({
          ledgerName: 'Sales Discount',
          amount: discount,
          isDebit: false,
        });
      }

      // Add inventory entries
      if (order.items && order.items.length > 0) {
        voucher.inventoryEntries = order.items.map((item) => ({
          itemName: item.name || 'Unknown Item',
          quantity: item.quantity || 1,
          rate: item.price || 0,
          amount: item.subtotal || item.price * item.quantity,
        }));
      }

      vouchers.push(voucher);
    }

    return vouchers;
  }

  /**
   * Convert expenses to Tally vouchers
   */
  private static expensesToVouchers(
    expenses: unknown[],
    store,
    merchant: unknown
  ): TallyVoucher[] {
    return expenses.map((expense) => {
      const amount = expense.amount || 0;
      const expenseDate = new Date(expense.date).toISOString().split('T')[0].replace(/-/g, '');
      const voucherNumber = `EXP-${expense._id.toString().slice(-6)}`;

      // Map expense category to Tally ledger
      const categoryLedgerMap: Record<string, string> = {
        rent: 'Rent',
        utilities: 'Electricity & Water',
        salaries: 'Salaries & Wages',
        supplies: 'Office Supplies',
        marketing: 'Advertising & Marketing',
        travel: 'Travel & Conveyance',
        communication: 'Telephone & Internet',
        insurance: 'Insurance',
        maintenance: 'Repairs & Maintenance',
        purchase: 'Purchases',
        supplier: 'Sundry Creditors',
        inventory: 'Inventory',
        stock: 'Stock',
        default: 'General Expenses',
      };

      const expenseLedger = categoryLedgerMap[expense.category?.toLowerCase()] || categoryLedgerMap.default;

      return {
        voucherKey: expense._id.toString(),
        voucherType: 'Payment',
        voucherNumber,
        date: expenseDate,
        partyLedgerName: expense.vendor || expenseLedger,
        ledgerEntries: [
          // Debit entry - Expense account
          {
            ledgerName: expenseLedger,
            amount,
            isDebit: true,
          },
          // Credit entry - Cash/Bank or Party
          {
            ledgerName: expense.paymentMethod === 'online' ? 'Bank Account' : 'Cash',
            amount: -amount,
            isDebit: false,
          },
        ],
      };
    });
  }

  /**
   * Generate Tally XML from vouchers
   */
  private static generateTallyXML(vouchers: TallyVoucher[], defaultType: string): string {
    const voucherXml = vouchers
      .map((v) => this.generateVoucherXML(v))
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<DATA>
${TALLY_COMPANY_HEADER}
<BODY>
<IMPORTDATA>
<REQUESTDESC>
<REPORTNAME>${defaultType}</REPORTNAME>
<STATICVARIABLES>
<SVCURRENTCOMPANY>REZ Merchant</SVCURRENTCOMPANY>
</STATICVARIABLES>
</REQUESTDESC>
<REQUESTDATA>
${voucherXml}
</REQUESTDATA>
</IMPORTDATA>
</BODY>
</DATA>`;
  }

  /**
   * Generate XML for a single voucher
   */
  private static generateVoucherXML(voucher: TallyVoucher): string {
    const ledgerEntries = voucher.ledgerEntries
      .map((entry) => {
        const amountStr = Math.abs(entry.amount).toFixed(2);
        const amountType = entry.isDebit ? 'Dr' : 'Cr';
        const gstFields = entry.gstType
          ? `\n          <GSTREMOVEIGSTONEFSAMT>No</GSTREMOVEIGSTONEFSAMT>\n          <GSTBASAMOUNT>${amountStr}</GSTBASAMOUNT>\n          <GSTRATE>${entry.rate || 0}</GSTRATE>`
          : '';

        return `        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${this.escapeXml(entry.ledgerName)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>${entry.isDebit ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
          <AMOUNT>${amountStr}${amountType}${gstFields}
          </AMOUNT>
        </ALLLEDGERENTRIES.LIST>`;
      })
      .join('');

    const inventoryEntries = voucher.inventoryEntries
      ? voucher.inventoryEntries
          .map((entry) => {
            return `        <INVENTORYENTRIES.LIST>
          <STOCKITEMNAME>${this.escapeXml(entry.itemName)}</STOCKITEMNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>${entry.amount.toFixed(2)}Dr</AMOUNT>
          <ACTUALQTY>${entry.quantity}</ACTUALQTY>
          <RATE>${entry.rate.toFixed(2)}</RATE>
        </INVENTORYENTRIES.LIST>`;
          })
          .join('')
      : '';

    return `      <VOUCHER>
        <VOUCHERTYPENAME>${voucher.voucherType}</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${this.escapeXml(voucher.voucherNumber)}</VOUCHERNUMBER>
        <DATE>${voucher.date}</DATE>
        <PARTYLEDGERNAME>${this.escapeXml(voucher.partyLedgerName)}</PARTYLEDGERNAME>
        <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
        <VCHSTATUSVOUCHERTYPE>${voucher.voucherType}</VCHSTATUSVOUCHERTYPE>
${ledgerEntries}
${inventoryEntries}
      </VOUCHER>`;
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate CSV format for sales data
   */
  static async generateSalesCSV(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const orders = await Order.find({
      store: storeId,
      createdAt: { $gte: startDate, $lt: endDate },
      status: { $in: ['delivered', 'completed'] },
    }).lean();

    const headers = [
      'Date',
      'Invoice Number',
      'Customer',
      'Subtotal',
      'Tax',
      'Delivery',
      'Discount',
      'Total',
      'Payment Method',
      'Status',
    ];

    const rows = orders.map((order) => {
      return [
        new Date(order.createdAt).toISOString().split('T')[0],
        order.orderNumber,
        order.user?.toString() || 'Cash Customer',
        (order.totals?.subtotal || 0).toFixed(2),
        (order.totals?.tax || 0).toFixed(2),
        (order.totals?.delivery || 0).toFixed(2),
        (order.totals?.discount || 0).toFixed(2),
        (order.totals?.total || 0).toFixed(2),
        order.payment?.method || 'unknown',
        order.status,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csvContent;
  }
}

export default TallyExportService;
