/**
 * Category API - Stub implementation
 */

import { ApiResponse } from './apiClient';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  parentId?: string;
}

export default {
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    return { success: true, data: [] };
  },
  getCategoryBySlug: async (_slug: string): Promise<ApiResponse<Category>> => {
    return { success: true, data: { id: '', name: '', slug: '' } };
  },
};
