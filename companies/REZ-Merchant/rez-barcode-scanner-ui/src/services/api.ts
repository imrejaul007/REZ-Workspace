import {
  Product,
  Cart,
  CartItem,
  ApiResponse,
  ProductLookupResponse,
  InventoryAdjustment,
  Scan,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Product API endpoints
 */
export const productApi = {
  /**
   * Lookup product by barcode
   */
  lookupByBarcode: async (barcode: string): Promise<ProductLookupResponse> => {
    const response = await fetchApi<{ product: Product; related?: Product[] }>(
      `/products/lookup?barcode=${encodeURIComponent(barcode)}`
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.product,
        relatedProducts: response.data.related,
      };
    }

    return {
      success: false,
      error: response.error,
    };
  },

  /**
   * Get product by ID
   */
  getById: async (productId: string): Promise<ApiResponse<Product>> => {
    return fetchApi<Product>(`/products/${productId}`);
  },

  /**
   * Get product by SKU
   */
  getBySku: async (sku: string): Promise<ApiResponse<Product>> => {
    return fetchApi<Product>(`/products/sku/${encodeURIComponent(sku)}`);
  },

  /**
   * Search products
   */
  search: async (query: string, limit = 20): Promise<ApiResponse<Product[]>> => {
    return fetchApi<Product[]>(
      `/products/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  },

  /**
   * Create new product
   */
  create: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> => {
    return fetchApi<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  /**
   * Update product
   */
  update: async (productId: string, updates: Partial<Product>): Promise<ApiResponse<Product>> => {
    return fetchApi<Product>(`/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Update product stock
   */
  updateStock: async (
    productId: string,
    quantity: number
  ): Promise<ApiResponse<Product>> => {
    return fetchApi<Product>(`/products/${productId}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  /**
   * Adjust inventory
   */
  adjustInventory: async (
    adjustment: Omit<InventoryAdjustment, 'timestamp'>
  ): Promise<ApiResponse<InventoryAdjustment>> => {
    return fetchApi<InventoryAdjustment>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(adjustment),
    });
  },

  /**
   * Bulk update inventory
   */
  bulkUpdateInventory: async (
    adjustments: Omit<InventoryAdjustment, 'timestamp'>[]
  ): Promise<ApiResponse<InventoryAdjustment[]>> => {
    return fetchApi<InventoryAdjustment[]>('/inventory/bulk-adjust', {
      method: 'POST',
      body: JSON.stringify(adjustments),
    });
  },

  /**
   * Get low stock products
   */
  getLowStock: async (): Promise<ApiResponse<Product[]>> => {
    return fetchApi<Product[]>('/products/low-stock');
  },

  /**
   * Get products by category
   */
  getByCategory: async (categoryId: string): Promise<ApiResponse<Product[]>> => {
    return fetchApi<Product[]>(`/products/category/${categoryId}`);
  },
};

/**
 * Cart API endpoints
 */
export const cartApi = {
  /**
   * Get current cart
   */
  getCart: async (): Promise<ApiResponse<Cart>> => {
    return fetchApi<Cart>('/cart');
  },

  /**
   * Add item to cart
   */
  addItem: async (productId: string, quantity: number): Promise<ApiResponse<Cart>> => {
    return fetchApi<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },

  /**
   * Update cart item quantity
   */
  updateItem: async (
    productId: string,
    quantity: number
  ): Promise<ApiResponse<Cart>> => {
    return fetchApi<Cart>(`/cart/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },

  /**
   * Remove item from cart
   */
  removeItem: async (productId: string): Promise<ApiResponse<Cart>> => {
    return fetchApi<Cart>(`/cart/items/${productId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Clear cart
   */
  clearCart: async (): Promise<ApiResponse<Cart>> => {
    return fetchApi<Cart>('/cart', {
      method: 'DELETE',
    });
  },

  /**
   * Apply discount code
   */
  applyDiscount: async (code: string): Promise<ApiResponse<Cart>> => {
    return fetchApi<Cart>('/cart/discount', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  /**
   * Checkout
   */
  checkout: async (paymentMethod?: string): Promise<ApiResponse<{ orderId: string; receipt: string }>> => {
    return fetchApi<{ orderId: string; receipt: string }>('/cart/checkout', {
      method: 'POST',
      body: JSON.stringify({ paymentMethod }),
    });
  },
};

/**
 * Scan history API endpoints
 */
export const scanHistoryApi = {
  /**
   * Get scan history
   */
  getHistory: async (limit = 50): Promise<ApiResponse<Scan[]>> => {
    return fetchApi<Scan[]>(`/scans/history?limit=${limit}`);
  },

  /**
   * Save scan result
   */
  saveScan: async (scan: Omit<Scan, 'id' | 'timestamp'>): Promise<ApiResponse<Scan>> => {
    return fetchApi<Scan>('/scans', {
      method: 'POST',
      body: JSON.stringify(scan),
    });
  },

  /**
   * Clear scan history
   */
  clearHistory: async (): Promise<ApiResponse<void>> => {
    return fetchApi<void>('/scans/history', {
      method: 'DELETE',
    });
  },

  /**
   * Export scan history
   */
  exportHistory: async (format: 'csv' | 'json' = 'csv'): Promise<ApiResponse<string>> => {
    return fetchApi<string>(`/scans/export?format=${format}`);
  },
};

/**
 * Local storage helpers for offline support
 */
export const localStorage = {
  /**
   * Save cart to local storage
   */
  saveCart: (cart: Cart): void => {
    try {
      window.localStorage.setItem('rez_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  },

  /**
   * Load cart from local storage
   */
  loadCart: (): Cart | null => {
    try {
      const stored = window.localStorage.getItem('rez_cart');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      return null;
    }
  },

  /**
   * Save scan history to local storage
   */
  saveScanHistory: (scans: Scan[]): void => {
    try {
      window.localStorage.setItem('rez_scan_history', JSON.stringify(scans));
    } catch (error) {
      console.error('Failed to save scan history to localStorage:', error);
    }
  },

  /**
   * Load scan history from local storage
   */
  loadScanHistory: (): Scan[] => {
    try {
      const stored = window.localStorage.getItem('rez_scan_history');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load scan history from localStorage:', error);
      return [];
    }
  },
};

/**
 * Tax calculation helper
 */
export const calculateTax = (subtotal: number, taxRate = 0.0825): number => {
  return Math.round(subtotal * taxRate * 100) / 100;
};

/**
 * Create cart from scanned items
 */
export const createCartFromScans = (scans: Scan[], products: Map<string, Product>): Cart => {
  const items: CartItem[] = [];
  const productCounts = new Map<string, number>();

  // Count quantities
  for (const scan of scans) {
    if (scan.success && scan.barcode) {
      const count = productCounts.get(scan.barcode) || 0;
      productCounts.set(scan.barcode, count + 1);
    }
  }

  // Create cart items
  for (const [barcode, quantity] of productCounts) {
    const product = products.get(barcode);
    if (product) {
      items.push({
        product,
        quantity,
        subtotal: product.price * quantity,
      });
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = calculateTax(subtotal);

  return {
    items,
    subtotal,
    tax,
    total: subtotal + tax,
  };
};
