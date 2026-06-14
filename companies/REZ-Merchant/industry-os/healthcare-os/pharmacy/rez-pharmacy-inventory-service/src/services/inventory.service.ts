import { BatchModel } from '../models/Batch';
import { SupplierModel } from '../models/Supplier';
import { Batch, Supplier } from '../types';

export class InventoryService {
  async createBatch(data: Partial<Batch>): Promise<Batch> {
    const batch = new BatchModel(data);
    await batch.save();
    return batch.toJSON();
  }

  async getBatches(): Promise<Batch[]> {
    const batches = await BatchModel.find({ status: 'active' }).sort({ expiryDate: 1 });
    return batches.map(b => b.toJSON());
  }

  async getExpiringBatches(days: number = 30): Promise<Batch[]> {
    const batches = await BatchModel.findExpiring(days);
    return batches.map(b => b.toJSON());
  }

  async updateBatchStock(id: string, quantity: number): Promise<Batch | null> {
    const batch = await BatchModel.findByIdAndUpdate(id, { $set: { quantity } }, { new: true });
    return batch?.toJSON() || null;
  }

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    const supplier = new SupplierModel(data);
    await supplier.save();
    return supplier.toJSON();
  }

  async getSuppliers(): Promise<Supplier[]> {
    const suppliers = await SupplierModel.find({ status: 'active' });
    return suppliers.map(s => s.toJSON());
  }
}

export const inventoryService = new InventoryService();
