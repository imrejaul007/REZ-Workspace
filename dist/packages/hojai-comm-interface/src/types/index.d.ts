import { z } from 'zod';
export declare enum EmployeeStatus {
    ONLINE = "online",
    OFFLINE = "offline",
    BUSY = "busy",
    AWAY = "away",
    AVAILABLE = "available"
}
export declare enum MessageDirection {
    INBOUND = "inbound",
    OUTBOUND = "outbound"
}
export declare enum MessageType {
    TEXT = "text",
    IMAGE = "image",
    VIDEO = "video",
    AUDIO = "audio",
    DOCUMENT = "document",
    LOCATION = "location",
    CONTACT = "contact",
    BUTTON = "button",
    INTERACTIVE = "interactive"
}
export declare enum Source {
    WHATSAPP = "whatsapp",
    WEB = "web",
    API = "api"
}
export declare enum ConversationStatus {
    ACTIVE = "active",
    CLOSED = "closed",
    PENDING = "pending",
    ARCHIVED = "archived"
}
export declare const EmployeeSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    role: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodArray<z.ZodString, "many">;
    status: z.ZodDefault<z.ZodNativeEnum<typeof EmployeeStatus>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    skills: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    languages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    workingHours: z.ZodOptional<z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
        timezone: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        end: string;
        start: string;
        timezone: string;
    }, {
        end: string;
        start: string;
        timezone?: string | undefined;
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    role: string;
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: EmployeeStatus;
    tenantId: string;
    capabilities: string[];
    skills: string[];
    languages: string[];
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    avatar?: string | undefined;
    workingHours?: {
        end: string;
        start: string;
        timezone: string;
    } | undefined;
}, {
    role: string;
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    capabilities: string[];
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    status?: EmployeeStatus | undefined;
    avatar?: string | undefined;
    skills?: string[] | undefined;
    languages?: string[] | undefined;
    workingHours?: {
        end: string;
        start: string;
        timezone?: string | undefined;
    } | undefined;
}>;
export type Employee = z.infer<typeof EmployeeSchema>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    conversationId: z.ZodString;
    employeeId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    direction: z.ZodNativeEnum<typeof MessageDirection>;
    source: z.ZodNativeEnum<typeof Source>;
    type: z.ZodDefault<z.ZodNativeEnum<typeof MessageType>>;
    content: z.ZodObject<{
        text: z.ZodOptional<z.ZodString>;
        mediaUrl: z.ZodOptional<z.ZodString>;
        mediaCaption: z.ZodOptional<z.ZodString>;
        buttons: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
        }, {
            id: string;
            text: string;
        }>, "many">>;
        location: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            latitude: number;
            longitude: number;
            name?: string | undefined;
        }, {
            latitude: number;
            longitude: number;
            name?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        text?: string | undefined;
        location?: {
            latitude: number;
            longitude: number;
            name?: string | undefined;
        } | undefined;
        mediaUrl?: string | undefined;
        mediaCaption?: string | undefined;
        buttons?: {
            id: string;
            text: string;
        }[] | undefined;
    }, {
        text?: string | undefined;
        location?: {
            latitude: number;
            longitude: number;
            name?: string | undefined;
        } | undefined;
        mediaUrl?: string | undefined;
        mediaCaption?: string | undefined;
        buttons?: {
            id: string;
            text: string;
        }[] | undefined;
    }>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    status: z.ZodDefault<z.ZodEnum<["sent", "delivered", "read", "failed"]>>;
    externalId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    source: Source;
    type: MessageType;
    content: {
        text?: string | undefined;
        location?: {
            latitude: number;
            longitude: number;
            name?: string | undefined;
        } | undefined;
        mediaUrl?: string | undefined;
        mediaCaption?: string | undefined;
        buttons?: {
            id: string;
            text: string;
        }[] | undefined;
    };
    userId: string;
    id: string;
    createdAt: Date;
    status: "failed" | "read" | "sent" | "delivered";
    tenantId: string;
    timestamp: Date;
    direction: MessageDirection;
    conversationId: string;
    metadata?: Record<string, any> | undefined;
    employeeId?: string | undefined;
    externalId?: string | undefined;
}, {
    source: Source;
    content: {
        text?: string | undefined;
        location?: {
            latitude: number;
            longitude: number;
            name?: string | undefined;
        } | undefined;
        mediaUrl?: string | undefined;
        mediaCaption?: string | undefined;
        buttons?: {
            id: string;
            text: string;
        }[] | undefined;
    };
    userId: string;
    id: string;
    createdAt: Date;
    tenantId: string;
    timestamp: Date;
    direction: MessageDirection;
    conversationId: string;
    type?: MessageType | undefined;
    metadata?: Record<string, any> | undefined;
    status?: "failed" | "read" | "sent" | "delivered" | undefined;
    employeeId?: string | undefined;
    externalId?: string | undefined;
}>;
export type Message = z.infer<typeof MessageSchema>;
export declare const ConversationSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    userName: z.ZodOptional<z.ZodString>;
    employeeId: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof ConversationStatus>>;
    source: z.ZodDefault<z.ZodNativeEnum<typeof Source>>;
    lastMessage: z.ZodOptional<z.ZodObject<{
        content: z.ZodString;
        sender: z.ZodEnum<["user", "employee", "system"]>;
        timestamp: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        content: string;
        timestamp: Date;
        sender: "user" | "system" | "employee";
    }, {
        content: string;
        timestamp: Date;
        sender: "user" | "system" | "employee";
    }>>;
    context: z.ZodOptional<z.ZodObject<{
        intent: z.ZodOptional<z.ZodString>;
        entities: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        sentiment: z.ZodOptional<z.ZodEnum<["positive", "neutral", "negative"]>>;
        language: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        intent?: string | undefined;
        entities?: Record<string, any> | undefined;
        sentiment?: "positive" | "neutral" | "negative" | undefined;
    }, {
        language?: string | undefined;
        intent?: string | undefined;
        entities?: Record<string, any> | undefined;
        sentiment?: "positive" | "neutral" | "negative" | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    unreadCount: z.ZodDefault<z.ZodNumber>;
    assignedAt: z.ZodOptional<z.ZodDate>;
    closedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    source: Source;
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: ConversationStatus;
    tenantId: string;
    unreadCount: number;
    context?: {
        language: string;
        intent?: string | undefined;
        entities?: Record<string, any> | undefined;
        sentiment?: "positive" | "neutral" | "negative" | undefined;
    } | undefined;
    metadata?: Record<string, any> | undefined;
    assignedAt?: Date | undefined;
    employeeId?: string | undefined;
    userName?: string | undefined;
    lastMessage?: {
        content: string;
        timestamp: Date;
        sender: "user" | "system" | "employee";
    } | undefined;
    closedAt?: Date | undefined;
}, {
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    context?: {
        language?: string | undefined;
        intent?: string | undefined;
        entities?: Record<string, any> | undefined;
        sentiment?: "positive" | "neutral" | "negative" | undefined;
    } | undefined;
    source?: Source | undefined;
    metadata?: Record<string, any> | undefined;
    status?: ConversationStatus | undefined;
    assignedAt?: Date | undefined;
    employeeId?: string | undefined;
    userName?: string | undefined;
    lastMessage?: {
        content: string;
        timestamp: Date;
        sender: "user" | "system" | "employee";
    } | undefined;
    unreadCount?: number | undefined;
    closedAt?: Date | undefined;
}>;
export type Conversation = z.infer<typeof ConversationSchema>;
export declare const TaskAssignmentSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    conversationId: z.ZodString;
    employeeId: z.ZodString;
    assignedBy: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high", "urgent"]>>;
    notes: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["assigned", "accepted", "completed", "rejected", "transferred"]>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: "completed" | "rejected" | "assigned" | "accepted" | "transferred";
    tenantId: string;
    priority: "low" | "high" | "normal" | "urgent";
    employeeId: string;
    conversationId: string;
    assignedBy?: string | undefined;
    notes?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    employeeId: string;
    conversationId: string;
    status?: "completed" | "rejected" | "assigned" | "accepted" | "transferred" | undefined;
    priority?: "low" | "high" | "normal" | "urgent" | undefined;
    assignedBy?: string | undefined;
    notes?: string | undefined;
}>;
export type TaskAssignment = z.infer<typeof TaskAssignmentSchema>;
export interface ChatRequest {
    tenantId: string;
    userId: string;
    userName?: string;
    employeeId?: string;
    message: string;
    source: Source;
    metadata?: Record<string, unknown>;
}
export interface ChatResponse {
    success: boolean;
    conversationId: string;
    messageId: string;
    response: string;
    employeeId?: string;
    timestamp: string;
}
export interface EmployeeListResponse {
    success: boolean;
    employees: Array<{
        id: string;
        name: string;
        role: string;
        status: EmployeeStatus;
        capabilities: string[];
        avatar?: string;
    }>;
}
export interface ConversationHistoryResponse {
    success: boolean;
    conversations: Array<{
        id: string;
        employeeId?: string;
        employeeName?: string;
        status: ConversationStatus;
        lastMessage?: {
            content: string;
            sender: string;
            timestamp: string;
        };
        createdAt: string;
        updatedAt: string;
    }>;
    messages: Array<{
        id: string;
        direction: MessageDirection;
        type: MessageType;
        content: string;
        timestamp: string;
        status: string;
    }>;
}
export interface WebSocketMessage {
    type: 'message' | 'typing' | 'status' | 'error' | 'ping' | 'pong' | 'join_conversation' | 'leave_conversation';
    payload: Record<string, unknown>;
    timestamp: string;
}
export interface WebSocketConnection {
    id: string;
    tenantId: string;
    userId: string;
    conversationId?: string;
    source: Source;
    connectedAt: Date;
}
export interface TenantContext {
    tenantId: string;
    userId?: string;
    requestId: string;
    source: Source;
}
export interface AuthContext {
    tenantId: string;
    userId?: string;
    role?: string;
    permissions?: string[];
}
export interface EmployeeRoutingResult {
    employeeId: string;
    employee: Employee;
    confidence: number;
    reason: string;
}
export interface MessageContext {
    tenantId: string;
    userId: string;
    conversationId?: string;
    employeeId?: string;
    message: string;
    source: Source;
    metadata?: Record<string, unknown>;
}
export interface WhatsAppWebhookPayload {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts?: Array<{
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }>;
                messages?: Array<{
                    from: string;
                    id: string;
                    timestamp: string;
                    type: string;
                    text?: {
                        body: string;
                    };
                    image?: {
                        id: string;
                        mime_type: string;
                        sha256: string;
                        caption?: string;
                    };
                    location?: {
                        latitude: number;
                        longitude: number;
                        name?: string;
                    };
                    interactive?: {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        };
                    };
                }>;
                statuses?: Array<{
                    id: string;
                    status: string;
                    timestamp: string;
                    recipient_id: string;
                }>;
            };
            field: string;
        }>;
    }>;
}
export interface WhatsAppOutboundMessage {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    text?: {
        body: string;
    };
    image?: {
        link: string;
        caption?: string;
    };
    audio?: {
        id: string;
    };
    document?: {
        link: string;
        caption?: string;
        filename: string;
    };
    sticker?: {
        id: string;
    };
    location?: {
        latitude: number;
        longitude: number;
        name?: string;
        address?: string;
    };
    interactive?: {
        type: string;
        header?: {
            type: string;
            text: string;
        };
        body?: {
            text: string;
        };
        footer?: {
            text: string;
        };
        action: {
            buttons: Array<{
                type: string;
                reply: {
                    id: string;
                    title: string;
                };
            }>;
        };
    };
}
//# sourceMappingURL=index.d.ts.map