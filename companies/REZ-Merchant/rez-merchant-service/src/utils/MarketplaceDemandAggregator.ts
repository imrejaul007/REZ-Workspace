import { PurchaseOrder } from '../models/PurchaseOrder';

export interface DemandSignal {
  category: string;
  city: string;
  merchantCount: number;
  avgMonthlyQuantity: number;
  avgUnitPrice: number;
  lastUpdated: string;
}

const PRIVACY_FLOOR = 5;

// Internal result type from MongoDB aggregation pipeline
interface AggregateResult {
  category?: string;
  city?: string;
  merchantCount: number;
  avgMonthlyQuantity: number;
  avgUnitPrice: number;
  lastUpdated: Date;
}

/**
 * Aggregates anonymised demand signals from purchase orders.
 * No individual merchant data is ever returned — only aggregated counts
 * with a minimum privacy floor of 5 merchants.
 */
export class MarketplaceDemandAggregator {
  /**
   * Returns demand signals for all categories within a given city,
   * filtered to only include buckets with >= PRIVACY_FLOOR merchants.
   */
  async aggregateDemandByCity(city: string): Promise<DemandSignal[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const pipeline = [
      {
        $match: {
          'deliveryAddress.city': { $regex: new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          createdAt: { $gte: thirtyDaysAgo },
          status: { $in: ['confirmed', 'delivered', 'received'] },
        },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: { category: '$items.category', city: '$deliveryAddress.city' },
          merchantIds: { $addToSet: '$merchantId' },
          totalQuantity: { $sum: '$items.quantity' },
          totalUnitPrice: { $sum: '$items.unitPrice' },
          priceCount: { $sum: 1 },
          lastOrder: { $max: '$createdAt' },
        },
      },
      {
        $project: {
          category: '$_id.category',
          city: '$_id.city',
          merchantCount: { $size: '$merchantIds' },
          avgMonthlyQuantity: { $divide: ['$totalQuantity', 1] },
          avgUnitPrice: { $cond: [{ $gt: ['$priceCount', 0] }, { $divide: ['$totalUnitPrice', '$priceCount'] }, 0] },
          lastUpdated: '$lastOrder',
        },
      },
      {
        $match: { merchantCount: { $gte: PRIVACY_FLOOR } },
      },
      { $sort: { merchantCount: -1 } },
    ];

    const results = await PurchaseOrder.aggregate(pipeline) as AggregateResult[];

    return results.map((r) => ({
      category: r.category || 'uncategorised',
      city: r.city || city,
      merchantCount: r.merchantCount,
      avgMonthlyQuantity: Math.round(r.avgMonthlyQuantity),
      avgUnitPrice: parseFloat((r.avgUnitPrice || 0).toFixed(2)),
      lastUpdated: r.lastUpdated ? new Date(r.lastUpdated).toISOString() : new Date().toISOString(),
    }));
  }

  /**
   * Returns demand signals for all cities within a given category,
   * filtered to only include buckets with >= PRIVACY_FLOOR merchants.
   */
  async aggregateDemandByCategory(category: string): Promise<DemandSignal[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const pipeline = [
      {
        $match: {
          'items.category': { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          createdAt: { $gte: thirtyDaysAgo },
          status: { $in: ['confirmed', 'delivered', 'received'] },
        },
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.category': { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        },
      },
      {
        $group: {
          _id: { category: '$items.category', city: '$deliveryAddress.city' },
          merchantIds: { $addToSet: '$merchantId' },
          totalQuantity: { $sum: '$items.quantity' },
          totalUnitPrice: { $sum: '$items.unitPrice' },
          priceCount: { $sum: 1 },
          lastOrder: { $max: '$createdAt' },
        },
      },
      {
        $project: {
          category: '$_id.category',
          city: '$_id.city',
          merchantCount: { $size: '$merchantIds' },
          avgMonthlyQuantity: '$totalQuantity',
          avgUnitPrice: { $cond: [{ $gt: ['$priceCount', 0] }, { $divide: ['$totalUnitPrice', '$priceCount'] }, 0] },
          lastUpdated: '$lastOrder',
        },
      },
      {
        $match: { merchantCount: { $gte: PRIVACY_FLOOR } },
      },
      { $sort: { merchantCount: -1 } },
    ];

    const results = await PurchaseOrder.aggregate(pipeline) as AggregateResult[];

    return results.map((r) => ({
      category: r.category || category,
      city: r.city || 'unknown',
      merchantCount: r.merchantCount,
      avgMonthlyQuantity: Math.round(r.avgMonthlyQuantity),
      avgUnitPrice: parseFloat((r.avgUnitPrice || 0).toFixed(2)),
      lastUpdated: r.lastUpdated ? new Date(r.lastUpdated).toISOString() : new Date().toISOString(),
    }));
  }
}

export const demandAggregator = new MarketplaceDemandAggregator();
