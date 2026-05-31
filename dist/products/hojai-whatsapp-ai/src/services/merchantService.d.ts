import mongoose, { Model } from 'mongoose';
export interface Merchant {
    id?: string;
    _id?: mongoose.Types.ObjectId;
    tenantId: string;
    name: string;
    email: string;
    phone: string;
    businessType: string;
    description: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    whatsappNumber: string;
    whatsappPhoneId: string;
    whatsappAccessToken: string;
    persona: string;
    greeting: string;
    businessHours: {
        open: string;
        close: string;
    };
    language: string;
    features: {
        ordering: boolean;
        booking: boolean;
        payments: boolean;
        feedback: boolean;
    };
    plan: 'trial' | 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'suspended' | 'inactive';
    subscriptionEndsAt: Date;
    apiKey: string;
    webhookSecret: string;
    stats: {
        totalConversations: number;
        totalMessages: number;
        totalOrders: number;
        totalRevenue: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const MerchantModel: mongoose.Model<{
    name: string;
    status: "active" | "inactive" | "suspended";
    tenantId: string;
    email: string;
    phone: string;
    language: string;
    plan: "starter" | "professional" | "enterprise" | "trial";
    businessType: string;
    greeting: string;
    persona: string;
    stats?: {
        totalRevenue: number;
        totalOrders: number;
        totalConversations: number;
        totalMessages: number;
    } | null | undefined;
    address?: string | null | undefined;
    city?: string | null | undefined;
    state?: string | null | undefined;
    features?: {
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        payments: boolean;
    } | null | undefined;
    description?: string | null | undefined;
    apiKey?: string | null | undefined;
    pincode?: string | null | undefined;
    whatsappNumber?: string | null | undefined;
    whatsappPhoneId?: string | null | undefined;
    whatsappAccessToken?: string | null | undefined;
    subscriptionEndsAt?: NativeDate | null | undefined;
    businessHours?: {
        close: string;
        open: string;
    } | null | undefined;
    webhookSecret?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    status: "active" | "inactive" | "suspended";
    tenantId: string;
    email: string;
    phone: string;
    language: string;
    plan: "starter" | "professional" | "enterprise" | "trial";
    businessType: string;
    greeting: string;
    persona: string;
    stats?: {
        totalRevenue: number;
        totalOrders: number;
        totalConversations: number;
        totalMessages: number;
    } | null | undefined;
    address?: string | null | undefined;
    city?: string | null | undefined;
    state?: string | null | undefined;
    features?: {
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        payments: boolean;
    } | null | undefined;
    description?: string | null | undefined;
    apiKey?: string | null | undefined;
    pincode?: string | null | undefined;
    whatsappNumber?: string | null | undefined;
    whatsappPhoneId?: string | null | undefined;
    whatsappAccessToken?: string | null | undefined;
    subscriptionEndsAt?: NativeDate | null | undefined;
    businessHours?: {
        close: string;
        open: string;
    } | null | undefined;
    webhookSecret?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    status: "active" | "inactive" | "suspended";
    tenantId: string;
    email: string;
    phone: string;
    language: string;
    plan: "starter" | "professional" | "enterprise" | "trial";
    businessType: string;
    greeting: string;
    persona: string;
    stats?: {
        totalRevenue: number;
        totalOrders: number;
        totalConversations: number;
        totalMessages: number;
    } | null | undefined;
    address?: string | null | undefined;
    city?: string | null | undefined;
    state?: string | null | undefined;
    features?: {
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        payments: boolean;
    } | null | undefined;
    description?: string | null | undefined;
    apiKey?: string | null | undefined;
    pincode?: string | null | undefined;
    whatsappNumber?: string | null | undefined;
    whatsappPhoneId?: string | null | undefined;
    whatsappAccessToken?: string | null | undefined;
    subscriptionEndsAt?: NativeDate | null | undefined;
    businessHours?: {
        close: string;
        open: string;
    } | null | undefined;
    webhookSecret?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    status: "active" | "inactive" | "suspended";
    tenantId: string;
    email: string;
    phone: string;
    language: string;
    plan: "starter" | "professional" | "enterprise" | "trial";
    businessType: string;
    greeting: string;
    persona: string;
    stats?: {
        totalRevenue: number;
        totalOrders: number;
        totalConversations: number;
        totalMessages: number;
    } | null | undefined;
    address?: string | null | undefined;
    city?: string | null | undefined;
    state?: string | null | undefined;
    features?: {
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        payments: boolean;
    } | null | undefined;
    description?: string | null | undefined;
    apiKey?: string | null | undefined;
    pincode?: string | null | undefined;
    whatsappNumber?: string | null | undefined;
    whatsappPhoneId?: string | null | undefined;
    whatsappAccessToken?: string | null | undefined;
    subscriptionEndsAt?: NativeDate | null | undefined;
    businessHours?: {
        close: string;
        open: string;
    } | null | undefined;
    webhookSecret?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    status: "active" | "inactive" | "suspended";
    tenantId: string;
    email: string;
    phone: string;
    language: string;
    plan: "starter" | "professional" | "enterprise" | "trial";
    businessType: string;
    greeting: string;
    persona: string;
    stats?: {
        totalRevenue: number;
        totalOrders: number;
        totalConversations: number;
        totalMessages: number;
    } | null | undefined;
    address?: string | null | undefined;
    city?: string | null | undefined;
    state?: string | null | undefined;
    features?: {
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        payments: boolean;
    } | null | undefined;
    description?: string | null | undefined;
    apiKey?: string | null | undefined;
    pincode?: string | null | undefined;
    whatsappNumber?: string | null | undefined;
    whatsappPhoneId?: string | null | undefined;
    whatsappAccessToken?: string | null | undefined;
    subscriptionEndsAt?: NativeDate | null | undefined;
    businessHours?: {
        close: string;
        open: string;
    } | null | undefined;
    webhookSecret?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    status: "active" | "inactive" | "suspended";
    tenantId: string;
    email: string;
    phone: string;
    language: string;
    plan: "starter" | "professional" | "enterprise" | "trial";
    businessType: string;
    greeting: string;
    persona: string;
    stats?: {
        totalRevenue: number;
        totalOrders: number;
        totalConversations: number;
        totalMessages: number;
    } | null | undefined;
    address?: string | null | undefined;
    city?: string | null | undefined;
    state?: string | null | undefined;
    features?: {
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        payments: boolean;
    } | null | undefined;
    description?: string | null | undefined;
    apiKey?: string | null | undefined;
    pincode?: string | null | undefined;
    whatsappNumber?: string | null | undefined;
    whatsappPhoneId?: string | null | undefined;
    whatsappAccessToken?: string | null | undefined;
    subscriptionEndsAt?: NativeDate | null | undefined;
    businessHours?: {
        close: string;
        open: string;
    } | null | undefined;
    webhookSecret?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export interface KnowledgeBaseItem {
    id?: string;
    _id?: mongoose.Types.ObjectId;
    tenantId: string;
    merchantId: string;
    category: string;
    question: string;
    answer: string;
    keywords: string[];
    intents: string[];
    confidence: number;
    usageCount: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const KnowledgeBaseModel: Model<KnowledgeBaseItem>;
export declare class MerchantService {
    /**
     * Generate secure API key
     */
    private generateApiKey;
    /**
     * Generate webhook secret
     */
    private generateWebhookSecret;
    /**
     * Create new merchant
     */
    createMerchant(params: {
        name: string;
        email: string;
        phone: string;
        businessType: string;
        whatsappNumber?: string;
        persona?: string;
        city?: string;
    }): Promise<Merchant>;
    /**
     * Get merchant by tenant ID
     */
    getMerchantByTenantId(tenantId: string): Promise<Merchant | null>;
    /**
     * Get merchant by API key
     */
    getMerchantByApiKey(apiKey: string): Promise<Merchant | null>;
    /**
     * Update merchant
     */
    updateMerchant(tenantId: string, updates: Partial<Merchant>): Promise<Merchant | null>;
    /**
     * Get knowledge base for merchant
     */
    getKnowledgeBase(merchantId: string): Promise<KnowledgeBaseItem[]>;
    /**
     * Add knowledge base item
     */
    addKnowledgeItem(params: {
        tenantId: string;
        merchantId: string;
        category: string;
        question: string;
        answer: string;
        keywords?: string[];
        intents?: string[];
    }): Promise<KnowledgeBaseItem>;
    /**
     * Update knowledge base item
     */
    updateKnowledgeItem(id: string, tenantId: string, updates: Partial<KnowledgeBaseItem>): Promise<KnowledgeBaseItem | null>;
    /**
     * Delete knowledge base item
     */
    deleteKnowledgeItem(id: string, tenantId: string): Promise<boolean>;
    /**
     * Search knowledge base
     */
    searchKnowledge(merchantId: string, query: string): Promise<KnowledgeBaseItem[]>;
    /**
     * Increment usage count
     */
    incrementUsage(id: string): Promise<void>;
    /**
     * Get merchant stats
     */
    getStats(tenantId: string): Promise<Merchant['stats']>;
    /**
     * Update stats
     */
    updateStats(tenantId: string, stats: Partial<Merchant['stats']>): Promise<void>;
    /**
     * Validate API key
     */
    validateApiKey(apiKey: string): Promise<Merchant | null>;
}
export declare const merchantService: MerchantService;
//# sourceMappingURL=merchantService.d.ts.map