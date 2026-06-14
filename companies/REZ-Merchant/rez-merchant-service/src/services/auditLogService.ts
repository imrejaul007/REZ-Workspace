/**
 * Audit Log Service
 *
 * Tracks all B2B operations for compliance and debugging:
 * - Supplier changes
 * - PO approvals/rejections
 * - Payment recordings
 * - Credit limit changes
 */

import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'supplier.created'
  | 'supplier.updated'
  | 'supplier.deleted'
  | 'supplier.credit_changed'
  | 'po.created'
  | 'po.approved'
  | 'po.rejected'
  | 'po.confirmed'
  | 'po.cancelled'
  | 'po.received'
  | 'payment.recorded'
  | 'payment.approved'
  | 'credit_limit.changed'
  | 'user.login'
  | 'user.logout';

export interface AuditEntry {
  merchantId: string;
  userId?: string;
  action: AuditAction;
  entityType: 'supplier' | 'purchase_order' | 'payment' | 'credit_line' | 'user';
  entityId?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// ── Audit Log Function ────────────────────────────────────────────────────────

export async function createAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await AuditLog.create({
      merchantId: new Types.ObjectId(entry.merchantId),
      userId: entry.userId ? new Types.ObjectId(entry.userId) : undefined,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ? new Types.ObjectId(entry.entityId) : undefined,
      changes: entry.changes,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      timestamp: new Date(),
    });

    logger.debug(`[Audit] ${entry.action} on ${entry.entityType}`, {
      merchantId: entry.merchantId,
      entityId: entry.entityId,
    });
  } catch (err) {
    // Don't fail the main operation if audit logging fails
    logger.error('[Audit] Failed to create audit log', { error: err, entry });
  }
}

// ── Audit Query Functions ─────────────────────────────────────────────────────

export async function getAuditLogs(
  merchantId: string,
  options: {
    entityType?: string;
    entityId?: string;
    action?: string;
    userId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    page?: number;
  } = {}
): Promise<{
  logs: unknown[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const query: unknown = { merchantId: new Types.ObjectId(merchantId) };

  if (options.entityType) query.entityType = options.entityType;
  if (options.entityId) query.entityId = new Types.ObjectId(options.entityId);
  if (options.action) query.action = options.action;
  if (options.userId) query.userId = new Types.ObjectId(options.userId);

  if (options.from || options.to) {
    query.timestamp = {};
    if (options.from) query.timestamp.$gte = options.from;
    if (options.to) query.timestamp.$lte = options.to;
  }

  const limit = options.limit || 50;
  const page = options.page || 1;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ── Change Tracking Helper ─────────────────────────────────────────────────────

export function trackChanges<T extends Record<string, unknown>>(
  oldObj: T,
  newObj: Partial<T>
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  for (const key of Object.keys(newObj)) {
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = { from: oldValue, to: newValue };
    }
  }

  return changes;
}

// ── Pre-built Audit Log Functions ─────────────────────────────────────────────

export async function auditSupplierCreated(
  merchantId: string,
  userId: string,
  supplierId: string,
  supplierData: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    merchantId,
    userId,
    action: 'supplier.created',
    entityType: 'supplier',
    entityId: supplierId,
    metadata: supplierData,
  });
}

export async function auditSupplierUpdated(
  merchantId: string,
  userId: string,
  supplierId: string,
  changes: Record<string, { from: unknown; to: unknown }>
): Promise<void> {
  await createAuditLog({
    merchantId,
    userId,
    action: 'supplier.updated',
    entityType: 'supplier',
    entityId: supplierId,
    changes,
  });
}

export async function auditPOApproved(
  merchantId: string,
  userId: string,
  poId: string,
  poNumber: string
): Promise<void> {
  await createAuditLog({
    merchantId,
    userId,
    action: 'po.approved',
    entityType: 'purchase_order',
    entityId: poId,
    metadata: { poNumber },
  });
}

export async function auditPORejected(
  merchantId: string,
  userId: string,
  poId: string,
  poNumber: string,
  reason: string
): Promise<void> {
  await createAuditLog({
    merchantId,
    userId,
    action: 'po.rejected',
    entityType: 'purchase_order',
    entityId: poId,
    metadata: { poNumber, reason },
  });
}

export async function auditPaymentRecorded(
  merchantId: string,
  userId: string,
  paymentId: string,
  amount: number,
  supplierName: string
): Promise<void> {
  await createAuditLog({
    merchantId,
    userId,
    action: 'payment.recorded',
    entityType: 'payment',
    entityId: paymentId,
    metadata: { amount, supplierName },
  });
}

export async function auditCreditLimitChanged(
  merchantId: string,
  userId: string,
  supplierId: string,
  oldLimit: number,
  newLimit: number,
  supplierName: string
): Promise<void> {
  await createAuditLog({
    merchantId,
    userId,
    action: 'credit_limit.changed',
    entityType: 'credit_line',
    entityId: supplierId,
    changes: {
      creditLimit: { from: oldLimit, to: newLimit },
    },
    metadata: { supplierName },
  });
}
