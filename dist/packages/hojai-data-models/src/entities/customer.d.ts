/**
 * Hojai Data Models - Customer Entity
 * Version: 1.0.0 | Date: May 30, 2026
 *
 * Customer is the primary entity for all B2C operations.
 * Links to Identity Platform for cross-channel resolution.
 */
import { z } from 'zod';
/**
 * Customer type
 */
export type CustomerType = 'individual' | 'business';
/**
 * Gender options
 */
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
/**
 * Customer status
 */
export type CustomerStatus = 'active' | 'inactive' | 'blocked' | 'deleted';
/**
 * Geo point for location
 */
export interface GeoPoint {
    lat: number;
    lng: number;
}
/**
 * Customer entity
 */
export interface Customer {
    id: string;
    tenant_id: string;
    type: CustomerType;
    phone?: string;
    email?: string;
    device_ids: string[];
    external_ids: Record<string, string>;
    unified_identity_id?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    birthday?: string;
    gender?: Gender;
    anniversary?: string;
    current_location?: GeoPoint;
    home_location?: GeoPoint;
    work_location?: GeoPoint;
    business_name?: string;
    business_type?: string;
    gstin?: string;
    pan?: string;
    lifetime_value: number;
    order_count: number;
    avg_order_value: number;
    total_savings?: number;
    last_order_date?: string;
    first_order_date?: string;
    first_interaction_at?: string;
    last_interaction_at?: string;
    churn_risk: 'low' | 'medium' | 'high';
    engagement_score: number;
    nps_score?: number;
    satisfaction_score?: number;
    segments: string[];
    tags: string[];
    preferences: CustomerPreferences;
    consent_status: CustomerConsentStatus;
    status: CustomerStatus;
    created_at: string;
    updated_at: string;
    last_activity_at?: string;
}
/**
 * Customer preferences
 */
export interface CustomerPreferences {
    language: string;
    notification_channel: 'whatsapp' | 'sms' | 'email' | 'app';
    communication_tone: 'formal' | 'friendly' | 'casual';
    timezone: string;
    currency: string;
}
/**
 * Customer consent status
 */
export interface CustomerConsentStatus {
    marketing: boolean;
    communication: boolean;
    third_party: boolean;
    data_processing: boolean;
    health?: boolean;
    location?: boolean;
    last_consent_update?: string;
}
/**
 * Customer summary (for lists)
 */
export interface CustomerSummary {
    id: string;
    tenant_id: string;
    type: CustomerType;
    name: string;
    phone?: string;
    email?: string;
    lifetime_value: number;
    engagement_score: number;
    churn_risk: 'low' | 'medium' | 'high';
    status: CustomerStatus;
    last_interaction_at?: string;
}
/**
 * Customer 360 view
 */
export interface Customer360 {
    customer: Customer;
    unified_identity?: UnifiedIdentity;
    conversations: ConversationSummary[];
    orders: OrderSummary[];
    memory: MemorySummary[];
    predictions?: PredictionSummary;
    segments: string[];
    tags: string[];
    lifetime_value: number;
    engagement_score: number;
    risk_assessment: RiskAssessment;
    timeline: TimelineEvent[];
}
/**
 * Unified identity info
 */
export interface UnifiedIdentity {
    id: string;
    linked_channels: string[];
    link_count: number;
    last_linked_at?: string;
}
/**
 * Conversation summary
 */
export interface ConversationSummary {
    id: string;
    channel: string;
    last_message: string;
    message_count: number;
    status: string;
    last_message_at: string;
}
/**
 * Order summary
 */
export interface OrderSummary {
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
}
/**
 * Memory summary
 */
export interface MemorySummary {
    type: string;
    key: string;
    value: string;
    confidence: number;
    updated_at: string;
}
/**
 * Prediction summary
 */
export interface PredictionSummary {
    churn_probability?: number;
    ltv_prediction?: number;
    next_purchase_days?: number;
    conversion_probability?: number;
    risk_level?: 'low' | 'medium' | 'high';
}
/**
 * Risk assessment
 */
export interface RiskAssessment {
    churn_risk: 'low' | 'medium' | 'high';
    churn_probability: number;
    factors: string[];
    recommended_actions: string[];
}
/**
 * Timeline event
 */
export interface TimelineEvent {
    id: string;
    type: string;
    title: string;
    description?: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}
export declare const CustomerCreateSchema: z.ZodObject<{
    type: z.ZodEnum<["individual", "business"]>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    birthday: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer_not_to_say"]>>;
    business_name: z.ZodOptional<z.ZodString>;
    business_type: z.ZodOptional<z.ZodString>;
    preferences: z.ZodOptional<z.ZodObject<{
        language: z.ZodDefault<z.ZodString>;
        notification_channel: z.ZodDefault<z.ZodEnum<["whatsapp", "sms", "email", "app"]>>;
        communication_tone: z.ZodDefault<z.ZodEnum<["formal", "friendly", "casual"]>>;
        timezone: z.ZodDefault<z.ZodString>;
        currency: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        currency: string;
        timezone: string;
        notification_channel: "whatsapp" | "sms" | "email" | "app";
        communication_tone: "formal" | "friendly" | "casual";
    }, {
        language?: string | undefined;
        currency?: string | undefined;
        timezone?: string | undefined;
        notification_channel?: "whatsapp" | "sms" | "email" | "app" | undefined;
        communication_tone?: "formal" | "friendly" | "casual" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "individual" | "business";
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    birthday?: string | undefined;
    gender?: "other" | "male" | "female" | "prefer_not_to_say" | undefined;
    business_name?: string | undefined;
    business_type?: string | undefined;
    preferences?: {
        language: string;
        currency: string;
        timezone: string;
        notification_channel: "whatsapp" | "sms" | "email" | "app";
        communication_tone: "formal" | "friendly" | "casual";
    } | undefined;
}, {
    type: "individual" | "business";
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    birthday?: string | undefined;
    gender?: "other" | "male" | "female" | "prefer_not_to_say" | undefined;
    business_name?: string | undefined;
    business_type?: string | undefined;
    preferences?: {
        language?: string | undefined;
        currency?: string | undefined;
        timezone?: string | undefined;
        notification_channel?: "whatsapp" | "sms" | "email" | "app" | undefined;
        communication_tone?: "formal" | "friendly" | "casual" | undefined;
    } | undefined;
}>;
export declare const CustomerUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    avatar_url: z.ZodOptional<z.ZodString>;
    birthday: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer_not_to_say"]>>;
    preferences: z.ZodOptional<z.ZodObject<{
        language: z.ZodOptional<z.ZodString>;
        notification_channel: z.ZodOptional<z.ZodEnum<["whatsapp", "sms", "email", "app"]>>;
        communication_tone: z.ZodOptional<z.ZodEnum<["formal", "friendly", "casual"]>>;
        timezone: z.ZodOptional<z.ZodString>;
        currency: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        language?: string | undefined;
        currency?: string | undefined;
        timezone?: string | undefined;
        notification_channel?: "whatsapp" | "sms" | "email" | "app" | undefined;
        communication_tone?: "formal" | "friendly" | "casual" | undefined;
    }, {
        language?: string | undefined;
        currency?: string | undefined;
        timezone?: string | undefined;
        notification_channel?: "whatsapp" | "sms" | "email" | "app" | undefined;
        communication_tone?: "formal" | "friendly" | "casual" | undefined;
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    tags?: string[] | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    birthday?: string | undefined;
    gender?: "other" | "male" | "female" | "prefer_not_to_say" | undefined;
    preferences?: {
        language?: string | undefined;
        currency?: string | undefined;
        timezone?: string | undefined;
        notification_channel?: "whatsapp" | "sms" | "email" | "app" | undefined;
        communication_tone?: "formal" | "friendly" | "casual" | undefined;
    } | undefined;
    avatar_url?: string | undefined;
}, {
    name?: string | undefined;
    tags?: string[] | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    birthday?: string | undefined;
    gender?: "other" | "male" | "female" | "prefer_not_to_say" | undefined;
    preferences?: {
        language?: string | undefined;
        currency?: string | undefined;
        timezone?: string | undefined;
        notification_channel?: "whatsapp" | "sms" | "email" | "app" | undefined;
        communication_tone?: "formal" | "friendly" | "casual" | undefined;
    } | undefined;
    avatar_url?: string | undefined;
}>;
export declare function createCustomer(tenantId: string, data: z.infer<typeof CustomerCreateSchema>): Customer;
export declare function updateCustomerMetrics(customer: Customer, metrics: {
    lifetime_value?: number;
    order_count?: number;
    last_order_date?: string;
}): Customer;
export declare function updateCustomerRisk(customer: Customer, risk: 'low' | 'medium' | 'high', engagement_score: number): Customer;
export type { Customer, CustomerPreferences, CustomerConsentStatus, CustomerSummary, Customer360, UnifiedIdentity, ConversationSummary, OrderSummary, MemorySummary, PredictionSummary, RiskAssessment, TimelineEvent, GeoPoint, };
//# sourceMappingURL=customer.d.ts.map