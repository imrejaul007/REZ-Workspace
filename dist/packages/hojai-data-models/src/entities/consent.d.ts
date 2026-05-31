/**
 * Hojai Data Models - Consent Entity
 * Version: 1.0.0 | Date: May 30, 2026
 * Priority: #2 - Critical for GDPR/PDPA compliance
 *
 * Consent is critical for regulated industries:
 * - Healthcare (HIPAA)
 * - Finance (DPDP Act)
 * - Employment
 * - Mobility
 */
import { z } from 'zod';
/**
 * Consent purposes - what data is being consented to
 */
export type ConsentPurpose = 'marketing_communication' | 'personalized_offers' | 'third_party_sharing' | 'data_processing' | 'analytics' | 'ai_processing' | 'whatsapp_communication' | 'email_communication' | 'sms_communication' | 'app_notification' | 'health_data_processing' | 'financial_data_processing' | 'location_tracking' | 'employment_verification';
/**
 * How consent was obtained
 */
export type ConsentSource = 'explicit' | 'implicit' | 'legal_basis' | 'contractual';
/**
 * Consent status
 */
export type ConsentStatus = 'granted' | 'denied' | 'withdrawn' | 'expired';
/**
 * Channel through which consent was obtained
 */
export type ConsentChannel = 'whatsapp' | 'email' | 'sms' | 'app' | 'web' | 'in_person' | 'api';
/**
 * Individual consent record
 */
export interface Consent {
    id: string;
    tenant_id: string;
    customer_id: string;
    purpose: ConsentPurpose;
    description?: string;
    status: ConsentStatus;
    valid_from?: string;
    expires_at?: string;
    source: ConsentSource;
    channel: ConsentChannel;
    consent_text?: string;
    consent_version?: string;
    verification?: ConsentVerification;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    updated_at: string;
    granted_at?: string;
    denied_at?: string;
    withdrawn_at?: string;
}
/**
 * Consent verification details
 */
export interface ConsentVerification {
    method: 'otp' | 'email_link' | 'sms_link' | 'biometric' | 'manual';
    verified: boolean;
    verified_at?: string;
    verified_by?: string;
}
/**
 * Consent preference for a customer
 */
export interface CustomerConsentPreference {
    customer_id: string;
    tenant_id: string;
    consents: ConsentSummary[];
    marketing_opt_out: boolean;
    all_communication_opt_out: boolean;
    last_updated: string;
    last_updated_by?: string;
}
/**
 * Summary of consent for a single purpose
 */
export interface ConsentSummary {
    purpose: ConsentPurpose;
    status: ConsentStatus;
    granted_at?: string;
    expires_at?: string;
}
/**
 * Consent request (for creating new consent)
 */
export interface ConsentRequest {
    customer_id: string;
    purpose: ConsentPurpose;
    description?: string;
    consent_text?: string;
    channel: ConsentChannel;
}
/**
 * Consent withdrawal request
 */
export interface ConsentWithdrawal {
    customer_id: string;
    purpose: ConsentPurpose;
    reason?: string;
}
/**
 * Group related consent purposes
 */
export interface ConsentCategory {
    id: string;
    name: string;
    purposes: ConsentPurpose[];
    is_required: boolean;
    description?: string;
}
/**
 * Predefined consent categories
 */
export declare const CONSENT_CATEGORIES: ConsentCategory[];
/**
 * Consent creation schema
 */
export declare const ConsentCreateSchema: z.ZodObject<{
    customer_id: z.ZodString;
    purpose: z.ZodEnum<["marketing_communication", "personalized_offers", "third_party_sharing", "data_processing", "analytics", "ai_processing", "whatsapp_communication", "email_communication", "sms_communication", "app_notification", "health_data_processing", "financial_data_processing", "location_tracking", "employment_verification"]>;
    description: z.ZodOptional<z.ZodString>;
    consent_text: z.ZodOptional<z.ZodString>;
    channel: z.ZodDefault<z.ZodEnum<["whatsapp", "email", "sms", "app", "web", "in_person", "api"]>>;
    valid_from: z.ZodOptional<z.ZodString>;
    expires_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    channel: "whatsapp" | "email" | "sms" | "api" | "app" | "web" | "in_person";
    customer_id: string;
    purpose: "analytics" | "marketing_communication" | "personalized_offers" | "third_party_sharing" | "data_processing" | "ai_processing" | "whatsapp_communication" | "email_communication" | "sms_communication" | "app_notification" | "health_data_processing" | "financial_data_processing" | "location_tracking" | "employment_verification";
    description?: string | undefined;
    consent_text?: string | undefined;
    valid_from?: string | undefined;
    expires_at?: string | undefined;
}, {
    customer_id: string;
    purpose: "analytics" | "marketing_communication" | "personalized_offers" | "third_party_sharing" | "data_processing" | "ai_processing" | "whatsapp_communication" | "email_communication" | "sms_communication" | "app_notification" | "health_data_processing" | "financial_data_processing" | "location_tracking" | "employment_verification";
    description?: string | undefined;
    channel?: "whatsapp" | "email" | "sms" | "api" | "app" | "web" | "in_person" | undefined;
    consent_text?: string | undefined;
    valid_from?: string | undefined;
    expires_at?: string | undefined;
}>;
/**
 * Consent update schema
 */
export declare const ConsentUpdateSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["granted", "denied", "withdrawn", "expired"]>>;
    expires_at: z.ZodOptional<z.ZodString>;
    consent_text: z.ZodOptional<z.ZodString>;
    consent_version: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "granted" | "denied" | "withdrawn" | "expired" | undefined;
    consent_text?: string | undefined;
    expires_at?: string | undefined;
    consent_version?: string | undefined;
}, {
    status?: "granted" | "denied" | "withdrawn" | "expired" | undefined;
    consent_text?: string | undefined;
    expires_at?: string | undefined;
    consent_version?: string | undefined;
}>;
/**
 * Consent withdrawal schema
 */
export declare const ConsentWithdrawalSchema: z.ZodObject<{
    customer_id: z.ZodString;
    purpose: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customer_id: string;
    purpose: string;
    reason?: string | undefined;
}, {
    customer_id: string;
    purpose: string;
    reason?: string | undefined;
}>;
/**
 * Human-readable labels for consent purposes
 */
export declare const CONSENT_PURPOSE_LABELS: Record<ConsentPurpose, string>;
/**
 * Privacy policy text for each purpose
 */
export declare const CONSENT_TEXT_TEMPLATES: Record<ConsentPurpose, string>;
/**
 * Grant consent
 */
export declare function grantConsent(tenantId: string, data: z.infer<typeof ConsentCreateSchema>): Consent;
/**
 * Deny consent
 */
export declare function denyConsent(tenantId: string, data: z.infer<typeof ConsentCreateSchema>): Consent;
/**
 * Withdraw consent
 */
export declare function withdrawConsent(consent: Consent, reason?: string): Consent;
/**
 * Check if consent is valid
 */
export declare function isConsentValid(consent: Consent): boolean;
/**
 * Get consent status for a customer
 */
export declare function getCustomerConsentPreference(customerId: string, tenantId: string, consents: Consent[]): CustomerConsentPreference;
export type { Consent, ConsentVerification, CustomerConsentPreference, ConsentSummary, ConsentRequest, ConsentWithdrawal, ConsentCategory, };
export { CONSENT_CATEGORIES, CONSENT_PURPOSE_LABELS, CONSENT_TEXT_TEMPLATES, ConsentCreateSchema, ConsentUpdateSchema, ConsentWithdrawalSchema, grantConsent, denyConsent, withdrawConsent, isConsentValid, getCustomerConsentPreference, };
//# sourceMappingURL=consent.d.ts.map