import { Product, Customer, Sale, Inventory } from '../src/models';

describe('Models', () => {
  describe('Product Model', () => {
    it('should create a product with required fields', async () => {
      const productData = {
        sku: 'TEST001',
        name: 'Test Product',
        category: 'Test',
        price: 29.99,
        cost: 10.00,
        stock: 50,
        lowStockThreshold: 10,
        isActive: true,
      };

      const product = new Product(productData);
      expect(product.sku).toBe('TEST001');
      expect(product.name).toBe('Test Product');
      expect(product.price).toBe(29.99);
    });

    it('should have virtual for profitMargin', async () => {
      const product = new Product({
        sku: 'TEST002',
        name: 'Profit Test',
        category: 'Test',
        price: 100,
        cost: 50,
        stock: 10,
      });

      expect(product.profitMargin).toBe(50);
    });

    it('should have virtual for isLowStock', async () => {
      const product = new Product({
        sku: 'TEST003',
        name: 'Low Stock Test',
        category: 'Test',
        price: 50,
        cost: 20,
        stock: 5,
        lowStockThreshold: 10,
      });

      expect(product.isLowStock).toBe(true);
    });
  });

  describe('Customer Model', () => {
    it('should create a customer with default values', () => {
      const customer = new Customer({
        name: 'Test Customer',
        phone: '+1234567890',
      });

      expect(customer.loyaltyPoints).toBe(0);
      expect(customer.tier).toBe('bronze');
      expect(customer.totalSpent).toBe(0);
      expect(customer.purchaseCount).toBe(0);
    });

    it('should have nextTier virtual', () => {
      const customer = new Customer({
        name: 'Test',
        phone: '+1234567891',
        tier: 'silver',
        loyaltyPoints: 1500,
      });

      expect(customer.nextTier).toBe('gold');
    });

    it('should return null for nextTier at platinum', () => {
      const customer = new Customer({
        name: 'VIP',
        phone: '+1234567892',
        tier: 'platinum',
        loyaltyPoints: 20000,
      });

      expect(customer.nextTier).toBeNull();
    });
  });

  describe('Inventory Model', () => {
    it('should create inventory with defaults', () => {
      const inventory = new Inventory({
        productId: '507f1f77bcf86cd799439011',
        quantity: 100,
        minStock: 10,
        maxStock: 500,
      });

      expect(inventory.quantity).toBe(100);
      expect(inventory.minStock).toBe(10);
      expect(inventory.maxStock).toBe(500);
    });

    it('should have status virtual', () => {
      const inventory = new Inventory({
        productId: '507f1f77bcf86cd799439012',
        quantity: 3,
        minStock: 10,
        maxStock: 100,
      });

      expect(inventory.status).toBe('low_stock');
    });

    it('should calculate suggested reorder quantity', () => {
      const inventory = new Inventory({
        productId: '507f1f77bcf86cd799439013',
        quantity: 5,
        minStock: 10,
        maxStock: 100,
      });

      expect(inventory.suggestedReorderQty).toBe(95);
    });
  });
});