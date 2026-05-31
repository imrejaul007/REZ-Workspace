import { z } from 'zod';
export declare const ChannelEnum: z.ZodEnum<["whatsapp", "instagram", "sms", "email", "push", "webchat", "voice", "telegram", "rcs"]>;
export type Channel = z.infer<typeof ChannelEnum>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    channel: z.ZodEnum<["whatsapp", "instagram", "sms", "email", "push", "webchat", "voice", "telegram", "rcs"]>;
    direction: z.ZodEnum<["inbound", "outbound", "internal"]>;
    type: z.ZodEnum<["text", "image", "video", "audio", "document", "location", "contact", "sticker", "template", "interactive", "cart", "order", "payment"]>;
    from: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        email?: string | undefined;
        phone?: string | undefined;
    }, {
        name: string;
        id: string;
        email?: string | undefined;
        phone?: string | undefined;
    }>;
    to: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        email?: string | undefined;
        phone?: string | undefined;
    }, {
        name: string;
        id: string;
        email?: string | undefined;
        phone?: string | undefined;
    }>;
    content: z.ZodObject<{
        text: z.ZodOptional<z.ZodString>;
        mediaUrl: z.ZodOptional<z.ZodString>;
        mediaType: z.ZodOptional<z.ZodString>;
        caption: z.ZodOptional<z.ZodString>;
        buttons: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            title: string;
        }, {
            id: string;
            title: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        text?: string | undefined;
        buttons?: {
            id: string;
            title: string;
        }[] | undefined;
        mediaUrl?: string | undefined;
        mediaType?: string | undefined;
        caption?: string | undefined;
    }, {
        text?: string | undefined;
        buttons?: {
            id: string;
            title: string;
        }[] | undefined;
        mediaUrl?: string | undefined;
        mediaType?: string | undefined;
        caption?: string | undefined;
    }>;
    status: z.ZodDefault<z.ZodEnum<["pending", "sent", "delivered", "read", "failed"]>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    timestamp: z.ZodDate;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    type: "text" | "image" | "video" | "audio" | "document" | "location" | "payment" | "contact" | "sticker" | "template" | "interactive" | "cart" | "order";
    status: "sent" | "delivered" | "read" | "failed" | "pending";
    channel: "email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs";
    content: {
        text?: string | undefined;
        buttons?: {
            id: string;
            title: string;
        }[] | undefined;
        mediaUrl?: string | undefined;
        mediaType?: string | undefined;
        caption?: string | undefined;
    };
    id: string;
    createdAt: Date;
    updatedAt: Date;
    timestamp: Date;
    direction: "inbound" | "outbound" | "internal";
    from: {
        name: string;
        id: string;
        email?: string | undefined;
        phone?: string | undefined;
    };
    to: {
        name: string;
        id: string;
        email?: string | undefined;
        phone?: string | undefined;
    };
    metadata?: Record<string, any> | undefined;
}, {
    tenantId: string;
    type: "text" | "image" | "video" | "audio" | "document" | "location" | "payment" | "contact" | "sticker" | "template" | "interactive" | "cart" | "order";
    channel: "email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs";
    content: {
        text?: string | undefined;
        buttons?: {
            id: string;
            title: string;
        }[] | undefined;
        mediaUrl?: string | undefined;
        mediaType?: string | undefined;
        caption?: string | undefined;
    };
    id: string;
    createdAt: Date;
    updatedAt: Date;
    timestamp: Date;
    direction: "inbound" | "outbound" | "internal";
    from: {
        name: string;
        id: string;
        email?: string | undefined;
        phone?: string | undefined;
    };
    to: {
        name: string;
        id: string;
        email?: string | undefined;
        phone?: string | undefined;
    };
    status?: "sent" | "delivered" | "read" | "failed" | "pending" | undefined;
    metadata?: Record<string, any> | undefined;
}>;
export type Message = z.infer<typeof MessageSchema>;
export declare const ConversationSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    channel: z.ZodEnum<["whatsapp", "instagram", "sms", "email", "push", "webchat", "voice", "telegram", "rcs"]>;
    state: z.ZodDefault<z.ZodEnum<["active", "queued", "assigned", "resolved", "closed"]>>;
    customer: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
        tier: z.ZodDefault<z.ZodEnum<["standard", "premium", "vip"]>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        tier: "standard" | "premium" | "vip";
        email?: string | undefined;
        phone?: string | undefined;
        avatar?: string | undefined;
    }, {
        name: string;
        id: string;
        email?: string | undefined;
        phone?: string | undefined;
        avatar?: string | undefined;
        tier?: "standard" | "premium" | "vip" | undefined;
    }>;
    assignedAgentId: z.ZodOptional<z.ZodString>;
    assignedAgentName: z.ZodOptional<z.ZodString>;
    team: z.ZodOptional<z.ZodString>;
    aiHandled: z.ZodDefault<z.ZodBoolean>;
    aiConfidence: z.ZodOptional<z.ZodNumber>;
    unresolvedIntents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    lastMessage: z.ZodOptional<z.ZodString>;
    lastMessageAt: z.ZodOptional<z.ZodDate>;
    messageCount: z.ZodDefault<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high", "urgent"]>>;
    cartId: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    firstResponseTime: z.ZodOptional<z.ZodNumber>;
    avgResponseTime: z.ZodOptional<z.ZodNumber>;
    resolutionTime: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    customer: {
        name: string;
        id: string;
        tier: "standard" | "premium" | "vip";
        email?: string | undefined;
        phone?: string | undefined;
        avatar?: string | undefined;
    };
    tenantId: string;
    channel: "email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs";
    id: string;
    priority: "low" | "normal" | "high" | "urgent";
    state: "active" | "queued" | "assigned" | "resolved" | "closed";
    aiHandled: boolean;
    messageCount: number;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[] | undefined;
    assignedAgentId?: string | undefined;
    assignedAgentName?: string | undefined;
    team?: string | undefined;
    cartId?: string | undefined;
    orderId?: string | undefined;
    aiConfidence?: number | undefined;
    unresolvedIntents?: string[] | undefined;
    lastMessage?: string | undefined;
    lastMessageAt?: Date | undefined;
    firstResponseTime?: number | undefined;
    avgResponseTime?: number | undefined;
    resolutionTime?: number | undefined;
}, {
    customer: {
        name: string;
        id: string;
        email?: string | undefined;
        phone?: string | undefined;
        avatar?: string | undefined;
        tier?: "standard" | "premium" | "vip" | undefined;
    };
    tenantId: string;
    channel: "email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    priority?: "low" | "normal" | "high" | "urgent" | undefined;
    tags?: string[] | undefined;
    state?: "active" | "queued" | "assigned" | "resolved" | "closed" | undefined;
    assignedAgentId?: string | undefined;
    assignedAgentName?: string | undefined;
    aiHandled?: boolean | undefined;
    messageCount?: number | undefined;
    team?: string | undefined;
    cartId?: string | undefined;
    orderId?: string | undefined;
    aiConfidence?: number | undefined;
    unresolvedIntents?: string[] | undefined;
    lastMessage?: string | undefined;
    lastMessageAt?: Date | undefined;
    firstResponseTime?: number | undefined;
    avgResponseTime?: number | undefined;
    resolutionTime?: number | undefined;
}>;
export type Conversation = z.infer<typeof ConversationSchema>;
export declare const AgentSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    avatar: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodEnum<["agent", "supervisor", "admin"]>>;
    status: z.ZodDefault<z.ZodEnum<["online", "busy", "away", "offline"]>>;
    skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxConcurrentChats: z.ZodDefault<z.ZodNumber>;
    stats: z.ZodOptional<z.ZodObject<{
        totalConversations: z.ZodDefault<z.ZodNumber>;
        resolvedToday: z.ZodDefault<z.ZodNumber>;
        avgResponseTime: z.ZodDefault<z.ZodNumber>;
        avgResolutionTime: z.ZodDefault<z.ZodNumber>;
        csat: z.ZodOptional<z.ZodNumber>;
        lastActiveAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        avgResponseTime: number;
        totalConversations: number;
        resolvedToday: number;
        avgResolutionTime: number;
        csat?: number | undefined;
        lastActiveAt?: Date | undefined;
    }, {
        avgResponseTime?: number | undefined;
        totalConversations?: number | undefined;
        resolvedToday?: number | undefined;
        avgResolutionTime?: number | undefined;
        csat?: number | undefined;
        lastActiveAt?: Date | undefined;
    }>>;
    channels: z.ZodDefault<z.ZodArray<z.ZodEnum<["whatsapp", "instagram", "sms", "email", "push", "webchat", "voice", "telegram", "rcs"]>, "many">>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    email: string;
    tenantId: string;
    status: "online" | "busy" | "away" | "offline";
    name: string;
    role: "admin" | "agent" | "supervisor";
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    maxConcurrentChats: number;
    channels: ("email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs")[];
    avatar?: string | undefined;
    skills?: string[] | undefined;
    languages?: string[] | undefined;
    stats?: {
        avgResponseTime: number;
        totalConversations: number;
        resolvedToday: number;
        avgResolutionTime: number;
        csat?: number | undefined;
        lastActiveAt?: Date | undefined;
    } | undefined;
}, {
    email: string;
    tenantId: string;
    name: string;
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status?: "online" | "busy" | "away" | "offline" | undefined;
    role?: "admin" | "agent" | "supervisor" | undefined;
    avatar?: string | undefined;
    skills?: string[] | undefined;
    languages?: string[] | undefined;
    maxConcurrentChats?: number | undefined;
    stats?: {
        avgResponseTime?: number | undefined;
        totalConversations?: number | undefined;
        resolvedToday?: number | undefined;
        avgResolutionTime?: number | undefined;
        csat?: number | undefined;
        lastActiveAt?: Date | undefined;
    } | undefined;
    channels?: ("email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs")[] | undefined;
}>;
export type Agent = z.infer<typeof AgentSchema>;
export declare const CartSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    sessionId: z.ZodString;
    customer: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        phone: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        phone: string;
    }, {
        name: string;
        id: string;
        phone: string;
    }>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        name: z.ZodString;
        price: z.ZodNumber;
        quantity: z.ZodNumber;
        imageUrl: z.ZodOptional<z.ZodString>;
        variant: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        price: number;
        productId: string;
        quantity: number;
        variant?: string | undefined;
        imageUrl?: string | undefined;
    }, {
        name: string;
        price: number;
        productId: string;
        quantity: number;
        variant?: string | undefined;
        imageUrl?: string | undefined;
    }>, "many">;
    subtotal: z.ZodNumber;
    discount: z.ZodDefault<z.ZodNumber>;
    total: z.ZodNumber;
    status: z.ZodDefault<z.ZodEnum<["active", "checkout", "completed", "abandoned"]>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    customer: {
        name: string;
        id: string;
        phone: string;
    };
    tenantId: string;
    status: "active" | "checkout" | "completed" | "abandoned";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    sessionId: string;
    subtotal: number;
    discount: number;
    total: number;
    items: {
        name: string;
        price: number;
        productId: string;
        quantity: number;
        variant?: string | undefined;
        imageUrl?: string | undefined;
    }[];
}, {
    customer: {
        name: string;
        id: string;
        phone: string;
    };
    tenantId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    sessionId: string;
    subtotal: number;
    total: number;
    items: {
        name: string;
        price: number;
        productId: string;
        quantity: number;
        variant?: string | undefined;
        imageUrl?: string | undefined;
    }[];
    status?: "active" | "checkout" | "completed" | "abandoned" | undefined;
    discount?: number | undefined;
}>;
export type Cart = z.infer<typeof CartSchema>;
export declare const OrderSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    orderNumber: z.ZodString;
    customer: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        phone: z.ZodString;
        address: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        phone: string;
        address?: string | undefined;
    }, {
        name: string;
        id: string;
        phone: string;
        address?: string | undefined;
    }>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        name: z.ZodString;
        price: z.ZodNumber;
        quantity: z.ZodNumber;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        price: number;
        productId: string;
        quantity: number;
        total: number;
    }, {
        name: string;
        price: number;
        productId: string;
        quantity: number;
        total: number;
    }>, "many">;
    subtotal: z.ZodNumber;
    tax: z.ZodDefault<z.ZodNumber>;
    deliveryFee: z.ZodDefault<z.ZodNumber>;
    discount: z.ZodDefault<z.ZodNumber>;
    total: z.ZodNumber;
    payment: z.ZodObject<{
        method: z.ZodEnum<["upi", "card", "wallet", "cod"]>;
        status: z.ZodEnum<["pending", "paid", "failed", "refunded"]>;
        transactionId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "failed" | "pending" | "paid" | "refunded";
        method: "upi" | "card" | "wallet" | "cod";
        transactionId?: string | undefined;
    }, {
        status: "failed" | "pending" | "paid" | "refunded";
        method: "upi" | "card" | "wallet" | "cod";
        transactionId?: string | undefined;
    }>;
    delivery: z.ZodOptional<z.ZodObject<{
        status: z.ZodEnum<["pending", "confirmed", "dispatched", "delivered", "failed"]>;
        estimatedTime: z.ZodOptional<z.ZodDate>;
        actualTime: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        status: "delivered" | "failed" | "pending" | "confirmed" | "dispatched";
        estimatedTime?: Date | undefined;
        actualTime?: Date | undefined;
    }, {
        status: "delivered" | "failed" | "pending" | "confirmed" | "dispatched";
        estimatedTime?: Date | undefined;
        actualTime?: Date | undefined;
    }>>;
    channel: z.ZodEnum<["whatsapp", "instagram", "sms", "email", "push", "webchat", "voice", "telegram", "rcs"]>;
    conversationId: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["pending", "confirmed", "preparing", "dispatched", "delivered", "cancelled"]>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    customer: {
        name: string;
        id: string;
        phone: string;
        address?: string | undefined;
    };
    tenantId: string;
    status: "delivered" | "pending" | "confirmed" | "preparing" | "dispatched" | "cancelled";
    channel: "email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    subtotal: number;
    discount: number;
    tax: number;
    deliveryFee: number;
    total: number;
    items: {
        name: string;
        price: number;
        productId: string;
        quantity: number;
        total: number;
    }[];
    payment: {
        status: "failed" | "pending" | "paid" | "refunded";
        method: "upi" | "card" | "wallet" | "cod";
        transactionId?: string | undefined;
    };
    orderNumber: string;
    conversationId?: string | undefined;
    delivery?: {
        status: "delivered" | "failed" | "pending" | "confirmed" | "dispatched";
        estimatedTime?: Date | undefined;
        actualTime?: Date | undefined;
    } | undefined;
}, {
    customer: {
        name: string;
        id: string;
        phone: string;
        address?: string | undefined;
    };
    tenantId: string;
    status: "delivered" | "pending" | "confirmed" | "preparing" | "dispatched" | "cancelled";
    channel: "email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    subtotal: number;
    total: number;
    items: {
        name: string;
        price: number;
        productId: string;
        quantity: number;
        total: number;
    }[];
    payment: {
        status: "failed" | "pending" | "paid" | "refunded";
        method: "upi" | "card" | "wallet" | "cod";
        transactionId?: string | undefined;
    };
    orderNumber: string;
    conversationId?: string | undefined;
    discount?: number | undefined;
    tax?: number | undefined;
    deliveryFee?: number | undefined;
    delivery?: {
        status: "delivered" | "failed" | "pending" | "confirmed" | "dispatched";
        estimatedTime?: Date | undefined;
        actualTime?: Date | undefined;
    } | undefined;
}>;
export type Order = z.infer<typeof OrderSchema>;
export declare const CampaignSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    channel: z.ZodEnum<["whatsapp", "instagram", "sms", "email", "push", "webchat", "voice", "telegram", "rcs"]>;
    type: z.ZodEnum<["marketing", "transactional", "promotional", "welcome", "abandoned_cart"]>;
    content: z.ZodObject<{
        templateId: z.ZodOptional<z.ZodString>;
        subject: z.ZodOptional<z.ZodString>;
        text: z.ZodString;
        mediaUrl: z.ZodOptional<z.ZodString>;
        buttons: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            title: string;
            url?: string | undefined;
        }, {
            id: string;
            title: string;
            url?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        buttons?: {
            id: string;
            title: string;
            url?: string | undefined;
        }[] | undefined;
        mediaUrl?: string | undefined;
        subject?: string | undefined;
        templateId?: string | undefined;
    }, {
        text: string;
        buttons?: {
            id: string;
            title: string;
            url?: string | undefined;
        }[] | undefined;
        mediaUrl?: string | undefined;
        subject?: string | undefined;
        templateId?: string | undefined;
    }>;
    segmentIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    targetFilters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    estimatedReach: z.ZodOptional<z.ZodNumber>;
    scheduledAt: z.ZodOptional<z.ZodDate>;
    startedAt: z.ZodOptional<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    status: z.ZodDefault<z.ZodEnum<["draft", "scheduled", "sending", "completed", "paused", "cancelled"]>>;
    abTest: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        variantB: z.ZodOptional<z.ZodString>;
        variantBRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        variantBRate: number;
        variantB?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        variantB?: string | undefined;
        variantBRate?: number | undefined;
    }>>;
    stats: z.ZodObject<{
        sent: z.ZodDefault<z.ZodNumber>;
        delivered: z.ZodDefault<z.ZodNumber>;
        opened: z.ZodDefault<z.ZodNumber>;
        clicked: z.ZodDefault<z.ZodNumber>;
        converted: z.ZodDefault<z.ZodNumber>;
        failed: z.ZodDefault<z.ZodNumber>;
        unsubscribed: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        sent: number;
        delivered: number;
        failed: number;
        opened: number;
        clicked: number;
        converted: number;
        unsubscribed: number;
    }, {
        sent?: number | undefined;
        delivered?: number | undefined;
        failed?: number | undefined;
        opened?: number | undefined;
        clicked?: number | undefined;
        converted?: number | undefined;
        unsubscribed?: number | undefined;
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    type: "marketing" | "transactional" | "promotional" | "welcome" | "abandoned_cart";
    status: "draft" | "completed" | "cancelled" | "scheduled" | "sending" | "paused";
    name: string;
    channel: "email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs";
    content: {
        text: string;
        buttons?: {
            id: string;
            title: string;
            url?: string | undefined;
        }[] | undefined;
        mediaUrl?: string | undefined;
        subject?: string | undefined;
        templateId?: string | undefined;
    };
    id: string;
    createdAt: Date;
    updatedAt: Date;
    stats: {
        sent: number;
        delivered: number;
        failed: number;
        opened: number;
        clicked: number;
        converted: number;
        unsubscribed: number;
    };
    description?: string | undefined;
    segmentIds?: string[] | undefined;
    targetFilters?: Record<string, any> | undefined;
    estimatedReach?: number | undefined;
    scheduledAt?: Date | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
    abTest?: {
        enabled: boolean;
        variantBRate: number;
        variantB?: string | undefined;
    } | undefined;
}, {
    tenantId: string;
    type: "marketing" | "transactional" | "promotional" | "welcome" | "abandoned_cart";
    name: string;
    channel: "email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs";
    content: {
        text: string;
        buttons?: {
            id: string;
            title: string;
            url?: string | undefined;
        }[] | undefined;
        mediaUrl?: string | undefined;
        subject?: string | undefined;
        templateId?: string | undefined;
    };
    id: string;
    createdAt: Date;
    updatedAt: Date;
    stats: {
        sent?: number | undefined;
        delivered?: number | undefined;
        failed?: number | undefined;
        opened?: number | undefined;
        clicked?: number | undefined;
        converted?: number | undefined;
        unsubscribed?: number | undefined;
    };
    status?: "draft" | "completed" | "cancelled" | "scheduled" | "sending" | "paused" | undefined;
    description?: string | undefined;
    segmentIds?: string[] | undefined;
    targetFilters?: Record<string, any> | undefined;
    estimatedReach?: number | undefined;
    scheduledAt?: Date | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
    abTest?: {
        enabled?: boolean | undefined;
        variantB?: string | undefined;
        variantBRate?: number | undefined;
    } | undefined;
}>;
export type Campaign = z.infer<typeof CampaignSchema>;
export declare const TemplateSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    channel: z.ZodEnum<["whatsapp", "instagram", "sms", "email", "push", "webchat", "voice", "telegram", "rcs"]>;
    category: z.ZodEnum<["marketing", "transactional", "utility", "authentication", "marketing_template"]>;
    content: z.ZodObject<{
        body: z.ZodString;
        header: z.ZodOptional<z.ZodString>;
        footer: z.ZodOptional<z.ZodString>;
        buttons: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodEnum<["url", "phone", "quick_reply"]>;
            title: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "url" | "quick_reply" | "phone";
            id: string;
            title: string;
        }, {
            type: "url" | "quick_reply" | "phone";
            id: string;
            title: string;
        }>, "many">>;
        variables: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        body: string;
        buttons?: {
            type: "url" | "quick_reply" | "phone";
            id: string;
            title: string;
        }[] | undefined;
        header?: string | undefined;
        footer?: string | undefined;
        variables?: string[] | undefined;
    }, {
        body: string;
        buttons?: {
            type: "url" | "quick_reply" | "phone";
            id: string;
            title: string;
        }[] | undefined;
        header?: string | undefined;
        footer?: string | undefined;
        variables?: string[] | undefined;
    }>;
    whatsappCategory: z.ZodOptional<z.ZodString>;
    whatsappTemplateId: z.ZodOptional<z.ZodString>;
    approvalStatus: z.ZodDefault<z.ZodEnum<["pending", "approved", "rejected"]>>;
    status: z.ZodDefault<z.ZodEnum<["active", "inactive", "archived"]>>;
    usageCount: z.ZodDefault<z.ZodNumber>;
    lastUsedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    status: "active" | "archived" | "inactive";
    name: string;
    channel: "email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs";
    content: {
        body: string;
        buttons?: {
            type: "url" | "quick_reply" | "phone";
            id: string;
            title: string;
        }[] | undefined;
        header?: string | undefined;
        footer?: string | undefined;
        variables?: string[] | undefined;
    };
    id: string;
    category: "marketing" | "transactional" | "utility" | "authentication" | "marketing_template";
    createdAt: Date;
    updatedAt: Date;
    approvalStatus: "pending" | "approved" | "rejected";
    usageCount: number;
    whatsappCategory?: string | undefined;
    whatsappTemplateId?: string | undefined;
    lastUsedAt?: Date | undefined;
}, {
    tenantId: string;
    name: string;
    channel: "email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs";
    content: {
        body: string;
        buttons?: {
            type: "url" | "quick_reply" | "phone";
            id: string;
            title: string;
        }[] | undefined;
        header?: string | undefined;
        footer?: string | undefined;
        variables?: string[] | undefined;
    };
    id: string;
    category: "marketing" | "transactional" | "utility" | "authentication" | "marketing_template";
    createdAt: Date;
    updatedAt: Date;
    status?: "active" | "archived" | "inactive" | undefined;
    whatsappCategory?: string | undefined;
    whatsappTemplateId?: string | undefined;
    approvalStatus?: "pending" | "approved" | "rejected" | undefined;
    usageCount?: number | undefined;
    lastUsedAt?: Date | undefined;
}>;
export type Template = z.infer<typeof TemplateSchema>;
export declare const PlatformAnalyticsSchema: z.ZodObject<{
    tenantId: z.ZodString;
    period: z.ZodObject<{
        start: z.ZodDate;
        end: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        end: Date;
        start: Date;
    }, {
        end: Date;
        start: Date;
    }>;
    overview: z.ZodObject<{
        totalConversations: z.ZodNumber;
        activeConversations: z.ZodNumber;
        resolvedConversations: z.ZodNumber;
        avgResponseTime: z.ZodNumber;
        avgResolutionTime: z.ZodNumber;
        csat: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        avgResponseTime: number;
        totalConversations: number;
        avgResolutionTime: number;
        activeConversations: number;
        resolvedConversations: number;
        csat?: number | undefined;
    }, {
        avgResponseTime: number;
        totalConversations: number;
        avgResolutionTime: number;
        activeConversations: number;
        resolvedConversations: number;
        csat?: number | undefined;
    }>;
    byChannel: z.ZodRecord<z.ZodEnum<["whatsapp", "instagram", "sms", "email", "push", "webchat", "voice", "telegram", "rcs"]>, z.ZodObject<{
        conversations: z.ZodNumber;
        messages: z.ZodNumber;
        avgResponseTime: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        avgResponseTime: number;
        conversations: number;
        messages: number;
    }, {
        avgResponseTime: number;
        conversations: number;
        messages: number;
    }>>;
    commerce: z.ZodObject<{
        ordersCreated: z.ZodNumber;
        ordersCompleted: z.ZodNumber;
        revenue: z.ZodNumber;
        cartAbandonmentRate: z.ZodNumber;
        checkoutConversionRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        ordersCreated: number;
        ordersCompleted: number;
        revenue: number;
        cartAbandonmentRate: number;
        checkoutConversionRate: number;
    }, {
        ordersCreated: number;
        ordersCompleted: number;
        revenue: number;
        cartAbandonmentRate: number;
        checkoutConversionRate: number;
    }>;
    campaigns: z.ZodObject<{
        sent: z.ZodNumber;
        delivered: z.ZodNumber;
        opened: z.ZodNumber;
        clicked: z.ZodNumber;
        converted: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        converted: number;
    }, {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        converted: number;
    }>;
    agents: z.ZodObject<{
        total: z.ZodNumber;
        online: z.ZodNumber;
        busy: z.ZodNumber;
        avgHandlingTime: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
        online: number;
        busy: number;
        avgHandlingTime: number;
    }, {
        total: number;
        online: number;
        busy: number;
        avgHandlingTime: number;
    }>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    period: {
        end: Date;
        start: Date;
    };
    overview: {
        avgResponseTime: number;
        totalConversations: number;
        avgResolutionTime: number;
        activeConversations: number;
        resolvedConversations: number;
        csat?: number | undefined;
    };
    byChannel: Partial<Record<"email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs", {
        avgResponseTime: number;
        conversations: number;
        messages: number;
    }>>;
    commerce: {
        ordersCreated: number;
        ordersCompleted: number;
        revenue: number;
        cartAbandonmentRate: number;
        checkoutConversionRate: number;
    };
    campaigns: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        converted: number;
    };
    agents: {
        total: number;
        online: number;
        busy: number;
        avgHandlingTime: number;
    };
}, {
    tenantId: string;
    period: {
        end: Date;
        start: Date;
    };
    overview: {
        avgResponseTime: number;
        totalConversations: number;
        avgResolutionTime: number;
        activeConversations: number;
        resolvedConversations: number;
        csat?: number | undefined;
    };
    byChannel: Partial<Record<"email" | "push" | "whatsapp" | "instagram" | "webchat" | "sms" | "voice" | "telegram" | "rcs", {
        avgResponseTime: number;
        conversations: number;
        messages: number;
    }>>;
    commerce: {
        ordersCreated: number;
        ordersCompleted: number;
        revenue: number;
        cartAbandonmentRate: number;
        checkoutConversionRate: number;
    };
    campaigns: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        converted: number;
    };
    agents: {
        total: number;
        online: number;
        busy: number;
        avgHandlingTime: number;
    };
}>;
export type PlatformAnalytics = z.infer<typeof PlatformAnalyticsSchema>;
