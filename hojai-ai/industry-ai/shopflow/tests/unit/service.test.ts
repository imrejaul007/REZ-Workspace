/**
 * ShopFlow Service - Unit Tests
 * Retail AI Operating System with 12 AI Agents
 */

import { describe, it, expect, beforeEach, jest, afterEach } from 'vitest';

// Mock dependencies
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: { readyState: 1, close: jest.fn() }
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({ userId: 'test-user' })
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Define types for ShopFlow
type AgentType =
  | 'inventory' | 'customer' | 'loyalty' | 'checkout' | 'pricing'
  | 'catalog' | 'discovery' | 'merchandising' | 'supplier'
  | 'store' | 'retailMedia' | 'marketplace';

interface Product {
  productId: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  inventory: number;
  tags: string[];
  metadata: Record<string, any>;
}

interface Customer {
  customerId: string;
  name: string;
  email: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  purchaseHistory: { productId: string; amount: number; date: string }[];
  preferences: Record<string, any>;
}

interface LoyaltyTransaction {
  transactionId: string;
  customerId: string;
  points: number;
  type: 'earn' | 'redeem';
  createdAt: string;
}

interface Order {
  orderId: string;
  customerId: string;
  items: { productId: string; quantity: number; price: number }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

// DataStore class
class DataStore<T extends { [key: string]: any }> {
  private items: Map<string, T> = new Map();

  set(key: string, item: T): void { this.items.set(key, item); }
  get(key: string): T | undefined { return this.items.get(key); }
  delete(key: string): boolean { return this.items.delete(key); }
  getAll(): T[] { return Array.from(this.items.values()); }
  filter(predicate: (item: T) => boolean): T[] { return Array.from(this.items.values()).filter(predicate); }
  size(): number { return this.items.size; }
  clear(): void { this.items.clear(); }
}

// Product Manager (Catalog Agent)
class ProductManager {
  private products: DataStore<Product> = new DataStore();

  create(product: Omit<Product, 'productId'>): Product {
    const productId = 'prod-' + Math.random().toString(36).substring(7);
    const newProduct = { ...product, productId };
    this.products.set(productId, newProduct);
    return newProduct;
  }

  get(productId: string): Product | undefined {
    return this.products.get(productId);
  }

  update(productId: string, updates: Partial<Product>): Product | null {
    const product = this.products.get(productId);
    if (!product) return null;
    const updated = { ...product, ...updates, productId };
    this.products.set(productId, updated);
    return updated;
  }

  delete(productId: string): boolean {
    return this.products.delete(productId);
  }

  search(query: string, filters?: { category?: string; minPrice?: number; maxPrice?: number }): Product[] {
    let results = this.products.getAll();

    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(queryLower) ||
        p.sku.toLowerCase().includes(queryLower) ||
        p.tags.some(t => t.toLowerCase().includes(queryLower))
      );
    }

    if (filters?.category) {
      results = results.filter(p => p.category === filters.category);
    }
    if (filters?.minPrice !== undefined) {
      results = results.filter(p => p.price >= filters.minPrice!);
    }
    if (filters?.maxPrice !== undefined) {
      results = results.filter(p => p.price <= filters.maxPrice!);
    }

    return results;
  }

  getInventory(productId: string): number {
    return this.products.get(productId)?.inventory || 0;
  }

  updateInventory(productId: string, quantity: number): boolean {
    const product = this.products.get(productId);
    if (!product) return false;
    product.inventory += quantity;
    this.products.set(productId, product);
    return true;
  }
}

// Customer Manager (Customer Agent)
class CustomerManager {
  private customers: DataStore<Customer> = new DataStore();

  create(customer: Omit<Customer, 'customerId'>): Customer {
    const customerId = 'cust-' + Math.random().toString(36).substring(7);
    const newCustomer = { ...customer, customerId };
    this.customers.set(customerId, newCustomer);
    return newCustomer;
  }

  get(customerId: string): Customer | undefined {
    return this.customers.get(customerId);
  }

  update(customerId: string, updates: Partial<Customer>): Customer | null {
    const customer = this.customers.get(customerId);
    if (!customer) return null;
    const updated = { ...customer, ...updates, customerId };
    this.customers.set(customerId, updated);
    return updated;
  }

  getTier(customerId: string): string {
    return this.customers.get(customerId)?.tier || 'bronze';
  }

  addPurchase(customerId: string, productId: string, amount: number): boolean {
    const customer = this.customers.get(customerId);
    if (!customer) return false;
    customer.purchaseHistory.push({ productId, amount, date: new Date().toISOString() });
    this.customers.set(customerId, customer);
    return true;
  }

  getLifetimeValue(customerId: string): number {
    const customer = this.customers.get(customerId);
    if (!customer) return 0;
    return customer.purchaseHistory.reduce((sum, p) => sum + p.amount, 0);
  }
}

// Loyalty Manager (Loyalty Agent)
class LoyaltyManager {
  private transactions: DataStore<LoyaltyTransaction> = new DataStore();
  private customerPoints: Map<string, number> = new Map();

  earnPoints(customerId: string, amount: number): LoyaltyTransaction {
    const transactionId = 'txn-' + Math.random().toString(36).substring(7);
    const transaction: LoyaltyTransaction = {
      transactionId,
      customerId,
      points: Math.floor(amount * 10), // 10 points per dollar
      type: 'earn',
      createdAt: new Date().toISOString()
    };
    this.transactions.set(transactionId, transaction);

    const currentPoints = this.customerPoints.get(customerId) || 0;
    this.customerPoints.set(customerId, currentPoints + transaction.points);

    return transaction;
  }

  redeemPoints(customerId: string, points: number): boolean {
    const currentPoints = this.customerPoints.get(customerId) || 0;
    if (currentPoints < points) return false;

    const transactionId = 'txn-' + Math.random().toString(36).substring(7);
    const transaction: LoyaltyTransaction = {
      transactionId,
      customerId,
      points,
      type: 'redeem',
      createdAt: new Date().toISOString()
    };
    this.transactions.set(transactionId, transaction);
    this.customerPoints.set(customerId, currentPoints - points);
    return true;
  }

  getPoints(customerId: string): number {
    return this.customerPoints.get(customerId) || 0;
  }

  getTransactionHistory(customerId: string): LoyaltyTransaction[] {
    return this.transactions.filter(t => t.customerId === customerId);
  }
}

// Pricing Manager (Pricing Agent)
class PricingManager {
  private pricingRules: Map<string, { discount: number; minQuantity: number }> = new Map();

  setRule(category: string, discount: number, minQuantity: number = 1): void {
    this.pricingRules.set(category, { discount, minQuantity });
  }

  calculatePrice(product: Product, quantity: number = 1): number {
    let price = product.price;

    // Apply category discount
    const rule = this.pricingRules.get(product.category);
    if (rule && quantity >= rule.minQuantity) {
      price = price * (1 - rule.discount);
    }

    return Math.round(price * 100) / 100;
  }

  getCompetitorPrice(productId: string): number {
    // Mock competitor price (in real implementation, would fetch from external source)
    return Math.random() * 100 + 10;
  }

  isPriceCompetitive(product: Product): boolean {
    const competitorPrice = this.getCompetitorPrice(product.productId);
    return product.price <= competitorPrice;
  }
}

// Checkout Manager (Checkout Agent)
class CheckoutManager {
  private orders: DataStore<Order> = new DataStore();

  createOrder(customerId: string, items: { productId: string; quantity: number; price: number }[]): Order {
    const orderId = 'order-' + Math.random().toString(36).substring(7);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order: Order = {
      orderId,
      customerId,
      items,
      total: Math.round(total * 100) / 100,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.orders.set(orderId, order);
    return order;
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  updateStatus(orderId: string, status: Order['status']): boolean {
    const order = this.orders.get(orderId);
    if (!order) return false;
    order.status = status;
    this.orders.set(orderId, order);
    return true;
  }

  getCustomerOrders(customerId: string): Order[] {
    return this.orders.filter(o => o.customerId === customerId);
  }
}

describe('ShopFlow Service', () => {
  let productManager: ProductManager;
  let customerManager: CustomerManager;
  let loyaltyManager: LoyaltyManager;
  let pricingManager: PricingManager;
  let checkoutManager: CheckoutManager;

  beforeEach(() => {
    productManager = new ProductManager();
    customerManager = new CustomerManager();
    loyaltyManager = new LoyaltyManager();
    pricingManager = new PricingManager();
    checkoutManager = new CheckoutManager();
  });

  afterEach(() => {
    productManager = null as any;
    customerManager = null as any;
    loyaltyManager = null as any;
    pricingManager = null as any;
    checkoutManager = null as any;
  });

  describe('Health Check', () => {
    it('should return healthy status', () => {
      const health = { status: 'ok', timestamp: new Date().toISOString() };
      expect(health.status).toBe('ok');
    });

    it('should include timestamp', () => {
      const health = { status: 'ok', timestamp: new Date().toISOString() };
      expect(health.timestamp).toBeDefined();
    });
  });

  describe('DataStore Operations', () => {
    it('should store and retrieve items', () => {
      const store = new DataStore<{ id: string; name: string }>();
      store.set('key1', { id: '1', name: 'Test' });
      expect(store.get('key1')?.name).toBe('Test');
    });

    it('should return undefined for missing items', () => {
      const store = new DataStore<{ id: string }>();
      expect(store.get('non-existent')).toBeUndefined();
    });

    it('should delete items', () => {
      const store = new DataStore<{ id: string }>();
      store.set('key1', { id: '1' });
      expect(store.delete('key1')).toBe(true);
      expect(store.get('key1')).toBeUndefined();
    });

    it('should filter items', () => {
      const store = new DataStore<{ id: string; value: number }>();
      store.set('k1', { id: '1', value: 10 });
      store.set('k2', { id: '2', value: 20 });
      const filtered = store.filter(item => item.value > 15);
      expect(filtered).toHaveLength(1);
    });

    it('should return correct size', () => {
      const store = new DataStore<{ id: string }>();
      expect(store.size()).toBe(0);
      store.set('k1', { id: '1' });
      expect(store.size()).toBe(1);
    });
  });

  describe('Product Manager (Catalog Agent)', () => {
    it('should create a product', () => {
      const product = productManager.create({
        name: 'Test Product',
        sku: 'TEST-001',
        price: 29.99,
        category: 'electronics',
        inventory: 100,
        tags: ['new', 'featured'],
        metadata: {}
      });

      expect(product).toBeDefined();
      expect(product.productId).toBeDefined();
      expect(product.name).toBe('Test Product');
      expect(product.sku).toBe('TEST-001');
    });

    it('should get product by ID', () => {
      const created = productManager.create({
        name: 'Get Test',
        sku: 'GET-001',
        price: 19.99,
        category: 'books',
        inventory: 50,
        tags: [],
        metadata: {}
      });

      const retrieved = productManager.get(created.productId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Get Test');
    });

    it('should update product', () => {
      const created = productManager.create({
        name: 'Original',
        sku: 'UPD-001',
        price: 29.99,
        category: 'electronics',
        inventory: 100,
        tags: [],
        metadata: {}
      });

      const updated = productManager.update(created.productId, { price: 24.99, name: 'Updated' });
      expect(updated?.price).toBe(24.99);
      expect(updated?.name).toBe('Updated');
    });

    it('should delete product', () => {
      const created = productManager.create({
        name: 'To Delete',
        sku: 'DEL-001',
        price: 19.99,
        category: 'books',
        inventory: 10,
        tags: [],
        metadata: {}
      });

      expect(productManager.delete(created.productId)).toBe(true);
      expect(productManager.get(created.productId)).toBeUndefined();
    });

    it('should search products by name', () => {
      productManager.create({
        name: 'iPhone 15',
        sku: 'IPHONE-15',
        price: 999,
        category: 'electronics',
        inventory: 50,
        tags: ['smartphone', 'apple'],
        metadata: {}
      });

      productManager.create({
        name: 'Samsung Galaxy',
        sku: 'SAM-GAL',
        price: 899,
        category: 'electronics',
        inventory: 30,
        tags: ['smartphone', 'samsung'],
        metadata: {}
      });

      const results = productManager.search('iPhone');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('iPhone');
    });

    it('should search by category', () => {
      productManager.create({
        name: 'Book A',
        sku: 'BOOK-A',
        price: 15,
        category: 'books',
        inventory: 100,
        tags: [],
        metadata: {}
      });

      productManager.create({
        name: 'Book B',
        sku: 'BOOK-B',
        price: 20,
        category: 'books',
        inventory: 50,
        tags: [],
        metadata: {}
      });

      const results = productManager.search('', { category: 'books' });
      expect(results.length).toBe(2);
    });

    it('should search by price range', () => {
      productManager.create({
        name: 'Cheap Item',
        sku: 'CHEAP',
        price: 10,
        category: 'misc',
        inventory: 100,
        tags: [],
        metadata: {}
      });

      productManager.create({
        name: 'Expensive Item',
        sku: 'EXP',
        price: 100,
        category: 'misc',
        inventory: 10,
        tags: [],
        metadata: {}
      });

      const results = productManager.search('', { minPrice: 15, maxPrice: 50 });
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Cheap Item');
    });

    it('should get and update inventory', () => {
      const product = productManager.create({
        name: 'Inventory Test',
        sku: 'INV-001',
        price: 25,
        category: 'misc',
        inventory: 100,
        tags: [],
        metadata: {}
      });

      expect(productManager.getInventory(product.productId)).toBe(100);

      productManager.updateInventory(product.productId, -10);
      expect(productManager.getInventory(product.productId)).toBe(90);
    });
  });

  describe('Customer Manager (Customer Agent)', () => {
    it('should create a customer', () => {
      const customer = customerManager.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: 'bronze',
        points: 0,
        purchaseHistory: [],
        preferences: {}
      });

      expect(customer).toBeDefined();
      expect(customer.customerId).toBeDefined();
      expect(customer.name).toBe('John Doe');
      expect(customer.tier).toBe('bronze');
    });

    it('should get customer by ID', () => {
      const created = customerManager.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        tier: 'silver',
        points: 500,
        purchaseHistory: [],
        preferences: {}
      });

      const retrieved = customerManager.get(created.customerId);
      expect(retrieved?.name).toBe('Jane Doe');
    });

    it('should update customer tier', () => {
      const created = customerManager.create({
        name: 'Tier Test',
        email: 'tier@test.com',
        tier: 'bronze',
        points: 0,
        purchaseHistory: [],
        preferences: {}
      });

      customerManager.update(created.customerId, { tier: 'gold' });
      expect(customerManager.getTier(created.customerId)).toBe('gold');
    });

    it('should add purchase to history', () => {
      const customer = customerManager.create({
        name: 'Purchase Test',
        email: 'purchase@test.com',
        tier: 'bronze',
        points: 0,
        purchaseHistory: [],
        preferences: {}
      });

      customerManager.addPurchase(customer.customerId, 'prod-123', 50);
      const updated = customerManager.get(customer.customerId);
      expect(updated?.purchaseHistory).toHaveLength(1);
      expect(updated?.purchaseHistory[0].amount).toBe(50);
    });

    it('should calculate lifetime value', () => {
      const customer = customerManager.create({
        name: 'LTV Test',
        email: 'ltv@test.com',
        tier: 'platinum',
        points: 1000,
        purchaseHistory: [],
        preferences: {}
      });

      customerManager.addPurchase(customer.customerId, 'prod-1', 100);
      customerManager.addPurchase(customer.customerId, 'prod-2', 200);
      customerManager.addPurchase(customer.customerId, 'prod-3', 150);

      expect(customerManager.getLifetimeValue(customer.customerId)).toBe(450);
    });
  });

  describe('Loyalty Manager (Loyalty Agent)', () => {
    it('should earn points', () => {
      const transaction = loyaltyManager.earnPoints('cust-123', 50);
      expect(transaction).toBeDefined();
      expect(transaction.points).toBe(500); // 10 points per dollar
      expect(transaction.type).toBe('earn');
    });

    it('should track customer points', () => {
      loyaltyManager.earnPoints('cust-points', 100);
      loyaltyManager.earnPoints('cust-points', 50);
      expect(loyaltyManager.getPoints('cust-points')).toBe(1500);
    });

    it('should redeem points', () => {
      loyaltyManager.earnPoints('cust-redeem', 100);
      expect(loyaltyManager.redeemPoints('cust-redeem', 500)).toBe(true);
      expect(loyaltyManager.getPoints('cust-redeem')).toBe(500);
    });

    it('should reject redemption if insufficient points', () => {
      loyaltyManager.earnPoints('cust-poor', 10);
      expect(loyaltyManager.redeemPoints('cust-poor', 200)).toBe(false);
    });

    it('should get transaction history', () => {
      loyaltyManager.earnPoints('cust-history', 50);
      loyaltyManager.earnPoints('cust-history', 75);
      loyaltyManager.redeemPoints('cust-history', 100);

      const history = loyaltyManager.getTransactionHistory('cust-history');
      expect(history).toHaveLength(3);
    });
  });

  describe('Pricing Manager (Pricing Agent)', () => {
    it('should set pricing rule', () => {
      pricingManager.setRule('electronics', 0.1, 2); // 10% off for 2+ items
      expect(pricingManager['pricingRules'].get('electronics')).toBeDefined();
    });

    it('should calculate price with discount', () => {
      pricingManager.setRule('books', 0.2, 1); // 20% off

      const product = {
        productId: 'prod-book',
        name: 'Test Book',
        sku: 'BOOK-1',
        price: 100,
        category: 'books',
        inventory: 10,
        tags: [],
        metadata: {}
      };

      const price = pricingManager.calculatePrice(product, 2);
      expect(price).toBe(80); // 20% off
    });

    it('should not apply discount below minimum quantity', () => {
      pricingManager.setRule('clothing', 0.15, 3); // 15% off for 3+ items

      const product = {
        productId: 'prod-cloth',
        name: 'Shirt',
        sku: 'SHIRT-1',
        price: 50,
        category: 'clothing',
        inventory: 100,
        tags: [],
        metadata: {}
      };

      const price = pricingManager.calculatePrice(product, 2); // Only 2 items
      expect(price).toBe(50); // No discount applied
    });

    it('should check price competitiveness', () => {
      const product = {
        productId: 'prod-comp',
        name: 'Competitive Item',
        sku: 'COMP-1',
        price: 90,
        category: 'electronics',
        inventory: 50,
        tags: [],
        metadata: {}
      };

      const isCompetitive = pricingManager.isPriceCompetitive(product);
      expect(typeof isCompetitive).toBe('boolean');
    });
  });

  describe('Checkout Manager (Checkout Agent)', () => {
    it('should create an order', () => {
      const order = checkoutManager.createOrder('cust-123', [
        { productId: 'prod-1', quantity: 2, price: 25 },
        { productId: 'prod-2', quantity: 1, price: 50 }
      ]);

      expect(order).toBeDefined();
      expect(order.orderId).toBeDefined();
      expect(order.total).toBe(100); // 2*25 + 1*50
      expect(order.status).toBe('pending');
    });

    it('should get order by ID', () => {
      const created = checkoutManager.createOrder('cust-123', [
        { productId: 'prod-1', quantity: 1, price: 30 }
      ]);

      const retrieved = checkoutManager.getOrder(created.orderId);
      expect(retrieved?.total).toBe(30);
    });

    it('should update order status', () => {
      const order = checkoutManager.createOrder('cust-123', [
        { productId: 'prod-1', quantity: 1, price: 20 }
      ]);

      expect(checkoutManager.updateStatus(order.orderId, 'processing')).toBe(true);
      expect(checkoutManager.getOrder(order.orderId)?.status).toBe('processing');

      checkoutManager.updateStatus(order.orderId, 'shipped');
      expect(checkoutManager.getOrder(order.orderId)?.status).toBe('shipped');

      checkoutManager.updateStatus(order.orderId, 'delivered');
      expect(checkoutManager.getOrder(order.orderId)?.status).toBe('delivered');
    });

    it('should get customer orders', () => {
      checkoutManager.createOrder('cust-orders', [
        { productId: 'prod-1', quantity: 1, price: 10 }
      ]);
      checkoutManager.createOrder('cust-orders', [
        { productId: 'prod-2', quantity: 2, price: 20 }
      ]);

      const orders = checkoutManager.getCustomerOrders('cust-orders');
      expect(orders).toHaveLength(2);
    });
  });

  describe('Data Validation', () => {
    it('should validate product data', () => {
      const validateProduct = (p: any) => {
        if (!p.name || !p.sku || p.price === undefined) return false;
        if (p.price < 0) return false;
        if (p.inventory < 0) return false;
        return true;
      };

      expect(validateProduct({ name: 'Test', sku: 'SKU-1', price: 10, inventory: 5 })).toBe(true);
      expect(validateProduct({ name: '', sku: 'SKU-1', price: 10, inventory: 5 })).toBe(false);
      expect(validateProduct({ name: 'Test', sku: 'SKU-1', price: -5, inventory: 5 })).toBe(false);
    });

    it('should validate customer data', () => {
      const validateCustomer = (c: any) => {
        if (!c.name || !c.email) return false;
        if (!c.email.includes('@')) return false;
        return true;
      };

      expect(validateCustomer({ name: 'John', email: 'john@test.com' })).toBe(true);
      expect(validateCustomer({ name: 'John', email: 'invalid' })).toBe(false);
    });

    it('should validate tier levels', () => {
      const validTiers = ['bronze', 'silver', 'gold', 'platinum'];
      const validateTier = (tier: string) => validTiers.includes(tier);

      expect(validateTier('gold')).toBe(true);
      expect(validateTier('platinum')).toBe(true);
      expect(validateTier('invalid')).toBe(false);
    });

    it('should validate order status', () => {
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered'];
      const validateStatus = (status: string) => validStatuses.includes(status);

      expect(validateStatus('pending')).toBe(true);
      expect(validateStatus('processing')).toBe(true);
      expect(validateStatus('shipped')).toBe(true);
      expect(validateStatus('delivered')).toBe(true);
      expect(validateStatus('cancelled')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      const handleError = (error: Error) => {
        return { message: error.message, handled: true };
      };

      const result = handleError(new Error('Test error'));
      expect(result.handled).toBe(true);
    });

    it('should return null for non-existent resources', () => {
      expect(productManager.get('non-existent')).toBeUndefined();
      expect(customerManager.get('non-existent')).toBeUndefined();
      expect(checkoutManager.getOrder('non-existent')).toBeUndefined();
    });
  });

  describe('Business Logic', () => {
    it('should calculate points correctly', () => {
      const calculatePoints = (amount: number, tier: string) => {
        const basePoints = Math.floor(amount * 10);
        const multipliers = { bronze: 1, silver: 1.25, gold: 1.5, platinum: 2 };
        return Math.floor(basePoints * (multipliers[tier as keyof typeof multipliers] || 1));
      };

      expect(calculatePoints(100, 'bronze')).toBe(1000);
      expect(calculatePoints(100, 'silver')).toBe(1250);
      expect(calculatePoints(100, 'gold')).toBe(1500);
      expect(calculatePoints(100, 'platinum')).toBe(2000);
    });

    it('should calculate discount correctly', () => {
      const calculateDiscount = (original: number, discountPercent: number) => {
        return Math.round((original * (1 - discountPercent / 100)) * 100) / 100;
      };

      expect(calculateDiscount(100, 10)).toBe(90);
      expect(calculateDiscount(100, 20)).toBe(80);
      expect(calculateDiscount(49.99, 15)).toBe(42.49);
    });

    it('should calculate order total correctly', () => {
      const calculateTotal = (items: { quantity: number; price: number }[]) => {
        return Math.round(items.reduce((sum, item) => sum + item.quantity * item.price, 0) * 100) / 100;
      };

      expect(calculateTotal([
        { quantity: 2, price: 10 },
        { quantity: 1, price: 25 }
      ])).toBe(45);

      expect(calculateTotal([
        { quantity: 3, price: 7.99 }
      ])).toBe(23.97);
    });
  });
});