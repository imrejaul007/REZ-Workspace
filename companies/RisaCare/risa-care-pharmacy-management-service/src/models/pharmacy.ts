// In-memory data store for pharmacy management
import {
  Pharmacy,
  Medicine,
  Prescription,
  Dispense,
  Inventory,
  Supplier,
  Sale,
  Return,
  Pharmacist,
  InventoryBatch,
  SaleItem,
  PrescriptionItem,
  PharmacyType,
  MedicineForm,
  PrescriptionStatus,
  PaymentMethod,
  Address,
  OperatingHours,
  StockAlert,
  ExpiryAlert,
} from '../types/pharmacy.js';

// In-memory storage - exported for service access
export const pharmacies: Map<string, Pharmacy> = new Map();
export const medicines: Map<string, Medicine> = new Map();
export const prescriptions: Map<string, Prescription> = new Map();
export const dispenses: Map<string, Dispense> = new Map();
export const inventories: Map<string, Inventory> = new Map();
export const suppliers: Map<string, Supplier> = new Map();
export const sales: Map<string, Sale> = new Map();
export const returns: Map<string, Return> = new Map();

// Generate unique IDs
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`;
}

// ============ PHARMACY OPERATIONS ============

export function createPharmacy(data: Omit<Pharmacy, 'pharmacyId' | 'createdAt' | 'updatedAt'>): Pharmacy {
  const pharmacy: Pharmacy = {
    ...data,
    pharmacyId: generateId('PHA'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  pharmacies.set(pharmacy.pharmacyId, pharmacy);
  return pharmacy;
}

export function getPharmacy(pharmacyId: string): Pharmacy | undefined {
  return pharmacies.get(pharmacyId);
}

export function getAllPharmacies(): Pharmacy[] {
  return Array.from(pharmacies.values());
}

export function updatePharmacy(pharmacyId: string, updates: Partial<Pharmacy>): Pharmacy | undefined {
  const pharmacy = pharmacies.get(pharmacyId);
  if (!pharmacy) return undefined;

  const updated: Pharmacy = {
    ...pharmacy,
    ...updates,
    pharmacyId: pharmacy.pharmacyId, // Prevent ID change
    createdAt: pharmacy.createdAt, // Prevent creation date change
    updatedAt: new Date(),
  };
  pharmacies.set(pharmacyId, updated);
  return updated;
}

export function addPharmacist(pharmacyId: string, pharmacist: Pharmacist): Pharmacy | undefined {
  const pharmacy = pharmacies.get(pharmacyId);
  if (!pharmacy) return undefined;

  pharmacy.pharmacists.push(pharmacist);
  pharmacy.updatedAt = new Date();
  pharmacies.set(pharmacyId, pharmacy);
  return pharmacy;
}

export function removePharmacist(pharmacyId: string, pharmacistId: string): Pharmacy | undefined {
  const pharmacy = pharmacies.get(pharmacyId);
  if (!pharmacy) return undefined;

  pharmacy.pharmacists = pharmacy.pharmacists.filter(p => p.pharmacistId !== pharmacistId);
  pharmacy.updatedAt = new Date();
  pharmacies.set(pharmacyId, pharmacy);
  return pharmacy;
}

// ============ MEDICINE OPERATIONS ============

export function createMedicine(data: Omit<Medicine, 'medicineId' | 'createdAt' | 'updatedAt'>): Medicine {
  const medicine: Medicine = {
    ...data,
    medicineId: generateId('MED'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  medicines.set(medicine.medicineId, medicine);

  // Also create inventory entry
  createInventory({
    medicineId: medicine.medicineId,
    medicineName: medicine.name,
    currentStock: medicine.currentStock,
    reorderLevel: medicine.reorderLevel,
    reorderQuantity: medicine.reorderLevel * 2,
    batches: [],
    lastRestocked: new Date(),
    averageCost: medicine.price * 0.7, // Assume 70% of selling price as cost
    mrp: medicine.mrp,
    updatedAt: new Date(),
  });

  return medicine;
}

export function getMedicine(medicineId: string): Medicine | undefined {
  return medicines.get(medicineId);
}

export function getAllMedicines(filters?: {
  category?: string;
  requiresPrescription?: boolean;
  form?: MedicineForm;
  minStock?: number;
}): Medicine[] {
  let result = Array.from(medicines.values());

  if (filters?.category) {
    result = result.filter(m => m.category.toLowerCase().includes(filters.category!.toLowerCase()));
  }
  if (filters?.requiresPrescription !== undefined) {
    result = result.filter(m => m.requiresPrescription === filters.requiresPrescription);
  }
  if (filters?.form) {
    result = result.filter(m => m.form === filters.form);
  }
  if (filters?.minStock !== undefined) {
    result = result.filter(m => m.currentStock >= filters.minStock!);
  }

  return result;
}

export function searchMedicines(query: string): Medicine[] {
  const lowerQuery = query.toLowerCase();
  return Array.from(medicines.values()).filter(
    m =>
      m.name.toLowerCase().includes(lowerQuery) ||
      m.genericName.toLowerCase().includes(lowerQuery) ||
      m.manufacturer.toLowerCase().includes(lowerQuery) ||
      m.category.toLowerCase().includes(lowerQuery)
  );
}

export function updateMedicine(medicineId: string, updates: Partial<Medicine>): Medicine | undefined {
  const medicine = medicines.get(medicineId);
  if (!medicine) return undefined;

  const updated: Medicine = {
    ...medicine,
    ...updates,
    medicineId: medicine.medicineId,
    createdAt: medicine.createdAt,
    updatedAt: new Date(),
  };
  medicines.set(medicineId, updated);

  // Update inventory as well
  const inventory = inventories.get(medicineId);
  if (inventory) {
    inventory.medicineName = updated.name;
    inventory.reorderLevel = updated.reorderLevel;
    inventories.set(medicineId, inventory);
  }

  return updated;
}

export function updateMedicineStock(medicineId: string, quantityChange: number): Medicine | undefined {
  const medicine = medicines.get(medicineId);
  if (!medicine) return undefined;

  medicine.currentStock += quantityChange;
  if (medicine.currentStock < 0) medicine.currentStock = 0;
  medicine.updatedAt = new Date();
  medicines.set(medicineId, medicine);

  // Update inventory
  const inventory = inventories.get(medicineId);
  if (inventory) {
    inventory.currentStock = medicine.currentStock;
    inventory.updatedAt = new Date();
    inventories.set(medicineId, inventory);
  }

  return medicine;
}

// ============ INVENTORY OPERATIONS ============

export function createInventory(data: Omit<Inventory, never>): Inventory {
  const inventory: Inventory = { ...data };
  inventories.set(data.medicineId, inventory);
  return inventory;
}

export function getInventory(medicineId: string): Inventory | undefined {
  return inventories.get(medicineId);
}

export function getAllInventories(): Inventory[] {
  return Array.from(inventories.values());
}

export function addStockToInventory(
  medicineId: string,
  batch: Omit<InventoryBatch, 'batchId'>
): Inventory | undefined {
  let inventory = inventories.get(medicineId);

  if (!inventory) {
    const medicine = medicines.get(medicineId);
    if (!medicine) return undefined;

    inventory = {
      medicineId,
      medicineName: medicine.name,
      currentStock: 0,
      reorderLevel: medicine.reorderLevel,
      reorderQuantity: medicine.reorderLevel * 2,
      batches: [],
      lastRestocked: new Date(),
      averageCost: batch.purchasePrice,
      mrp: batch.mrp,
      updatedAt: new Date(),
    };
  }

  const batchId = generateId('BAT');
  inventory.batches.push({ ...batch, batchId });
  inventory.currentStock += batch.quantity;
  inventory.lastRestocked = new Date();
  inventory.updatedAt = new Date();

  // Recalculate average cost
  const totalValue = inventory.batches.reduce((sum, b) => sum + b.purchasePrice * b.quantity, 0);
  inventory.averageCost = totalValue / inventory.currentStock;

  inventories.set(medicineId, inventory);

  // Update medicine stock
  updateMedicineStock(medicineId, batch.quantity);

  return inventory;
}

export function getLowStockItems(): StockAlert[] {
  const alerts: StockAlert[] = [];

  for (const inventory of inventories.values()) {
    if (inventory.currentStock <= inventory.reorderLevel) {
      const medicine = medicines.get(inventory.medicineId);
      alerts.push({
        medicineId: inventory.medicineId,
        medicineName: inventory.medicineName,
        currentStock: inventory.currentStock,
        reorderLevel: inventory.reorderLevel,
        severity: inventory.currentStock <= inventory.reorderLevel / 2 ? 'critical' : 'low',
      });
    }
  }

  return alerts.sort((a, b) => a.currentStock - b.currentStock);
}

export function getExpiringStock(daysThreshold: number = 90): ExpiryAlert[] {
  const alerts: ExpiryAlert[] = [];
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  for (const inventory of inventories.values()) {
    for (const batch of inventory.batches) {
      if (batch.expiryDate <= thresholdDate) {
        const daysUntilExpiry = Math.ceil(
          (batch.expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        alerts.push({
          medicineId: inventory.medicineId,
          medicineName: inventory.medicineName,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          daysUntilExpiry,
          currentStock: batch.quantity,
          severity:
            daysUntilExpiry <= 0
              ? 'expired'
              : daysUntilExpiry <= 30
                ? 'critical'
                : 'warning',
        });
      }
    }
  }

  return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

// ============ PRESCRIPTION OPERATIONS ============

export function createPrescription(
  data: Omit<Prescription, 'prescriptionId' | 'createdAt' | 'updatedAt' | 'status'>
): Prescription {
  const prescription: Prescription = {
    ...data,
    prescriptionId: generateId('RX'),
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  prescriptions.set(prescription.prescriptionId, prescription);
  return prescription;
}

export function getPrescription(prescriptionId: string): Prescription | undefined {
  return prescriptions.get(prescriptionId);
}

export function getAllPrescriptions(filters?: {
  status?: PrescriptionStatus;
  patientId?: string;
  pharmacyId?: string;
}): Prescription[] {
  let result = Array.from(prescriptions.values());

  if (filters?.status) {
    result = result.filter(p => p.status === filters.status);
  }
  if (filters?.patientId) {
    result = result.filter(p => p.patientId === filters.patientId);
  }
  if (filters?.pharmacyId) {
    result = result.filter(p => p.pharmacyId === filters.pharmacyId);
  }

  return result.sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
}

export function validatePrescription(prescriptionId: string): Prescription | undefined {
  const prescription = prescriptions.get(prescriptionId);
  if (!prescription) return undefined;

  // Check if prescription is still valid
  if (new Date() > prescription.validUntil) {
    prescription.status = 'expired';
  } else if (prescription.status === 'pending') {
    prescription.status = 'validated';
  }
  prescription.updatedAt = new Date();
  prescriptions.set(prescriptionId, prescription);
  return prescription;
}

export function updatePrescriptionStatus(
  prescriptionId: string,
  status: PrescriptionStatus
): Prescription | undefined {
  const prescription = prescriptions.get(prescriptionId);
  if (!prescription) return undefined;

  prescription.status = status;
  prescription.updatedAt = new Date();
  prescriptions.set(prescriptionId, prescription);
  return prescription;
}

// ============ DISPENSE OPERATIONS ============

export function createDispense(data: Omit<Dispense, 'dispenseId'>): Dispense {
  const dispense: Dispense = {
    ...data,
    dispenseId: generateId('DSP'),
  };
  dispenses.set(dispense.dispenseId, dispense);

  // Update prescription status
  if (data.prescriptionId) {
    updatePrescriptionStatus(data.prescriptionId, 'dispensed');
  }

  return dispense;
}

export function getDispense(dispenseId: string): Dispense | undefined {
  return dispenses.get(dispenseId);
}

export function getDispensesByPrescription(prescriptionId: string): Dispense[] {
  return Array.from(dispenses.values()).filter(d => d.prescriptionId === prescriptionId);
}

export function getDispensesByPatient(patientId: string): Dispense[] {
  return Array.from(dispenses.values()).filter(d => d.patientId === patientId);
}

// ============ SUPPLIER OPERATIONS ============

export function createSupplier(data: Omit<Supplier, 'supplierId' | 'createdAt' | 'updatedAt'>): Supplier {
  const supplier: Supplier = {
    ...data,
    supplierId: generateId('SUP'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  suppliers.set(supplier.supplierId, supplier);
  return supplier;
}

export function getSupplier(supplierId: string): Supplier | undefined {
  return suppliers.get(supplierId);
}

export function getAllSuppliers(activeOnly?: boolean): Supplier[] {
  const result = Array.from(suppliers.values());
  if (activeOnly) {
    return result.filter(s => s.isActive);
  }
  return result;
}

export function updateSupplier(supplierId: string, updates: Partial<Supplier>): Supplier | undefined {
  const supplier = suppliers.get(supplierId);
  if (!supplier) return undefined;

  const updated: Supplier = {
    ...supplier,
    ...updates,
    supplierId: supplier.supplierId,
    createdAt: supplier.createdAt,
    updatedAt: new Date(),
  };
  suppliers.set(supplierId, updated);
  return updated;
}

export function addMedicineToSupplier(supplierId: string, medicineId: string): Supplier | undefined {
  const supplier = suppliers.get(supplierId);
  if (!supplier) return undefined;

  if (!supplier.medicines.includes(medicineId)) {
    supplier.medicines.push(medicineId);
    supplier.updatedAt = new Date();
    suppliers.set(supplierId, supplier);
  }
  return supplier;
}

// ============ SALE OPERATIONS ============

export function createSale(data: Omit<Sale, 'saleId' | 'soldAt' | 'invoiceNumber'>): Sale {
  const invoiceNumber = `INV${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

  const sale: Sale = {
    ...data,
    saleId: generateId('SAL'),
    soldAt: new Date(),
    invoiceNumber,
  };
  sales.set(sale.saleId, sale);

  // Deduct stock for each medicine
  for (const item of sale.medicines) {
    updateMedicineStock(item.medicineId, -item.quantity);
  }

  return sale;
}

export function getSale(saleId: string): Sale | undefined {
  return sales.get(saleId);
}

export function getAllSales(filters?: {
  patientId?: string;
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: PaymentMethod;
}): Sale[] {
  let result = Array.from(sales.values());

  if (filters?.patientId) {
    result = result.filter(s => s.patientId === filters.patientId);
  }
  if (filters?.startDate) {
    result = result.filter(s => s.soldAt >= filters.startDate!);
  }
  if (filters?.endDate) {
    result = result.filter(s => s.soldAt <= filters.endDate!);
  }
  if (filters?.paymentMethod) {
    result = result.filter(s => s.paymentMethod === filters.paymentMethod);
  }

  return result.sort((a, b) => b.soldAt.getTime() - a.soldAt.getTime());
}

export function getDailySales(date?: Date): Sale[] {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return getAllSales({ startDate: startOfDay, endDate: endOfDay });
}

export function getSalesByPeriod(startDate: Date, endDate: Date): Sale[] {
  return getAllSales({ startDate, endDate });
}

export function getSalesSummary(startDate?: Date, endDate?: Date): {
  totalSales: number;
  totalRevenue: number;
  totalDiscount: number;
  totalTax: number;
  averageOrderValue: number;
  salesByPaymentMethod: Record<string, number>;
} {
  const salesData = startDate && endDate ? getSalesByPeriod(startDate, endDate) : getAllSales();

  const totalSales = salesData.length;
  const totalRevenue = salesData.reduce((sum, s) => sum + s.total, 0);
  const totalDiscount = salesData.reduce((sum, s) => sum + s.discount, 0);
  const totalTax = salesData.reduce((sum, s) => sum + s.tax, 0);
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  const salesByPaymentMethod: Record<string, number> = {};
  for (const sale of salesData) {
    salesByPaymentMethod[sale.paymentMethod] =
      (salesByPaymentMethod[sale.paymentMethod] || 0) + sale.total;
  }

  return {
    totalSales,
    totalRevenue,
    totalDiscount,
    totalTax,
    averageOrderValue,
    salesByPaymentMethod,
  };
}

// ============ RETURN OPERATIONS ============

export function createReturn(data: Omit<Return, 'returnId' | 'returnedAt'>): Return {
  const returnRecord: Return = {
    ...data,
    returnId: generateId('RET'),
    returnedAt: new Date(),
  };
  returns.set(returnRecord.returnId, returnRecord);

  // Add stock back for returned items
  for (const item of returnRecord.items) {
    updateMedicineStock(item.medicineId, item.quantity);
  }

  // Update sale payment status if fully refunded
  const sale = sales.get(data.saleId);
  if (sale) {
    const allReturns = getReturnsBySale(data.saleId);
    const totalRefunded = allReturns.reduce((sum, r) => sum + r.totalRefund, 0);
    if (totalRefunded >= sale.total) {
      sale.paymentStatus = 'refunded';
      sales.set(sale.saleId, sale);
    }
  }

  return returnRecord;
}

export function getReturn(returnId: string): Return | undefined {
  return returns.get(returnId);
}

export function getReturnsBySale(saleId: string): Return[] {
  return Array.from(returns.values()).filter(r => r.saleId === saleId);
}

export function getAllReturns(filters?: {
  startDate?: Date;
  endDate?: Date;
}): Return[] {
  let result = Array.from(returns.values());

  if (filters?.startDate) {
    result = result.filter(r => r.returnedAt >= filters.startDate!);
  }
  if (filters?.endDate) {
    result = result.filter(r => r.returnedAt <= filters.endDate!);
  }

  return result.sort((a, b) => b.returnedAt.getTime() - a.returnedAt.getTime());
}

// ============ REORDER SUGGESTIONS ============

export function getReorderSuggestions(): Array<{
  medicineId: string;
  medicineName: string;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  suggestedSupplier?: Supplier;
}> {
  const suggestions: Array<{
    medicineId: string;
    medicineName: string;
    currentStock: number;
    reorderLevel: number;
    reorderQuantity: number;
    suggestedSupplier?: Supplier;
  }> = [];

  for (const inventory of inventories.values()) {
    if (inventory.currentStock <= inventory.reorderLevel) {
      // Find a supplier that provides this medicine
      let suggestedSupplier: Supplier | undefined;
      for (const supplier of suppliers.values()) {
        if (supplier.medicines.includes(inventory.medicineId) && supplier.isActive) {
          suggestedSupplier = supplier;
          break;
        }
      }

      suggestions.push({
        medicineId: inventory.medicineId,
        medicineName: inventory.medicineName,
        currentStock: inventory.currentStock,
        reorderLevel: inventory.reorderLevel,
        reorderQuantity: inventory.reorderQuantity,
        suggestedSupplier,
      });
    }
  }

  return suggestions.sort((a, b) => a.currentStock - b.currentStock);
}

// ============ STATISTICS ============

export function getPharmacyStats(): {
  totalMedicines: number;
  totalPrescriptions: number;
  totalSales: number;
  totalSuppliers: number;
  lowStockCount: number;
  expiringCount: number;
  todaySales: number;
  todayRevenue: number;
} {
  const lowStock = getLowStockItems();
  const expiring = getExpiringStock(30);
  const today = getDailySales();

  return {
    totalMedicines: medicines.size,
    totalPrescriptions: prescriptions.size,
    totalSales: sales.size,
    totalSuppliers: suppliers.size,
    lowStockCount: lowStock.length,
    expiringCount: expiring.length,
    todaySales: today.length,
    todayRevenue: today.reduce((sum, s) => sum + s.total, 0),
  };
}

// Export all data for backup/inspection
export function exportAllData(): {
  pharmacies: Pharmacy[];
  medicines: Medicine[];
  prescriptions: Prescription[];
  dispenses: Dispense[];
  inventories: Inventory[];
  suppliers: Supplier[];
  sales: Sale[];
  returns: Return[];
} {
  return {
    pharmacies: Array.from(pharmacies.values()),
    medicines: Array.from(medicines.values()),
    prescriptions: Array.from(prescriptions.values()),
    dispenses: Array.from(dispenses.values()),
    inventories: Array.from(inventories.values()),
    suppliers: Array.from(suppliers.values()),
    sales: Array.from(sales.values()),
    returns: Array.from(returns.values()),
  };
}
