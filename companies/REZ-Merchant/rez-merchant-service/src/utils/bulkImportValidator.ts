/**
 * Bulk import validation utilities.
 *
 * BE-MER-021 & BE-MER-022 FIX: Validates bulk product import data.
 */

export interface ProductImportItem {
  name: string;
  sku: string;
  description?: string;
  price?: number;
  stock?: number;
  images?: string[];
  category?: string;
  brand?: string;
  hsnCode?: string;
  taxRate?: number;
  cost?: number;
  unit?: string;
  reorderPoint?: number;
}

export interface BulkImportValidation {
  isValid: boolean;
  errors?: string[];
}

/**
 * Validates bulk import size constraints.
 *
 * BE-MER-036 FIX: Enforces rate limiting on bulk imports.
 */
export function validateBulkImportSize(products: ProductImportItem[], maxProducts: number = 200): BulkImportValidation {
  if (!Array.isArray(products)) {
    return { isValid: false, errors: ['products must be an array'] };
  }

  if (products.length === 0) {
    return { isValid: false, errors: ['at least one product is required'] };
  }

  if (products.length > maxProducts) {
    return { isValid: false, errors: [`cannot import more than ${maxProducts} products at once`] };
  }

  return { isValid: true };
}

/**
 * Validates individual product fields for bulk import.
 *
 * BE-MER-022 FIX: Validates field sizes and content.
 */
export function validateProductFields(product: ProductImportItem, index: number): BulkImportValidation {
  const errors: string[] = [];

  if (!product.name || typeof product.name !== 'string') {
    errors.push(`Product ${index}: name is required and must be a string`);
  } else if (product.name.length > 200) {
    errors.push(`Product ${index}: name cannot exceed 200 characters`);
  }

  if (!product.sku || typeof product.sku !== 'string') {
    errors.push(`Product ${index}: sku is required and must be a string`);
  }

  if (product.description && typeof product.description !== 'string') {
    errors.push(`Product ${index}: description must be a string if provided`);
  } else if (product.description && product.description.length > 2000) {
    errors.push(`Product ${index}: description cannot exceed 2000 characters`);
  }

  if (product.price !== undefined && product.price !== null) {
    if (typeof product.price !== 'number' || !Number.isFinite(product.price)) {
      errors.push(`Product ${index}: price must be a valid number`);
    } else if (product.price < 0) {
      errors.push(`Product ${index}: price cannot be negative`);
    }
  }

  if (product.stock !== undefined && product.stock !== null) {
    if (!Number.isInteger(product.stock) || product.stock < 0) {
      errors.push(`Product ${index}: stock must be a non-negative integer`);
    }
  }

  if (product.images) {
    if (!Array.isArray(product.images)) {
      errors.push(`Product ${index}: images must be an array`);
    } else if (product.images.length > 20) {
      errors.push(`Product ${index}: cannot have more than 20 images`);
    }
  }

  return errors.length === 0
    ? { isValid: true }
    : { isValid: false, errors };
}

/**
 * Validates for duplicate SKUs within a batch.
 *
 * BE-MER-021 FIX: Checks for SKU duplicates in the import.
 */
export function validateNoDuplicateSKUs(products: ProductImportItem[]): BulkImportValidation {
  const skus = new Set<string>();
  const duplicates: string[] = [];

  for (const product of products) {
    const sku = String(product.sku || '').trim().toUpperCase();
    if (sku && skus.has(sku)) {
      duplicates.push(sku);
    }
    skus.add(sku);
  }

  if (duplicates.length > 0) {
    return {
      isValid: false,
      errors: [`Duplicate SKUs found in import: ${[...new Set(duplicates)].join(', ')}`],
    };
  }

  return { isValid: true };
}
