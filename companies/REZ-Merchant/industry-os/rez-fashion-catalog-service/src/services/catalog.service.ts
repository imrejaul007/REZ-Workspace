import { ProductModel } from '../models/Product';
import { SKUModel } from '../models/SKU';
import { Product, SKU } from '../types';

export class CatalogService {
  async createProduct(data: Partial<Product>): Promise<Product> {
    const product = new ProductModel(data);
    await product.save();
    return product.toJSON();
  }

  async getProductById(id: string): Promise<Product | null> {
    const product = await ProductModel.findById(id);
    return product?.toJSON() || null;
  }

  async getProducts(filters: { category?: string; collectionId?: string; search?: string; page?: number; limit?: number }): Promise<{ products: Product[]; total: number }> {
    const { category, collectionId, search, page = 1, limit = 20 } = filters;
    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (collectionId) query.collectionId = collectionId;
    if (search) query.$text = { $search: search };

    const [products, total] = await Promise.all([
      ProductModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      ProductModel.countDocuments(query)
    ]);

    return { products: products.map(p => p.toJSON()), total };
  }

  async createSKU(data: Partial<SKU>): Promise<SKU> {
    const sku = new SKUModel(data);
    await sku.save();
    return sku.toJSON();
  }

  async getSKUsByProduct(productId: string): Promise<SKU[]> {
    const skus = await SKUModel.find({ productId });
    return skus.map(s => s.toJSON());
  }

  async updateSKUStock(skuId: string, quantity: number): Promise<SKU | null> {
    const sku = await SKUModel.findByIdAndUpdate(skuId, { $set: { quantity } }, { new: true });
    return sku?.toJSON() || null;
  }
}

export const catalogService = new CatalogService();
