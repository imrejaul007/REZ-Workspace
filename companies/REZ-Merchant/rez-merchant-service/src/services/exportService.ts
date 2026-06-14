/**
 * Export Service
 * Provides unified export functionality for Tally XML, Excel, CSV, and GST reports
 * Supports: Sales, Inventory, Ledger, and GSTR-1 formats
 */

import mongoose, { Types } from 'mongoose';
import { Order } from '../models/Order';
import { Store } from '../models/Store';
import { Merchant } from '../models/Merchant';
import { Expense } from '../models/Expense';
import { Product } from '../models/Product';

// Type definitions
export type ExportType = 'sales' | 'inventory' | 'ledger';
export type ExportFormat = 'tally' | 'excel' | 'csv' | 'json';

export interface ExportOptions {
  merchantId: string;
  storeId?: string;
  from: Date;
  to: Date;
  format: ExportFormat;
  type: ExportType;
}

export interface ExportResult {
  success: boolean;
  data?: string | Buffer | Uint8Array;
  filename?: string;
  contentType?: string;
  error?: string;
}

export interface TransactionRecord {
  id: string;
  date: Date;
  type: string;
  reference: string;
  description: string;
  amount: number;
  tax?: number;
  paymentMethod?: string;
  customerName?: string;
  gstin?: string;
}

export interface InventoryRecord {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  mrp: number;
  stockValue: number;
}

export interface LedgerRecord {
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
  balance: number;
  transactions: TransactionRecord[];
}

export interface GSTR1Data {
  b2b: B2BInvoice[];
  b2cl: B2CLInvoice[];
  b2cs: B2CSData[];
  summary: GSTR1Summary;
}

export interface B2BInvoice {
  gstin: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  taxableValue: number;
  rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  placeOfSupply: string;
  reverseCharge: boolean;
}

export interface B2CLInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  taxableValue: number;
  rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  state: string;
}

export interface B2CSData {
  state: string;
  supplyType: string;
  rate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
}

export interface GSTR1Summary {
  totalInvoices: number;
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalCess: number;
  totalInvoiceValue: number;
}

// Lean document types for .lean() queries
export interface LeanOrder {
  _id: Types.ObjectId;
  orderNumber?: string;
  user?: Types.ObjectId;
  store: Types.ObjectId;
  createdAt: Date;
  totals?: {
    subtotal?: number;
    tax?: number;
    delivery?: number;
    discount?: number;
    total?: number;
  };
  payment?: {
    method?: string;
  };
  status?: string;
  gstin?: string;
  customerName?: string;
  items?: Array<{
    name?: string;
    serviceName?: string;
    quantity?: number;
    price?: number;
    subtotal?: number;
    duration?: number;
  }>;
  stylistId?: Types.ObjectId;
  stylistName?: string;
  placeOfSupply?: string;
}

export interface LeanExpense {
  _id: Types.ObjectId;
  amount?: number;
  category?: string;
  date?: Date;
  vendor?: string;
  paymentMethod?: string;
  title?: string;
  description?: string;
}

export interface LeanMerchant {
  _id: Types.ObjectId;
  businessName?: string;
  gstNumber?: string;
}

export interface LeanStore {
  _id: Types.ObjectId;
  name?: string;
  location?: {
    state?: string;
  };
  gstNumber?: string;
}

export class ExportService {
  /**
   * Export data to Tally XML format
   */
  async exportToTally(merchantId: string, from: Date, to: Date): Promise<string> {
    const merchant = await Merchant.findById(merchantId).lean();
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const stores = await Store.find({ merchantId: new Types.ObjectId(merchantId) }).lean();
    if (!stores.length) {
      throw new Error('No stores found for merchant');
    }

    // Get all transactions for the period
    const orders = await Order.find({
      store: { $in: stores.map(s => s._id) },
      createdAt: { $gte: from, $lte: to },
      status: { $in: ['delivered', 'completed', 'paid'] },
    }).lean();

    const expenses = await Expense.find({
      merchantId: new Types.ObjectId(merchantId),
      date: { $gte: from, $lte: to },
    }).lean();

    const vouchers = this.ordersToTallyVouchers(orders, merchant);
    const expenseVouchers = this.expensesToTallyVouchers(expenses);

    return this.generateTallyXML([...vouchers, ...expenseVouchers], merchant.businessName || 'REZ Merchant');
  }

  /**
   * Export data to Excel format
   */
  async exportToExcel(merchantId: string, type: ExportType): Promise<Buffer> {
    let data: unknown[];

    switch (type) {
      case 'sales':
        data = await this.getSalesData(merchantId);
        break;
      case 'inventory':
        data = await this.getInventoryData(merchantId);
        break;
      case 'ledger':
        data = await this.getLedgerData(merchantId);
        break;
      default:
        throw new Error(`Unsupported export type: ${type}`);
    }

    return this.generateExcelBuffer(data, type);
  }

  /**
   * Export data to CSV format
   */
  async exportToCSV(merchantId: string, type: ExportType): Promise<string> {
    let data: unknown[];

    switch (type) {
      case 'sales':
        data = await this.getSalesData(merchantId);
        break;
      case 'inventory':
        data = await this.getInventoryData(merchantId);
        break;
      case 'ledger':
        data = await this.getLedgerData(merchantId);
        break;
      default:
        throw new Error(`Unsupported export type: ${type}`);
    }

    return this.generateCSV(data);
  }

  /**
   * Export GSTR-1 format data
   */
  async exportGSTR1(merchantId: string, period: string): Promise<GSTR1Data> {
    // Parse period (format: YYYY-MM or YYYY-MM-DD)
    const [year, month] = period.split('-').map(Number);

    if (!year || !month) {
      throw new Error('Invalid period format. Expected: YYYY-MM');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const merchant = await Merchant.findById(merchantId).lean();
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const stores = await Store.find({ merchantId: new Types.ObjectId(merchantId) }).lean();

    const orders = await Order.find({
      store: { $in: stores.map(s => s._id) },
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['delivered', 'completed', 'paid'] },
    }).lean();

    return this.formatGSTR1Data(orders, merchant, stores[0]);
  }

  /**
   * Generate export based on options
   */
  async generateExport(options: ExportOptions): Promise<ExportResult> {
    try {
      const { merchantId, from, to, format, type } = options;

      let data: string | Buffer;
      let filename: string;
      let contentType: string;
      const timestamp = new Date().toISOString().split('T')[0];

      switch (format) {
        case 'tally':
          data = await this.exportToTally(merchantId, from, to);
          filename = `Tally_Export_${timestamp}.xml`;
          contentType = 'application/xml';
          break;
        case 'excel':
          data = await this.exportToExcel(merchantId, type);
          filename = `${type}_Export_${timestamp}.xlsx`;
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'csv':
          data = await this.exportToCSV(merchantId, type);
          filename = `${type}_Export_${timestamp}.csv`;
          contentType = 'text/csv';
          break;
        case 'json':
          data = JSON.stringify(await this.getExportData(merchantId, type), null, 2);
          filename = `${type}_Export_${timestamp}.json`;
          contentType = 'application/json';
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      return {
        success: true,
        data,
        filename,
        contentType,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Private helper methods

  private async getTransactions(merchantId: string, from: Date, to: Date): Promise<TransactionRecord[]> {
    const stores = await Store.find({ merchantId: new Types.ObjectId(merchantId) }).lean();
    const storeIds = stores.map(s => s._id);

    const orders = await Order.find({
      store: { $in: storeIds },
      createdAt: { $gte: from, $lte: to },
      status: { $in: ['delivered', 'completed', 'paid'] },
    }).lean();

    return orders.map((order) => ({
      id: order._id.toString(),
      date: order.createdAt,
      type: 'Sale',
      reference: order.orderNumber || `ORD-${order._id.toString().slice(-8)}`,
      description: `Order - ${order.orderNumber || order._id.toString().slice(-8)}`,
      amount: order.totals?.total || 0,
      tax: order.totals?.tax || 0,
      paymentMethod: order.payment?.method || 'unknown',
      customerName: order.user?.toString() || 'Cash Customer',
    }));
  }

  private async getData(merchantId: string, type: string): Promise<unknown[]> {
    switch (type) {
      case 'sales':
        return this.getSalesData(merchantId);
      case 'inventory':
        return this.getInventoryData(merchantId);
      case 'ledger':
        return this.getLedgerData(merchantId);
      default:
        return [];
    }
  }

  private async getSalesData(merchantId: string): Promise<unknown[]> {
    const stores = await Store.find({ merchantId: new Types.ObjectId(merchantId) }).lean();
    const storeIds = stores.map(s => s._id);

    const orders = await Order.find({
      store: { $in: storeIds },
      status: { $in: ['delivered', 'completed', 'paid'] },
    }).sort({ createdAt: -1 }).limit(10000).lean();

    return orders.map((order) => ({
      'Date': new Date(order.createdAt).toISOString().split('T')[0],
      'Invoice Number': order.orderNumber || order._id.toString().slice(-8),
      'Customer': order.user?.toString() || 'Cash Customer',
      'Subtotal': order.totals?.subtotal || 0,
      'Tax': order.totals?.tax || 0,
      'Delivery': order.totals?.delivery || 0,
      'Discount': order.totals?.discount || 0,
      'Total': order.totals?.total || 0,
      'Payment Method': order.payment?.method || 'unknown',
      'Status': order.status,
      'Store': stores.find(s => s._id.equals(order.store))?.name || 'Unknown',
    }));
  }

  private async getInventoryData(merchantId: string): Promise<InventoryRecord[]> {
    const stores = await Store.find({ merchantId: new Types.ObjectId(merchantId) }).lean();

    const products = await Product.find({
      merchantId: new Types.ObjectId(merchantId),
    }).lean();

    return products.map((product) => ({
      'Product ID': product._id.toString(),
      'Product Name': product.name,
      'SKU': product.sku || '',
      'Category': product.category?.name || 'Uncategorized',
      'Quantity': product.stock?.quantity || 0,
      'Unit': product.unit || 'pcs',
      'Purchase Price': product.purchasePrice || 0,
      'Sale Price': product.price || 0,
      'MRP': product.mrp || product.price || 0,
      'Stock Value': (product.stock?.quantity || 0) * (product.purchasePrice || 0),
    }));
  }

  private async getLedgerData(merchantId: string): Promise<LedgerRecord[]> {
    const stores = await Store.find({ merchantId: new Types.ObjectId(merchantId) }).lean();
    const storeIds = stores.map(s => s._id);

    const orders = await Order.find({
      store: { $in: storeIds },
      status: { $in: ['delivered', 'completed', 'paid'] },
    }).lean();

    const expenses = await Expense.find({
      merchantId: new Types.ObjectId(merchantId),
    }).lean();

    // Aggregate by account type
    const accountMap = new Map<string, LedgerRecord>();

    // Add sales
    const salesTotal = orders.reduce((sum, o) => sum + (o.totals?.subtotal || 0), 0);
    accountMap.set('Sales', {
      accountName: 'Sales',
      accountType: 'Income',
      debit: 0,
      credit: salesTotal,
      balance: salesTotal,
      transactions: [],
    });

    // Add CGST collected
    const cgstTotal = orders.reduce((sum, o) => sum + ((o.totals?.tax || 0) / 2), 0);
    accountMap.set('Output CGST', {
      accountName: 'Output CGST',
      accountType: 'Liability',
      debit: 0,
      credit: cgstTotal,
      balance: -cgstTotal,
      transactions: [],
    });

    // Add SGST collected
    accountMap.set('Output SGST', {
      accountName: 'Output SGST',
      accountType: 'Liability',
      debit: 0,
      credit: cgstTotal,
      balance: -cgstTotal,
      transactions: [],
    });

    // Add expenses
    const expenseTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    accountMap.set('Expenses', {
      accountName: 'Expenses',
      accountType: 'Expense',
      debit: expenseTotal,
      credit: 0,
      balance: expenseTotal,
      transactions: [],
    });

    // Add Cash/Bank
    const totalCollections = orders.reduce((sum, o) => sum + (o.totals?.total || 0), 0);
    accountMap.set('Cash', {
      accountName: 'Cash',
      accountType: 'Asset',
      debit: totalCollections,
      credit: expenseTotal,
      balance: totalCollections - expenseTotal,
      transactions: [],
    });

    return Array.from(accountMap.values());
  }

  private async getB2BInvoices(merchantId: string, period: string): Promise<B2BInvoice[]> {
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const stores = await Store.find({ merchantId: new Types.ObjectId(merchantId) }).lean();
    const storeIds = stores.map(s => s._id);

    const orders = await Order.find({
      store: { $in: storeIds },
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['delivered', 'completed', 'paid'] },
    }).lean();

    // Filter for B2B (invoices > 250000 or with GSTIN)
    return orders
      .filter((o) => o.totals?.total > 250000 || o.gstin)
      .map((order) => {
        const subtotal = order.totals?.subtotal || 0;
        const tax = order.totals?.tax || 0;

        return {
          gstin: order.gstin || 'URP',
          customerName: order.customerName || 'Unknown Customer',
          invoiceNumber: order.orderNumber || order._id.toString().slice(-8),
          invoiceDate: new Date(order.createdAt).toISOString().split('T')[0],
          invoiceValue: order.totals?.total || 0,
          taxableValue: subtotal,
          rate: subtotal > 0 ? (tax / subtotal) * 100 : 0,
          cgst: tax / 2,
          sgst: tax / 2,
          igst: 0,
          cess: 0,
          placeOfSupply: stores[0]?.location?.state || 'Unknown',
          reverseCharge: false,
        };
      });
  }

  private formatGSTR1(invoices: B2BInvoice[]): GSTR1Data {
    const summary: GSTR1Summary = {
      totalInvoices: invoices.length,
      totalTaxableValue: invoices.reduce((sum, inv) => sum + inv.taxableValue, 0),
      totalCGST: invoices.reduce((sum, inv) => sum + inv.cgst, 0),
      totalSGST: invoices.reduce((sum, inv) => sum + inv.sgst, 0),
      totalIGST: invoices.reduce((sum, inv) => sum + inv.igst, 0),
      totalCess: invoices.reduce((sum, inv) => sum + inv.cess, 0),
      totalInvoiceValue: invoices.reduce((sum, inv) => sum + inv.invoiceValue, 0),
    };

    return {
      b2b: invoices,
      b2cl: [],
      b2cs: [],
      summary,
    };
  }

  private async getExportData(merchantId: string, type: string): Promise<unknown> {
    const data = await this.getData(merchantId, type);

    return {
      exportType: type,
      exportedAt: new Date().toISOString(),
      merchantId,
      recordCount: data.length,
      data,
    };
  }

  private async getB2BInvoicesForGSTR1(merchantId: string, period: string): Promise<B2BInvoice[]> {
    return this.getB2BInvoices(merchantId, period);
  }

  private formatGSTR1Data(orders: unknown[], merchant, store): GSTR1Data {
    const b2b: B2BInvoice[] = [];
    const b2cl: B2CLInvoice[] = [];
    const b2cs: B2CSData[] = [];

    const stateTaxRates = new Map<string, number>();

    for (const order of orders) {
      const subtotal = order.totals?.subtotal || 0;
      const tax = order.totals?.tax || 0;
      const total = order.totals?.total || 0;
      const rate = subtotal > 0 ? (tax / subtotal) * 100 : 0;

      const invoiceRecord = {
        invoiceNumber: order.orderNumber || order._id.toString().slice(-8),
        invoiceDate: new Date(order.createdAt).toISOString().split('T')[0],
        taxableValue: subtotal,
        rate,
        cgst: tax / 2,
        sgst: tax / 2,
        igst: 0,
        cess: 0,
        state: store?.location?.state || 'Unknown',
      };

      // B2B: Invoices > 250000 or with GSTIN
      if (total > 250000 || order.gstin) {
        b2b.push({
          gstin: order.gstin || 'URP',
          customerName: order.customerName || 'Unknown Customer',
          invoiceValue: total,
          placeOfSupply: store?.location?.state || 'Unknown',
          reverseCharge: false,
          ...invoiceRecord,
        });
      }
      // B2CL: Inter-state > 250000
      else if (order.placeOfSupply && order.placeOfSupply !== store?.location?.state) {
        b2cl.push({
          invoiceValue: total,
          state: order.placeOfSupply,
          ...invoiceRecord,
        });
      }
      // B2CS: Intra-state or small invoices
      else {
        const state = store?.location?.state || 'Unknown';
        const existing = b2cs.find(b => b.state === state && b.rate === rate);
        if (existing) {
          existing.taxableValue += subtotal;
          existing.cgst += tax / 2;
          existing.sgst += tax / 2;
        } else {
          b2cs.push({
            state,
            supplyType: 'B2CS',
            rate,
            taxableValue: subtotal,
            cgst: tax / 2,
            sgst: tax / 2,
            igst: 0,
            cess: 0,
          });
        }
      }
    }

    const summary: GSTR1Summary = {
      totalInvoices: orders.length,
      totalTaxableValue: orders.reduce((sum, o) => sum + (o.totals?.subtotal || 0), 0),
      totalCGST: orders.reduce((sum, o) => sum + ((o.totals?.tax || 0) / 2), 0),
      totalSGST: orders.reduce((sum, o) => sum + ((o.totals?.tax || 0) / 2), 0),
      totalIGST: 0,
      totalCess: 0,
      totalInvoiceValue: orders.reduce((sum, o) => sum + (o.totals?.total || 0), 0),
    };

    return { b2b, b2cl, b2cs, summary };
  }

  // Tally XML generation
  private ordersToTallyVouchers(orders: unknown[], merchant): unknown[] {
    return orders.map((order) => {
      const subtotal = order.totals?.subtotal || 0;
      const tax = order.totals?.tax || 0;
      const delivery = order.totals?.delivery || 0;
      const total = order.totals?.total || 0;
      const cgst = tax / 2;
      const sgst = tax / 2;

      return {
        voucherKey: order._id.toString(),
        voucherType: 'Sales',
        voucherNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6)}`,
        date: new Date(order.createdAt).toISOString().split('T')[0].replace(/-/g, ''),
        partyLedgerName: 'Cash',
        ledgerEntries: [
          { ledgerName: 'Sundry Debtors', amount: total, isDebit: true },
          { ledgerName: 'Sales', amount: -(subtotal), isDebit: false },
          { ledgerName: 'Output CGST', amount: -cgst, isDebit: false, gstType: 'CGST', rate: 9 },
          { ledgerName: 'Output SGST', amount: -sgst, isDebit: false, gstType: 'SGST', rate: 9 },
        ],
        inventoryEntries: order.items?.map((item) => ({
          itemName: item.name || 'Unknown Item',
          quantity: item.quantity || 1,
          rate: item.price || 0,
          amount: item.subtotal || (item.price * item.quantity),
        })) || [],
      };
    });
  }

  private expensesToTallyVouchers(expenses: unknown[]): unknown[] {
    const categoryLedgerMap: Record<string, string> = {
      rent: 'Rent',
      utilities: 'Electricity & Water',
      salaries: 'Salaries & Wages',
      supplies: 'Office Supplies',
      marketing: 'Advertising & Marketing',
      travel: 'Travel & Conveyance',
      purchase: 'Purchases',
      supplier: 'Sundry Creditors',
      default: 'General Expenses',
    };

    return expenses.map((expense) => {
      const amount = expense.amount || 0;
      const expenseLedger = categoryLedgerMap[expense.category?.toLowerCase()] || categoryLedgerMap.default;

      return {
        voucherKey: expense._id.toString(),
        voucherType: 'Payment',
        voucherNumber: `EXP-${expense._id.toString().slice(-6)}`,
        date: new Date(expense.date).toISOString().split('T')[0].replace(/-/g, ''),
        partyLedgerName: expense.vendor || expenseLedger,
        ledgerEntries: [
          { ledgerName: expenseLedger, amount, isDebit: true },
          { ledgerName: expense.paymentMethod === 'online' ? 'Bank Account' : 'Cash', amount: -amount, isDebit: false },
        ],
        inventoryEntries: [],
      };
    });
  }

  private generateTallyXML(vouchers: unknown[], companyName: string): string {
    const voucherXml = vouchers.map(v => this.generateVoucherXML(v)).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<DATA>
<HEADER>
<VERSION>1</VERSION>
<TALLYEXPORTFORMAT>Yes</TALLYEXPORTFORMAT>
</HEADER>
<BODY>
<IMPORTDATA>
<REQUESTDESC>
<REPORTNAME>Voucher Register</REPORTNAME>
<STATICVARIABLES>
<SVCURRENTCOMPANY>${this.escapeXml(companyName)}</SVCURRENTCOMPANY>
</STATICVARIABLES>
</REQUESTDESC>
<REQUESTDATA>
${voucherXml}
</REQUESTDATA>
</IMPORTDATA>
</BODY>
</DATA>`;
  }

  private generateVoucherXML(voucher): string {
    const ledgerEntries = voucher.ledgerEntries
      .map((entry) => {
        const amountStr = Math.abs(entry.amount).toFixed(2);
        const amountType = entry.isDebit ? 'Dr' : 'Cr';
        const gstFields = entry.gstType
          ? `\n<GSTREMOVEIGSTONEFSAMT>No</GSTREMOVEIGSTONEFSAMT>\n<GSTBASAMOUNT>${amountStr}</GSTBASAMOUNT>\n<GSTRATE>${entry.rate || 0}</GSTRATE>`
          : '';

        return `    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${this.escapeXml(entry.ledgerName)}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>${entry.isDebit ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
      <AMOUNT>${amountStr}${amountType}${gstFields}
      </AMOUNT>
    </ALLLEDGERENTRIES.LIST>`;
      })
      .join('');

    const inventoryEntries = voucher.inventoryEntries?.length
      ? voucher.inventoryEntries
          .map((entry) => {
            return `    <INVENTORYENTRIES.LIST>
      <STOCKITEMNAME>${this.escapeXml(entry.itemName)}</STOCKITEMNAME>
      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
      <AMOUNT>${entry.amount.toFixed(2)}Dr</AMOUNT>
      <ACTUALQTY>${entry.quantity}</ACTUALQTY>
      <RATE>${entry.rate.toFixed(2)}</RATE>
    </INVENTORYENTRIES.LIST>`;
          })
          .join('')
      : '';

    return `  <VOUCHER>
    <VOUCHERTYPENAME>${voucher.voucherType}</VOUCHERTYPENAME>
    <VOUCHERNUMBER>${this.escapeXml(voucher.voucherNumber)}</VOUCHERNUMBER>
    <DATE>${voucher.date}</DATE>
    <PARTYLEDGERNAME>${this.escapeXml(voucher.partyLedgerName)}</PARTYLEDGERNAME>
    <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
${ledgerEntries}
${inventoryEntries}
  </VOUCHER>`;
  }

  private generateExcelBuffer(data: unknown[]): Buffer {
    // Simple CSV-to-Buffer conversion for Excel compatibility
    // In production, use 'xlsx' package for proper Excel generation
    const csv = this.generateCSV(data);
    return Buffer.from(csv, 'utf-8');
  }

  private generateCSV(data: unknown[]): string {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        const stringValue = value === null || value === undefined ? '' : String(value);
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Export singleton instance
export const exportService = new ExportService();

export default ExportService;
