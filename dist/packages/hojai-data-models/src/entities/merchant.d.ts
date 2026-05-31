/**
 * Hojai Data Models - Merchant Entity
 * Version: 1.0.0 | Date: May 30, 2026
 *
 * Merchant is the primary entity for B2B operations.
 * Links to Identity Platform for verification.
 * Maps to REZ Merchant services.
 */
import { z } from 'zod';
/**
 * Merchant type
 */
export type MerchantType = 'retailer' | 'wholesaler' | 'distributor' | 'franchise' | 'brand' | 'manufacturer';
/**
 * Merchant status
 */
export type MerchantStatus = 'active' | 'pending' | 'suspended' | 'blocked' | 'churned';
/**
 * Business category
 */
export type BusinessCategory = 'jewellery' | 'restaurant' | 'hotel' | 'salon' | 'fitness' | 'retail' | 'healthcare' | 'education' | 'ecommerce' | 'other';
/**
 * Geo point
 */
export interface GeoPoint {
    lat: number;
    lng: number;
}
/**
 * Operating hours
 */
export interface OperatingHours {
    day: number;
    open: string;
    close: string;
    is_closed: boolean;
}
/**
 * Merchant entity
 */
export interface Merchant {
    id: string;
    tenant_id: string;
    name: string;
    slug: string;
    type: MerchantType;
    business_category: BusinessCategory;
    logo_url?: string;
    banner_url?: string;
    description?: string;
    tagline?: string;
    phone: string;
    email: string;
    website?: string;
    social_links?: SocialLinks;
    addresses: MerchantAddress[];
    coordinates?: GeoPoint;
    primary_address_id?: string;
    gstin?: string;
    pan?: string;
    cin?: string;
    is_verified: boolean;
    verified_at?: string;
    verified_by?: string;
    categories: string[];
    tags: string[];
    specialties?: string[];
    total_revenue: number;
    total_orders: number;
    avg_order_value: number;
    total_customers: number;
    rating?: number;
    review_count: number;
    operating_hours: OperatingHours[];
    timezone: string;
    currency: string;
    language: string;
    plan?: 'basic' | 'standard' | 'premium' | 'enterprise';
    subscription_status: 'active' | 'trial' | 'expired' | 'cancelled';
    integrations: string[];
    api_key?: string;
    webhook_url?: string;
    status: MerchantStatus;
    created_at: string;
    updated_at: string;
    last_activity_at?: string;
    suspended_at?: string;
}
/**
 * Social links
 */
export interface SocialLinks {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
}
/**
 * Merchant address
 */
export interface MerchantAddress {
    id: string;
    type: 'billing' | 'shipping' | 'business' | 'warehouse';
    is_primary: boolean;
    address_line1: string;
    address_line2?: string;
    landmark?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    coordinates?: GeoPoint;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    is_active: boolean;
}
/**
 * Merchant summary (for lists)
 */
export interface MerchantSummary {
    id: string;
    tenant_id: string;
    name: string;
    type: MerchantType;
    business_category: BusinessCategory;
    city: string;
    status: MerchantStatus;
    total_revenue: number;
    total_orders: number;
    rating?: number;
}
/**
 * Merchant metrics
 */
export interface MerchantMetrics {
    merchant_id: string;
    tenant_id: string;
    total_revenue: number;
    revenue_growth_percent: number;
    avg_order_value: number;
    total_orders: number;
    orders_this_month: number;
    orders_growth_percent: number;
    total_customers: number;
    new_customers_this_month: number;
    returning_customer_rate: number;
    rating: number;
    review_count: number;
    response_rate: number;
    avg_response_time_minutes: number;
    last_order_date?: string;
    last_activity_date?: string;
    period_start: string;
    period_end: string;
}
/**
 * Merchant onboarding
 */
export interface MerchantOnboarding {
    merchant_id: string;
    steps: OnboardingStep[];
    completed_at?: string;
}
export interface OnboardingStep {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    completed_at?: string;
    data?: Record<string, any>;
}
export declare const MerchantCreateSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    type: z.ZodEnum<["retailer", "wholesaler", "distributor", "franchise", "brand", "manufacturer"]>;
    business_category: z.ZodEnum<["jewellery", "restaurant", "hotel", "salon", "fitness", "retail", "healthcare", "education", "ecommerce", "other"]>;
    phone: z.ZodString;
    email: z.ZodString;
    website: z.ZodOptional<z.ZodString>;
    gstin: z.ZodOptional<z.ZodString>;
    pan: z.ZodOptional<z.ZodString>;
    categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "franchise" | "retailer" | "wholesaler" | "distributor" | "brand" | "manufacturer";
    email: string;
    phone: string;
    tags: string[];
    slug: string;
    business_category: "retail" | "healthcare" | "jewellery" | "education" | "other" | "restaurant" | "salon" | "fitness" | "ecommerce" | "hotel";
    categories: string[];
    website?: string | undefined;
    gstin?: string | undefined;
    pan?: string | undefined;
}, {
    name: string;
    type: "franchise" | "retailer" | "wholesaler" | "distributor" | "brand" | "manufacturer";
    email: string;
    phone: string;
    slug: string;
    business_category: "retail" | "healthcare" | "jewellery" | "education" | "other" | "restaurant" | "salon" | "fitness" | "ecommerce" | "hotel";
    tags?: string[] | undefined;
    website?: string | undefined;
    gstin?: string | undefined;
    pan?: string | undefined;
    categories?: string[] | undefined;
}>;
export declare const MerchantUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    logo_url: z.ZodOptional<z.ZodString>;
    banner_url: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    tagline: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    social_links: z.ZodOptional<z.ZodObject<{
        instagram: z.ZodOptional<z.ZodString>;
        facebook: z.ZodOptional<z.ZodString>;
        twitter: z.ZodOptional<z.ZodString>;
        linkedin: z.ZodOptional<z.ZodString>;
        youtube: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        instagram?: string | undefined;
        facebook?: string | undefined;
        twitter?: string | undefined;
        linkedin?: string | undefined;
        youtube?: string | undefined;
    }, {
        instagram?: string | undefined;
        facebook?: string | undefined;
        twitter?: string | undefined;
        linkedin?: string | undefined;
        youtube?: string | undefined;
    }>>;
    operating_hours: z.ZodOptional<z.ZodArray<z.ZodObject<{
        day: z.ZodNumber;
        open: z.ZodString;
        close: z.ZodString;
        is_closed: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        close: string;
        open: string;
        day: number;
        is_closed: boolean;
    }, {
        close: string;
        open: string;
        day: number;
        is_closed: boolean;
    }>, "many">>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    specialties: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    status: z.ZodOptional<z.ZodEnum<["active", "pending", "suspended", "blocked", "churned"]>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    status?: "active" | "pending" | "suspended" | "churned" | "blocked" | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    tags?: string[] | undefined;
    logo_url?: string | undefined;
    website?: string | undefined;
    description?: string | undefined;
    categories?: string[] | undefined;
    banner_url?: string | undefined;
    tagline?: string | undefined;
    social_links?: {
        instagram?: string | undefined;
        facebook?: string | undefined;
        twitter?: string | undefined;
        linkedin?: string | undefined;
        youtube?: string | undefined;
    } | undefined;
    operating_hours?: {
        close: string;
        open: string;
        day: number;
        is_closed: boolean;
    }[] | undefined;
    specialties?: string[] | undefined;
}, {
    name?: string | undefined;
    status?: "active" | "pending" | "suspended" | "churned" | "blocked" | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    tags?: string[] | undefined;
    logo_url?: string | undefined;
    website?: string | undefined;
    description?: string | undefined;
    categories?: string[] | undefined;
    banner_url?: string | undefined;
    tagline?: string | undefined;
    social_links?: {
        instagram?: string | undefined;
        facebook?: string | undefined;
        twitter?: string | undefined;
        linkedin?: string | undefined;
        youtube?: string | undefined;
    } | undefined;
    operating_hours?: {
        close: string;
        open: string;
        day: number;
        is_closed: boolean;
    }[] | undefined;
    specialties?: string[] | undefined;
}>;
export declare const MerchantAddressSchema: z.ZodObject<{
    type: z.ZodEnum<["billing", "shipping", "business", "warehouse"]>;
    is_primary: z.ZodDefault<z.ZodBoolean>;
    address_line1: z.ZodString;
    address_line2: z.ZodOptional<z.ZodString>;
    landmark: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    postal_code: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    contact_name: z.ZodOptional<z.ZodString>;
    contact_phone: z.ZodOptional<z.ZodString>;
    contact_email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "business" | "warehouse" | "billing" | "shipping";
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_primary: boolean;
    address_line1: string;
    address_line2?: string | undefined;
    landmark?: string | undefined;
    contact_name?: string | undefined;
    contact_phone?: string | undefined;
    contact_email?: string | undefined;
}, {
    type: "business" | "warehouse" | "billing" | "shipping";
    city: string;
    state: string;
    postal_code: string;
    address_line1: string;
    country?: string | undefined;
    is_primary?: boolean | undefined;
    address_line2?: string | undefined;
    landmark?: string | undefined;
    contact_name?: string | undefined;
    contact_phone?: string | undefined;
    contact_email?: string | undefined;
}>;
export declare const DEFAULT_OPERATING_HOURS: OperatingHours[];
/**
 * Create merchant
 */
export declare function createMerchant(tenantId: string, data: z.infer<typeof MerchantCreateSchema>): Merchant;
/**
 * Add address to merchant
 */
export declare function addMerchantAddress(merchant: Merchant, addressData: z.infer<typeof MerchantAddressSchema>): Merchant;
/**
 * Update merchant metrics
 */
export declare function updateMerchantMetrics(merchant: Merchant, metrics: {
    total_revenue?: number;
    total_orders?: number;
    total_customers?: number;
    rating?: number;
}): Merchant;
/**
 * Verify merchant
 */
export declare function verifyMerchant(merchant: Merchant, verifiedBy: string): Merchant;
/**
 * Suspend merchant
 */
export declare function suspendMerchant(merchant: Merchant): Merchant;
/**
 * Reactivate merchant
 */
export declare function reactivateMerchant(merchant: Merchant): Merchant;
/**
 * Get merchant summary
 */
export declare function getMerchantSummary(merchant: Merchant): MerchantSummary;
/**
 * Calculate merchant health score
 */
export declare function calculateMerchantHealth(merchant: Merchant): {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    factors: {
        factor: string;
        impact: number;
        description: string;
    }[];
};
export type { Merchant, MerchantType, MerchantStatus, BusinessCategory, GeoPoint, OperatingHours, SocialLinks, MerchantAddress, MerchantSummary, MerchantMetrics, MerchantOnboarding, OnboardingStep, };
//# sourceMappingURL=merchant.d.ts.map