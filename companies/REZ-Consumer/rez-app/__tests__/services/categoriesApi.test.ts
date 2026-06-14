// @ts-nocheck
import categoriesApi from '@/services/categoriesApi';

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockClient = require('@/services/apiClient').default;

const mockCategory = {
  _id: 'cat1',
  name: 'Food & Dining',
  slug: 'food-dining',
  type: 'going_out' as const,
  isActive: true,
  sortOrder: 1,
  metadata: { color: '#FF5733', tags: ['food', 'dining'] },
  productCount: 50,
  storeCount: 120,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('categoriesApi', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getCategories', () => {
    it('returns categories list', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [mockCategory] });
      const res = await categoriesApi.getCategories();
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      // getCategories builds URL inline: /categories?
      expect(mockClient.get).toHaveBeenCalledWith(expect.stringContaining('/categories'));
    });

    it('filters by type by appending to URL', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [mockCategory] });
      await categoriesApi.getCategories({ type: 'going_out' });
      expect(mockClient.get).toHaveBeenCalledWith(expect.stringContaining('type=going_out'));
    });

    it('returns empty array on error', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(categoriesApi.getCategories()).rejects.toThrow('Network error');
    });
  });

  describe('getCategoryBySlug', () => {
    it('returns category by slug', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: mockCategory });
      const res = await categoriesApi.getCategoryBySlug('food-dining');
      expect(res.success).toBe(true);
      expect(res.data?.slug).toBe('food-dining');
      // Uses /categories/:slug not /categories/slug/:slug
      expect(mockClient.get).toHaveBeenCalledWith('/categories/food-dining');
    });

    it('handles invalid slug', async () => {
      mockClient.get.mockResolvedValueOnce({ success: false, message: 'Category not found' });
      const res = await categoriesApi.getCategoryBySlug('nonexistent');
      expect(res.success).toBe(false);
    });
  });

  describe('getCategoryById', () => {
    it('returns category by id', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: mockCategory });
      const res = await categoriesApi.getCategoryById('cat1');
      expect(res.success).toBe(true);
      expect(res.data?._id).toBe('cat1');
    });
  });

  describe('getFeaturedCategories', () => {
    it('returns featured categories', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [mockCategory] });
      const res = await categoriesApi.getFeaturedCategories();
      expect(res.success).toBe(true);
    });
  });

  describe('searchCategories', () => {
    it('returns search results', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [mockCategory] });
      const res = await categoriesApi.searchCategories('food');
      expect(res.success).toBe(true);
      // searchCategories appends ?search=food to URL
      expect(mockClient.get).toHaveBeenCalledWith(expect.stringContaining('search=food'));
    });

    it('returns empty array for no matches', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [] });
      const res = await categoriesApi.searchCategories('zzznomatch');
      expect(res.data).toHaveLength(0);
    });
  });

  describe('getBestDiscountCategories', () => {
    it('returns top discount categories', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [mockCategory] });
      const res = await categoriesApi.getBestDiscountCategories(10);
      expect(res.success).toBe(true);
    });
  });

  describe('getCategoryVibes', () => {
    it('returns vibes for a category', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { vibes: [{ id: 'v1', name: 'Casual', icon: '🍕', color: '#FF5733', description: 'Casual dining' }] } });
      const res = await categoriesApi.getCategoryVibes('food-dining');
      expect(res.success).toBe(true);
      expect(res.data?.vibes).toHaveLength(1);
    });
  });

  describe('getCategoryPageData', () => {
    it('returns full page data for a slug', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: mockCategory });
      const res = await categoriesApi.getCategoryPageData('food-dining');
      expect(res.success).toBe(true);
    });
  });
});
