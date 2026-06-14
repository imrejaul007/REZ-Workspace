import { describe, it, expect, beforeEach } from 'vitest';

// ============ Type Definitions ============
interface InventoryItem {
  id: string;
  merchantId: string;
  restaurantId: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  maxStockLevel: number;
  costPrice: number;
  sellingPrice: number;
  supplier?: string;
  expiryDate?: string;
  lastRestocked?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface StockAdjustment {
  itemId: string;
  quantity: number;
  type: 'add' | 'remove' | 'set';
  reason: string;
  performedBy: string;
}

// ============ Mock Data ============
const mockInventoryItem: InventoryItem = {
  id: 'INV-001',
  merchantId: 'MCHT-001',
  restaurantId: 'REST-001',
  name: 'Organic Tomatoes',
  sku: 'TOM-ORG-001',
  category: 'Vegetables',
  quantity: 50,
  unit: 'kg',
  minStockLevel: 20,
  maxStockLevel: 100,
  costPrice: 30,
  sellingPrice: 50,
  supplier: 'Fresh Farms Co.',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

const mockLowStockItem: InventoryItem = {
  ...mockInventoryItem,
  id: 'INV-002',
  name: 'Olive Oil',
  quantity: 15,
  minStockLevel: 20,
};

// ============ Inventory Service (simulated) ============
class InventoryService {
  private items: Map<string, InventoryItem> = new Map();

  constructor(initialItems: InventoryItem[] = []) {
    initialItems.forEach((item) => this.items.set(item.id, item));
  }

  async getItemById(id: string): Promise<InventoryItem | null> {
    const item = this.items.get(id);
    return item && item.isActive ? item : null;
  }

  async getItemsByRestaurant(restaurantId: string): Promise<InventoryItem[]> {
    return Array.from(this.items.values()).filter(
      (item) => item.restaurantId === restaurantId && item.isActive
    );
  }

  async getLowStockItems(restaurantId: string): Promise<InventoryItem[]> {
    return Array.from(this.items.values()).filter(
      (item) =>
        item.restaurantId === restaurantId &&
        item.isActive &&
        item.quantity <= item.minStockLevel
    );
  }

  async adjustStock(adjustment: StockAdjustment): Promise<InventoryItem | null> {
    const item = this.items.get(adjustment.itemId);
    if (!item || !item.isActive) return null;

    let newQuantity: number;
    switch (adjustment.type) {
      case 'add':
        newQuantity = item.quantity + adjustment.quantity;
        break;
      case 'remove':
        newQuantity = Math.max(0, item.quantity - adjustment.quantity);
        break;
      case 'set':
        newQuantity = adjustment.quantity;
        break;
    }

    const updatedItem: InventoryItem = {
      ...item,
      quantity: newQuantity,
      lastRestocked: adjustment.type === 'add' ? new Date() : item.lastRestocked,
      updatedAt: new Date(),
    };

    this.items.set(item.id, updatedItem);
    return updatedItem;
  }

  async getExpiringItems(restaurantId: string, daysAhead: number = 7): Promise<InventoryItem[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    return Array.from(this.items.values()).filter((item) => {
      if (item.restaurantId !== restaurantId || !item.isActive || !item.expiryDate) {
        return false;
      }
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= cutoffDate && expiryDate >= new Date();
    });
  }

  async getInventoryValue(restaurantId: string): Promise<number> {
    const items = await this.getItemsByRestaurant(restaurantId);
    return items.reduce((total, item) => total + item.costPrice * item.quantity, 0);
  }

  async getItemsByCategory(restaurantId: string, category: string): Promise<InventoryItem[]> {
    return Array.from(this.items.values()).filter(
      (item) =>
        item.restaurantId === restaurantId &&
        item.isActive &&
        item.category.toLowerCase() === category.toLowerCase()
    );
  }
}

// ============ Tests ============
describe('InventoryService', () => {
  let inventoryService: InventoryService;

  beforeEach(() => {
    inventoryService = new InventoryService([mockInventoryItem, mockLowStockItem]);
  });

  describe('getItemById', () => {
    it('should return item when found and active', async () => {
      const result = await inventoryService.getItemById('INV-001');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Organic Tomatoes');
      expect(result?.sku).toBe('TOM-ORG-001');
    });

    it('should return null for non-existent item', async () => {
      const result = await inventoryService.getItemById('NON-EXISTENT');

      expect(result).toBeNull();
    });

    it('should return null for inactive item', async () => {
      const inactiveItem: InventoryItem = {
        ...mockInventoryItem,
        id: 'INV-INACTIVE',
        isActive: false,
      };
      const service = new InventoryService([inactiveItem]);

      const result = await service.getItemById('INV-INACTIVE');

      expect(result).toBeNull();
    });
  });

  describe('getItemsByRestaurant', () => {
    it('should return all active items for a restaurant', async () => {
      const result = await inventoryService.getItemsByRestaurant('REST-001');

      expect(result).toHaveLength(2);
      expect(result.every((item) => item.restaurantId === 'REST-001')).toBe(true);
    });

    it('should return empty array for restaurant with no items', async () => {
      const result = await inventoryService.getItemsByRestaurant('REST-EMPTY');

      expect(result).toHaveLength(0);
    });

    it('should exclude inactive items', async () => {
      const mixedItems: InventoryItem[] = [
        { ...mockInventoryItem, isActive: true },
        { ...mockInventoryItem, id: 'INV-002', name: 'Inactive Item', isActive: false },
      ];
      const service = new InventoryService(mixedItems);

      const result = await service.getItemsByRestaurant('REST-001');

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });
  });

  describe('getLowStockItems', () => {
    it('should return items at or below min stock level', async () => {
      const result = await inventoryService.getLowStockItems('REST-001');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Olive Oil');
      expect(result[0].quantity).toBeLessThanOrEqual(result[0].minStockLevel);
    });

    it('should return empty array when all items well stocked', async () => {
      const wellStocked: InventoryItem[] = [
        { ...mockInventoryItem, quantity: 100, minStockLevel: 20 },
      ];
      const service = new InventoryService(wellStocked);

      const result = await service.getLowStockItems('REST-001');

      expect(result).toHaveLength(0);
    });

    it('should handle items at exactly min stock level', async () => {
      const atMinStock: InventoryItem[] = [
        { ...mockInventoryItem, quantity: 20, minStockLevel: 20 },
      ];
      const service = new InventoryService(atMinStock);

      const result = await service.getLowStockItems('REST-001');

      expect(result).toHaveLength(1);
    });
  });

  describe('adjustStock', () => {
    it('should add stock correctly', async () => {
      const result = await inventoryService.adjustStock({
        itemId: 'INV-001',
        quantity: 25,
        type: 'add',
        reason: 'New delivery',
        performedBy: 'admin-001',
      });

      expect(result?.quantity).toBe(75); // 50 + 25
      expect(result?.lastRestocked).toBeDefined();
    });

    it('should remove stock correctly', async () => {
      const result = await inventoryService.adjustStock({
        itemId: 'INV-001',
        quantity: 10,
        type: 'remove',
        reason: 'Used in cooking',
        performedBy: 'chef-001',
      });

      expect(result?.quantity).toBe(40); // 50 - 10
    });

    it('should not go below zero when removing stock', async () => {
      const result = await inventoryService.adjustStock({
        itemId: 'INV-001',
        quantity: 100,
        type: 'remove',
        reason: 'Inventory correction',
        performedBy: 'admin-001',
      });

      expect(result?.quantity).toBe(0);
    });

    it('should set stock to exact value', async () => {
      const result = await inventoryService.adjustStock({
        itemId: 'INV-001',
        quantity: 80,
        type: 'set',
        reason: 'Manual count adjustment',
        performedBy: 'manager-001',
      });

      expect(result?.quantity).toBe(80);
    });

    it('should return null for non-existent item', async () => {
      const result = await inventoryService.adjustStock({
        itemId: 'NON-EXISTENT',
        quantity: 10,
        type: 'add',
        reason: 'Test',
        performedBy: 'admin',
      });

      expect(result).toBeNull();
    });

    it('should update timestamp on stock adjustment', async () => {
      const beforeUpdate = new Date();
      const result = await inventoryService.adjustStock({
        itemId: 'INV-001',
        quantity: 5,
        type: 'add',
        reason: 'Test update',
        performedBy: 'admin-001',
      });

      expect(result?.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe('getExpiringItems', () => {
    it('should return items expiring within specified days', async () => {
      const soonExpiring: InventoryItem[] = [
        {
          ...mockInventoryItem,
          expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        },
        {
          ...mockInventoryItem,
          id: 'INV-EXP-LATER',
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        },
      ];
      const service = new InventoryService(soonExpiring);

      const result = await service.getExpiringItems('REST-001', 7);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('INV-001');
    });

    it('should exclude items without expiry dates', async () => {
      const mixedItems: InventoryItem[] = [
        { ...mockInventoryItem, expiryDate: undefined },
        {
          ...mockInventoryItem,
          id: 'INV-EXP-001',
          expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      const service = new InventoryService(mixedItems);

      const result = await service.getExpiringItems('REST-001', 7);

      expect(result).toHaveLength(1);
    });

    it('should exclude already expired items', async () => {
      const expiredItem: InventoryItem[] = [
        {
          ...mockInventoryItem,
          expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        },
      ];
      const service = new InventoryService(expiredItem);

      const result = await service.getExpiringItems('REST-001', 7);

      expect(result).toHaveLength(0);
    });
  });

  describe('getInventoryValue', () => {
    it('should calculate total inventory value correctly', async () => {
      const result = await inventoryService.getInventoryValue('REST-001');

      // INV-001: 30 * 50 = 1500, INV-002: 30 * 15 = 450
      expect(result).toBe(1950);
    });

    it('should return 0 for empty inventory', async () => {
      const result = await inventoryService.getInventoryValue('REST-EMPTY');

      expect(result).toBe(0);
    });

    it('should use cost price for valuation', async () => {
      const customItem: InventoryItem[] = [
        { ...mockInventoryItem, costPrice: 100, sellingPrice: 150, quantity: 5 },
      ];
      const service = new InventoryService(customItem);

      const result = await service.getInventoryValue('REST-001');

      expect(result).toBe(500); // 100 * 5, not 150 * 5
    });
  });

  describe('getItemsByCategory', () => {
    it('should return items matching category (case insensitive)', async () => {
      const result = await inventoryService.getItemsByCategory('REST-001', 'vegetables');

      expect(result).toHaveLength(1);
      expect(result[0].category.toLowerCase()).toBe('vegetables');
    });

    it('should return empty array for non-existent category', async () => {
      const result = await inventoryService.getItemsByCategory('REST-001', 'beverages');

      expect(result).toHaveLength(0);
    });

    it('should match exact category with different casing', async () => {
      const result = await inventoryService.getItemsByCategory('REST-001', 'VEGETABLES');

      expect(result).toHaveLength(1);
    });
  });
});

describe('InventoryItem Validation', () => {
  it('should validate required fields', () => {
    const validItem: InventoryItem = {
      id: 'TEST-001',
      merchantId: 'MCHT-001',
      restaurantId: 'REST-001',
      name: 'Test Item',
      sku: 'TEST-SKU-001',
      category: 'Test',
      quantity: 10,
      unit: 'pcs',
      minStockLevel: 5,
      maxStockLevel: 50,
      costPrice: 10,
      sellingPrice: 20,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(validItem.name).toBeTruthy();
    expect(validItem.sku).toBeTruthy();
    expect(validItem.quantity).toBeGreaterThanOrEqual(0);
    expect(validItem.minStockLevel).toBeLessThanOrEqual(validItem.maxStockLevel);
    expect(validItem.costPrice).toBeLessThanOrEqual(validItem.sellingPrice);
  });

  it('should handle optional fields', () => {
    const itemWithOptional: InventoryItem = {
      ...mockInventoryItem,
      supplier: 'Optional Supplier',
      expiryDate: '2024-12-31',
    };

    expect(itemWithOptional.supplier).toBeDefined();
    expect(itemWithOptional.expiryDate).toBeDefined();
  });

  it('should validate stock level constraints', () => {
    const item = { ...mockInventoryItem };

    expect(item.minStockLevel).toBeGreaterThan(0);
    expect(item.maxStockLevel).toBeGreaterThan(item.minStockLevel);
    expect(item.quantity).toBeGreaterThanOrEqual(0);
    expect(item.quantity).toBeLessThanOrEqual(item.maxStockLevel);
  });
});

describe('Stock Adjustment Logic', () => {
  it('should calculate stock correctly for multiple operations', async () => {
    const service = new InventoryService([mockInventoryItem]);

    await service.adjustStock({
      itemId: 'INV-001',
      quantity: 10,
      type: 'add',
      reason: 'Delivery 1',
      performedBy: 'admin',
    });

    await service.adjustStock({
      itemId: 'INV-001',
      quantity: 5,
      type: 'remove',
      reason: 'Used in recipe',
      performedBy: 'chef',
    });

    const finalItem = await service.getItemById('INV-001');
    expect(finalItem?.quantity).toBe(55); // 50 + 10 - 5
  });

  it('should not affect lastRestocked for remove operations', async () => {
    const service = new InventoryService([{ ...mockInventoryItem, lastRestocked: new Date('2024-01-01') }]);

    const before = await service.getItemById('INV-001');
    await service.adjustStock({
      itemId: 'INV-001',
      quantity: 10,
      type: 'remove',
      reason: 'Test',
      performedBy: 'admin',
    });

    const after = await service.getItemById('INV-001');
    expect(after?.lastRestocked?.getTime()).toBe(before?.lastRestocked?.getTime());
  });
});
