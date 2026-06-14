// @ts-nocheck
/**
 * Service Booking API - Stub implementation
 */

import { ApiResponse } from './apiClient';

export default {
  getBookings: async (): Promise<ApiResponse<unknown[]>> => {
    return { success: true, data: [] };
  },
  createBooking: async (_data): Promise<ApiResponse<unknown>> => {
    return { success: true, data: {} };
  },
};
