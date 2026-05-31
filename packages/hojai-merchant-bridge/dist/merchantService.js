"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantBridge = exports.MerchantBridgeService = void 0;
/**
 * HOJAI Merchant Bridge - Merchant Service
 * Connects to REZ Merchant platform
 */
const axios_1 = __importDefault(require("axios"));
// Configuration
const MERCHANT_API_URL = process.env.REZ_MERCHANT_URL || 'http://localhost:4000';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;
class MerchantBridgeService {
    baseUrl;
    token;
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl || MERCHANT_API_URL;
        this.token = token || INTERNAL_TOKEN || '';
    }
    headers() {
        return {
            'X-Internal-Token': this.token,
            'Content-Type': 'application/json'
        };
    }
    // ============================================================================
    // MERCHANT METHODS
    // ============================================================================
    /**
     * Get merchant by ID
     */
    async getMerchant(merchantId) {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/api/merchants/${merchantId}`, { headers: this.headers() });
            return this.transformMerchant(res.data);
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to get merchant:', error);
            return null;
        }
    }
    /**
     * Get merchant by phone/WhatsApp
     */
    async getMerchantByPhone(phone) {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/api/merchants/phone/${phone}`, { headers: this.headers() });
            return this.transformMerchant(res.data);
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to get merchant by phone:', error);
            return null;
        }
    }
    /**
     * Get merchant context (all data needed for AI)
     */
    async getMerchantContext(merchantId) {
        try {
            const [merchant, customers, menu, orders, tables] = await Promise.all([
                this.getMerchant(merchantId),
                this.getCustomers(merchantId),
                this.getMenu(merchantId),
                this.getTodayOrders(merchantId),
                this.getTables(merchantId)
            ]);
            if (!merchant)
                return null;
            const todayRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.total : 0), 0);
            return {
                merchant,
                customers,
                menu,
                todayOrders: orders,
                todayRevenue,
                activeBookings: [], // TODO: integrate booking service
                tables
            };
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to get merchant context:', error);
            return null;
        }
    }
    /**
     * Update merchant settings
     */
    async updateMerchant(merchantId, updates) {
        try {
            const res = await axios_1.default.patch(`${this.baseUrl}/api/merchants/${merchantId}`, updates, { headers: this.headers() });
            return this.transformMerchant(res.data);
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to update merchant:', error);
            return null;
        }
    }
    // ============================================================================
    // CUSTOMER METHODS
    // ============================================================================
    /**
     * Get all customers for merchant
     */
    async getCustomers(merchantId) {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/api/merchants/${merchantId}/customers`, { headers: this.headers() });
            return res.data.customers || [];
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to get customers:', error);
            return [];
        }
    }
    /**
     * Get customer by phone
     */
    async getCustomerByPhone(merchantId, phone) {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/api/merchants/${merchantId}/customers/phone/${phone}`, { headers: this.headers() });
            return res.data;
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to get customer:', error);
            return null;
        }
    }
    /**
     * Create or get customer
     */
    async findOrCreateCustomer(merchantId, phone, name) {
        try {
            const res = await axios_1.default.post(`${this.baseUrl}/api/merchants/${merchantId}/customers`, { phone, name }, { headers: this.headers() });
            return res.data;
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to find/create customer:', error);
            return null;
        }
    }
    /**
     * Update customer loyalty
     */
    async updateCustomerLoyalty(merchantId, customerId, points) {
        try {
            await axios_1.default.post(`${this.baseUrl}/api/merchants/${merchantId}/customers/${customerId}/loyalty`, { points }, { headers: this.headers() });
            return true;
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to update loyalty:', error);
            return false;
        }
    }
    // ============================================================================
    // MENU METHODS
    // ============================================================================
    /**
     * Get merchant menu
     */
    async getMenu(merchantId) {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/api/merchants/${merchantId}/menu`, { headers: this.headers() });
            return res.data.items || [];
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to get menu:', error);
            return [];
        }
    }
    /**
     * Search menu items
     */
    async searchMenu(merchantId, query) {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/api/merchants/${merchantId}/menu/search?q=${encodeURIComponent(query)}`, { headers: this.headers() });
            return res.data.items || [];
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to search menu:', error);
            return [];
        }
    }
    /**
     * Get menu item by ID
     */
    async getMenuItem(merchantId, itemId) {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/api/merchants/${merchantId}/menu/${itemId}`, { headers: this.headers() });
            return res.data;
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to get menu item:', error);
            return null;
        }
    }
    // ============================================================================
    // ORDER METHODS
    // ============================================================================
    /**
     * Get today's orders
     */
    async getTodayOrders(merchantId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await axios_1.default.get(`${this.baseUrl}/api/merchants/${merchantId}/orders?date=${today}`, { headers: this.headers() });
            return res.data.orders || [];
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to get orders:', error);
            return [];
        }
    }
    /**
     * Get customer orders
     */
    async getCustomerOrders(merchantId, customerId) {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/api/merchants/${merchantId}/customers/${customerId}/orders`, { headers: this.headers() });
            return res.data.orders || [];
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to get customer orders:', error);
            return [];
        }
    }
    /**
     * Create order
     */
    async createOrder(merchantId, order) {
        try {
            const res = await axios_1.default.post(`${this.baseUrl}/api/merchants/${merchantId}/orders`, order, { headers: this.headers() });
            return res.data;
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to create order:', error);
            return null;
        }
    }
    /**
     * Update order status
     */
    async updateOrderStatus(merchantId, orderId, status) {
        try {
            await axios_1.default.patch(`${this.baseUrl}/api/merchants/${merchantId}/orders/${orderId}`, { status }, { headers: this.headers() });
            return true;
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to update order:', error);
            return false;
        }
    }
    // ============================================================================
    // TABLE METHODS
    // ============================================================================
    /**
     * Get tables
     */
    async getTables(merchantId) {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/api/merchants/${merchantId}/tables`, { headers: this.headers() });
            return res.data.tables || [];
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to get tables:', error);
            return [];
        }
    }
    /**
     * Check table availability
     */
    async checkTableAvailability(merchantId, date, time, guests) {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/api/merchants/${merchantId}/tables/availability?date=${date}&time=${time}&guests=${guests}`, { headers: this.headers() });
            return res.data.tables || [];
        }
        catch (error) {
            console.error('[MerchantBridge] Failed to check availability:', error);
            return [];
        }
    }
    // ============================================================================
    // PRIVATE HELPERS
    // ============================================================================
    transformMerchant(data) {
        if (!data)
            return null;
        return {
            id: data._id?.toString() || data.id,
            name: data.name,
            businessType: data.businessType || 'retail',
            email: data.email,
            phone: data.phone,
            address: data.address || {},
            hours: data.hours || this.defaultHours(),
            features: data.features || this.defaultFeatures(),
            plan: data.plan || 'starter',
            status: data.status || 'active',
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        };
    }
    defaultHours() {
        return {
            monday: { open: '09:00', close: '21:00', closed: false },
            tuesday: { open: '09:00', close: '21:00', closed: false },
            wednesday: { open: '09:00', close: '21:00', closed: false },
            thursday: { open: '09:00', close: '21:00', closed: false },
            friday: { open: '09:00', close: '21:00', closed: false },
            saturday: { open: '09:00', close: '21:00', closed: false },
            sunday: { open: '09:00', close: '21:00', closed: false }
        };
    }
    defaultFeatures() {
        return {
            ordering: true,
            booking: false,
            payments: true,
            delivery: false,
            takeaway: true,
            dinein: false,
            loyalty: false
        };
    }
}
exports.MerchantBridgeService = MerchantBridgeService;
// Export singleton
exports.merchantBridge = new MerchantBridgeService();
