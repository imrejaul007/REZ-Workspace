// Medicine Service - Medicine catalog and stock management
import {
  Medicine,
  MedicineForm,
  SaleItem,
  Inventory,
  InventoryBatch,
} from '../types/pharmacy.js';
import * as pharmacyModel from '../models/pharmacy.js';

interface MedicineInput {
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  dosage: string;
  form: MedicineForm;
  packSize: string;
  price: number;
  mrp: number;
  requiresPrescription: boolean;
  currentStock: number;
  reorderLevel: number;
  hsnCode?: string;
  scheduleCategory?: 'Schedule H' | 'Schedule H1' | 'Schedule X' | 'OTC';
  sideEffects?: string[];
  contraindications?: string[];
  storageInstructions?: string;
}

interface StockUpdateInput {
  medicineId: string;
  quantity: number;
  batchNumber: string;
  purchasePrice: number;
  mrp: number;
  expiryDate: Date;
  supplierId: string;
}

interface StockAdjustmentInput {
  medicineId: string;
  quantity: number;
  reason: 'sale' | 'return' | 'damage' | 'expired' | 'correction' | 'initial';
  batchNumber?: string;
}

export class MedicineService {
  /**
   * Add a new medicine to the catalog
   */
  addMedicine(input: MedicineInput): Medicine {
    // Validation
    if (!input.name || input.name.trim().length < 2) {
      throw new Error('Medicine name must be at least 2 characters');
    }
    if (!input.genericName || input.genericName.trim().length < 2) {
      throw new Error('Generic name is required');
    }
    if (!input.manufacturer || input.manufacturer.trim().length < 2) {
      throw new Error('Manufacturer is required');
    }
    if (input.price <= 0) {
      throw new Error('Price must be greater than 0');
    }
    if (input.mrp <= 0) {
      throw new Error('MRP must be greater than 0');
    }
    if (input.mrp < input.price) {
      throw new Error('MRP cannot be less than purchase price');
    }
    if (input.reorderLevel < 0) {
      throw new Error('Reorder level cannot be negative');
    }

    // Check for duplicate medicine by name and manufacturer
    const existingMedicines = Array.from(pharmacyModel.medicines.values());
    const existing = existingMedicines.find(
      (m) =>
        m.name.toLowerCase() === input.name.toLowerCase() &&
        m.manufacturer.toLowerCase() === input.manufacturer.toLowerCase()
    );
    if (existing) {
      throw new Error(
        `Medicine ${input.name} from ${input.manufacturer} already exists (ID: ${existing.medicineId})`
      );
    }

    const medicine = pharmacyModel.createMedicine({
      name: input.name.trim(),
      genericName: input.genericName.trim(),
      manufacturer: input.manufacturer.trim(),
      category: input.category.trim(),
      dosage: input.dosage.trim(),
      form: input.form,
      packSize: input.packSize.trim(),
      price: input.price,
      mrp: input.mrp,
      requiresPrescription: input.requiresPrescription,
      currentStock: input.currentStock || 0,
      reorderLevel: input.reorderLevel,
      hsnCode: input.hsnCode?.trim().toUpperCase(),
      scheduleCategory: input.scheduleCategory,
      sideEffects: input.sideEffects,
      contraindications: input.contraindications,
      storageInstructions: input.storageInstructions,
    });

    // If initial stock provided, create batch entry
    if (input.currentStock > 0) {
      pharmacyModel.addStockToInventory(medicine.medicineId, {
        batchNumber: `INIT-${Date.now()}`,
        quantity: input.currentStock,
        purchasePrice: input.price * 0.7,
        mrp: input.mrp,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
        receivedDate: new Date(),
        supplierId: 'INITIAL',
      });
    }

    return medicine;
  }

  /**
   * Get medicine by ID
   */
  getMedicine(medicineId: string): Medicine | null {
    if (!medicineId) {
      throw new Error('Medicine ID is required');
    }
    return pharmacyModel.getMedicine(medicineId) || null;
  }

  /**
   * Get all medicines with optional filters
   */
  getMedicines(filters?: {
    category?: string;
    requiresPrescription?: boolean;
    form?: MedicineForm;
    inStockOnly?: boolean;
  }): Medicine[] {
    let medicines = pharmacyModel.getAllMedicines({
      category: filters?.category,
      requiresPrescription: filters?.requiresPrescription,
      form: filters?.form,
    });

    if (filters?.inStockOnly) {
      medicines = medicines.filter((m) => m.currentStock > 0);
    }

    return medicines;
  }

  /**
   * Search medicines by name, generic name, or manufacturer
   */
  searchMedicines(query: string): Medicine[] {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }
    return pharmacyModel.searchMedicines(query.trim());
  }

  /**
   * Get medicine details with inventory info
   */
  getMedicineDetails(medicineId: string): {
    medicine: Medicine;
    inventory: Inventory | null;
    lowStock: boolean;
    expiringBatches: InventoryBatch[];
  } | null {
    const medicine = pharmacyModel.getMedicine(medicineId);
    if (!medicine) {
      return null;
    }

    const inventory = pharmacyModel.getInventory(medicineId) || null;
    const lowStock = inventory
      ? inventory.currentStock <= inventory.reorderLevel
      : medicine.currentStock <= medicine.reorderLevel;

    const expiringBatches =
      inventory?.batches.filter(
        (b) => b.expiryDate <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      ) || [];

    return {
      medicine,
      inventory,
      lowStock,
      expiringBatches,
    };
  }

  /**
   * Update medicine details
   */
  updateMedicine(
    medicineId: string,
    updates: Partial<Omit<MedicineInput, 'currentStock'>>
  ): Medicine | null {
    if (!medicineId) {
      throw new Error('Medicine ID is required');
    }

    const existing = pharmacyModel.getMedicine(medicineId);
    if (!existing) {
      throw new Error(`Medicine ${medicineId} not found`);
    }

    // Validate MRP if being updated
    const newPrice = updates.price ?? existing.price;
    const newMrp = updates.mrp ?? existing.mrp;
    if (newMrp < newPrice) {
      throw new Error('MRP cannot be less than purchase price');
    }

    const result = pharmacyModel.updateMedicine(medicineId, updates);
    return result || null;
  }

  /**
   * Update medicine stock
   */
  updateStock(input: StockUpdateInput): Medicine | null {
    if (!input.medicineId) {
      throw new Error('Medicine ID is required');
    }
    if (input.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
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

    return inventory
      ? pharmacyModel.getMedicine(input.medicineId) || null
      : null;
  }

  /**
   * Adjust stock (for corrections, damage, expired items)
   */
  adjustStock(input: StockAdjustmentInput): Medicine | null {
    if (!input.medicineId) {
      throw new Error('Medicine ID is required');
    }

    const medicine = pharmacyModel.getMedicine(input.medicineId);
    if (!medicine) {
      throw new Error(`Medicine ${input.medicineId} not found`);
    }

    if (input.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    let quantityChange: number;
    switch (input.reason) {
      case 'sale':
      case 'damage':
      case 'expired':
      case 'correction':
        quantityChange = -input.quantity;
        break;
      case 'return':
      case 'initial':
        quantityChange = input.quantity;
        break;
      default:
        throw new Error('Invalid reason for stock adjustment');
    }

    const newStock = medicine.currentStock + quantityChange;
    if (newStock < 0) {
      throw new Error(
        `Insufficient stock. Current: ${medicine.currentStock}, Requested: ${input.quantity}`
      );
    }

    const result = pharmacyModel.updateMedicineStock(input.medicineId, quantityChange);
    return result || null;
  }

  /**
   * Get medicines by category
   */
  getMedicinesByCategory(category: string): Medicine[] {
    return pharmacyModel.getAllMedicines({ category });
  }

  /**
   * Get medicines requiring prescription
   */
  getPrescriptionRequiredMedicines(): Medicine[] {
    return pharmacyModel.getAllMedicines({ requiresPrescription: true });
  }

  /**
   * Get medicines by form (tablet, capsule, syrup, etc.)
   */
  getMedicinesByForm(form: MedicineForm): Medicine[] {
    return pharmacyModel.getAllMedicines({ form });
  }

  /**
   * Get stock levels summary
   */
  getStockSummary(): {
    totalMedicines: number;
    totalStock: number;
    totalValue: number;
    outOfStock: number;
    lowStock: number;
    categories: Record<string, { count: number; stock: number; value: number }>;
  } {
    const allMedicines = pharmacyModel.getAllMedicines();

    let totalStock = 0;
    let totalValue = 0;
    let outOfStock = 0;
    let lowStock = 0;
    const categories: Record<string, { count: number; stock: number; value: number }> = {};

    for (const medicine of allMedicines) {
      totalStock += medicine.currentStock;
      totalValue += medicine.currentStock * medicine.price;

      if (medicine.currentStock === 0) {
        outOfStock++;
      } else if (medicine.currentStock <= medicine.reorderLevel) {
        lowStock++;
      }

      if (!categories[medicine.category]) {
        categories[medicine.category] = { count: 0, stock: 0, value: 0 };
      }
      categories[medicine.category].count++;
      categories[medicine.category].stock += medicine.currentStock;
      categories[medicine.category].value += medicine.currentStock * medicine.price;
    }

    return {
      totalMedicines: allMedicines.length,
      totalStock,
      totalValue,
      outOfStock,
      lowStock,
      categories,
    };
  }

  /**
   * Get medicine batch details
   */
  getMedicineBatches(medicineId: string): InventoryBatch[] {
    const inventory = pharmacyModel.getInventory(medicineId);
    if (!inventory) {
      return [];
    }
    return inventory.batches.sort(
      (a, b) => b.receivedDate.getTime() - a.receivedDate.getTime()
    );
  }
}

export const medicineService = new MedicineService();
