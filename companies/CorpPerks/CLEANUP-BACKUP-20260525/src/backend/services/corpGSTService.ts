import { z } from 'zod';

export type GSTServiceType = 'dining' | 'hotel' | 'gifting' | 'travel';

interface GSTCalculationInput {
  amount: number;
  serviceType: GSTServiceType;
  companyGSTIN: string;
  placeOfSupply: string;
  issuerState?: string;
  description?: string;
}

interface GSTCalculationResult {
  hsnCode: string;
  description: string;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
  itcEligible: boolean;
  itcAmount: number;
}

interface InvoiceData {
  companyId: string;
  companyPrefix: string;
  serviceType: GSTServiceType;
  companyName: string;
  companyGSTIN: string;
  companyAddress?: string;
  contactPerson?: string;
  amount: number;
  issuerState: string;
  description?: string;
  orderId?: string;
  bookingId?: string;
  paymentId?: string;
  createdBy?: string;
}

interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  companyGSTIN: string;
  serviceType: GSTServiceType;
  amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  irn?: string;
  eInvoiceStatus?: string;
  createdAt: Date;
  createdBy?: string;
}

interface ITCCheckInput {
  serviceType: GSTServiceType;
  amount: number;
  companyType: 'regular' | 'composition';
  recipientName?: string;
}

interface GSTR1Input {
  companyId: string;
  month: number;
  year: number;
}

interface GSTR1Report {
  period: string;
  summary: {
    totalInvoices: number;
    totalTaxableValue: number;
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
  };
  invoices: Invoice[];
}

const HSN_CODES: Record<GSTServiceType, { code: string; description: string }> = {
  dining: { code: '9963', description: 'Restaurant accommodation services' },
  hotel: { code: '9963', description: 'Hotel accommodation services' },
  gifting: { code: '9994', description: 'Other goods and services n.e.c.' },
  travel: { code: '9964', description: 'Passenger transport services' },
};

class CorpGSTService {
  private getStateCode(state: string): string {
    const stateCodes: Record<string, string> = {
      'andaman': '35', 'andhra': '37', 'arunachal': '12', 'assam': '18',
      'bihar': '10', 'chandigarh': '04', 'chhattisgarh': '22', 'dadra': '26',
      'delhi': '07', 'goa': '30', 'gujarat': '24', 'haryana': '06',
      'himachal': '02', 'jammu': '01', 'jharkhand': '20', 'karnataka': '29',
      'kerala': '32', 'ladakh': '38', 'lakshadweep': '31', 'madhya': '23',
      'maharashtra': '27', 'manipur': '14', 'meghalaya': '17', 'mizoram': '15',
      'nagaland': '13', 'odisha': '21', 'puducherry': '34', 'punjab': '03',
      'rajasthan': '08', 'sikkim': '11', 'tamil': '33', 'telangana': '36',
      'tripura': '16', 'up': '09', 'uttarakhand': '05', 'west': '19',
    };
    return stateCodes[state.toLowerCase().substring(0, 6)] || '27';
  }

  async calculateGST(input: GSTCalculationInput): Promise<GSTCalculationResult> {
    const hsn = HSN_CODES[input.serviceType];
    const taxableAmount = input.amount;
    const issuerState = input.issuerState || input.placeOfSupply;

    const isInterState = this.getStateCode(issuerState) !== this.getStateCode(input.placeOfSupply);

    let cgstRate = 0, sgstRate = 0, igstRate = 0;
    if (isInterState) {
      igstRate = 18;
    } else {
      cgstRate = 9;
      sgstRate = 9;
    }

    const cgstAmount = Math.round((taxableAmount * cgstRate) / 100 * 100) / 100;
    const sgstAmount = Math.round((taxableAmount * sgstRate) / 100 * 100) / 100;
    const igstAmount = Math.round((taxableAmount * igstRate) / 100 * 100) / 100;
    const totalTax = Math.max(cgstAmount + sgstAmount, igstAmount);
    const grandTotal = Math.round((taxableAmount + totalTax) * 100) / 100;

    return {
      hsnCode: hsn.code,
      description: hsn.description,
      taxableAmount,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTax,
      grandTotal,
      itcEligible: input.companyGSTIN.length === 15,
      itcAmount: input.companyGSTIN.length === 15 ? totalTax : 0,
    };
  }

  checkITCeligibility(input: ITCCheckInput): { eligible: boolean; reason: string } {
    if (input.companyType === 'composition') {
      return { eligible: false, reason: 'Composition dealers cannot claim ITC' };
    }
    return { eligible: true, reason: 'ITC eligible for regular dealers' };
  }

  async createInvoice(input: InvoiceData): Promise<Invoice> {
    const calc = await this.calculateGST({
      amount: input.amount,
      serviceType: input.serviceType,
      companyGSTIN: input.companyGSTIN,
      placeOfSupply: input.issuerState,
      issuerState: input.issuerState,
    });

    const invoice: Invoice = {
      invoiceId: `INV-${Date.now()}`,
      invoiceNumber: `${input.companyPrefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
      companyId: input.companyId,
      companyName: input.companyName,
      companyGSTIN: input.companyGSTIN,
      serviceType: input.serviceType,
      amount: calc.taxableAmount,
      cgst: calc.cgstAmount,
      sgst: calc.sgstAmount,
      igst: calc.igstAmount,
      totalTax: calc.totalTax,
      grandTotal: calc.grandTotal,
      createdAt: new Date(),
      createdBy: input.createdBy,
    };

    return invoice;
  }

  async getInvoice(invoiceNumber: string): Promise<Invoice | null> {
    return null;
  }

  async getCompanyInvoices(params: {
    companyId: string;
    startDate?: Date;
    endDate?: Date;
    serviceType?: GSTServiceType;
    page: number;
    limit: number;
  }): Promise<{ invoices: Invoice[]; total: number }> {
    return { invoices: [], total: 0 };
  }

  async generateGSTR1Report(input: GSTR1Input): Promise<GSTR1Report> {
    return {
      period: `${input.year}-${String(input.month).padStart(2, '0')}`,
      summary: { totalInvoices: 0, totalTaxableValue: 0, totalCGST: 0, totalSGST: 0, totalIGST: 0 },
      invoices: [],
    };
  }

  async submitEInvoice(invoiceNumber: string): Promise<{ irn: string; status: string }> {
    return { irn: `IRN${Date.now()}`, status: 'pending' };
  }
}

export const corpGSTService = new CorpGSTService();
export { GSTServiceType };
