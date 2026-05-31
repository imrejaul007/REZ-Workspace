import mongoose from 'mongoose';
import { Conversation, Message } from '../types/index.js';
export declare const ConversationModel: mongoose.Model<{
    status: "active" | "escalated" | "resolved" | "waiting";
    tenantId: string;
    customerId: string;
    channel: string;
    merchantId: string;
    customerPhone: string;
    lastMessageAt: NativeDate;
    messageCount: number;
    context?: Map<string, any> | null | undefined;
    customerName?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    status: "active" | "escalated" | "resolved" | "waiting";
    tenantId: string;
    customerId: string;
    channel: string;
    merchantId: string;
    customerPhone: string;
    lastMessageAt: NativeDate;
    messageCount: number;
    context?: Map<string, any> | null | undefined;
    customerName?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: "active" | "escalated" | "resolved" | "waiting";
    tenantId: string;
    customerId: string;
    channel: string;
    merchantId: string;
    customerPhone: string;
    lastMessageAt: NativeDate;
    messageCount: number;
    context?: Map<string, any> | null | undefined;
    customerName?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "active" | "escalated" | "resolved" | "waiting";
    tenantId: string;
    customerId: string;
    channel: string;
    merchantId: string;
    customerPhone: string;
    lastMessageAt: NativeDate;
    messageCount: number;
    context?: Map<string, any> | null | undefined;
    customerName?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "active" | "escalated" | "resolved" | "waiting";
    tenantId: string;
    customerId: string;
    channel: string;
    merchantId: string;
    customerPhone: string;
    lastMessageAt: NativeDate;
    messageCount: number;
    context?: Map<string, any> | null | undefined;
    customerName?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: "active" | "escalated" | "resolved" | "waiting";
    tenantId: string;
    customerId: string;
    channel: string;
    merchantId: string;
    customerPhone: string;
    lastMessageAt: NativeDate;
    messageCount: number;
    context?: Map<string, any> | null | undefined;
    customerName?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const MessageModel: mongoose.Model<{
    type: "text" | "image" | "document" | "video" | "audio" | "location" | "template" | "button";
    tenantId: string;
    conversationId: string;
    role: "system" | "user" | "assistant";
    content: string;
    direction: "inbound" | "outbound";
    messageId: string;
    merchantId: string;
    intent?: string | null | undefined;
    confidence?: number | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    mediaUrl?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    type: "text" | "image" | "document" | "video" | "audio" | "location" | "template" | "button";
    tenantId: string;
    conversationId: string;
    role: "system" | "user" | "assistant";
    content: string;
    direction: "inbound" | "outbound";
    messageId: string;
    merchantId: string;
    intent?: string | null | undefined;
    confidence?: number | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    mediaUrl?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    type: "text" | "image" | "document" | "video" | "audio" | "location" | "template" | "button";
    tenantId: string;
    conversationId: string;
    role: "system" | "user" | "assistant";
    content: string;
    direction: "inbound" | "outbound";
    messageId: string;
    merchantId: string;
    intent?: string | null | undefined;
    confidence?: number | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    mediaUrl?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    type: "text" | "image" | "document" | "video" | "audio" | "location" | "template" | "button";
    tenantId: string;
    conversationId: string;
    role: "system" | "user" | "assistant";
    content: string;
    direction: "inbound" | "outbound";
    messageId: string;
    merchantId: string;
    intent?: string | null | undefined;
    confidence?: number | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    mediaUrl?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    type: "text" | "image" | "document" | "video" | "audio" | "location" | "template" | "button";
    tenantId: string;
    conversationId: string;
    role: "system" | "user" | "assistant";
    content: string;
    direction: "inbound" | "outbound";
    messageId: string;
    merchantId: string;
    intent?: string | null | undefined;
    confidence?: number | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    mediaUrl?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    type: "text" | "image" | "document" | "video" | "audio" | "location" | "template" | "button";
    tenantId: string;
    conversationId: string;
    role: "system" | "user" | "assistant";
    content: string;
    direction: "inbound" | "outbound";
    messageId: string;
    merchantId: string;
    intent?: string | null | undefined;
    confidence?: number | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    mediaUrl?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const BusinessProfileModel: mongoose.Model<{
    name: string;
    tenantId: string;
    language: string;
    timezone: string;
    merchantId: string;
    email?: string | null | undefined;
    address?: string | null | undefined;
    category?: string | null | undefined;
    website?: string | null | undefined;
    features?: {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        catalog: boolean;
    } | null | undefined;
    description?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    tenantId: string;
    language: string;
    timezone: string;
    merchantId: string;
    email?: string | null | undefined;
    address?: string | null | undefined;
    category?: string | null | undefined;
    website?: string | null | undefined;
    features?: {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        catalog: boolean;
    } | null | undefined;
    description?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    tenantId: string;
    language: string;
    timezone: string;
    merchantId: string;
    email?: string | null | undefined;
    address?: string | null | undefined;
    category?: string | null | undefined;
    website?: string | null | undefined;
    features?: {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        catalog: boolean;
    } | null | undefined;
    description?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    tenantId: string;
    language: string;
    timezone: string;
    merchantId: string;
    email?: string | null | undefined;
    address?: string | null | undefined;
    category?: string | null | undefined;
    website?: string | null | undefined;
    features?: {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        catalog: boolean;
    } | null | undefined;
    description?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    tenantId: string;
    language: string;
    timezone: string;
    merchantId: string;
    email?: string | null | undefined;
    address?: string | null | undefined;
    category?: string | null | undefined;
    website?: string | null | undefined;
    features?: {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        catalog: boolean;
    } | null | undefined;
    description?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    tenantId: string;
    language: string;
    timezone: string;
    merchantId: string;
    email?: string | null | undefined;
    address?: string | null | undefined;
    category?: string | null | undefined;
    website?: string | null | undefined;
    features?: {
        support: boolean;
        booking: boolean;
        feedback: boolean;
        ordering: boolean;
        catalog: boolean;
    } | null | undefined;
    description?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const KnowledgeBaseModel: mongoose.Model<{
    active: boolean;
    tenantId: string;
    category: string;
    confidence: number;
    merchantId: string;
    keywords: string[];
    question: string;
    answer: string;
    intents: string[];
    usageCount: number;
    helpfulCount: number;
    notHelpfulCount: number;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    active: boolean;
    tenantId: string;
    category: string;
    confidence: number;
    merchantId: string;
    keywords: string[];
    question: string;
    answer: string;
    intents: string[];
    usageCount: number;
    helpfulCount: number;
    notHelpfulCount: number;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    active: boolean;
    tenantId: string;
    category: string;
    confidence: number;
    merchantId: string;
    keywords: string[];
    question: string;
    answer: string;
    intents: string[];
    usageCount: number;
    helpfulCount: number;
    notHelpfulCount: number;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    active: boolean;
    tenantId: string;
    category: string;
    confidence: number;
    merchantId: string;
    keywords: string[];
    question: string;
    answer: string;
    intents: string[];
    usageCount: number;
    helpfulCount: number;
    notHelpfulCount: number;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    active: boolean;
    tenantId: string;
    category: string;
    confidence: number;
    merchantId: string;
    keywords: string[];
    question: string;
    answer: string;
    intents: string[];
    usageCount: number;
    helpfulCount: number;
    notHelpfulCount: number;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    active: boolean;
    tenantId: string;
    category: string;
    confidence: number;
    merchantId: string;
    keywords: string[];
    question: string;
    answer: string;
    intents: string[];
    usageCount: number;
    helpfulCount: number;
    notHelpfulCount: number;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const AutomationRuleModel: mongoose.Model<{
    active: boolean;
    name: string;
    tenantId: string;
    actions: mongoose.Types.DocumentArray<{
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }> & {
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
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
        type?: "intent" | "event" | "keyword" | "time" | "inactivity" | null | undefined;
        config?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    active: boolean;
    name: string;
    tenantId: string;
    actions: mongoose.Types.DocumentArray<{
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }> & {
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
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
        type?: "intent" | "event" | "keyword" | "time" | "inactivity" | null | undefined;
        config?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    active: boolean;
    name: string;
    tenantId: string;
    actions: mongoose.Types.DocumentArray<{
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }> & {
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
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
        type?: "intent" | "event" | "keyword" | "time" | "inactivity" | null | undefined;
        config?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    active: boolean;
    name: string;
    tenantId: string;
    actions: mongoose.Types.DocumentArray<{
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }> & {
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
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
        type?: "intent" | "event" | "keyword" | "time" | "inactivity" | null | undefined;
        config?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    active: boolean;
    name: string;
    tenantId: string;
    actions: mongoose.Types.DocumentArray<{
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }> & {
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
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
        type?: "intent" | "event" | "keyword" | "time" | "inactivity" | null | undefined;
        config?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    active: boolean;
    name: string;
    tenantId: string;
    actions: mongoose.Types.DocumentArray<{
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
        config?: Map<string, any> | null | undefined;
    }> & {
        type?: "workflow" | "template" | "tag" | "assign" | "reply" | "webhook" | null | undefined;
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
        type?: "intent" | "event" | "keyword" | "time" | "inactivity" | null | undefined;
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