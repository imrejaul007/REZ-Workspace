"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookPayloadSchema = exports.CampaignSchema = exports.TemplateSchema = exports.MessageSchema = exports.MessageStatus = exports.Channel = void 0;
const zod_1 = require("zod");
var Channel;
(function (Channel) {
    Channel["SMS"] = "sms";
    Channel["EMAIL"] = "email";
    Channel["PUSH"] = "push";
    Channel["WHATSAPP"] = "whatsapp";
})(Channel || (exports.Channel = Channel = {}));
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["PENDING"] = "pending";
    MessageStatus["SENT"] = "sent";
    MessageStatus["DELIVERED"] = "delivered";
    MessageStatus["READ"] = "read";
    MessageStatus["FAILED"] = "failed";
    MessageStatus["BOUNCED"] = "bounced";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
exports.MessageSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    channel: zod_1.z.nativeEnum(Channel),
    direction: zod_1.z.enum(['inbound', 'outbound']),
    from: zod_1.z.string(),
    to: zod_1.z.string(),
    subject: zod_1.z.string().optional(),
    body: zod_1.z.string(),
    templateId: zod_1.z.string().optional(),
    variables: zod_1.z.record(zod_1.z.string()).optional(),
    status: zod_1.z.nativeEnum(MessageStatus).default(MessageStatus.PENDING),
    externalId: zod_1.z.string().optional(),
    externalStatus: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    scheduledAt: zod_1.z.date().optional(),
    sentAt: zod_1.z.date().optional(),
    deliveredAt: zod_1.z.date().optional(),
    readAt: zod_1.z.date().optional(),
    error: zod_1.z.string().optional(),
    errorCode: zod_1.z.string().optional(),
    cost: zod_1.z.number().optional(),
    segments: zod_1.z.number().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.TemplateSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    channel: zod_1.z.nativeEnum(Channel),
    content: zod_1.z.object({
        subject: zod_1.z.string().optional(),
        body: zod_1.z.string(),
        buttons: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            text: zod_1.z.string(),
            url: zod_1.z.string().optional()
        })).optional(),
        imageUrl: zod_1.z.string().optional()
    }),
    variables: zod_1.z.array(zod_1.z.string()),
    status: zod_1.z.enum(['draft', 'active', 'archived']).default('active'),
    stats: zod_1.z.object({
        sent: zod_1.z.number().default(0),
        delivered: zod_1.z.number().default(0),
        read: zod_1.z.number().default(0),
        bounced: zod_1.z.number().default(0)
    }).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.CampaignSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    channel: zod_1.z.nativeEnum(Channel),
    templateId: zod_1.z.string().uuid(),
    audience: zod_1.z.object({
        type: zod_1.z.enum(['segment', 'list', 'filter']),
        id: zod_1.z.string().optional(),
        criteria: zod_1.z.record(zod_1.z.any()).optional()
    }),
    schedule: zod_1.z.object({
        type: zod_1.z.enum(['immediate', 'scheduled', 'recurring']),
        sendAt: zod_1.z.date().optional(),
        recurring: zod_1.z.object({
            frequency: zod_1.z.enum(['hourly', 'daily', 'weekly', 'monthly']),
            days: zod_1.z.array(zod_1.z.number()).optional(),
            time: zod_1.z.string().optional()
        }).optional()
    }),
    settings: zod_1.z.object({
        dedupe: zod_1.z.boolean().default(true),
        allowDuplicates: zod_1.z.boolean().default(false),
        cap: zod_1.z.number().optional(),
        randomize: zod_1.z.boolean().default(false)
    }),
    status: zod_1.z.enum(['draft', 'scheduled', 'running', 'paused', 'completed', 'failed']).default('draft'),
    stats: zod_1.z.object({
        total: zod_1.z.number().default(0),
        sent: zod_1.z.number().default(0),
        delivered: zod_1.z.number().default(0),
        read: zod_1.z.number().default(0),
        clicked: zod_1.z.number().default(0),
        bounced: zod_1.z.number().default(0),
        failed: zod_1.z.number().default(0)
    }).optional(),
    createdBy: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.WebhookPayloadSchema = zod_1.z.object({
    event: zod_1.z.enum(['sent', 'delivered', 'read', 'bounced', 'failed', 'clicked']),
    messageId: zod_1.z.string(),
    externalId: zod_1.z.string().optional(),
    timestamp: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
