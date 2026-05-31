import { z } from 'zod';
export declare enum EventCategory {
    COMMERCE = "commerce",
    IDENTITY = "identity",
    LOYALTY = "loyalty",
    ENGAGEMENT = "engagement",
    INTELLIGENCE = "intelligence",
    SUPPORT = "support",
    MEDIA = "media",
    NOTIFICATION = "notification"
}
export declare enum EventType {
    ORDER_PLACED = "commerce.order_placed",
    ORDER_COMPLETED = "commerce.order_completed",
    ORDER_CANCELLED = "commerce.order_cancelled",
    ORDER_REFUNDED = "commerce.order_refunded",
    PAYMENT_SUCCESS = "commerce.payment_success",
    PAYMENT_FAILED = "commerce.payment_failed",
    CART_CREATED = "commerce.cart_created",
    CART_ABANDONED = "commerce.cart_abandoned",
    CHECKOUT_STARTED = "commerce.checkout_started",
    PRODUCT_VIEWED = "commerce.product_viewed",
    SEARCH = "commerce.search",
    USER_REGISTERED = "identity.registered",
    USER_LOGGED_IN = "identity.logged_in",
    USER_LOGGED_OUT = "identity.logged_out",
    IDENTITY_LINKED = "identity.linked",
    POINTS_EARNED = "loyalty.points_earned",
    POINTS_REDEEMED = "loyalty.points_redeemed",
    TIER_CHANGED = "loyalty.tier_changed",
    PAGE_VIEW = "engagement.page_view",
    QR_SCANNED = "engagement.qr_scan",
    NOTIFICATION_SENT = "engagement.notification_sent",
    NOTIFICATION_OPENED = "engagement.notification_opened",
    INTENT_DETECTED = "intelligence.intent",
    CHURN_PREDICTED = "intelligence.churn",
    LTV_CALCULATED = "intelligence.ltv",
    SEGMENT_CHANGED = "intelligence.segment",
    RECOMMENDATION_SHOWN = "intelligence.recommendation",
    RECOMMENDATION_CLICKED = "intelligence.recommendation_clicked",
    TICKET_CREATED = "support.ticket_created",
    TICKET_RESOLVED = "support.ticket_resolved",
    CSAT_RECEIVED = "support.csat",
    AD_IMPRESSED = "media.ad_impressed",
    AD_CLICKED = "media.ad_clicked",
    AD_CONVERTED = "media.ad_converted",
    NOTIFICATION_DELIVERED = "notification.delivered",
    NOTIFICATION_CLICKED = "notification.clicked",
    NOTIFICATION_BOUNCED = "notification.bounced"
}
export declare const EventSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    type: z.ZodString;
    category: z.ZodNativeEnum<typeof EventCategory>;
    name: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    entityType: z.ZodOptional<z.ZodString>;
    entityId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
    source: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    channel: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
        city: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        latitude?: number | undefined;
        longitude?: number | undefined;
        city?: string | undefined;
        country?: string | undefined;
    }, {
        latitude?: number | undefined;
        longitude?: number | undefined;
        city?: string | undefined;
        country?: string | undefined;
    }>>;
    properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    metrics: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    context: z.ZodOptional<z.ZodObject<{
        userAgent: z.ZodOptional<z.ZodString>;
        ip: z.ZodOptional<z.ZodString>;
        deviceType: z.ZodOptional<z.ZodString>;
        browser: z.ZodOptional<z.ZodString>;
        os: z.ZodOptional<z.ZodString>;
        referrer: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        userAgent?: string | undefined;
        ip?: string | undefined;
        deviceType?: string | undefined;
        browser?: string | undefined;
        os?: string | undefined;
        referrer?: string | undefined;
    }, {
        userAgent?: string | undefined;
        ip?: string | undefined;
        deviceType?: string | undefined;
        browser?: string | undefined;
        os?: string | undefined;
        referrer?: string | undefined;
    }>>;
    derivedFrom: z.ZodOptional<z.ZodString>;
    processed: z.ZodDefault<z.ZodBoolean>;
    processedAt: z.ZodOptional<z.ZodDate>;
    version: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    type: string;
    category: EventCategory;
    name: string;
    timestamp: Date;
    processed: boolean;
    version: string;
    userId?: string | undefined;
    entityType?: string | undefined;
    entityId?: string | undefined;
    source?: string | undefined;
    sessionId?: string | undefined;
    channel?: string | undefined;
    location?: {
        latitude?: number | undefined;
        longitude?: number | undefined;
        city?: string | undefined;
        country?: string | undefined;
    } | undefined;
    properties?: Record<string, any> | undefined;
    metrics?: Record<string, number> | undefined;
    context?: {
        userAgent?: string | undefined;
        ip?: string | undefined;
        deviceType?: string | undefined;
        browser?: string | undefined;
        os?: string | undefined;
        referrer?: string | undefined;
    } | undefined;
    derivedFrom?: string | undefined;
    processedAt?: Date | undefined;
}, {
    id: string;
    tenantId: string;
    type: string;
    category: EventCategory;
    name: string;
    timestamp: Date;
    userId?: string | undefined;
    entityType?: string | undefined;
    entityId?: string | undefined;
    source?: string | undefined;
    sessionId?: string | undefined;
    channel?: string | undefined;
    location?: {
        latitude?: number | undefined;
        longitude?: number | undefined;
        city?: string | undefined;
        country?: string | undefined;
    } | undefined;
    properties?: Record<string, any> | undefined;
    metrics?: Record<string, number> | undefined;
    context?: {
        userAgent?: string | undefined;
        ip?: string | undefined;
        deviceType?: string | undefined;
        browser?: string | undefined;
        os?: string | undefined;
        referrer?: string | undefined;
    } | undefined;
    derivedFrom?: string | undefined;
    processed?: boolean | undefined;
    processedAt?: Date | undefined;
    version?: string | undefined;
}>;
export type Event = z.infer<typeof EventSchema>;
export declare enum SubscriptionProtocol {
    HTTP = "http",
    WEBSOCKET = "websocket",
    KAFKA = "kafka",
    REDIS = "redis"
}
export declare const SubscriptionSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    eventTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    eventCategories: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof EventCategory>, "many">>;
    userId: z.ZodOptional<z.ZodString>;
    protocol: z.ZodNativeEnum<typeof SubscriptionProtocol>;
    endpoint: z.ZodString;
    auth: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["bearer", "api_key", "basic"]>;
        token: z.ZodOptional<z.ZodString>;
        apiKey: z.ZodOptional<z.ZodString>;
        username: z.ZodOptional<z.ZodString>;
        password: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "bearer" | "api_key" | "basic";
        token?: string | undefined;
        apiKey?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
    }, {
        type: "bearer" | "api_key" | "basic";
        token?: string | undefined;
        apiKey?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
    }>>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    retryOnFailure: z.ZodDefault<z.ZodBoolean>;
    maxRetries: z.ZodDefault<z.ZodNumber>;
    retryDelayMs: z.ZodDefault<z.ZodNumber>;
    filter: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    lastTriggeredAt: z.ZodOptional<z.ZodDate>;
    triggerCount: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    name: string;
    protocol: SubscriptionProtocol;
    endpoint: string;
    enabled: boolean;
    retryOnFailure: boolean;
    maxRetries: number;
    retryDelayMs: number;
    createdAt: Date;
    updatedAt: Date;
    triggerCount: number;
    filter?: Record<string, any> | undefined;
    userId?: string | undefined;
    description?: string | undefined;
    eventTypes?: string[] | undefined;
    eventCategories?: EventCategory[] | undefined;
    auth?: {
        type: "bearer" | "api_key" | "basic";
        token?: string | undefined;
        apiKey?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
    } | undefined;
    lastTriggeredAt?: Date | undefined;
}, {
    id: string;
    tenantId: string;
    name: string;
    protocol: SubscriptionProtocol;
    endpoint: string;
    createdAt: Date;
    updatedAt: Date;
    filter?: Record<string, any> | undefined;
    userId?: string | undefined;
    description?: string | undefined;
    eventTypes?: string[] | undefined;
    eventCategories?: EventCategory[] | undefined;
    auth?: {
        type: "bearer" | "api_key" | "basic";
        token?: string | undefined;
        apiKey?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
    } | undefined;
    enabled?: boolean | undefined;
    retryOnFailure?: boolean | undefined;
    maxRetries?: number | undefined;
    retryDelayMs?: number | undefined;
    lastTriggeredAt?: Date | undefined;
    triggerCount?: number | undefined;
}>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export declare const EventSchemaDefinitionSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    tenantId: z.ZodOptional<z.ZodString>;
    schema: z.ZodRecord<z.ZodString, z.ZodAny>;
    validationRules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        rule: z.ZodString;
        params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        field: string;
        rule: string;
        params?: Record<string, any> | undefined;
    }, {
        field: string;
        rule: string;
        params?: Record<string, any> | undefined;
    }>, "many">>;
    description: z.ZodOptional<z.ZodString>;
    examples: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    createdAt: Date;
    updatedAt: Date;
    schema: Record<string, any>;
    tenantId?: string | undefined;
    description?: string | undefined;
    validationRules?: {
        field: string;
        rule: string;
        params?: Record<string, any> | undefined;
    }[] | undefined;
    examples?: Record<string, any>[] | undefined;
}, {
    name: string;
    createdAt: Date;
    updatedAt: Date;
    schema: Record<string, any>;
    tenantId?: string | undefined;
    version?: string | undefined;
    description?: string | undefined;
    validationRules?: {
        field: string;
        rule: string;
        params?: Record<string, any> | undefined;
    }[] | undefined;
    examples?: Record<string, any>[] | undefined;
}>;
export type EventSchemaDefinition = z.infer<typeof EventSchemaDefinitionSchema>;
export declare enum DLQReason {
    PARSING_ERROR = "parsing_error",
    VALIDATION_ERROR = "validation_error",
    SCHEMA_NOT_FOUND = "schema_not_found",
    TENANT_NOT_FOUND = "tenant_not_found",
    PROCESSING_ERROR = "processing_error",
    SUBSCRIPTION_FAILED = "subscription_failed",
    TIMEOUT = "timeout"
}
export declare const DLQEntrySchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    originalEvent: z.ZodRecord<z.ZodString, z.ZodAny>;
    eventType: z.ZodString;
    reason: z.ZodNativeEnum<typeof DLQReason>;
    errorMessage: z.ZodString;
    errorStack: z.ZodOptional<z.ZodString>;
    retryCount: z.ZodDefault<z.ZodNumber>;
    maxRetries: z.ZodDefault<z.ZodNumber>;
    nextRetryAt: z.ZodOptional<z.ZodDate>;
    status: z.ZodEnum<["pending", "retrying", "dead", "resolved"]>;
    resolvedAt: z.ZodOptional<z.ZodDate>;
    resolvedBy: z.ZodOptional<z.ZodString>;
    failedAt: z.ZodDate;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    status: "pending" | "retrying" | "dead" | "resolved";
    maxRetries: number;
    createdAt: Date;
    updatedAt: Date;
    originalEvent: Record<string, any>;
    eventType: string;
    reason: DLQReason;
    errorMessage: string;
    retryCount: number;
    failedAt: Date;
    errorStack?: string | undefined;
    nextRetryAt?: Date | undefined;
    resolvedAt?: Date | undefined;
    resolvedBy?: string | undefined;
}, {
    id: string;
    tenantId: string;
    status: "pending" | "retrying" | "dead" | "resolved";
    createdAt: Date;
    updatedAt: Date;
    originalEvent: Record<string, any>;
    eventType: string;
    reason: DLQReason;
    errorMessage: string;
    failedAt: Date;
    maxRetries?: number | undefined;
    errorStack?: string | undefined;
    retryCount?: number | undefined;
    nextRetryAt?: Date | undefined;
    resolvedAt?: Date | undefined;
    resolvedBy?: string | undefined;
}>;
export type DLQEntry = z.infer<typeof DLQEntrySchema>;
export declare const EventQuerySchema: z.ZodObject<{
    tenantId: z.ZodString;
    eventTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    eventCategories: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof EventCategory>, "many">>;
    userId: z.ZodOptional<z.ZodString>;
    entityType: z.ZodOptional<z.ZodString>;
    entityId: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodDate>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["timestamp", "createdAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    limit: number;
    offset: number;
    sortBy: "timestamp" | "createdAt";
    sortOrder: "asc" | "desc";
    userId?: string | undefined;
    entityType?: string | undefined;
    entityId?: string | undefined;
    source?: string | undefined;
    eventTypes?: string[] | undefined;
    eventCategories?: EventCategory[] | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
}, {
    tenantId: string;
    userId?: string | undefined;
    entityType?: string | undefined;
    entityId?: string | undefined;
    source?: string | undefined;
    eventTypes?: string[] | undefined;
    eventCategories?: EventCategory[] | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    sortBy?: "timestamp" | "createdAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type EventQuery = z.infer<typeof EventQuerySchema>;
export declare const EventAggregationSchema: z.ZodObject<{
    tenantId: z.ZodString;
    groupBy: z.ZodArray<z.ZodString, "many">;
    metrics: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        field: z.ZodString;
        operation: z.ZodEnum<["count", "sum", "avg", "min", "max", "countDistinct"]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        field: string;
        operation: "count" | "sum" | "avg" | "min" | "max" | "countDistinct";
    }, {
        name: string;
        field: string;
        operation: "count" | "sum" | "avg" | "min" | "max" | "countDistinct";
    }>, "many">;
    eventTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    userId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    granularity: z.ZodOptional<z.ZodEnum<["minute", "hour", "day", "week", "month"]>>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    metrics: {
        name: string;
        field: string;
        operation: "count" | "sum" | "avg" | "min" | "max" | "countDistinct";
    }[];
    startDate: Date;
    endDate: Date;
    groupBy: string[];
    userId?: string | undefined;
    eventTypes?: string[] | undefined;
    granularity?: "minute" | "hour" | "day" | "week" | "month" | undefined;
}, {
    tenantId: string;
    metrics: {
        name: string;
        field: string;
        operation: "count" | "sum" | "avg" | "min" | "max" | "countDistinct";
    }[];
    startDate: Date;
    endDate: Date;
    groupBy: string[];
    userId?: string | undefined;
    eventTypes?: string[] | undefined;
    granularity?: "minute" | "hour" | "day" | "week" | "month" | undefined;
}>;
export type EventAggregation = z.infer<typeof EventAggregationSchema>;
export type { Event, Subscription, EventSchemaDefinition, DLQEntry };
//# sourceMappingURL=index.d.ts.map