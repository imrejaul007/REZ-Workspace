import { pool } from '../config/database';
import { emailService } from './emailService';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerGstin: string;
  customerName: string;
  invoiceValue: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  invoiceDate: Date;
  placeOfSupply: string;
  reverseCharge: boolean;
}

interface CreditNote {
  id: string;
  creditNoteNumber: string;
  linkedInvoiceNumber: string;
  customerGstin: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  creditNoteDate: Date;
}

interface GSTR1Summary {
  totalInvoices: number;
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  totalInvoiceValue: number;
  b2bCount: number;
  b2clCount: number;
  b2csCount: number;
  exportCount: number;
  creditNoteCount: number;
}

interface GSTR1 {
  gstin: string;
  period: string;
  invoices: Invoice[];
  creditNotes: CreditNote[];
  summary: GSTR1Summary;
  generatedAt: Date;
}

interface GSTR3B {
  gstin: string;
  period: string;
  totalTaxableValue: number;
  totalTax: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  itcAvailable: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
  };
  itcReversed: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
  };
  interest: {
    igst: number;
    cgst: number;
    sgst: number;
  };
  generatedAt: Date;
}

interface FilingStatus {
  merchantId: string;
  period: string;
  gstr1Status: 'pending' | 'filed' | 'not_required';
  gstr3bStatus: 'pending' | 'filed' | 'not_required';
  gstr1FiledAt: Date | null;
  gstr3bFiledAt: Date | null;
  gstr1Arn: string | null;
  gstr3bArn: null;
  lastCheckedAt: Date;
  nextDueDate: Date;
}

interface TaxLiability {
  period: string;
  outwardSupplies: {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
  };
  inwardSupplies: {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
  };
  itcSummary: {
    available: number;
    claimed: number;
    reversed: number;
  };
  taxPayable: number;
  interestPayable: number;
  totalLiability: number;
}

export class GSTFilingService {

  async generateGSTR1(merchantId: string, period: string): Promise<GSTR1> {
    const [invoices, creditNotes] = await Promise.all([
      this.getB2BInvoices(merchantId, period),
      this.getCreditNotes(merchantId, period)
    ]);

    return {
      gstin: await this.getGSTIN(merchantId),
      period,
      invoices,
      creditNotes,
      summary: this.calculateSummary(invoices, creditNotes),
      generatedAt: new Date()
    };
  }

  async generateGSTR3B(merchantId: string, period: string): Promise<GSTR3B> {
    const [sales, purchases] = await Promise.all([
      this.getSales(merchantId, period),
      this.getPurchases(merchantId, period)
    ]);

    const tax = this.calculateTaxLiability(sales, purchases);

    return {
      gstin: await this.getGSTIN(merchantId),
      period,
      totalTaxableValue: tax.outwardSupplies.taxableValue,
      totalTax: tax.outwardSupplies.cgst + tax.outwardSupplies.sgst + tax.outwardSupplies.igst,
      igst: tax.outwardSupplies.igst,
      cgst: tax.outwardSupplies.cgst,
      sgst: tax.outwardSupplies.sgst,
      cess: tax.outwardSupplies.cess,
      itcAvailable: {
        igst: tax.itcSummary.available * 0.25,
        cgst: tax.itcSummary.available * 0.35,
        sgst: tax.itcSummary.available * 0.35,
        cess: tax.itcSummary.available * 0.05
      },
      itcReversed: {
        igst: 0,
        cgst: 0,
        sgst: 0,
        cess: 0
      },
      interest: {
        igst: 0,
        cgst: 0,
        sgst: 0
      },
      generatedAt: new Date()
    };
  }

  async getFilingStatus(merchantId: string, period: string): Promise<FilingStatus> {
    const result = await pool.query(
      `SELECT * FROM gst_filing_status WHERE merchant_id = $1 AND period = $2`,
      [merchantId, period]
    );

    if (result.rows.length === 0) {
      return {
        merchantId,
        period,
        gstr1Status: 'pending',
        gstr3bStatus: 'pending',
        gstr1FiledAt: null,
        gstr3bFiledAt: null,
        gstr1Arn: null,
        gstr3bArn: null,
        lastCheckedAt: new Date(),
        nextDueDate: this.calculateDueDate(period)
      };
    }

    const row = result.rows[0];
    return {
      merchantId,
      period,
      gstr1Status: row.gstr1_status,
      gstr3bStatus: row.gstr3b_status,
      gstr1FiledAt: row.gstr1_filed_at,
      gstr3bFiledAt: row.gstr3b_filed_at,
      gstr1Arn: row.gstr1_arn,
      gstr3bArn: row.gstr3b_arn,
      lastCheckedAt: new Date(),
      nextDueDate: this.calculateDueDate(period)
    };
  }

  async calculateLiability(merchantId: string, period: string): Promise<TaxLiability> {
    const [sales, purchases] = await Promise.all([
      this.getSales(merchantId, period),
      this.getPurchases(merchantId, period)
    ]);

    return this.calculateTaxLiability(sales, purchases);
  }

  async sendFilingAlerts(): Promise<void> {
    const today = new Date();
    const dueDateThreshold = new Date(today);
    dueDateThreshold.setDate(dueDateThreshold.getDate() + 7);

    const result = await pool.query(
      `SELECT m.id, m.business_name, m.gstin, m.email, m.pan_number,
              gfs.period, gfs.gstr1_status, gfs.gstr3b_status
       FROM merchants m
       LEFT JOIN gst_filing_status gfs ON m.id = gfs.merchant_id
       WHERE m.gstin IS NOT NULL
       AND (gfs.gstr1_status IS NULL OR gfs.gstr1_status = 'pending'
            OR gfs.gstr3b_status IS NULL OR gfs.gstr3b_status = 'pending')`
    );

    for (const merchant of result.rows) {
      const pendingForms: string[] = [];
      if (!merchant.gstr1_status || merchant.gstr1_status === 'pending') {
        pendingForms.push('GSTR-1');
      }
      if (!merchant.gstr3b_status || merchant.gstr3b_status === 'pending') {
        pendingForms.push('GSTR-3B');
      }

      if (pendingForms.length > 0) {
        const period = this.getCurrentPeriod();
        const dueDate = this.calculateDueDate(period);

        await emailService.sendEmail({
          to: merchant.email,
          subject: `GST Filing Alert: ${pendingForms.join(', ')} Due Soon`,
          template: 'gst-filing-alert',
          data: {
            businessName: merchant.business_name,
            gstin: merchant.gstin,
            pendingForms,
            dueDate: dueDate.toLocaleDateString('en-IN'),
            period
          }
        });
      }
    }
  }

  private async getB2BInvoices(merchantId: string, period: string): Promise<Invoice[]> {
    const result = await pool.query(
      `SELECT i.id, i.invoice_number, i.customer_gstin, i.customer_name,
              i.invoice_value, i.taxable_value, i.cgst, i.sgst, i.igst, i.cess,
              i.invoice_date, i.place_of_supply, i.reverse_charge
       FROM invoices i
       WHERE i.merchant_id = $1
       AND TO_CHAR(i.invoice_date, 'YYYY-MM') = $2
       AND i.status = 'completed'
       ORDER BY i.invoice_date`,
      [merchantId, period]
    );

    return result.rows.map(row => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      customerGstin: row.customer_gstin,
      customerName: row.customer_name,
      invoiceValue: parseFloat(row.invoice_value),
      taxableValue: parseFloat(row.taxable_value),
      cgst: parseFloat(row.cgst),
      sgst: parseFloat(row.sgst),
      igst: parseFloat(row.igst),
      cess: parseFloat(row.cess),
      invoiceDate: row.invoice_date,
      placeOfSupply: row.place_of_supply,
      reverseCharge: row.reverse_charge
    }));
  }

  private async getCreditNotes(merchantId: string, period: string): Promise<CreditNote[]> {
    const result = await pool.query(
      `SELECT cn.id, cn.credit_note_number, cn.linked_invoice_number,
              cn.customer_gstin, cn.taxable_value, cn.cgst, cn.sgst, cn.igst,
              cn.credit_note_date
       FROM credit_notes cn
       WHERE cn.merchant_id = $1
       AND TO_CHAR(cn.credit_note_date, 'YYYY-MM') = $2
       AND cn.status = 'issued'`,
      [merchantId, period]
    );

    return result.rows.map(row => ({
      id: row.id,
      creditNoteNumber: row.credit_note_number,
      linkedInvoiceNumber: row.linked_invoice_number,
      customerGstin: row.customer_gstin,
      taxableValue: parseFloat(row.taxable_value),
      cgst: parseFloat(row.cgst),
      sgst: parseFloat(row.sgst),
      igst: parseFloat(row.igst),
      creditNoteDate: row.credit_note_date
    }));
  }

  private async getSales(merchantId: string, period: string): Promise<Invoice[]> {
    return this.getB2BInvoices(merchantId, period);
  }

  private async getPurchases(merchantId: string, period: string): Promise<unknown[]> {
    const result = await pool.query(
      `SELECT p.id, p.invoice_number, p.supplier_gstin, p.supplier_name,
              p.taxable_value, p.cgst, p.sgst, p.igst, p.cess, p.invoice_date,
              p.place_of_supply, p.is_import
       FROM purchase_invoices p
       WHERE p.merchant_id = $1
       AND TO_CHAR(p.invoice_date, 'YYYY-MM') = $2
       AND p.status = 'verified'`,
      [merchantId, period]
    );

    return result.rows;
  }

  private async getGSTIN(merchantId: string): Promise<string> {
    const result = await pool.query(
      `SELECT gstin FROM merchants WHERE id = $1`,
      [merchantId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Merchant not found: ${merchantId}`);
    }

    return result.rows[0].gstin;
  }

  private calculateSummary(invoices: Invoice[], creditNotes: CreditNote[]): GSTR1Summary {
    return {
      totalInvoices: invoices.length,
      totalTaxableValue: invoices.reduce((sum, inv) => sum + inv.taxableValue, 0),
      totalCgst: invoices.reduce((sum, inv) => sum + inv.cgst, 0),
      totalSgst: invoices.reduce((sum, inv) => sum + inv.sgst, 0),
      totalIgst: invoices.reduce((sum, inv) => sum + inv.igst, 0),
      totalCess: invoices.reduce((sum, inv) => sum + inv.cess, 0),
      totalInvoiceValue: invoices.reduce((sum, inv) => sum + inv.invoiceValue, 0),
      b2bCount: invoices.filter(inv => inv.customerGstin && inv.customerGstin.length === 15).length,
      b2clCount: 0,
      b2csCount: 0,
      exportCount: 0,
      creditNoteCount: creditNotes.length
    };
  }

  private calculateTaxLiability(sales: Invoice[], purchases: unknown[]): TaxLiability {
    const outwardSupplies = {
      taxableValue: sales.reduce((sum, inv) => sum + inv.taxableValue, 0),
      cgst: sales.reduce((sum, inv) => sum + inv.cgst, 0),
      sgst: sales.reduce((sum, inv) => sum + inv.sgst, 0),
      igst: sales.reduce((sum, inv) => sum + inv.igst, 0),
      cess: sales.reduce((sum, inv) => sum + inv.cess, 0)
    };

    const inwardSupplies = {
      taxableValue: purchases.reduce((sum, p) => sum + parseFloat(p.taxable_value || 0), 0),
      cgst: purchases.reduce((sum, p) => sum + parseFloat(p.cgst || 0), 0),
      sgst: purchases.reduce((sum, p) => sum + parseFloat(p.sgst || 0), 0),
      igst: purchases.reduce((sum, p) => sum + parseFloat(p.igst || 0), 0),
      cess: purchases.reduce((sum, p) => sum + parseFloat(p.cess || 0), 0)
    };

    const totalTax = outwardSupplies.cgst + outwardSupplies.sgst + outwardSupplies.igst;
    const itcAvailable = inwardSupplies.cgst + inwardSupplies.sgst + inwardSupplies.igst;
    const taxPayable = Math.max(0, totalTax - itcAvailable * 0.9);
    const interestPayable = 0;

    return {
      period: this.getCurrentPeriod(),
      outwardSupplies,
      inwardSupplies,
      itcSummary: {
        available: itcAvailable,
        claimed: itcAvailable * 0.9,
        reversed: itcAvailable * 0.1
      },
      taxPayable,
      interestPayable,
      totalLiability: taxPayable + interestPayable
    };
  }

  private calculateDueDate(period: string): Date {
    const [year, month] = period.split('-').map(Number);
    const dueDate = new Date(year, month, 11);

    if (month === 3) {
      dueDate.setDate(20);
    }

    return dueDate;
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}

export const gstFilingService = new GSTFilingService();
