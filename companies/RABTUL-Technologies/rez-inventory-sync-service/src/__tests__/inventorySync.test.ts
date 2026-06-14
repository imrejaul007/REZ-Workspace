/**
 * Inventory Sync Service Tests
 */

import { describe, it, expect } from 'vitest';

interface InventoryItem {
  sku: string;
  quantity: number;
  reserved: number;
  available: number;
}

function calculateAvailable(item: InventoryItem): number {
  return Math.max(0, item.quantity - item.reserved);
}

function shouldRestock(item: InventoryItem, threshold: number): boolean {
  return calculateAvailable(item) < threshold;
}

describe('Inventory Calculation', () => {
  it('should calculate available quantity', () => {
    const item: InventoryItem = {
      sku: 'SKU001',
      quantity: 100,
      reserved: 30,
      available: 0,
    };
    expect(calculateAvailable(item)).toBe(70);
  });

  it('should not return negative', () => {
    const item: InventoryItem = {
      sku: 'SKU001',
      quantity: 10,
      reserved: 20,
      available: 0,
    };
    expect(calculateAvailable(item)).toBe(0);
  });
});

describe('Restock Detection', () => {
  it('should detect low stock', () => {
    const item: InventoryItem = {
      sku: 'SKU001',
      quantity: 15,
      reserved: 5,
      available: 0,
    };
    expect(shouldRestock(item, 20)).toBe(true);
  });

  it('should not trigger for sufficient stock', () => {
    const item: InventoryItem = {
      sku: 'SKU001',
      quantity: 100,
      reserved: 10,
      available: 0,
    };
    expect(shouldRestock(item, 20)).toBe(false);
  });
});
