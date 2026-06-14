jest.mock('../../services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { apiClient } from '../../services/api/client';
const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

let productsService: any;
beforeAll(async () => {
  const mod = require('../../services/api/products');
  productsService = mod.productsService;
});

describe('ProductsService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getProducts', () => {
    it('returns product list', async () => {
      mockGet.mockResolvedValue({
        success: true,
        data: { items: [{ _id: 'p1', name: 'Burger' }], total: 1 },
      });
      const result = await productsService.getProducts();
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('merchant/products'));
    });

    it('passes filter params', async () => {
      mockGet.mockResolvedValue({ success: true, data: { items: [], total: 0 } });
      await productsService.getProducts({ category: 'food', isActive: true });
      const url = mockGet.mock.calls[0][0];
      expect(url).toContain('category=food');
    });
  });

  describe('getProduct', () => {
    it('fetches single product', async () => {
      mockGet.mockResolvedValue({ success: true, data: { _id: 'p1', name: 'Burger' } });
      const result = await productsService.getProduct('p1');
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('p1'));
    });
  });

  describe('createProduct', () => {
    it('creates product', async () => {
      const newProduct = { name: 'Pizza', price: 299, category: 'food' };
      mockPost.mockResolvedValue({ success: true, data: { _id: 'p2', ...newProduct } });
      const result = await productsService.createProduct(newProduct);
      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('products'),
        expect.objectContaining({ name: 'Pizza' })
      );
    });
  });

  describe('updateProduct', () => {
    it('updates product fields', async () => {
      mockPut.mockResolvedValue({ success: true, data: { _id: 'p1', price: 350 } });
      const result = await productsService.updateProduct('p1', { price: 350 });
      expect(mockPut).toHaveBeenCalledWith(
        expect.stringContaining('p1'),
        expect.objectContaining({ price: 350 })
      );
    });
  });

  describe('deleteProduct', () => {
    it('deletes product', async () => {
      mockDelete.mockResolvedValue({ success: true });
      await productsService.deleteProduct('p1');
      expect(mockDelete).toHaveBeenCalledWith(expect.stringContaining('p1'));
    });
  });

  describe('getCategories', () => {
    it('returns category list', async () => {
      mockGet.mockResolvedValue({ success: true, data: [{ label: 'Food', value: 'food' }] });
      const result = await productsService.getCategories();
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('categories'));
    });
  });

  describe('toggleProductStatus', () => {
    it('toggles active status', async () => {
      mockPut.mockResolvedValue({ success: true, data: { _id: 'p1', isActive: false } });
      const result = await productsService.toggleProductStatus('p1');
      expect(mockPut).toHaveBeenCalled();
    });
  });

  describe('getLowStockProducts', () => {
    it('returns low stock items', async () => {
      mockGet.mockResolvedValue({ success: true, data: [{ _id: 'p3', stock: 2 }] });
      const result = await productsService.getLowStockProducts(10);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('stockLevel=low_stock'));
    });
  });
});
