"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventAggregationSchema = exports.EventQuerySchema = exports.DLQEntrySchema = exports.DLQReason = exports.EventSchemaDefinitionSchema = exports.SubscriptionSchema = exports.SubscriptionProtocol = exports.EventSchema = exports.EventType = exports.EventCategory = void 0;
const zod_1 = require("zod");
// ============================================================================
// EVENT TYPES
// ============================================================================
var EventCategory;
(function (EventCategory) {
    EventCategory["COMMERCE"] = "commerce";
    EventCategory["IDENTITY"] = "identity";
    EventCategory["LOYALTY"] = "loyalty";
    EventCategory["ENGAGEMENT"] = "engagement";
    EventCategory["INTELLIGENCE"] = "intelligence";
    EventCategory["SUPPORT"] = "support";
    EventCategory["MEDIA"] = "media";
    EventCategory["NOTIFICATION"] = "notification";
})(EventCategory || (exports.EventCategory = EventCategory = {}));
// Event types by category
var EventType;
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
})(EventType || (exports.EventType = EventType = {}));
// Schema for any event
exports.EventSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // Event identification
    type: zod_1.z.string(), // e.g., "commerce.order_placed"
    category: zod_1.z.nativeEnum(EventCategory),
    name: zod_1.z.string(),
    // Who/What
    userId: zod_1.z.string().optional(),
    entityType: zod_1.z.string().optional(), // "order", "product", "user"
    entityId: zod_1.z.string().optional(),
    // When
    timestamp: zod_1.z.date(),
    // Where
    source: zod_1.z.string().optional(), // "web", "mobile", "api"
    sessionId: zod_1.z.string().optional(),
    channel: zod_1.z.string().optional(), // "whatsapp", "app", "website"
    // Location
    location: zod_1.z.object({
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        city: zod_1.z.string().optional(),
        country: zod_1.z.string().optional()
    }).optional(),
    // Event data
    properties: zod_1.z.record(zod_1.z.any()).optional(),
    metrics: zod_1.z.record(zod_1.z.number()).optional(),
    // Context
    context: zod_1.z.object({
        userAgent: zod_1.z.string().optional(),
        ip: zod_1.z.string().optional(),
        deviceType: zod_1.z.string().optional(),
        browser: zod_1.z.string().optional(),
        os: zod_1.z.string().optional(),
        referrer: zod_1.z.string().optional()
    }).optional(),
    // Derived
    derivedFrom: zod_1.z.string().uuid().optional(), // If this event was derived from another
    // Processing
    processed: zod_1.z.boolean().default(false),
    processedAt: zod_1.z.date().optional(),
    version: zod_1.z.string().default('1.0')
});
// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================
var SubscriptionProtocol;
(function (SubscriptionProtocol) {
    SubscriptionProtocol["HTTP"] = "http";
    SubscriptionProtocol["WEBSOCKET"] = "websocket";
    SubscriptionProtocol["KAFKA"] = "kafka";
    SubscriptionProtocol["REDIS"] = "redis";
})(SubscriptionProtocol || (exports.SubscriptionProtocol = SubscriptionProtocol = {}));
exports.SubscriptionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    // Event filters
    eventTypes: zod_1.z.array(zod_1.z.string()).optional(), // e.g., ["commerce.*", "identity.*"]
    eventCategories: zod_1.z.array(zod_1.z.nativeEnum(EventCategory)).optional(),
    userId: zod_1.z.string().optional(), // Filter by specific user
    // Destination
    protocol: zod_1.z.nativeEnum(SubscriptionProtocol),
    endpoint: zod_1.z.string().url(), // URL for HTTP, WS endpoint, or Kafka topic
    // Auth for HTTP endpoints
    auth: zod_1.z.object({
        type: zod_1.z.enum(['bearer', 'api_key', 'basic']),
        token: zod_1.z.string().optional(),
        apiKey: zod_1.z.string().optional(),
        username: zod_1.z.string().optional(),
        password: zod_1.z.string().optional()
    }).optional(),
    // Configuration
    enabled: zod_1.z.boolean().default(true),
    retryOnFailure: zod_1.z.boolean().default(true),
    maxRetries: zod_1.z.number().default(3),
    retryDelayMs: zod_1.z.number().default(1000),
    // Filtering
    filter: zod_1.z.record(zod_1.z.any()).optional(), // Additional filter conditions
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    lastTriggeredAt: zod_1.z.date().optional(),
    triggerCount: zod_1.z.number().default(0)
});
// ============================================================================
// EVENT SCHEMA REGISTRY
// ============================================================================
exports.EventSchemaDefinitionSchema = zod_1.z.object({
    name: zod_1.z.string(), // e.g., "commerce.order_placed"
    version: zod_1.z.string().default('1.0'),
    tenantId: zod_1.z.string().uuid().optional(), // null for global schemas
    // JSON Schema definition
    schema: zod_1.z.record(zod_1.z.any()),
    // Validation
    validationRules: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(),
        rule: zod_1.z.string(),
        params: zod_1.z.record(zod_1.z.any()).optional()
    })).optional(),
    // Metadata
    description: zod_1.z.string().optional(),
    examples: zod_1.z.array(zod_1.z.record(zod_1.z.any())).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// DEAD LETTER QUEUE
// ============================================================================
var DLQReason;
(function (DLQReason) {
    DLQReason["PARSING_ERROR"] = "parsing_error";
    DLQReason["VALIDATION_ERROR"] = "validation_error";
    DLQReason["SCHEMA_NOT_FOUND"] = "schema_not_found";
    DLQReason["TENANT_NOT_FOUND"] = "tenant_not_found";
    DLQReason["PROCESSING_ERROR"] = "processing_error";
    DLQReason["SUBSCRIPTION_FAILED"] = "subscription_failed";
    DLQReason["TIMEOUT"] = "timeout";
})(DLQReason || (exports.DLQReason = DLQReason = {}));
exports.DLQEntrySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // Original event
    originalEvent: zod_1.z.record(zod_1.z.any()),
    eventType: zod_1.z.string(),
    // Error info
    reason: zod_1.z.nativeEnum(DLQReason),
    errorMessage: zod_1.z.string(),
    errorStack: zod_1.z.string().optional(),
    // Retry info
    retryCount: zod_1.z.number().default(0),
    maxRetries: zod_1.z.number().default(5),
    nextRetryAt: zod_1.z.date().optional(),
    // Status
    status: zod_1.z.enum(['pending', 'retrying', 'dead', 'resolved']),
    resolvedAt: zod_1.z.date().optional(),
    resolvedBy: zod_1.z.string().optional(),
    // Timestamps
    failedAt: zod_1.z.date(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// EVENT QUERY
// ============================================================================
exports.EventQuerySchema = zod_1.z.object({
    tenantId: zod_1.z.string().uuid(),
    // Filters
    eventTypes: zod_1.z.array(zod_1.z.string()).optional(),
    eventCategories: zod_1.z.array(zod_1.z.nativeEnum(EventCategory)).optional(),
    userId: zod_1.z.string().optional(),
    entityType: zod_1.z.string().optional(),
    entityId: zod_1.z.string().optional(),
    source: zod_1.z.string().optional(),
    // Time range
    startDate: zod_1.z.date().optional(),
    endDate: zod_1.z.date().optional(),
    // Pagination
    limit: zod_1.z.number().min(1).max(1000).default(100),
    offset: zod_1.z.number().min(0).default(0),
    // Sort
    sortBy: zod_1.z.enum(['timestamp', 'createdAt']).default('timestamp'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// AGGREGATION
// ============================================================================
exports.EventAggregationSchema = zod_1.z.object({
    tenantId: zod_1.z.string().uuid(),
    // Group by
    groupBy: zod_1.z.array(zod_1.z.string()), // e.g., ["type", "source"]
    // Metrics
    metrics: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        field: zod_1.z.string(),
        operation: zod_1.z.enum(['count', 'sum', 'avg', 'min', 'max', 'countDistinct'])
    })),
    // Filters
    eventTypes: zod_1.z.array(zod_1.z.string()).optional(),
    userId: zod_1.z.string().optional(),
    // Time range
    startDate: zod_1.z.date(),
    endDate: zod_1.z.date(),
    // Granularity (for time-based aggregation)
    granularity: zod_1.z.enum(['minute', 'hour', 'day', 'week', 'month']).optional()
});
//# sourceMappingURL=index.js.map