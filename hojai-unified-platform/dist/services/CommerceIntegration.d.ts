export declare class CommerceIntegration {
    private auth;
    private payment;
    private wallet;
    private order;
    private catalog;
    private internalToken;
    constructor();
    /**
     * Create payment link
     */
    createPaymentLink(data: {
        amount: number;
        currency?: string;
        customerEmail?: string;
        customerPhone: string;
        description?: string;
        orderId?: string;
    }): Promise<{
        paymentLink: string;
        paymentId: string;
    }>;
    /**
     * Verify payment
     */
    verifyPayment(paymentId: string): Promise<{
        status: string;
        amount: number;
        verified: boolean;
    }>;
    /**
     * Get wallet balance
     */
    getBalance(userId: string): Promise<{
        balance: number;
        coins: number;
        cashback: number;
    }>;
    /**
     * Deduct from wallet
     */
    deductWallet(userId: string, amount: number, reason: string): Promise<{
        success: boolean;
        newBalance: number;
        transactionId: string;
    }>;
    /**
     * Add cashback
     */
    addCashback(userId: string, amount: number, orderId: string): Promise<{
        success: boolean;
        newBalance: number;
    }>;
    /**
     * Create order
     */
    createOrder(data: {
        customerId: string;
        customerPhone: string;
        customerName: string;
        items: Array<{
            productId: string;
            name: string;
            price: number;
            quantity: number;
        }>;
        deliveryAddress?: string;
        paymentMethod: string;
        channel?: string;
    }): Promise<{
        orderId: string;
        orderNumber: string;
        total: number;
    }>;
    /**
     * Get order status
     */
    getOrderStatus(orderId: string): Promise<{
        status: string;
        estimatedDelivery?: string;
        lastUpdate?: string;
    }>;
    /**
     * Search products
     */
    searchProducts(query: string, limit?: number): Promise<Array<{
        id: string;
        name: string;
        price: number;
        imageUrl?: string;
        inStock: boolean;
    }>>;
    /**
     * Get product details
     */
    getProduct(productId: string): Promise<{
        id: string;
        name: string;
        description: string;
        price: number;
        images: string[];
        variants: Array<{
            name: string;
            options: string[];
        }>;
        inStock: boolean;
        stock: number;
    } | null>;
}
export declare const commerceIntegration: CommerceIntegration;
