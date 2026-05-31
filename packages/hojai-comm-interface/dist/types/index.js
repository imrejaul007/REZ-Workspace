import { z } from 'zod';
// ============================================================================
// ENUMS
// ============================================================================
export var EmployeeStatus;
(function (EmployeeStatus) {
    EmployeeStatus["ONLINE"] = "online";
    EmployeeStatus["OFFLINE"] = "offline";
    EmployeeStatus["BUSY"] = "busy";
    EmployeeStatus["AWAY"] = "away";
    EmployeeStatus["AVAILABLE"] = "available";
})(EmployeeStatus || (EmployeeStatus = {}));
export var MessageDirection;
(function (MessageDirection) {
    MessageDirection["INBOUND"] = "inbound";
    MessageDirection["OUTBOUND"] = "outbound";
})(MessageDirection || (MessageDirection = {}));
export var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["VIDEO"] = "video";
    MessageType["AUDIO"] = "audio";
    MessageType["DOCUMENT"] = "document";
    MessageType["LOCATION"] = "location";
    MessageType["CONTACT"] = "contact";
    MessageType["BUTTON"] = "button";
    MessageType["INTERACTIVE"] = "interactive";
})(MessageType || (MessageType = {}));
export var Source;
(function (Source) {
    Source["WHATSAPP"] = "whatsapp";
    Source["WEB"] = "web";
    Source["API"] = "api";
})(Source || (Source = {}));
export var ConversationStatus;
(function (ConversationStatus) {
    ConversationStatus["ACTIVE"] = "active";
    ConversationStatus["CLOSED"] = "closed";
    ConversationStatus["PENDING"] = "pending";
    ConversationStatus["ARCHIVED"] = "archived";
})(ConversationStatus || (ConversationStatus = {}));
// ============================================================================
// SCHEMAS
// ============================================================================
export const EmployeeSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    name: z.string().min(1).max(100),
    role: z.string().min(1).max(100),
    description: z.string().optional(),
    avatar: z.string().url().optional(),
    capabilities: z.array(z.string()),
    status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.OFFLINE),
    metadata: z.record(z.any()).optional(),
    skills: z.array(z.string()).default([]),
    languages: z.array(z.string()).default(['en']),
    workingHours: z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
        timezone: z.string().default('Asia/Kolkata')
    }).optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
export const MessageSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    conversationId: z.string().uuid(),
    employeeId: z.string().uuid().optional(),
    userId: z.string().min(1).max(255),
    direction: z.nativeEnum(MessageDirection),
    source: z.nativeEnum(Source),
    type: z.nativeEnum(MessageType).default(MessageType.TEXT),
    content: z.object({
        text: z.string().optional(),
        mediaUrl: z.string().url().optional(),
        mediaCaption: z.string().optional(),
        buttons: z.array(z.object({
            id: z.string(),
            text: z.string()
        })).optional(),
        location: z.object({
            latitude: z.number(),
            longitude: z.number(),
            name: z.string().optional()
        }).optional()
    }),
    metadata: z.record(z.any()).optional(),
    status: z.enum(['sent', 'delivered', 'read', 'failed']).default('sent'),
    externalId: z.string().optional(),
    timestamp: z.date(),
    createdAt: z.date()
});
export const ConversationSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    userId: z.string().min(1).max(255),
    userName: z.string().optional(),
    employeeId: z.string().uuid().optional(),
    status: z.nativeEnum(ConversationStatus).default(ConversationStatus.ACTIVE),
    source: z.nativeEnum(Source).default(Source.WEB),
    lastMessage: z.object({
        content: z.string(),
        sender: z.enum(['user', 'employee', 'system']),
        timestamp: z.date()
    }).optional(),
    context: z.object({
        intent: z.string().optional(),
        entities: z.record(z.any()).optional(),
        sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
        language: z.string().default('en')
    }).optional(),
    metadata: z.record(z.any()).optional(),
    unreadCount: z.number().default(0),
    assignedAt: z.date().optional(),
    closedAt: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
export const TaskAssignmentSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    conversationId: z.string().uuid(),
    employeeId: z.string().uuid(),
    assignedBy: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    notes: z.string().optional(),
    status: z.enum(['assigned', 'accepted', 'completed', 'rejected', 'transferred']).default('assigned'),
    createdAt: z.date(),
    updatedAt: z.date()
});
//# sourceMappingURL=index.js.map