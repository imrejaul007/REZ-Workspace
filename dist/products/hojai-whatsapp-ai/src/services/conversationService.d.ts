import mongoose from 'mongoose';
import { Conversation, Message } from '../types/index.js';
export declare const ConversationModel: mongoose.Model<{
    channel: string;
    status: "active" | "resolved" | "escalated" | "waiting";
    tenantId: string;
    merchantId: string;
    messageCount: number;
    lastMessageAt: NativeDate;
    customerId: string;
    customerPhone: string;
    context?: Map<string, any> | null | undefined;
    customerName?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    channel: string;
    status: "active" | "resolved" | "escalated" | "waiting";
    tenantId: string;
    merchantId: string;
    messageCount: number;
    lastMessageAt: NativeDate;
    customerId: string;
    customerPhone: string;
    context?: Map<string, any> | null | undefined;
    customerName?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    channel: string;
    status: "active" | "resolved" | "escalated" | "waiting";
    tenantId: string;
    merchantId: string;
    messageCount: number;
    lastMessageAt: NativeDate;
    customerId: string;
    customerPhone: string;
    context?: Map<string, any> | null | undefined;
    customerName?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    channel: string;
    status: "active" | "resolved" | "escalated" | "waiting";
    tenantId: string;
    merchantId: string;
    messageCount: number;
    lastMessageAt: NativeDate;
    customerId: string;
    customerPhone: string;
    context?: Map<string, any> | null | undefined;
    customerName?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    channel: string;
    status: "active" | "resolved" | "escalated" | "waiting";
    tenantId: string;
    merchantId: string;
    messageCount: number;
    lastMessageAt: NativeDate;
    customerId: string;
    customerPhone: string;
    context?: Map<string, any> | null | undefined;
    customerName?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    channel: string;
    status: "active" | "resolved" | "escalated" | "waiting";
    tenantId: string;
    merchantId: string;
    messageCount: number;
    lastMessageAt: NativeDate;
    customerId: string;
    customerPhone: string;
    context?: Map<string, any> | null | undefined;
    customerName?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const MessageModel: mongoose.Model<{
    role: "user" | "assistant" | "system";
    type: "text" | "location" | "image" | "video" | "audio" | "document" | "button" | "template";
    content: string;
    tenantId: string;
    direction: "inbound" | "outbound";
    conversationId: string;
    messageId: string;
    merchantId: string;
    metadata?: Map<string, any> | null | undefined;
    intent?: string | null | undefined;
    confidence?: number | null | undefined;
    mediaUrl?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    role: "user" | "assistant" | "system";
    type: "text" | "location" | "image" | "video" | "audio" | "document" | "button" | "template";
    content: string;
    tenantId: string;
    direction: "inbound" | "outbound";
    conversationId: string;
    messageId: string;
    merchantId: string;
    metadata?: Map<string, any> | null | undefined;
    intent?: string | null | undefined;
    confidence?: number | null | undefined;
    mediaUrl?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    role: "user" | "assistant" | "system";
    type: "text" | "location" | "image" | "video" | "audio" | "document" | "button" | "template";
    content: string;
    tenantId: string;
    direction: "inbound" | "outbound";
    conversationId: string;
    messageId: string;
    merchantId: string;
    metadata?: Map<string, any> | null | undefined;
    intent?: string | null | undefined;
    confidence?: number | null | undefined;
    mediaUrl?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    role: "user" | "assistant" | "system";
    type: "text" | "location" | "image" | "video" | "audio" | "document" | "button" | "template";
    content: string;
    tenantId: string;
    direction: "inbound" | "outbound";
    conversationId: string;
    messageId: string;
    merchantId: string;
    metadata?: Map<string, any> | null | undefined;
    intent?: string | null | undefined;
    confidence?: number | null | undefined;
    mediaUrl?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    role: "user" | "assistant" | "system";
    type: "text" | "location" | "image" | "video" | "audio" | "document" | "button" | "template";
    content: string;
    tenantId: string;
    direction: "inbound" | "outbound";
    conversationId: string;
    messageId: string;
    merchantId: string;
    metadata?: Map<string, any> | null | undefined;
    intent?: string | null | undefined;
    confidence?: number | null | undefined;
    mediaUrl?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    role: "user" | "assistant" | "system";
    type: "text" | "location" | "image" | "video" | "audio" | "document" | "button" | "template";
    content: string;
    tenantId: string;
    direction: "inbound" | "outbound";
    conversationId: string;
    messageId: string;
    merchantId: string;
    metadata?: Map<string, any> | null | undefined;
    intent?: string | null | undefined;
    confidence?: number | null | undefined;
    mediaUrl?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const BusinessProfileModel: mongoose.Model<{
    name: string;
    language: string;
    tenantId: string;
    timezone: string;
    merchantId: string;
    description?: string | null | undefined;
    category?: string | null | undefined;
    features?: {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        catalog: boolean;
        ordering: boolean;
    } | null | undefined;
    email?: string | null | undefined;
    address?: string | null | undefined;
    website?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    language: string;
    tenantId: string;
    timezone: string;
    merchantId: string;
    description?: string | null | undefined;
    category?: string | null | undefined;
    features?: {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        catalog: boolean;
        ordering: boolean;
    } | null | undefined;
    email?: string | null | undefined;
    address?: string | null | undefined;
    website?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    language: string;
    tenantId: string;
    timezone: string;
    merchantId: string;
    description?: string | null | undefined;
    category?: string | null | undefined;
    features?: {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        catalog: boolean;
        ordering: boolean;
    } | null | undefined;
    email?: string | null | undefined;
    address?: string | null | undefined;
    website?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    language: string;
    tenantId: string;
    timezone: string;
    merchantId: string;
    description?: string | null | undefined;
    category?: string | null | undefined;
    features?: {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        catalog: boolean;
        ordering: boolean;
    } | null | undefined;
    email?: string | null | undefined;
    address?: string | null | undefined;
    website?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    language: string;
    tenantId: string;
    timezone: string;
    merchantId: string;
    description?: string | null | undefined;
    category?: string | null | undefined;
    features?: {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        catalog: boolean;
        ordering: boolean;
    } | null | undefined;
    email?: string | null | undefined;
    address?: string | null | undefined;
    website?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    language: string;
    tenantId: string;
    timezone: string;
    merchantId: string;
    description?: string | null | undefined;
    category?: string | null | undefined;
    features?: {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        catalog: boolean;
        ordering: boolean;
    } | null | undefined;
    email?: string | null | undefined;
    address?: string | null | undefined;
    website?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const KnowledgeBaseModel: mongoose.Model<{
    keywords: string[];
    category: string;
    active: boolean;
    tenantId: string;
    confidence: number;
    question: string;
    usageCount: number;
    merchantId: string;
    answer: string;
    intents: string[];
    helpfulCount: number;
    notHelpfulCount: number;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    keywords: string[];
    category: string;
    active: boolean;
    tenantId: string;
    confidence: number;
    question: string;
    usageCount: number;
    merchantId: string;
    answer: string;
    intents: string[];
    helpfulCount: number;
    notHelpfulCount: number;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    keywords: string[];
    category: string;
    active: boolean;
    tenantId: string;
    confidence: number;
    question: string;
    usageCount: number;
    merchantId: string;
    answer: string;
    intents: string[];
    helpfulCount: number;
    notHelpfulCount: number;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    keywords: string[];
    category: string;
    active: boolean;
    tenantId: string;
    confidence: number;
    question: string;
    usageCount: number;
    merchantId: string;
    answer: string;
    intents: string[];
    helpfulCount: number;
    notHelpfulCount: number;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    keywords: string[];
    category: string;
    active: boolean;
    tenantId: string;
    confidence: number;
    question: string;
    usageCount: number;
    merchantId: string;
    answer: string;
    intents: string[];
    helpfulCount: number;
    notHelpfulCount: number;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    keywords: string[];
    category: string;
    active: boolean;
    tenantId: string;
    confidence: number;
    question: string;
    usageCount: number;
    merchantId: string;
    answer: string;
    intents: string[];
    helpfulCount: number;
    notHelpfulCount: number;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const AutomationRuleModel: mongoose.Model<{
    name: string;
    active: boolean;
    tenantId: string;
    actions: mongoose.Types.DocumentArray<{
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }> & {
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }>;
    priority: number;
    merchantId: string;
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    stats?: {
        success: number;
        triggers: number;
        failures: number;
    } | null | undefined;
    trigger?: {
        type?: "event" | "intent" | "keyword" | "time" | "inactivity" | null | undefined;
        config?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    active: boolean;
    tenantId: string;
    actions: mongoose.Types.DocumentArray<{
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }> & {
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }>;
    priority: number;
    merchantId: string;
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    stats?: {
        success: number;
        triggers: number;
        failures: number;
    } | null | undefined;
    trigger?: {
        type?: "event" | "intent" | "keyword" | "time" | "inactivity" | null | undefined;
        config?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    active: boolean;
    tenantId: string;
    actions: mongoose.Types.DocumentArray<{
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }> & {
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }>;
    priority: number;
    merchantId: string;
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    stats?: {
        success: number;
        triggers: number;
        failures: number;
    } | null | undefined;
    trigger?: {
        type?: "event" | "intent" | "keyword" | "time" | "inactivity" | null | undefined;
        config?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    active: boolean;
    tenantId: string;
    actions: mongoose.Types.DocumentArray<{
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }> & {
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }>;
    priority: number;
    merchantId: string;
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    stats?: {
        success: number;
        triggers: number;
        failures: number;
    } | null | undefined;
    trigger?: {
        type?: "event" | "intent" | "keyword" | "time" | "inactivity" | null | undefined;
        config?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    active: boolean;
    tenantId: string;
    actions: mongoose.Types.DocumentArray<{
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }> & {
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }>;
    priority: number;
    merchantId: string;
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    stats?: {
        success: number;
        triggers: number;
        failures: number;
    } | null | undefined;
    trigger?: {
        type?: "event" | "intent" | "keyword" | "time" | "inactivity" | null | undefined;
        config?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    active: boolean;
    tenantId: string;
    actions: mongoose.Types.DocumentArray<{
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }> & {
        type?: "workflow" | "assign" | "reply" | "template" | "webhook" | "tag" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }>;
    priority: number;
    merchantId: string;
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    stats?: {
        success: number;
        triggers: number;
        failures: number;
    } | null | undefined;
    trigger?: {
        type?: "event" | "intent" | "keyword" | "time" | "inactivity" | null | undefined;
        config?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare class ConversationService {
    getOrCreateConversation(tenantId: string, merchantId: string, customerId: string, customerPhone: string, customerName?: string): Promise<Conversation>;
    addMessage(params: {
        tenantId: string;
        merchantId: string;
        conversationId: string;
        messageId: string;
        direction: 'inbound' | 'outbound';
        role: 'user' | 'assistant' | 'system';
        content: string;
        type?: string;
        intent?: string;
        confidence?: number;
        metadata?: Record<string, unknown>;
    }): Promise<Message>;
    getConversationMessages(conversationId: string, limit?: number): Promise<Message[]>;
    getHistory(conversationId: string, limit?: number): Promise<Message[]>;
    resolveConversation(conversationId: string): Promise<void>;
    escalateConversation(conversationId: string): Promise<void>;
}
export declare const conversationService: ConversationService;
//# sourceMappingURL=conversationService.d.ts.map