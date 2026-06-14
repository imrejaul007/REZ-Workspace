/**
 * Bulk Import Service
 *
 * Handles CSV import for:
 * - Suppliers
 * - Purchase Orders
 * - Products
 *
 * Features:
 * - CSV parsing with validation
 * - Batch processing with progress tracking
 * - Error reporting per row
 * - Duplicate detection
 */

import { Types } from 'mongoose';
import { Supplier } from '../models/Supplier';
import { PurchaseOrder, POItem, POStatus, POPaymentStatus } from '../models/PurchaseOrder';
import { logger } from '../config/logger';
import { Product } from '../models/Product';
import { Store } from '../models/Store';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImportResult<T> {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
  data?: T[];
}

export interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface SupplierImportRow {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  creditLimit?: string;
  creditPeriodDays?: string;
  notes?: string;
}

export interface POImportRow {
  poNumber?: string;
  supplierName: string;
  supplierGstin?: string;
  items: string; // JSON stringified
  orderDate?: string;
  dueDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
}

export interface ProductImportRow {
  sku: string;
  name: string;
  description?: string;
  unitPrice?: string;
  hsnCode?: string;
  taxRate?: string;
  category?: string;
  inventory?: string;
}

// ── CSV Parsing ───────────────────────────────────────────────────────────────

export function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;

    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

export function csvToObjects<T>(content: string, headers?: string[]): T[] {
  const rows = parseCSV(content);

  if (rows.length < 2) {
    return [];
  }

  const headerRow = headers || rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const dataRows = rows.slice(1);

  return dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headerRow.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj as unknown as T;
  });
}

// ── Supplier Import ───────────────────────────────────────────────────────────

export async function importSuppliers(
  merchantId: string,
  content: string,
  options: { skipDuplicates?: boolean; updateExisting?: boolean } = {}
): Promise<ImportResult<Supplier>> {
  const result: ImportResult<Supplier> = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
    data: [],
  };

  const rows = csvToObjects<SupplierImportRow>(content);
  logger.info(`[BulkImport] Processing ${rows.length} supplier rows`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // +2 for header and 0-index

    try {
      // Validate required fields
      if (!row.name?.trim()) {
        result.errors.push({
          row: rowNumber,
          field: 'name',
          value: row.name,
          message: 'Supplier name is required',
        });
        result.failed++;
        continue;
      }

      // Check for duplicate GST
      if (row.gstNumber) {
        const existing = await Supplier.findOne({
          merchantId: new Types.ObjectId(merchantId),
          gstNumber: row.gstNumber,
          isDeleted: { $ne: true },
        }).lean();

        if (existing) {
          if (options.skipDuplicates) {
            result.imported++;
            result.data?.push(existing as unknown);
            continue;
          }
          if (!options.updateExisting) {
            result.errors.push({
              row: rowNumber,
              field: 'gstNumber',
              value: row.gstNumber,
              message: 'Supplier with this GST already exists',
            });
            result.failed++;
            continue;
          }
        }
      }

      // Build supplier data
      const supplierData: Record<string, unknown> = {
        merchantId: new Types.ObjectId(merchantId),
        name: row.name.trim(),
        contactPerson: row.contactPerson?.trim() || undefined,
        email: row.email?.trim() || undefined,
        phone: row.phone?.trim() || undefined,
        gstNumber: row.gstNumber?.trim() || undefined,
        pan: row.pan?.trim() || undefined,
        creditLimit: row.creditLimit ? parseFloat(row.creditLimit) : 500000,
        creditPeriodDays: row.creditPeriodDays ? parseInt(row.creditPeriodDays) : 30,
        creditUsed: 0,
        status: 'approved',
        isActive: true,
        tags: [],
      };

      // Handle address
      if (row.address || row.city || row.state) {
        supplierData.address = {
          street: row.address || '',
          city: row.city || '',
          state: row.state || '',
          pincode: row.pincode || '',
          country: 'India',
        };
      }

      // Parse notes
      if (row.notes) {
        supplierData.notes = row.notes;
      }

      let supplier: Supplier;
      if (options.updateExisting && row.gstNumber) {
        supplier = await Supplier.findOneAndUpdate(
          { merchantId: new Types.ObjectId(merchantId), gstNumber: row.gstNumber },
          { $set: supplierData },
          { new: true, upsert: true }
        );
      } else {
        supplier = await Supplier.create(supplierData);
      }

      result.imported++;
      result.data?.push(supplier);
    } catch (err) {
      const error = err as Error;
      result.errors.push({
        row: rowNumber,
        field: 'general',
        value: '',
        message: error.message,
      });
      result.failed++;
    }
  }

  result.success = result.failed === 0;
  logger.info(`[BulkImport] Suppliers: ${result.imported} imported, ${result.failed} failed`);
  return result;
}

// ── Product Import ────────────────────────────────────────────────────────────

export async function importProducts(
  merchantId: string,
  storeId: string,
  content: string,
  options: { skipDuplicates?: boolean; updateExisting?: boolean } = {}
): Promise<ImportResult<Product>> {
  const result: ImportResult<Product> = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
    data: [],
  };

  const rows = csvToObjects<ProductImportRow>(content);
  logger.info(`[BulkImport] Processing ${rows.length} product rows`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;

    try {
      if (!row.sku?.trim() || !row.name?.trim()) {
        result.errors.push({
          row: rowNumber,
          field: 'sku/name',
          value: `${row.sku}/${row.name}`,
          message: 'SKU and name are required',
        });
        result.failed++;
        continue;
      }

      // Check duplicate
      const existing = await Product.findOne({
        merchantId: new Types.ObjectId(merchantId),
        sku: row.sku.trim(),
      }).lean();

      if (existing) {
        if (options.skipDuplicates) {
          result.imported++;
          result.data?.push(existing as unknown);
          continue;
        }
        if (!options.updateExisting) {
          result.errors.push({
            row: rowNumber,
            field: 'sku',
            value: row.sku,
            message: 'Product with this SKU already exists',
          });
          result.failed++;
          continue;
        }
      }

      const productData = {
        merchantId: new Types.ObjectId(merchantId),
        storeId: new Types.ObjectId(storeId),
        sku: row.sku.trim(),
        name: row.name.trim(),
        description: row.description?.trim() || '',
        basePrice: row.unitPrice ? parseFloat(row.unitPrice) : 0,
        hsnCode: row.hsnCode?.trim() || undefined,
        taxRate: row.taxRate ? parseFloat(row.taxRate) : 18,
        category: row.category?.trim() || 'General',
        inventory: {
          quantity: row.inventory ? parseInt(row.inventory) : 0,
          lowStockThreshold: 10,
        },
        isActive: true,
      };

      let product: Product;
      if (options.updateExisting) {
        product = await Product.findOneAndUpdate(
          { merchantId: new Types.ObjectId(merchantId), sku: row.sku.trim() },
          { $set: productData },
          { new: true, upsert: true }
        );
      } else {
        product = await Product.create(productData);
      }

      result.imported++;
      result.data?.push(product);
    } catch (err) {
      const error = err as Error;
      result.errors.push({
        row: rowNumber,
        field: 'general',
        value: '',
        message: error.message,
      });
      result.failed++;
    }
  }

  result.success = result.failed === 0;
  logger.info(`[BulkImport] Products: ${result.imported} imported, ${result.failed} failed`);
  return result;
}

// ── PO Import ────────────────────────────────────────────────────────────────

export async function importPurchaseOrders(
  merchantId: string,
  content: string,
  options: { createSuppliers?: boolean } = {}
): Promise<ImportResult<PurchaseOrder>> {
  const result: ImportResult<PurchaseOrder> = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
    data: [],
  };

  const rows = csvToObjects<POImportRow>(content);
  logger.info(`[BulkImport] Processing ${rows.length} PO rows`);

  // Get default store
  const store = await Store.findOne({ merchantId: new Types.ObjectId(merchantId) }).lean();
  if (!store) {
    result.success = false;
    result.errors.push({
      row: 0,
      field: 'general',
      value: '',
      message: 'No store found for merchant',
    });
    return result;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;

    try {
      if (!row.supplierName?.trim()) {
        result.errors.push({
          row: rowNumber,
          field: 'supplierName',
          value: row.supplierName,
          message: 'Supplier name is required',
        });
        result.failed++;
        continue;
      }

      if (!row.dueDate) {
        result.errors.push({
          row: rowNumber,
          field: 'dueDate',
          value: row.dueDate,
          message: 'Due date is required',
        });
        result.failed++;
        continue;
      }

      // Find or create supplier
      let supplier = await Supplier.findOne({
        merchantId: new Types.ObjectId(merchantId),
        $or: [
          { name: { $regex: new RegExp(`^${row.supplierName.trim()}$`, 'i') } },
          { gstNumber: row.supplierGstin?.trim() },
        ],
        isDeleted: { $ne: true },
      }).lean();

      if (!supplier) {
        if (options.createSuppliers) {
          supplier = await Supplier.create({
            merchantId: new Types.ObjectId(merchantId),
            name: row.supplierName.trim(),
            gstNumber: row.supplierGstin?.trim(),
            creditLimit: 500000,
            creditPeriodDays: 30,
            status: 'approved',
            isActive: true,
          });
        } else {
          result.errors.push({
            row: rowNumber,
            field: 'supplierName',
            value: row.supplierName,
            message: `Supplier "${row.supplierName}" not found`,
          });
          result.failed++;
          continue;
        }
      }

      // Parse items
      let items: POItem[] = [];
      if (row.items) {
        try {
          items = JSON.parse(row.items);
        } catch {
          result.errors.push({
            row: rowNumber,
            field: 'items',
            value: row.items,
            message: 'Invalid items JSON format',
          });
          result.failed++;
          continue;
        }
      }

      // Calculate totals
      let subtotal = 0;
      let totalTax = 0;
      items = items.map((item) => {
        const itemTotal = item.quantity * item.unitPrice - (item.discount || 0);
        const taxAmount = itemTotal * ((item.taxRate || 18) / 100);
        subtotal += itemTotal;
        totalTax += taxAmount;
        return {
          ...item,
          taxAmount,
          total: itemTotal + taxAmount,
          receivedQty: 0,
          pendingQty: item.quantity,
        };
      });

      const totalAmount = subtotal + totalTax;

      // Generate PO number
      const poNumber = row.poNumber || `PO-${Date.now()}-${rowNumber}`;

      const poData = {
        merchantId: new Types.ObjectId(merchantId),
        storeId: store._id,
        poNumber,
        supplierId: supplier._id,
        supplierName: supplier.name,
        status: POStatus.DRAFT,
        paymentStatus: POPaymentStatus.UNPAID,
        items,
        subtotal,
        totalDiscount: 0,
        taxAmount: totalTax,
        totalAmount,
        paidAmount: 0,
        orderDate: row.orderDate ? new Date(row.orderDate) : new Date(),
        dueDate: new Date(row.dueDate),
        expectedDeliveryDate: row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate) : undefined,
        notes: row.notes,
        createdBy: new Types.ObjectId(merchantId),
        approvalHistory: [],
      };

      const po = await PurchaseOrder.create(poData);
      result.imported++;
      result.data?.push(po);
    } catch (err) {
      const error = err as Error;
      result.errors.push({
        row: rowNumber,
        field: 'general',
        value: '',
        message: error.message,
      });
      result.failed++;
    }
  }

  result.success = result.failed === 0;
  logger.info(`[BulkImport] POs: ${result.imported} imported, ${result.failed} failed`);
  return result;
}

// ── CSV Template Generators ───────────────────────────────────────────────────

export function generateSupplierTemplate(): string {
  return `name,contactPerson,email,phone,gstNumber,pan,address,city,state,pincode,creditLimit,creditPeriodDays,notes
"ABC Supplies","Rajesh Kumar","rajesh@abc.com","9876543210","27ABCDE1234F1Z5","ABCDE1234F","123 Main St","Mumbai","Maharashtra","400001","500000","30","Preferred vendor"`;
}

export function generateProductTemplate(): string {
  return `sku,name,description,unitPrice,hsnCode,taxRate,category,inventory
"SKU001","Product Name","Description here",100.00,"9988",18,"Electronics",100`;
}

export function generatePOTemplate(): string {
  return `supplierName,supplierGstin,items,orderDate,dueDate,expectedDeliveryDate,notes
"ABC Supplies","27ABCDE1234F1Z5","[{\"productName\":\"Item 1\",\"quantity\":10,\"unitPrice\":100,\"taxRate\":18}]","2026-05-01","2026-06-01","2026-05-15","Bulk order"`;
}
