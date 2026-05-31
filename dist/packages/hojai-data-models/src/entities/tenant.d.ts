/**
 * Hojai Data Models - Tenant Entity
 * Version: 1.0.0 | Date: May 30, 2026
 * Priority: #1 - Most important entity
 *
 * The Tenant is the root entity for all multi-tenant operations.
 * Every other entity in Hojai belongs to a Tenant.
 */
import { z } from 'zod';
/**
 * Tenant types supported by Hojai
 */
export type TenantType = 'rez' | 'merchant' | 'enterprise' | 'rabtul';
/**
 * Tenant plan levels
 */
export type TenantPlan = 'starter' | 'professional' | 'enterprise';
/**
 * Tenant status
 */
export type TenantStatus = 'active' | 'suspended' | 'churned' | 'trial';
/**
 * Supported industries
 */
export type Industry = 'jewellery' | 'healthcare' | 'hospitality' | 'retail' | 'restaurant' | 'salon' | 'fitness' | 'education' | 'finance' | 'real_estate' | 'automotive' | 'travel' | 'ecommerce' | 'other';
/**
 * Tenant entity - the root of all multi-tenant operations
 */
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    type: TenantType;
    industry: Industry;
    namespace: string;
    plan: TenantPlan;
    limits: TenantLimits;
    contact: TenantContact;
    branding: TenantBranding;
    settings: TenantSettings;
    billing: TenantBilling;
    status: TenantStatus;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    suspended_at?: string;
    churned_at?: string;
}
/**
 * Tenant resource limits
 */
export interface TenantLimits {
    max_users: number;
    max_api_calls_per_month: number;
    max_storage_bytes: number;
    rate_limit_per_minute: number;
    max_agents: number;
    max_workflows: number;
    max_campaigns: number;
    max_conversations_per_month: number;
    max_segments: number;
    max_integrations: number;
    max_knowledge_articles: number;
}
/**
 * Tenant contact information
 */
export interface TenantContact {
    email: string;
    phone?: string;
    website?: string;
    address?: Address;
}
/**
 * Address structure
 */
export interface Address {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    landmark?: string;
}
/**
 * Tenant branding customization
 */
export interface TenantBranding {
    logo_url?: string;
    favicon_url?: string;
    primary_color?: string;
    secondary_color?: string;
    font_family?: string;
}
/**
 * Tenant settings
 */
export interface TenantSettings {
    timezone: string;
    language: string;
    date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    time_format: '12h' | '24h';
    currency: string;
    currency_symbol: string;
    features: Record<string, boolean>;
    communication: TenantCommunicationSettings;
    security: TenantSecuritySettings;
}
/**
 * Communication settings
 */
export interface TenantCommunicationSettings {
    default_channel: 'whatsapp' | 'email' | 'sms';
    email_from_name?: string;
    email_from_address?: string;
    sms_sender_id?: string;
}
/**
 * Security settings
 */
export interface TenantSecuritySettings {
    mfa_required: boolean;
    session_timeout_minutes: number;
    password_policy: PasswordPolicy;
    ip_whitelist?: string[];
    allowed_origins?: string[];
}
/**
 * Password policy
 */
export interface PasswordPolicy {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_special_chars: boolean;
}
/**
 * Tenant billing information
 */
export interface TenantBilling {
    billing_email: string;
    billing_contact_name?: string;
    billing_address?: Address;
    subscription_id?: string;
    billing_cycle: 'monthly' | 'yearly';
    payment_method?: string;
    auto_charge: boolean;
    last_payment_date?: string;
    next_payment_date?: string;
    payment_status: 'active' | 'past_due' | 'cancelled';
    invoice_prefix: string;
    invoice_email?: string;
}
/**
 * Tenant creation schema
 */
export declare const TenantCreateSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    type: z.ZodEnum<["rez", "merchant", "enterprise", "rabtul"]>;
    industry: z.ZodEnum<["jewellery", "healthcare", "hospitality", "retail", "restaurant", "salon", "fitness", "education", "finance", "real_estate", "automotive", "travel", "ecommerce", "other"]>;
    contact: z.ZodObject<{
        email: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        phone?: string | undefined;
        website?: string | undefined;
    }, {
        email: string;
        phone?: string | undefined;
        website?: string | undefined;
    }>;
    plan: z.ZodDefault<z.ZodEnum<["starter", "professional", "enterprise"]>>;
}, "strip", z.ZodTypeAny, {
    type: "enterprise" | "merchant" | "rez" | "rabtul";
    name: string;
    plan: "starter" | "professional" | "enterprise";
    contact: {
        email: string;
        phone?: string | undefined;
        website?: string | undefined;
    };
    slug: string;
    industry: "retail" | "healthcare" | "hospitality" | "jewellery" | "education" | "finance" | "real_estate" | "other" | "restaurant" | "salon" | "fitness" | "automotive" | "travel" | "ecommerce";
}, {
    type: "enterprise" | "merchant" | "rez" | "rabtul";
    name: string;
    contact: {
        email: string;
        phone?: string | undefined;
        website?: string | undefined;
    };
    slug: string;
    industry: "retail" | "healthcare" | "hospitality" | "jewellery" | "education" | "finance" | "real_estate" | "other" | "restaurant" | "salon" | "fitness" | "automotive" | "travel" | "ecommerce";
    plan?: "starter" | "professional" | "enterprise" | undefined;
}>;
/**
 * Tenant update schema
 */
export declare const TenantUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    contact: z.ZodOptional<z.ZodObject<{
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email?: string | undefined;
        phone?: string | undefined;
        website?: string | undefined;
    }, {
        email?: string | undefined;
        phone?: string | undefined;
        website?: string | undefined;
    }>>;
    branding: z.ZodOptional<z.ZodObject<{
        logo_url: z.ZodOptional<z.ZodString>;
        primary_color: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        logo_url?: string | undefined;
        primary_color?: string | undefined;
    }, {
        logo_url?: string | undefined;
        primary_color?: string | undefined;
    }>>;
    settings: z.ZodOptional<z.ZodObject<{
        timezone: z.ZodOptional<z.ZodString>;
        language: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        language?: string | undefined;
        timezone?: string | undefined;
    }, {
        language?: string | undefined;
        timezone?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    contact?: {
        email?: string | undefined;
        phone?: string | undefined;
        website?: string | undefined;
    } | undefined;
    settings?: {
        language?: string | undefined;
        timezone?: string | undefined;
    } | undefined;
    branding?: {
        logo_url?: string | undefined;
        primary_color?: string | undefined;
    } | undefined;
}, {
    name?: string | undefined;
    contact?: {
        email?: string | undefined;
        phone?: string | undefined;
        website?: string | undefined;
    } | undefined;
    settings?: {
        language?: string | undefined;
        timezone?: string | undefined;
    } | undefined;
    branding?: {
        logo_url?: string | undefined;
        primary_color?: string | undefined;
    } | undefined;
}>;
/**
 * Tenant limits by plan
 */
export declare const DEFAULT_TENANT_LIMITS: Record<TenantPlan, TenantLimits>;
/**
 * Create a new tenant
 */
export declare function createTenant(data: z.infer<typeof TenantCreateSchema>): Tenant;
/**
 * Upgrade tenant plan
 */
export declare function upgradeTenantPlan(tenant: Tenant, newPlan: TenantPlan): Tenant;
/**
 * Suspend tenant
 */
export declare function suspendTenant(tenant: Tenant): Tenant;
/**
 * Reactivate suspended tenant
 */
export declare function reactivateTenant(tenant: Tenant): Tenant;
/**
 * Mark tenant as churned
 */
export declare function churnTenant(tenant: Tenant): Tenant;
export type { Tenant, TenantLimits, TenantContact, TenantBranding, TenantSettings, TenantCommunicationSettings, TenantSecuritySettings, PasswordPolicy, TenantBilling, };
export { TenantCreateSchema, TenantUpdateSchema, DEFAULT_TENANT_LIMITS, };
//# sourceMappingURL=tenant.d.ts.map