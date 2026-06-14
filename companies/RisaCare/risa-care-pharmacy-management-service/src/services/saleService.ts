// Sale Service - Sales processing, returns, and reporting
import {
  Sale,
  SaleItem,
  Return,
  ReturnItem,
  PaymentMethod,
  Medicine,
} from '../types/pharmacy.js';
import * as pharmacyModel from '../models/pharmacy.js';

interface SaleItemInput {
  medicineId: string;
  quantity: number;
  discount?: number;
}

interface CreateSaleInput {
  patientId?: string;
  patientName?: string;
  medicines: SaleItemInput[];
  paymentMethod: PaymentMethod;
  discount?: number;
  taxRate?: number; // Default 0%
  dispensedBy: string;
  prescriptionId?: string;
  notes?: string;
}

interface ReturnInput {
  saleId: string;
  items: Array<{
    medicineId: string;
    quantity: number;
    reason: string;
  }>;
  returnedBy: string;
  approvedBy?: string;
  notes?: string;
}

const DEFAULT_TAX_RATE = 0; // No GST on medicines in many cases, but can be configured

export class SaleService {
  /**
   * Create a new sale
   */
  createSale(input: CreateSaleInput): Sale {
    // Validate
    if (!input.medicines || input.medicines.length === 0) {
      throw new Error('At least one medicine is required');
    }
    if (!input.dispensedBy) {
      throw new Error('Dispenser ID is required');
    }

    const saleItems: SaleItem[] = [];
    let subtotal = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Process each medicine
    for (const item of input.medicines) {
      const medicine = pharmacyModel.getMedicine(item.medicineId);

      if (!medicine) {
        errors.push(`Medicine ${item.medicineId} not found`);
        continue;
      }

      if (medicine.currentStock < item.quantity) {
        if (medicine.currentStock === 0) {
          errors.push(`${medicine.name} is out of stock`);
        } else {
          errors.push(
            `Insufficient stock for ${medicine.name}. Requested: ${item.quantity}, Available: ${medicine.currentStock}`
          );
        }
        continue;
      }

      // Check if prescription is required
      if (medicine.requiresPrescription && !input.prescriptionId) {
        warnings.push(`${medicine.name} requires a prescription`);
      }

      // Calculate item total
      const unitPrice = medicine.price;
      const discount = item.discount || 0;
      const itemTotal = unitPrice * item.quantity - discount;

      saleItems.push({
        medicineId: medicine.medicineId,
        medicineName: medicine.name,
        quantity: item.quantity,
        unitPrice,
        discount,
        total: itemTotal,
      });

      subtotal += itemTotal;

      // Deduct stock (FIFO from batches)
      pharmacyModel.updateMedicineStock(medicine.medicineId, -item.quantity);
    }

    if (errors.length > 0) {
      throw new Error(`Sale cannot be processed: ${errors.join('; ')}`);
    }

    // Calculate totals
    const totalDiscount = input.discount || 0;
    const afterDiscount = subtotal - totalDiscount;
    const taxRate = input.taxRate ?? DEFAULT_TAX_RATE;
    const tax = Math.round(afterDiscount * taxRate * 100) / 100;
    const total = Math.round((afterDiscount + tax) * 100) / 100;

    const sale = pharmacyModel.createSale({
      patientId: input.patientId,
      patientName: input.patientName,
      medicines: saleItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: totalDiscount,
      tax,
      total,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'paid',
      dispensedBy: input.dispensedBy,
      isPrescriptionSale: !!input.prescriptionId,
      prescriptionId: input.prescriptionId,
      notes: input.notes,
    });

    return sale;
  }

  /**
   * Get sale by ID
   */
  getSale(saleId: string): Sale | null {
    if (!saleId) {
      throw new Error('Sale ID is required');
    }
    return pharmacyModel.getSale(saleId) || null;
  }

  /**
   * Get all sales with filters
   */
  getSales(filters?: {
    patientId?: string;
    startDate?: Date;
    endDate?: Date;
    paymentMethod?: PaymentMethod;
    limit?: number;
    offset?: number;
  }): {
    sales: Sale[];
    total: number;
    hasMore: boolean;
  } {
    let sales = pharmacyModel.getAllSales({
      patientId: filters?.patientId,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      paymentMethod: filters?.paymentMethod,
    });

    const total = sales.length;

    // Pagination
    if (filters?.offset !== undefined) {
      sales = sales.slice(filters.offset);
    }
    if (filters?.limit !== undefined) {
      sales = sales.slice(0, filters.limit);
    }

    return {
      sales,
      total,
      hasMore: (filters?.offset || 0) + sales.length < total,
    };
  }

  /**
   * Get daily sales
   */
  getDailySales(date?: Date): {
    date: string;
    sales: Sale[];
    totalTransactions: number;
    totalRevenue: number;
    totalDiscount: number;
    totalTax: number;
    averageOrderValue: number;
    topMedicines: Array<{ medicineId: string; name: string; quantity: number; revenue: number }>;
  } {
    const targetDate = date || new Date();
    const sales = pharmacyModel.getDailySales(targetDate);

    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    const medicineTotals: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const sale of sales) {
      totalRevenue += sale.total;
      totalDiscount += sale.discount;
      totalTax += sale.tax;

      for (const item of sale.medicines) {
        if (!medicineTotals[item.medicineId]) {
          medicineTotals[item.medicineId] = {
            name: item.medicineName,
            quantity: 0,
            revenue: 0,
          };
        }
        medicineTotals[item.medicineId].quantity += item.quantity;
        medicineTotals[item.medicineId].revenue += item.total;
      }
    }

    const topMedicines = Object.entries(medicineTotals)
      .map(([id, data]) => ({ medicineId: id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      date: targetDate.toISOString().split('T')[0],
      sales,
      totalTransactions: sales.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      averageOrderValue: sales.length > 0 ? Math.round((totalRevenue / sales.length) * 100) / 100 : 0,
      topMedicines,
    };
  }

  /**
   * Get sales by period
   */
  getSalesByPeriod(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Array<{
    period: string;
    sales: number;
    revenue: number;
    averageOrderValue: number;
  }> {
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    const sales = pharmacyModel.getSalesByPeriod(startDate, endDate);
    const grouped: Record<string, { sales: Sale[] }> = {};

    // Group sales by period
    for (const sale of sales) {
      let periodKey: string;
      const d = sale.soldAt;

      switch (groupBy) {
        case 'week':
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          periodKey = sale.soldAt.toISOString().split('T')[0];
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = { sales: [] };
      }
      grouped[periodKey].sales.push(sale);
    }

    return Object.entries(grouped)
      .map(([period, data]) => {
        const revenue = data.sales.reduce((sum, s) => sum + s.total, 0);
        return {
          period,
          sales: data.sales.length,
          revenue: Math.round(revenue * 100) / 100,
          averageOrderValue:
            data.sales.length > 0
              ? Math.round((revenue / data.sales.length) * 100) / 100
              : 0,
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Process a return
   */
  processReturn(input: ReturnInput): Return {
    const sale = pharmacyModel.getSale(input.saleId);
    if (!sale) {
      throw new Error(`Sale ${input.saleId} not found`);
    }

    if (sale.paymentStatus === 'refunded') {
      throw new Error('This sale has already been fully refunded');
    }

    if (input.items.length === 0) {
      throw new Error('At least one item must be returned');
    }

    const returnItems: ReturnItem[] = [];
    let totalRefund = 0;
    const errors: string[] = [];

    // Validate and process each return item
    for (const item of input.items) {
      const saleItem = sale.medicines.find((m) => m.medicineId === item.medicineId);

      if (!saleItem) {
        errors.push(`Medicine ${item.medicineId} was not in this sale`);
        continue;
      }

      if (item.quantity > saleItem.quantity) {
        errors.push(
          `Cannot return ${item.quantity} of ${saleItem.medicineName}. Only ${saleItem.quantity} were sold.`
        );
        continue;
      }

      // Calculate refund amount (proportional)
      const refundAmount = Math.round((saleItem.total / saleItem.quantity) * item.quantity * 100) / 100;

      returnItems.push({
        medicineId: item.medicineId,
        medicineName: saleItem.medicineName,
        quantity: item.quantity,
        reason: item.reason,
        refundAmount,
      });

      totalRefund += refundAmount;

      // Add stock back
      pharmacyModel.updateMedicineStock(item.medicineId, item.quantity);
    }

    if (errors.length > 0 && returnItems.length === 0) {
      throw new Error(`Return cannot be processed: ${errors.join('; ')}`);
    }

    const returnRecord = pharmacyModel.createReturn({
      saleId: input.saleId,
      items: returnItems,
      totalRefund: Math.round(totalRefund * 100) / 100,
      returnedBy: input.returnedBy,
      approvedBy: input.approvedBy,
      notes: input.notes,
    });

    return returnRecord;
  }

  /**
   * Get returns for a sale
   */
  getReturnsForSale(saleId: string): Return[] {
    return pharmacyModel.getReturnsBySale(saleId);
  }

  /**
   * Get all returns
   */
  getAllReturns(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Return[] {
    return pharmacyModel.getAllReturns(filters);
  }

  /**
   * Get sales summary/analytics
   */
  getSalesSummary(startDate?: Date, endDate?: Date): {
    totalSales: number;
    totalRevenue: number;
    totalDiscount: number;
    totalTax: number;
    totalRefunds: number;
    netRevenue: number;
    averageOrderValue: number;
    salesByPaymentMethod: Record<string, { count: number; revenue: number }>;
    salesByHour: Record<number, number>;
    topSellingMedicines: Array<{ medicineId: string; name: string; quantity: number; revenue: number }>;
    prescriptionVsOTC: { prescription: number; otc: number };
  } {
    const summary = pharmacyModel.getSalesSummary(startDate, endDate);
    const sales = startDate && endDate
      ? pharmacyModel.getSalesByPeriod(startDate, endDate)
      : pharmacyModel.getAllSales();
    const returns = pharmacyModel.getAllReturns({ startDate, endDate });

    const totalRefunds = returns.reduce((sum, r) => sum + r.totalRefund, 0);
    const netRevenue = summary.totalRevenue - totalRefunds;

    // Sales by payment method
    const salesByPaymentMethod: Record<string, { count: number; revenue: number }> = {};
    for (const sale of sales) {
      if (!salesByPaymentMethod[sale.paymentMethod]) {
        salesByPaymentMethod[sale.paymentMethod] = { count: 0, revenue: 0 };
      }
      salesByPaymentMethod[sale.paymentMethod].count++;
      salesByPaymentMethod[sale.paymentMethod].revenue += sale.total;
    }

    // Sales by hour of day
    const salesByHour: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      salesByHour[i] = 0;
    }
    for (const sale of sales) {
      const hour = sale.soldAt.getHours();
      salesByHour[hour] = (salesByHour[hour] || 0) + 1;
    }

    // Top selling medicines
    const medicineTotals: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const sale of sales) {
      for (const item of sale.medicines) {
        if (!medicineTotals[item.medicineId]) {
          medicineTotals[item.medicineId] = {
            name: item.medicineName,
            quantity: 0,
            revenue: 0,
          };
        }
        medicineTotals[item.medicineId].quantity += item.quantity;
        medicineTotals[item.medicineId].revenue += item.total;
      }
    }

    const topSellingMedicines = Object.entries(medicineTotals)
      .map(([id, data]) => ({ medicineId: id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Prescription vs OTC
    let prescriptionSales = 0;
    let otcSales = 0;
    for (const sale of sales) {
      if (sale.isPrescriptionSale) {
        prescriptionSales++;
      } else {
        otcSales++;
      }
    }

    return {
      totalSales: summary.totalSales,
      totalRevenue: Math.round(summary.totalRevenue * 100) / 100,
      totalDiscount: Math.round(summary.totalDiscount * 100) / 100,
      totalTax: Math.round(summary.totalTax * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      netRevenue: Math.round(netRevenue * 100) / 100,
      averageOrderValue: Math.round(summary.averageOrderValue * 100) / 100,
      salesByPaymentMethod,
      salesByHour,
      topSellingMedicines,
      prescriptionVsOTC: {
        prescription: prescriptionSales,
        otc: otcSales,
      },
    };
  }

  /**
   * Get sales for a specific patient
   */
  getPatientSalesHistory(patientId: string): Sale[] {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    return pharmacyModel.getAllSales({ patientId });
  }

  /**
   * Void/cancel a sale (admin function)
   */
  voidSale(saleId: string, reason: string): Sale | null {
    const sale = pharmacyModel.getSale(saleId);
    if (!sale) {
      throw new Error(`Sale ${saleId} not found`);
    }

    if (sale.paymentStatus === 'refunded') {
      throw new Error('Cannot void an already refunded sale');
    }

    // Add all items back to stock
    for (const item of sale.medicines) {
      pharmacyModel.updateMedicineStock(item.medicineId, item.quantity);
    }

    // Mark as refunded
    sale.paymentStatus = 'refunded';
    sale.notes = sale.notes
      ? `${sale.notes}\n[Voided: ${reason}]`
      : `[Voided: ${reason}]`;

    pharmacyModel.sales.set(saleId, sale);
    return sale;
  }

  /**
   * Generate invoice/receipt data
   */
  generateInvoice(saleId: string): {
    invoiceNumber: string;
    date: Date;
    patientName?: string;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paymentMethod: PaymentMethod;
    dispensedBy: string;
    pharmacyName?: string;
  } | null {
    const sale = pharmacyModel.getSale(saleId);
    if (!sale) {
      return null;
    }

    return {
      invoiceNumber: sale.invoiceNumber,
      date: sale.soldAt,
      patientName: sale.patientName,
      items: sale.medicines,
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      dispensedBy: sale.dispensedBy,
    };
  }
}

export const saleService = new SaleService();
