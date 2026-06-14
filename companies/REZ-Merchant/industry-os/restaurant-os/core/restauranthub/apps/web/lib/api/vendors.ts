import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface Vendor {
  id: string;
  name: string;
  description: string;
  category: string[];
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  images: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isVerified: boolean;
  businessLicense: string;
  taxId: string;
  servicesOffered: string[];
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  paymentMethods: string[];
  deliveryAreas: string[];
  minimumOrder?: number;
  deliveryFee?: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  sku: string;
  price: number;
  unit: string;
  minimumOrder: number;
  stockQuantity: number;
  images: string[];
  specifications: Record<string, string>;
  tags: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  rating: number;
  reviewCount: number;
  vendor: {
    id: string;
    name: string;
    rating: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorRequest {
  name: string;
  description: string;
  category: string[];
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  businessLicense: string;
  taxId: string;
  servicesOffered: string[];
  operatingHours: Vendor['operatingHours'];
  paymentMethods: string[];
  deliveryAreas: string[];
  minimumOrder?: number;
  deliveryFee?: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  sku: string;
  price: number;
  unit: string;
  minimumOrder: number;
  stockQuantity: number;
  specifications: Record<string, string>;
  tags: string[];
}

export interface VendorFilters {
  category?: string[];
  city?: string;
  state?: string;
  rating?: number;
  isVerified?: boolean;
  servicesOffered?: string[];
  sortBy?: 'rating' | 'name' | 'distance';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductFilters {
  category?: string[];
  subcategory?: string[];
  priceMin?: number;
  priceMax?: number;
  vendorId?: string;
  inStock?: boolean;
  rating?: number;
  tags?: string[];
  sortBy?: 'price' | 'rating' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface VendorAnalytics {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  rating: number;
  reviewCount: number;
  topProducts: Array<{
    productId: string;
    name: string;
    orderCount: number;
    revenue: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  ordersByCategory: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
}

class VendorsApi {
  async getVendors(
    filters?: VendorFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Vendor>> {
    const params = { ...filters, page, limit };
    return apiClient.getPaginated<Vendor>('/vendors', params);
  }

  async getVendor(id: string): Promise<ApiResponse<Vendor>> {
    return apiClient.get<Vendor>(`/vendors/${id}`);
  }

  async createVendor(data: CreateVendorRequest): Promise<ApiResponse<Vendor>> {
    return apiClient.post<Vendor>('/vendors', data);
  }

  async updateVendor(id: string, data: Partial<CreateVendorRequest>): Promise<ApiResponse<Vendor>> {
    return apiClient.put<Vendor>(`/vendors/${id}`, data);
  }

  async deleteVendor(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/vendors/${id}`);
  }

  async searchVendors(query: string, filters?: VendorFilters): Promise<ApiResponse<Vendor[]>> {
    return apiClient.search<Vendor>('/vendors/search', query, filters);
  }

  async getVendorAnalytics(id: string, period?: '30d' | '90d' | '1y'): Promise<ApiResponse<VendorAnalytics>> {
    const params = period ? { period } : {};
    return apiClient.get<VendorAnalytics>(`/vendors/${id}/analytics`, { params });
  }

  async verifyVendor(id: string, documents: File[]): Promise<ApiResponse<void>> {
    const formData = new FormData();
    documents.forEach((doc, index) => {
      formData.append(`document_${index}`, doc);
    });

    const response = await apiClient.post(`/vendors/${id}/verify`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async suspendVendor(id: string, reason: string): Promise<ApiResponse<Vendor>> {
    return apiClient.put<Vendor>(`/vendors/${id}/suspend`, { reason });
  }

  async unsuspendVendor(id: string): Promise<ApiResponse<Vendor>> {
    return apiClient.put<Vendor>(`/vendors/${id}/unsuspend`);
  }

  // Product management methods
  async getProducts(
    filters?: ProductFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Product>> {
    const params = { ...filters, page, limit };
    return apiClient.getPaginated<Product>('/products', params);
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(`/products/${id}`);
  }

  async getVendorProducts(
    vendorId: string,
    filters?: ProductFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Product>> {
    const params = { ...filters, page, limit };
    return apiClient.getPaginated<Product>(`/vendors/${vendorId}/products`, params);
  }

  async createProduct(vendorId: string, data: CreateProductRequest): Promise<ApiResponse<Product>> {
    return apiClient.post<Product>(`/vendors/${vendorId}/products`, data);
  }

  async updateProduct(productId: string, data: Partial<CreateProductRequest>): Promise<ApiResponse<Product>> {
    return apiClient.put<Product>(`/products/${productId}`, data);
  }

  async deleteProduct(productId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/products/${productId}`);
  }

  async searchProducts(query: string, filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
    return apiClient.search<Product>('/products/search', query, filters);
  }

  async updateProductStock(productId: string, quantity: number): Promise<ApiResponse<Product>> {
    return apiClient.patch<Product>(`/products/${productId}/stock`, { quantity });
  }

  async bulkUpdateProducts(updates: Array<{
    productId: string;
    price?: number;
    stockQuantity?: number;
    status?: Product['status'];
  }>): Promise<ApiResponse<Product[]>> {
    return apiClient.patch<Product[]>('/products/bulk-update', { updates });
  }

  async uploadProductImages(productId: string, images: File[]): Promise<ApiResponse<string[]>> {
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append(`image_${index}`, image);
    });

    const response = await apiClient.post(`/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async uploadVendorLogo(vendorId: string, logo: File): Promise<ApiResponse<{ logo: string }>> {
    const formData = new FormData();
    formData.append('logo', logo);

    const response = await apiClient.post(`/vendors/${vendorId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async getProductCategories(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/products/categories');
  }

  async getVendorCategories(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/vendors/categories');
  }

  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<unknown>> {
    return apiClient.getPaginated<unknown>(`/products/${productId}/reviews`, { page, limit });
  }

  async getVendorReviews(
    vendorId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<unknown>> {
    return apiClient.getPaginated<unknown>(`/vendors/${vendorId}/reviews`, { page, limit });
  }

  async addProductToWishlist(productId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/products/${productId}/wishlist`);
  }

  async removeProductFromWishlist(productId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/products/${productId}/wishlist`);
  }

  async getWishlist(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Product>> {
    return apiClient.getPaginated<Product>('/users/wishlist', { page, limit });
  }

  async compareProducts(productIds: string[]): Promise<ApiResponse<Product[]>> {
    return apiClient.post<Product[]>('/products/compare', { productIds });
  }

  async reportVendor(vendorId: string, reason: string, details?: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/vendors/${vendorId}/report`, { reason, details });
  }

  async reportProduct(productId: string, reason: string, details?: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/products/${productId}/report`, { reason, details });
  }

  async getNearbyVendors(
    latitude: number,
    longitude: number,
    radius: number = 25
  ): Promise<ApiResponse<Vendor[]>> {
    const params = { lat: latitude, lng: longitude, radius };
    return apiClient.get<Vendor[]>('/vendors/nearby', { params });
  }
}

export const vendorsApi = new VendorsApi();