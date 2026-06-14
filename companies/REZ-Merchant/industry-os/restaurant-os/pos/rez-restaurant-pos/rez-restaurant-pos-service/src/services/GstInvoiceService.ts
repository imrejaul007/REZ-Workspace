import { v4 as uuidv4 } from 'uuid';
import { Invoice, InvoiceStatus, IInvoice, IGstBreakdown, IInvoiceItem } from '../models/Invoice';
import { Bill } from '../models/Bill';
import { Payment, PaymentStatus } from '../models/Payment';
import { config } from '../config';

interface GenerateInvoiceInput {
  billId: string;
  customerDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone?: string;
    email?: string;
    gstin?: string;
  };
  invoiceDate?: Date;
  dueDate?: Date;
  paymentMode?: string;
  paymentReference?: string;
}

export class GstInvoiceService {
  private numberToWords(num: number): string {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    num %= 100;
    const ten = Math.floor(num / 10);
    const unit = num % 10;

    const convertCrore = (n: number): string => {
      if (n === 0) return '';
      if (n < 100) return this.convertTwoDigit(n);
      return this.convertTwoDigit(Math.floor(n / 100)) + ' Hundred ' + this.convertTwoDigit(n % 100);
    };

    const convertTwoDigit = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return units[n];
      if (n < 20) return teens[n - 11];
      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + units[n % 10] : '');
    };

    let result = '';
    if (crore > 0) result += convertCrore(crore) + ' Crore ';
    if (lakh > 0) result += convertTwoDigit(lakh) + ' Lakh ';
    if (thousand > 0) result += units[thousand] + ' Thousand ';
    if (hundred > 0) result += units[hundred] + ' Hundred ';
    result += convertTwoDigit(ten * 10 + unit);

    return result.trim() + ' Rupees Only';
  }

  async generateInvoice(input: GenerateInvoiceInput): Promise<IInvoice> {
    const bill = await Bill.findOne({ billId: input.billId });
    if (!bill) {
      throw new Error(`Bill ${input.billId} not found`);
    }

    const existingInvoice = await Invoice.findOne({ billId: input.billId });
    if (existingInvoice && existingInvoice.status === InvoiceStatus.ISSUED) {
      throw new Error(`Invoice already exists for bill ${input.billId}`);
    }

    if (existingInvoice) {
      await Invoice.deleteOne({ invoiceId: existingInvoice.invoiceId });
    }

    const invoiceId = `INV-${uuidv4().substring(0, 8).toUpperCase()}`;
    const invoiceSequence = await this.getNextInvoiceSequence();
    const invoiceNumber = `${config.invoice.invoicePrefix}${config.invoice.invoiceSuffix}${String(invoiceSequence).padStart(6, '0')}`;

    const taxRateGroups = new Map<number, {
      taxableAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      cessAmount: number;
    }>();

    const items: IInvoiceItem[] = bill.items.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      const taxableAmount = itemSubtotal - itemDiscount;

      const cgstRate = item.taxRate / 2;
      const sgstRate = item.taxRate / 2;
      const cgstAmount = (taxableAmount * cgstRate) / 100;
      const sgstAmount = (taxableAmount * sgstRate) / 100;
      const igstAmount = (taxableAmount * item.taxRate) / 100;

      const group = taxRateGroups.get(item.taxRate) || {
        taxableAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        cessAmount: 0,
      };
      group.taxableAmount += taxableAmount;
      group.cgstAmount += cgstAmount;
      group.sgstAmount += sgstAmount;
      group.igstAmount += igstAmount;
      taxRateGroups.set(item.taxRate, group);

      return {
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        unit: 'NOS',
        unitPrice: item.unitPrice,
        totalAmount: itemSubtotal,
        discount: itemDiscount,
        taxableAmount: Math.round(taxableAmount * 100) / 100,
        gstRate: item.taxRate,
        cgstAmount: Math.round(cgstAmount * 100) / 100,
        sgstAmount: Math.round(sgstAmount * 100) / 100,
        igstAmount: 0,
        cessAmount: 0,
      };
    });

    const gstBreakdown: IGstBreakdown[] = Array.from(taxRateGroups.entries()).map(([rate, data]) => ({
      rate,
      taxableAmount: Math.round(data.taxableAmount * 100) / 100,
      cgstAmount: Math.round(data.cgstAmount * 100) / 100,
      sgstAmount: Math.round(data.sgstAmount * 100) / 100,
      igstAmount: Math.round(data.igstAmount * 100) / 100,
      cessAmount: Math.round(data.cessAmount * 100) / 100,
    }));

    const cgstTotal = gstBreakdown.reduce((sum, g) => sum + g.cgstAmount, 0);
    const sgstTotal = gstBreakdown.reduce((sum, g) => sum + g.sgstAmount, 0);
    const igstTotal = gstBreakdown.reduce((sum, g) => sum + g.igstAmount, 0);
    const cessTotal = gstBreakdown.reduce((sum, g) => sum + g.cessAmount, 0);
    const totalTax = cgstTotal + sgstTotal + igstTotal + cessTotal;

    const preRoundTotal = bill.subtotal - bill.totalDiscount + totalTax;
    const grandTotal = Math.round(preRoundTotal);
    const roundOff = grandTotal - preRoundTotal;

    const payment = await Payment.findOne({
      billId: input.billId,
      status: PaymentStatus.COMPLETED,
    });

    const invoice = new Invoice({
      invoiceId,
      invoiceNumber,
      billId: input.billId,

      restaurantDetails: {
        name: config.gst.businessName,
        address: config.gst.businessAddress,
        city: process.env.GST_CITY || 'Mumbai',
        state: process.env.GST_STATE || 'Maharashtra',
        pincode: process.env.GST_PINCODE || '400001',
        phone: process.env.GST_PHONE || '',
        gstin: config.gst.gstin,
        pan: process.env.GST_PAN,
        fssai: process.env.GST_FSSAI,
      },

      customerDetails: input.customerDetails,

      items,
      subtotal: bill.subtotal,
      totalDiscount: bill.totalDiscount,

      gstBreakdown,

      cgstTotal: Math.round(cgstTotal * 100) / 100,
      sgstTotal: Math.round(sgstTotal * 100) / 100,
      igstTotal: Math.round(igstTotal * 100) / 100,
      cessTotal: Math.round(cessTotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,

      tcsAmount: 0,
      roundOff: Math.round(roundOff * 100) / 100,
      grandTotal,

      amountInWords: this.numberToWords(grandTotal),

      paymentMode: input.paymentMode || payment?.paymentMethod,
      paymentReference: input.paymentReference || payment?.transactions[0]?.reference,
      paidAmount: payment?.totalAmount || 0,
      dueAmount: Math.max(0, grandTotal - (payment?.totalAmount || 0)),

      invoiceDate: input.invoiceDate || new Date(),
      dueDate: input.dueDate,
      status: InvoiceStatus.ISSUED,
      issuedAt: new Date(),
    });

    await invoice.save();
    return invoice;
  }

  private async getNextInvoiceSequence(): Promise<number> {
    const today = new Date();
    const yearMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

    const lastInvoice = await Invoice.findOne({
      invoiceNumber: { $regex: `^${config.invoice.invoicePrefix}${config.invoice.invoiceSuffix}` },
    }).sort({ invoiceNumber: -1 });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.slice(-6), 10);
      sequence = lastSequence + 1;
    }

    return sequence;
  }

  async getInvoice(invoiceId: string): Promise<IInvoice | null> {
    return Invoice.findOne({ invoiceId });
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<IInvoice | null> {
    return Invoice.findOne({ invoiceNumber });
  }

  async getInvoiceByBillId(billId: string): Promise<IInvoice | null> {
    return Invoice.findOne({ billId });
  }

  async getInvoicesByGstin(
    gstin: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ invoices: IInvoice[]; total: number; totalAmount: number }> {
    const query: Record<string, unknown> = { 'customerDetails.gstin': gstin };

    if (options.startDate || options.endDate) {
      query.invoiceDate = {};
      if (options.startDate) {
        (query.invoiceDate as Record<string, Date>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.invoiceDate as Record<string, Date>).$lte = options.endDate;
      }
    }

    const [invoices, total, amountResult] = await Promise.all([
      Invoice.find(query).sort({ invoiceDate: -1 }).limit(options.limit ?? 50).skip(options.skip ?? 0),
      Invoice.countDocuments(query),
      Invoice.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
    ]);

    return {
      invoices,
      total,
      totalAmount: amountResult[0]?.total || 0,
    };
  }

  async cancelInvoice(invoiceId: string, cancelledBy: string, reason?: string): Promise<IInvoice> {
    const invoice = await Invoice.findOne({ invoiceId });
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('Invoice is already cancelled');
    }

    invoice.status = InvoiceStatus.CANCELLED;
    await invoice.save();

    return invoice;
  }

  async generateGstReport(
    startDate: Date,
    endDate: Date,
    restaurantGstin?: string
  ): Promise<{
    period: { start: Date; end: Date };
    invoices: {
      totalInvoices: number;
      totalTaxableValue: number;
      cgstCollected: number;
      sgstCollected: number;
      igstCollected: number;
      cessCollected: number;
      totalTax: number;
      totalInvoiceValue: number;
    };
    byGstRate: Array<{
      rate: number;
      taxableAmount: number;
      cgst: number;
      sgst: number;
      igst: number;
      cess: number;
    }>;
    interstate: {
      count: number;
      taxableAmount: number;
      igst: number;
    };
  }> {
    const query: Record<string, unknown> = {
      status: InvoiceStatus.ISSUED,
      invoiceDate: { $gte: startDate, $lte: endDate },
    };

    if (restaurantGstin) {
      query['restaurantDetails.gstin'] = restaurantGstin;
    }

    const invoices = await Invoice.find(query);

    const totalInvoices = invoices.length;
    const totalTaxableValue = invoices.reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.taxableAmount, 0), 0);
    const cgstCollected = invoices.reduce((sum, inv) => sum + inv.cgstTotal, 0);
    const sgstCollected = invoices.reduce((sum, inv) => sum + inv.sgstTotal, 0);
    const igstCollected = invoices.reduce((sum, inv) => sum + inv.igstTotal, 0);
    const cessCollected = invoices.reduce((sum, inv) => sum + inv.cessTotal, 0);
    const totalTax = cgstCollected + sgstCollected + igstCollected + cessCollected;
    const totalInvoiceValue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    const byGstRateMap = new Map<number, {
      rate: number;
      taxableAmount: number;
      cgst: number;
      sgst: number;
      igst: number;
      cess: number;
    }>();

    invoices.forEach((inv) => {
      inv.gstBreakdown.forEach((breakdown) => {
        const existing = byGstRateMap.get(breakdown.rate) || {
          rate: breakdown.rate,
          taxableAmount: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          cess: 0,
        };
        existing.taxableAmount += breakdown.taxableAmount;
        existing.cgst += breakdown.cgstAmount;
        existing.sgst += breakdown.sgstAmount;
        existing.igst += breakdown.igstAmount;
        existing.cess += breakdown.cessAmount;
        byGstRateMap.set(breakdown.rate, existing);
      });
    });

    const interstateInvoices = invoices.filter(
      (inv) =>
        inv.restaurantDetails.state.toLowerCase() !== inv.customerDetails.state.toLowerCase() &&
        inv.customerDetails.gstin
    );

    return {
      period: { start: startDate, end: endDate },
      invoices: {
        totalInvoices,
        totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
        cgstCollected: Math.round(cgstCollected * 100) / 100,
        sgstCollected: Math.round(sgstCollected * 100) / 100,
        igstCollected: Math.round(igstCollected * 100) / 100,
        cessCollected: Math.round(cessCollected * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        totalInvoiceValue: Math.round(totalInvoiceValue * 100) / 100,
      },
      byGstRate: Array.from(byGstRateMap.values()).map((r) => ({
        ...r,
        taxableAmount: Math.round(r.taxableAmount * 100) / 100,
        cgst: Math.round(r.cgst * 100) / 100,
        sgst: Math.round(r.sgst * 100) / 100,
        igst: Math.round(r.igst * 100) / 100,
        cess: Math.round(r.cess * 100) / 100,
      })),
      interstate: {
        count: interstateInvoices.length,
        taxableAmount: Math.round(
          interstateInvoices.reduce(
            (sum, inv) => sum + inv.items.reduce((s, i) => s + i.taxableAmount, 0),
            0
          ) * 100
        ) / 100,
        igst: Math.round(interstateInvoices.reduce((sum, inv) => sum + inv.igstTotal, 0) * 100) / 100,
      },
    };
  }
}

export const gstInvoiceService = new GstInvoiceService();
