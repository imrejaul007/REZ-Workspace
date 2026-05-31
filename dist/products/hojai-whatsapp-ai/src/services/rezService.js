import axios from 'axios';
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
export class REZService {
    authUrl;
    walletUrl;
    notifyUrl;
    paymentUrl;
    internalToken;
    constructor() {
        this.authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
        this.walletUrl = process.env.WALLET_SERVICE_URL || 'http://localhost:4004';
        this.notifyUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
        this.paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001';
        this.internalToken = process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token';
    }
    getHeaders() {
        return {
            'X-Internal-Token': this.internalToken,
            'Content-Type': 'application/json'
        };
    }
    // ============================================================================
    // AUTHENTICATION
    // ============================================================================
    /**
     * Verify JWT token
     */
    async verifyToken(token) {
        try {
            const response = await axios.post(`${this.authUrl}/api/auth/verify`, { token }, { headers: this.getHeaders() });
            return {
                valid: true,
                userId: response.data.userId,
                phone: response.data.phone
            };
        }
        catch (error) {
            return { valid: false };
        }
    }
    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        try {
            const response = await axios.get(`${this.authUrl}/api/users/${userId}`, { headers: this.getHeaders() });
            return response.data;
        }
        catch (error) {
            return null;
        }
    }
    // ============================================================================
    // WALLET
    // ============================================================================
    /**
     * Get wallet balance
     */
    async getWalletBalance(userId) {
        try {
            const response = await axios.get(`${this.walletUrl}/api/wallet/balance/${userId}`, { headers: this.getHeaders() });
            return response.data.balance || 0;
        }
        catch (error) {
            return 0;
        }
    }
    /**
     * Add cashback to wallet
     */
    async addCashback(params) {
        try {
            await axios.post(`${this.walletUrl}/api/wallet/cashback`, params, { headers: this.getHeaders() });
            return true;
        }
        catch (error) {
            console.error('[REZ] Failed to add cashback:', error);
            return false;
        }
    }
    /**
     * Deduct from wallet
     */
    async deductWallet(params) {
        try {
            await axios.post(`${this.walletUrl}/api/wallet/deduct`, params, { headers: this.getHeaders() });
            return true;
        }
        catch (error) {
            console.error('[REZ] Failed to deduct wallet:', error);
            return false;
        }
    }
    // ============================================================================
    // NOTIFICATIONS
    // ============================================================================
    /**
     * Send notification
     */
    async sendNotification(params) {
        try {
            await axios.post(`${this.notifyUrl}/api/notifications/send`, params, { headers: this.getHeaders() });
            return true;
        }
        catch (error) {
            console.error('[REZ] Failed to send notification:', error);
            return false;
        }
    }
    /**
     * Send WhatsApp message
     */
    async sendWhatsApp(params) {
        try {
            await axios.post(`${this.notifyUrl}/api/channels/whatsapp/send`, params, { headers: this.getHeaders() });
            return true;
        }
        catch (error) {
            console.error('[REZ] Failed to send WhatsApp:', error);
            return false;
        }
    }
    // ============================================================================
    // LOYALTY
    // ============================================================================
    /**
     * Get loyalty points
     */
    async getLoyaltyPoints(userId) {
        try {
            const response = await axios.get(`${this.walletUrl}/api/loyalty/${userId}/points`, { headers: this.getHeaders() });
            return {
                points: response.data.points || 0,
                tier: response.data.tier || 'bronze'
            };
        }
        catch (error) {
            return { points: 0, tier: 'bronze' };
        }
    }
    /**
     * Add loyalty points
     */
    async addLoyaltyPoints(params) {
        try {
            await axios.post(`${this.walletUrl}/api/loyalty/points/add`, params, { headers: this.getHeaders() });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    // ============================================================================
    // CROSS-APP IDENTITY
    // ============================================================================
    /**
     * Link user to merchant
     */
    async linkUserToMerchant(params) {
        try {
            await axios.post(`${this.authUrl}/api/links/merchant`, params, { headers: this.getHeaders() });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get user's merchant interactions
     */
    async getUserMerchants(userId) {
        try {
            const response = await axios.get(`${this.authUrl}/api/links/user/${userId}/merchants`, { headers: this.getHeaders() });
            return response.data.merchants || [];
        }
        catch (error) {
            return [];
        }
    }
    // ============================================================================
    // ENRICHMENT
    // ============================================================================
    /**
     * Get user context for AI personalization
     */
    async getUserContext(userId) {
        const [profile, wallet, loyalty, merchants] = await Promise.all([
            this.getUserProfile(userId),
            this.getWalletBalance(userId).then(balance => ({ balance })),
            this.getLoyaltyPoints(userId),
            this.getUserMerchants(userId)
        ]);
        return {
            profile: profile || {},
            wallet: { points: wallet, balance: wallet },
            loyalty,
            merchants
        };
    }
}
export const rezService = new REZService();
//# sourceMappingURL=rezService.js.map