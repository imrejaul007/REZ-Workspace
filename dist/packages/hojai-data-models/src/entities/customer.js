/**
 * Hojai Data Models - Customer Entity
 * Version: 1.0.0 | Date: May 30, 2026
 *
 * Customer is the primary entity for all B2C operations.
 * Links to Identity Platform for cross-channel resolution.
 */
import { z } from 'zod';
// ============================================
// ZOD SCHEMAS
// ============================================
export const CustomerCreateSchema = z.object({
    type: z.enum(['individual', 'business']),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    birthday: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    business_name: z.string().optional(),
    business_type: z.string().optional(),
    preferences: z.object({
        language: z.string().default('en'),
        notification_channel: z.enum(['whatsapp', 'sms', 'email', 'app']).default('whatsapp'),
        communication_tone: z.enum(['formal', 'friendly', 'casual']).default('friendly'),
        timezone: z.string().default('Asia/Kolkata'),
        currency: z.string().default('INR'),
    }).optional(),
});
export const CustomerUpdateSchema = z.object({
    name: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    avatar_url: z.string().url().optional(),
    birthday: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    preferences: z.object({
        language: z.string().optional(),
        notification_channel: z.enum(['whatsapp', 'sms', 'email', 'app']).optional(),
        communication_tone: z.enum(['formal', 'friendly', 'casual']).optional(),
        timezone: z.string().optional(),
        currency: z.string().optional(),
    }).optional(),
    tags: z.array(z.string()).optional(),
});
// ============================================
// FACTORY FUNCTIONS
// ============================================
export function createCustomer(tenantId, data) {
    const now = new Date().toISOString();
    return {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        type: data.type,
        phone: data.phone,
        email: data.email,
        device_ids: [],
        external_ids: {},
        name: data.name,
        first_name: data.first_name,
        last_name: data.last_name,
        birthday: data.birthday,
        gender: data.gender,
        business_name: data.business_name,
        business_type: data.business_type,
        lifetime_value: 0,
        order_count: 0,
        avg_order_value: 0,
        churn_risk: 'low',
        engagement_score: 50,
        segments: [],
        tags: [],
        preferences: {
            language: data.preferences?.language || 'en',
            notification_channel: data.preferences?.notification_channel || 'whatsapp',
            communication_tone: data.preferences?.communication_tone || 'friendly',
            timezone: data.preferences?.timezone || 'Asia/Kolkata',
            currency: data.preferences?.currency || 'INR',
        },
        consent_status: {
            marketing: false,
            communication: true,
            third_party: false,
            data_processing: true,
        },
        status: 'active',
        created_at: now,
        updated_at: now,
        first_interaction_at: now,
        last_interaction_at: now,
    };
}
export function updateCustomerMetrics(customer, metrics) {
    const avgOrderValue = metrics.order_count && metrics.lifetime_value
        ? metrics.lifetime_value / metrics.order_count
        : customer.avg_order_value;
    return {
        ...customer,
        lifetime_value: metrics.lifetime_value ?? customer.lifetime_value,
        order_count: metrics.order_count ?? customer.order_count,
        avg_order_value: avgOrderValue,
        last_order_date: metrics.last_order_date ?? customer.last_order_date,
        updated_at: new Date().toISOString(),
    };
}
export function updateCustomerRisk(customer, risk, engagement_score) {
    return {
        ...customer,
        churn_risk: risk,
        engagement_score,
        updated_at: new Date().toISOString(),
    };
}
//# sourceMappingURL=customer.js.map