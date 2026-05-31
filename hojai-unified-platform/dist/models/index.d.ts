import mongoose, { Document } from 'mongoose';
export interface IMessage extends Document {
    messageId: string;
    tenantId: string;
    channel: string;
    direction: string;
    type: string;
    from: {
        id: string;
        name: string;
        phone?: string;
        email?: string;
    };
    to: {
        id: string;
        name: string;
        phone?: string;
        email?: string;
    };
    content: {
        text?: string;
        mediaUrl?: string;
        mediaType?: string;
        caption?: string;
        buttons?: Array<{
            id: string;
            title: string;
        }>;
    };
    status: string;
    metadata?: Record<string, any>;
    timestamp: Date;
}
export declare const MessageModel: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage, {}, {}> & IMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface IConversation extends Document {
    conversationId: string;
    tenantId: string;
    channel: string;
    state: string;
    customer: {
        id: string;
        name: string;
        phone?: string;
        email?: string;
        avatar?: string;
        tier: string;
    };
    assignedAgentId?: string;
    assignedAgentName?: string;
    team?: string;
    aiHandled: boolean;
    aiConfidence?: number;
    unresolvedIntents?: string[];
    lastMessage?: string;
    lastMessageAt?: Date;
    messageCount: number;
    tags?: string[];
    priority: string;
    cartId?: string;
    orderId?: string;
    firstResponseTime?: number;
    avgResponseTime?: number;
    resolutionTime?: number;
}
export declare const ConversationModel: mongoose.Model<IConversation, {}, {}, {}, mongoose.Document<unknown, {}, IConversation, {}, {}> & IConversation & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export type Conversation = IConversation;
export interface IAgent extends Document {
    agentId: string;
    tenantId: string;
    userId: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    status: string;
    skills?: string[];
    languages?: string[];
    maxConcurrentChats: number;
    channels: string[];
    stats: {
        totalConversations: number;
        resolvedToday: number;
        avgResponseTime: number;
        avgResolutionTime: number;
        csat?: number;
        lastActiveAt?: Date;
    };
}
export declare const AgentModel: mongoose.Model<IAgent, {}, {}, {}, mongoose.Document<unknown, {}, IAgent, {}, {}> & IAgent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export type Agent = IAgent;
export interface ICart extends Document {
    cartId: string;
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
        imageUrl?: string;
        variant?: string;
    }>;
    subtotal: number;
    discount: number;
    total: number;
    status: string;
}
export declare const CartModel: mongoose.Model<ICart, {}, {}, {}, mongoose.Document<unknown, {}, ICart, {}, {}> & ICart & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export type Cart = ICart;
export interface IOrder extends Document {
    orderId: string;
    tenantId: string;
    orderNumber: string;
    customer: {
        id: string;
        name: string;
        phone: string;
        address?: string;
    };
    items: Array<{
        productId: string;
        name: string;
        price: number;
        quantity: number;
        total: number;
    }>;
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount: number;
    total: number;
    payment: {
        method: string;
        status: string;
        transactionId?: string;
    };
    delivery?: {
        status: string;
        estimatedTime?: Date;
        actualTime?: Date;
    };
    channel: string;
    conversationId?: string;
    status: string;
}
export declare const OrderModel: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export type Order = IOrder;
export interface ICampaign extends Document {
    campaignId: string;
    tenantId: string;
    name: string;
    description?: string;
    channel: string;
    type: string;
    content: {
        templateId?: string;
        subject?: string;
        text: string;
        mediaUrl?: string;
        buttons?: Array<{
            id: string;
            title: string;
            url?: string;
        }>;
    };
    segmentIds?: string[];
    targetFilters?: Record<string, any>;
    estimatedReach?: number;
    scheduledAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    status: string;
    abTest?: {
        enabled: boolean;
        variantB?: string;
        variantBRate?: number;
    };
    stats: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        converted: number;
        failed: number;
        unsubscribed: number;
    };
}
export declare const CampaignModel: mongoose.Model<ICampaign, {}, {}, {}, mongoose.Document<unknown, {}, ICampaign, {}, {}> & ICampaign & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export type Campaign = ICampaign;
export interface ITemplate extends Document {
    templateId: string;
    tenantId: string;
    name: string;
    channel: string;
    category: string;
    content: {
        body: string;
        header?: string;
        footer?: string;
        buttons?: Array<{
            id: string;
            type: string;
            title: string;
        }>;
        variables?: string[];
    };
    whatsappCategory?: string;
    whatsappTemplateId?: string;
    approvalStatus: string;
    status: string;
    usageCount: number;
    lastUsedAt?: Date;
}
export declare const TemplateModel: mongoose.Model<ITemplate, {}, {}, {}, mongoose.Document<unknown, {}, ITemplate, {}, {}> & ITemplate & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export type Template = ITemplate;
