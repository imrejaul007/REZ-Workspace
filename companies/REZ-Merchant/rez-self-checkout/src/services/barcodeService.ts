export interface Product {
  productId: string;
  sku: string;
  name: string;
  barcode: string;
  price: number;
  category?: string;
  imageUrl?: string;
  inStock: boolean;
}

export interface ProcessedBarcode {
  barcode: string;
  barcodeType: 'product' | 'coupon' | 'loyalty' | 'unknown';
  product?: Product;
  metadata?: Record<string, unknown>;
}

// Mock product database - in production, this would call an external product service
const MOCK_PRODUCTS: Map<string, Product> = new Map([
  [
    '8901234567890',
    {
      productId: 'PROD001',
      sku: 'SKU001',
      name: 'Organic Milk 1L',
      barcode: '8901234567890',
      price: 85.0,
      category: 'Dairy',
      inStock: true,
    },
  ],
  [
    '8901234567891',
    {
      productId: 'PROD002',
      sku: 'SKU002',
      name: 'Whole Wheat Bread',
      barcode: '8901234567891',
      price: 45.0,
      category: 'Bakery',
      inStock: true,
    },
  ],
  [
    '8901234567892',
    {
      productId: 'PROD003',
      sku: 'SKU003',
      name: 'Free Range Eggs (12 pcs)',
      barcode: '8901234567892',
      price: 120.0,
      category: 'Dairy',
      inStock: true,
    },
  ],
]);

// Barcode prefixes for different types
const BARCODE_PREFIXES = {
  coupon: ['CPN', 'CUP'],
  loyalty: ['LYL', 'REW'],
};

export class BarcodeService {
  /**
   * Process a scanned barcode
   */
  async processBarcode(barcode: string): Promise<ProcessedBarcode> {
    if (!barcode || barcode.trim().length === 0) {
      throw new Error('Invalid barcode: empty or null');
    }

    const cleanBarcode = barcode.trim();

    // Determine barcode type
    const barcodeType = this.detectBarcodeType(cleanBarcode);

    const result: ProcessedBarcode = {
      barcode: cleanBarcode,
      barcodeType,
    };

    // If it's a product barcode, fetch product details
    if (barcodeType === 'product') {
      const product = await this.getProductByBarcode(cleanBarcode);
      result.product = product;
    }

    return result;
  }

  /**
   * Detect the type of barcode based on its format
   */
  detectBarcodeType(barcode: string): 'product' | 'coupon' | 'loyalty' | 'unknown' {
    // Check for coupon prefixes
    for (const prefix of BARCODE_PREFIXES.coupon) {
      if (barcode.startsWith(prefix)) {
        return 'coupon';
      }
    }

    // Check for loyalty prefixes
    for (const prefix of BARCODE_PREFIXES.loyalty) {
      if (barcode.startsWith(prefix)) {
        return 'loyalty';
      }
    }

    // If it's all digits, it's likely a product barcode (EAN/UPC)
    if (/^\d+$/.test(barcode)) {
      // Standard product barcodes are typically 8, 12, 13, or 14 digits
      if (barcode.length >= 8 && barcode.length <= 14) {
        return 'product';
      }
    }

    return 'unknown';
  }

  /**
   * Validate a product barcode
   */
  async validateProduct(barcode: string): Promise<{ valid: boolean; reason?: string }> {
    if (!barcode || barcode.trim().length === 0) {
      return { valid: false, reason: 'Empty barcode' };
    }

    const product = await this.getProductByBarcode(barcode);

    if (!product) {
      return { valid: false, reason: 'Product not found' };
    }

    if (!product.inStock) {
      return { valid: false, reason: 'Product out of stock' };
    }

    return { valid: true };
  }

  /**
   * Get product details by barcode
   * In production, this would call the product catalog service
   */
  async getProductByBarcode(barcode: string): Promise<Product | null> {
    // First check mock database
    const mockProduct = MOCK_PRODUCTS.get(barcode);
    if (mockProduct) {
      return mockProduct;
    }

    // In production, this would be an API call like:
    // const response = await fetch(`${PRODUCT_SERVICE_URL}/products/barcode/${barcode}`);
    // return response.json();

    // For unknown barcodes, return null (could be a weight-based barcode or unrecognized product)
    return null;
  }

  /**
   * Add a product to the mock database (for testing)
   */
  addMockProduct(product: Product): void {
    MOCK_PRODUCTS.set(product.barcode, product);
  }

  /**
   * Generate a barcode for testing purposes
   */
  generateTestBarcode(index: number = 1): string {
    const baseBarcode = '890123456789';
    return baseBarcode.slice(0, -1) + index.toString().slice(-1);
  }

  /**
   * Validate barcode format
   */
  validateBarcodeFormat(barcode: string): boolean {
    if (!barcode) return false;

    // Check for valid characters (alphanumeric and common special chars)
    const validPattern = /^[A-Za-z0-9\-\.\_]+$/;
    return validPattern.test(barcode) && barcode.length >= 4 && barcode.length <= 30;
  }

  /**
   * Parse weight-based barcode (for produce items)
   */
  parseWeightBarcode(barcode: string): { productCode: string; weight: number } | null {
    // Weight barcodes typically have format: PLU + weight
    // Example: 000123400056 (0001 = PLU, 234 = weight in grams, 00056 = unknown)
    const weightBarcodePattern = /^(\d{4})(\d{3,6})(\d+)$/;
    const match = barcode.match(weightBarcodePattern);

    if (match) {
      return {
        productCode: match[1],
        weight: parseInt(match[2], 10) / 1000, // Convert to kg
      };
    }

    return null;
  }
}

export const barcodeService = new BarcodeService();
