import axios from 'axios';
export class CommerceIntegration {
    auth;
    payment;
    wallet;
    order;
    catalog;
    internalToken;
    constructor() {
        this.internalToken = process.env.INTERNAL_SERVICE_TOKEN || '';
        const headers = {
            'X-Internal-Token': this.internalToken,
            'Content-Type': 'application/json'
        };
        this.auth = axios.create({
            baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
            headers
        });
        this.payment = axios.create({
            baseURL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001',
            headers
        });
        this.wallet = axios.create({
            baseURL: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
            headers
        });
        this.order = axios.create({
            baseURL: process.env.ORDER_SERVICE_URL || 'http://localhost:4006',
            headers
        });
        this.catalog = axios.create({
            baseURL: process.env.CATALOG_SERVICE_URL || 'http://localhost:4007',
            headers
        });
    }
    // ============ PAYMENTS ============
    /**
     * Create payment link
     */
    async createPaymentLink(data) {
        try {
            const response = await this.payment.post('/api/payments/create-link', {
                amount: data.amount,
                currency: data.currency || 'INR',
                customer_email: data.customerEmail,
                customer_phone: data.customerPhone,
                description: data.description,
                order_id: data.orderId
            });
            return {
                paymentLink: response.data.payment_link,
                paymentId: response.data.id
            };
        }
        catch (error) {
            console.error('Payment link creation failed:', error.message);
            throw new Error(`Payment failed: ${error.message}`);
        }
    }
    /**
     * Verify payment
     */
    async verifyPayment(paymentId) {
        try {
            const response = await this.payment.get(`/api/payments/${paymentId}/verify`);
            return response.data;
        }
        catch (error) {
            console.error('Payment verification failed:', error.message);
            throw new Error(`Verification failed: ${error.message}`);
        }
    }
    // ============ WALLET ============
    /**
     * Get wallet balance
     */
    async getBalance(userId) {
        try {
            const response = await this.wallet.get(`/api/wallet/${userId}/balance`);
            return response.data;
        }
        catch (error) {
            console.error('Wallet balance fetch failed:', error.message);
            return { balance: 0, coins: 0, cashback: 0 };
        }
    }
    /**
     * Deduct from wallet
     */
    async deductWallet(userId, amount, reason) {
        try {
            const response = await this.wallet.post(`/api/wallet/${userId}/debit`, {
                amount,
                reason
            });
            return response.data;
        }
        catch (error) {
            console.error('Wallet deduction failed:', error.message);
            throw new Error(`Wallet deduction failed: ${error.message}`);
        }
    }
    /**
     * Add cashback
     */
    async addCashback(userId, amount, orderId) {
        try {
            const response = await this.wallet.post(`/api/wallet/${userId}/cashback`, {
                amount,
                order_id: orderId
            });
            return response.data;
        }
        catch (error) {
            console.error('Cashback addition failed:', error.message);
            return { success: false, newBalance: 0 };
        }
    }
    // ============ ORDERS ============
    /**
     * Create order
     */
    async createOrder(data) {
        try {
            const response = await this.order.post('/api/orders', {
                customer_id: data.customerId,
                customer_phone: data.customerPhone,
                customer_name: data.customerName,
                items: data.items.map(item => ({
                    product_id: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                delivery_address: data.deliveryAddress,
                payment_method: data.paymentMethod,
                channel: data.channel || 'whatsapp'
            });
            return {
                orderId: response.data.order_id,
                orderNumber: response.data.order_number,
                total: response.data.total
            };
        }
        catch (error) {
            console.error('Order creation failed:', error.message);
            throw new Error(`Order creation failed: ${error.message}`);
        }
    }
    /**
     * Get order status
     */
    async getOrderStatus(orderId) {
        try {
            const response = await this.order.get(`/api/orders/${orderId}/status`);
            return response.data;
        }
        catch (error) {
            console.error('Order status fetch failed:', error.message);
            throw new Error(`Order status failed: ${error.message}`);
        }
    }
    // ============ CATALOG ============
    /**
     * Search products
     */
    async searchProducts(query, limit = 10) {
        try {
            const response = await this.catalog.get('/api/products/search', {
                params: { q: query, limit }
            });
            return response.data.products || [];
        }
        catch (error) {
            console.error('Product search failed:', error.message);
            return [];
        }
    }
    /**
     * Get product details
     */
    async getProduct(productId) {
        try {
            const response = await this.catalog.get(`/api/products/${productId}`);
            return response.data;
        }
        catch (error) {
            console.error('Product fetch failed:', error.message);
            return null;
        }
    }
}
export const commerceIntegration = new CommerceIntegration();
//# sourceMappingURL=CommerceIntegration.js.map