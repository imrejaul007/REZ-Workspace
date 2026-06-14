import { ProductModel } from '../models/Product';
import { SupplierModel } from '../models/Supplier';
import { Product, Supplier, ProductCategory } from '../types';

export class InventoryService {
  async createProduct(data: Partial<Product>): Promise<Product> {
    const product = new ProductModel(data);
    await product.save();
    return product.toJSON();
  }

  async getProductById(id: string): Promise<Product | null> {
    const product = await ProductModel.findById(id);
    return product?.toJSON() || null;
  }

  async getProducts(filters: {
    category?: ProductCategory;
    status?: string;
    supplierId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const {
      category,
      status,
      supplierId,
      search,
      page = 1,
      limit = 20
    } = filters;

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (supplierId) query.supplierId = supplierId;
    if (search) {
      query.$text = { $search: search };
    }

    const [products, total] = await Promise.all([
      ProductModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ProductModel.countDocuments(query)
    ]);

    return {
      products: products.map(p => p.toJSON()),
      total
    };
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
    const product = await ProductModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    return product?.toJSON() || null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndDelete(id);
    return !!result;
  }

  async updateStock(id: string, quantity?: number, adjustment?: number): Promise<Product | null> {
    const product = await ProductModel.findById(id);
    if (!product) return null;

    if (typeof quantity === 'number') {
      product.quantity = quantity;
    } else if (typeof adjustment === 'number') {
      product.quantity = Math.max(0, product.quantity + adjustment);
    }

    await product.save();
    return product.toJSON();
  }

  async getLowStockProducts(): Promise<Product[]> {
    const products = await ProductModel.findLowStock();
    return products.map(p => p.toJSON());
  }

  async getOutOfStockProducts(): Promise<Product[]> {
    const products = await ProductModel.findOutOfStock();
    return products.map(p => p.toJSON());
  }

  async getProductsBySupplier(supplierId: string): Promise<Product[]> {
    const products = await ProductModel.findBySupplier(supplierId);
    return products.map(p => p.toJSON());
  }

  async getInventoryStats(): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    byCategory: Record<string, number>;
  }> {
    const products = await ProductModel.find({ status: 'active' });
    const lowStock = await ProductModel.findLowStock();
    const outOfStock = await ProductModel.findOutOfStock();

    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0);
    const byCategory: Record<string, number> = {};

    products.forEach(p => {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    });

    return {
      totalProducts: products.length,
      totalValue,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      byCategory
    };
  }

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    const supplier = new SupplierModel(data);
    await supplier.save();
    return supplier.toJSON();
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    const supplier = await SupplierModel.findById(id).populate('products');
    return supplier?.toJSON() || null;
  }

  async getSuppliers(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ suppliers: Supplier[]; total: number }> {
    const { status, page = 1, limit = 20 } = filters;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const [suppliers, total] = await Promise.all([
      SupplierModel.find(query)
        .sort({ rating: -1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      SupplierModel.countDocuments(query)
    ]);

    return {
      suppliers: suppliers.map(s => s.toJSON()),
      total
    };
  }

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier | null> {
    const supplier = await SupplierModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    return supplier?.toJSON() || null;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await SupplierModel.findByIdAndDelete(id);
    return !!result;
  }

  async getTopRatedSuppliers(limit = 10): Promise<Supplier[]> {
    const suppliers = await SupplierModel.findTopRated(limit);
    return suppliers.map(s => s.toJSON());
  }
}

export const inventoryService = new InventoryService();
