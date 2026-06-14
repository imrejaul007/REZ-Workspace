import { GoProduct, IGoProduct } from '../models/GoProduct.js';

export interface ProductSearchParams {
  query?: string;
  storeId?: string;
  category?: string;
  brand?: string;
  barcode?: string;
  page?: number;
  limit?: number;
}

export interface ProductResult {
  products: IGoProduct[];
  total: number;
  page: number;
  totalPages: number;
}

export class ProductService {
  /**
   * Search products
   */
  async searchProducts(params: ProductSearchParams): Promise<ProductResult> {
    const {
      query,
      storeId,
      category,
      brand,
      barcode,
      page = 1,
      limit = 20,
    } = params;

    const filter: Record<string, unknown> = {
      isAvailable: true,
      stock: { $gt: 0 },
    };

    if (storeId) {
      filter.storeIds = storeId;
    }

    if (category) {
      filter.category = category;
    }

    if (brand) {
      filter.brand = brand;
    }

    if (barcode) {
      filter.barcode = barcode;
    }

    if (query) {
      filter.$text = { $search: query };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      GoProduct.find(filter)
        .sort(query ? { score: { $meta: 'textScore' } } : { name: 1 })
        .skip(skip)
        .limit(limit),
      GoProduct.countDocuments(filter),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get product by barcode
   */
  async getByBarcode(barcode: string, storeId?: string): Promise<IGoProduct | null> {
    const filter: Record<string, unknown> = { barcode };

    if (storeId) {
      filter.storeIds = storeId;
    }

    return GoProduct.findOne(filter);
  }

  /**
   * Get product by ID
   */
  async getById(productId: string): Promise<IGoProduct | null> {
    return GoProduct.findOne({ productId });
  }

  /**
   * Get products by store
   */
  async getByStore(storeId: string, page: number = 1, limit: number = 50): Promise<ProductResult> {
    return this.searchProducts({ storeId, page, limit });
  }

  /**
   * Get categories for store
   */
  async getCategories(storeId: string): Promise<string[]> {
    const products = await GoProduct.find({
      storeIds: storeId,
      isAvailable: true,
    }).select('category');

    const categories = new Set<string>();
    for (const product of products) {
      if (product.category) {
        categories.add(product.category);
      }
    }

    return Array.from(categories).sort();
  }

  /**
   * Get brands for store
   */
  async getBrands(storeId: string): Promise<string[]> {
    const products = await GoProduct.find({
      storeIds: storeId,
      isAvailable: true,
    }).select('brand');

    const brands = new Set<string>();
    for (const product of products) {
      if (product.brand) {
        brands.add(product.brand);
      }
    }

    return Array.from(brands).sort();
  }

  /**
   * Bulk upsert products
   */
  async bulkUpsert(products: Partial<IGoProduct>[]): Promise<{
    inserted: number;
    updated: number;
  }> {
    let inserted = 0;
    let updated = 0;

    for (const product of products) {
      const result = await GoProduct.updateOne(
        { barcode: product.barcode, storeIds: product.storeIds?.[0] },
        {
          $set: product,
          $addToSet: { storeIds: { $each: product.storeIds || [] } },
        },
        { upsert: true }
      );

      if (result.upserted) {
        inserted++;
      } else if (result.modifiedCount > 0) {
        updated++;
      }
    }

    return { inserted, updated };
  }

  /**
   * Update stock
   */
  async updateStock(productId: string, quantity: number): Promise<void> {
    await GoProduct.updateOne(
      { productId },
      {
        $inc: { stock: -quantity },
        $min: { stock: 0 },
      }
    );
  }

  /**
   * Check stock availability
   */
  async checkStock(barcode: string, storeId: string, quantity: number): Promise<boolean> {
    const product = await GoProduct.findOne({ barcode, storeIds: storeId });
    if (!product) {
      return false;
    }
    return product.stock >= quantity;
  }
}

export const productService = new ProductService();
