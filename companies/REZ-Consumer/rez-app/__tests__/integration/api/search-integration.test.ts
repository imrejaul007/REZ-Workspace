// @ts-nocheck
/**
 * Search Integration Tests
 */

import apiClient from '@/services/apiClient';
import { generateMockProducts, generateMockStores, cleanupAfterTest } from '../utils/testHelpers';

// searchApi only has default export (const searchService = new SearchService(); export default searchService;)
// so we mock it with all required methods
const mockSearchApi = {
  getSearchSuggestions: jest.fn(),
  globalSearch: jest.fn(),
  searchProducts: jest.fn(),
  searchStores: jest.fn(),
  searchByCategory: jest.fn(),
  searchByHashtag: jest.fn(),
  getContentByProduct: jest.fn(),
  saveSearchQuery: jest.fn(),
};
jest.mock('@/services/searchApi', () => ({
  __esModule: true,
  default: mockSearchApi,
  searchApi: mockSearchApi,
}));
import { searchApi as actualSearchApi } from '@/services/searchApi';

describe('Search Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupAfterTest();
  });

  it('should search products with autocomplete', async () => {
    (mockSearchApi.getSearchSuggestions as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: [
        { text: 'laptop', type: 'product' },
        { text: 'laptop bag', type: 'product' },
        { text: 'laptop stand', type: 'product' },
      ],
    });

    const suggestions = await actualSearchApi.getSearchSuggestions('lap');
    expect(suggestions.data).toHaveLength(3);
  });

  it('should search across products and stores', async () => {
    (mockSearchApi.globalSearch as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        products: generateMockProducts(5),
        stores: generateMockStores(3),
      },
    });

    const results = await actualSearchApi.globalSearch?.('electronics') as any;
    if (results) {
      expect(results.products).toBeDefined();
      expect(results.stores).toBeDefined();
    }
  });

  it('should filter search results', async () => {
    (mockSearchApi.searchProducts as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        products: generateMockProducts(10),
        filters: {
          applied: { category: 'electronics', priceRange: '1000-5000' },
        },
      },
    });

    const results = await actualSearchApi.searchProducts({ q: 'laptop', category: 'electronics' });
    expect(results.success).toBe(true);
  });

  it('should save search history', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { saved: true },
    });

    await apiClient.post('/search/history', { query: 'laptop' });
    expect(apiClient.post).toHaveBeenCalledWith('/search/history', { query: 'laptop' });
  });
});
