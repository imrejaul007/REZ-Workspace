import crypto from 'crypto';
import { ReturnRequest, Return, ReturnStatus } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class ReturnsCore {
  private returns: Map<string, Return> = new Map();

  createReturn(request: ReturnRequest): Return {
    const id = crypto.randomUUID();
    const returnNumber = `RET${Date.now().toString(36).toUpperCase()}`;

    const returnRecord: Return = {
      id,
      returnNumber,
      orderId: request.orderId,
      itemId: request.itemId,
      reason: request.reason,
      description: request.description,
      status: 'requested',
      refundAmount: request.refundAmount || 0,
      timeline: [{
        status: 'requested',
        timestamp: new Date().toISOString(),
        note: 'Return request submitted'
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.returns.set(id, returnRecord);
    logger.info(`Return created: ${returnNumber}`);

    return returnRecord;
  }

  getReturn(id: string): Return | undefined;
  getReturn(returnNumber: string, byNumber: true): Return | undefined;
  getReturn(idOrNumber: string, byNumber?: boolean): Return | undefined {
    if (byNumber) {
      return Array.from(this.returns.values()).find(r => r.returnNumber === idOrNumber);
    }
    return this.returns.get(idOrNumber);
  }

  getAllReturns(filters?: { status?: ReturnStatus; orderId?: string }): Return[] {
    let results = Array.from(this.returns.values());

    if (filters?.status) {
      results = results.filter(r => r.status === filters.status);
    }
    if (filters?.orderId) {
      results = results.filter(r => r.orderId === filters.orderId);
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  updateStatus(id: string, status: ReturnStatus, note?: string): Return | undefined {
    const returnRecord = this.returns.get(id);
    if (!returnRecord) return undefined;

    returnRecord.status = status;
    returnRecord.updatedAt = new Date().toISOString();
    returnRecord.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      note
    });

    this.returns.set(id, returnRecord);
    logger.info(`Return ${returnRecord.returnNumber} status: ${status}`);

    return returnRecord;
  }

  approveReturn(id: string, refundAmount: number, refundMethod: 'original_payment' | 'store_credit' | 'bank_transfer'): Return | undefined {
    const returnRecord = this.updateStatus(id, 'approved', `Approved with refund amount: ₹${refundAmount}`);
    if (returnRecord) {
      returnRecord.refundAmount = refundAmount;
      returnRecord.refundMethod = refundMethod;
      this.returns.set(id, returnRecord);
    }
    return returnRecord;
  }

  rejectReturn(id: string, reason: string): Return | undefined {
    return this.updateStatus(id, 'rejected', reason);
  }

  schedulePickup(id: string, pickupDate: string, address: Return['pickupAddress']): Return | undefined {
    const returnRecord = this.returns.get(id);
    if (!returnRecord) return undefined;

    returnRecord.pickupDate = pickupDate;
    returnRecord.pickupAddress = address;
    returnRecord.trackingId = `PICK${Date.now().toString(36).toUpperCase()}`;

    return this.updateStatus(id, 'pickup_scheduled', `Pickup scheduled for ${pickupDate}`);
  }

  initiateRefund(id: string): Return | undefined {
    const returnRecord = this.updateStatus(id, 'refund_initiated', 'Refund process started');
    if (returnRecord) {
      returnRecord.status = 'refund_completed';
      returnRecord.timeline.push({
        status: 'refund_completed',
        timestamp: new Date().toISOString(),
        note: `Refund of ₹${returnRecord.refundAmount} processed`
      });
      this.returns.set(id, returnRecord);
    }
    return returnRecord;
  }

  getReturnStats(): {
    total: number;
    byStatus: Record<ReturnStatus, number>;
    totalRefundValue: number;
    avgProcessingDays: number;
  } {
    const returns = Array.from(this.returns.values());
    const byStatus: Record<string, number> = {};
    let totalRefund = 0;

    for (const r of returns) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      if (r.status === 'refund_completed') {
        totalRefund += r.refundAmount;
      }
    }

    const completedReturns = returns.filter(r => r.status === 'refund_completed');
    const avgDays = completedReturns.length > 0
      ? completedReturns.reduce((sum, r) => {
          const created = new Date(r.createdAt).getTime();
          const updated = new Date(r.updatedAt).getTime();
          return sum + (updated - created) / (1000 * 60 * 60 * 24);
        }, 0) / completedReturns.length
      : 0;

    return {
      total: returns.length,
      byStatus: byStatus as Record<ReturnStatus, number>,
      totalRefundValue: totalRefund,
      avgProcessingDays: Math.round(avgDays * 10) / 10
    };
  }
}

export const returnsCore = new ReturnsCore();
