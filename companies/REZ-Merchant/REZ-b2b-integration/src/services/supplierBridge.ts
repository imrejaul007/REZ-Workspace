import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  Supplier,
  SupplierCategory,
  MerchantSupplierMapping,
  SyncedProduct,
  SyncProductsRequest,
  ApiResponse,
  TallySupplier,
  TallyProduct,
  SupplierPerformance,
} from '../types';
import {
  SupplierModel,
  ISupplierDocument,
  MerchantSupplierMappingModel,
  IMerchantSupplierMappingDocument,
  SyncedProductModel,
  ISyncedProductDocument,
  ProductCostModel,
} from '../models';
import { logger } from '../utils/logger';
import { validateData } from '../utils/validation';

export interface SupplierBridgeConfig {
  tallyApiUrl?: string;
  tallyApiKey?: string;
  tallyCompanyId?: string;
  merchantServiceUrl?: string;
  costChangeThresholdPercent: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
  durationMs: number;
}

export class SupplierBridgeService {
  private axiosInstance: AxiosInstance | null = null;
  private config: SupplierBridgeConfig;
  private readonly COST_CHANGE_THRESHOLD = 5; // 5% threshold for alerts

  constructor(config: SupplierBridgeConfig) {
    this.config = {
      costChangeThresholdPercent: config.costChangeThresholdPercent ?? this.COST_CHANGE_THRESHOLD,
      tallyApiUrl: config.tallyApiUrl,
      tallyApiKey: config.tallyApiKey,
      tallyCompanyId: config.tallyCompanyId,
      merchantServiceUrl: config.merchantServiceUrl,
    };

    if (this.config.tallyApiUrl && this.config.tallyApiKey) {
      this.axiosInstance = axios.create({
        baseURL: this.config.tallyApiUrl,
        headers: {
          'Authorization': `Bearer ${this.config.tallyApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }
  }

  /**
   * Create or update a supplier
   */
  async upsertSupplier(supplierData: Partial<Supplier>): Promise<ISupplierDocument> {
    const validatedData = validateData(supplierData, SupplierModel.schema.obj);

    const supplierId = validatedData.supplierId || `supplier_${uuidv4()}`;

    const existingSupplier = await SupplierModel.findOne({ supplierId });

    if (existingSupplier) {
      Object.assign(existingSupplier, validatedData);
      existingSupplier.updatedAt = new Date();
      await existingSupplier.save();
      logger.info(`Updated supplier: ${supplierId}`, { supplierId, name: validatedData.name });
      return existingSupplier;
    }

    const newSupplier = new SupplierModel({
      ...validatedData,
      supplierId,
    });
    await newSupplier.save();
    logger.info(`Created new supplier: ${supplierId}`, { supplierId, name: validatedData.name });
    return newSupplier;
  }

  /**
   * Get supplier by ID
   */
  async getSupplier(supplierId: string): Promise<ISupplierDocument | null> {
    return SupplierModel.findOne({ supplierId });
  }

  /**
   * Get all suppliers with optional filters
   */
  async getSuppliers(filters: {
    category?: SupplierCategory;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ suppliers: ISupplierDocument[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const [suppliers, total] = await Promise.all([
      SupplierModel.find(query)
        .sort({ rating: -1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      SupplierModel.countDocuments(query),
    ]);

    return { suppliers, total };
  }

  /**
   * Create a mapping between merchant and supplier
   */
  async createMerchantSupplierMapping(mappingData: {
    merchantId: string;
    supplierId: string;
    marginTier?: 'standard' | 'premium' | 'wholesale';
    customMarkup?: number;
    syncEnabled?: boolean;
  }): Promise<IMerchantSupplierMappingDocument> {
    const existingMapping = await MerchantSupplierMappingModel.findOne({
      merchantId: mappingData.merchantId,
      supplierId: mappingData.supplierId,
    });

    if (existingMapping) {
      Object.assign(existingMapping, {
        status: 'active',
        marginTier: mappingData.marginTier ?? existingMapping.marginTier,
        customMarkup: mappingData.customMarkup ?? existingMapping.customMarkup,
        syncEnabled: mappingData.syncEnabled ?? existingMapping.syncEnabled,
        updatedAt: new Date(),
      });
      await existingMapping.save();
      logger.info(`Updated merchant-supplier mapping`, {
        mappingId: existingMapping.mappingId,
        merchantId: mappingData.merchantId,
        supplierId: mappingData.supplierId,
      });
      return existingMapping;
    }

    const newMapping = new MerchantSupplierMappingModel({
      mappingId: `map_${uuidv4()}`,
      merchantId: mappingData.merchantId,
      supplierId: mappingData.supplierId,
      marginTier: mappingData.marginTier ?? 'standard',
      customMarkup: mappingData.customMarkup,
      syncEnabled: mappingData.syncEnabled ?? true,
      status: 'active',
      syncStatus: 'never_synced',
    });

    await newMapping.save();
    logger.info(`Created merchant-supplier mapping`, {
      mappingId: newMapping.mappingId,
      merchantId: mappingData.merchantId,
      supplierId: mappingData.supplierId,
    });
    return newMapping;
  }

  /**
   * Get all suppliers for a merchant
   */
  async getMerchantSuppliers(merchantId: string): Promise<IMerchantSupplierMappingDocument[]> {
    return MerchantSupplierMappingModel.findByMerchant(merchantId);
  }

  /**
   * Sync products from supplier to merchant catalog
   */
  async syncProducts(request: SyncProductsRequest): Promise<SyncResult> {
    const startTime = new Date();
    const errors: string[] = [];
    let synced = 0;
    let failed = 0;

    try {
      // Get the mapping
      const mapping = await MerchantSupplierMappingModel.findOne({
        merchantId: request.merchantId,
        supplierId: request.supplierId,
        status: 'active',
      });

      if (!mapping) {
        throw new Error(`No active mapping found for merchant ${request.merchantId} and supplier ${request.supplierId}`);
      }

      // Get products from supplier (simulated - in real scenario would call supplier API)
      const supplierProducts = await this.fetchSupplierProducts(request.supplierId, request.productIds);

      // Process each product
      for (const product of supplierProducts) {
        try {
          await this.processSupplierProduct({
            product,
            merchantId: request.merchantId,
            supplierId: request.supplierId,
            forceSync: request.forceSync,
          });
          synced++;
        } catch (error) {
          failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Product ${product.supplierProductId}: ${errorMsg}`);
          logger.error(`Failed to sync product`, {
            supplierProductId: product.supplierProductId,
            merchantId: request.merchantId,
            supplierId: request.supplierId,
            error: errorMsg,
          });
        }
      }

      // Update mapping status
      await MerchantSupplierMappingModel.updateSyncStatus(
        request.merchantId,
        request.supplierId,
        failed > 0 && failed === supplierProducts.length ? 'error' : 'synced',
        failed > 0 ? `${failed} products failed to sync` : undefined
      );

      const endTime = new Date();
      logger.info(`Product sync completed`, {
        merchantId: request.merchantId,
        supplierId: request.supplierId,
        synced,
        failed,
        durationMs: endTime.getTime() - startTime.getTime(),
      });

      return {
        success: failed === 0,
        synced,
        failed,
        errors,
        startTime,
        endTime,
        durationMs: endTime.getTime() - startTime.getTime(),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMsg);
      logger.error(`Product sync failed`, { error: errorMsg });

      await MerchantSupplierMappingModel.updateSyncStatus(
        request.merchantId,
        request.supplierId,
        'error',
        errorMsg
      );

      const endTime = new Date();
      return {
        success: false,
        synced,
        failed,
        errors,
        startTime,
        endTime,
        durationMs: endTime.getTime() - startTime.getTime(),
      };
    }
  }

  /**
   * Fetch products from supplier API (or Tally)
   */
  private async fetchSupplierProducts(
    supplierId: string,
    productIds?: string[]
  ): Promise<Array<SyncedProduct & { supplierProductId: string }>> {
    // In a real implementation, this would call the supplier's API
    // For now, we'll simulate fetching from Tally if configured

    if (this.axiosInstance && supplierId === 'tally') {
      try {
        const response = await this.axiosInstance.get(`/stocks`, {
          params: {
            company_id: this.config.tallyCompanyId,
            ...(productIds ? { ids: productIds.join(',') } : {}),
          },
        });

        return (response.data as TallyProduct[]).map((product) => ({
          syncedProductId: `sp_${uuidv4()}`,
          merchantId: '',
          supplierId,
          supplierProductId: product.tallyId,
          supplierSku: product.sku,
          name: product.name,
          category: 'other' as SupplierCategory,
          brand: undefined,
          mrp: product.mrp,
          costPrice: product.rate ?? 0,
          suggestedSellingPrice: undefined,
          inventory: product.openingBalance ?? 0,
          unit: product.unit ?? 'piece',
          barcode: product.hsnCode,
          imageUrl: undefined,
          isActive: true,
          lastSyncedAt: new Date(),
          metadata: {
            tallyGroupName: product.groupName,
            hsnCode: product.hsnCode,
            gstRate: product.gstRate,
          },
        }));
      } catch (error) {
        logger.error(`Failed to fetch products from Tally`, { supplierId, error });
        throw error;
      }
    }

    // For other suppliers, return empty array (would implement actual supplier API calls)
    logger.warn(`Supplier API not configured for ${supplierId}, returning empty product list`);
    return [];
  }

  /**
   * Process a single supplier product
   */
  private async processSupplierProduct(params: {
    product: SyncedProduct & { supplierProductId: string };
    merchantId: string;
    supplierId: string;
    forceSync: boolean;
  }): Promise<ISyncedProductDocument> {
    const { product, merchantId, supplierId, forceSync } = params;

    // Check if product already exists
    const existingProduct = await SyncedProductModel.findBySupplierProduct(
      supplierId,
      product.supplierProductId
    );

    let syncedProduct: ISyncedProductDocument;

    if (existingProduct && !forceSync) {
      // Check if cost has changed significantly
      if (existingProduct.costPrice !== product.costPrice) {
        const costChange = existingProduct.costPrice
          ? ((product.costPrice - existingProduct.costPrice) / existingProduct.costPrice) * 100
          : 0;

        if (Math.abs(costChange) >= this.config.costChangeThresholdPercent) {
          // Update cost history
          await ProductCostModel.updateCost(
            existingProduct.syncedProductId,
            supplierId,
            merchantId,
            product.costPrice
          );

          logger.info(`Cost change detected for product`, {
            productId: existingProduct.syncedProductId,
            oldCost: existingProduct.costPrice,
            newCost: product.costPrice,
            changePercent: costChange,
          });
        }

        existingProduct.costPrice = product.costPrice;
        existingProduct.inventory = product.inventory ?? existingProduct.inventory;
        existingProduct.lastSyncedAt = new Date();
        existingProduct.syncError = null;
        await existingProduct.save();
        syncedProduct = existingProduct;
      } else {
        // Update other fields
        existingProduct.lastSyncedAt = new Date();
        existingProduct.syncError = null;
        if (product.mrp) existingProduct.mrp = product.mrp;
        if (product.name) existingProduct.name = product.name;
        if (product.inventory !== undefined) existingProduct.inventory = product.inventory;
        await existingProduct.save();
        syncedProduct = existingProduct;
      }
    } else {
      // Create new synced product
      syncedProduct = new SyncedProductModel({
        syncedProductId: existingProduct?.syncedProductId ?? `sp_${uuidv4()}`,
        merchantId,
        supplierId,
        supplierProductId: product.supplierProductId,
        supplierSku: product.supplierSku,
        name: product.name,
        description: product.description,
        category: product.category,
        brand: product.brand,
        mrp: product.mrp,
        costPrice: product.costPrice,
        suggestedSellingPrice: product.suggestedSellingPrice,
        inventory: product.inventory ?? 0,
        unit: product.unit,
        barcode: product.barcode,
        imageUrl: product.imageUrl,
        isActive: true,
        lastSyncedAt: new Date(),
        metadata: product.metadata,
      });
      await syncedProduct.save();

      // Create initial cost record
      await ProductCostModel.create({
        costId: `cost_${uuidv4()}`,
        productId: syncedProduct.syncedProductId,
        supplierId,
        merchantId,
        costPrice: product.costPrice,
        isCurrent: true,
      });
    }

    return syncedProduct;
  }

  /**
   * Get supplier performance metrics
   */
  async getSupplierPerformance(
    supplierId: string,
    periodDays: number = 30
  ): Promise<SupplierPerformance | null> {
    const supplier = await SupplierModel.findOne({ supplierId });
    if (!supplier) return null;

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // In real implementation, would calculate from actual order data
    const performance: SupplierPerformance = {
      supplierId,
      name: supplier.name,
      rating: supplier.rating,
      onTimeDeliveryRate: supplier.onTimeDeliveryRate,
      qualityScore: supplier.qualityScore,
      averageResponseTime: 24, // hours - would calculate from actual data
      totalOrders: supplier.totalOrders,
      totalValue: 0, // would calculate from actual order data
      lastOrderDate: null,
      period: {
        start: startDate,
        end: endDate,
      },
    };

    return performance;
  }

  /**
   * Sync suppliers from Tally
   */
  async syncSuppliersFromTally(): Promise<{ imported: number; updated: number; errors: string[] }> {
    if (!this.axiosInstance) {
      return { imported: 0, updated: 0, errors: ['Tally API not configured'] };
    }

    const errors: string[] = [];
    let imported = 0;
    let updated = 0;

    try {
      const response = await this.axiosInstance.get('/ledgers', {
        params: {
          company_id: this.config.tallyCompanyId,
          group: 'Sundry Creditors',
        },
      });

      const tallySuppliers = response.data as TallySupplier[];

      for (const tallySupplier of tallySuppliers) {
        try {
          const existingSupplier = await SupplierModel.findOne({
            $or: [
              { supplierId: tallySupplier.tallyId },
              { 'metadata.tallyLedgerName': tallySupplier.ledgerName },
            ],
          });

          const supplierData: Partial<Supplier> = {
            supplierId: tallySupplier.tallyId,
            name: tallySupplier.name,
            category: 'other',
            status: 'active',
            contactEmail: tallySupplier.email,
            contactPhone: tallySupplier.mobile,
            paymentTerms: tallySupplier.creditPeriod
              ? tallySupplier.creditPeriod <= 15
                ? 'net15'
                : tallySupplier.creditPeriod <= 30
                  ? 'net30'
                  : tallySupplier.creditPeriod <= 60
                    ? 'net60'
                    : 'net90'
              : 'net30',
            metadata: {
              tallyLedgerName: tallySupplier.ledgerName,
              tallyGstin: tallySupplier.gstin,
              tallyOpeningBalance: tallySupplier.openingBalance,
            },
          };

          if (existingSupplier) {
            Object.assign(existingSupplier, supplierData);
            await existingSupplier.save();
            updated++;
          } else {
            await this.upsertSupplier(supplierData);
            imported++;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Tally supplier ${tallySupplier.tallyId}: ${errorMsg}`);
        }
      }

      logger.info(`Tally supplier sync completed`, { imported, updated, errors: errors.length });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Tally API error: ${errorMsg}`);
      logger.error(`Tally supplier sync failed`, { error: errorMsg });
    }

    return { imported, updated, errors };
  }

  /**
   * Deactivate a merchant-supplier mapping
   */
  async deactivateMapping(merchantId: string, supplierId: string): Promise<boolean> {
    const result = await MerchantSupplierMappingModel.updateOne(
      { merchantId, supplierId },
      {
        $set: {
          status: 'inactive',
          syncEnabled: false,
          updatedAt: new Date(),
        },
      }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Get sync status for all merchant mappings
   */
  async getSyncStatus(merchantId: string): Promise<{
    mappings: IMerchantSupplierMappingDocument[];
    stats: {
      total: number;
      synced: number;
      pending: number;
      error: number;
    };
  }> {
    const mappings = await MerchantSupplierMappingModel.find({ merchantId });
    const stats = await MerchantSupplierMappingModel.getSyncStats(merchantId);
    return { mappings, stats };
  }
}
