/**
 * HOJAI AI Support Agent - Type Definitions
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: 24x7 customer support with ticket resolution, FAQ, escalation routing, warranty verification, and refund processing
 *
 * Tagline: "AI-powered support that resolves issues instantly, 24 hours a day."
 */
import { z } from 'zod';
// ============================================================================
// Zod Schemas for Validation
// ============================================================================
// Ticket Schemas
export const CreateTicketSchema = z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    customerName: z.string().min(1, 'Customer name is required'),
    customerEmail: z.string().email('Invalid email format'),
    subject: z.string().min(1, 'Subject is required').max(500, 'Subject too long'),
    description: z.string().min(1, 'Description is required').max(10000, 'Description too long'),
    category: z.enum(['billing', 'technical', 'account', 'product', 'shipping', 'returns', 'refund', 'warranty', 'general']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    attachments: z.array(z.object({
        id: z.string(),
        name: z.string(),
        url: z.string(),
        type: z.string(),
        size: z.number(),
        uploadedAt: z.string(),
    })).optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.unknown()).optional(),
});
export const TicketQuerySchema = z.object({
    status: z.enum(['open', 'pending', 'in_progress', 'resolved', 'closed', 'escalated']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    category: z.enum(['billing', 'technical', 'account', 'product', 'shipping', 'returns', 'refund', 'warranty', 'general']).optional(),
    customerId: z.string().optional(),
    assignedTo: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
});
export const ResolveTicketSchema = z.object({
    resolution: z.object({
        summary: z.string().min(1, 'Resolution summary is required'),
        resolvedBy: z.string().min(1, 'Resolved by is required'),
        rating: z.number().min(1).max(5).optional(),
        feedback: z.string().max(1000).optional(),
    }),
});
export const AddMessageSchema = z.object({
    content: z.string().min(1, 'Message content is required').max(5000),
    attachments: z.array(z.object({
        id: z.string(),
        name: z.string(),
        url: z.string(),
        type: z.string(),
        size: z.number(),
        uploadedAt: z.string(),
    })).optional(),
});
// Escalation Schemas
export const EscalateSchema = z.object({
    ticketId: z.string().min(1, 'Ticket ID is required'),
    reason: z.enum([
        'customer_request',
        'priority_upgrade',
        'sla_breach',
        'complex_issue',
        'sentiment_negative',
        'repeated_issue',
        'refund_exceeds_limit',
        'management_review',
    ]),
    notes: z.string().max(1000).optional(),
    targetLevel: z.enum(['level1', 'level2', 'level3', 'management']).optional(),
    targetTeam: z.string().optional(),
});
// Warranty Schemas
export const WarrantyCheckSchema = z.object({
    productId: z.string().optional(),
    serialNumber: z.string().optional(),
    orderId: z.string().optional(),
    customerId: z.string().optional(),
}).refine(data => data.productId || data.serialNumber || data.orderId || data.customerId, {
    message: 'At least one search parameter is required',
});
export const WarrantyClaimSchema = z.object({
    warrantyId: z.string().min(1, 'Warranty ID is required'),
    ticketId: z.string().optional(),
    claimType: z.enum(['repair', 'replacement', 'refund']),
    description: z.string().min(1, 'Claim description is required').max(2000),
});
// Refund Schemas
export const RefundProcessSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    customerId: z.string().min(1, 'Customer ID is required'),
    customerEmail: z.string().email('Invalid email format'),
    type: z.enum(['full', 'partial', 'store_credit']),
    reason: z.string().min(1, 'Refund reason is required').max(500),
    reasonCategory: z.string().optional(),
    items: z.array(z.object({
        itemId: z.string(),
        productId: z.string(),
        productName: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        refundAmount: z.number().min(0),
    })).optional(),
    ticketId: z.string().optional(),
    paymentMethod: z.string().optional(),
    notes: z.string().max(1000).optional(),
    metadata: z.record(z.unknown()).optional(),
});
export const RefundPreviewSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    customerId: z.string().min(1, 'Customer ID is required'),
    reason: z.string().min(1, 'Reason is required'),
});
// FAQ Schemas
export const CreateFAQSchema = z.object({
    question: z.string().min(1, 'Question is required').max(500),
    answer: z.string().min(1, 'Answer is required').max(5000),
    category: z.enum(['getting-started', 'billing', 'technical', 'account', 'products', 'shipping', 'returns', 'warranty', 'general']),
    tags: z.array(z.string()).optional(),
    relatedFAQs: z.array(z.string()).optional(),
    metadata: z.record(z.unknown()).optional(),
});
export const FAQSearchSchema = z.object({
    query: z.string().min(1, 'Search query is required').max(200),
    category: z.enum(['getting-started', 'billing', 'technical', 'account', 'products', 'shipping', 'returns', 'warranty', 'general']).optional(),
    limit: z.coerce.number().min(1).max(20).default(10),
});
//# sourceMappingURL=types.js.map