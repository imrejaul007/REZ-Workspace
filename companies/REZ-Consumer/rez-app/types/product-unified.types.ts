// Canonical types: @rez/shared-types — migrate imports when package is published
/**
 * Unified Product Types
 *
 * This file provides standardized product interfaces that handle
 * data from multiple sources (backend API, play page, homepage, etc.)
 * and ensures consistent product data structure across the app.
 */

// ==========================================
// CORE PRODUCT INTERFACE
// ==========================================

/**
 * CANONICAL PRODUCT FORMAT for Consumer Frontend
 *
 * Pricing Format (CANONICAL):
 * - pricing.selling: discounted/current selling price
 * - pricing.original: original/Maximum Retail Price
 *
 * Images Format (CANONICAL):
 * - Array of { url: string, alt?: string, isPrimary?: boolean }
 *
 * This interface enforces the canonical format throughout the consumer app.
 */
export interface UnifiedProduct {
  // Identifiers - Support both MongoDB _id and frontend id
  id: string;
  _id?: string; // MongoDB ObjectId

  // Basic Information
  name: string;
  title?: string; // Alias for name (some components use title)
  description: string;
  category: string | ProductCategory;

  // PRICING - CANONICAL FORMAT: pricing.selling + pricing.original
  pricing: ProductPrice;

  // Legacy price field (deprecated - kept for backward compatibility during migration)
  price?: ProductPrice;

  // IMAGES - CANONICAL FORMAT: Array of { url, alt?, isPrimary? }
  images: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }>;

  // Legacy image field (deprecated)
  image?: string; // Primary image URL (for backward compatibility)

  // Ratings & Reviews
  rating?: ProductRating;

  // Inventory & Availability
  inventory?: ProductInventory;
  availabilityStatus?: AvailabilityStatus;

  // Store Information
  store?: StoreInfo;
  storeId?: string;
  merchant?: string; // Store/merchant name

  // Additional Fields
  brand?: string;
  tags?: string[];
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;

  // Cashback & Offers
  cashback?: ProductCashback;
  discount?: number; // Discount percentage

  // Metadata
  createdAt?: string;
  updatedAt?: string;

  // Product Type
  productType?: 'product' | 'service';

  // SEO & Analytics
  slug?: string;
  viewCount?: number;
  purchaseCount?: number;
}

// ==========================================
// PRICING STRUCTURE
// ==========================================

/**
 * CANONICAL PRICING FORMAT (derived from backend's pricing.selling/original)
 *
 * The backend canonical format uses:
 * - pricing.selling: discounted/current selling price
 * - pricing.original: original/Maximum Retail Price
 *
 * This interface adapts it for the consumer frontend with display properties.
 */
export interface ProductPrice {
  // Canonical backend source
  selling: number; // Discounted/current selling price
  original: number; // Maximum Retail Price (original)

  // Consumer display properties
  current?: number; // Alias for selling (for backward compatibility)
  mrp?: number; // Alias for original (for backward compatibility)

  // Formatted price strings (optional, for display)
  formatted?: string; // e.g., "₹2,999"
  originalFormatted?: string; // e.g., "₹4,999"

  // Discount information
  discount?: number; // Discount percentage (calculated: (mrp - selling) / mrp * 100)
  savings?: number; // Amount saved (mrp - selling)

  // Currency
  currency?: string; // Currency code (e.g., 'INR')
}

// ==========================================
// INVENTORY & AVAILABILITY
// ==========================================

export interface ProductInventory {
  // Stock information
  stock: number;
  isAvailable: boolean;

  // Thresholds
  lowStockThreshold?: number; // When to show "low stock" warning

  // Restock information
  estimatedRestockDate?: string;
  allowBackorder?: boolean;

  // SKU & Tracking
  sku?: string;
  barcode?: string;
}

export type AvailabilityStatus =
  | 'in_stock'
  | 'out_of_stock'
  | 'low_stock'
  | 'pre_order'
  | 'discontinued';

// ==========================================
// RATINGS & REVIEWS
// ==========================================

export interface ProductRating {
  // Rating value (0-5)
  value: number;
  average?: number; // Alias for value

  // Number of ratings/reviews
  count: number;

  // Detailed breakdown (optional)
  breakdown?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// ==========================================
// STORE INFORMATION
// ==========================================

export interface StoreInfo {
  id: string;
  _id?: string;
  name: string;
  logo?: string;
  image?: string;
  rating?: number;
  ratingCount?: number;
  location?: string;
  deliveryTime?: string;
  minimumOrder?: number;
}

// ==========================================
// CATEGORY
// ==========================================

export interface ProductCategory {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  parentId?: string;
}

// ==========================================
// CASHBACK & OFFERS
// ==========================================

export interface ProductCashback {
  percentage?: number; // e.g., 5 (for 5%)
  amount?: number; // Fixed cashback amount
  maxAmount?: number; // Maximum cashback limit
  minPurchase?: number; // Minimum purchase required
}

// ==========================================
// PRODUCT FROM VIDEO/UGC
// ==========================================

/**
 * Product as it appears in videos (play page, UGC)
 * Extended from UnifiedProduct with video-specific fields
 */
export interface VideoProduct extends UnifiedProduct {
  // Position in video
  timestamp?: number; // When product appears in video (seconds)

  // Display in video
  position?: {
    x: number;
    y: number;
  };

  // Video-specific metadata
  taggedBy?: string; // User who tagged the product
  taggedAt?: string;
}

// ==========================================
// PRODUCT CARD DATA (Navigation)
// ==========================================

/**
 * Data structure for navigating to ProductPage
 * This is what gets serialized and passed via router params
 */
export interface ProductCardData {
  cardId: string;
  cardType: 'product' | 'service' | 'just_for_you' | 'new_arrivals';
  category?: string;
  cardData: string; // JSON.stringify(UnifiedProduct)
  source?: string; // e.g., 'ugc_video', 'homepage', 'search'
}

// ==========================================
// HELPER TYPES
// ==========================================

/**
 * Product List Response (API)
 */
export interface ProductListResponse {
  success: boolean;
  data: {
    products: UnifiedProduct[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
  message?: string;
}

/**
 * Single Product Response (API)
 */
export interface ProductResponse {
  success: boolean;
  data: UnifiedProduct;
  message?: string;
}

// ==========================================
// TYPE GUARDS
// ==========================================

/**
 * Check if product is available
 */
export function isProductAvailable(product: UnifiedProduct): boolean {
  if (product.availabilityStatus) {
    return product.availabilityStatus === 'in_stock' || product.availabilityStatus === 'low_stock';
  }

  if (product.inventory) {
    return product.inventory.isAvailable && product.inventory.stock > 0;
  }

  return true; // Default to available if no inventory info
}

/**
 * Check if product is low stock
 */
export function isProductLowStock(product: UnifiedProduct): boolean {
  if (product.availabilityStatus === 'low_stock') {
    return true;
  }

  if (product.inventory) {
    const threshold = product.inventory.lowStockThreshold || 5;
    return product.inventory.stock > 0 && product.inventory.stock <= threshold;
  }

  return false;
}

/**
 * Get product discount percentage
 */
export function getProductDiscount(product: UnifiedProduct): number {
  if (product.discount) {
    return product.discount;
  }

  if (product.price?.discount) {
    return product.price.discount;
  }

  // REGRESSION FIX: Guard against undefined current price. Previously `?? 0`
  // caused a 100% discount to display when price.current was simply missing
  // from the API response (e.g. original=100, current=undefined → 100% OFF).
  if (
    !product.price?.original ||
    typeof product.price.current !== 'number' ||
    product.price.current >= product.price.original
  ) {
    return 0;
  }

  return Math.round(((product.price.original - product.price.current) / product.price.original) * 100);
}

/**
 * Format price to INR
 */
export function formatProductPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Get normalized product ID
 * Handles both MongoDB _id and frontend id formats
 *
 * @param product - Product with either _id or id field
 * @returns The product ID as a string
 *
 * @example
 * const productId = getProductId(product); // Works with both _id and id
 */
export function getProductId(product: { _id?: string; id?: string } | UnifiedProduct): string {
  return product._id || product.id || '';
}

/**
 * Check if two products are the same
 * Compares using normalized IDs
 *
 * @param productA - First product
 * @param productB - Second product
 * @returns true if products have the same ID
 */
export function isSameProduct(
  productA: { _id?: string; id?: string },
  productB: { _id?: string; id?: string }
): boolean {
  const idA = getProductId(productA);
  const idB = getProductId(productB);
  return idA !== '' && idB !== '' && idA === idB;
}
