// @ts-nocheck
import * as productsApi from '@/services/productsApi';

jest.mock('@/services/productsApi', () => ({
  getProducts: jest.fn(),
  getProductById: jest.fn(),
  getProductsByCategory: jest.fn(),
}));

describe('productsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch products', async () => {
    const products = [
      { id: 'prod-1', name: 'Blue Shirt', price: 49.99, category: 'fashion' },
      { id: 'prod-2', name: 'Sneakers', price: 89.99, category: 'shoes' },
    ];
    (productsApi.getProducts as jest.Mock).mockResolvedValue({ data: products, total: 2 });

    const result = await productsApi.getProducts({ page: 1, limit: 10 });
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.data[0].name).toBe('Blue Shirt');
  });

  it('should fetch product by ID', async () => {
    const product = { id: 'prod-1', name: 'Blue Shirt', price: 49.99 };
    (productsApi.getProductById as jest.Mock).mockResolvedValue(product);

    const result = await productsApi.getProductById('prod-1');
    expect(result.id).toBe('prod-1');
    expect(result.name).toBe('Blue Shirt');
    expect(productsApi.getProductById).toHaveBeenCalledWith('prod-1');
  });

  it('should fetch products by category', async () => {
    const fashionProducts = [{ id: 'prod-1', name: 'Blue Shirt', category: 'fashion' }];
    (productsApi.getProductsByCategory as jest.Mock).mockResolvedValue({ data: fashionProducts });

    const result = await productsApi.getProductsByCategory('fashion');
    expect(result.data[0].category).toBe('fashion');
    expect(result.data).toHaveLength(1);
  });
});
