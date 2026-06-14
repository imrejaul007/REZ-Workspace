import { Product, ProductDocument } from '../models';
import { ProductCategory, Gender, ProductStatus } from '../types';
import logger from '../utils/logger';

export interface CreateProductData {
  merchantId: string;
  name: string;
  sku: string;
  barcode?: string;
  category: ProductCategory;
  gender: Gender;
  sizes?: string[];
  colors?: string[];
  material?: string;
  brand?: string;
  season?: string;
  collection?: string;
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  stock?: number;
  minStock?: number;
  reorderLevel?: number;
  images?: string[];
  description?: string;
  tags?: string[];
}

export interface UpdateProductData {
  name?: string;
  sku?: string;
  barcode?: string;
  category?: ProductCategory;
  gender?: Gender;
  sizes?: string[];
  colors?: string[];
  material?: string;
  brand?: string;
  season?: string;
  collection?: string;
  mrp?: number;
  sellingPrice?: number;
  costPrice?: number;
  stock?: number;
  minStock?: number;
  reorderLevel?: number;
  images?: string[];
  description?: string;
  tags?: string[];
  status?: ProductStatus;
}

export interface ProductSearchParams {
  merchantId?: string;
  category?: ProductCategory;
  gender?: Gender;
  brand?: string;
  status?: ProductStatus;
  priceRange?: { min?: number; max?: number };
  season?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ProductService {
  async create(data: CreateProductData): Promise<ProductDocument> {
    const product = new Product(data);
    await product.save();
    logger.info('Product created', { productId: product.productId, merchantId: product.merchantId });
    return product;
  }

  async getById(productId: string): Promise<ProductDocument | null> {
    return Product.findOne({ productId });
  }

  async getBySku(sku: string): Promise<ProductDocument | null> {
    return Product.findOne({ sku: sku.toUpperCase() });
  }

  async getByBarcode(barcode: string): Promise<ProductDocument | null> {
    return Product.findOne({ barcode: barcode.toUpperCase() });
  }

  async update(productId: string, data: UpdateProductData): Promise<ProductDocument | null> {
    const product = await Product.findOneAndUpdate({ productId }, { $set: data }, { new: true, runValidators: true });
    if (product) logger.info('Product updated', { productId, updates: Object.keys(data) });
    return product;
  }

  async delete(productId: string): Promise<boolean> {
    const result = await Product.deleteOne({ productId });
    if (result.deletedCount > 0) {
      logger.info('Product deleted', { productId });
      return true;
    }
    return false;
  }

  async search(params: ProductSearchParams) {
    const { merchantId, category, gender, brand, status, priceRange, season, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const query: Record<string, unknown> = {};
    if (merchantId) query.merchantId = merchantId;
    if (category) query.category = category;
    if (gender) query.gender = gender;
    if (brand) query.brand = brand;
    if (status) query.status = status;
    if (season) query.season = season;
    if (priceRange) {
      query.sellingPrice = {};
      if (priceRange.min) (query.sellingPrice as Record<string, number>).$gte = priceRange.min;
      if (priceRange.max) (query.sellingPrice as Record<string, number>).$lte = priceRange.max;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [products, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);
    return {
      data: products,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)), hasNext: Number(page) < Math.ceil(total / Number(limit)), hasPrev: Number(page) > 1 },
    };
  }

  async bulkCreate(products: CreateProductData[]): Promise<ProductDocument[]> {
    const created = await Product.insertMany(products, { ordered: false });
    logger.info('Bulk products created', { count: created.length });
    return created;
  }

  async getByMerchant(merchantId: string, options: { page?: number; limit?: number; category?: ProductCategory } = {}) {
    const { page = 1, limit = 20, category } = options;
    const query: Record<string, unknown> = { merchantId };
    if (category) query.category = category;
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);
    return {
      data: products,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)), hasNext: Number(page) < Math.ceil(total / Number(limit)), hasPrev: Number(page) > 1 },
    };
  }

  async updateStock(productId: string, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<ProductDocument | null> {
    const product = await Product.findOne({ productId });
    if (!product) return null;
    await product.updateStock(quantity, operation);
    return product;
  }

  async getStatistics(merchantId: string): Promise<{ total: number; active: number; outOfStock: number; totalValue: number; categoryBreakdown: Record<string, number> }> {
    const products = await Product.find({ merchantId });
    const categoryBreakdown: Record<string, number> = {};
    products.forEach(p => { categoryBreakdown[p.category] = (categoryBreakdown[p.category] || 0) + 1; });
    return {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      outOfStock: products.filter(p => p.status === 'out_of_stock').length,
      totalValue: products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0),
      categoryBreakdown,
    };
  }
}

export const productService = new ProductService();
export default productService;