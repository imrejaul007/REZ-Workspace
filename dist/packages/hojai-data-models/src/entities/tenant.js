/**
 * Hojai Data Models - Tenant Entity
 * Version: 1.0.0 | Date: May 30, 2026
 * Priority: #1 - Most important entity
 *
 * The Tenant is the root entity for all multi-tenant operations.
 * Every other entity in Hojai belongs to a Tenant.
 */
import { z } from 'zod';
// ============================================
// ZOD SCHEMAS (Validation)
// ============================================
/**
 * Tenant creation schema
 */
export const TenantCreateSchema = z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
    type: z.enum(['rez', 'merchant', 'enterprise', 'rabtul']),
    industry: z.enum([
        'jewellery', 'healthcare', 'hospitality', 'retail', 'restaurant',
        'salon', 'fitness', 'education', 'finance', 'real_estate',
        'automotive', 'travel', 'ecommerce', 'other'
    ]),
    contact: z.object({
        email: z.string().email(),
        phone: z.string().optional(),
        website: z.string().url().optional(),
    }),
    plan: z.enum(['starter', 'professional', 'enterprise']).default('starter'),
});
/**
 * Tenant update schema
 */
export const TenantUpdateSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    contact: z.object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().url().optional(),
    }).optional(),
    branding: z.object({
        logo_url: z.string().url().optional(),
        primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }).optional(),
    settings: z.object({
        timezone: z.string().optional(),
        language: z.string().optional(),
    }).optional(),
});
/**
 * Tenant limits by plan
 */
export const DEFAULT_TENANT_LIMITS = {
    starter: {
        max_users: 5,
        max_api_calls_per_month: 10000,
        max_storage_bytes: 1 * 1024 * 1024 * 1024, // 1GB
        rate_limit_per_minute: 60,
        max_agents: 3,
        max_workflows: 10,
        max_campaigns: 5,
        max_conversations_per_month: 1000,
        max_segments: 5,
        max_integrations: 3,
        max_knowledge_articles: 100,
    },
    professional: {
        max_users: 25,
        max_api_calls_per_month: 100000,
        max_storage_bytes: 10 * 1024 * 1024 * 1024, // 10GB
        rate_limit_per_minute: 300,
        max_agents: 15,
        max_workflows: 50,
        max_campaigns: 25,
        max_conversations_per_month: 10000,
        max_segments: 25,
        max_integrations: 15,
        max_knowledge_articles: 1000,
    },
    enterprise: {
        max_users: -1, // Unlimited
        max_api_calls_per_month: -1,
        max_storage_bytes: -1,
        rate_limit_per_minute: 1000,
        max_agents: -1,
        max_workflows: -1,
        max_campaigns: -1,
        max_conversations_per_month: -1,
        max_segments: -1,
        max_integrations: -1,
        max_knowledge_articles: -1,
    },
};
// ============================================
// FACTORY FUNCTIONS
// ============================================
/**
 * Create a new tenant
 */
export function createTenant(data) {
    const now = new Date().toISOString();
    const plan = data.plan || 'starter';
    return {
        id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        slug: data.slug,
        type: data.type,
        industry: data.industry,
        namespace: `tenant_${data.slug}`,
        plan,
        limits: DEFAULT_TENANT_LIMITS[plan],
        contact: {
            email: data.contact.email,
            phone: data.contact.phone,
            website: data.contact.website,
        },
        branding: {
            primary_color: '#3B82F6',
            secondary_color: '#60A5FA',
        },
        settings: {
            timezone: 'Asia/Kolkata',
            language: 'en',
            date_format: 'DD/MM/YYYY',
            time_format: '12h',
            currency: 'INR',
            currency_symbol: '₹',
            features: getDefaultFeatures(plan),
            communication: {
                default_channel: 'whatsapp',
            },
            security: {
                mfa_required: false,
                session_timeout_minutes: 30,
                password_policy: {
                    min_length: 8,
                    require_uppercase: true,
                    require_lowercase: true,
                    require_numbers: true,
                    require_special_chars: false,
                },
            },
        },
        billing: {
            billing_email: data.contact.email,
            billing_cycle: 'monthly',
            payment_status: 'active',
            invoice_prefix: `INV-${data.slug.toUpperCase()}-`,
        },
        status: 'trial',
        metadata: {},
        created_at: now,
        updated_at: now,
    };
}
/**
 * Get default features based on plan
 */
function getDefaultFeatures(plan) {
    const base = {
        // Core
        customers: true,
        conversations: true,
        agents: true,
        workflows: true,
        // Intelligence
        predictions: plan !== 'starter',
        recommendations: plan !== 'starter',
        segments: plan !== 'starter',
        // Communications
        whatsapp: true,
        email: true,
        sms: plan === 'enterprise',
        // Analytics
        analytics: true,
        exports: plan !== 'starter',
        // Advanced
        api_access: true,
        webhooks: plan !== 'starter',
        custom_integrations: plan === 'enterprise',
    };
    return base;
}
/**
 * Upgrade tenant plan
 */
export function upgradeTenantPlan(tenant, newPlan) {
    return {
        ...tenant,
        plan: newPlan,
        limits: DEFAULT_TENANT_LIMITS[newPlan],
        updated_at: new Date().toISOString(),
    };
}
/**
 * Suspend tenant
 */
export function suspendTenant(tenant) {
    return {
        ...tenant,
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}
/**
 * Reactivate suspended tenant
 */
export function reactivateTenant(tenant) {
    return {
        ...tenant,
        status: 'active',
        suspended_at: undefined,
        updated_at: new Date().toISOString(),
    };
}
/**
 * Mark tenant as churned
 */
export function churnTenant(tenant) {
    return {
        ...tenant,
        status: 'churned',
        churned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}
//# sourceMappingURL=tenant.js.map