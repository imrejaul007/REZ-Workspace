/**
 * Tally Export API Service
 * Provides methods for exporting accounting data in Tally-compatible formats
 */

import { apiClient } from './client';

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

export interface GSTR1Summary {
  totalInvoices: number;
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalCess: number;
  totalInvoiceValue: number;
}

export interface GSTR1Response {
  data: GSTR1Record[];
  summary: GSTR1Summary;
  period: string;
}

export interface GSTR3BResponse {
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

export interface SalesReport {
  sales: SalesRecord[];
  purchases: PurchaseRecord[];
  expenses: ExpenseRecord[];
  summary: ReportSummary;
}

export interface SalesRecord {
  date: string;
  reference: string;
  type: string;
  description: string;
  amount: number;
  tax: number;
  paymentMethod: string;
  status: string;
}

export interface PurchaseRecord {
  date: string;
  reference: string;
  type: string;
  description: string;
  amount: number;
  category: string;
  vendor: string;
}

export interface ExpenseRecord {
  date: string;
  reference: string;
  type: string;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
}

export interface ReportSummary {
  period: { start: string; end: string };
  totalSales: number;
  totalTax: number;
  totalPurchases: number;
  totalExpenses: number;
  netIncome: number;
  salesCount: number;
  purchaseCount: number;
  expenseCount: number;
}

export type ExportType = 'sales' | 'purchase' | 'expense';

class TallyExportService {
  /**
   * Get GSTR-1 data for a period
   */
  async getGSTR1(storeId: string, month: string): Promise<GSTR1Response> {
    try {
      const response = await apiClient.get<GSTR1Response>(
        `merchant/export/gstr1?storeId=${storeId}&month=${month}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch GSTR-1 data');
    } catch (error) {
      if (__DEV__) console.error('GSTR-1 error:', error);
      throw new Error(error.message || 'Failed to fetch GSTR-1 data');
    }
  }

  /**
   * Get GSTR-3B data for a period
   */
  async getGSTR3B(storeId: string, month: string): Promise<GSTR3BResponse> {
    try {
      const response = await apiClient.get<GSTR3BResponse>(
        `merchant/export/gstr3b?storeId=${storeId}&month=${month}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch GSTR-3B data');
    } catch (error) {
      if (__DEV__) console.error('GSTR-3B error:', error);
      throw new Error(error.message || 'Failed to fetch GSTR-3B data');
    }
  }

  /**
   * Get comprehensive sales report
   */
  async getSalesReport(storeId: string, fromMonth: string, toMonth: string): Promise<SalesReport> {
    try {
      const response = await apiClient.get<SalesReport>(
        `merchant/export/report?storeId=${storeId}&fromMonth=${fromMonth}&toMonth=${toMonth}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch sales report');
    } catch (error) {
      if (__DEV__) console.error('Sales report error:', error);
      throw new Error(error.message || 'Failed to fetch sales report');
    }
  }

  /**
   * Download Tally XML export
   * Returns the XML content as string
   */
  async downloadTallyXML(
    storeId: string,
    fromMonth: string,
    toMonth: string,
    type: ExportType = 'sales'
  ): Promise<string> {
    try {
      const response = await apiClient.get(
        `merchant/export/tally?storeId=${storeId}&fromMonth=${fromMonth}&toMonth=${toMonth}&type=${type}`,
        { responseType: 'text' }
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to download Tally XML');
    } catch (error) {
      if (__DEV__) console.error('Tally XML download error:', error);
      throw new Error(error.message || 'Failed to download Tally XML');
    }
  }

  /**
   * Download CSV export
   */
  async downloadCSV(storeId: string, fromMonth: string, toMonth: string): Promise<string> {
    try {
      const response = await apiClient.get(
        `merchant/export/csv?storeId=${storeId}&fromMonth=${fromMonth}&toMonth=${toMonth}`,
        { responseType: 'text' }
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to download CSV');
    } catch (error) {
      if (__DEV__) console.error('CSV download error:', error);
      throw new Error(error.message || 'Failed to download CSV');
    }
  }
}

export const tallyExportService = new TallyExportService();
export default tallyExportService;
