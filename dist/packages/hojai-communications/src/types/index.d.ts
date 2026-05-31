import { z } from 'zod';
export declare enum Channel {
    SMS = "sms",
    EMAIL = "email",
    PUSH = "push",
    WHATSAPP = "whatsapp"
}
export declare enum MessageStatus {
    PENDING = "pending",
    SENT = "sent",
    DELIVERED = "delivered",
    READ = "read",
    FAILED = "failed",
    BOUNCED = "bounced"
}
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    channel: z.ZodNativeEnum<typeof Channel>;
    direction: z.ZodEnum<["inbound", "outbound"]>;
    from: z.ZodString;
    to: z.ZodString;
    subject: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    templateId: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof MessageStatus>>;
    externalId: z.ZodOptional<z.ZodString>;
    externalStatus: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    scheduledAt: z.ZodOptional<z.ZodDate>;
    sentAt: z.ZodOptional<z.ZodDate>;
    deliveredAt: z.ZodOptional<z.ZodDate>;
    readAt: z.ZodOptional<z.ZodDate>;
    error: z.ZodOptional<z.ZodString>;
    errorCode: z.ZodOptional<z.ZodString>;
    cost: z.ZodOptional<z.ZodNumber>;
    segments: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: MessageStatus;
    tenantId: string;
    body: string;
    channel: Channel;
    createdAt: Date;
    updatedAt: Date;
    direction: "inbound" | "outbound";
    from: string;
    to: string;
    error?: string | undefined;
    metadata?: Record<string, any> | undefined;
    subject?: string | undefined;
    templateId?: string | undefined;
    sentAt?: Date | undefined;
    deliveredAt?: Date | undefined;
    readAt?: Date | undefined;
    scheduledAt?: Date | undefined;
    cost?: number | undefined;
    variables?: Record<string, string> | undefined;
    segments?: number | undefined;
    externalId?: string | undefined;
    externalStatus?: string | undefined;
    errorCode?: string | undefined;
}, {
    id: string;
    tenantId: string;
    body: string;
    channel: Channel;
    createdAt: Date;
    updatedAt: Date;
    direction: "inbound" | "outbound";
    from: string;
    to: string;
    status?: MessageStatus | undefined;
    error?: string | undefined;
    metadata?: Record<string, any> | undefined;
    subject?: string | undefined;
    templateId?: string | undefined;
    sentAt?: Date | undefined;
    deliveredAt?: Date | undefined;
    readAt?: Date | undefined;
    scheduledAt?: Date | undefined;
    cost?: number | undefined;
    variables?: Record<string, string> | undefined;
    segments?: number | undefined;
    externalId?: string | undefined;
    externalStatus?: string | undefined;
    errorCode?: string | undefined;
}>;
export type Message = z.infer<typeof MessageSchema>;
export declare const TemplateSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    channel: z.ZodNativeEnum<typeof Channel>;
    content: z.ZodObject<{
        subject: z.ZodOptional<z.ZodString>;
        body: z.ZodString;
        buttons: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
            url?: string | undefined;
        }, {
            id: string;
            text: string;
            url?: string | undefined;
        }>, "many">>;
        imageUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        body: string;
        subject?: string | undefined;
        buttons?: {
            id: string;
            text: string;
            url?: string | undefined;
        }[] | undefined;
        imageUrl?: string | undefined;
    }, {
        body: string;
        subject?: string | undefined;
        buttons?: {
            id: string;
            text: string;
            url?: string | undefined;
        }[] | undefined;
        imageUrl?: string | undefined;
    }>;
    variables: z.ZodArray<z.ZodString, "many">;
    status: z.ZodDefault<z.ZodEnum<["draft", "active", "archived"]>>;
    stats: z.ZodOptional<z.ZodObject<{
        sent: z.ZodDefault<z.ZodNumber>;
        delivered: z.ZodDefault<z.ZodNumber>;
        read: z.ZodDefault<z.ZodNumber>;
        bounced: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        delivered: number;
        sent: number;
        read: number;
        bounced: number;
    }, {
        delivered?: number | undefined;
        sent?: number | undefined;
        read?: number | undefined;
        bounced?: number | undefined;
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "active" | "draft" | "archived";
    name: string;
    tenantId: string;
    content: {
        body: string;
        subject?: string | undefined;
        buttons?: {
            id: string;
            text: string;
            url?: string | undefined;
        }[] | undefined;
        imageUrl?: string | undefined;
    };
    channel: Channel;
    createdAt: Date;
    updatedAt: Date;
    variables: string[];
    stats?: {
        delivered: number;
        sent: number;
        read: number;
        bounced: number;
    } | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    content: {
        body: string;
        subject?: string | undefined;
        buttons?: {
            id: string;
            text: string;
            url?: string | undefined;
        }[] | undefined;
        imageUrl?: string | undefined;
    };
    channel: Channel;
    createdAt: Date;
    updatedAt: Date;
    variables: string[];
    stats?: {
        delivered?: number | undefined;
        sent?: number | undefined;
        read?: number | undefined;
        bounced?: number | undefined;
    } | undefined;
    status?: "active" | "draft" | "archived" | undefined;
}>;
export type Template = z.infer<typeof TemplateSchema>;
export declare const CampaignSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    channel: z.ZodNativeEnum<typeof Channel>;
    templateId: z.ZodString;
    audience: z.ZodObject<{
        type: z.ZodEnum<["segment", "list", "filter"]>;
        id: z.ZodOptional<z.ZodString>;
        criteria: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: "filter" | "segment" | "list";
        id?: string | undefined;
        criteria?: Record<string, any> | undefined;
    }, {
        type: "filter" | "segment" | "list";
        id?: string | undefined;
        criteria?: Record<string, any> | undefined;
    }>;
    schedule: z.ZodObject<{
        type: z.ZodEnum<["immediate", "scheduled", "recurring"]>;
        sendAt: z.ZodOptional<z.ZodDate>;
        recurring: z.ZodOptional<z.ZodObject<{
            frequency: z.ZodEnum<["hourly", "daily", "weekly", "monthly"]>;
            days: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            time: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            frequency: "daily" | "weekly" | "monthly" | "hourly";
            days?: number[] | undefined;
            time?: string | undefined;
        }, {
            frequency: "daily" | "weekly" | "monthly" | "hourly";
            days?: number[] | undefined;
            time?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            frequency: "daily" | "weekly" | "monthly" | "hourly";
            days?: number[] | undefined;
            time?: string | undefined;
        } | undefined;
        sendAt?: Date | undefined;
    }, {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            frequency: "daily" | "weekly" | "monthly" | "hourly";
            days?: number[] | undefined;
            time?: string | undefined;
        } | undefined;
        sendAt?: Date | undefined;
    }>;
    settings: z.ZodObject<{
        dedupe: z.ZodDefault<z.ZodBoolean>;
        allowDuplicates: z.ZodDefault<z.ZodBoolean>;
        cap: z.ZodOptional<z.ZodNumber>;
        randomize: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        dedupe: boolean;
        allowDuplicates: boolean;
        randomize: boolean;
        cap?: number | undefined;
    }, {
        dedupe?: boolean | undefined;
        allowDuplicates?: boolean | undefined;
        cap?: number | undefined;
        randomize?: boolean | undefined;
    }>;
    status: z.ZodDefault<z.ZodEnum<["draft", "scheduled", "running", "paused", "completed", "failed"]>>;
    stats: z.ZodOptional<z.ZodObject<{
        total: z.ZodDefault<z.ZodNumber>;
        sent: z.ZodDefault<z.ZodNumber>;
        delivered: z.ZodDefault<z.ZodNumber>;
        read: z.ZodDefault<z.ZodNumber>;
        clicked: z.ZodDefault<z.ZodNumber>;
        bounced: z.ZodDefault<z.ZodNumber>;
        failed: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        failed: number;
        delivered: number;
        sent: number;
        read: number;
        clicked: number;
        total: number;
        bounced: number;
    }, {
        failed?: number | undefined;
        delivered?: number | undefined;
        sent?: number | undefined;
        read?: number | undefined;
        clicked?: number | undefined;
        total?: number | undefined;
        bounced?: number | undefined;
    }>>;
    createdBy: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "completed" | "draft" | "running" | "failed" | "scheduled" | "paused";
    schedule: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            frequency: "daily" | "weekly" | "monthly" | "hourly";
            days?: number[] | undefined;
            time?: string | undefined;
        } | undefined;
        sendAt?: Date | undefined;
    };
    name: string;
    tenantId: string;
    channel: Channel;
    templateId: string;
    createdAt: Date;
    updatedAt: Date;
    audience: {
        type: "filter" | "segment" | "list";
        id?: string | undefined;
        criteria?: Record<string, any> | undefined;
    };
    createdBy: string;
    settings: {
        dedupe: boolean;
        allowDuplicates: boolean;
        randomize: boolean;
        cap?: number | undefined;
    };
    stats?: {
        failed: number;
        delivered: number;
        sent: number;
        read: number;
        clicked: number;
        total: number;
        bounced: number;
    } | undefined;
    description?: string | undefined;
}, {
    id: string;
    schedule: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            frequency: "daily" | "weekly" | "monthly" | "hourly";
            days?: number[] | undefined;
            time?: string | undefined;
        } | undefined;
        sendAt?: Date | undefined;
    };
    name: string;
    tenantId: string;
    channel: Channel;
    templateId: string;
    createdAt: Date;
    updatedAt: Date;
    audience: {
        type: "filter" | "segment" | "list";
        id?: string | undefined;
        criteria?: Record<string, any> | undefined;
    };
    createdBy: string;
    settings: {
        dedupe?: boolean | undefined;
        allowDuplicates?: boolean | undefined;
        cap?: number | undefined;
        randomize?: boolean | undefined;
    };
    stats?: {
        failed?: number | undefined;
        delivered?: number | undefined;
        sent?: number | undefined;
        read?: number | undefined;
        clicked?: number | undefined;
        total?: number | undefined;
        bounced?: number | undefined;
    } | undefined;
    status?: "completed" | "draft" | "running" | "failed" | "scheduled" | "paused" | undefined;
    description?: string | undefined;
}>;
export type Campaign = z.infer<typeof CampaignSchema>;
export declare const WebhookPayloadSchema: z.ZodObject<{
    event: z.ZodEnum<["sent", "delivered", "read", "bounced", "failed", "clicked"]>;
    messageId: z.ZodString;
    externalId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    event: "failed" | "delivered" | "sent" | "read" | "clicked" | "bounced";
    timestamp: string;
    messageId: string;
    metadata?: Record<string, any> | undefined;
    externalId?: string | undefined;
}, {
    event: "failed" | "delivered" | "sent" | "read" | "clicked" | "bounced";
    timestamp: string;
    messageId: string;
    metadata?: Record<string, any> | undefined;
    externalId?: string | undefined;
}>;
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
//# sourceMappingURL=index.d.ts.map