// Inventory Service - Stock management, alerts, and reorder
import {
  Inventory,
  InventoryBatch,
  StockAlert,
  ExpiryAlert,
  Supplier,
  Medicine,
} from '../types/pharmacy.js';
import * as pharmacyModel from '../models/pharmacy.js';

interface AddStockInput {
  medicineId: string;
  quantity: number;
  batchNumber: string;
  purchasePrice: number;
  mrp: number;
  expiryDate: Date;
  supplierId: string;
}

interface ReorderInput {
  medicineId: string;
  quantity: number;
  supplierId: string;
}

export class InventoryService {
  /**
   * Add stock to inventory
   */
  addStock(input: AddStockInput): Inventory | null {
    // Validate
    if (!input.medicineId) {
      throw new Error('Medicine ID is required');
    }
    if (!input.quantity || input.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    if (!input.batchNumber || input.batchNumber.trim().length < 1) {
      throw new Error('Batch number is required');
    }
    if (!input.supplierId) {
      throw new Error('Supplier ID is required');
    }
    if (input.purchasePrice <= 0) {
      throw new Error('Purchase price must be greater than 0');
    }
    if (input.mrp <= 0) {
      throw new Error('MRP must be greater than 0');
    }
    if (new Date(input.expiryDate) <= new Date()) {
      throw new Error('Expiry date must be in the future');
    }

    const medicine = pharmacyModel.getMedicine(input.medicineId);
    if (!medicine) {
      throw new Error(`Medicine ${input.medicineId} not found`);
    }

    if (input.mrp < input.purchasePrice) {
      throw new Error('MRP cannot be less than purchase price');
    }

    const inventory = pharmacyModel.addStockToInventory(input.medicineId, {
      batchNumber: input.batchNumber.trim(),
      quantity: input.quantity,
      purchasePrice: input.purchasePrice,
      mrp: input.mrp,
      expiryDate: new Date(input.expiryDate),
      receivedDate: new Date(),
      supplierId: input.supplierId,
    });

    return inventory || null;
  }

  /**
   * Update stock level (for corrections)
   */
  updateStock(medicineId: string, newStock: number): Inventory | null {
    if (!medicineId) {
      throw new Error('Medicine ID is required');
    }
    if (newStock < 0) {
      throw new Error('Stock cannot be negative');
    }

    const medicine = pharmacyModel.getMedicine(medicineId);
    if (!medicine) {
      throw new Error(`Medicine ${medicineId} not found`);
    }

    const diff = newStock - medicine.currentStock;
    const result = pharmacyModel.updateMedicineStock(medicineId, diff);
    return result ? pharmacyModel.getInventory(medicineId) || null : null;
  }

  /**
   * Get inventory for a medicine
   */
  getInventory(medicineId: string): Inventory | null {
    if (!medicineId) {
      throw new Error('Medicine ID is required');
    }
    return pharmacyModel.getInventory(medicineId) || null;
  }

  /**
   * Get all inventories
   */
  getAllInventories(): Inventory[] {
    return pharmacyModel.getAllInventories();
  }

  /**
   * Get medicines with low stock (below reorder level)
   */
  getLowStock(threshold?: number): StockAlert[] {
    let alerts = pharmacyModel.getLowStockItems();

    if (threshold !== undefined) {
      alerts = alerts.filter((a) => a.currentStock <= threshold);
    }

    return alerts;
  }

  /**
   * Get medicines expiring within specified days
   */
  getExpiringStock(daysThreshold: number = 90): ExpiryAlert[] {
    if (daysThreshold < 0) {
      throw new Error('Days threshold must be non-negative');
    }
    return pharmacyModel.getExpiringStock(daysThreshold);
  }

  /**
   * Get expired medicines
   */
  getExpiredStock(): ExpiryAlert[] {
    return pharmacyModel.getExpiringStock(0).filter((a) => a.severity === 'expired');
  }

  /**
   * Get reorder suggestions
   */
  reorderMedicines(): Array<{
    medicineId: string;
    medicineName: string;
    currentStock: number;
    reorderLevel: number;
    reorderQuantity: number;
    suggestedSupplier?: {
      supplierId: string;
      name: string;
      deliveryTime: string;
    };
    estimatedCost?: number;
  }> {
    const suggestions = pharmacyModel.getReorderSuggestions();

    return suggestions.map((s) => ({
      medicineId: s.medicineId,
      medicineName: s.medicineName,
      currentStock: s.currentStock,
      reorderLevel: s.reorderLevel,
      reorderQuantity: s.reorderQuantity,
      suggestedSupplier: s.suggestedSupplier
        ? {
            supplierId: s.suggestedSupplier.supplierId,
            name: s.suggestedSupplier.name,
            deliveryTime: s.suggestedSupplier.deliveryTime,
          }
        : undefined,
    }));
  }

  /**
   * Process reorder (create purchase order concept)
   */
  processReorder(input: ReorderInput): {
    success: boolean;
    orderId?: string;
    medicine?: Medicine;
    supplier?: Supplier;
    estimatedDelivery?: Date;
    message: string;
  } {
    const medicine = pharmacyModel.getMedicine(input.medicineId);
    if (!medicine) {
      throw new Error(`Medicine ${input.medicineId} not found`);
    }

    const supplier = pharmacyModel.getSupplier(input.supplierId);
    if (!supplier) {
      throw new Error(`Supplier ${input.supplierId} not found`);
    }

    if (!supplier.isActive) {
      throw new Error(`Supplier ${supplier.name} is not active`);
    }

    // Check if supplier supplies this medicine
    if (!supplier.medicines.includes(input.medicineId)) {
      throw new Error(`${supplier.name} does not supply ${medicine.name}`);
    }

    // Calculate estimated delivery
    const deliveryDays = parseInt(supplier.deliveryTime.split('-')[0]) || 3;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

    // Calculate estimated cost
    const estimatedCost = medicine.price * 0.7 * input.quantity; // Cost price * quantity

    const orderId = pharmacyModel.generateId('PO');

    return {
      success: true,
      orderId,
      medicine,
      supplier,
      estimatedDelivery,
      message: `Purchase order ${orderId} created for ${input.quantity} units of ${medicine.name} from ${supplier.name}. Expected delivery: ${estimatedDelivery.toLocaleDateString()}`,
    };
  }

  /**
   * Get batch details
   */
  getBatchDetails(medicineId: string, batchNumber: string): InventoryBatch | null {
    const inventory = pharmacyModel.getInventory(medicineId);
    if (!inventory) {
      return null;
    }

    return (
      inventory.batches.find((b) => b.batchNumber === batchNumber) || null
    );
  }

  /**
   * Remove expired batches from inventory
   */
  removeExpiredBatches(medicineId: string): {
    removed: InventoryBatch[];
    stockDeducted: number;
  } {
    const inventory = pharmacyModel.getInventory(medicineId);
    if (!inventory) {
      throw new Error(`Inventory for medicine ${medicineId} not found`);
    }

    const now = new Date();
    const expiredBatches: InventoryBatch[] = [];
    let stockDeducted = 0;

    for (const batch of inventory.batches) {
      if (batch.expiryDate <= now) {
        expiredBatches.push(batch);
        stockDeducted += batch.quantity;
      }
    }

    if (expiredBatches.length > 0) {
      inventory.batches = inventory.batches.filter(
        (b) => b.expiryDate > now
      );
      inventory.currentStock -= stockDeducted;
      inventory.updatedAt = new Date();
      pharmacyModel.inventories.set(medicineId, inventory);

      // Update medicine stock
      pharmacyModel.updateMedicineStock(medicineId, -stockDeducted);
    }

    return {
      removed: expiredBatches,
      stockDeducted,
    };
  }

  /**
   * Get inventory valuation
   */
  getInventoryValuation(): {
    totalStock: number;
    totalCostValue: number;
    totalMrpValue: number;
    potentialMargin: number;
    byCategory: Array<{
      category: string;
      stock: number;
      costValue: number;
      mrpValue: number;
    }>;
    expiringSoon: {
      count: number;
      value: number;
    };
  } {
    const inventories = pharmacyModel.getAllInventories();
    let totalStock = 0;
    let totalCostValue = 0;
    let totalMrpValue = 0;
    const byCategory: Record<string, { stock: number; costValue: number; mrpValue: number }> = {};

    for (const inv of inventories) {
      const medicine = pharmacyModel.getMedicine(inv.medicineId);
      if (!medicine) continue;

      totalStock += inv.currentStock;
      totalCostValue += inv.currentStock * inv.averageCost;
      totalMrpValue += inv.currentStock * (inv.mrp || medicine.mrp);

      if (!byCategory[medicine.category]) {
        byCategory[medicine.category] = { stock: 0, costValue: 0, mrpValue: 0 };
      }
      byCategory[medicine.category].stock += inv.currentStock;
      byCategory[medicine.category].costValue += inv.currentStock * inv.averageCost;
      byCategory[medicine.category].mrpValue += inv.currentStock * (inv.mrp || medicine.mrp);
    }

    // Expiring soon (within 90 days)
    const expiringSoon = pharmacyModel.getExpiringStock(90);
    let expiringValue = 0;
    for (const exp of expiringSoon) {
      const inv = pharmacyModel.getInventory(exp.medicineId);
      if (inv) {
        expiringValue += exp.currentStock * inv.averageCost;
      }
    }

    return {
      totalStock,
      totalCostValue: Math.round(totalCostValue * 100) / 100,
      totalMrpValue: Math.round(totalMrpValue * 100) / 100,
      potentialMargin: totalMrpValue > 0
        ? Math.round((1 - totalCostValue / totalMrpValue) * 10000) / 100
        : 0,
      byCategory: Object.entries(byCategory).map(([category, data]) => ({
        category,
        ...data,
      })),
      expiringSoon: {
        count: expiringSoon.length,
        value: Math.round(expiringValue * 100) / 100,
      },
    };
  }

  /**
   * Get inventory turnover analysis
   */
  getInventoryTurnover(): Array<{
    medicineId: string;
    medicineName: string;
    category: string;
    averageStock: number;
    totalSold: number;
    turnoverRate: number;
    daysToSell: number;
    status: 'fast' | 'normal' | 'slow' | 'dead';
  }> {
    const medicines = pharmacyModel.getAllMedicines();
    const sales = pharmacyModel.getAllSales();

    // Calculate total sold per medicine (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const soldByMedicine: Record<string, number> = {};
    for (const sale of sales) {
      if (sale.soldAt >= thirtyDaysAgo) {
        for (const item of sale.medicines) {
          soldByMedicine[item.medicineId] = (soldByMedicine[item.medicineId] || 0) + item.quantity;
        }
      }
    }

    const results: Array<{
      medicineId: string;
      medicineName: string;
      category: string;
      averageStock: number;
      totalSold: number;
      turnoverRate: number;
      daysToSell: number;
      status: 'fast' | 'normal' | 'slow' | 'dead';
    }> = [];

    for (const medicine of medicines) {
      const totalSold = soldByMedicine[medicine.medicineId] || 0;
      const averageStock = medicine.currentStock; // Simplified - should be average over time
      const turnoverRate = averageStock > 0 ? totalSold / averageStock : 0;
      const daysToSell = totalSold > 0 ? Math.round(30 / (totalSold / 30)) : 999;

      let status: 'fast' | 'normal' | 'slow' | 'dead';
      if (totalSold === 0 && medicine.currentStock > 0) {
        status = 'dead';
      } else if (turnoverRate > 2) {
        status = 'fast';
      } else if (turnoverRate > 0.5) {
        status = 'normal';
      } else {
        status = 'slow';
      }

      results.push({
        medicineId: medicine.medicineId,
        medicineName: medicine.name,
        category: medicine.category,
        averageStock,
        totalSold,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
        daysToSell: daysToSell > 365 ? 365 : daysToSell,
        status,
      });
    }

    return results.sort((a, b) => b.turnoverRate - a.turnoverRate);
  }

  /**
   * Batch process: mark expired items and generate alerts
   */
  processExpiryAlerts(): {
    expired: ExpiryAlert[];
    expiring30Days: ExpiryAlert[];
    expiring90Days: ExpiryAlert[];
    totalStockAtRisk: number;
  } {
    const allExpiring = pharmacyModel.getExpiringStock(90);

    return {
      expired: allExpiring.filter((e) => e.severity === 'expired'),
      expiring30Days: allExpiring.filter((e) => e.severity === 'critical'),
      expiring90Days: allExpiring.filter((e) => e.severity === 'warning'),
      totalStockAtRisk: allExpiring.reduce((sum, e) => sum + e.currentStock, 0),
    };
  }
}

export const inventoryService = new InventoryService();
