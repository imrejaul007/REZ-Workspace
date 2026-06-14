// @ts-nocheck
/**
 * Product Data Normalization Utilities
 *
 * This module normalizes product and store data from various sources,
 * ensuring consistent data structure across the application.
 *
 * CANONICAL FORMAT (enforced throughout):
 * - Price: pricing.selling + pricing.original (backend canonical)
 * - Images: Array<{ url: string, alt?: string, isPrimary?: boolean }>
 */

/**
 * Normalizes product price to CANONICAL FORMAT: { selling, original, discount?, currency? }
 *
 * Accepts multiple input formats and converts them to the canonical format:
 * - price.current/original → selling/original
 * - pricing.selling/original → selling/original (canonical, pass-through)
 * - pricing.mrp → original (backward compatibility)
 * - sellingPrice/mrp → selling/original (backward compatibility)
 *
 * @param product - Product object with unknown price format
 * @returns Canonical price object: { selling, original, discount?, currency? }
 *
 * @example
 * // Input: price.current/original format
 * const product = { price: { current: 100, original: 150 } };
 * const normalized = normalizeProductPrice(product);
 * // Output: { selling: 100, original: 150, discount: 34, currency: undefined }
 *
 * @example
 * // Input: canonical pricing.selling/original format
 * const product = { pricing: { selling: 100, original: 150 } };
 * const normalized = normalizeProductPrice(product);
 * // Output: { selling: 100, original: 150, discount: 34, currency: undefined }
 */
export function normalizeProductPrice(product): {
  selling: number | null;
  original: number | null;
  discount: number | null;
  currency?: string;
  current: number | null;
  mrp: number | null;
} {
  if (!product) {
    return { selling: null, original: null, discount: null, current: null, mrp: null };
  }

  let selling: number | null = null;
  let original: number | null = null;
  let currency: string | undefined;

  // Priority 1: CANONICAL FORMAT - pricing.selling and pricing.original
  if (product.pricing && typeof product.pricing === 'object') {
    selling = typeof product.pricing.selling === 'number' ? product.pricing.selling : null;
    original = typeof product.pricing.original === 'number' ? product.pricing.original : null;
    currency = product.pricing.currency;

    // Fallback to legacy pricing.mrp for backward compatibility
    if (original === null && typeof product.pricing.mrp === 'number') {
      original = product.pricing.mrp;
    }

    if (selling !== null && original !== null) {
      const discount = original > selling ? Math.round(((original - selling) / original) * 100) : null;
      return { selling, original, discount, currency, current: selling, mrp: original };
    }
  }

  // Priority 2: Legacy price.current/original format
  if (product.price && typeof product.price === 'object') {
    selling = typeof product.price.current === 'number' ? product.price.current : null;
    original = typeof product.price.original === 'number' ? product.price.original : null;

    if (selling !== null && original !== null) {
      const discount = original > selling ? Math.round(((original - selling) / original) * 100) : null;
      return { selling, original, discount, currency, current: selling, mrp: original };
    }
  }

  // Priority 3: Legacy sellingPrice/mrp direct fields
  if (typeof product.sellingPrice === 'number' || typeof product.mrp === 'number') {
    selling = typeof product.sellingPrice === 'number' ? product.sellingPrice : null;
    original = typeof product.mrp === 'number' ? product.mrp : null;

    if (selling !== null && original !== null) {
      const discount = original > selling ? Math.round(((original - selling) / original) * 100) : null;
      return { selling, original, discount, currency, current: selling, mrp: original };
    }
  }

  return { selling: null, original: null, discount: null, current: null, mrp: null };
}

/**
 * Normalizes product rating data by prioritizing rating.value over ratings.average
 *
 * @param product - Product object with potential rating/ratings fields
 * @returns Normalized rating object with value and count fields
 *
 * @example
 * const product = { rating: { value: 4.5, count: 120 } };
 * const normalized = normalizeProductRating(product);
 * // { value: 4.5, count: 120 }
 */
export function normalizeProductRating(product): {
  value: number | null;
  count: number | null;
} {
  if (!product) {
    return { value: null, count: null };
  }

  // Priority 1: rating.value and rating.count
  if (product.rating) {
    const value = typeof product.rating.value === 'number' ? product.rating.value : null;
    const count = typeof product.rating.count === 'number' ? product.rating.count : null;
    return { value, count };
  }

  // Priority 2: ratings.average and ratings.total
  if (product.ratings) {
    const value = typeof product.ratings.average === 'number' ? product.ratings.average : null;
    const count = typeof product.ratings.total === 'number' ? product.ratings.total : null;
    return { value, count };
  }

  // Priority 3: Direct rating fields (legacy support)
  const value = typeof product.ratingValue === 'number' ? product.ratingValue : null;
  const count = typeof product.ratingCount === 'number' ? product.ratingCount : null;

  return { value, count };
}

/**
 * Normalizes product ID to a consistent 'id' field
 *
 * @param product - Product object with potential _id or id fields
 * @returns Product ID as a string, or null if not found
 *
 * @example
 * const product = { _id: '12345' };
 * const id = normalizeProductId(product);
 * // '12345'
 */
export function normalizeProductId(product): string | null {
  if (!product) {
    return null;
  }

  // Priority 1: id field
  if (product.id) {
    return String(product.id);
  }

  // Priority 2: _id field (MongoDB default)
  if (product._id) {
    return String(product._id);
  }

  // Priority 3: productId field
  if (product.productId) {
    return String(product.productId);
  }

  return null;
}

/**
 * Normalizes product images to CANONICAL FORMAT: Array<{ url, alt?, isPrimary? }>
 *
 * Accepts multiple input formats and converts to canonical:
 * - images: [] (canonical)
 * - image: [] or string (legacy)
 * - imageUrl, thumbnail (legacy fallbacks)
 *
 * @param product - Product object with unknown image format
 * @returns CANONICAL images array: Array<{ url: string, alt?: string, isPrimary?: boolean }>
 *
 * @example
 * // Input: images array (canonical)
 * const product = { images: [{ url: 'img1.jpg', isPrimary: true }, { url: 'img2.jpg' }] };
 * const normalized = normalizeProductImage(product);
 * // Output: [{ url: 'img1.jpg', alt: 'Product image 1', isPrimary: true }, ...]
 *
 * @example
 * // Input: legacy string array
 * const product = { image: ['img1.jpg', 'img2.jpg'] };
 * const normalized = normalizeProductImage(product);
 * // Output: [{ url: 'img1.jpg', alt: 'Product image 1' }, ...]
 */
export function normalizeProductImage(product): Array<{ url: string; alt?: string; isPrimary?: boolean }> {
  if (!product) {
    return [];
  }

  // Priority 1: CANONICAL FORMAT - images array with objects
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images
      .map((img, index: number) => {
        if (typeof img === 'string') {
          return { url: img, alt: `${product.name || 'Product'} image ${index + 1}` };
        }
        return {
          url: img.url || img.src || '',
          alt: img.alt || `${product.name || 'Product'} image ${index + 1}`,
          isPrimary: img.isPrimary || (index === 0),
        };
      })
      .filter((img) => img.url);
  }

  // Priority 2: Legacy image array (singular)
  if (Array.isArray(product.image) && product.image.length > 0) {
    return product.image
      .map((img, index: number) => {
        if (typeof img === 'string') {
          return { url: img, alt: `${product.name || 'Product'} image ${index + 1}` };
        }
        return {
          url: img.url || img.src || '',
          alt: img.alt || `${product.name || 'Product'} image ${index + 1}`,
          isPrimary: img.isPrimary || (index === 0),
        };
      })
      .filter((img) => img.url);
  }

  // Priority 3: Single image object
  if (product.image && typeof product.image === 'object') {
    const url = product.image.url || product.image.src || '';
    if (url) {
      return [{
        url,
        alt: product.image.alt || `${product.name || 'Product'} image`,
        isPrimary: product.image.isPrimary !== false,
      }];
    }
  }

  // Priority 4: Single image string
  if (typeof product.image === 'string' && product.image) {
    return [{ url: product.image, alt: `${product.name || 'Product'} image`, isPrimary: true }];
  }

  // Priority 5: imageUrl field
  if (typeof product.imageUrl === 'string' && product.imageUrl) {
    return [{ url: product.imageUrl, alt: `${product.name || 'Product'} image`, isPrimary: true }];
  }

  // Priority 6: thumbnail field
  if (typeof product.thumbnail === 'string' && product.thumbnail) {
    return [{ url: product.thumbnail, alt: `${product.name || 'Product'} thumbnail`, isPrimary: true }];
  }

  return [];
}

/**
 * Normalizes store ID fields to a consistent format
 *
 * @param store - Store object with potential _id or storeId fields
 * @returns Store ID as a string, or null if not found
 *
 * @example
 * const store = { _id: '67890' };
 * const id = normalizeStoreId(store);
 * // '67890'
 */
export function normalizeStoreId(store): string | null {
  if (!store) {
    return null;
  }

  // Priority 1: id field
  if (store.id) {
    return String(store.id);
  }

  // Priority 2: _id field (MongoDB default)
  if (store._id) {
    return String(store._id);
  }

  // Priority 3: storeId field
  if (store.storeId) {
    return String(store.storeId);
  }

  return null;
}

/**
 * Normalizes store name fields to a consistent format
 *
 * @param store - Store object with potential name/storeName fields
 * @returns Store name as a string, or null if not found
 */
export function normalizeStoreName(store): string | null {
  if (!store) {
    return null;
  }

  return store.name || store.storeName || store.title || null;
}

/**
 * Normalizes entire product object to CANONICAL FORMAT
 *
 * Converts all pricing and image formats to canonical:
 * - pricing: { selling, mrp, discount?, currency? }
 * - images: Array<{ url, alt?, isPrimary? }>
 *
 * @param product - Raw product object from unknown source (API, database, etc.)
 * @returns Fully normalized product with canonical format
 *
 * @example
 * const rawProduct = { _id: '123', price: { current: 100, original: 150 }, images: ['url1.jpg'] };
 * const normalized = normalizeProduct(rawProduct);
 * // { id: '123', pricing: { selling: 100, mrp: 150, discount: 34 }, images: [{ url: 'url1.jpg', ... }], ... }
 */
export function normalizeProduct(product): unknown {
  if (!product) {
    return null;
  }

  const id = normalizeProductId(product);
  const pricing = normalizeProductPrice(product); // CANONICAL: selling + mrp
  const rating = normalizeProductRating(product);
  const images = normalizeProductImage(product); // CANONICAL: Array<{ url, alt?, isPrimary? }>
  const storeId = product.store ? normalizeStoreId(product.store) : (product.storeId || null);

  return {
    ...product,
    id,
    pricing, // CANONICAL pricing format
    rating,
    images, // CANONICAL images format
    storeId,
    // Keep original _id for MongoDB compatibility
    _id: product._id,
  };
}

/**
 * Normalizes an array of products
 *
 * @param products - Array of raw product objects
 * @returns Array of normalized product objects
 */
export function normalizeProducts(products: unknown[]): unknown[] {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map(normalizeProduct).filter(Boolean);
}

/**
 * Normalizes an entire store object with all fields
 *
 * @param store - Raw store object from API
 * @returns Fully normalized store object
 */
export function normalizeStore(store): unknown {
  if (!store) {
    return null;
  }

  const id = normalizeStoreId(store);
  const name = normalizeStoreName(store);
  const rating = normalizeProductRating(store); // Stores can have ratings too

  return {
    ...store,
    id,
    name,
    rating,
    // Keep original fields for backward compatibility
    _id: store._id,
  };
}

/**
 * Normalizes an array of stores
 *
 * @param stores - Array of raw store objects
 * @returns Array of normalized store objects
 */
export function normalizeStores(stores: unknown[]): unknown[] {
  if (!Array.isArray(stores)) {
    return [];
  }

  return stores.map(normalizeStore).filter(Boolean);
}
