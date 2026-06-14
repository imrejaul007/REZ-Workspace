import { SKU } from '../models/SKU';
import { Stock } from '../models/Stock';

export interface BarcodeLookupResult {
  found: boolean;
  sku?: any;
  stock?: any;
  message: string;
}

class BarcodeService {
  /**
   * Lookup a barcode and return SKU and stock information
   */
  async lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
    const sku = await SKU.findOne({ barcode });

    if (!sku) {
      return {
        found: false,
        message: `No SKU found with barcode: ${barcode}`,
      };
    }

    const stock = await Stock.findOne({ skuId: sku._id });

    return {
      found: true,
      sku: sku.toJSON(),
      stock: stock ? stock.toJSON() : null,
      message: 'SKU found',
    };
  }

  /**
   * Generate a unique barcode
   */
  async generateBarcode(prefix: string = 'REZ'): Promise<string> {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const barcode = `${prefix}${timestamp}${random}`;

    // Calculate EAN-13 check digit
    const checkDigit = this.calculateEAN13CheckDigit(barcode);
    return `${barcode}${checkDigit}`;
  }

  /**
   * Generate a barcode and ensure it's unique
   */
  async generateUniqueBarcode(prefix: string = 'REZ'): Promise<string> {
    let barcode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      barcode = await this.generateBarcode(prefix);
      const exists = await SKU.findOne({ barcode });
      if (!exists) {
        return barcode;
      }
      attempts++;
    } while (attempts < maxAttempts);

    throw new Error('Failed to generate unique barcode after maximum attempts');
  }

  /**
   * Calculate EAN-13 check digit
   */
  private calculateEAN13CheckDigit(baseBarcode: string): string {
    const digits = baseBarcode.slice(0, 12).split('').map(Number);
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  }

  /**
   * Validate a barcode format (EAN-13)
   */
  async validateBarcode(barcode: string): Promise<{
    valid: boolean;
    message: string;
    type?: string;
  }> {
    // Remove any spaces or dashes
    const cleanBarcode = barcode.replace(/[\s-]/g, '');

    // Check if it's a valid barcode format
    if (!/^\d+$/.test(cleanBarcode)) {
      return {
        valid: false,
        message: 'Barcode must contain only digits',
      };
    }

    // Validate EAN-13
    if (cleanBarcode.length === 13) {
      const isValid = this.validateEAN13(cleanBarcode);
      return {
        valid: isValid,
        message: isValid ? 'Valid EAN-13 barcode' : 'Invalid EAN-13 check digit',
        type: 'EAN-13',
      };
    }

    // Validate EAN-8
    if (cleanBarcode.length === 8) {
      const isValid = this.validateEAN8(cleanBarcode);
      return {
        valid: isValid,
        message: isValid ? 'Valid EAN-8 barcode' : 'Invalid EAN-8 check digit',
        type: 'EAN-8',
      };
    }

    // Validate UPC-A
    if (cleanBarcode.length === 12) {
      const isValid = this.validateUPCA(cleanBarcode);
      return {
        valid: isValid,
        message: isValid ? 'Valid UPC-A barcode' : 'Invalid UPC-A check digit',
        type: 'UPC-A',
      };
    }

    return {
      valid: false,
      message: 'Barcode must be 8, 12, or 13 digits',
    };
  }

  /**
   * Validate EAN-13 check digit
   */
  private validateEAN13(barcode: string): boolean {
    if (barcode.length !== 13 || !/^\d+$/.test(barcode)) {
      return false;
    }

    const digits = barcode.split('').map(Number);
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[12];
  }

  /**
   * Validate EAN-8 check digit
   */
  private validateEAN8(barcode: string): boolean {
    if (barcode.length !== 8 || !/^\d+$/.test(barcode)) {
      return false;
    }

    const digits = barcode.split('').map(Number);
    let sum = 0;

    for (let i = 0; i < 7; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[7];
  }

  /**
   * Validate UPC-A check digit
   */
  private validateUPCA(barcode: string): boolean {
    if (barcode.length !== 12 || !/^\d+$/.test(barcode)) {
      return false;
    }

    const digits = barcode.split('').map(Number);
    let sum = 0;

    for (let i = 0; i < 11; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[11];
  }

  /**
   * Check if a barcode already exists in the system
   */
  async barcodeExists(barcode: string): Promise<boolean> {
    const sku = await SKU.findOne({ barcode });
    return !!sku;
  }

  /**
   * Bulk lookup multiple barcodes
   */
  async bulkLookupBarcodes(barcodes: string[]): Promise<BarcodeLookupResult[]> {
    const results = await Promise.all(
      barcodes.map((barcode) => this.lookupBarcode(barcode))
    );
    return results;
  }

  /**
   * Get barcode statistics
   */
  async getBarcodeStats(): Promise<{
    total: number;
    withBarcode: number;
    withoutBarcode: number;
    percentageWithBarcode: number;
  }> {
    const total = await SKU.countDocuments();
    const withBarcode = await SKU.countDocuments({ barcode: { $exists: true, $ne: null } });
    const withoutBarcode = total - withBarcode;

    return {
      total,
      withBarcode,
      withoutBarcode,
      percentageWithBarcode: total > 0 ? (withBarcode / total) * 100 : 0,
    };
  }

  /**
   * Find SKU by partial barcode (for scanning scenarios)
   */
  async findByPartialBarcode(partialCode: string, storeId?: string): Promise<any[]> {
    const query: any = { barcode: { $regex: partialCode, $options: 'i' } };
    if (storeId) {
      query.storeId = storeId;
    }
    return SKU.find(query).limit(10).lean();
  }
}

export const barcodeService = new BarcodeService();
