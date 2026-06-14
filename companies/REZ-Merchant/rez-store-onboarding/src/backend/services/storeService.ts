import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { Store, QRCode as QRCodeType, Product, POSConfig, Document, BankDetails } from '../models/Onboarding';
import { onboardingService } from './onboardingService';

// ============================================================================
// In-Memory Storage (Replace with Database in Production)
// ============================================================================

const qrCodesMap: Map<string, QRCodeType[]> = new Map();
const productsMap: Map<string, Product[]> = new Map();
const documentsMap: Map<string, Document[]> = new Map();
const bankDetailsMap: Map<string, BankDetails[]> = new Map();

// ============================================================================
// Store Service
// ============================================================================

export class StoreService {
  /**
   * Create a new store with all required configurations
   */
  async createStore(data: {
    merchantId: string;
    storeName: string;
    storeType: string;
    address: Store['address'];
    phone: string;
    email: string;
  }): Promise<Store> {
    const { store, onboarding } = await onboardingService.createStore({
      merchantId: data.merchantId,
      storeName: data.storeName,
      storeType: data.storeType as Store['type'],
      address: data.address,
      phone: data.phone,
      email: data.email,
      operatingHours: [
        { dayOfWeek: 0, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 5, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 6, openTime: '10:00', closeTime: '20:00', isClosed: false },
      ],
    });

    return store;
  }

  /**
   * Get store by ID
   */
  async getStoreById(storeId: string): Promise<Store | null> {
    return onboardingService.getStoreById(storeId);
  }

  /**
   * Update store details
   */
  async updateStore(storeId: string, data: Partial<Store>): Promise<Store> {
    const store = await this.getStoreById(storeId);
    if (!store) {
      throw new Error(`Store not found: ${storeId}`);
    }

    const updatedStore: Store = {
      ...store,
      ...data,
      id: store.id,
      merchantId: store.merchantId,
      updatedAt: new Date().toISOString(),
    };

    return updatedStore;
  }

  /**
   * Generate shelf QR codes for all products
   */
  async generateShelfQRCodes(storeId: string): Promise<QRCodeType[]> {
    const products = productsMap.get(storeId) || [];
    const existingQRCodes = qrCodesMap.get(storeId) || [];
    const newQRCodes: QRCodeType[] = [];

    const baseUrl = process.env.APP_URL || 'https://rez.store';

    for (const product of products) {
      // Check if QR code already exists for this product
      const existingQR = existingQRCodes.find(qr => qr.productId === product.id);
      if (existingQR) continue;

      const qrData = JSON.stringify({
        storeId,
        productId: product.id,
        sku: product.sku,
        shelfCode: product.shelfCode,
        action: 'price_check',
      });

      const qrImageUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      const qrCode: QRCodeType = {
        id: uuidv4(),
        storeId,
        productId: product.id,
        shelfCode: product.shelfCode,
        qrData,
        imageUrl: qrImageUrl,
        createdAt: new Date().toISOString(),
      };

      newQRCodes.push(qrCode);
    }

    // Store all QR codes
    const allQRCodes = [...existingQRCodes, ...newQRCodes];
    qrCodesMap.set(storeId, allQRCodes);

    return allQRCodes;
  }

  /**
   * Get all QR codes for a store
   */
  async getStoreQRCodes(storeId: string): Promise<QRCodeType[]> {
    return qrCodesMap.get(storeId) || [];
  }

  /**
   * Print QR codes (mark as printed)
   */
  async markQRCodesPrinted(qrIds: string[], storeId: string): Promise<void> {
    const qrCodes = qrCodesMap.get(storeId) || [];
    const now = new Date().toISOString();

    const updatedQRCodes = qrCodes.map(qr => {
      if (qrIds.includes(qr.id)) {
        return { ...qr, printedAt: now };
      }
      return qr;
    });

    qrCodesMap.set(storeId, updatedQRCodes);
  }

  /**
   * Setup POS configuration for store
   */
  async setupStorePOS(
    storeId: string,
    config: {
      defaultTaxRate?: number;
      currency?: string;
      receiptFooter?: string;
      allowDiscounts?: boolean;
      maxDiscountPercent?: number;
      staffPINRequired?: boolean;
    }
  ): Promise<POSConfig> {
    const store = await this.getStoreById(storeId);
    if (!store) {
      throw new Error(`Store not found: ${storeId}`);
    }

    const posConfig: POSConfig = {
      storeId,
      defaultTaxRate: config.defaultTaxRate ?? 18,
      currency: config.currency ?? 'INR',
      receiptFooter: config.receiptFooter ?? 'Thank you for shopping with us!',
      allowDiscounts: config.allowDiscounts ?? true,
      maxDiscountPercent: config.maxDiscountPercent ?? 50,
      staffPINRequired: config.staffPINRequired ?? true,
      createdAt: new Date().toISOString(),
    };

    store.posConfig = posConfig;
    store.updatedAt = new Date().toISOString();

    return posConfig;
  }

  /**
   * Get POS config for store
   */
  async getPOSConfig(storeId: string): Promise<POSConfig | null> {
    const store = await this.getStoreById(storeId);
    return store?.posConfig || null;
  }

  /**
   * Add a product to store
   */
  async addProduct(storeId: string, productData: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const product: Product = {
      ...productData,
      id: uuidv4(),
      storeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const storeProducts = productsMap.get(storeId) || [];
    storeProducts.push(product);
    productsMap.set(storeId, storeProducts);

    return product;
  }

  /**
   * Bulk import products
   */
  async importProducts(storeId: string, products: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>[]): Promise<{ imported: number; errors: string[] }> {
    const storeProducts = productsMap.get(storeId) || [];
    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < products.length; i++) {
      try {
        const product: Product = {
          ...products[i],
          id: uuidv4(),
          storeId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        storeProducts.push(product);
        imported++;
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    productsMap.set(storeId, storeProducts);
    return { imported, errors };
  }

  /**
   * Get all products for a store
   */
  async getStoreProducts(storeId: string): Promise<Product[]> {
    return productsMap.get(storeId) || [];
  }

  /**
   * Update product
   */
  async updateProduct(storeId: string, productId: string, data: Partial<Product>): Promise<Product> {
    const storeProducts = productsMap.get(storeId) || [];
    const index = storeProducts.findIndex(p => p.id === productId);

    if (index === -1) {
      throw new Error(`Product not found: ${productId}`);
    }

    const updatedProduct: Product = {
      ...storeProducts[index],
      ...data,
      id: productId,
      storeId,
      updatedAt: new Date().toISOString(),
    };

    storeProducts[index] = updatedProduct;
    productsMap.set(storeId, storeProducts);

    return updatedProduct;
  }

  /**
   * Upload store document
   */
  async uploadDocument(storeId: string, document: Omit<Document, 'id' | 'storeId' | 'uploadedAt'>): Promise<Document> {
    const doc: Document = {
      ...document,
      id: uuidv4(),
      storeId,
      uploadedAt: new Date().toISOString(),
    };

    const storeDocs = documentsMap.get(storeId) || [];
    storeDocs.push(doc);
    documentsMap.set(storeId, storeDocs);

    return doc;
  }

  /**
   * Get store documents
   */
  async getStoreDocuments(storeId: string): Promise<Document[]> {
    return documentsMap.get(storeId) || [];
  }

  /**
   * Update document verification status
   */
  async updateDocumentVerification(
    storeId: string,
    documentId: string,
    status: Document['verificationStatus'],
    verifiedBy?: string,
    rejectionReason?: string
  ): Promise<Document> {
    const storeDocs = documentsMap.get(storeId) || [];
    const index = storeDocs.findIndex(d => d.id === documentId);

    if (index === -1) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const now = new Date().toISOString();
    storeDocs[index] = {
      ...storeDocs[index],
      verificationStatus: status,
      verifiedAt: now,
      verifiedBy,
      rejectionReason,
    };

    documentsMap.set(storeId, storeDocs);
    return storeDocs[index];
  }

  /**
   * Save bank details
   */
  async saveBankDetails(storeId: string, bankData: Omit<BankDetails, 'id' | 'storeId' | 'createdAt'>): Promise<BankDetails> {
    const bank: BankDetails = {
      ...bankData,
      id: uuidv4(),
      storeId,
      createdAt: new Date().toISOString(),
    };

    const storeBanks = bankDetailsMap.get(storeId) || [];
    storeBanks.push(bank);
    bankDetailsMap.set(storeId, storeBanks);

    return bank;
  }

  /**
   * Get bank details for store
   */
  async getBankDetails(storeId: string): Promise<BankDetails[]> {
    return bankDetailsMap.get(storeId) || [];
  }

  /**
   * Verify bank details with test transaction
   */
  async verifyBankDetails(storeId: string, bankDetailId: string): Promise<BankDetails> {
    const storeBanks = bankDetailsMap.get(storeId) || [];
    const index = storeBanks.findIndex(b => b.id === bankDetailId);

    if (index === -1) {
      throw new Error(`Bank details not found: ${bankDetailId}`);
    }

    const now = new Date().toISOString();
    storeBanks[index] = {
      ...storeBanks[index],
      verificationStatus: 'verified',
      verifiedAt: now,
      testTransactionId: `TEST-${Date.now()}`,
    };

    bankDetailsMap.set(storeId, storeBanks);
    return storeBanks[index];
  }

  /**
   * Get merchant stores
   */
  async getMerchantStores(merchantId: string): Promise<Store[]> {
    return onboardingService.getMerchantStores(merchantId);
  }
}

export const storeService = new StoreService();
