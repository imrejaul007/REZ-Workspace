// Supplier Service - Supplier management and ordering
import {
  Supplier,
  Address,
  Medicine,
  InventoryBatch,
} from '../types/pharmacy.js';
import * as pharmacyModel from '../models/pharmacy.js';

interface SupplierInput {
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: Address;
  medicines?: string[];
  deliveryTime: string;
  paymentTerms: string;
  rating?: number;
}

interface PurchaseOrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  purchasePrice: number;
  total: number;
}

interface PurchaseOrder {
  orderId: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalValue: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: Date;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
}

// In-memory purchase orders storage
const purchaseOrders: Map<string, PurchaseOrder> = new Map();

export class SupplierService {
  /**
   * Add a new supplier
   */
  addSupplier(input: SupplierInput): Supplier {
    // Validation
    if (!input.name || input.name.trim().length < 2) {
      throw new Error('Supplier name must be at least 2 characters');
    }
    if (!input.contactPerson || input.contactPerson.trim().length < 2) {
      throw new Error('Contact person name is required');
    }
    if (!input.phone || input.phone.length < 10) {
      throw new Error('Valid phone number is required');
    }
    if (!input.address || !input.address.city || !input.address.state) {
      throw new Error('Complete address with city and state is required');
    }
    if (!input.deliveryTime) {
      throw new Error('Delivery time is required');
    }
    if (!input.paymentTerms) {
      throw new Error('Payment terms are required');
    }

    // Check for duplicate
    const existingSuppliers = Array.from(pharmacyModel.suppliers.values());
    const existing = existingSuppliers.find(
      (s) =>
        s.name.toLowerCase() === input.name.toLowerCase() ||
        s.phone === input.phone
    );
    if (existing) {
      throw new Error(`Supplier ${input.name} or phone ${input.phone} already exists`);
    }

    return pharmacyModel.createSupplier({
      name: input.name.trim(),
      contactPerson: input.contactPerson.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim(),
      address: input.address,
      medicines: input.medicines || [],
      deliveryTime: input.deliveryTime.trim(),
      paymentTerms: input.paymentTerms.trim(),
      rating: input.rating || 0,
      isActive: true,
    });
  }

  /**
   * Get supplier by ID
   */
  getSupplier(supplierId: string): Supplier | null {
    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }
    return pharmacyModel.getSupplier(supplierId) || null;
  }

  /**
   * Get all suppliers
   */
  getSuppliers(activeOnly?: boolean): Supplier[] {
    return pharmacyModel.getAllSuppliers(activeOnly);
  }

  /**
   * Update supplier details
   */
  updateSupplier(
    supplierId: string,
    updates: Partial<Omit<SupplierInput, 'address'>> & { address?: Address }
  ): Supplier | null {
    if (!supplierId) {
      throw new Error('Supplier ID is required');
    }

    const existing = pharmacyModel.getSupplier(supplierId);
    if (!existing) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    // Check for duplicate name/phone if being updated
    if (updates.name && updates.name.toLowerCase() !== existing.name.toLowerCase()) {
      const existingSuppliers = Array.from(pharmacyModel.suppliers.values());
      const duplicate = existingSuppliers.find(
        (s) =>
          s.name.toLowerCase() === updates.name!.toLowerCase() && s.supplierId !== supplierId
      );
      if (duplicate) {
        throw new Error(`Supplier name ${updates.name} already exists`);
      }
    }

    const result = pharmacyModel.updateSupplier(supplierId, {
      ...updates,
      name: updates.name?.trim(),
      contactPerson: updates.contactPerson?.trim(),
    });

    return result || null;
  }

  /**
   * Deactivate a supplier
   */
  deactivateSupplier(supplierId: string): Supplier | null {
    const result = pharmacyModel.updateSupplier(supplierId, { isActive: false });
    return result || null;
  }

  /**
   * Activate a supplier
   */
  activateSupplier(supplierId: string): Supplier | null {
    const result = pharmacyModel.updateSupplier(supplierId, { isActive: true });
    return result || null;
  }

  /**
   * Add medicines to supplier's catalog
   */
  addMedicinesToSupplier(supplierId: string, medicineIds: string[]): Supplier | null {
    const supplier = pharmacyModel.getSupplier(supplierId);
    if (!supplier) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    const errors: string[] = [];
    for (const medicineId of medicineIds) {
      const medicine = pharmacyModel.getMedicine(medicineId);
      if (!medicine) {
        errors.push(`Medicine ${medicineId} not found`);
        continue;
      }

      if (!supplier.medicines.includes(medicineId)) {
        pharmacyModel.addMedicineToSupplier(supplierId, medicineId);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Some medicines not found: ${errors.join(', ')}`);
    }

    const result = pharmacyModel.getSupplier(supplierId);
    return result || null;
  }

  /**
   * Remove medicines from supplier's catalog
   */
  removeMedicinesFromSupplier(supplierId: string, medicineIds: string[]): Supplier | null {
    const supplier = pharmacyModel.getSupplier(supplierId);
    if (!supplier) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    supplier.medicines = supplier.medicines.filter((m) => !medicineIds.includes(m));
    const result = pharmacyModel.updateSupplier(supplierId, { medicines: supplier.medicines });
    return result || null;
  }

  /**
   * Get supplier's medicines
   */
  getSupplierMedicines(supplierId: string): Medicine[] {
    const supplier = pharmacyModel.getSupplier(supplierId);
    if (!supplier) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    return supplier.medicines
      .map((id) => pharmacyModel.getMedicine(id))
      .filter((m): m is Medicine => m !== undefined);
  }

  /**
   * Create a purchase order
   */
  createPurchaseOrder(
    supplierId: string,
    items: Array<{
      medicineId: string;
      quantity: number;
      purchasePrice: number;
    }>,
    notes?: string
  ): PurchaseOrder {
    const supplier = pharmacyModel.getSupplier(supplierId);
    if (!supplier) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    if (!supplier.isActive) {
      throw new Error(`Supplier ${supplier.name} is not active`);
    }

    if (items.length === 0) {
      throw new Error('At least one item is required');
    }

    const orderItems: PurchaseOrderItem[] = [];
    let totalValue = 0;
    const errors: string[] = [];

    for (const item of items) {
      const medicine = pharmacyModel.getMedicine(item.medicineId);
      if (!medicine) {
        errors.push(`Medicine ${item.medicineId} not found`);
        continue;
      }

      if (!supplier.medicines.includes(item.medicineId)) {
        errors.push(`${medicine.name} is not supplied by ${supplier.name}`);
        continue;
      }

      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for ${medicine.name}`);
        continue;
      }

      if (item.purchasePrice <= 0) {
        errors.push(`Invalid price for ${medicine.name}`);
        continue;
      }

      orderItems.push({
        medicineId: item.medicineId,
        medicineName: medicine.name,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        total: item.quantity * item.purchasePrice,
      });

      totalValue += item.quantity * item.purchasePrice;
    }

    if (errors.length > 0 && orderItems.length === 0) {
      throw new Error(`Order cannot be created: ${errors.join('; ')}`);
    }

    const deliveryDays = parseInt(supplier.deliveryTime.split('-')[0]) || 3;
    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + deliveryDays);

    const orderId = pharmacyModel.generateId('PO');
    const order: PurchaseOrder = {
      orderId,
      supplierId,
      supplierName: supplier.name,
      items: orderItems,
      totalValue: Math.round(totalValue * 100) / 100,
      status: 'pending',
      orderDate: new Date(),
      expectedDelivery,
      notes,
    };

    purchaseOrders.set(orderId, order);
    return order;
  }

  /**
   * Get purchase order by ID
   */
  getPurchaseOrder(orderId: string): PurchaseOrder | null {
    return purchaseOrders.get(orderId) || null;
  }

  /**
   * Get orders for a supplier
   */
  getSupplierOrders(
    supplierId: string,
    status?: PurchaseOrder['status']
  ): PurchaseOrder[] {
    let orders = Array.from(purchaseOrders.values()).filter(
      (o) => o.supplierId === supplierId
    );

    if (status) {
      orders = orders.filter((o) => o.status === status);
    }

    return orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }

  /**
   * Update purchase order status
   */
  updateOrderStatus(
    orderId: string,
    status: PurchaseOrder['status'],
    deliveryDate?: Date
  ): PurchaseOrder | null {
    const order = purchaseOrders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Validate status transition
    const validTransitions: Record<PurchaseOrder['status'], PurchaseOrder['status'][]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new Error(
        `Cannot transition from ${order.status} to ${status}`
      );
    }

    order.status = status;

    if (status === 'delivered' && deliveryDate) {
      order.actualDelivery = deliveryDate;
    } else if (status === 'shipped') {
      order.actualDelivery = undefined;
    }

    purchaseOrders.set(orderId, order);

    // If delivered, process the stock receipt
    if (status === 'delivered') {
      this.processDelivery(orderId);
    }

    return order;
  }

  /**
   * Process delivery - add stock to inventory
   */
  private processDelivery(orderId: string): void {
    const order = purchaseOrders.get(orderId);
    if (!order || order.status !== 'delivered') {
      return;
    }

    // Find a batch number prefix based on supplier
    const supplier = pharmacyModel.getSupplier(order.supplierId);
    const batchPrefix = supplier?.name.substring(0, 3).toUpperCase() || 'SUP';

    for (const item of order.items) {
      // Calculate expiry (default 18 months from delivery)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 18);

      pharmacyModel.addStockToInventory(item.medicineId, {
        batchNumber: `${batchPrefix}-${Date.now().toString(36).toUpperCase()}`,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        mrp: pharmacyModel.getMedicine(item.medicineId)?.mrp || item.purchasePrice * 1.5,
        expiryDate,
        receivedDate: new Date(),
        supplierId: order.supplierId,
      });
    }
  }

  /**
   * Cancel a purchase order
   */
  cancelOrder(orderId: string, _reason?: string): PurchaseOrder | null {
    return this.updateOrderStatus(orderId, 'cancelled');
  }

  /**
   * Get supplier performance metrics
   */
  getSupplierPerformance(supplierId: string): {
    supplier: Supplier;
    totalOrders: number;
    totalValue: number;
    onTimeDeliveries: number;
    lateDeliveries: number;
    cancelledOrders: number;
    averageDeliveryDays: number;
    fulfillmentRate: number;
  } {
    const supplier = pharmacyModel.getSupplier(supplierId);
    if (!supplier) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    const orders = this.getSupplierOrders(supplierId);
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');

    let onTime = 0;
    let late = 0;
    let totalDeliveryDays = 0;

    for (const order of deliveredOrders) {
      if (order.actualDelivery && order.expectedDelivery) {
        const actualDays = Math.ceil(
          (order.actualDelivery.getTime() - order.orderDate.getTime()) /
            (24 * 60 * 60 * 1000)
        );
        totalDeliveryDays += actualDays;

        if (order.actualDelivery <= order.expectedDelivery) {
          onTime++;
        } else {
          late++;
        }
      }
    }

    const totalValue = orders.reduce((sum, o) => sum + o.totalValue, 0);
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;

    return {
      supplier,
      totalOrders: orders.length,
      totalValue: Math.round(totalValue * 100) / 100,
      onTimeDeliveries: onTime,
      lateDeliveries: late,
      cancelledOrders: cancelled,
      averageDeliveryDays:
        deliveredOrders.length > 0
          ? Math.round(totalDeliveryDays / deliveredOrders.length)
          : 0,
      fulfillmentRate:
        orders.length > 0
          ? Math.round(((orders.length - cancelled) / orders.length) * 10000) / 100
          : 0,
    };
  }

  /**
   * Get suppliers ranked by performance
   */
  getSupplierRankings(): Array<{
    supplierId: string;
    name: string;
    performance: number;
    totalValue: number;
    deliveryTime: string;
  }> {
    const suppliers = pharmacyModel.getAllSuppliers(false);
    const rankings: Array<{
      supplierId: string;
      name: string;
      performance: number;
      totalValue: number;
      deliveryTime: string;
    }> = [];

    for (const supplier of suppliers) {
      const orders = this.getSupplierOrders(supplier.supplierId);
      const delivered = orders.filter((o) => o.status === 'delivered');

      let onTimeCount = 0;
      for (const order of delivered) {
        if (order.actualDelivery && order.expectedDelivery) {
          if (order.actualDelivery <= order.expectedDelivery) {
            onTimeCount++;
          }
        }
      }

      const performance =
        delivered.length > 0 ? (onTimeCount / delivered.length) * 100 : 0;
      const totalValue = orders.reduce((sum, o) => sum + o.totalValue, 0);

      rankings.push({
        supplierId: supplier.supplierId,
        name: supplier.name,
        performance: Math.round(performance * 100) / 100,
        totalValue: Math.round(totalValue * 100) / 100,
        deliveryTime: supplier.deliveryTime,
      });
    }

    return rankings.sort((a, b) => b.performance - a.performance);
  }

  /**
   * Get all purchase orders
   */
  getAllOrders(status?: PurchaseOrder['status']): PurchaseOrder[] {
    let orders = Array.from(purchaseOrders.values());
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }
    return orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }

  /**
   * Search suppliers
   */
  searchSuppliers(query: string): Supplier[] {
    const lowerQuery = query.toLowerCase();
    return pharmacyModel
      .getAllSuppliers(false)
      .filter(
        (s) =>
          s.name.toLowerCase().includes(lowerQuery) ||
          s.contactPerson.toLowerCase().includes(lowerQuery) ||
          s.address.city.toLowerCase().includes(lowerQuery)
      );
  }
}

export const supplierService = new SupplierService();
