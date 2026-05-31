/**
 * HOJAI AI Support Agent - Refund Processor Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Process refunds with validation, approval workflow, and tracking
 */
import type { RefundRecord, RefundStatus, RefundProcessInput, RefundPreview } from '../types.js';
/**
 * Preview refund before processing
 */
export declare function previewRefund(orderId: string, customerId: string, reason: string): Promise<RefundPreview>;
/**
 * Process refund
 */
export declare function processRefund(input: RefundProcessInput): Promise<RefundRecord>;
/**
 * Get refund by ID
 */
export declare function getRefundById(refundId: string): Promise<RefundRecord | null>;
/**
 * Get refund by refund number
 */
export declare function getRefundByNumber(refundNumber: string): Promise<RefundRecord | null>;
/**
 * Get refunds by order ID
 */
export declare function getRefundsByOrderId(orderId: string): Promise<RefundRecord[]>;
/**
 * Get refunds by customer ID
 */
export declare function getRefundsByCustomerId(customerId: string): Promise<RefundRecord[]>;
/**
 * Update refund status
 */
export declare function updateRefundStatus(refundId: string, status: RefundStatus, notes?: string, processedBy?: string): Promise<RefundRecord | null>;
/**
 * Approve refund
 */
export declare function approveRefund(refundId: string, approvedBy: string, notes?: string): Promise<RefundRecord | null>;
/**
 * Reject refund
 */
export declare function rejectRefund(refundId: string, rejectedBy: string, reason: string): Promise<RefundRecord | null>;
/**
 * Cancel refund
 */
export declare function cancelRefund(refundId: string, cancelledBy: string, reason: string): Promise<RefundRecord | null>;
/**
 * Get refund statistics
 */
export declare function getRefundStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    processing: number;
    completed: number;
    rejected: number;
    totalAmount: number;
    completedAmount: number;
    avgRefundAmount: number;
    avgProcessingDays: number;
}>;
/**
 * Get reason categories
 */
export declare function getReasonCategories(): string[];
/**
 * Get refund limits for tiers
 */
export declare function getRefundLimits(): Record<string, {
    autoApprove: number;
    requiresApproval: number;
}>;
/**
 * List refunds with filters
 */
export declare function listRefunds(filters: {
    status?: RefundStatus;
    customerId?: string;
    orderId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    refunds: RefundRecord[];
    total: number;
}>;
//# sourceMappingURL=refundService.d.ts.map