/**
 * Vouchers API - Stub implementation
 */

import { ApiResponse } from './apiClient';

export default {
  getVouchers: async (): Promise<ApiResponse<unknown[]>> => {
    return { success: true, data: [] };
  },
  getVoucher: async (_id: string): Promise<ApiResponse<unknown>> => {
    return { success: true, data: {} };
  },
  redeemVoucher: async (_code: string): Promise<ApiResponse<unknown>> => {
    return { success: true, data: {} };
  },
};
