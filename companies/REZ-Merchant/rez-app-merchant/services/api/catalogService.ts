/**
 * Catalog Service - Real catalog service integration
 *
 * Connects to: https://rez-catalog-service.onrender.com
 *
 * Features:
 * - Product CRUD operations
 * - Category management
 * - Cloudinary image upload
 * - Inventory tracking
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { storageService } from '../storage';
import { logger } from '@/utils/logger';
import { devLog, devWarn } from '@/utils/devLog';

// Catalog service base URL
const CATALOG_SERVICE_BASE_URL =
  process.env.EXPO_PUBLIC_CATALOG_SERVICE_URL ||
  (__DEV__ ? 'https://rez-catalog-service.onrender.com' : 'https://rez-catalog-service.onrender.com');

// Request timeout
const REQUEST_TIMEOUT = 30000; // 30 seconds

// ==================== Types ====================

export interface CatalogProduct {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images?: Array<{
    url: string;
    thumbnailUrl?: string;
    altText?: string;
    sortOrder?: number;
    isMain?: boolean;
  }>;
  category?: string;
  subcategory?: string;
  tags?: string[];
  sku?: string;
  barcode?: string;
  stock: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorders?: boolean;
  merchantId?: string;
  storeId?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: 'cm' | 'inch';
  };
  variants?: unknown[];
  addOns?: unknown[];
  preparationTime?: number;
  taxRate?: number;
  discount?: number;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CatalogCategory {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  slug?: string;
  parentCategory?: string;
  isActive?: boolean;
  productCount?: number;
  sortOrder?: number;
  subcategories?: CatalogCategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images?: CatalogProduct['images'];
  category?: string;
  subcategory?: string;
  tags?: string[];
  sku?: string;
  barcode?: string;
  stock?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorders?: boolean;
  merchantId: string;
  storeId?: string;
  weight?: number;
  dimensions?: CatalogProduct['dimensions'];
  taxRate?: number;
  status?: 'active' | 'inactive' | 'draft' | 'archived';
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  images?: CatalogProduct['images'];
  category?: string;
  subcategory?: string;
  tags?: string[];
  sku?: string;
  barcode?: string;
  stock?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorders?: boolean;
  merchantId?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  weight?: number;
  dimensions?: CatalogProduct['dimensions'];
  taxRate?: number;
  discount?: number;
  sortOrder?: number;
}

export interface ProductListResponse {
  products: CatalogProduct[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CategoryListResponse {
  categories: CatalogCategory[];
  totalCount: number;
}

export interface InventoryUpdate {
  stock: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorders?: boolean;
}

export interface UploadedImage {
  url: string;
  publicId?: string;
  secureUrl?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

// Cloudinary response types
interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  [key: string];
}

// ==================== Retry Configuration ====================

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// ==================== Catalog Service ====================

class CatalogService {
  private axiosInstance: AxiosInstance;
  private tokenCache: { token: string; expiresAt: number } | null = null;
  private readonly TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: CATALOG_SERVICE_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, clear cache
          this.tokenCache = null;
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get auth token with caching
   */
  private async getAuthToken(): Promise<string | null> {
    // Check cache
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }

    try {
      const token = await storageService.getAuthToken();
      if (token) {
        this.tokenCache = {
          token,
          expiresAt: Date.now() + this.TOKEN_CACHE_DURATION,
        };
      }
      return token;
    } catch {
      return null;
    }
  }

  // ==================== Retry Logic ====================

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number, baseDelay: number): number {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), this.retryConfig.maxDelay);
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error): boolean {
    if (axios.isAxiosError(error)) {
      // Network errors are retryable
      if (!error.response) {
        return true;
      }
      // Check status codes
      if (this.retryConfig.retryableStatuses.includes(error.response.status)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Execute a function with retry logic
   * @param fn - The async function to execute
   * @param operationName - Name for logging purposes
   * @param retryConfig - Optional custom retry config
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    operationName: string,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...retryConfig };
    let lastError;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry on last attempt
        if (attempt === config.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          devWarn(`[CatalogService] ${operationName}: Non-retryable error, failing immediately`);
          throw error;
        }

        // Calculate and wait for backoff
        const delay = this.calculateBackoff(attempt, config.baseDelay);
        devLog(`[CatalogService] ${operationName}: Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Set custom retry configuration
   */
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  // ==================== Products API ====================

  /**
   * Get products for a merchant
   * GET /products/merchant/:merchantId
   * With automatic retry on failure
   */
  async getProducts(
    merchantId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      status?: string;
    }
  ): Promise<ProductListResponse> {
    return this.withRetry(async () => {
      const params: Record<string, string | number> = {
        page: options?.page || 1,
        limit: Math.min(options?.limit || 20, 100),
      };

      if (options?.search) params.search = options.search;
      if (options?.category) params.category = options.category;
      if (options?.status) params.status = options.status;

      const response = await this.axiosInstance.get<{
        success: boolean;
        data: {
          products: CatalogProduct[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        };
      }>(`/products/merchant/${merchantId}`, { params });

      if (!response.data.success) {
        throw new Error('Failed to fetch products');
      }

      const { products, pagination } = response.data.data;
      return {
        products: products || [],
        totalCount: pagination?.total || products?.length || 0,
        page: pagination?.page || 1,
        limit: pagination?.limit || 20,
        totalPages: pagination?.totalPages || 1,
      };
    }, 'getProducts');
  }

  /**
   * Get single product by ID
   * GET /products/detail/:id
   * With automatic retry on failure
   */
  async getProduct(productId: string): Promise<CatalogProduct> {
    return this.withRetry(async () => {
      const response = await this.axiosInstance.get<{
        success: boolean;
        data: CatalogProduct;
      }>(`/products/detail/${productId}`);

      if (!response.data.success) {
        throw new Error('Failed to fetch product');
      }

      return response.data.data;
    }, 'getProduct');
  }

  /**
   * Create a new product
   * POST /products
   * With automatic retry on failure
   */
  async createProduct(product: CreateProductRequest): Promise<CatalogProduct> {
    return this.withRetry(async () => {
      devLog('[CatalogService] Creating product:', product.name);

      const response = await this.axiosInstance.post<{
        success: boolean;
        productId: string;
        product: CatalogProduct;
      }>('/products', product);

      if (!response.data.success) {
        throw new Error('Failed to create product');
      }

      devLog('[CatalogService] Product created:', response.data.productId);
      return response.data.product;
    }, 'createProduct');
  }

  /**
   * Update a product
   * PATCH /products/:id
   * With automatic retry on failure
   */
  async updateProduct(
    productId: string,
    updates: UpdateProductRequest
  ): Promise<CatalogProduct> {
    return this.withRetry(async () => {
      devLog('[CatalogService] Updating product:', productId);

      const response = await this.axiosInstance.patch<{
        success: boolean;
        data: CatalogProduct;
      }>(`/products/${productId}`, updates);

      if (!response.data.success) {
        throw new Error('Failed to update product');
      }

      devLog('[CatalogService] Product updated:', productId);
      return response.data.data;
    }, 'updateProduct');
  }

  /**
   * Delete (soft) a product
   * DELETE /products/:id
   * With automatic retry on failure
   */
  async deleteProduct(productId: string, merchantId: string): Promise<void> {
    return this.withRetry(async () => {
      devLog('[CatalogService] Deleting product:', productId);

      const response = await this.axiosInstance.delete<{
        success: boolean;
        message: string;
      }>(`/products/${productId}`, {
        params: { merchantId },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete product');
      }

      devLog('[CatalogService] Product deleted:', productId);
    }, 'deleteProduct');
  }

  // ==================== Categories API ====================

  /**
   * Get all categories
   * GET /categories
   * With automatic retry on failure
   */
  async getCategories(): Promise<CategoryListResponse> {
    return this.withRetry(async () => {
      const response = await this.axiosInstance.get<{
        success: boolean;
        data: {
          categories: CatalogCategory[];
        };
      }>('/categories');

      if (!response.data.success) {
        throw new Error('Failed to fetch categories');
      }

      const categories = response.data.data?.categories || [];
      return {
        categories,
        totalCount: categories.length,
      };
    }, 'getCategories');
  }

  /**
   * Get products by category
   * GET /categories/:categoryId/products
   * With automatic retry on failure
   */
  async getProductsByCategory(
    categoryId: string,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<ProductListResponse> {
    return this.withRetry(async () => {
      const params: Record<string, string | number> = {
        page: options?.page || 1,
        limit: Math.min(options?.limit || 20, 100),
      };

      const response = await this.axiosInstance.get<{
        success: boolean;
        data: {
          products: CatalogProduct[];
          category: CatalogCategory;
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        };
      }>(`/categories/${categoryId}/products`, { params });

      if (!response.data.success) {
        throw new Error('Failed to fetch products by category');
      }

      const { products, pagination } = response.data.data;
      return {
        products: products || [],
        totalCount: pagination?.total || products?.length || 0,
        page: pagination?.page || 1,
        limit: pagination?.limit || 20,
        totalPages: pagination?.totalPages || 1,
      };
    }, 'getProductsByCategory');
  }

  // ==================== Inventory API ====================

  /**
   * Update product inventory
   * PATCH /products/:id (inventory fields)
   * With automatic retry on failure
   */
  async updateInventory(
    productId: string,
    inventory: InventoryUpdate,
    merchantId: string
  ): Promise<CatalogProduct> {
    return this.withRetry(async () => {
      devLog('[CatalogService] Updating inventory for product:', productId, inventory);

      const response = await this.axiosInstance.patch<{
        success: boolean;
        data: CatalogProduct;
      }>(`/products/${productId}`, {
        ...inventory,
        merchantId,
      });

      if (!response.data.success) {
        throw new Error('Failed to update inventory');
      }

      devLog('[CatalogService] Inventory updated:', productId);
      return response.data.data;
    }, 'updateInventory');
  }

  /**
   * Get low stock products for a merchant
   * With automatic retry on failure
   */
  async getLowStockProducts(
    merchantId: string,
    threshold: number = 10
  ): Promise<CatalogProduct[]> {
    return this.withRetry(async () => {
      const { products } = await this.getProducts(merchantId, { limit: 200 });

      // Filter for low stock on client side (could be server-side with proper API)
      return products.filter(
        (p) => p.stock > 0 && p.stock <= (p.lowStockThreshold || threshold)
      );
    }, 'getLowStockProducts');
  }

  /**
   * Get out of stock products
   * With automatic retry on failure
   */
  async getOutOfStockProducts(merchantId: string): Promise<CatalogProduct[]> {
    return this.withRetry(async () => {
      const { products } = await this.getProducts(merchantId, { limit: 200 });
      return products.filter((p) => p.stock === 0);
    }, 'getOutOfStockProducts');
  }

  // ==================== Image Upload (Cloudinary) ====================

  /**
   * Get Cloudinary upload signature from backend
   */
  private async getCloudinarySignature(params: {
    folder: string;
    publicId?: string;
  }): Promise<{
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
  }> {
    const token = await this.getAuthToken();

    const response = await this.axiosInstance.post<{
      success: boolean;
      data: {
        signature: string;
        timestamp: number;
        apiKey: string;
        cloudName: string;
        folder: string;
      };
    }>('/uploads/cloudinary-signature', params, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.success) {
      throw new Error('Failed to get Cloudinary signature');
    }

    return response.data.data;
  }

  /**
   * Upload image to Cloudinary
   *
   * @param imageUri - Local URI of the image
   * @param options - Upload options
   * @returns Uploaded image data
   */
  async uploadImage(
    imageUri: string,
    options?: {
      folder?: string;
      publicId?: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<UploadedImage> {
    try {
      devLog('[CatalogService] Uploading image to Cloudinary');

      // For React Native, we need to use the uploads service via the main API
      // This routes through the existing uploadsService
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Create form data
      const formData = new FormData();

      // Add the image file
      const filename = `product_${Date.now()}.jpg`;
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: filename,
      } as unknown);

      if (options?.folder) {
        formData.append('folder', options.folder);
      }
      if (options?.publicId) {
        formData.append('publicId', options.publicId);
      }

      const response = await axios.post<{
        success: boolean;
        data: {
          url: string;
          publicId?: string;
          secureUrl?: string;
          format?: string;
          width?: number;
          height?: number;
          bytes?: number;
        };
      }>(
        `${CATALOG_SERVICE_BASE_URL}/uploads/cloudinary`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          timeout: 60000, // 60 seconds for image upload
          onUploadProgress: (progressEvent) => {
            if (options?.onProgress && progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              options.onProgress(progress);
            }
          },
        }
      );

      if (!response.data.success) {
        throw new Error('Failed to upload image');
      }

      const { data } = response.data;
      return {
        url: data.secureUrl || data.url,
        publicId: data.publicId,
        secureUrl: data.secureUrl,
        format: data.format,
        width: data.width,
        height: data.height,
        bytes: data.bytes,
      };
    } catch (error) {
      devWarn('[CatalogService] uploadImage error:', error);

      // Fallback: try direct Cloudinary upload if backend doesn't support it
      return this.uploadImageDirect(imageUri, options);
    }
  }

  /**
   * Direct Cloudinary upload (fallback when backend signature not available)
   */
  private async uploadImageDirect(
    imageUri: string,
    options?: {
      folder?: string;
      publicId?: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<UploadedImage> {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration missing');
    }

    try {
      // For direct unsigned upload, we need the image as base64
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `product_${Date.now()}.jpg`,
      } as unknown);
      formData.append('upload_preset', 'ml_default'); // You'll need to configure this
      if (options?.folder) {
        formData.append('folder', `rez-merchant/${options.folder}`);
      }

      const response = await axios.post<CloudinaryUploadResponse>(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (options?.onProgress && progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              options.onProgress(progress);
            }
          },
        }
      );

      return {
        url: response.data.secure_url,
        publicId: response.data.public_id,
        secureUrl: response.data.secure_url,
        format: response.data.format,
        width: response.data.width,
        height: response.data.height,
        bytes: response.data.bytes,
      };
    } catch (error) {
      devWarn('[CatalogService] uploadImageDirect error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Upload multiple images
   */
  async uploadImages(
    imageUris: string[],
    options?: {
      folder?: string;
      onProgress?: (progress: number, index: number) => void;
    }
  ): Promise<UploadedImage[]> {
    const results: UploadedImage[] = [];

    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      const uploaded = await this.uploadImage(uri, {
        folder: options?.folder,
        onProgress: (progress) => {
          if (options?.onProgress) {
            const overallProgress = Math.round(
              ((i + progress / 100) / imageUris.length) * 100
            );
            options.onProgress(overallProgress, i);
          }
        },
      });
      results.push(uploaded);
    }

    return results;
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      const token = await this.getAuthToken();

      const response = await this.axiosInstance.delete<{
        success: boolean;
      }>('/uploads/cloudinary', {
        data: { publicId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data.success) {
        throw new Error('Failed to delete image');
      }
    } catch (error) {
      devWarn('[CatalogService] deleteImage error:', error);
      throw this.handleError(error);
    }
  }

  // ==================== Health Check ====================

  /**
   * Check if catalog service is healthy
   */
  async healthCheck(): Promise<{ status: string; db: string }> {
    try {
      const response = await this.axiosInstance.get<{
        status: string;
        db: string;
      }>('/health');
      return response.data;
    } catch (error) {
      devWarn('[CatalogService] healthCheck error:', error);
      return { status: 'unavailable', db: 'unknown' };
    }
  }

  // ==================== Error Handling ====================

  private handleError(error): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;

      if (axiosError.response?.data?.message) {
        return new Error(axiosError.response.data.message);
      }

      if (axiosError.message) {
        return new Error(axiosError.message);
      }

      if (axiosError.code === 'ECONNABORTED') {
        return new Error('Request timeout - please try again');
      }
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('An unexpected error occurred');
  }
}

// Export singleton instance
export const catalogService = new CatalogService();
export default catalogService;
