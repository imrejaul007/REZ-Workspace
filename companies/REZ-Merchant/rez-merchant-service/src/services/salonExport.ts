/**
 * Salon Export Service
 *
 * Extends ExportService with salon-specific export functionality:
 * - Beauty services GST classification
 * - Salon-specific Tally ledger mappings
 * - Service revenue reports
 * - Stylist commission reports
 * - Product inventory exports
 * - Shares base export functionality with other industries
 */

import mongoose, { Types } from 'mongoose';
import { Order } from '../models/Order';
import { Store } from '../models/Store';
import { Merchant } from '../models/Merchant';
import { Expense } from '../models/Expense';
import { SalonProduct } from '../models/SalonProduct';
import { logger } from '../config/logger';
import {
  ExportService,
  exportService,
  type ExportOptions,
  type ExportResult,
  type TransactionRecord,
  type InventoryRecord,
  type LedgerRecord,
  type GSTR1Data,
} from './exportService';

// ── Salon-Specific Types ─────────────────────────────────────────────────────────

export interface SalonServiceRecord {
  id: string;
  date: Date;
  serviceName: string;
  category: string;
  stylistId: string;
  stylistName: string;
  customerName?: string;
  duration: number;
  amount: number;
  tax: number;
  gstRate: number;
  paymentMethod?: string;
}

export interface StylistCommissionRecord {
  stylistId: string;
  stylistName: string;
  period: string;
  totalServices: number;
  serviceRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  deductions: number;
  netPayable: number;
  services: Array<{
    serviceName: string;
    count: number;
    revenue: number;
    commission: number;
  }>;
}

export interface SalonInventoryExport {
  products: Array<{
    id: string;
    name: string;
    category: string;
    brand: string;
    quantity: number;
    unit: string;
    cost: number;
    price: number;
    reorderPoint: number;
    supplier: string;
    expiryDate?: Date;
  }>;
  summary: {
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringCount: number;
  };
}

export interface BeautyServiceGSTCategory {
  serviceCode: string;
  serviceName: string;
  hsnCode: string;
  gstRate: number;
  description: string;
}

// ── Service Class ─────────────────────────────────────────────────────────────────

export class SalonExportService {
  private baseService: ExportService;

  // Beauty service GST classifications (as per Indian GST law)
  private readonly beautyServiceGST: Record<string, BeautyServiceGSTCategory> = {
    hairdressing: {
      serviceCode: 'HCD001',
      serviceName: 'Hairdressing Services',
      hsnCode: '996212',
      gstRate: 18,
      description: 'Hair cutting, styling, coloring services',
    },
    beauty_treatment: {
      serviceCode: 'BT001',
      serviceName: 'Beauty Treatment Services',
      hsnCode: '996213',
      gstRate: 18,
      description: 'Facials, skin care, makeup services',
    },
    hair_treatment: {
      serviceCode: 'HT001',
      serviceName: 'Hair Treatment Services',
      hsnCode: '996214',
      gstRate: 18,
      description: 'Hair spa, keratin, rebonding services',
    },
    nail_services: {
      serviceCode: 'NS001',
      serviceName: 'Nail Services',
      hsnCode: '996215',
      gstRate: 18,
      description: 'Manicure, pedicure, nail art',
    },
    body_massage: {
      serviceCode: 'BM001',
      serviceName: 'Body Massage/Spa Services',
      hsnCode: '996216',
      gstRate: 18,
      description: 'Full body massage, spa treatments',
    },
    aesthetic: {
      serviceCode: 'AS001',
      serviceName: 'Aesthetic Medical Services',
      hsnCode: '996313',
      gstRate: 18,
      description: 'Non-surgical cosmetic procedures',
    },
    bridal: {
      serviceCode: 'BD001',
      serviceName: 'Bridal Makeup Services',
      hsnCode: '996217',
      gstRate: 18,
      description: 'Bridal makeup and grooming services',
    },
  };

  // Salon Tally ledger mappings
  private readonly tallyLedgerMapping: Record<string, string> = {
    hairdressing: 'Hairdressing Services',
    beauty_treatment: 'Beauty Treatment Services',
    hair_treatment: 'Hair Treatment Services',
    nail_services: 'Nail Services',
    body_massage: 'Spa Services',
    aesthetic: 'Aesthetic Services',
    bridal: 'Bridal Services',
    products: 'Sale of Salon Products',
    gift_cards: 'Gift Vouchers',
    tips: 'Tips Received',
    package_sales: 'Package Sales',
  };

  constructor() {
    this.baseService = exportService;
  }

  /**
   * Export salon services report
   */
  async exportServicesReport(
    merchantId: string,
    from: Date,
    to: Date,
    options?: {
      category?: string;
      stylistId?: string;
      storeId?: string;
    }
  ): Promise<SalonServiceRecord[]> {
    const mid = new Types.ObjectId(merchantId);

    const query: Record<string, unknown> = {
      merchantId: mid,
      createdAt: { $gte: from, $lte: to },
      status: { $in: ['delivered', 'completed', 'paid'] },
    };

    if (options?.storeId) {
      query.store = new Types.ObjectId(options.storeId);
    }
    if (options?.stylistId) {
      query.stylistId = new Types.ObjectId(options.stylistId);
    }

    const orders = await Order.find(query)
      .populate('store', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const serviceRecords: SalonServiceRecord[] = [];

    for (const order of orders) {
      const orderData = order as unknown;
      const items = orderData.items || [];

      for (const item of items) {
        const category = this.categorizeService(item.name || item.serviceName);
        const gstCategory = this.beautyServiceGST[category];
        const gstRate = gstCategory?.gstRate || 18;
        const taxRate = gstRate / 100;
        const subtotal = item.subtotal || item.price * item.quantity || 0;
        const tax = subtotal * taxRate;

        serviceRecords.push({
          id: orderData._id.toString(),
          date: orderData.createdAt,
          serviceName: item.name || item.serviceName || 'Unknown Service',
          category,
          stylistId: orderData.stylistId?.toString() || 'unknown',
          stylistName: orderData.stylistName || 'Unknown Stylist',
          customerName: orderData.customerName || 'Walk-in',
          duration: item.duration || this.estimateDuration(item.name),
          amount: subtotal,
          tax,
          gstRate,
          paymentMethod: orderData.payment?.method || 'cash',
        });
      }
    }

    // Filter by category if specified
    if (options?.category) {
      return serviceRecords.filter(r => r.category === options.category);
    }

    return serviceRecords;
  }

  /**
   * Export stylist commission report
   */
  async exportCommissionReport(
    merchantId: string,
    from: Date,
    to: Date,
    commissionRate: number = 0.1
  ): Promise<StylistCommissionRecord[]> {
    const mid = new Types.ObjectId(merchantId);
    const stores = await Store.find({ merchantId: mid }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);

    const orders = await Order.find({
      store: { $in: storeIds },
      createdAt: { $gte: from, $lte: to },
      status: { $in: ['delivered', 'completed', 'paid'] },
      stylistId: { $exists: true, $ne: null },
    }).lean();

    // Aggregate by stylist
    const stylistMap = new Map<string, StylistCommissionRecord>();

    for (const order of orders) {
      const orderData = order as unknown;
      const stylistId = orderData.stylistId.toString();
      const stylistName = orderData.stylistName || 'Unknown Stylist';
      const subtotal = orderData.totals?.subtotal || 0;

      if (!stylistMap.has(stylistId)) {
        stylistMap.set(stylistId, {
          stylistId,
          stylistName,
          period: `${from.toISOString().split('T')[0]} to ${to.toISOString().split('T')[0]}`,
          totalServices: 0,
          serviceRevenue: 0,
          commissionRate,
          commissionAmount: 0,
          deductions: 0,
          netPayable: 0,
          services: [],
        });
      }

      const record = stylistMap.get(stylistId)!;
      record.totalServices += 1;
      record.serviceRevenue += subtotal;

      // Track service breakdown
      const serviceName = orderData.items?.[0]?.name || 'General Service';
      const existingService = record.services.find(s => s.serviceName === serviceName);
      if (existingService) {
        existingService.count += 1;
        existingService.revenue += subtotal;
        existingService.commission = existingService.revenue * commissionRate;
      } else {
        record.services.push({
          serviceName,
          count: 1,
          revenue: subtotal,
          commission: subtotal * commissionRate,
        });
      }
    }

    // Calculate commissions
    for (const record of stylistMap.values()) {
      record.commissionAmount = record.serviceRevenue * record.commissionRate;
      record.netPayable = record.commissionAmount - record.deductions;
    }

    return Array.from(stylistMap.values());
  }

  /**
   * Export salon inventory report
   */
  async exportInventoryReport(merchantId: string, storeId?: string): Promise<SalonInventoryExport> {
    const mid = new Types.ObjectId(merchantId);

    const query: Record<string, unknown> = { storeId: new Types.ObjectId(storeId) };
    if (!storeId) {
      const stores = await Store.find({ merchantId: mid }).select('_id').lean();
      query.storeId = { $in: stores.map((s) => s._id) };
    }

    const products = await SalonProduct.find(query).lean();
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringCount = 0;

    const productRecords = products.map((p) => {
      const value = p.price * p.quantity;
      totalValue += value;

      if (p.quantity === 0) outOfStockCount++;
      else if (p.quantity <= p.reorderPoint) lowStockCount++;
      if (p.expiryDate && p.expiryDate <= thirtyDaysFromNow) expiringCount++;

      return {
        id: p._id.toString(),
        name: p.name,
        category: p.category,
        brand: p.brand,
        quantity: p.quantity,
        unit: p.unit,
        cost: p.cost,
        price: p.price,
        reorderPoint: p.reorderPoint,
        supplier: p.supplier,
        expiryDate: p.expiryDate,
      };
    });

    return {
      products: productRecords,
      summary: {
        totalProducts: products.length,
        totalValue,
        lowStockCount,
        outOfStockCount,
        expiringCount,
      },
    };
  }

  /**
   * Export to Tally XML format (salon-specific ledger mapping)
   */
  async exportToTallySalon(merchantId: string, from: Date, to: Date): Promise<string> {
    const merchant = await Merchant.findById(merchantId).lean();
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const stores = await Store.find({ merchantId: new Types.ObjectId(merchantId) }).lean();
    const storeIds = stores.map(s => s._id);

    // Get orders with service breakdown
    const orders = await Order.find({
      store: { $in: storeIds },
      createdAt: { $gte: from, $lte: to },
      status: { $in: ['delivered', 'completed', 'paid'] },
    }).lean();

    const expenses = await Expense.find({
      merchantId: new Types.ObjectId(merchantId),
      date: { $gte: from, $lte: to },
    }).lean();

    const vouchers = this.ordersToSalonTallyVouchers(orders, merchant);
    const expenseVouchers = this.expensesToTallyVouchers(expenses);

    return this.generateTallyXML([...vouchers, ...expenseVouchers], merchant.businessName || 'Salon');
  }

  /**
   * Export GSTR-1 data for salon services
   */
  async exportGSTR1Salon(merchantId: string, period: string): Promise<GSTR1Data> {
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

    return this.formatGSTR1Salon(orders, merchant, stores[0]);
  }

  /**
   * Generate salon-specific GSTR-1 data
   */
  private formatGSTR1Salon(orders: unknown[], merchant, store): GSTR1Data {
    interface B2BInvoice {
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

    const b2b: B2BInvoice[] = [];

    for (const order of orders) {
      const subtotal = order.totals?.subtotal || 0;
      const tax = order.totals?.tax || 0;
      const total = order.totals?.total || 0;
      const rate = subtotal > 0 ? (tax / subtotal) * 100 : 18;

      // B2B: Invoices > 250000 or with GSTIN
      if (total > 250000 || order.gstin) {
        b2b.push({
          gstin: order.gstin || 'URP',
          customerName: order.customerName || 'Unknown Customer',
          invoiceNumber: order.orderNumber || order._id.toString().slice(-8),
          invoiceDate: new Date(order.createdAt).toISOString().split('T')[0],
          invoiceValue: total,
          taxableValue: subtotal,
          rate,
          cgst: tax / 2,
          sgst: tax / 2,
          igst: 0,
          cess: 0,
          placeOfSupply: store?.location?.state || 'Unknown',
          reverseCharge: false,
        });
      }
    }

    const summary = {
      totalInvoices: orders.length,
      totalTaxableValue: orders.reduce((sum, o) => sum + (o.totals?.subtotal || 0), 0),
      totalCGST: orders.reduce((sum, o) => sum + ((o.totals?.tax || 0) / 2), 0),
      totalSGST: orders.reduce((sum, o) => sum + ((o.totals?.tax || 0) / 2), 0),
      totalIGST: 0,
      totalCess: 0,
      totalInvoiceValue: orders.reduce((sum, o) => sum + (o.totals?.total || 0), 0),
    };

    return { b2b, b2cl: [], b2cs: [], summary };
  }

  /**
   * Convert orders to salon Tally vouchers
   */
  private ordersToSalonTallyVouchers(orders: unknown[], merchant): unknown[] {
    return orders.map((order) => {
      const subtotal = order.totals?.subtotal || 0;
      const tax = order.totals?.tax || 0;
      const total = order.totals?.total || 0;
      const cgst = tax / 2;
      const sgst = tax / 2;

      // Map service categories to Tally ledgers
      const items = order.items || [];
      const ledgerEntries: unknown[] = [
        { ledgerName: 'Sundry Debtors', amount: total, isDebit: true },
      ];

      // Add service-specific ledgers
      for (const item of items) {
        const category = this.categorizeService(item.name);
        const ledgerName = this.tallyLedgerMapping[category] || 'Beauty Services';
        const itemAmount = item.subtotal || item.price * item.quantity || 0;

        ledgerEntries.push({
          ledgerName,
          amount: -itemAmount,
          isDebit: false,
        });
      }

      ledgerEntries.push(
        { ledgerName: 'Output CGST', amount: -cgst, isDebit: false, gstType: 'CGST', rate: 9 },
        { ledgerName: 'Output SGST', amount: -sgst, isDebit: false, gstType: 'SGST', rate: 9 }
      );

      return {
        voucherKey: order._id.toString(),
        voucherType: 'Sales',
        voucherNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6)}`,
        date: new Date(order.createdAt).toISOString().split('T')[0].replace(/-/g, ''),
        partyLedgerName: order.customerName || 'Cash',
        ledgerEntries,
        inventoryEntries: items.map((item) => ({
          itemName: item.name || 'Beauty Service',
          quantity: item.quantity || 1,
          rate: item.price || 0,
          amount: item.subtotal || (item.price * item.quantity),
        })),
      };
    });
  }

  /**
   * Convert expenses to Tally vouchers
   */
  private expensesToTallyVouchers(expenses: unknown[]): unknown[] {
    const categoryLedgerMap: Record<string, string> = {
      rent: 'Rent - Salon',
      utilities: 'Electricity & Water',
      salaries: 'Salaries & Wages',
      supplies: 'Beauty Supplies',
      products: 'Purchases - Products',
      marketing: 'Advertising & Marketing',
      equipment: 'Equipment Maintenance',
      cleaning: 'Cleaning & Hygiene',
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

  /**
   * Generate Tally XML
   */
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

  /**
   * Generate individual voucher XML
   */
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

  /**
   * Categorize service based on name
   */
  private categorizeService(serviceName: string): string {
    const name = (serviceName || '').toLowerCase();

    if (name.includes('hair') || name.includes('cut') || name.includes('style')) return 'hairdressing';
    if (name.includes('facial') || name.includes('makeup') || name.includes('beauty')) return 'beauty_treatment';
    if (name.includes('treatment') || name.includes('spa') || name.includes('keratin')) return 'hair_treatment';
    if (name.includes('nail') || name.includes('manicure') || name.includes('pedicure')) return 'nail_services';
    if (name.includes('massage') || name.includes('spa')) return 'body_massage';
    if (name.includes('bridal') || name.includes('bride')) return 'bridal';
    if (name.includes('aesthetic') || name.includes('laser') || name.includes('botox')) return 'aesthetic';

    return 'beauty_treatment';
  }

  /**
   * Estimate service duration
   */
  private estimateDuration(serviceName: string): number {
    const name = (serviceName || '').toLowerCase();

    if (name.includes('haircut')) return 30;
    if (name.includes('color') || name.includes('dye')) return 90;
    if (name.includes('highlight')) return 120;
    if (name.includes('bridal') || name.includes('makeup')) return 180;
    if (name.includes('facial')) return 60;
    if (name.includes('nail') || name.includes('manicure')) return 30;
    if (name.includes('pedicure')) return 45;
    if (name.includes('massage') || name.includes('spa')) return 60;

    return 30; // Default
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // ── Delegated Base Service Methods ──────────────────────────────────────────────

  /**
   * Export to Excel (delegates to base service)
   */
  async exportToExcel(merchantId: string, type: 'sales' | 'inventory' | 'ledger'): Promise<Buffer> {
    return this.baseService.exportToExcel(merchantId, type);
  }

  /**
   * Export to CSV (delegates to base service)
   */
  async exportToCSV(merchantId: string, type: 'sales' | 'inventory' | 'ledger'): Promise<string> {
    return this.baseService.exportToCSV(merchantId, type);
  }

  /**
   * Generate export (delegates to base service)
   */
  async generateExport(options: ExportOptions): Promise<ExportResult> {
    return this.baseService.generateExport(options);
  }
}

// ── Singleton Export ─────────────────────────────────────────────────────────────

export const salonExportService = new SalonExportService();
export default salonExportService;
