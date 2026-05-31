export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
}
export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    variant?: string;
}
export interface Cart {
    cartId: string;
    customer: Customer;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    status: 'active' | 'checkout' | 'completed' | 'abandoned';
}
export interface Order {
    orderId: string;
    orderNumber: string;
    customer: Customer;
    items: CartItem[];
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount: number;
    total: number;
    payment: {
        method: 'upi' | 'card' | 'wallet' | 'cod';
        status: 'pending' | 'paid' | 'failed' | 'refunded';
        transactionId?: string;
    };
    status: 'pending' | 'confirmed' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled';
    delivery?: {
        address?: string;
        estimatedTime?: Date;
    };
}
export interface Conversation {
    conversationId: string;
    channel: 'whatsapp' | 'instagram' | 'sms' | 'email';
    state: 'active' | 'queued' | 'assigned' | 'resolved' | 'closed';
    customer: Customer;
    lastMessage?: string;
    lastMessageAt?: Date;
    messageCount: number;
    priority: 'low' | 'normal' | 'high' | 'urgent';
}
export interface Message {
    id: string;
    content: {
        text?: string;
        mediaUrl?: string;
        mediaType?: string;
    };
    direction: 'inbound' | 'outbound';
    timestamp: Date;
}
export interface Campaign {
    campaignId: string;
    name: string;
    channel: string;
    type: 'marketing' | 'transactional' | 'promotional' | 'welcome' | 'abandoned_cart';
    content: {
        text: string;
        mediaUrl?: string;
    };
    status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'cancelled';
    stats: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        converted: number;
    };
}
export interface Analytics {
    overview: {
        totalConversations: number;
        activeConversations: number;
        resolvedConversations: number;
        avgResponseTime: number;
    };
    commerce: {
        ordersCreated: number;
        ordersCompleted: number;
        revenue: number;
        cartAbandonmentRate: number;
    };
    campaigns: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        converted: number;
    };
}
export declare class HojaiUnifiedSDK {
    private client;
    private tenantId;
    constructor(config: {
        baseUrl: string;
        tenantId: string;
        apiKey?: string;
    });
    /**
     * Create a new cart
     */
    createCart(data: {
        sessionId: string;
        customer: Customer;
        items: CartItem[];
    }): Promise<Cart>;
    /**
     * Get cart by ID
     */
    getCart(cartId: string): Promise<Cart | null>;
    /**
     * Add item to cart
     */
    addToCart(cartId: string, item: CartItem): Promise<Cart>;
    /**
     * Update item quantity
     */
    updateCartItem(cartId: string, productId: string, quantity: number): Promise<Cart>;
    /**
     * Remove item from cart
     */
    removeFromCart(cartId: string, productId: string): Promise<Cart>;
    /**
     * Checkout cart and create order
     */
    checkout(cartId: string, options: {
        deliveryAddress?: string;
        paymentMethod: 'upi' | 'card' | 'wallet' | 'cod';
    }): Promise<Order>;
    /**
     * Get payment link for order
     */
    initiatePayment(orderId: string, customerPhone: string): Promise<{
        order: Order;
        paymentLink?: string;
    }>;
    /**
     * Get order status
     */
    getOrder(orderId: string): Promise<Order>;
    /**
     * Get customer's orders
     */
    getCustomerOrders(customerId: string): Promise<Order[]>;
    /**
     * Send message
     */
    sendMessage(data: {
        channel: 'whatsapp' | 'instagram' | 'sms' | 'email';
        to: Customer;
        type: 'text' | 'image' | 'buttons' | 'template';
        content: {
            text?: string;
            mediaUrl?: string;
            caption?: string;
            header?: string;
            buttons?: Array<{
                id: string;
                title: string;
            }>;
        };
    }): Promise<Message>;
    /**
     * Send WhatsApp template
     */
    sendTemplate(to: Customer, templateId: string, variables?: Record<string, string>): Promise<Message>;
    /**
     * Get conversations
     */
    getConversations(options?: {
        state?: Conversation['state'];
        channel?: Conversation['channel'];
        limit?: number;
        offset?: number;
    }): Promise<{
        conversations: Conversation[];
        total: number;
    }>;
    /**
     * Get conversation messages
     */
    getConversationMessages(conversationId: string): Promise<Message[]>;
    /**
     * Assign conversation to agent
     */
    assignConversation(conversationId: string, agentId: string, agentName: string): Promise<void>;
    /**
     * Resolve conversation
     */
    resolveConversation(conversationId: string): Promise<void>;
    /**
     * Create campaign
     */
    createCampaign(data: {
        name: string;
        channel: Campaign['channel'];
        type: Campaign['type'];
        content: {
            text: string;
            mediaUrl?: string;
        };
        segmentIds?: string[];
        scheduledAt?: Date;
    }): Promise<Campaign>;
    /**
     * Start campaign
     */
    startCampaign(campaignId: string): Promise<void>;
    /**
     * Get campaign status
     */
    getCampaign(campaignId: string): Promise<Campaign>;
    /**
     * Get analytics
     */
    getAnalytics(): Promise<Analytics>;
    /**
     * Get available channels
     */
    getChannels(): Promise<Array<{
        id: string;
        name: string;
        icon: string;
        status: 'active' | 'coming_soon';
    }>>;
    /**
     * Check if service is healthy
     */
    healthCheck(): Promise<boolean>;
}
export default HojaiUnifiedSDK;
export { HojaiUnifiedSDK as Client };
