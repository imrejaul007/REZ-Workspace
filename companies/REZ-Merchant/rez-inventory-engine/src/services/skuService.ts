import { SKU, ISKU, UnitType, SKUStatus } from '../models/SKU';
import { Stock } from '../models/Stock';
import { Types } from 'mongoose';

export interface CreateSKUInput {
  merchantId: string;
  storeId: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  hsnCode: string;
  mrp: number;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  unit: UnitType;
  variant?: string;
  images?: string[];
  minStock?: number;
  maxStock?: number;
  reorderPoint: number;
  supplierId?: string;
  status?: SKUStatus;
}

export interface UpdateSKUInput {
  name?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  hsnCode?: string;
  mrp?: number;
  costPrice?: number;
  sellingPrice?: number;
  taxRate?: number;
  unit?: UnitType;
  variant?: string;
  images?: string[];
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  supplierId?: string;
  status?: SKUStatus;
  barcode?: string;
}

export interface SearchSKUFilters {
  merchantId?: string;
  storeId?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  status?: SKUStatus;
  minPrice?: number;
  maxPrice?: number;
  text?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

class SKUService {
  /**
   * Generate a unique SKU code
   */
  async generateSKU(
    storeId: string,
    category: string,
    unit: string,
    variant?: string
  ): Promise<string> {
    const storePrefix = storeId.substring(0, 6).toUpperCase();
    const categoryPrefix = category.substring(0, 4).toUpperCase();
    const unitSuffix = unit.toUpperCase().substring(0, 2);
    const variantSuffix = variant ? `-${variant.toUpperCase().substring(0, 3)}` : '';

    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();

    return `${storePrefix}-${categoryPrefix}-${unitSuffix}${variantSuffix}-${timestamp}${random}`;
  }

  /**
   * Generate a barcode for a SKU
   */
  async generateBarcode(prefix: string = 'REZ'): Promise<string> {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const barcode = `${prefix}${timestamp}${random}`;

    // Calculate EAN-13 check digit
    const checkDigit = this.calculateEAN13CheckDigit(barcode);
    return `${barcode}${checkDigit}`;
  }

  /**
   * Calculate EAN-13 check digit
   */
  private calculateEAN13CheckDigit(baseBarcode: string): string {
    const digits = baseBarcode.slice(0, 12).split('').map(Number);
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  }

  /**
   * Create a new SKU
   */
  async createSKU(input: CreateSKUInput): Promise<ISKU> {
    const skuCode = input.sku || await this.generateSKU(
      input.storeId,
      input.category,
      input.unit,
      input.variant
    );

    const sku = new SKU({
      ...input,
      sku: skuCode,
      images: input.images || [],
      minStock: input.minStock ?? 5,
      maxStock: input.maxStock,
      status: input.status || 'active',
    });

    await sku.save();

    // Create initial stock record
    const stock = new Stock({
      skuId: sku._id,
      storeId: input.storeId,
      quantity: 0,
      reservedQuantity: 0,
      availableQuantity: 0,
      lowStockAlert: false,
    });
    await stock.save();

    return sku;
  }

  /**
   * Update an existing SKU
   */
  async updateSKU(skuId: string, input: UpdateSKUInput): Promise<ISKU | null> {
    const sku = await SKU.findById(skuId);
    if (!sku) {
      return null;
    }

    // Recalculate margin if prices changed
    if (input.costPrice !== undefined || input.sellingPrice !== undefined) {
      const costPrice = input.costPrice ?? sku.costPrice;
      const sellingPrice = input.sellingPrice ?? sku.sellingPrice;

      if (costPrice > 0) {
        input as CreateSKUInput & UpdateSKUInput & { margin: number };
        (input as any).margin = ((sellingPrice - costPrice) / costPrice) * 100;
      }
    }

    Object.assign(sku, input);
    await sku.save();
    return sku;
  }

  /**
   * Get a SKU by ID
   */
  async getSKU(skuId: string): Promise<ISKU | null> {
    return SKU.findById(skuId);
  }

  /**
   * Get a SKU by SKU code
   */
  async getSKUByCode(sku: string): Promise<ISKU | null> {
    return SKU.findOne({ sku: sku.toUpperCase() });
  }

  /**
   * Search SKUs with filters and pagination
   */
  async searchSKU(
    filters: SearchSKUFilters,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ISKU>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;

    const query: any = {};

    if (filters.merchantId) {
      query.merchantId = filters.merchantId;
    }
    if (filters.storeId) {
      query.storeId = filters.storeId;
    }
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.subcategory) {
      query.subcategory = filters.subcategory;
    }
    if (filters.brand) {
      query.brand = filters.brand;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.sellingPrice = {};
      if (filters.minPrice !== undefined) {
        query.sellingPrice.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.sellingPrice.$lte = filters.maxPrice;
      }
    }
    if (filters.text) {
      query.$text = { $search: filters.text };
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      SKU.find(query).sort(sort).skip(skip).limit(limit).lean(),
      SKU.countDocuments(query),
    ]);

    return {
      data: data as ISKU[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Get SKUs by category
   */
  async getSKUsByCategory(
    merchantId: string,
    category: string,
    storeId?: string
  ): Promise<ISKU[]> {
    const query: any = { merchantId, category };
    if (storeId) {
      query.storeId = storeId;
    }
    return SKU.find(query).sort({ name: 1 }).lean();
  }

  /**
   * Get SKUs by store
   */
  async getSKUsByStore(storeId: string): Promise<ISKU[]> {
    return SKU.find({ storeId, status: 'active' }).sort({ name: 1 }).lean();
  }

  /**
   * Delete a SKU (soft delete by setting status to discontinued)
   */
  async deleteSKU(skuId: string): Promise<boolean> {
    const sku = await SKU.findByIdAndUpdate(
      skuId,
      { status: 'discontinued' },
      { new: true }
    );
    return !!sku;
  }

  /**
   * Hard delete a SKU (use with caution)
   */
  async hardDeleteSKU(skuId: string): Promise<boolean> {
    const sku = await SKU.findByIdAndDelete(skuId);
    if (sku) {
      await Stock.deleteOne({ skuId: new Types.ObjectId(skuId) });
      return true;
    }
    return false;
  }

  /**
   * Get SKU with stock information
   */
  async getSKUWithStock(skuId: string): Promise<any | null> {
    const sku = await SKU.findById(skuId);
    if (!sku) {
      return null;
    }

    const stock = await Stock.findOne({ skuId: sku._id });
    return {
      ...sku.toObject(),
      stock: stock ? stock.toObject() : null,
    };
  }

  /**
   * Bulk create SKUs
   */
  async bulkCreateSKUs(inputs: CreateSKUInput[]): Promise<{ success: ISKU[]; failed: any[] }> {
    const success: ISKU[] = [];
    const failed: any[] = [];

    for (const input of inputs) {
      try {
        const sku = await this.createSKU(input);
        success.push(sku);
      } catch (error: any) {
        failed.push({ input, error: error.message });
      }
    }

    return { success, failed };
  }

  /**
   * Get SKU statistics
   */
  async getSKUStats(merchantId: string, storeId?: string): Promise<any> {
    const matchStage: any = { merchantId };
    if (storeId) {
      matchStage.storeId = storeId;
    }

    const stats = await SKU.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgSellingPrice: { $avg: '$sellingPrice' },
          avgCostPrice: { $avg: '$costPrice' },
          avgMargin: { $avg: '$margin' },
        },
      },
    ]);

    const categoryStats = await SKU.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return { statusStats: stats, categoryStats };
  }
}

export const skuService = new SKUService();
