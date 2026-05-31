import { IConversation, IAgent, ICart, IOrder, ICampaign, ITemplate } from '../models';
export declare class PlatformService {
    handleIncomingMessage(data: {
        tenantId: string;
        channel: string;
        from: {
            id: string;
            name: string;
            phone?: string;
        };
        type: string;
        content: any;
        metadata?: Record<string, any>;
    }): Promise<IConversation>;
    sendMessage(data: {
        tenantId: string;
        channel: string;
        to: {
            id: string;
            name: string;
            phone?: string;
        };
        type: string;
        content: any;
    }): Promise<any>;
    private sendWhatsAppMessage;
    getOrCreateConversation(data: {
        tenantId: string;
        channel: string;
        customerId: string;
        customerName: string;
        customerPhone?: string;
    }): Promise<IConversation>;
    getConversations(tenantId: string, options?: {
        state?: string;
        channel?: string;
        agentId?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        conversations: IConversation[];
        total: number;
    }>;
    assignConversation(conversationId: string, agentId: string, agentName: string): Promise<void>;
    resolveConversation(conversationId: string): Promise<void>;
    createAgent(data: {
        tenantId: string;
        userId: string;
        name: string;
        email: string;
        role?: string;
        channels?: string[];
        skills?: string[];
    }): Promise<IAgent>;
    getAgents(tenantId: string, status?: string): Promise<IAgent[]>;
    setAgentStatus(agentId: string, status: string): Promise<void>;
    createCart(data: {
        tenantId: string;
        sessionId: string;
        customer: {
            id: string;
            name: string;
            phone: string;
        };
        items: Array<{
            productId: string;
            name: string;
            price: number;
            quantity: number;
        }>;
    }): Promise<ICart>;
    getCart(cartId: string): Promise<ICart | null>;
    addToCart(cartId: string, item: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
    }): Promise<ICart | null>;
    checkout(cartId: string, data: {
        deliveryAddress?: string;
        paymentMethod: string;
    }): Promise<IOrder>;
    initiatePayment(orderId: string, customerPhone: string): Promise<{
        order: IOrder;
        paymentLink?: string;
    }>;
    createCampaign(data: {
        tenantId: string;
        name: string;
        channel: string;
        type: string;
        content: {
            text: string;
            subject?: string;
            mediaUrl?: string;
        };
        segmentIds?: string[];
        scheduledAt?: Date;
    }): Promise<ICampaign>;
    startCampaign(campaignId: string): Promise<void>;
    createTemplate(data: {
        tenantId: string;
        name: string;
        channel: string;
        category: string;
        content: {
            body: string;
            header?: string;
            footer?: string;
            buttons?: any[];
        };
    }): Promise<ITemplate>;
    getAnalytics(tenantId: string): Promise<any>;
}
export declare const platformService: PlatformService;
