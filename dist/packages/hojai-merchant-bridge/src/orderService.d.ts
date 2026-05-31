import type { Order, OrderStatus } from './types.js';
export interface CreateOrderInput {
    merchantId: string;
    customerId: string;
    customerPhone: string;
    type: 'delivery' | 'pickup' | 'dinein' | 'table';
    items: {
        menuItemId: string;
        name: string;
        quantity: number;
        price: number;
        variants?: {
            name: string;
            price: number;
        }[];
        addons?: {
            name: string;
            price: number;
        }[];
        notes?: string;
    }[];
    paymentMethod: 'upi' | 'card' | 'cash' | 'wallet' | 'cod';
    notes?: string;
    deliveryAddress?: {
        street: string;
        city: string;
        pincode: string;
    };
}
export declare class OrderBridgeService {
    private baseUrl;
    private token;
    constructor(baseUrl?: string, token?: string);
    private headers;
    /**
     * Create new order
     */
    create(input: CreateOrderInput): Promise<Order | null>;
    /**
     * Get order by ID
     */
    get(orderId: string): Promise<Order | null>;
    /**
     * Update order status
     */
    updateStatus(orderId: string, status: OrderStatus): Promise<boolean>;
    /**
     * Get orders by merchant
     */
    getByMerchant(merchantId: string, date?: string): Promise<Order[]>;
    /**
     * Get orders by customer
     */
    getByCustomer(customerId: string): Promise<Order[]>;
    /**
     * Cancel order
     */
    cancel(orderId: string, reason?: string): Promise<boolean>;
    /**
     * Process payment
     */
    processPayment(orderId: string, paymentData: {
        method: string;
        transactionId?: string;
    }): Promise<boolean>;
    private transformOrder;
}
export declare const orderBridge: OrderBridgeService;
//# sourceMappingURL=orderService.d.ts.map