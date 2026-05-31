/**
 * REZ Ecosystem Service
 *
 * Connects WhatsApp AI to RABTUL services:
 * - Auth (4002)
 * - Wallet (4004)
 * - Notifications (4011)
 * - Payments (4001)
 * - Loyalty (RABTUL)
 */
export declare class REZService {
    private authUrl;
    private walletUrl;
    private notifyUrl;
    private paymentUrl;
    private internalToken;
    constructor();
    private getHeaders;
    /**
     * Verify JWT token
     */
    verifyToken(token: string): Promise<{
        valid: boolean;
        userId?: string;
        phone?: string;
    }>;
    /**
     * Get user profile
     */
    getUserProfile(userId: string): Promise<any | null>;
    /**
     * Get wallet balance
     */
    getWalletBalance(userId: string): Promise<number>;
    /**
     * Add cashback to wallet
     */
    addCashback(params: {
        userId: string;
        amount: number;
        source: string;
        merchantId: string;
    }): Promise<boolean>;
    /**
     * Deduct from wallet
     */
    deductWallet(params: {
        userId: string;
        amount: number;
        source: string;
        merchantId: string;
    }): Promise<boolean>;
    /**
     * Send notification
     */
    sendNotification(params: {
        userId?: string;
        phone?: string;
        channel: 'whatsapp' | 'sms' | 'push' | 'email';
        template: string;
        variables?: Record<string, string>;
    }): Promise<boolean>;
    /**
     * Send WhatsApp message
     */
    sendWhatsApp(params: {
        phone: string;
        message: string;
        merchantId?: string;
    }): Promise<boolean>;
    /**
     * Get loyalty points
     */
    getLoyaltyPoints(userId: string): Promise<{
        points: number;
        tier: string;
    }>;
    /**
     * Add loyalty points
     */
    addLoyaltyPoints(params: {
        userId: string;
        points: number;
        source: string;
        merchantId: string;
    }): Promise<boolean>;
    /**
     * Link user to merchant
     */
    linkUserToMerchant(params: {
        userId: string;
        merchantId: string;
        phone: string;
    }): Promise<boolean>;
    /**
     * Get user's merchant interactions
     */
    getUserMerchants(userId: string): Promise<string[]>;
    /**
     * Get user context for AI personalization
     */
    getUserContext(userId: string): Promise<{
        profile: any;
        wallet: {
            points: number;
            balance: number;
            tier: string;
        };
        loyalty: {
            points: number;
            tier: string;
        };
        merchants: string[];
        preferences?: any;
    }>;
}
export declare const rezService: REZService;
//# sourceMappingURL=rezService.d.ts.map