/**
 * Restaurant Booking API - Stub implementation
 */

import { ApiResponse } from './apiClient';

export default {
  getRestaurants: async (): Promise<ApiResponse<unknown[]>> => {
    return { success: true, data: [] };
  },
  getRestaurant: async (_id: string): Promise<ApiResponse<unknown>> => {
    return { success: true, data: {} };
  },
};
