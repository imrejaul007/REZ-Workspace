/**
 * HOJAI AI Support Agent - Type Definitions
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: 24x7 customer support with ticket resolution, FAQ, escalation routing, warranty verification, and refund processing
 *
 * Tagline: "AI-powered support that resolves issues instantly, 24 hours a day."
 */
import { z } from 'zod';
/**
 * Ticket priority levels
 */
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
/**
 * Ticket status
 */
export type TicketStatus = 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
/**
 * Ticket category
 */
export type TicketCategory = 'billing' | 'technical' | 'account' | 'product' | 'shipping' | 'returns' | 'refund' | 'warranty' | 'general';
/**
 * Escalation level
 */
export type EscalationLevel = 'level1' | 'level2' | 'level3' | 'management';
/**
 * Warranty status
 */
export type WarrantyStatus = 'active' | 'expired' | 'limited' | 'void';
/**
 * Refund status
 */
export type RefundStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
/**
 * Refund type
 */
export type RefundType = 'full' | 'partial' | 'store_credit';
/**
 * Customer tier for support priority
 */
export type CustomerTier = 'standard' | 'premium' | 'enterprise';
/**
 * FAQ category
 */
export type FAQCategory = 'getting-started' | 'billing' | 'technical' | 'account' | 'products' | 'shipping' | 'returns' | 'warranty' | 'general';
/**
 * Ticket attachment
 */
export interface TicketAttachment {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
}
/**
 * Ticket message/comment
 */
export interface TicketMessage {
    id: string;
    ticketId: string;
    authorId: string;
    authorType: 'customer' | 'agent' | 'system';
    content: string;
    attachments?: TicketAttachment[];
    createdAt: string;
    updatedAt?: string;
}
/**
 * Ticket assignment
 */
export interface TicketAssignment {
    agentId?: string;
    agentName?: string;
    team?: string;
    assignedAt?: string;
}
/**
 * Ticket SLA
 */
export interface TicketSLA {
    firstResponseDue: string;
    resolutionDue: string;
    breached: boolean;
    breachedAt?: string;
}
/**
 * Support ticket
 */
export interface SupportTicket {
    id: string;
    ticketNumber: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerTier: CustomerTier;
    subject: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    assignedTo?: TicketAssignment;
    sla?: TicketSLA;
    tags?: string[];
    messages: TicketMessage[];
    relatedTicketIds?: string[];
    resolution?: {
        summary: string;
        resolvedBy: string;
        resolvedAt: string;
        rating?: number;
        feedback?: string;
    };
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    closedAt?: string;
}
/**
 * Create ticket input
 */
export interface CreateTicketInput {
    customerId: string;
    customerName: string;
    customerEmail: string;
    subject: string;
    description: string;
    category: TicketCategory;
    priority?: TicketPriority;
    attachments?: TicketAttachment[];
    tags?: string[];
    metadata?: Record<string, unknown>;
}
/**
 * FAQ item
 */
export interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: FAQCategory;
    tags: string[];
    helpful: number;
    notHelpful: number;
    views: number;
    relatedFAQs?: string[];
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}
/**
 * FAQ search result
 */
export interface FAQSearchResult {
    faq: FAQItem;
    relevanceScore: number;
    matchedTerms: string[];
    snippet: string;
}
/**
 * Create FAQ input
 */
export interface CreateFAQInput {
    question: string;
    answer: string;
    category: FAQCategory;
    tags?: string[];
    relatedFAQs?: string[];
    metadata?: Record<string, unknown>;
}
/**
 * Escalation reason
 */
export type EscalationReason = 'customer_request' | 'priority_upgrade' | 'sla_breach' | 'complex_issue' | 'sentiment_negative' | 'repeated_issue' | 'refund_exceeds_limit' | 'management_review';
/**
 * Escalation target
 */
export interface EscalationTarget {
    level: EscalationLevel;
    team?: string;
    agentId?: string;
    agentName?: string;
    reason: EscalationReason;
    notes?: string;
}
/**
 * Escalation record
 */
export interface Escalation {
    id: string;
    ticketId: string;
    fromLevel?: EscalationLevel;
    toLevel: EscalationLevel;
    targetTeam?: string;
    targetAgentId?: string;
    targetAgentName?: string;
    reason: EscalationReason;
    notes?: string;
    escalatedBy: string;
    escalatedAt: string;
    resolvedAt?: string;
    status: 'pending' | 'accepted' | 'resolved' | 'rejected';
}
/**
 * Escalation input
 */
export interface EscalateInput {
    ticketId: string;
    reason: EscalationReason;
    notes?: string;
    targetLevel?: EscalationLevel;
    targetTeam?: string;
}
/**
 * Warranty coverage
 */
export interface WarrantyCoverage {
    type: 'standard' | 'extended' | 'limited';
    startDate: string;
    endDate: string;
    coveredParts?: string[];
    excludedParts?: string[];
    termsUrl?: string;
}
/**
 * Warranty claim
 */
export interface WarrantyClaim {
    id: string;
    warrantyId: string;
    ticketId?: string;
    claimType: 'repair' | 'replacement' | 'refund';
    description: string;
    status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
    resolution?: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
}
/**
 * Warranty record
 */
export interface WarrantyRecord {
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    serialNumber?: string;
    purchaseDate: string;
    customerId: string;
    customerEmail: string;
    status: WarrantyStatus;
    coverage: WarrantyCoverage;
    claims?: WarrantyClaim[];
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}
/**
 * Warranty check input
 */
export interface WarrantyCheckInput {
    productId?: string;
    serialNumber?: string;
    orderId?: string;
    customerId?: string;
}
/**
 * Warranty check result
 */
export interface WarrantyCheckResult {
    found: boolean;
    warranty?: WarrantyRecord;
    eligible: boolean;
    reason?: string;
}
/**
 * Refund item
 */
export interface RefundItem {
    itemId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    refundAmount: number;
}
/**
 * Refund breakdown
 */
export interface RefundBreakdown {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    items: RefundItem[];
}
/**
 * Refund record
 */
export interface RefundRecord {
    id: string;
    refundNumber: string;
    ticketId?: string;
    orderId: string;
    customerId: string;
    customerEmail: string;
    type: RefundType;
    reason: string;
    reasonCategory?: string;
    amount: number;
    breakdown: RefundBreakdown;
    status: RefundStatus;
    paymentMethod: string;
    originalPaymentId?: string;
    refundPaymentId?: string;
    processedBy?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    processedAt?: string;
    completedAt?: string;
}
/**
 * Refund process input
 */
export interface RefundProcessInput {
    orderId: string;
    customerId: string;
    customerEmail: string;
    type: RefundType;
    reason: string;
    reasonCategory?: string;
    items?: RefundItem[];
    ticketId?: string;
    paymentMethod?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Refund preview
 */
export interface RefundPreview {
    eligible: boolean;
    reason?: string;
    breakdown: RefundBreakdown;
    estimatedProcessingDays: number;
    paymentMethod: string;
}
/**
 * Customer interaction
 */
export interface CustomerInteraction {
    id: string;
    type: 'ticket' | 'faq_view' | 'chat' | 'call' | 'email';
    summary: string;
    referenceId?: string;
    createdAt: string;
}
/**
 * Customer ticket summary
 */
export interface CustomerTicketSummary {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    averageResolutionTime: number;
    satisfactionScore?: number;
}
/**
 * Customer order summary
 */
export interface CustomerOrderSummary {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: string;
}
/**
 * Customer preferences
 */
export interface CustomerPreferences {
    language: string;
    timezone: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
}
/**
 * Customer profile
 */
export interface CustomerProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    tier: CustomerTier;
    createdAt: string;
    lastActiveAt: string;
    preferences: CustomerPreferences;
    metadata?: Record<string, unknown>;
}
/**
 * Customer history
 */
export interface CustomerHistory {
    profile: CustomerProfile;
    tickets: CustomerTicketSummary;
    orders: CustomerOrderSummary;
    interactions: CustomerInteraction[];
    relatedTickets?: SupportTicket[];
    notes?: string[];
    createdAt: string;
    updatedAt: string;
}
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: {
        timestamp: string;
        requestId: string;
        tenantId?: string;
    };
}
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: {
        timestamp: string;
        requestId: string;
        tenantId?: string;
    };
}
export interface PaginatedResponse<T> extends APIResponse<T[]> {
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        hasMore: boolean;
    };
}
export declare const CreateTicketSchema: z.ZodObject<{
    customerId: z.ZodString;
    customerName: z.ZodString;
    customerEmail: z.ZodString;
    subject: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["billing", "technical", "account", "product", "shipping", "returns", "refund", "warranty", "general"]>;
    priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        url: z.ZodString;
        type: z.ZodString;
        size: z.ZodNumber;
        uploadedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: string;
        id: string;
        url: string;
        size: number;
        uploadedAt: string;
    }, {
        name: string;
        type: string;
        id: string;
        url: string;
        size: number;
        uploadedAt: string;
    }>, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    customerName: string;
    customerEmail: string;
    subject: string;
    description: string;
    category: "billing" | "technical" | "account" | "product" | "shipping" | "returns" | "refund" | "warranty" | "general";
    priority: "low" | "medium" | "high" | "urgent";
    attachments?: {
        name: string;
        type: string;
        id: string;
        url: string;
        size: number;
        uploadedAt: string;
    }[] | undefined;
    tags?: string[] | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    customerId: string;
    customerName: string;
    customerEmail: string;
    subject: string;
    description: string;
    category: "billing" | "technical" | "account" | "product" | "shipping" | "returns" | "refund" | "warranty" | "general";
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    attachments?: {
        name: string;
        type: string;
        id: string;
        url: string;
        size: number;
        uploadedAt: string;
    }[] | undefined;
    tags?: string[] | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const TicketQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["open", "pending", "in_progress", "resolved", "closed", "escalated"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    category: z.ZodOptional<z.ZodEnum<["billing", "technical", "account", "product", "shipping", "returns", "refund", "warranty", "general"]>>;
    customerId: z.ZodOptional<z.ZodString>;
    assignedTo: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    customerId?: string | undefined;
    category?: "billing" | "technical" | "account" | "product" | "shipping" | "returns" | "refund" | "warranty" | "general" | undefined;
    status?: "open" | "pending" | "in_progress" | "resolved" | "closed" | "escalated" | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    assignedTo?: string | undefined;
}, {
    customerId?: string | undefined;
    category?: "billing" | "technical" | "account" | "product" | "shipping" | "returns" | "refund" | "warranty" | "general" | undefined;
    status?: "open" | "pending" | "in_progress" | "resolved" | "closed" | "escalated" | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    assignedTo?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}>;
export declare const ResolveTicketSchema: z.ZodObject<{
    resolution: z.ZodObject<{
        summary: z.ZodString;
        resolvedBy: z.ZodString;
        rating: z.ZodOptional<z.ZodNumber>;
        feedback: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        summary: string;
        resolvedBy: string;
        rating?: number | undefined;
        feedback?: string | undefined;
    }, {
        summary: string;
        resolvedBy: string;
        rating?: number | undefined;
        feedback?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    resolution: {
        summary: string;
        resolvedBy: string;
        rating?: number | undefined;
        feedback?: string | undefined;
    };
}, {
    resolution: {
        summary: string;
        resolvedBy: string;
        rating?: number | undefined;
        feedback?: string | undefined;
    };
}>;
export declare const AddMessageSchema: z.ZodObject<{
    content: z.ZodString;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        url: z.ZodString;
        type: z.ZodString;
        size: z.ZodNumber;
        uploadedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: string;
        id: string;
        url: string;
        size: number;
        uploadedAt: string;
    }, {
        name: string;
        type: string;
        id: string;
        url: string;
        size: number;
        uploadedAt: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    content: string;
    attachments?: {
        name: string;
        type: string;
        id: string;
        url: string;
        size: number;
        uploadedAt: string;
    }[] | undefined;
}, {
    content: string;
    attachments?: {
        name: string;
        type: string;
        id: string;
        url: string;
        size: number;
        uploadedAt: string;
    }[] | undefined;
}>;
export declare const EscalateSchema: z.ZodObject<{
    ticketId: z.ZodString;
    reason: z.ZodEnum<["customer_request", "priority_upgrade", "sla_breach", "complex_issue", "sentiment_negative", "repeated_issue", "refund_exceeds_limit", "management_review"]>;
    notes: z.ZodOptional<z.ZodString>;
    targetLevel: z.ZodOptional<z.ZodEnum<["level1", "level2", "level3", "management"]>>;
    targetTeam: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    ticketId: string;
    reason: "customer_request" | "priority_upgrade" | "sla_breach" | "complex_issue" | "sentiment_negative" | "repeated_issue" | "refund_exceeds_limit" | "management_review";
    notes?: string | undefined;
    targetLevel?: "level1" | "level2" | "level3" | "management" | undefined;
    targetTeam?: string | undefined;
}, {
    ticketId: string;
    reason: "customer_request" | "priority_upgrade" | "sla_breach" | "complex_issue" | "sentiment_negative" | "repeated_issue" | "refund_exceeds_limit" | "management_review";
    notes?: string | undefined;
    targetLevel?: "level1" | "level2" | "level3" | "management" | undefined;
    targetTeam?: string | undefined;
}>;
export declare const WarrantyCheckSchema: z.ZodEffects<z.ZodObject<{
    productId: z.ZodOptional<z.ZodString>;
    serialNumber: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    customerId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customerId?: string | undefined;
    productId?: string | undefined;
    serialNumber?: string | undefined;
    orderId?: string | undefined;
}, {
    customerId?: string | undefined;
    productId?: string | undefined;
    serialNumber?: string | undefined;
    orderId?: string | undefined;
}>, {
    customerId?: string | undefined;
    productId?: string | undefined;
    serialNumber?: string | undefined;
    orderId?: string | undefined;
}, {
    customerId?: string | undefined;
    productId?: string | undefined;
    serialNumber?: string | undefined;
    orderId?: string | undefined;
}>;
export declare const WarrantyClaimSchema: z.ZodObject<{
    warrantyId: z.ZodString;
    ticketId: z.ZodOptional<z.ZodString>;
    claimType: z.ZodEnum<["repair", "replacement", "refund"]>;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    description: string;
    warrantyId: string;
    claimType: "refund" | "repair" | "replacement";
    ticketId?: string | undefined;
}, {
    description: string;
    warrantyId: string;
    claimType: "refund" | "repair" | "replacement";
    ticketId?: string | undefined;
}>;
export declare const RefundProcessSchema: z.ZodObject<{
    orderId: z.ZodString;
    customerId: z.ZodString;
    customerEmail: z.ZodString;
    type: z.ZodEnum<["full", "partial", "store_credit"]>;
    reason: z.ZodString;
    reasonCategory: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        productId: z.ZodString;
        productName: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        refundAmount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        itemId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        refundAmount: number;
    }, {
        productId: string;
        itemId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        refundAmount: number;
    }>, "many">>;
    ticketId: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    customerEmail: string;
    type: "full" | "partial" | "store_credit";
    reason: string;
    orderId: string;
    metadata?: Record<string, unknown> | undefined;
    ticketId?: string | undefined;
    notes?: string | undefined;
    reasonCategory?: string | undefined;
    items?: {
        productId: string;
        itemId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        refundAmount: number;
    }[] | undefined;
    paymentMethod?: string | undefined;
}, {
    customerId: string;
    customerEmail: string;
    type: "full" | "partial" | "store_credit";
    reason: string;
    orderId: string;
    metadata?: Record<string, unknown> | undefined;
    ticketId?: string | undefined;
    notes?: string | undefined;
    reasonCategory?: string | undefined;
    items?: {
        productId: string;
        itemId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        refundAmount: number;
    }[] | undefined;
    paymentMethod?: string | undefined;
}>;
export declare const RefundPreviewSchema: z.ZodObject<{
    orderId: z.ZodString;
    customerId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    reason: string;
    orderId: string;
}, {
    customerId: string;
    reason: string;
    orderId: string;
}>;
export declare const CreateFAQSchema: z.ZodObject<{
    question: z.ZodString;
    answer: z.ZodString;
    category: z.ZodEnum<["getting-started", "billing", "technical", "account", "products", "shipping", "returns", "warranty", "general"]>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    relatedFAQs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    category: "billing" | "technical" | "account" | "shipping" | "returns" | "warranty" | "general" | "getting-started" | "products";
    question: string;
    answer: string;
    tags?: string[] | undefined;
    metadata?: Record<string, unknown> | undefined;
    relatedFAQs?: string[] | undefined;
}, {
    category: "billing" | "technical" | "account" | "shipping" | "returns" | "warranty" | "general" | "getting-started" | "products";
    question: string;
    answer: string;
    tags?: string[] | undefined;
    metadata?: Record<string, unknown> | undefined;
    relatedFAQs?: string[] | undefined;
}>;
export declare const FAQSearchSchema: z.ZodObject<{
    query: z.ZodString;
    category: z.ZodOptional<z.ZodEnum<["getting-started", "billing", "technical", "account", "products", "shipping", "returns", "warranty", "general"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    category?: "billing" | "technical" | "account" | "shipping" | "returns" | "warranty" | "general" | "getting-started" | "products" | undefined;
}, {
    query: string;
    category?: "billing" | "technical" | "account" | "shipping" | "returns" | "warranty" | "general" | "getting-started" | "products" | undefined;
    limit?: number | undefined;
}>;
export type CreateTicketInputType = z.infer<typeof CreateTicketSchema>;
export type TicketQueryInputType = z.infer<typeof TicketQuerySchema>;
export type ResolveTicketInputType = z.infer<typeof ResolveTicketSchema>;
export type AddMessageInputType = z.infer<typeof AddMessageSchema>;
export type EscalateInputType = z.infer<typeof EscalateSchema>;
export type WarrantyCheckInputType = z.infer<typeof WarrantyCheckSchema>;
export type WarrantyClaimInputType = z.infer<typeof WarrantyClaimSchema>;
export type RefundProcessInputType = z.infer<typeof RefundProcessSchema>;
export type RefundPreviewInputType = z.infer<typeof RefundPreviewSchema>;
export type CreateFAQInputType = z.infer<typeof CreateFAQSchema>;
export type FAQSearchInputType = z.infer<typeof FAQSearchSchema>;
export interface TenantContext {
    tenant_id: string;
    namespace: string;
    user_id?: string;
    plan?: 'starter' | 'professional' | 'enterprise';
    roles?: string[];
}
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
            userId?: string;
        }
    }
}
//# sourceMappingURL=types.d.ts.map