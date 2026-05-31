import { z } from 'zod';
// ============================================================================
// EVENT TYPES
// ============================================================================
export var EventCategory;
(function (EventCategory) {
    EventCategory["COMMERCE"] = "commerce";
    EventCategory["IDENTITY"] = "identity";
    EventCategory["LOYALTY"] = "loyalty";
    EventCategory["ENGAGEMENT"] = "engagement";
    EventCategory["INTELLIGENCE"] = "intelligence";
    EventCategory["SUPPORT"] = "support";
    EventCategory["MEDIA"] = "media";
    EventCategory["NOTIFICATION"] = "notification";
})(EventCategory || (EventCategory = {}));
// Event types by category
export var EventType;
(function (EventType) {
    // Commerce events
    EventType["ORDER_PLACED"] = "commerce.order_placed";
    EventType["ORDER_COMPLETED"] = "commerce.order_completed";
    EventType["ORDER_CANCELLED"] = "commerce.order_cancelled";
    EventType["ORDER_REFUNDED"] = "commerce.order_refunded";
    EventType["PAYMENT_SUCCESS"] = "commerce.payment_success";
    EventType["PAYMENT_FAILED"] = "commerce.payment_failed";
    EventType["CART_CREATED"] = "commerce.cart_created";
    EventType["CART_ABANDONED"] = "commerce.cart_abandoned";
    EventType["CHECKOUT_STARTED"] = "commerce.checkout_started";
    EventType["PRODUCT_VIEWED"] = "commerce.product_viewed";
    EventType["SEARCH"] = "commerce.search";
    // Identity events
    EventType["USER_REGISTERED"] = "identity.registered";
    EventType["USER_LOGGED_IN"] = "identity.logged_in";
    EventType["USER_LOGGED_OUT"] = "identity.logged_out";
    EventType["IDENTITY_LINKED"] = "identity.linked";
    // Loyalty events
    EventType["POINTS_EARNED"] = "loyalty.points_earned";
    EventType["POINTS_REDEEMED"] = "loyalty.points_redeemed";
    EventType["TIER_CHANGED"] = "loyalty.tier_changed";
    // Engagement events
    EventType["PAGE_VIEW"] = "engagement.page_view";
    EventType["QR_SCANNED"] = "engagement.qr_scan";
    EventType["NOTIFICATION_SENT"] = "engagement.notification_sent";
    EventType["NOTIFICATION_OPENED"] = "engagement.notification_opened";
    // Intelligence events
    EventType["INTENT_DETECTED"] = "intelligence.intent";
    EventType["CHURN_PREDICTED"] = "intelligence.churn";
    EventType["LTV_CALCULATED"] = "intelligence.ltv";
    EventType["SEGMENT_CHANGED"] = "intelligence.segment";
    EventType["RECOMMENDATION_SHOWN"] = "intelligence.recommendation";
    EventType["RECOMMENDATION_CLICKED"] = "intelligence.recommendation_clicked";
    // Support events
    EventType["TICKET_CREATED"] = "support.ticket_created";
    EventType["TICKET_RESOLVED"] = "support.ticket_resolved";
    EventType["CSAT_RECEIVED"] = "support.csat";
    // Media events
    EventType["AD_IMPRESSED"] = "media.ad_impressed";
    EventType["AD_CLICKED"] = "media.ad_clicked";
    EventType["AD_CONVERTED"] = "media.ad_converted";
    // Notification events
    EventType["NOTIFICATION_DELIVERED"] = "notification.delivered";
    EventType["NOTIFICATION_CLICKED"] = "notification.clicked";
    EventType["NOTIFICATION_BOUNCED"] = "notification.bounced";
})(EventType || (EventType = {}));
// Schema for any event
export const EventSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    // Event identification
    type: z.string(), // e.g., "commerce.order_placed"
    category: z.nativeEnum(EventCategory),
    name: z.string(),
    // Who/What
    userId: z.string().optional(),
    entityType: z.string().optional(), // "order", "product", "user"
    entityId: z.string().optional(),
    // When
    timestamp: z.date(),
    // Where
    source: z.string().optional(), // "web", "mobile", "api"
    sessionId: z.string().optional(),
    channel: z.string().optional(), // "whatsapp", "app", "website"
    // Location
    location: z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        city: z.string().optional(),
        country: z.string().optional()
    }).optional(),
    // Event data
    properties: z.record(z.any()).optional(),
    metrics: z.record(z.number()).optional(),
    // Context
    context: z.object({
        userAgent: z.string().optional(),
        ip: z.string().optional(),
        deviceType: z.string().optional(),
        browser: z.string().optional(),
        os: z.string().optional(),
        referrer: z.string().optional()
    }).optional(),
    // Derived
    derivedFrom: z.string().uuid().optional(), // If this event was derived from another
    // Processing
    processed: z.boolean().default(false),
    processedAt: z.date().optional(),
    version: z.string().default('1.0')
});
// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================
export var SubscriptionProtocol;
(function (SubscriptionProtocol) {
    SubscriptionProtocol["HTTP"] = "http";
    SubscriptionProtocol["WEBSOCKET"] = "websocket";
    SubscriptionProtocol["KAFKA"] = "kafka";
    SubscriptionProtocol["REDIS"] = "redis";
})(SubscriptionProtocol || (SubscriptionProtocol = {}));
export const SubscriptionSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    name: z.string(),
    description: z.string().optional(),
    // Event filters
    eventTypes: z.array(z.string()).optional(), // e.g., ["commerce.*", "identity.*"]
    eventCategories: z.array(z.nativeEnum(EventCategory)).optional(),
    userId: z.string().optional(), // Filter by specific user
    // Destination
    protocol: z.nativeEnum(SubscriptionProtocol),
    endpoint: z.string().url(), // URL for HTTP, WS endpoint, or Kafka topic
    // Auth for HTTP endpoints
    auth: z.object({
        type: z.enum(['bearer', 'api_key', 'basic']),
        token: z.string().optional(),
        apiKey: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional()
    }).optional(),
    // Configuration
    enabled: z.boolean().default(true),
    retryOnFailure: z.boolean().default(true),
    maxRetries: z.number().default(3),
    retryDelayMs: z.number().default(1000),
    // Filtering
    filter: z.record(z.any()).optional(), // Additional filter conditions
    createdAt: z.date(),
    updatedAt: z.date(),
    lastTriggeredAt: z.date().optional(),
    triggerCount: z.number().default(0)
});
// ============================================================================
// EVENT SCHEMA REGISTRY
// ============================================================================
export const EventSchemaDefinitionSchema = z.object({
    name: z.string(), // e.g., "commerce.order_placed"
    version: z.string().default('1.0'),
    tenantId: z.string().uuid().optional(), // null for global schemas
    // JSON Schema definition
    schema: z.record(z.any()),
    // Validation
    validationRules: z.array(z.object({
        field: z.string(),
        rule: z.string(),
        params: z.record(z.any()).optional()
    })).optional(),
    // Metadata
    description: z.string().optional(),
    examples: z.array(z.record(z.any())).optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// DEAD LETTER QUEUE
// ============================================================================
export var DLQReason;
(function (DLQReason) {
    DLQReason["PARSING_ERROR"] = "parsing_error";
    DLQReason["VALIDATION_ERROR"] = "validation_error";
    DLQReason["SCHEMA_NOT_FOUND"] = "schema_not_found";
    DLQReason["TENANT_NOT_FOUND"] = "tenant_not_found";
    DLQReason["PROCESSING_ERROR"] = "processing_error";
    DLQReason["SUBSCRIPTION_FAILED"] = "subscription_failed";
    DLQReason["TIMEOUT"] = "timeout";
})(DLQReason || (DLQReason = {}));
export const DLQEntrySchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    // Original event
    originalEvent: z.record(z.any()),
    eventType: z.string(),
    // Error info
    reason: z.nativeEnum(DLQReason),
    errorMessage: z.string(),
    errorStack: z.string().optional(),
    // Retry info
    retryCount: z.number().default(0),
    maxRetries: z.number().default(5),
    nextRetryAt: z.date().optional(),
    // Status
    status: z.enum(['pending', 'retrying', 'dead', 'resolved']),
    resolvedAt: z.date().optional(),
    resolvedBy: z.string().optional(),
    // Timestamps
    failedAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// EVENT QUERY
// ============================================================================
export const EventQuerySchema = z.object({
    tenantId: z.string().uuid(),
    // Filters
    eventTypes: z.array(z.string()).optional(),
    eventCategories: z.array(z.nativeEnum(EventCategory)).optional(),
    userId: z.string().optional(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    source: z.string().optional(),
    // Time range
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    // Pagination
    limit: z.number().min(1).max(1000).default(100),
    offset: z.number().min(0).default(0),
    // Sort
    sortBy: z.enum(['timestamp', 'createdAt']).default('timestamp'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// AGGREGATION
// ============================================================================
export const EventAggregationSchema = z.object({
    tenantId: z.string().uuid(),
    // Group by
    groupBy: z.array(z.string()), // e.g., ["type", "source"]
    // Metrics
    metrics: z.array(z.object({
        name: z.string(),
        field: z.string(),
        operation: z.enum(['count', 'sum', 'avg', 'min', 'max', 'countDistinct'])
    })),
    // Filters
    eventTypes: z.array(z.string()).optional(),
    userId: z.string().optional(),
    // Time range
    startDate: z.date(),
    endDate: z.date(),
    // Granularity (for time-based aggregation)
    granularity: z.enum(['minute', 'hour', 'day', 'week', 'month']).optional()
});
//# sourceMappingURL=index.js.map