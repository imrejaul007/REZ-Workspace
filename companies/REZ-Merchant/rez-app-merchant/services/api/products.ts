import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../storage';
import { buildApiUrl } from '../../config/api';
import { apiClient } from './client';
import { devLog, devWarn } from '../../utils/devLog';
import { logger } from '../../utils/logger';
import { Platform } from 'react-native';
// Week-4: Response guard — validate backend product responses at runtime using the
// no-zod guard from @rez/shared-types. Keeps the React Native bundle small.
import { isProductResponse } from '@rez/shared-types';
// Note: buildApiUrl and storageService are used by the raw fetch() calls in the variant/bulk
// methods below. Those paths handle binary uploads/downloads where apiClient cannot be used
// directly (FormData streaming, blob responses). All JSON API calls use apiClient.
import {
  Product,
  ProductCategory,
  ProductSearchRequest as ProductFiltersBase,
} from '@/shared/types';

// Extended ProductFilters with extra merchant-specific fields
interface ProductFilters extends ProductFiltersBase {
  query?: string;
  status?: string;
  stockLevel?: string;
  visibility?: string;
  storeId?: string;
}

export interface ProductListResponse {
  products: Product[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  pricing: { selling: number; original: number; cost?: number };
  category: string;
  store?: string; // Store ObjectId (multi-store support)
  sku?: string;
  inventory: {
    stock: number;
    lowStockThreshold?: number;
    trackInventory?: boolean;
    allowBackorders?: boolean;
    // R15: backend IProductInventory has unlimited: boolean for digital products.
    unlimited?: boolean;
  };
  cashback: {
    percentage: number;
    maxAmount?: number;
    isActive?: boolean;
  };
  images?: Array<{
    url: string;
    thumbnailUrl?: string;
    altText?: string;
    sortOrder?: number;
    isMain?: boolean;
  }>;
  status?: 'active' | 'inactive' | 'draft' | 'archived';
  visibility?: 'public' | 'hidden' | 'featured';
  tags?: string[];
  currency?: string;
  shortDescription?: string;
  brand?: string;
  barcode?: string;
  subcategory?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  store?: string; // Store ObjectId (multi-store support)
  subcategory?: string;
  brand?: string;
  pricing?: { selling?: number; original?: number; cost?: number };
  inventory?: {
    stock?: number;
    lowStockThreshold?: number;
    trackInventory?: boolean;
    allowBackorders?: boolean;
    // R15: backend IProductInventory has unlimited: boolean for digital products.
    // Include it here so the merchant frontend can toggle unlimited stock via PATCH.
    unlimited?: boolean;
  };
  images?: Array<{
    url: string;
    thumbnailUrl?: string;
    altText?: string;
    sortOrder?: number;
    isMain?: boolean;
  }>;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  searchKeywords?: string[];
  status?: 'active' | 'inactive' | 'draft' | 'archived';
  visibility?: 'public' | 'hidden' | 'featured';
  cashback?: {
    percentage: number;
    maxAmount?: number;
    isActive: boolean;
  };
}

export interface BulkProductAction {
  productIds: string[];
  action: 'activate' | 'deactivate' | 'delete' | 'update_category';
  category?: string;
  price?: number;
}

class ProductsService {
  // Token cache for performance optimization
  private tokenCache: { token: string; expiresAt: number } | null = null;
  private readonly TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  // MERCH-015: Image validation constants
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

  // MERCH-015: Validate product images before upload
  validateImages(images?: Array<{ url: string; file?: File }>): boolean {
    if (!images || images.length === 0) {
      return true; // No images is valid
    }

    for (const image of images) {
      // If file is present, validate it
      if (image.file) {
        // Check file type
        if (!this.ALLOWED_IMAGE_TYPES.includes(image.file.type)) {
          throw new Error(
            `Invalid image type: ${image.file.type}. Allowed types: JPEG, PNG, WebP, GIF`
          );
        }

        // Check file size
        if (image.file.size > this.MAX_IMAGE_SIZE) {
          throw new Error(`Image size exceeds ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB limit`);
        }
      }

      // Validate URL format if present
      if (image.url) {
        try {
          new URL(image.url);
        } catch (e) {
          throw new Error(`Invalid image URL: ${image.url}`);
        }
      }
    }

    return true;
  }

  // Get products with filtering and pagination
  async getProducts(filters?: ProductFilters): Promise<ProductListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
        if (filters.query) params.append('search', filters.query);
        if (filters.category) params.append('category', filters.category);
        if (filters.status) params.append('status', filters.status);
        if (filters.stockLevel) params.append('stockLevel', filters.stockLevel);
        if (filters.visibility) params.append('visibility', filters.visibility);
        if (filters.storeId) params.append('storeId', filters.storeId);
      }

      // rez-merchant-service returns: { success, data: Product[], pagination: { total, page, limit, totalPages, hasMore } }
      // Some legacy paths may nest as { success, data: { products, pagination } } — handle both.
      const response = await apiClient.get<unknown>(`merchant/products?${params}`);

      if (response.success) {
        const payload: unknown = response.data ?? {};
        const products = Array.isArray(payload)
          ? payload
          : (payload.products ?? payload.items ?? []);
        const pag =
          (Array.isArray(payload) ? response.pagination : payload.pagination) ??
          response.pagination ??
          {};
        return {
          products,
          totalCount: pag.total ?? pag.totalCount ?? products.length,
          page: pag.page ?? 1,
          limit: pag.limit ?? 20,
          totalPages: pag.totalPages ?? 1,
        };
      } else {
        throw new Error(response.message || 'Failed to get products');
      }
    } catch (error) {
      devWarn('Get products error:', error);
      throw new Error(error.message || 'Failed to get products');
    }
  }

  // Get single product by ID
  async getProduct(productId: string): Promise<Product> {
    try {
      const data = await apiClient.get<Product>(`merchant/products/${productId}`);

      // Week-4: Guard the product response. A malformed response would crash the
      // product edit screen when reading pricing.selling or inventory.stock.
      if (data.success && data.data) {
        if (!isProductResponse(data.data)) {
          devWarn('Malformed product response from backend, falling back to raw data');
        }
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get product');
      }
    } catch (error) {
      devWarn('Get product error:', error);
      throw new Error(error.message || 'Failed to get product');
    }
  }

  // Create new product
  async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      const data = await apiClient.post<Product>('merchant/products', productData);

      // Week-4: Guard the product response. A malformed response would cause the
      // product detail screen to crash on undefined pricing fields.
      if (data.success && data.data) {
        if (!isProductResponse(data.data)) {
          devWarn('Malformed product response from backend, falling back to raw data');
        }
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create product');
      }
    } catch (error) {
      devWarn('Create product error:', error);
      throw new Error(error.message || 'Failed to create product');
    }
  }

  // Update product
  async updateProduct(productId: string, updates: UpdateProductRequest): Promise<Product> {
    try {
      const data = await apiClient.put<Product>(`merchant/products/${productId}`, updates);

      // Week-4: Guard the product response.
      if (data.success && data.data) {
        if (!isProductResponse(data.data)) {
          devWarn('Malformed product response from backend, falling back to raw data');
        }
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update product');
      }
    } catch (error) {
      devWarn('Update product error:', error);
      throw new Error(error.message || 'Failed to update product');
    }
  }

  // Delete product
  async deleteProduct(productId: string): Promise<void> {
    try {
      devLog('🗑️ Deleting product:', productId);

      const data = await apiClient.delete(`merchant/products/${productId}`);

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete product');
      }

      devLog('✅ Product deleted successfully:', productId);
    } catch (error) {
      devWarn('❌ Delete product error:', error);
      throw new Error(error.message || 'Failed to delete product');
    }
  }

  // MA-GAP-161: Typed category normalization — no as any casts
  private normalizeCategory(cat: unknown): { label: string; value: string; id?: string } {
    if (typeof cat === 'string') return { label: cat, value: cat };
    const c = cat as Record<string, unknown>;
    return {
      label: String(c.name || c.label || ''),
      value: String(c.slug || c.value || c.name || ''),
      id: c._id || c.id ? String(c._id || c.id) : undefined,
    };
  }

  // MA-GAP-157: Throw on API failure so the UI can display an error state
  async getCategories(): Promise<Array<{ label: string; value: string; id?: string }>> {
    try {
      const response = await apiClient.get('merchant/products/categories');

      if (response.success && response.data) {
        const categories = Array.isArray(response.data)
          ? response.data
          : Array.isArray((response.data as Record<string, unknown>).categories)
            ? ((response.data as Record<string, unknown>).categories as unknown[])
            : [];
        return (categories as unknown[]).map((cat) => this.normalizeCategory(cat));
      }
      throw new Error(response.message || 'Failed to load categories');
    } catch (error) {
      logger.error('getCategories failed', { error });
      throw error;
    }
  }

  // MA-GAP-157: Throw on API failure so the UI can display an error state
  async getSubcategories(
    parentCategoryId: string
  ): Promise<Array<{ label: string; value: string; id?: string }>> {
    try {
      const response = await apiClient.get(`merchant/categories?parent=${parentCategoryId}`);

      if (response.success && response.data) {
        const subcategories = Array.isArray(response.data) ? response.data : [];
        return (subcategories as unknown[]).map((cat) => this.normalizeCategory(cat));
      }
      throw new Error(response.message || 'Failed to load subcategories');
    } catch (error) {
      logger.error('getSubcategories failed', { error });
      throw error;
    }
  }

  // MA-GAP-158: Add Idempotency-Key header to prevent duplicate bulk operations on retry
  async bulkProductAction(
    bulkAction: BulkProductAction
  ): Promise<{ successful: number; failed: number; errors: unknown[] }> {
    try {
      // IDEMPOTENCY FIX: uuidv4() replaces Date.now() for collision-safe idempotency.
      const idempotencyKey = `bulk-product-${uuidv4()}`;
      const data = await apiClient.post<{ successful: number; failed: number; errors: unknown[] }>(
        'merchant/products/bulk-action',
        bulkAction,
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );
      if (data.success && data.data) {
        return data.data;
      }
      throw new Error(data.message || 'Failed to perform bulk product action');
    } catch (error) {
      devWarn('Bulk product action error:', error);
      throw new Error(error.message || 'Failed to perform bulk product action');
    }
  }

  // Export products
  async exportProducts(
    filters?: ProductFilters,
    format: 'csv' | 'excel' = 'csv'
  ): Promise<{ url: string; filename: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const params = new URLSearchParams();
      params.append('format', format);

      if (filters) {
        if (filters.category) params.append('category', filters.category);
        if (filters.status) params.append('status', filters.status);
      }

      // Updated to point to the correct bulk export endpoint
      const response = await fetch(buildApiUrl(`merchant/bulk/products/export?${params}`), {
        method: 'GET', // Changed to GET as per backend route
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await this.getAuthToken()}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        this.invalidateTokenCache();
        throw new Error('Unauthorized - please log in again');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // The backend returns the file directly as a download
      // We need to handle the blob response
      const blob = await response.blob();
      if (Platform.OS !== 'web') {
        throw new Error('Export is only available on web');
      }
      const url = window.URL.createObjectURL(blob);
      const filename = `products-export-${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;

      return { url, filename };
    } catch (error) {
      clearTimeout(timeoutId);
      devWarn('Export products error:', error);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }

      throw new Error(error.message || 'Failed to export products');
    }
  }

  async importProducts(formData: FormData): Promise<{
    successful: number;
    failed: number;
    totalProcessed: number;
    errors: Array<{ line: number; field: string; message: string }>;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout for large files

    try {
      const response = await fetch(buildApiUrl('merchant/bulk/products/import'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await this.getAuthToken()}`,
          // Do NOT set Content-Type — browser sets multipart/form-data boundary automatically
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        this.invalidateTokenCache();
        throw new Error('Unauthorized - please log in again');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data ?? data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(
          'Import timed out — the file may be too large. Try splitting it into smaller batches.'
        );
      }
      throw new Error(error.message || 'Failed to import products');
    }
  }

  // Get product status options
  getProductStatusOptions(): Array<{ label: string; value: string; color: string }> {
    return [
      { label: 'Active', value: 'active', color: '#10b981' },
      { label: 'Inactive', value: 'inactive', color: '#f59e0b' },
    ];
  }

  // Get products by category
  async getProductsByCategory(category: string, limit: number = 20): Promise<Product[]> {
    try {
      const result = await this.getProducts({
        category,
        status: 'active',
        limit,
        page: 1,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      return result.products || [];
    } catch (error) {
      devWarn('Get products by category error:', error);
      return [];
    }
  }

  // Get low stock products
  async getLowStockProducts(limit: number = 20): Promise<Product[]> {
    try {
      const result = await this.getProducts({
        stockLevel: 'low_stock',
        status: 'active',
        limit,
        page: 1,
        sortBy: 'quantity',
        sortOrder: 'asc',
      });

      return result.products || [];
    } catch (error) {
      devWarn('Get low stock products error:', error);
      return [];
    }
  }

  // Toggle product active status
  async toggleProductStatus(productId: string): Promise<Product> {
    try {
      const product = await this.getProduct(productId);
      const newStatus = product.isActive ? 'inactive' : 'active';
      return await this.updateProduct(productId, {
        status: newStatus,
      });
    } catch (error) {
      throw error;
    }
  }

  // ==================== VARIANT MANAGEMENT ====================

  // Get all variants for a product
  async getProductVariants(
    productId: string
  ): Promise<import('../../types/variants').GetVariantsResponse> {
    try {
      const data = await apiClient.get<import('../../types/variants').GetVariantsResponse>(
        `merchant/products/${productId}/variants`
      );
      if (data.success && data.data) return data.data;
      throw new Error(data.message || 'Failed to get product variants');
    } catch (error) {
      devWarn('Get product variants error:', error);
      throw new Error(error.message || 'Failed to get product variants');
    }
  }

  // Get single variant
  async getVariant(
    productId: string,
    variantId: string
  ): Promise<import('../../types/variants').ProductVariant> {
    try {
      const data = await apiClient.get<import('../../types/variants').ProductVariant>(
        `merchant/products/${productId}/variants/${variantId}`
      );
      if (data.success && data.data) return data.data;
      throw new Error(data.message || 'Failed to get variant');
    } catch (error) {
      devWarn('Get variant error:', error);
      throw new Error(error.message || 'Failed to get variant');
    }
  }

  // Create new variant
  async createVariant(
    productId: string,
    variantData: import('../../types/variants').CreateVariantRequest
  ): Promise<import('../../types/variants').ProductVariant> {
    try {
      const data = await apiClient.post<import('../../types/variants').ProductVariant>(
        `merchant/products/${productId}/variants`,
        variantData
      );
      if (data.success && data.data) return data.data;
      throw new Error(data.message || 'Failed to create variant');
    } catch (error) {
      devWarn('Create variant error:', error);
      throw new Error(error.message || 'Failed to create variant');
    }
  }

  // Update variant
  async updateVariant(
    productId: string,
    variantId: string,
    updates: import('../../types/variants').UpdateVariantRequest
  ): Promise<import('../../types/variants').ProductVariant> {
    try {
      const data = await apiClient.put<import('../../types/variants').ProductVariant>(
        `merchant/products/${productId}/variants/${variantId}`,
        updates
      );
      if (data.success && data.data) return data.data;
      throw new Error(data.message || 'Failed to update variant');
    } catch (error) {
      devWarn('Update variant error:', error);
      throw new Error(error.message || 'Failed to update variant');
    }
  }

  // Delete variant
  async deleteVariant(productId: string, variantId: string): Promise<void> {
    try {
      const data = await apiClient.delete(`merchant/products/${productId}/variants/${variantId}`);
      if (!data.success) throw new Error(data.message || 'Failed to delete variant');
    } catch (error) {
      devWarn('Delete variant error:', error);
      throw new Error(error.message || 'Failed to delete variant');
    }
  }

  // Generate variant combinations from attributes
  async generateVariantCombinations(
    productId: string,
    request: import('../../types/variants').GenerateVariantsRequest
  ): Promise<import('../../types/variants').GenerateVariantsResponse> {
    try {
      const data = await apiClient.post<import('../../types/variants').GenerateVariantsResponse>(
        `merchant/products/${productId}/variants/generate`,
        request
      );
      if (data.success && data.data) return data.data;
      throw new Error(data.message || 'Failed to generate variant combinations');
    } catch (error) {
      devWarn('Generate variant combinations error:', error);
      throw new Error(error.message || 'Failed to generate variant combinations');
    }
  }

  // ==================== BULK IMPORT/EXPORT METHODS ====================

  // Bulk import products from CSV/Excel file
  async bulkImportProducts(
    request: import('../../types/variants').BulkImportRequest
  ): Promise<import('../../types/variants').BulkImportResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const formData = new FormData();

      // Handle file differently based on platform
      if ('uri' in request.file) {
        // React Native file
        formData.append('file', {
          uri: request.file.uri,
          name: request.file.name,
          type: request.file.type,
        } as unknown);
      } else {
        // Web File object
        formData.append('file', request.file);
      }

      formData.append('format', request.format);

      if (request.options) {
        formData.append('options', JSON.stringify(request.options));
      }

      const response = await fetch(buildApiUrl('merchant/bulk/products/import'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await this.getAuthToken()}`,
          // Don't set Content-Type, let browser/RN set it with boundary
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        this.invalidateTokenCache();
        throw new Error('Unauthorized - please log in again');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to start bulk import');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      devWarn('Bulk import error:', error);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }

      throw new Error(error.message || 'Failed to import products');
    }
  }

  // Export products with optional filters and format (enhanced version)
  async exportProductsAdvanced(
    config: import('../../types/variants').ExportConfig
  ): Promise<import('../../types/variants').ExportProductsResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(buildApiUrl('merchant/bulk/products/export/advanced'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(config),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        this.invalidateTokenCache();
        throw new Error('Unauthorized - please log in again');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle blob download
      const blob = await response.blob();
      if (Platform.OS !== 'web') {
        throw new Error('Export is only available on web');
      }
      const url = window.URL.createObjectURL(blob);
      const filename = `products-advanced-export-${Date.now()}.${config.format === 'excel' ? 'xlsx' : 'csv'}`;

      return {
        url,
        fileName: filename,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour expiry mock
        recordCount: 0, // Unknown count from blob response
      };
    } catch (error) {
      clearTimeout(timeoutId);
      devWarn('Export products advanced error:', error);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }

      throw new Error(error.message || 'Failed to export products');
    }
  }

  // Bulk update multiple products
  async bulkUpdateProducts(
    request: import('../../types/variants').BulkUpdateProductsRequest
  ): Promise<import('../../types/variants').BulkUpdateProductsResponse> {
    try {
      const data = await apiClient.post<import('../../types/variants').BulkUpdateProductsResponse>(
        'merchant/bulk/products/bulk-update',
        request
      );
      if (data.success && data.data) return data.data;
      throw new Error(data.message || 'Failed to bulk update products');
    } catch (error) {
      devWarn('Bulk update products error:', error);
      throw new Error(error.message || 'Failed to bulk update products');
    }
  }

  // Download import template
  async downloadImportTemplate(
    format: 'csv' | 'excel' = 'csv'
  ): Promise<{ url: string; filename: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(
        buildApiUrl(`merchant/bulk/products/template?format=${format}`),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this.getAuthToken()}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.status === 401) {
        this.invalidateTokenCache();
        throw new Error('Unauthorized - please log in again');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle blob download
      const blob = await response.blob();
      if (Platform.OS !== 'web') {
        throw new Error('Template download is only available on web');
      }
      const url = window.URL.createObjectURL(blob);
      const filename = `product-import-template.${format === 'excel' ? 'xlsx' : 'csv'}`;

      return { url, filename };
    } catch (error) {
      clearTimeout(timeoutId);
      devWarn('Download template error:', error);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }

      throw new Error(error.message || 'Failed to download template');
    }
  }

  // ==================== SKU VALIDATION ====================

  /**
   * Validate if SKU is unique (not already used by another product)
   * @param sku - The SKU to validate
   * @param excludeProductId - Optional product ID to exclude (for edit mode)
   * @returns Object with isAvailable boolean and optional suggestion
   */
  async validateSku(
    sku: string,
    excludeProductId?: string
  ): Promise<{
    isAvailable: boolean;
    message?: string;
    suggestion?: string;
  }> {
    if (!sku || !sku.trim()) {
      return {
        isAvailable: false,
        message: 'SKU is required',
      };
    }

    try {
      const params = new URLSearchParams();
      params.append('sku', sku.trim());
      if (excludeProductId) params.append('excludeProductId', excludeProductId);

      const data = await apiClient.get<{
        isUnique?: boolean;
        isAvailable?: boolean;
        message?: string;
        suggestion?: string;
      }>(`merchant/products/validate-sku?${params}`);

      if (data.success) {
        return {
          isAvailable: data.data?.isUnique ?? data.data?.isAvailable ?? true,
          message: data.data?.message,
          suggestion: data.data?.suggestion,
        };
      } else {
        throw new Error(data.message || 'Failed to validate SKU');
      }
    } catch (error) {
      // If network error or endpoint not available, use fallback
      devWarn('SKU validation error, using fallback:', error.message);
      return await this.validateSkuFallback(sku, excludeProductId);
    }
  }

  /**
   * Fallback SKU validation by searching existing products
   * Used when backend endpoint is not available
   */
  private async validateSkuFallback(
    sku: string,
    excludeProductId?: string
  ): Promise<{
    isAvailable: boolean;
    message?: string;
    suggestion?: string;
  }> {
    try {
      // Search for products with this SKU
      const response = await this.getProducts({
        query: sku,
        page: 1,
        limit: 10,
      });

      // Check if any product has exact SKU match
      const existingProduct = response.products.find(
        (p) => p.sku?.toUpperCase() === sku.toUpperCase() && p.id !== excludeProductId
      );

      if (existingProduct) {
        // Generate a unique suggestion
        const timestamp = Date.now().toString().slice(-4);
        const suggestion = `${sku}-${timestamp}`;

        return {
          isAvailable: false,
          message: `SKU "${sku}" is already used by product "${existingProduct.name}"`,
          suggestion,
        };
      }

      return {
        isAvailable: true,
        message: 'SKU is available',
      };
    } catch (error) {
      devWarn('SKU fallback validation error:', error);
      // If we can't validate, assume it's available to avoid blocking
      return {
        isAvailable: true,
        message: 'Could not validate SKU uniqueness',
      };
    }
  }

  // ==================== 86-ITEM TRACKING (FEAT-16) ====================

  /**
   * Mark a product as 86'd (unavailable until 6am tomorrow)
   * @param productId - The product ID to mark as 86'd
   */
  async mark86Item(productId: string): Promise<Product> {
    const data = await apiClient.post<Product>(`merchant/products/${productId}/86`);

    if (!data.success || !data.data) {
      throw new Error(data.message || 'Failed to mark item as unavailable');
    }

    return data.data;
  }

  /**
   * Restore a product from 86'd status
   * @param productId - The product ID to restore
   */
  async restore86Item(productId: string): Promise<Product> {
    const data = await apiClient.delete<Product>(`merchant/products/${productId}/86`);

    if (!data.success || !data.data) {
      throw new Error(data.message || 'Failed to restore item');
    }

    return data.data;
  }

  /** Clear the token cache — called when a raw fetch receives a 401 so that
   *  the next getAuthToken() call forces a fresh read from storage (giving the
   *  axios interceptor's token-refresh logic a chance to write a new value). */
  private invalidateTokenCache(): void {
    this.tokenCache = null;
  }

  private async getAuthToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }

    // Fetch fresh token from storage
    const token = await storageService.getAuthToken();
    if (!token) {
      throw new Error('No auth token found');
    }

    // Cache the token for 5 minutes
    this.tokenCache = {
      token,
      expiresAt: Date.now() + this.TOKEN_CACHE_DURATION,
    };

    return token;
  }
}

export const productsService = new ProductsService();
