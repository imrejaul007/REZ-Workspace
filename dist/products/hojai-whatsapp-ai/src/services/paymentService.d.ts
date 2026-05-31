import { Model } from 'mongoose';
export interface Subscription {
    id: string;
    tenantId: string;
    merchantId: string;
    plan: 'trial' | 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired' | 'past_due';
    razorpaySubscriptionId?: string;
    razorpayCustomerId?: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    limits: {
        conversations: number;
        messages: number;
        aiCalls: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const SubscriptionModel: Model<Subscription>;
export declare class PaymentService {
    private razorpay;
    constructor();
    /**
     * Plan pricing (in INR)
     */
    private readonly plans;
    /**
     * Create subscription for merchant
     */
    createSubscription(params: {
        tenantId: string;
        merchantId: string;
        plan: 'trial' | 'starter' | 'professional' | 'enterprise';
        customerEmail: string;
        customerPhone: string;
    }): Promise<{
        subscriptionId: string;
        clientId: string;
        checkoutUrl?: string;
    }>;
    /**
     * Create Razorpay subscription
     */
    private createRazorpaySubscription;
    /**
     * Get subscription
     */
    getSubscription(tenantId: string): Promise<Subscription | null>;
    /**
     * Cancel subscription
     */
    cancelSubscription(tenantId: string): Promise<boolean>;
    /**
     * Check if merchant has active subscription
     */
    hasActiveSubscription(tenantId: string): Promise<boolean>;
    /**
     * Check usage limits
     */
    checkLimits(tenantId: string, type: 'conversations' | 'messages' | 'aiCalls'): Promise<boolean>;
    /**
     * Increment usage
     */
    incrementUsage(tenantId: string, type: 'conversations' | 'messages' | 'aiCalls'): Promise<void>;
    /**
     * Get limits for plan
     */
    private getLimits;
    /**
     * Handle payment webhook from Razorpay
     */
    handleWebhook(event: string, payload: any): Promise<void>;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=paymentService.d.ts.map