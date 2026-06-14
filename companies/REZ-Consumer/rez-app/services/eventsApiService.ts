/**
 * Events API - Stub implementation
 */

import { ApiResponse } from './apiClient';

export default {
  getEvents: async (): Promise<ApiResponse<unknown[]>> => {
    return { success: true, data: [] };
  },
  getEvent: async (_id: string): Promise<ApiResponse<unknown>> => {
    return { success: true, data: {} };
  },
};
