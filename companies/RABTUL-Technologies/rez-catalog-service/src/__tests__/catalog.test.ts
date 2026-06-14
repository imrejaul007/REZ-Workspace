/**
 * Catalog Service Tests
 * Tests for product management, inventory, and search
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  inventory: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  category: string;
  tags: string[];
}

interface Category {
  id: string;
  name: string;
  parentId?: string;
  path: string[];
}

// Product validation
function validateProduct(product: Partial<Product>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!product.name || product.name.trim().length === 0) {
    errors.push('name is required');
  }
  if (product.name && product.name.length > 200) {
    errors.push('name must be less than 200 characters');
  }
  if (!product.sku || product.sku.trim().length === 0) {
    errors.push('sku is required');
  }
  if (product.price === undefined || product.price < 0) {
    errors.push('price must be a non-negative number');
  }
  if (product.inventory !== undefined && product.inventory < 0) {
    errors.push('inventory cannot be negative');
  }

  return { valid: errors.length === 0, errors };
}

// SKU generation
function generateSKU(category: string, name: string): string {
  const catPrefix = category.substring(0, 3).toUpperCase();
  const namePart = name.substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${catPrefix}-${namePart}-${random}`;
}

// Price calculation with tax
function calculatePrice(basePrice: number, taxRate: number = 0.18): {
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
} {
  const taxAmount = basePrice * taxRate;
  return {
    basePrice,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalPrice: Math.round((basePrice + taxAmount) * 100) / 100
  };
}

// Inventory check
function canFulfill(product: Product, quantity: number): boolean {
  return product.status === 'active' && product.inventory >= quantity;
}

// Category path
function buildCategoryPath(categories: Category[], categoryId: string): string[] {
  const path: string[] = [];
  let current = categories.find(c => c.id === categoryId);

  while (current) {
    path.unshift(current.name);
    if (current.parentId) {
      current = categories.find(c => c.id === current!.parentId);
    } else {
      break;
    }
  }

  return path;
}

describe('Product Validation', () => {
  it('should validate complete product', () => {
    const product = {
      name: 'Test Product',
      sku: 'TEST-001',
      price: 100,
      inventory: 10
    };

    const result = validateProduct(product);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty name', () => {
    const product = { name: '', sku: 'TEST-001', price: 100 };
    const result = validateProduct(product);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('name is required');
  });

  it('should reject missing sku', () => {
    const product = { name: 'Test', sku: '', price: 100 };
    const result = validateProduct(product);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('sku is required');
  });

  it('should reject negative price', () => {
    const product = { name: 'Test', sku: 'TEST-001', price: -10 };
    const result = validateProduct(product);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('price must be a non-negative number');
  });

  it('should reject negative inventory', () => {
    const product = { name: 'Test', sku: 'TEST-001', price: 100, inventory: -5 };
    const result = validateProduct(product);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('inventory cannot be negative');
  });

  it('should allow zero price', () => {
    const product = { name: 'Free Item', sku: 'FREE-001', price: 0 };
    const result = validateProduct(product);
    expect(result.valid).toBe(true);
  });
});

describe('SKU Generation', () => {
  it('should generate SKU with category prefix', () => {
    const sku = generateSKU('electronics', 'Phone');
    expect(sku).toMatch(/^ELE-PHONE-[A-Z0-9]{4}$/);
  });

  it('should handle category with spaces', () => {
    const sku = generateSKU('home appliances', 'Laptop');
    expect(sku).toMatch(/^HOM-LAPTO-[A-Z0-9]{4}$/);
  });

  it('should strip special characters from name', () => {
    const sku = generateSKU('cat', 'Test!@#Product');
    expect(sku).not.toContain('!');
    expect(sku).not.toContain('@');
    expect(sku).not.toContain('#');
  });

  it('should generate unique SKUs', () => {
    const skus = new Set(Array.from({ length: 100 }, () => generateSKU('cat', 'name')));
    expect(skus.size).toBe(100);
  });
});

describe('Price Calculation', () => {
  it('should calculate price with default GST (18%)', () => {
    const result = calculatePrice(1000);
    expect(result.basePrice).toBe(1000);
    expect(result.taxAmount).toBe(180);
    expect(result.totalPrice).toBe(1180);
  });

  it('should calculate price with custom tax rate', () => {
    const result = calculatePrice(1000, 0.12);
    expect(result.taxAmount).toBe(120);
    expect(result.totalPrice).toBe(1120);
  });

  it('should handle zero price', () => {
    const result = calculatePrice(0);
    expect(result.totalPrice).toBe(0);
    expect(result.taxAmount).toBe(0);
  });

  it('should round tax to 2 decimal places', () => {
    const result = calculatePrice(333, 0.18);
    expect(result.taxAmount).toBe(59.94);
    expect(result.totalPrice).toBe(392.94);
  });
});

describe('Inventory Management', () => {
  it('should allow fulfillment when sufficient inventory', () => {
    const product: Product = {
      id: '1',
      name: 'Test',
      sku: 'TEST-001',
      price: 100,
      inventory: 10,
      status: 'active',
      category: 'test',
      tags: []
    };

    expect(canFulfill(product, 5)).toBe(true);
  });

  it('should deny fulfillment when insufficient inventory', () => {
    const product: Product = {
      id: '1',
      name: 'Test',
      sku: 'TEST-001',
      price: 100,
      inventory: 3,
      status: 'active',
      category: 'test',
      tags: []
    };

    expect(canFulfill(product, 5)).toBe(false);
  });

  it('should deny fulfillment for inactive products', () => {
    const product: Product = {
      id: '1',
      name: 'Test',
      sku: 'TEST-001',
      price: 100,
      inventory: 10,
      status: 'inactive',
      category: 'test',
      tags: []
    };

    expect(canFulfill(product, 5)).toBe(false);
  });

  it('should deny fulfillment for out of stock products', () => {
    const product: Product = {
      id: '1',
      name: 'Test',
      sku: 'TEST-001',
      price: 100,
      inventory: 0,
      status: 'out_of_stock',
      category: 'test',
      tags: []
    };

    expect(canFulfill(product, 1)).toBe(false);
  });
});

describe('Category Hierarchy', () => {
  const categories: Category[] = [
    { id: 'root', name: 'Products', path: ['Products'] },
    { id: 'electronics', name: 'Electronics', parentId: 'root', path: ['Products', 'Electronics'] },
    { id: 'phones', name: 'Phones', parentId: 'electronics', path: ['Products', 'Electronics', 'Phones'] },
    { id: 'accessories', name: 'Accessories', parentId: 'root', path: ['Products', 'Accessories'] },
  ];

  it('should build path for root category', () => {
    const path = buildCategoryPath(categories, 'root');
    expect(path).toEqual(['Products']);
  });

  it('should build path for nested category', () => {
    const path = buildCategoryPath(categories, 'phones');
    expect(path).toEqual(['Products', 'Electronics', 'Phones']);
  });

  it('should build path for sibling category', () => {
    const path = buildCategoryPath(categories, 'accessories');
    expect(path).toEqual(['Products', 'Accessories']);
  });
});

describe('Product Search', () => {
  const products: Product[] = [
    { id: '1', name: 'iPhone 15', sku: 'IPH-001', price: 79900, inventory: 50, status: 'active', category: 'phones', tags: ['apple', 'smartphone'] },
    { id: '2', name: 'Samsung Galaxy S23', sku: 'SAM-001', price: 74999, inventory: 30, status: 'active', category: 'phones', tags: ['samsung', 'smartphone'] },
    { id: '3', name: 'iPhone Case', sku: 'IPH-ACC-001', price: 499, inventory: 100, status: 'active', category: 'accessories', tags: ['apple', 'case'] },
  ];

  function searchProducts(products: Product[], query: string): Product[] {
    const q = query.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  }

  it('should search by name', () => {
    const results = searchProducts(products, 'iPhone');
    expect(results).toHaveLength(2);
    expect(results.map(p => p.name)).toContain('iPhone 15');
    expect(results.map(p => p.name)).toContain('iPhone Case');
  });

  it('should search by SKU', () => {
    const results = searchProducts(products, 'SAM-001');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Samsung Galaxy S23');
  });

  it('should search by tag', () => {
    const results = searchProducts(products, 'apple');
    expect(results).toHaveLength(2);
  });

  it('should search by category', () => {
    const results = searchProducts(products, 'phones');
    expect(results).toHaveLength(2);
  });

  it('should return empty for no matches', () => {
    const results = searchProducts(products, 'nonexistent');
    expect(results).toHaveLength(0);
  });
});

describe('Product Filtering', () => {
  const products: Product[] = [
    { id: '1', name: 'Product A', sku: 'A', price: 100, inventory: 10, status: 'active', category: 'cat1', tags: [] },
    { id: '2', name: 'Product B', sku: 'B', price: 200, inventory: 0, status: 'out_of_stock', category: 'cat1', tags: [] },
    { id: '3', name: 'Product C', sku: 'C', price: 300, inventory: 5, status: 'active', category: 'cat2', tags: [] },
  ];

  function filterProducts(
    products: Product[],
    filters: { status?: string; minPrice?: number; maxPrice?: number; category?: string }
  ): Product[] {
    return products.filter(p => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
      if (filters.category && p.category !== filters.category) return false;
      return true;
    });
  }

  it('should filter by status', () => {
    const results = filterProducts(products, { status: 'active' });
    expect(results).toHaveLength(2);
    expect(results.every(p => p.status === 'active')).toBe(true);
  });

  it('should filter by price range', () => {
    const results = filterProducts(products, { minPrice: 150, maxPrice: 250 });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Product B');
  });

  it('should filter by category', () => {
    const results = filterProducts(products, { category: 'cat2' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Product C');
  });

  it('should combine multiple filters', () => {
    const results = filterProducts(products, { status: 'active', minPrice: 200 });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Product C');
  });
});
