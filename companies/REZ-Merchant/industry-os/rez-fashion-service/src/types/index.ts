import mongoose, { Document } from 'mongoose';

// Enums
export type ProductCategory = 'tops' | 'bottoms' | 'dresses' | 'ethnic' | 'western' | 'accessories' | 'footwear';
export type Gender = 'men' | 'women' | 'unisex' | 'kids';
export type ProductStatus = 'active' | 'out_of_stock' | 'discontinued';
export type CollectionStatus = 'draft' | 'published' | 'archived';

// Base interface
export interface IBaseDocument extends Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Product interfaces
export interface IProduct extends IBaseDocument {
  productId: string;
  merchantId: string;
  name: string;
  sku: string;
  barcode?: string;
  category: ProductCategory;
  gender: Gender;
  sizes: string[];
  colors: string[];
  material?: string;
  brand?: string;
  season?: string;
  collection?: string;
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  reorderLevel: number;
  images: string[];
  description?: string;
  tags: string[];
  status: ProductStatus;
}

// Collection interfaces
export interface ICollection extends IBaseDocument {
  collectionId: string;
  merchantId: string;
  name: string;
  season: string;
  year: number;
  description?: string;
  productIds: string[];
  status: CollectionStatus;
  startDate?: Date;
  endDate?: Date;
}

// Customer Style Profile interfaces
export interface ISizePreferences {
  [size: string]: number;
}

export interface IBudgetRange {
  min: number;
  max: number;
}

export interface ICustomerStyle extends IBaseDocument {
  styleId: string;
  merchantId: string;
  customerId: string;
  bodyType?: string;
  stylePreferences: string[];
  favoriteCategories: ProductCategory[];
  sizePreferences: ISizePreferences;
  occasionPreferences: string[];
  colorPreferences: string[];
  budgetRange?: IBudgetRange;
  lastPurchase?: Date;
  styleScore?: number;
}

// Inventory Alert interfaces
export interface IInventoryAlert extends IBaseDocument {
  alertId: string;
  productId: string;
  merchantId: string;
  alertType: 'low_stock' | 'out_of_stock' | 'size_alert' | 'reorder';
  severity: 'low' | 'medium' | 'high';
  productName: string;
  currentStock: number;
  threshold: number;
  size?: string;
  color?: string;
  resolved: boolean;
  resolvedAt?: Date;
}

// Query interfaces
export interface IProductFilters {
  merchantId?: string;
  category?: ProductCategory;
  gender?: Gender;
  brand?: string;
  status?: ProductStatus;
  priceRange?: { min?: number; max?: number };
  season?: string;
  inStock?: boolean;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response interfaces
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Style Recommendation interface
export interface IStyleRecommendation {
  products: Array<{
    productId: string;
    name: string;
    category: ProductCategory;
    matchScore: number;
    reason: string;
  }>;
  styleProfile: {
    bodyType?: string;
    preferredStyles: string[];
    colorPalette: string[];
  };
}
