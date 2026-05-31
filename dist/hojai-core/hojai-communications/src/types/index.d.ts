import { z } from 'zod';
export declare const ChannelEnum: z.ZodEnum<["whatsapp", "sms", "email", "push", "voice", "instagram", "telegram"]>;
export type Channel = z.infer<typeof ChannelEnum>;
export declare const MessageStatusEnum: z.ZodEnum<["pending", "queued", "sent", "delivered", "read", "failed", "undelivered"]>;
export type MessageStatus = z.infer<typeof MessageStatusEnum>;
export declare const MessagePriorityEnum: z.ZodEnum<["low", "normal", "high", "urgent"]>;
export type MessagePriority = z.infer<typeof MessagePriorityEnum>;
export declare const CampaignStatusEnum: z.ZodEnum<["draft", "scheduled", "sending", "completed", "paused", "cancelled"]>;
export type CampaignStatus = z.infer<typeof CampaignStatusEnum>;
export declare const TemplateStatusEnum: z.ZodEnum<["active", "inactive", "archived"]>;
export type TemplateStatus = z.infer<typeof TemplateStatusEnum>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    channel: z.ZodEnum<["whatsapp", "sms", "email", "push", "voice", "instagram", "telegram"]>;
    recipient: z.ZodString;
    sender: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["transactional", "marketing", "notification", "alert"]>;
    priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high", "urgent"]>>;
    subject: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    htmlBody: z.ZodOptional<z.ZodString>;
    previewText: z.ZodOptional<z.ZodString>;
    media: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["image", "video", "audio", "document"]>;
        url: z.ZodString;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
        caption: z.ZodOptional<z.ZodString>;
        filename: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "image" | "video" | "audio" | "document";
        url: string;
        thumbnailUrl?: string | undefined;
        caption?: string | undefined;
        filename?: string | undefined;
    }, {
        type: "image" | "video" | "audio" | "document";
        url: string;
        thumbnailUrl?: string | undefined;
        caption?: string | undefined;
        filename?: string | undefined;
    }>>;
    templateId: z.ZodOptional<z.ZodString>;
    templateVariables: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber]>>>;
    status: z.ZodDefault<z.ZodEnum<["pending", "queued", "sent", "delivered", "read", "failed", "undelivered"]>>;
    sentAt: z.ZodOptional<z.ZodDate>;
    deliveredAt: z.ZodOptional<z.ZodDate>;
    readAt: z.ZodOptional<z.ZodDate>;
    failedAt: z.ZodOptional<z.ZodDate>;
    errorMessage: z.ZodOptional<z.ZodString>;
    providerMessageId: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
    scheduledAt: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    cost: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodString>;
    opened: z.ZodDefault<z.ZodBoolean>;
    clicked: z.ZodDefault<z.ZodBoolean>;
    conversionTracked: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "pending" | "failed" | "delivered" | "queued" | "sent" | "read" | "undelivered";
    type: "transactional" | "marketing" | "notification" | "alert";
    tenantId: string;
    currency: string;
    body: string;
    channel: "push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram";
    recipient: string;
    priority: "low" | "normal" | "high" | "urgent";
    opened: boolean;
    clicked: boolean;
    conversionTracked: boolean;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, any> | undefined;
    sender?: string | undefined;
    subject?: string | undefined;
    htmlBody?: string | undefined;
    previewText?: string | undefined;
    media?: {
        type: "image" | "video" | "audio" | "document";
        url: string;
        thumbnailUrl?: string | undefined;
        caption?: string | undefined;
        filename?: string | undefined;
    } | undefined;
    templateId?: string | undefined;
    templateVariables?: Record<string, string | number> | undefined;
    sentAt?: Date | undefined;
    deliveredAt?: Date | undefined;
    readAt?: Date | undefined;
    failedAt?: Date | undefined;
    errorMessage?: string | undefined;
    providerMessageId?: string | undefined;
    provider?: string | undefined;
    scheduledAt?: Date | undefined;
    tags?: string[] | undefined;
    cost?: number | undefined;
}, {
    id: string;
    type: "transactional" | "marketing" | "notification" | "alert";
    tenantId: string;
    body: string;
    channel: "push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram";
    recipient: string;
    createdAt: Date;
    updatedAt: Date;
    status?: "pending" | "failed" | "delivered" | "queued" | "sent" | "read" | "undelivered" | undefined;
    currency?: string | undefined;
    metadata?: Record<string, any> | undefined;
    sender?: string | undefined;
    priority?: "low" | "normal" | "high" | "urgent" | undefined;
    subject?: string | undefined;
    htmlBody?: string | undefined;
    previewText?: string | undefined;
    media?: {
        type: "image" | "video" | "audio" | "document";
        url: string;
        thumbnailUrl?: string | undefined;
        caption?: string | undefined;
        filename?: string | undefined;
    } | undefined;
    templateId?: string | undefined;
    templateVariables?: Record<string, string | number> | undefined;
    sentAt?: Date | undefined;
    deliveredAt?: Date | undefined;
    readAt?: Date | undefined;
    failedAt?: Date | undefined;
    errorMessage?: string | undefined;
    providerMessageId?: string | undefined;
    provider?: string | undefined;
    scheduledAt?: Date | undefined;
    tags?: string[] | undefined;
    cost?: number | undefined;
    opened?: boolean | undefined;
    clicked?: boolean | undefined;
    conversionTracked?: boolean | undefined;
}>;
export type Message = z.infer<typeof MessageSchema>;
export declare const TemplateSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    channel: z.ZodEnum<["whatsapp", "sms", "email", "push", "voice", "instagram", "telegram"]>;
    category: z.ZodEnum<["welcome", "onboarding", "transaction", "marketing", "notification", "reminder", "alert", "survey", "feedback", "promotional"]>;
    subject: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    htmlBody: z.ZodOptional<z.ZodString>;
    variables: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<["string", "number", "date", "boolean"]>;
        required: z.ZodDefault<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "string" | "number" | "boolean" | "date";
        name: string;
        required: boolean;
        description?: string | undefined;
        defaultValue?: string | undefined;
    }, {
        type: "string" | "number" | "boolean" | "date";
        name: string;
        description?: string | undefined;
        required?: boolean | undefined;
        defaultValue?: string | undefined;
    }>, "many">;
    status: z.ZodDefault<z.ZodEnum<["active", "inactive", "archived"]>>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
    whatsappHeader: z.ZodOptional<z.ZodString>;
    whatsappFooter: z.ZodOptional<z.ZodString>;
    whatsappButtons: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
    }, {
        id: string;
        text: string;
    }>, "many">>;
    emailFromName: z.ZodOptional<z.ZodString>;
    emailReplyTo: z.ZodOptional<z.ZodString>;
    usageCount: z.ZodDefault<z.ZodNumber>;
    lastUsedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "active" | "inactive" | "archived";
    name: string;
    tenantId: string;
    category: "marketing" | "notification" | "alert" | "welcome" | "onboarding" | "transaction" | "reminder" | "survey" | "feedback" | "promotional";
    body: string;
    channel: "push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram";
    createdAt: Date;
    updatedAt: Date;
    variables: {
        type: "string" | "number" | "boolean" | "date";
        name: string;
        required: boolean;
        description?: string | undefined;
        defaultValue?: string | undefined;
    }[];
    isDefault: boolean;
    usageCount: number;
    subject?: string | undefined;
    htmlBody?: string | undefined;
    whatsappHeader?: string | undefined;
    whatsappFooter?: string | undefined;
    whatsappButtons?: {
        id: string;
        text: string;
    }[] | undefined;
    emailFromName?: string | undefined;
    emailReplyTo?: string | undefined;
    lastUsedAt?: Date | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    category: "marketing" | "notification" | "alert" | "welcome" | "onboarding" | "transaction" | "reminder" | "survey" | "feedback" | "promotional";
    body: string;
    channel: "push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram";
    createdAt: Date;
    updatedAt: Date;
    variables: {
        type: "string" | "number" | "boolean" | "date";
        name: string;
        description?: string | undefined;
        required?: boolean | undefined;
        defaultValue?: string | undefined;
    }[];
    status?: "active" | "inactive" | "archived" | undefined;
    subject?: string | undefined;
    htmlBody?: string | undefined;
    isDefault?: boolean | undefined;
    whatsappHeader?: string | undefined;
    whatsappFooter?: string | undefined;
    whatsappButtons?: {
        id: string;
        text: string;
    }[] | undefined;
    emailFromName?: string | undefined;
    emailReplyTo?: string | undefined;
    usageCount?: number | undefined;
    lastUsedAt?: Date | undefined;
}>;
export type Template = z.infer<typeof TemplateSchema>;
export declare const CampaignSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    channel: z.ZodEnum<["whatsapp", "sms", "email", "push", "voice", "instagram", "telegram"]>;
    templateId: z.ZodOptional<z.ZodString>;
    subject: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    media: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["image", "video", "audio", "document"]>;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "image" | "video" | "audio" | "document";
        url: string;
    }, {
        type: "image" | "video" | "audio" | "document";
        url: string;
    }>>;
    segmentIds: z.ZodArray<z.ZodString, "many">;
    recipientCount: z.ZodDefault<z.ZodNumber>;
    excludeRecipientIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    filters: z.ZodOptional<z.ZodObject<{
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        excludeTags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        lastActiveDays: z.ZodOptional<z.ZodNumber>;
        signupDateAfter: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[] | undefined;
        excludeTags?: string[] | undefined;
        lastActiveDays?: number | undefined;
        signupDateAfter?: Date | undefined;
    }, {
        tags?: string[] | undefined;
        excludeTags?: string[] | undefined;
        lastActiveDays?: number | undefined;
        signupDateAfter?: Date | undefined;
    }>>;
    status: z.ZodDefault<z.ZodEnum<["draft", "scheduled", "sending", "completed", "paused", "cancelled"]>>;
    scheduledAt: z.ZodOptional<z.ZodDate>;
    startedAt: z.ZodOptional<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    abTest: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        variants: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            body: z.ZodString;
            weight: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            body: string;
            weight: number;
        }, {
            id: string;
            name: string;
            body: string;
            weight: number;
        }>, "many">>;
        winner: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        variants?: {
            id: string;
            name: string;
            body: string;
            weight: number;
        }[] | undefined;
        winner?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        variants?: {
            id: string;
            name: string;
            body: string;
            weight: number;
        }[] | undefined;
        winner?: string | undefined;
    }>>;
    stats: z.ZodObject<{
        sent: z.ZodDefault<z.ZodNumber>;
        delivered: z.ZodDefault<z.ZodNumber>;
        failed: z.ZodDefault<z.ZodNumber>;
        opened: z.ZodDefault<z.ZodNumber>;
        clicked: z.ZodDefault<z.ZodNumber>;
        converted: z.ZodDefault<z.ZodNumber>;
        unsubscribed: z.ZodDefault<z.ZodNumber>;
        complained: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        failed: number;
        delivered: number;
        sent: number;
        opened: number;
        clicked: number;
        converted: number;
        unsubscribed: number;
        complained: number;
    }, {
        failed?: number | undefined;
        delivered?: number | undefined;
        sent?: number | undefined;
        opened?: number | undefined;
        clicked?: number | undefined;
        converted?: number | undefined;
        unsubscribed?: number | undefined;
        complained?: number | undefined;
    }>;
    totalCost: z.ZodOptional<z.ZodNumber>;
    costPerMessage: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    stats: {
        failed: number;
        delivered: number;
        sent: number;
        opened: number;
        clicked: number;
        converted: number;
        unsubscribed: number;
        complained: number;
    };
    status: "completed" | "draft" | "cancelled" | "scheduled" | "paused" | "sending";
    name: string;
    tenantId: string;
    body: string;
    channel: "push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram";
    createdAt: Date;
    updatedAt: Date;
    segmentIds: string[];
    recipientCount: number;
    description?: string | undefined;
    startedAt?: Date | undefined;
    subject?: string | undefined;
    media?: {
        type: "image" | "video" | "audio" | "document";
        url: string;
    } | undefined;
    templateId?: string | undefined;
    scheduledAt?: Date | undefined;
    excludeRecipientIds?: string[] | undefined;
    filters?: {
        tags?: string[] | undefined;
        excludeTags?: string[] | undefined;
        lastActiveDays?: number | undefined;
        signupDateAfter?: Date | undefined;
    } | undefined;
    completedAt?: Date | undefined;
    abTest?: {
        enabled: boolean;
        variants?: {
            id: string;
            name: string;
            body: string;
            weight: number;
        }[] | undefined;
        winner?: string | undefined;
    } | undefined;
    totalCost?: number | undefined;
    costPerMessage?: number | undefined;
}, {
    id: string;
    stats: {
        failed?: number | undefined;
        delivered?: number | undefined;
        sent?: number | undefined;
        opened?: number | undefined;
        clicked?: number | undefined;
        converted?: number | undefined;
        unsubscribed?: number | undefined;
        complained?: number | undefined;
    };
    name: string;
    tenantId: string;
    body: string;
    channel: "push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram";
    createdAt: Date;
    updatedAt: Date;
    segmentIds: string[];
    status?: "completed" | "draft" | "cancelled" | "scheduled" | "paused" | "sending" | undefined;
    description?: string | undefined;
    startedAt?: Date | undefined;
    subject?: string | undefined;
    media?: {
        type: "image" | "video" | "audio" | "document";
        url: string;
    } | undefined;
    templateId?: string | undefined;
    scheduledAt?: Date | undefined;
    recipientCount?: number | undefined;
    excludeRecipientIds?: string[] | undefined;
    filters?: {
        tags?: string[] | undefined;
        excludeTags?: string[] | undefined;
        lastActiveDays?: number | undefined;
        signupDateAfter?: Date | undefined;
    } | undefined;
    completedAt?: Date | undefined;
    abTest?: {
        enabled?: boolean | undefined;
        variants?: {
            id: string;
            name: string;
            body: string;
            weight: number;
        }[] | undefined;
        winner?: string | undefined;
    } | undefined;
    totalCost?: number | undefined;
    costPerMessage?: number | undefined;
}>;
export type Campaign = z.infer<typeof CampaignSchema>;
export declare const SubscriberSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    whatsappId: z.ZodOptional<z.ZodString>;
    deviceToken: z.ZodOptional<z.ZodString>;
    channels: z.ZodDefault<z.ZodArray<z.ZodEnum<["whatsapp", "sms", "email", "push", "voice", "instagram", "telegram"]>, "many">>;
    subscribed: z.ZodDefault<z.ZodBoolean>;
    unsubscribedAt: z.ZodOptional<z.ZodDate>;
    unsubscribedChannels: z.ZodOptional<z.ZodArray<z.ZodEnum<["whatsapp", "sms", "email", "push", "voice", "instagram", "telegram"]>, "many">>;
    tags: z.ZodArray<z.ZodString, "many">;
    segments: z.ZodArray<z.ZodString, "many">;
    totalMessagesReceived: z.ZodDefault<z.ZodNumber>;
    lastMessageAt: z.ZodOptional<z.ZodDate>;
    lastOpenedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    channels: ("push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram")[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    subscribed: boolean;
    segments: string[];
    totalMessagesReceived: number;
    userId?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    whatsappId?: string | undefined;
    deviceToken?: string | undefined;
    unsubscribedAt?: Date | undefined;
    unsubscribedChannels?: ("push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram")[] | undefined;
    lastMessageAt?: Date | undefined;
    lastOpenedAt?: Date | undefined;
}, {
    id: string;
    tenantId: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    segments: string[];
    userId?: string | undefined;
    email?: string | undefined;
    channels?: ("push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram")[] | undefined;
    phone?: string | undefined;
    whatsappId?: string | undefined;
    deviceToken?: string | undefined;
    subscribed?: boolean | undefined;
    unsubscribedAt?: Date | undefined;
    unsubscribedChannels?: ("push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram")[] | undefined;
    totalMessagesReceived?: number | undefined;
    lastMessageAt?: Date | undefined;
    lastOpenedAt?: Date | undefined;
}>;
export type Subscriber = z.infer<typeof SubscriberSchema>;
export declare const ChannelConfigSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    channel: z.ZodEnum<["whatsapp", "sms", "email", "push", "voice", "instagram", "telegram"]>;
    whatsappPhoneNumber: z.ZodOptional<z.ZodString>;
    whatsappBusinessAccountId: z.ZodOptional<z.ZodString>;
    whatsappAccessToken: z.ZodOptional<z.ZodString>;
    smsProvider: z.ZodOptional<z.ZodEnum<["twilio", "msg91", "plivo", "textlocal"]>>;
    smsApiKey: z.ZodOptional<z.ZodString>;
    smsSenderId: z.ZodOptional<z.ZodString>;
    emailProvider: z.ZodOptional<z.ZodEnum<["sendgrid", "mailgun", "ses", "smtp"]>>;
    emailApiKey: z.ZodOptional<z.ZodString>;
    emailFromAddress: z.ZodOptional<z.ZodString>;
    emailFromName: z.ZodOptional<z.ZodString>;
    fcmServerKey: z.ZodOptional<z.ZodString>;
    apnsCertPath: z.ZodOptional<z.ZodString>;
    voiceProvider: z.ZodOptional<z.ZodEnum<["twilio", "nexmo"]>>;
    voiceApiKey: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    webhooks: z.ZodOptional<z.ZodObject<{
        delivery: z.ZodOptional<z.ZodString>;
        open: z.ZodOptional<z.ZodString>;
        click: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        delivery?: string | undefined;
        open?: string | undefined;
        click?: string | undefined;
    }, {
        delivery?: string | undefined;
        open?: string | undefined;
        click?: string | undefined;
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    channel: "push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram";
    createdAt: Date;
    updatedAt: Date;
    enabled: boolean;
    emailFromName?: string | undefined;
    whatsappPhoneNumber?: string | undefined;
    whatsappBusinessAccountId?: string | undefined;
    whatsappAccessToken?: string | undefined;
    smsProvider?: "twilio" | "msg91" | "plivo" | "textlocal" | undefined;
    smsApiKey?: string | undefined;
    smsSenderId?: string | undefined;
    emailProvider?: "sendgrid" | "mailgun" | "ses" | "smtp" | undefined;
    emailApiKey?: string | undefined;
    emailFromAddress?: string | undefined;
    fcmServerKey?: string | undefined;
    apnsCertPath?: string | undefined;
    voiceProvider?: "twilio" | "nexmo" | undefined;
    voiceApiKey?: string | undefined;
    webhooks?: {
        delivery?: string | undefined;
        open?: string | undefined;
        click?: string | undefined;
    } | undefined;
}, {
    id: string;
    tenantId: string;
    channel: "push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram";
    createdAt: Date;
    updatedAt: Date;
    emailFromName?: string | undefined;
    enabled?: boolean | undefined;
    whatsappPhoneNumber?: string | undefined;
    whatsappBusinessAccountId?: string | undefined;
    whatsappAccessToken?: string | undefined;
    smsProvider?: "twilio" | "msg91" | "plivo" | "textlocal" | undefined;
    smsApiKey?: string | undefined;
    smsSenderId?: string | undefined;
    emailProvider?: "sendgrid" | "mailgun" | "ses" | "smtp" | undefined;
    emailApiKey?: string | undefined;
    emailFromAddress?: string | undefined;
    fcmServerKey?: string | undefined;
    apnsCertPath?: string | undefined;
    voiceProvider?: "twilio" | "nexmo" | undefined;
    voiceApiKey?: string | undefined;
    webhooks?: {
        delivery?: string | undefined;
        open?: string | undefined;
        click?: string | undefined;
    } | undefined;
}>;
export type ChannelConfig = z.infer<typeof ChannelConfigSchema>;
export declare const ChannelStatsSchema: z.ZodObject<{
    tenantId: z.ZodString;
    channel: z.ZodEnum<["whatsapp", "sms", "email", "push", "voice", "instagram", "telegram"]>;
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
    metrics: z.ZodObject<{
        sent: z.ZodNumber;
        delivered: z.ZodNumber;
        failed: z.ZodNumber;
        opened: z.ZodNumber;
        clicked: z.ZodNumber;
        unsubscribed: z.ZodNumber;
        complained: z.ZodNumber;
        deliveryRate: z.ZodNumber;
        openRate: z.ZodNumber;
        clickRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        failed: number;
        delivered: number;
        sent: number;
        opened: number;
        clicked: number;
        unsubscribed: number;
        complained: number;
        deliveryRate: number;
        openRate: number;
        clickRate: number;
    }, {
        failed: number;
        delivered: number;
        sent: number;
        opened: number;
        clicked: number;
        unsubscribed: number;
        complained: number;
        deliveryRate: number;
        openRate: number;
        clickRate: number;
    }>;
    cost: z.ZodObject<{
        total: z.ZodNumber;
        byType: z.ZodRecord<z.ZodString, z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        total: number;
        byType: Record<string, number>;
    }, {
        total: number;
        byType: Record<string, number>;
    }>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    period: {
        end: Date;
        start: Date;
    };
    channel: "push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram";
    cost: {
        total: number;
        byType: Record<string, number>;
    };
    metrics: {
        failed: number;
        delivered: number;
        sent: number;
        opened: number;
        clicked: number;
        unsubscribed: number;
        complained: number;
        deliveryRate: number;
        openRate: number;
        clickRate: number;
    };
}, {
    tenantId: string;
    period: {
        end: Date;
        start: Date;
    };
    channel: "push" | "whatsapp" | "email" | "sms" | "voice" | "instagram" | "telegram";
    cost: {
        total: number;
        byType: Record<string, number>;
    };
    metrics: {
        failed: number;
        delivered: number;
        sent: number;
        opened: number;
        clicked: number;
        unsubscribed: number;
        complained: number;
        deliveryRate: number;
        openRate: number;
        clickRate: number;
    };
}>;
export type ChannelStats = z.infer<typeof ChannelStatsSchema>;
//# sourceMappingURL=index.d.ts.map