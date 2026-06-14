import { apiClient } from './client';

export interface GSTR1Data {
  period: string;
  totalSales: number;
  totalTax: number;
  count: number;
}

export interface GSTR3BData {
  period: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
}

class GSTService {
  async getGSTR1(storeId: string, month: string): Promise<GSTR1Data> {
    try {
      const response = await apiClient.get<GSTR1Data>(
        `merchant/gst/gstr1?storeId=${storeId}&month=${month}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch GSTR-1 data');
    } catch (error) {
      if (__DEV__) console.error('GSTR-1 error:', error);
      throw new Error(error.message || 'Failed to fetch GSTR-1 data');
    }
  }

  async getGSTR3B(storeId: string, month: string): Promise<GSTR3BData> {
    try {
      const response = await apiClient.get<GSTR3BData>(
        `merchant/gst/gstr3b?storeId=${storeId}&month=${month}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch GSTR-3B data');
    } catch (error) {
      if (__DEV__) console.error('GSTR-3B error:', error);
      throw new Error(error.message || 'Failed to fetch GSTR-3B data');
    }
  }
}

export const gstService = new GSTService();
export default gstService;
