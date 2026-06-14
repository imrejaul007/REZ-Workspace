import { PartModel } from '../models/Part';
import { SupplierModel } from '../models/Supplier';
import { Part, Supplier } from '../types';

export class InventoryService {
  async createPart(data: Partial<Part>): Promise<Part> {
    const part = new PartModel(data);
    await part.save();
    return part.toJSON();
  }

  async getPartById(id: string): Promise<Part | null> {
    const part = await PartModel.findById(id);
    return part?.toJSON() || null;
  }

  async getParts(filters: { category?: string; search?: string; page?: number; limit?: number }): Promise<{ parts: Part[]; total: number }> {
    const { category, search, page = 1, limit = 20 } = filters;
    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const [parts, total] = await Promise.all([
      PartModel.find(query).sort({ name: 1 }).skip((page - 1) * limit).limit(limit),
      PartModel.countDocuments(query)
    ]);

    return { parts: parts.map(p => p.toJSON()), total };
  }

  async updateStock(id: string, quantity?: number, adjustment?: number): Promise<Part | null> {
    const part = await PartModel.findById(id);
    if (!part) return null;
    if (typeof quantity === 'number') part.quantity = quantity;
    else if (typeof adjustment === 'number') part.quantity = Math.max(0, part.quantity + adjustment);
    await part.save();
    return part.toJSON();
  }

  async getLowStockParts(): Promise<Part[]> {
    const parts = await PartModel.findLowStock();
    return parts.map(p => p.toJSON());
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
