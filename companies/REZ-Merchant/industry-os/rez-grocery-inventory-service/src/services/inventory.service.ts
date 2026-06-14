import { InventoryModel } from '../models/Inventory';
import { SupplierModel } from '../models/Supplier';
import { Inventory, Supplier } from '../types';

export class InventoryService {
  async createItem(data: Partial<Inventory>): Promise<Inventory> {
    const item = new InventoryModel(data);
    await item.save();
    return item.toJSON();
  }

  async getItems(filters: { category?: string; search?: string; page?: number; limit?: number }): Promise<{ items: Inventory[]; total: number }> {
    const { category, search, page = 1, limit = 20 } = filters;
    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const [items, total] = await Promise.all([
      InventoryModel.find(query).sort({ productName: 1 }).skip((page - 1) * limit).limit(limit),
      InventoryModel.countDocuments(query)
    ]);

    return { items: items.map(i => i.toJSON()), total };
  }

  async updateStock(id: string, quantity?: number, adjustment?: number): Promise<Inventory | null> {
    const item = await InventoryModel.findById(id);
    if (!item) return null;
    if (typeof quantity === 'number') item.quantity = quantity;
    else if (typeof adjustment === 'number') item.quantity = Math.max(0, item.quantity + adjustment);
    await item.save();
    return item.toJSON();
  }

  async getLowStockItems(): Promise<Inventory[]> {
    const items = await InventoryModel.findLowStock();
    return items.map(i => i.toJSON());
  }

  async getExpiringItems(days: number = 7): Promise<Inventory[]> {
    const items = await InventoryModel.findExpiring(days);
    return items.map(i => i.toJSON());
  }

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    const supplier = new SupplierModel(data);
    await supplier.save();
    return supplier.toJSON();
  }

  async getSuppliers(): Promise<Supplier[]> {
    const suppliers = await SupplierModel.find({ status: 'active' }).sort({ rating: -1 });
    return suppliers.map(s => s.toJSON());
  }
}

export const inventoryService = new InventoryService();
