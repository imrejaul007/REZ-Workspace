import type { Merchant, MerchantContext } from './types.js';
export declare class MerchantBridgeService {
    private baseUrl;
    private token;
    constructor(baseUrl?: string, token?: string);
    private headers;
    /**
     * Get merchant by ID
     */
    getMerchant(merchantId: string): Promise<Merchant | null>;
    /**
     * Get merchant by phone/WhatsApp
     */
    getMerchantByPhone(phone: string): Promise<Merchant | null>;
    /**
     * Get merchant context (all data needed for AI)
     */
    getMerchantContext(merchantId: string): Promise<MerchantContext | null>;
    /**
     * Update merchant settings
     */
    updateMerchant(merchantId: string, updates: Partial<Merchant>): Promise<Merchant | null>;
    /**
     * Get all customers for merchant
     */
    getCustomers(merchantId: string): Promise<Merchant['id'] extends string ? import('./types.js').Customer[] : never>;
    /**
     * Get customer by phone
     */
    getCustomerByPhone(merchantId: string, phone: string): Promise<import('./types.js').Customer | null>;
    /**
     * Create or get customer
     */
    findOrCreateCustomer(merchantId: string, phone: string, name?: string): Promise<import('./types.js').Customer | null>;
    /**
     * Update customer loyalty
     */
    updateCustomerLoyalty(merchantId: string, customerId: string, points: number): Promise<boolean>;
    /**
     * Get merchant menu
     */
    getMenu(merchantId: string): Promise<import('./types.js').MenuItem[]>;
    /**
     * Search menu items
     */
    searchMenu(merchantId: string, query: string): Promise<import('./types.js').MenuItem[]>;
    /**
     * Get menu item by ID
     */
    getMenuItem(merchantId: string, itemId: string): Promise<import('./types.js').MenuItem | null>;
    /**
     * Get today's orders
     */
    getTodayOrders(merchantId: string): Promise<import('./types.js').Order[]>;
    /**
     * Get customer orders
     */
    getCustomerOrders(merchantId: string, customerId: string): Promise<import('./types.js').Order[]>;
    /**
     * Create order
     */
    createOrder(merchantId: string, order: Partial<import('./types.js').Order>): Promise<import('./types.js').Order | null>;
    /**
     * Update order status
     */
    updateOrderStatus(merchantId: string, orderId: string, status: import('./types.js').Order['status']): Promise<boolean>;
    /**
     * Get tables
     */
    getTables(merchantId: string): Promise<import('./types.js').Table[]>;
    /**
     * Check table availability
     */
    checkTableAvailability(merchantId: string, date: string, time: string, guests: number): Promise<import('./types.js').Table[]>;
    private transformMerchant;
    private defaultHours;
    private defaultFeatures;
}
export declare const merchantBridge: MerchantBridgeService;
//# sourceMappingURL=merchantService.d.ts.map