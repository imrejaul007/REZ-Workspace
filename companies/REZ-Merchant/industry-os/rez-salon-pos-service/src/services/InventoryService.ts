import { v4 as uuidv4 } from 'uuid';
import mongoose, { ClientSession } from 'mongoose';
import { Product, IProduct } from '../models/Product';
import { Transaction } from '../models/Transaction';
import { config } from '../config';

export interface ProductCreateInput {
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  sku: string;
  barcode?: string;
  description?: string;
  currentStock: number;
  lowStockThreshold?: number;
  reorderLevel?: number;
  unit?: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  wholesalePrice?: number;
  taxRate?: number;
  imageUrl?: string;
  isService?: boolean;
  hsnCode?: string;
  expiryDate?: Date;
}

export interface StockAdjustment {
  productId: string;
  quantity: number;
  reason: string;
  reference?: string;
  adjustedBy: string;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockProducts: IProduct[];
  outOfStockProducts: IProduct[];
  categoryBreakdown: Record<string, { count: number; value: number }>;
  expiringProducts: IProduct[];
}

export interface StockMovement {
  date: Date;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string;
  balanceAfter: number;
}

export class InventoryService {
  /**
   * Create a new product/service
   */
  async createProduct(input: ProductCreateInput): Promise<IProduct> {
    const productId = `PRD-${uuidv4().slice(0, 8).toUpperCase()}`;

    const product = new Product({
      productId,
      name: input.name,
      brand: input.brand,
      category: input.category,
      subcategory: input.subcategory,
      sku: input.sku,
      barcode: input.barcode,
      description: input.description,
      inventory: {
        currentStock: input.currentStock || 0,
        lowStockThreshold: input.lowStockThreshold || 10,
        reorderLevel: input.reorderLevel || 5,
        unit: input.unit || 'pcs',
      },
      pricing: {
        costPrice: input.costPrice,
        sellingPrice: input.sellingPrice,
        mrp: input.mrp || input.sellingPrice,
        wholesalePrice: input.wholesalePrice,
        taxRate: input.taxRate || config.business.defaultTaxRate,
      },
      imageUrl: input.imageUrl,
      isService: input.isService || false,
      hsnCode: input.hsnCode || '9994',
      gstRate: input.taxRate || config.business.defaultTaxRate,
      expiryDate: input.expiryDate,
    });

    await product.save();
    return product;
  }

  /**
   * Update product
   */
  async updateProduct(productId: string, updates: Partial<ProductCreateInput>): Promise<IProduct | null> {
    const updateData: unknown = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.brand) updateData.brand = updates.brand;
    if (updates.category) updateData.category = updates.category;
    if (updates.subcategory) updateData.subcategory = updates.subcategory;
    if (updates.sku) updateData.sku = updates.sku;
    if (updates.barcode) updateData.barcode = updates.barcode;
    if (updates.description) updateData.description = updates.description;
    if (updates.imageUrl) updateData.imageUrl = updates.imageUrl;
    if (updates.isService !== undefined) updateData.isService = updates.isService;
    if (updates.hsnCode) updateData.hsnCode = updates.hsnCode;
    if (updates.expiryDate) updateData.expiryDate = updates.expiryDate;

    if (updates.currentStock !== undefined) {
      updateData['inventory.currentStock'] = updates.currentStock;
    }
    if (updates.lowStockThreshold !== undefined) {
      updateData['inventory.lowStockThreshold'] = updates.lowStockThreshold;
    }
    if (updates.reorderLevel !== undefined) {
      updateData['inventory.reorderLevel'] = updates.reorderLevel;
    }
    if (updates.unit) updateData['inventory.unit'] = updates.unit;

    if (updates.costPrice !== undefined) updateData['pricing.costPrice'] = updates.costPrice;
    if (updates.sellingPrice !== undefined) updateData['pricing.sellingPrice'] = updates.sellingPrice;
    if (updates.mrp !== undefined) updateData['pricing.mrp'] = updates.mrp;
    if (updates.wholesalePrice !== undefined) updateData['pricing.wholesalePrice'] = updates.wholesalePrice;
    if (updates.taxRate !== undefined) {
      updateData['pricing.taxRate'] = updates.taxRate;
      updateData.gstRate = updates.taxRate;
    }

    const product = await Product.findOneAndUpdate(
      { productId },
      { $set: updateData },
      { new: true }
    );

    return product;
  }

  /**
   * Adjust stock (add or remove)
   */
  async adjustStock(adjustment: StockAdjustment): Promise<IProduct | null> {
    const product = await Product.findOne({ productId: adjustment.productId });
    if (!product) {
      throw new Error('Product not found');
    }

    const newStock = product.inventory.currentStock + adjustment.quantity;
    if (newStock < 0) {
      throw new Error(
        `Insufficient stock. Current: ${product.inventory.currentStock}, Adjustment: ${adjustment.quantity}`
      );
    }

    product.inventory.currentStock = newStock;
    await product.save();

    return product;
  }

  /**
   * Bulk stock update (for inventory count)
   */
  async bulkStockUpdate(
    updates: Array<{ productId: string; newQuantity: number }>,
    updatedBy: string
  ): Promise<{ updated: number; errors: string[] }> {
    let updated = 0;
    const errors: string[] = [];

    for (const item of updates) {
      try {
        await Product.updateOne(
          { productId: item.productId },
          { $set: { 'inventory.currentStock': item.newQuantity } }
        );
        updated++;
      } catch (error) {
        errors.push(`Failed to update ${item.productId}: ${error.message}`);
      }
    }

    return { updated, errors };
  }

  /**
   * Get comprehensive inventory report
   */
  async getInventoryReport(): Promise<InventoryReport> {
    const products = await Product.find({ isActive: true, isService: false });

    const report: InventoryReport = {
      totalProducts: products.length,
      totalValue: 0,
      lowStockProducts: [],
      outOfStockProducts: [],
      categoryBreakdown: {},
      expiringProducts: [],
    };

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    for (const product of products) {
      const value = product.inventory.currentStock * product.pricing.costPrice;
      report.totalValue += value;

      if (product.inventory.currentStock === 0) {
        report.outOfStockProducts.push(product);
      } else if (product.isLowStock()) {
        report.lowStockProducts.push(product);
      }

      if (product.expiryDate && product.expiryDate <= thirtyDaysFromNow) {
        report.expiringProducts.push(product);
      }

      if (!report.categoryBreakdown[product.category]) {
        report.categoryBreakdown[product.category] = { count: 0, value: 0 };
      }
      report.categoryBreakdown[product.category].count++;
      report.categoryBreakdown[product.category].value += value;
    }

    return report;
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(): Promise<IProduct[]> {
    return Product.find({
      isActive: true,
      isService: false,
      $expr: { $lte: ['$inventory.currentStock', '$inventory.lowStockThreshold'] },
    }).sort({ 'inventory.currentStock': 1 });
  }

  /**
   * Get stock movement history
   */
  async getStockMovements(
    productId?: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 50
  ): Promise<{ movements: StockMovement[]; total: number }> {
    const movements: StockMovement[] = [];

    // Get sales transactions
    const transactionQuery: unknown = {
      status: 'completed',
      'items.itemType': 'product',
    };

    if (productId) {
      transactionQuery['items.itemId'] = productId;
    }

    if (startDate || endDate) {
      transactionQuery.createdAt = {};
      if (startDate) transactionQuery.createdAt.$gte = startDate;
      if (endDate) transactionQuery.createdAt.$lte = endDate;
    }

    const transactions = await Transaction.find(transactionQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Build movement records from transactions (sales)
    for (const tx of transactions) {
      for (const item of tx.items) {
        if (item.itemType === 'product') {
          if (productId && item.itemId !== productId) continue;

          movements.push({
            date: tx.createdAt,
            productId: item.itemId,
            productName: item.name,
            type: tx.transactionType === 'refund' ? 'in' : 'out',
            quantity: tx.transactionType === 'refund' ? item.quantity : -item.quantity,
            reason: tx.transactionType === 'refund' ? 'Sale refund' : 'Sale',
            reference: tx.transactionId,
            balanceAfter: 0, // Would need current balance calculation
          });
        }
      }
    }

    return {
      movements: movements.sort((a, b) => b.date.getTime() - a.date.getTime()),
      total: movements.length,
    };
  }

  /**
   * Get product by ID
   */
  async getProduct(productId: string): Promise<IProduct | null> {
    return Product.findOne({ productId });
  }

  /**
   * Get product by SKU or barcode
   */
  async getProductBySkuOrBarcode(identifier: string): Promise<IProduct | null> {
    return Product.findOne({
      $or: [{ sku: identifier }, { barcode: identifier }],
    });
  }

  /**
   * Get all products with filtering and pagination
   */
  async getProducts(filters: {
    category?: string;
    brand?: string;
    isService?: boolean;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: IProduct[]; total: number; page: number; totalPages: number }> {
    const query: unknown = {};

    if (filters.category) query.category = filters.category;
    if (filters.brand) query.brand = filters.brand;
    if (filters.isService !== undefined) query.isService = filters.isService;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } },
        { barcode: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<string[]> {
    const categories = await Product.distinct('category', { isActive: true });
    return categories;
  }

  /**
   * Get brands
   */
  async getBrands(): Promise<string[]> {
    const brands = await Product.distinct('brand', { isActive: true, brand: { $ne: null } });
    return brands.filter(Boolean);
  }

  /**
   * Toggle product active status
   */
  async toggleProductStatus(productId: string): Promise<IProduct | null> {
    return Product.findOneAndUpdate(
      { productId },
      [{ $set: { isActive: { $not: '$isActive' } } }],
      { new: true }
    );
  }

  /**
   * Delete product (soft delete - just deactivate)
   */
  async deleteProduct(productId: string): Promise<boolean> {
    const result = await Product.updateOne(
      { productId },
      { $set: { isActive: false } }
    );
    return result.modifiedCount > 0;
  }
}

export const inventoryService = new InventoryService();
