"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.HojaiUnifiedSDK = void 0;
const axios_1 = __importDefault(require("axios"));
// ============ HOJAI UNIFIED SDK ============
class HojaiUnifiedSDK {
    constructor(config) {
        this.tenantId = config.tenantId;
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': config.tenantId,
                ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
            }
        });
    }
    // ============ CART ============
    /**
     * Create a new cart
     */
    async createCart(data) {
        const response = await this.client.post('/api/cart', data);
        return response.data.data;
    }
    /**
     * Get cart by ID
     */
    async getCart(cartId) {
        const response = await this.client.get(`/api/cart/${cartId}`);
        return response.data.data || null;
    }
    /**
     * Add item to cart
     */
    async addToCart(cartId, item) {
        const response = await this.client.post(`/api/cart/${cartId}/items`, item);
        return response.data.data;
    }
    /**
     * Update item quantity
     */
    async updateCartItem(cartId, productId, quantity) {
        const response = await this.client.patch(`/api/cart/${cartId}/items/${productId}`, { quantity });
        return response.data.data;
    }
    /**
     * Remove item from cart
     */
    async removeFromCart(cartId, productId) {
        const response = await this.client.delete(`/api/cart/${cartId}/items/${productId}`);
        return response.data.data;
    }
    // ============ CHECKOUT ============
    /**
     * Checkout cart and create order
     */
    async checkout(cartId, options) {
        const response = await this.client.post(`/api/cart/${cartId}/checkout`, options);
        return response.data.data;
    }
    /**
     * Get payment link for order
     */
    async initiatePayment(orderId, customerPhone) {
        const response = await this.client.post(`/api/orders/${orderId}/pay`, {
            customerPhone
        });
        return response.data.data;
    }
    /**
     * Get order status
     */
    async getOrder(orderId) {
        const response = await this.client.get(`/api/orders/${orderId}`);
        return response.data.data;
    }
    /**
     * Get customer's orders
     */
    async getCustomerOrders(customerId) {
        const response = await this.client.get('/api/orders', {
            params: { customerId }
        });
        return response.data.data || [];
    }
    // ============ MESSAGES ============
    /**
     * Send message
     */
    async sendMessage(data) {
        const response = await this.client.post('/api/messages/send', {
            channel: data.channel,
            to: data.to,
            type: data.type,
            content: data.content
        });
        return response.data.data;
    }
    /**
     * Send WhatsApp template
     */
    async sendTemplate(to, templateId, variables) {
        return this.sendMessage({
            channel: 'whatsapp',
            to,
            type: 'template',
            content: { text: templateId, ...variables }
        });
    }
    // ============ CONVERSATIONS ============
    /**
     * Get conversations
     */
    async getConversations(options) {
        const response = await this.client.get('/api/conversations', { params: options });
        return response.data.data;
    }
    /**
     * Get conversation messages
     */
    async getConversationMessages(conversationId) {
        const response = await this.client.get(`/api/conversations/${conversationId}/messages`);
        return response.data.data || [];
    }
    /**
     * Assign conversation to agent
     */
    async assignConversation(conversationId, agentId, agentName) {
        await this.client.post(`/api/conversations/${conversationId}/assign`, {
            agentId,
            agentName
        });
    }
    /**
     * Resolve conversation
     */
    async resolveConversation(conversationId) {
        await this.client.post(`/api/conversations/${conversationId}/resolve`);
    }
    // ============ CAMPAIGNS ============
    /**
     * Create campaign
     */
    async createCampaign(data) {
        const response = await this.client.post('/api/campaigns', data);
        return response.data.data;
    }
    /**
     * Start campaign
     */
    async startCampaign(campaignId) {
        await this.client.post(`/api/campaigns/${campaignId}/start`);
    }
    /**
     * Get campaign status
     */
    async getCampaign(campaignId) {
        const response = await this.client.get(`/api/campaigns/${campaignId}`);
        return response.data.data;
    }
    // ============ ANALYTICS ============
    /**
     * Get analytics
     */
    async getAnalytics() {
        const response = await this.client.get('/api/analytics');
        return response.data.data;
    }
    // ============ CHANNELS ============
    /**
     * Get available channels
     */
    async getChannels() {
        const response = await this.client.get('/api/channels');
        return response.data.data;
    }
    // ============ HEALTH ============
    /**
     * Check if service is healthy
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return response.data.status === 'ok';
        }
        catch {
            return false;
        }
    }
}
exports.HojaiUnifiedSDK = HojaiUnifiedSDK;
exports.Client = HojaiUnifiedSDK;
// ============ DEFAULT EXPORT ============
exports.default = HojaiUnifiedSDK;
//# sourceMappingURL=index.js.map