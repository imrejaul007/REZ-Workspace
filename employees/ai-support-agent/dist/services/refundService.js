/**
 * HOJAI AI Support Agent - Refund Processor Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Process refunds with validation, approval workflow, and tracking
 */
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.js';
const logger = createLogger('refund-service');
// In-memory refund storage
const refunds = new Map();
const refundCounter = new Map();
/**
 * Refund limits by customer tier
 */
const REFUND_LIMITS = {
    standard: { autoApprove: 1000, requiresApproval: 10000 },
    premium: { autoApprove: 5000, requiresApproval: 25000 },
    enterprise: { autoApprove: 10000, requiresApproval: 100000 },
};
/**
 * Refund reason categories
 */
const REASON_CATEGORIES = [
    'defective_product',
    'wrong_item',
    'not_as_described',
    'changed_mind',
    'late_delivery',
    'damaged_in_transit',
    'duplicate_order',
    'billing_error',
    'service_not_rendered',
    'other',
];
/**
 * Generate refund number
 */
function generateRefundNumber(tenantId) {
    const count = (refundCounter.get(tenantId) || 0) + 1;
    refundCounter.set(tenantId, count);
    const prefix = 'REF';
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    return `${prefix}-${tenantId.slice(0, 4).toUpperCase()}-${year}${month}-${count.toString().padStart(6, '0')}`;
}
/**
 * Calculate refund breakdown
 */
function calculateBreakdown(type, items, _customerTier = 'standard') {
    let subtotal = 0;
    let tax = 0;
    let shipping = 0;
    let discount = 0;
    if (type === 'full' || !items) {
        // Simulate full order values
        subtotal = 5000;
        tax = 500;
        shipping = 49;
        discount = 200;
    }
    else {
        // Calculate from items
        for (const item of items) {
            subtotal += item.refundAmount;
        }
        // Proportional tax
        tax = Math.round(subtotal * 0.1);
    }
    let total = subtotal + tax;
    if (type === 'full') {
        total += shipping;
        total -= discount;
    }
    else {
        // Partial refunds don't refund shipping unless all items returned
        // Discounts are proportionally reduced
        const proportion = subtotal / (subtotal + discount || 1);
        discount = Math.round(discount * proportion);
        total = subtotal + tax - discount;
    }
    return {
        subtotal: Math.max(0, subtotal),
        tax: Math.max(0, tax),
        shipping: type === 'full' ? Math.max(0, shipping) : 0,
        discount: Math.max(0, discount),
        total: Math.max(0, total),
        items: items || [],
    };
}
/**
 * Validate refund eligibility
 */
async function validateRefundEligibility(orderId, _customerId) {
    // Check if order exists (in production, call order service)
    // For now, simulate order validation
    // Check if refund already exists for this order
    for (const refund of refunds.values()) {
        if (refund.orderId === orderId) {
            if (refund.status === 'completed') {
                return { eligible: false, reason: 'A refund has already been processed for this order' };
            }
            if (refund.status === 'processing' || refund.status === 'approved') {
                return { eligible: false, reason: 'A refund is already in progress for this order' };
            }
        }
    }
    // Check order age (30 days policy)
    // In production, get actual order date
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - 15); // Simulate 15 days ago
    const daysSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    const maxRefundDays = 30;
    if (daysSinceOrder > maxRefundDays) {
        return {
            eligible: false,
            reason: `Refunds can only be processed within ${maxRefundDays} days of purchase. This order is ${daysSinceOrder} days old.`,
        };
    }
    return { eligible: true };
}
/**
 * Preview refund before processing
 */
export async function previewRefund(orderId, customerId, reason) {
    logger.info('preview_refund', { orderId, customerId, reason });
    const eligibility = await validateRefundEligibility(orderId, customerId);
    if (!eligibility.eligible) {
        return {
            eligible: false,
            reason: eligibility.reason,
            breakdown: calculateBreakdown('full'),
            estimatedProcessingDays: 0,
            paymentMethod: 'original',
        };
    }
    const breakdown = calculateBreakdown('full');
    // Determine processing time based on amount and method
    let estimatedDays = 5;
    if (breakdown.total > 10000) {
        estimatedDays = 7;
    }
    return {
        eligible: true,
        breakdown,
        estimatedProcessingDays: estimatedDays,
        paymentMethod: 'original',
    };
}
/**
 * Process refund
 */
export async function processRefund(input) {
    logger.info('process_refund', {
        orderId: input.orderId,
        customerId: input.customerId,
        type: input.type,
        reason: input.reason,
    });
    // Validate eligibility
    const eligibility = await validateRefundEligibility(input.orderId, input.customerId);
    if (!eligibility.eligible) {
        throw new Error(`Refund not eligible: ${eligibility.reason}`);
    }
    // Calculate breakdown
    const breakdown = calculateBreakdown(input.type, input.items, 'standard');
    if (breakdown.total <= 0) {
        throw new Error('Invalid refund amount');
    }
    // Determine approval status based on amount
    const customerTier = input.metadata?.tier || 'standard';
    const limits = REFUND_LIMITS[customerTier] || REFUND_LIMITS.standard;
    let status = 'pending';
    if (breakdown.total <= limits.autoApprove) {
        status = 'approved';
    }
    else if (breakdown.total <= limits.requiresApproval) {
        status = 'pending';
    }
    else {
        status = 'pending'; // Requires escalation for very large refunds
    }
    const id = uuidv4();
    const refundNumber = generateRefundNumber(input.customerId.slice(0, 4));
    const refund = {
        id,
        refundNumber,
        ticketId: input.ticketId,
        orderId: input.orderId,
        customerId: input.customerId,
        customerEmail: input.customerEmail,
        type: input.type,
        reason: input.reason,
        reasonCategory: input.reasonCategory,
        amount: breakdown.total,
        breakdown,
        status,
        paymentMethod: input.paymentMethod || 'original',
        notes: input.notes,
        metadata: input.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    refunds.set(id, refund);
    logger.info('refund_processed', {
        refundId: id,
        refundNumber,
        status,
        amount: breakdown.total,
    });
    // Auto-process if approved
    if (status === 'approved') {
        await completeRefund(id);
    }
    return refund;
}
/**
 * Get refund by ID
 */
export async function getRefundById(refundId) {
    return refunds.get(refundId) || null;
}
/**
 * Get refund by refund number
 */
export async function getRefundByNumber(refundNumber) {
    for (const refund of refunds.values()) {
        if (refund.refundNumber === refundNumber) {
            return refund;
        }
    }
    return null;
}
/**
 * Get refunds by order ID
 */
export async function getRefundsByOrderId(orderId) {
    const orderRefunds = [];
    for (const refund of refunds.values()) {
        if (refund.orderId === orderId) {
            orderRefunds.push(refund);
        }
    }
    return orderRefunds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
/**
 * Get refunds by customer ID
 */
export async function getRefundsByCustomerId(customerId) {
    const customerRefunds = [];
    for (const refund of refunds.values()) {
        if (refund.customerId === customerId) {
            customerRefunds.push(refund);
        }
    }
    return customerRefunds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
/**
 * Update refund status
 */
export async function updateRefundStatus(refundId, status, notes, processedBy) {
    const refund = refunds.get(refundId);
    if (!refund) {
        logger.warn('refund_not_found', { refundId });
        return null;
    }
    refund.status = status;
    refund.updatedAt = new Date().toISOString();
    if (notes) {
        refund.notes = `${refund.notes || ''}\n${notes}`.trim();
    }
    if (processedBy) {
        refund.processedBy = processedBy;
    }
    if (status === 'processing') {
        refund.processedAt = new Date().toISOString();
    }
    if (status === 'completed') {
        refund.completedAt = new Date().toISOString();
    }
    logger.info('refund_status_updated', { refundId, status });
    return refund;
}
/**
 * Approve refund
 */
export async function approveRefund(refundId, approvedBy, notes) {
    const refund = refunds.get(refundId);
    if (!refund) {
        logger.warn('refund_not_found', { refundId });
        return null;
    }
    if (refund.status !== 'pending') {
        throw new Error(`Cannot approve refund in status: ${refund.status}`);
    }
    const result = await updateRefundStatus(refundId, 'approved', notes, approvedBy);
    // Auto-process approved refunds
    if (result) {
        setTimeout(() => completeRefund(refundId), 1000);
    }
    return result;
}
/**
 * Reject refund
 */
export async function rejectRefund(refundId, rejectedBy, reason) {
    const refund = refunds.get(refundId);
    if (!refund) {
        logger.warn('refund_not_found', { refundId });
        return null;
    }
    if (refund.status !== 'pending') {
        throw new Error(`Cannot reject refund in status: ${refund.status}`);
    }
    logger.info('refund_rejected', { refundId, rejectedBy, reason });
    return updateRefundStatus(refundId, 'rejected', `Rejected: ${reason}`, rejectedBy);
}
/**
 * Complete refund (process payment)
 */
async function completeRefund(refundId) {
    const refund = refunds.get(refundId);
    if (!refund) {
        logger.warn('refund_not_found', { refundId });
        return null;
    }
    try {
        // Update status to processing
        await updateRefundStatus(refundId, 'processing');
        // Simulate payment processing
        // In production, call actual payment gateway
        await new Promise(resolve => setTimeout(resolve, 500));
        // Generate refund payment ID
        const refundPaymentId = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        // Update refund record
        refund.refundPaymentId = refundPaymentId;
        refund.status = 'completed';
        refund.completedAt = new Date().toISOString();
        refund.updatedAt = new Date().toISOString();
        logger.info('refund_completed', {
            refundId,
            refundNumber: refund.refundNumber,
            amount: refund.amount,
            paymentId: refundPaymentId,
        });
        return refund;
    }
    catch (error) {
        logger.error('refund_completion_failed', {
            refundId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Revert to approved status
        await updateRefundStatus(refundId, 'approved', 'Processing failed, will retry');
        throw error;
    }
}
/**
 * Cancel refund
 */
export async function cancelRefund(refundId, cancelledBy, reason) {
    const refund = refunds.get(refundId);
    if (!refund) {
        logger.warn('refund_not_found', { refundId });
        return null;
    }
    if (['completed', 'rejected'].includes(refund.status)) {
        throw new Error(`Cannot cancel refund in status: ${refund.status}`);
    }
    logger.info('refund_cancelled', { refundId, cancelledBy, reason });
    return updateRefundStatus(refundId, 'rejected', `Cancelled: ${reason}`, cancelledBy);
}
/**
 * Get refund statistics
 */
export async function getRefundStats() {
    let total = 0;
    let pending = 0;
    let approved = 0;
    let processing = 0;
    let completed = 0;
    let rejected = 0;
    let totalAmount = 0;
    let completedAmount = 0;
    let processingDaysSum = 0;
    let completedCount = 0;
    for (const refund of refunds.values()) {
        total++;
        totalAmount += refund.amount;
        switch (refund.status) {
            case 'pending':
                pending++;
                break;
            case 'approved':
                approved++;
                break;
            case 'processing':
                processing++;
                break;
            case 'completed':
                completed++;
                completedAmount += refund.amount;
                completedCount++;
                if (refund.completedAt && refund.createdAt) {
                    const days = Math.floor((new Date(refund.completedAt).getTime() - new Date(refund.createdAt).getTime()) /
                        (1000 * 60 * 60 * 24));
                    processingDaysSum += days;
                }
                break;
            case 'rejected':
                rejected++;
                break;
        }
    }
    return {
        total,
        pending,
        approved,
        processing,
        completed,
        rejected,
        totalAmount,
        completedAmount,
        avgRefundAmount: total > 0 ? totalAmount / total : 0,
        avgProcessingDays: completedCount > 0 ? processingDaysSum / completedCount : 0,
    };
}
/**
 * Get reason categories
 */
export function getReasonCategories() {
    return REASON_CATEGORIES;
}
/**
 * Get refund limits for tiers
 */
export function getRefundLimits() {
    return { ...REFUND_LIMITS };
}
/**
 * List refunds with filters
 */
export async function listRefunds(filters) {
    let filteredRefunds = Array.from(refunds.values());
    // Apply filters
    if (filters.status) {
        filteredRefunds = filteredRefunds.filter(r => r.status === filters.status);
    }
    if (filters.customerId) {
        filteredRefunds = filteredRefunds.filter(r => r.customerId === filters.customerId);
    }
    if (filters.orderId) {
        filteredRefunds = filteredRefunds.filter(r => r.orderId === filters.orderId);
    }
    if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredRefunds = filteredRefunds.filter(r => new Date(r.createdAt) >= startDate);
    }
    if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredRefunds = filteredRefunds.filter(r => new Date(r.createdAt) <= endDate);
    }
    // Sort by createdAt descending
    filteredRefunds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = filteredRefunds.length;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const start = (page - 1) * pageSize;
    const paginatedRefunds = filteredRefunds.slice(start, start + pageSize);
    return { refunds: paginatedRefunds, total };
}
//# sourceMappingURL=refundService.js.map