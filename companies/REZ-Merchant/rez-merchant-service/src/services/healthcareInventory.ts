/**
 * Healthcare Inventory Service
 *
 * Extends SmartInventoryService with healthcare-specific inventory management:
 * - Medicine tracking with batch numbers and expiry dates
 * - Medical equipment availability
 * - Expiry alerts for pharmaceuticals
 * - Auto-reorder for critical medicines
 * - Controlled substance tracking
 */

import mongoose, { Types } from 'mongoose';
import { Product } from '../models/Product';
import { Supplier } from '../models/Supplier';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Store } from '../models/Store';
import { logger } from '../config/logger';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';
import {
  SmartInventoryService,
  createSmartInventoryService,
  type InventoryItem,
  type ReorderSuggestion,
  type ExpiryAlert,
  type InventorySummary,
} from './smartInventory';

// Cache configuration
const CACHE_PREFIX = 'healthinv:';
const CACHE_TTL_SECONDS = 300;

// ── Healthcare-Specific Types ───────────────────────────────────────────────────

export interface MedicineBatch {
  batchNumber: string;
  quantity: number;
  expiryDate: Date;
  purchaseDate: Date;
  supplierId?: string;
  supplierName?: string;
}

export interface MedicineTracking {
  medicineId: string;
  medicineName: string;
  totalStock: number;
  batches: MedicineBatch[];
  reorderPoint: number;
  isControlled: boolean;
  schedule?: string;
  unitCost: number;
}

export interface EquipmentTracking {
  equipmentId: string;
  equipmentName: string;
  category: string;
  available: number;
  total: number;
  inUse: number;
  maintenanceDue?: Date;
  lastServiced?: Date;
}

export interface HealthcareReorderSuggestion extends ReorderSuggestion {
  isControlled: boolean;
  schedule?: string;
  alternativeMedicines?: Array<{
    medicineId: string;
    name: string;
    available: boolean;
  }>;
  urgencyDays: number;
}

export interface HealthcareExpiryAlert extends ExpiryAlert {
  batchNumber: string;
  medicineCategory: string;
  isControlled: boolean;
  disposalInstructions?: string;
}

// ── Service Class ─────────────────────────────────────────────────────────────────

export class HealthcareInventoryService extends SmartInventoryService {
  private merchantId: Types.ObjectId;
  private storeId?: Types.ObjectId;

  constructor(merchantId: string, storeId?: string) {
    super(merchantId, storeId);
    this.merchantId = new mongoose.Types.ObjectId(merchantId);
    this.storeId = storeId ? new mongoose.Types.ObjectId(storeId) : undefined;
  }

  /**
   * Track medicine inventory with batch information
   */
  async trackMedicine(
    medicineId: string,
    stock: number,
    batch: string,
    options?: {
      expiryDate?: Date;
      supplierId?: string;
      supplierName?: string;
      isControlled?: boolean;
      schedule?: string;
    }
  ): Promise<MedicineTracking> {
    const cacheKey = `${CACHE_PREFIX}medicine:${medicineId}`;

    const product = await Product.findById(medicineId).lean();
    if (!product) {
      throw new Error(`Medicine not found: ${medicineId}`);
    }

    // Update product stock
    await Product.findByIdAndUpdate(medicineId, {
      $set: {
        'inventory.stock': stock,
        'metadata.batchNumber': batch,
        'metadata.expiryDate': options?.expiryDate,
        'metadata.isControlled': options?.isControlled || false,
        'metadata.schedule': options?.schedule,
      },
    });

    // Invalidate caches
    await cacheDel(cacheKey);

    logger.info('[HealthcareInventory] Medicine tracked', {
      medicineId,
      medicineName: product.name,
      stock,
      batch,
      isControlled: options?.isControlled,
    });

    return {
      medicineId,
      medicineName: product.name,
      totalStock: stock,
      batches: [{
        batchNumber: batch,
        quantity: stock,
        expiryDate: options?.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        purchaseDate: new Date(),
        supplierId: options?.supplierId,
        supplierName: options?.supplierName,
      }],
      reorderPoint: product.inventory?.lowStockThreshold || 10,
      isControlled: options?.isControlled || false,
      schedule: options?.schedule,
      unitCost: product.pricing?.selling || 0,
    };
  }

  /**
   * Track medical equipment availability
   */
  async trackEquipment(
    equipmentId: string,
    available: number,
    options?: {
      total?: number;
      inUse?: number;
      maintenanceDue?: Date;
      lastServiced?: Date;
      category?: string;
    }
  ): Promise<EquipmentTracking> {
    const cacheKey = `${CACHE_PREFIX}equipment:${equipmentId}`;

    const product = await Product.findById(equipmentId).lean();
    if (!product) {
      throw new Error(`Equipment not found: ${equipmentId}`);
    }

    const total = options?.total || available + (options?.inUse || 0);
    const inUse = options?.inUse || (total - available);

    // Update product inventory
    await Product.findByIdAndUpdate(equipmentId, {
      $set: {
        'inventory.stock': available,
        'metadata.totalEquipment': total,
        'metadata.inUse': inUse,
        'metadata.maintenanceDue': options?.maintenanceDue,
        'metadata.lastServiced': options?.lastServiced,
        'metadata.equipmentCategory': options?.category,
      },
    });

    await cacheDel(cacheKey);

    logger.info('[HealthcareInventory] Equipment tracked', {
      equipmentId,
      equipmentName: product.name,
      available,
      total,
      inUse,
    });

    return {
      equipmentId,
      equipmentName: product.name,
      category: options?.category || product.category || 'General',
      available,
      total,
      inUse,
      maintenanceDue: options?.maintenanceDue,
      lastServiced: options?.lastServiced,
    };
  }

  /**
   * Get expiry alerts for medicines
   */
  async getExpiryAlerts(daysAhead: number = 30): Promise<HealthcareExpiryAlert[]> {
    const cacheKey = `${CACHE_PREFIX}expiry:${this.storeId}:${daysAhead}`;
    const cached = await cacheGet<HealthcareExpiryAlert[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const query: Record<string, unknown> = {
      merchant: this.merchantId,
      'inventory.isAvailable': true,
      'inventory.unlimited': false,
      'inventory.stock': { $gt: 0 },
      'metadata.isMedicine': true,
    };

    if (this.storeId) {
      query.store = this.storeId;
    }

    const items = await Product.find(query)
      .select('store name sku category inventory pricing metadata tags')
      .lean();

    const alerts: HealthcareExpiryAlert[] = [];

    for (const item of items) {
      const metadata = (item as unknown).metadata || {};
      const expiryDate = metadata.expiryDate ? new Date(metadata.expiryDate) : null;

      if (expiryDate && expiryDate <= futureDate) {
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const stockValue = (item.inventory?.stock || 0) * (item.pricing?.selling || 0);

        let urgency: 'expired' | 'critical' | 'warning' | 'info';
        let suggestedAction: 'use_first' | 'discount' | 'discard' | 'donate' | 'return';

        if (daysUntilExpiry < 0) {
          urgency = 'expired';
          suggestedAction = metadata.isControlled ? 'return' : 'discard';
        } else if (daysUntilExpiry <= 7) {
          urgency = 'critical';
          suggestedAction = 'use_first';
        } else if (daysUntilExpiry <= 14) {
          urgency = 'warning';
          suggestedAction = 'discount';
        } else {
          urgency = 'info';
          suggestedAction = 'use_first';
        }

        alerts.push({
          itemId: item._id.toString(),
          name: item.name,
          sku: item.sku,
          category: item.category,
          expiryDate,
          daysUntilExpiry: Math.max(0, daysUntilExpiry),
          stockQuantity: item.inventory?.stock || 0,
          estimatedValue: stockValue,
          urgency,
          suggestedAction,
          batchNumber: metadata.batchNumber || 'N/A',
          medicineCategory: metadata.medicineCategory || 'General Medicine',
          isControlled: metadata.isControlled || false,
          disposalInstructions: metadata.disposalInstructions,
        });
      }
    }

    // Sort by urgency and expiry date
    alerts.sort((a, b) => {
      const urgencyOrder = { expired: 0, critical: 1, warning: 2, info: 3 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

    await cacheSet(cacheKey, alerts, CACHE_TTL_SECONDS);
    return alerts;
  }

  /**
   * Get reorder suggestions for medicines
   */
  async reorderMedicines(): Promise<HealthcareReorderSuggestion[]> {
    const cacheKey = `${CACHE_PREFIX}reorder:${this.storeId || 'all'}`;
    const cached = await cacheGet<HealthcareReorderSuggestion[]>(cacheKey);
    if (cached) return cached;

    const lowStockItems = await this.getLowStockItems();
    const suggestions: HealthcareReorderSuggestion[] = [];

    // Get suppliers
    const suppliers = await Supplier.find({
      merchantId: this.merchantId,
      isDeleted: { $ne: true },
    }).lean();

    for (const item of lowStockItems) {
      const stockRatio = item.stock / (item.reorderPoint || 1);

      let urgency: 'critical' | 'high' | 'medium' | 'low';
      let urgencyDays: number;

      if (stockRatio <= 0) {
        urgency = 'critical';
        urgencyDays = 0;
      } else if (stockRatio <= 0.25) {
        urgency = 'high';
        urgencyDays = 3;
      } else if (stockRatio <= 0.5) {
        urgency = 'medium';
        urgencyDays = 7;
      } else {
        urgency = 'low';
        urgencyDays = 14;
      }

      // Find medical/pharmaceutical suppliers
      const supplier = suppliers.find(s =>
        s.category?.toLowerCase().includes('pharma') ||
        s.category?.toLowerCase().includes('medical')
      );

      // Get product metadata for controlled substance info
      const product = await Product.findById(item._id.toString()).select('metadata').lean();
      const metadata = (product as unknown)?.metadata || {};

      // Find alternative medicines
      const alternativeMedicines = await this.findAlternativeMedicines(item.category, item._id.toString());

      const suggestedOrderQuantity = Math.max(
        item.reorderPoint - item.stock,
        item.reorderPoint * 2
      );

      suggestions.push({
        itemId: item._id.toString(),
        name: item.name,
        sku: item.sku,
        category: item.category,
        currentStock: item.stock,
        reorderPoint: item.reorderPoint,
        suggestedOrderQuantity,
        supplier: supplier ? {
          id: (supplier._id as Types.ObjectId).toString(),
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
        } : null,
        estimatedCost: suggestedOrderQuantity * item.unitCost,
        urgency,
        daysUntilStockOut: Math.floor(item.stock / Math.max(1, item.averageDailyUsage || 1)),
        averageDailyUsage: item.averageDailyUsage,
        lastOrdered: item.lastRestocked,
        isControlled: metadata.isControlled || false,
        schedule: metadata.schedule,
        alternativeMedicines,
        urgencyDays,
      });
    }

    // Sort by urgency
    suggestions.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

    await cacheSet(cacheKey, suggestions, CACHE_TTL_SECONDS);
    return suggestions;
  }

  /**
   * Find alternative medicines in same category
   */
  private async findAlternativeMedicines(
    category: string | undefined,
    excludeId: string
  ): Promise<Array<{ medicineId: string; name: string; available: boolean }>> {
    if (!category) return [];

    const alternatives = await Product.find({
      merchant: this.merchantId,
      category,
      _id: { $ne: new mongoose.Types.ObjectId(excludeId) },
      'inventory.stock': { $gt: 0 },
    })
      .select('_id name inventory.stock')
      .limit(5)
      .lean();

    return alternatives.map(alt => ({
      medicineId: (alt._id as Types.ObjectId).toString(),
      name: alt.name,
      available: (alt.inventory?.stock || 0) > 0,
    }));
  }

  /**
   * Get controlled substances report
   */
  async getControlledSubstancesReport(): Promise<Array<{
    medicineId: string;
    name: string;
    schedule: string;
    currentStock: number;
    lastDispensed?: Date;
    reorderPoint: number;
  }>> {
    const controlled = await Product.find({
      merchant: this.merchantId,
      'metadata.isControlled': true,
    })
      .select('name metadata inventory')
      .lean();

    return controlled.map(item => ({
      medicineId: (item._id as Types.ObjectId).toString(),
      name: item.name,
      schedule: (item.metadata as unknown)?.schedule || 'Unknown',
      currentStock: item.inventory?.stock || 0,
      lastDispensed: (item.metadata as unknown)?.lastDispensed
        ? new Date((item.metadata as unknown).lastDispensed)
        : undefined,
      reorderPoint: item.inventory?.lowStockThreshold || 5,
    }));
  }

  /**
   * Invalidate caches
   */
  private async invalidateCaches(): Promise<void> {
    try {
      await cacheDel(`${CACHE_PREFIX}*`);
    } catch (error) {
      logger.warn('[HealthcareInventory] Cache invalidation failed', {
        error: (error as Error).message,
      });
    }
  }
}

// ── Factory Function ─────────────────────────────────────────────────────────────

export function createHealthcareInventoryService(
  merchantId: string,
  storeId?: string
): HealthcareInventoryService {
  return new HealthcareInventoryService(merchantId, storeId);
}

export default HealthcareInventoryService;
