import {
  ProductCost,
  IProductCostDocument,
  SyncedProduct,
  ISyncedProductDocument,
  CategoryMarginConfig,
  DEFAULT_CATEGORY_MARGINS,
  ApiResponse,
} from '../types';
import { ProductCostModel, SyncedProductModel } from '../models';
import { logger } from '../utils/logger';
import { validateData } from '../utils/validation';

export interface CostCalculationParams {
  baseCost: number;
  quantity?: number;
  unit?: string;
  handlingFeePercent?: number;
  packagingCost?: number;
  transportationCost?: number;
  taxes?: number;
  currency?: string;
}

export interface CalculatedCost {
  baseCost: number;
  quantity: number;
  unit: string;
  subtotal: number;
  handlingFee: number;
  packagingCost: number;
  transportationCost: number;
  taxAmount: number;
  totalCost: number;
  currency: string;
  breakdown: {
    label: string;
    amount: number;
    percent?: number;
  }[];
}

export interface ProductCostSummary {
  productId: string;
  productName: string;
  supplierId: string;
  currentCost: number;
  previousCost: number | null;
  changePercent: number | null;
  lastUpdated: Date;
  inventory: number;
  category: string;
  totalInventoryValue: number;
}

export interface CostAnalysis {
  totalProducts: number;
  productsWithIncreases: number;
  productsWithDecreases: number;
  averageCostChange: number;
  totalInventoryValue: number;
  highestIncrease: {
    productId: string;
    productName: string;
    oldCost: number;
    newCost: number;
    changePercent: number;
  } | null;
  highestDecrease: {
    productId: string;
    productName: string;
    oldCost: number;
    newCost: number;
    changePercent: number;
  } | null;
}

export class CostCalculatorService {
  private readonly DEFAULT_HANDLING_FEE = 1.5; // 1.5%
  private readonly DEFAULT_PACKAGING_COST = 2; // INR per unit
  private readonly DEFAULT_TRANSPORTATION_PERCENT = 0.5; // 0.5%

  /**
   * Calculate total cost with all factors
   */
  calculateCost(params: CostCalculationParams): CalculatedCost {
    const {
      baseCost,
      quantity = 1,
      unit = 'piece',
      handlingFeePercent = this.DEFAULT_HANDLING_FEE,
      packagingCost = this.DEFAULT_PACKAGING_COST,
      transportationCost,
      taxes = 0,
      currency = 'INR',
    } = params;

    const subtotal = baseCost * quantity;
    const handlingFee = subtotal * (handlingFeePercent / 100);
    const packagingTotal = packagingCost * quantity;
    const transportCost = transportationCost ?? subtotal * (this.DEFAULT_TRANSPORTATION_PERCENT / 100);
    const taxAmount = taxes > 0 ? (subtotal + handlingFee + packagingTotal + transportCost) * (taxes / 100) : 0;

    const totalCost = subtotal + handlingFee + packagingTotal + transportCost + taxAmount;

    const breakdown = [
      { label: 'Base Cost', amount: subtotal, percent: 100 },
      { label: 'Handling Fee', amount: handlingFee, percent: handlingFeePercent },
      { label: 'Packaging', amount: packagingTotal },
      { label: 'Transportation', amount: transportCost },
    ];

    if (taxAmount > 0) {
      breakdown.push({ label: 'Taxes', amount: taxAmount, percent: taxes });
    }

    return {
      baseCost,
      quantity,
      unit,
      subtotal,
      handlingFee,
      packagingCost: packagingTotal,
      transportationCost: transportCost,
      taxAmount,
      totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
      currency,
      breakdown,
    };
  }

  /**
   * Get current cost for a product
   */
  async getCurrentCost(
    productId: string,
    supplierId: string,
    merchantId: string
  ): Promise<IProductCostDocument | null> {
    return ProductCostModel.getCurrentCost(productId, supplierId, merchantId);
  }

  /**
   * Get all current costs for a merchant
   */
  async getAllMerchantCosts(merchantId: string): Promise<IProductCostDocument[]> {
    return ProductCostModel.getAllCurrentCosts(merchantId);
  }

  /**
   * Get cost history for a product
   */
  async getCostHistory(
    productId: string,
    supplierId: string,
    merchantId: string,
    limit: number = 30
  ): Promise<IProductCostDocument[]> {
    return ProductCostModel.getCostHistory(productId, supplierId, merchantId, limit);
  }

  /**
   * Update cost for a product
   */
  async updateProductCost(
    productId: string,
    supplierId: string,
    merchantId: string,
    newCost: number
  ): Promise<{ previousCost: number | null; changePercent: number | null }> {
    const result = await ProductCostModel.updateCost(productId, supplierId, merchantId, newCost);
    logger.info(`Product cost updated`, {
      productId,
      supplierId,
      merchantId,
      newCost,
      previousCost: result.previousCost,
      changePercent: result.changePercent,
    });
    return result;
  }

  /**
   * Get products with significant cost changes
   */
  async getSignificantCostChanges(
    merchantId: string,
    thresholdPercent: number = 5
  ): Promise<IProductCostDocument[]> {
    return ProductCostModel.findSignificantChanges(merchantId, thresholdPercent);
  }

  /**
   * Get products with cost increases
   */
  async getCostIncreases(
    merchantId: string,
    minPercent: number = 5
  ): Promise<IProductCostDocument[]> {
    return ProductCostModel.findCostIncreases(merchantId, minPercent);
  }

  /**
   * Get detailed product cost summary including inventory value
   */
  async getProductCostSummary(merchantId: string): Promise<ProductCostSummary[]> {
    const costs = await ProductCostModel.getAllCurrentCosts(merchantId);
    const summaries: ProductCostSummary[] = [];

    for (const cost of costs) {
      const product = await SyncedProductModel.findOne({
        syncedProductId: cost.productId,
      });

      if (product) {
        const totalInventoryValue = product.costPrice * product.inventory;
        const previousInventoryValue = cost.previousCost ? cost.previousCost * product.inventory : null;
        const valueChange = previousInventoryValue ? totalInventoryValue - previousInventoryValue : null;

        summaries.push({
          productId: cost.productId,
          productName: product.name,
          supplierId: cost.supplierId,
          currentCost: cost.costPrice,
          previousCost: cost.previousCost ?? null,
          changePercent: cost.costChangePercent ?? null,
          lastUpdated: cost.lastUpdated,
          inventory: product.inventory,
          category: product.category,
          totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        });
      }
    }

    return summaries.sort((a, b) => b.currentCost - a.currentCost);
  }

  /**
   * Analyze cost changes for a merchant
   */
  async analyzeCostChanges(merchantId: string): Promise<CostAnalysis> {
    const costs = await ProductCostModel.findSignificantChanges(merchantId, 0.1);

    let productsWithIncreases = 0;
    let productsWithDecreases = 0;
    let totalChangePercent = 0;
    let highestIncrease: CostAnalysis['highestIncrease'] = null;
    let highestDecrease: CostAnalysis['highestDecrease'] = null;

    for (const cost of costs) {
      if (cost.costChangePercent === null) continue;

      if (cost.costChangePercent > 0) {
        productsWithIncreases++;
        if (!highestIncrease || cost.costChangePercent > highestIncrease.changePercent) {
          const product = await SyncedProductModel.findOne({ syncedProductId: cost.productId });
          highestIncrease = {
            productId: cost.productId,
            productName: product?.name ?? 'Unknown',
            oldCost: cost.previousCost ?? cost.costPrice,
            newCost: cost.costPrice,
            changePercent: cost.costChangePercent,
          };
        }
      } else if (cost.costChangePercent < 0) {
        productsWithDecreases++;
        if (!highestDecrease || cost.costChangePercent < highestDecrease.changePercent) {
          const product = await SyncedProductModel.findOne({ syncedProductId: cost.productId });
          highestDecrease = {
            productId: cost.productId,
            productName: product?.name ?? 'Unknown',
            oldCost: cost.previousCost ?? cost.costPrice,
            newCost: cost.costPrice,
            changePercent: cost.costChangePercent,
          };
        }
      }

      totalChangePercent += cost.costChangePercent;
    }

    const summary = await this.getProductCostSummary(merchantId);
    const totalInventoryValue = summary.reduce((sum, item) => sum + item.totalInventoryValue, 0);

    return {
      totalProducts: costs.length,
      productsWithIncreases,
      productsWithDecreases,
      averageCostChange: costs.length > 0 ? totalChangePercent / costs.length : 0,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      highestIncrease,
      highestDecrease,
    };
  }

  /**
   * Calculate effective cost after all adjustments
   */
  calculateEffectiveCost(params: {
    supplierPrice: number;
    bulkDiscountPercent?: number;
    loyaltyDiscountPercent?: number;
    volumeTier: 'small' | 'medium' | 'large' | 'enterprise';
    paymentTerm: 'immediate' | 'net15' | 'net30' | 'net60' | 'net90';
    paymentEarlyDiscount?: number;
  }): {
    originalPrice: number;
    afterBulkDiscount: number;
    afterLoyaltyDiscount: number;
    afterPaymentDiscount: number;
    finalCost: number;
    totalSavings: number;
    savingsPercent: number;
  } {
    const {
      supplierPrice,
      bulkDiscountPercent = 0,
      loyaltyDiscountPercent = 0,
      paymentEarlyDiscount = 0,
    } = params;

    // Volume-based additional discount
    const volumeDiscounts = {
      small: 0,
      medium: 1,
      large: 2,
      enterprise: 5,
    };
    const volumeDiscount = volumeDiscounts[params.volumeTier] ?? 0;

    // Early payment discount
    const earlyPaymentDiscount = params.paymentTerm !== 'immediate' && paymentEarlyDiscount > 0
      ? paymentEarlyDiscount
      : 0;

    let currentPrice = supplierPrice;

    // Apply bulk discount
    const bulkDiscountAmount = currentPrice * (bulkDiscountPercent / 100);
    currentPrice -= bulkDiscountAmount;

    // Apply volume discount
    const volumeDiscountAmount = currentPrice * (volumeDiscount / 100);
    currentPrice -= volumeDiscountAmount;

    // Apply loyalty discount
    const loyaltyDiscountAmount = currentPrice * (loyaltyDiscountPercent / 100);
    currentPrice -= loyaltyDiscountAmount;

    // Apply early payment discount
    const paymentDiscountAmount = currentPrice * (earlyPaymentDiscount / 100);
    currentPrice -= paymentDiscountAmount;

    const finalCost = Math.max(0, Math.round(currentPrice * 100) / 100);
    const totalSavings = supplierPrice - finalCost;
    const savingsPercent = supplierPrice > 0 ? (totalSavings / supplierPrice) * 100 : 0;

    return {
      originalPrice: supplierPrice,
      afterBulkDiscount: Math.round((supplierPrice - bulkDiscountAmount) * 100) / 100,
      afterLoyaltyDiscount: Math.round((supplierPrice - bulkDiscountAmount - volumeDiscountAmount) * 100) / 100,
      afterPaymentDiscount: Math.round((supplierPrice - bulkDiscountAmount - volumeDiscountAmount - loyaltyDiscountAmount) * 100) / 100,
      finalCost,
      totalSavings: Math.round(totalSavings * 100) / 100,
      savingsPercent: Math.round(savingsPercent * 10) / 10,
    };
  }

  /**
   * Compare costs across suppliers for the same product
   */
  async compareSupplierCosts(
    productName: string,
    merchantId: string
  ): Promise<{
    productName: string;
    suppliers: {
      supplierId: string;
      cost: number;
      lastUpdated: Date;
      rating: number;
    }[];
    bestSupplier: {
      supplierId: string;
      cost: number;
      savingsVsAverage: number;
    };
    averageCost: number;
  }> {
    // Find products matching the name across all suppliers
    const products = await SyncedProductModel.find({
      merchantId,
      name: { $regex: productName, $options: 'i' },
      isActive: true,
    });

    const suppliers: {
      supplierId: string;
      cost: number;
      lastUpdated: Date;
      rating: number;
    }[] = [];

    for (const product of products) {
      const cost = await ProductCostModel.getCurrentCost(
        product.syncedProductId,
        product.supplierId,
        merchantId
      );

      if (cost) {
        suppliers.push({
          supplierId: product.supplierId,
          cost: cost.costPrice,
          lastUpdated: cost.lastUpdated,
          rating: 4.5, // Would fetch from supplier model in real implementation
        });
      }
    }

    if (suppliers.length === 0) {
      return {
        productName,
        suppliers: [],
        bestSupplier: { supplierId: '', cost: 0, savingsVsAverage: 0 },
        averageCost: 0,
      };
    }

    const costs = suppliers.map((s) => s.cost);
    const averageCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    const bestSupplierData = suppliers.reduce((best, current) =>
      current.cost < best.cost ? current : best
    );

    return {
      productName,
      suppliers,
      bestSupplier: {
        supplierId: bestSupplierData.supplierId,
        cost: bestSupplierData.cost,
        savingsVsAverage: Math.round(((averageCost - bestSupplierData.cost) / averageCost) * 100 * 10) / 10,
      },
      averageCost: Math.round(averageCost * 100) / 100,
    };
  }

  /**
   * Bulk update costs for multiple products
   */
  async bulkUpdateCosts(
    updates: Array<{
      productId: string;
      supplierId: string;
      merchantId: string;
      newCost: number;
    }>
  ): Promise<{
    successful: number;
    failed: number;
    results: Array<{
      productId: string;
      success: boolean;
      previousCost?: number;
      newCost?: number;
      changePercent?: number;
      error?: string;
    }>;
  }> {
    const results: NonNullable<Awaited<ReturnType<typeof this.updateProductCost>>>[] = [];
    let successful = 0;
    let failed = 0;

    for (const update of updates) {
      try {
        const result = await this.updateProductCost(
          update.productId,
          update.supplierId,
          update.merchantId,
          update.newCost
        );
        successful++;
        results.push({
          productId: update.productId,
          success: true,
          previousCost: result.previousCost ?? undefined,
          newCost: update.newCost,
          changePercent: result.changePercent ?? undefined,
        });
      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          productId: update.productId,
          success: false,
          error: errorMsg,
        });
        logger.error(`Bulk cost update failed for product ${update.productId}`, { error: errorMsg });
      }
    }

    return { successful, failed, results };
  }

  /**
   * Get cost report for accounting/export
   */
  async generateCostReport(
    merchantId: string,
    options: {
      supplierId?: string;
      category?: string;
      startDate?: Date;
      endDate?: Date;
      includeHistory?: boolean;
    } = {}
  ): Promise<{
    reportDate: Date;
    merchantId: string;
    products: Array<{
      productId: string;
      productName: string;
      category: string;
      supplierId: string;
      currentCost: number;
      previousCost?: number;
      changePercent?: number;
      costHistory?: Array<{
        date: Date;
        cost: number;
      }>;
    }>;
    summary: {
      totalProducts: number;
      totalCurrentValue: number;
      totalPreviousValue: number;
      netChange: number;
    };
  }> {
    const query: Record<string, unknown> = { merchantId, isCurrent: true };

    if (options.supplierId) query.supplierId = options.supplierId;

    const costs = await ProductCostModel.find(query);
    const products: NonNullable<Awaited<ReturnType<typeof SyncedProductModel.findOne>>>>[] = [];

    let totalCurrentValue = 0;
    let totalPreviousValue = 0;

    for (const cost of costs) {
      const product = await SyncedProductModel.findOne({
        syncedProductId: cost.productId,
        ...(options.category ? { category: options.category } : {}),
      });

      if (product) {
        let productData: {
          productId: string;
          productName: string;
          category: string;
          supplierId: string;
          currentCost: number;
          previousCost?: number;
          changePercent?: number;
          costHistory?: Array<{
            date: Date;
            cost: number;
          }>;
        } = {
          productId: cost.productId,
          productName: product.name,
          category: product.category,
          supplierId: cost.supplierId,
          currentCost: cost.costPrice,
        };

        if (cost.previousCost) {
          productData.previousCost = cost.previousCost;
          productData.changePercent = cost.costChangePercent ?? undefined;
          totalPreviousValue += cost.previousCost * product.inventory;
        }

        if (options.includeHistory) {
          const history = await ProductCostModel.getCostHistory(cost.productId, cost.supplierId, merchantId, 12);
          productData.costHistory = history.map((h) => ({
            date: h.lastUpdated,
            cost: h.costPrice,
          }));
        }

        products.push(productData as typeof products[0]);
        totalCurrentValue += cost.costPrice * product.inventory;
      }
    }

    return {
      reportDate: new Date(),
      merchantId,
      products,
      summary: {
        totalProducts: products.length,
        totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
        totalPreviousValue: Math.round(totalPreviousValue * 100) / 100,
        netChange: Math.round((totalCurrentValue - totalPreviousValue) * 100) / 100,
      },
    };
  }
}
