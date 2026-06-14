import { Reconciliation, IReconciliationRecord } from '../models/reconciliationService.js'
import { v4 as uuidv4 } from 'uuid'

export interface OrderData {
  orderId: string
  orderTotal: number
  commission: number
  status: string
}

export interface AggregatorOrderData {
  externalOrderId: string
  orderTotal: number
  commission: number
  status: string
  payoutAmount: number
  payoutDate?: Date
}

export interface ReconciliationResult {
  reconciliationId: string
  status: 'verified' | 'discrepancies_found'
  discrepancies: {
    type: 'missing_local' | 'missing_aggregator' | 'amount_mismatch' | 'commission_mismatch'
    localOrderId?: string
    aggregatorOrderId?: string
    amount?: number
    description: string
  }[]
  settlement: {
    totalLocalOrders: number
    totalAggregatorOrders: number
    totalLocalRevenue: number
    totalAggregatorRevenue: number
    totalCommission: number
    totalPayout: number
    netDiscrepancy: number
  }
}

export class ReconciliationService {
  /**
   * Reconcile local orders against aggregator orders for a period
   */
  async reconcile(
    merchantId: string,
    storeId: string,
    aggregatorId: string,
    startDate: Date,
    endDate: Date,
    localOrders: OrderData[],
    aggregatorOrders: AggregatorOrderData[]
  ): Promise<ReconciliationResult> {
    const discrepancies: ReconciliationResult['discrepancies'] = []

    // Find missing local orders (orders on aggregator but not locally)
    const localOrderIds = new Set(localOrders.map(o => o.orderId))
    for (const aggOrder of aggregatorOrders) {
      if (!localOrderIds.has(aggOrder.externalOrderId)) {
        discrepancies.push({
          type: 'missing_local',
          aggregatorOrderId: aggOrder.externalOrderId,
          amount: aggOrder.orderTotal,
          description: `Order ${aggOrder.externalOrderId} exists on ${aggregatorId} but not in local system (₹${aggOrder.orderTotal})`
        })
      }
    }

    // Find missing aggregator orders (orders locally but not on aggregator)
    const aggOrderIds = new Set(aggregatorOrders.map(o => o.externalOrderId))
    for (const localOrder of localOrders) {
      if (!aggOrderIds.has(localOrder.orderId)) {
        discrepancies.push({
          type: 'missing_aggregator',
          localOrderId: localOrder.orderId,
          amount: localOrder.orderTotal,
          description: `Order ${localOrder.orderId} exists locally but not on ${aggregatorId} (₹${localOrder.orderTotal})`
        })
      }
    }

    // Find amount mismatches
    const localById = new Map(localOrders.map(o => [o.orderId, o]))
    for (const aggOrder of aggregatorOrders) {
      const localOrder = localById.get(aggOrder.externalOrderId)
      if (localOrder) {
        const diff = Math.abs(localOrder.orderTotal - aggOrder.orderTotal)
        if (diff > 1) { // Allow for rounding
          discrepancies.push({
            type: 'amount_mismatch',
            localOrderId: localOrder.orderId,
            aggregatorOrderId: aggOrder.externalOrderId,
            amount: diff,
            description: `Order ${localOrder.orderId}: local=₹${localOrder.orderTotal}, ${aggregatorId}=₹${aggOrder.orderTotal} (diff: ₹${diff})`
          })
        }

        // Commission mismatch
        const commDiff = Math.abs(localOrder.commission - aggOrder.commission)
        if (commDiff > 1) {
          discrepancies.push({
            type: 'commission_mismatch',
            localOrderId: localOrder.orderId,
            aggregatorOrderId: aggOrder.externalOrderId,
            amount: commDiff,
            description: `Commission mismatch for ${localOrder.orderId}: local=₹${localOrder.commission}, ${aggregatorId}=₹${aggOrder.commission}`
          })
        }
      }
    }

    // Calculate settlement summary
    const settlement = {
      totalLocalOrders: localOrders.length,
      totalAggregatorOrders: aggregatorOrders.length,
      totalLocalRevenue: localOrders.reduce((sum, o) => sum + o.orderTotal, 0),
      totalAggregatorRevenue: aggregatorOrders.reduce((sum, o) => sum + o.orderTotal, 0),
      totalCommission: localOrders.reduce((sum, o) => sum + o.commission, 0),
      totalPayout: aggregatorOrders.reduce((sum, o) => sum + o.payoutAmount, 0),
      netDiscrepancy: Math.abs(
        localOrders.reduce((sum, o) => sum + o.orderTotal, 0) -
        aggregatorOrders.reduce((sum, o) => sum + o.payoutAmount, 0)
      )
    }

    // Save reconciliation record
    const reconciliationId = `RECON-${uuidv4().substring(0, 8)}`
    const reconciliation = new Reconciliation({
      reconciliationId,
      merchantId,
      storeId,
      aggregatorId,
      period: { start: startDate, end: endDate },
      localOrders,
      aggregatorOrders,
      discrepancies,
      settlement,
      status: discrepancies.length > 0 ? 'pending' : 'verified'
    })
    await reconciliation.save()

    return {
      reconciliationId,
      status: discrepancies.length > 0 ? 'discrepancies_found' : 'verified',
      discrepancies,
      settlement
    }
  }

  /**
   * Get reconciliation history for a store
   */
  async getHistory(
    merchantId: string,
    storeId: string,
    limit = 30
  ): Promise<IReconciliationRecord[]> {
    return Reconciliation.find({
      merchantId,
      storeId
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()
  }

  /**
   * Get single reconciliation record
   */
  async getRecord(reconciliationId: string): Promise<IReconciliationRecord | null> {
    return Reconciliation.findOne({ reconciliationId })
  }

  /**
   * Update reconciliation status
   */
  async updateStatus(
    reconciliationId: string,
    status: 'verified' | 'disputed' | 'resolved',
    notes?: string
  ): Promise<IReconciliationRecord | null> {
    const update: Record<string, unknown> = { status }
    if (notes) update.notes = notes

    return Reconciliation.findOneAndUpdate(
      { reconciliationId },
      update,
      { new: true }
    )
  }

  /**
   * Get aggregated commission analytics
   */
  async getCommissionAnalytics(
    merchantId: string,
    storeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    byAggregator: Record<string, { orders: number; commission: number; revenue: number }>
    total: { orders: number; commission: number; revenue: number; avgCommissionRate: number }
  }> {
    const records = await Reconciliation.find({
      merchantId,
      storeId,
      'period.start': { $gte: startDate },
      'period.end': { $lte: endDate }
    })

    const byAggregator: Record<string, { orders: number; commission: number; revenue: number }> = {}
    let totalOrders = 0
    let totalCommission = 0
    let totalRevenue = 0

    for (const record of records) {
      if (!byAggregator[record.aggregatorId]) {
        byAggregator[record.aggregatorId] = { orders: 0, commission: 0, revenue: 0 }
      }

      const localOrders = record.localOrders || []
      const aggOrders = record.aggregatorOrders || []

      byAggregator[record.aggregatorId].orders += localOrders.length
      byAggregator[record.aggregatorId].commission += record.settlement.totalCommission
      byAggregator[record.aggregatorId].revenue += record.settlement.totalLocalRevenue

      totalOrders += localOrders.length
      totalCommission += record.settlement.totalCommission
      totalRevenue += record.settlement.totalLocalRevenue
    }

    return {
      byAggregator,
      total: {
        orders: totalOrders,
        commission: totalCommission,
        revenue: totalRevenue,
        avgCommissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0
      }
    }
  }
}

export const reconciliationService = new ReconciliationService()
