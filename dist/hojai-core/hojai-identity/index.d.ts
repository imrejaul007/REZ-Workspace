/**
 * Hojai Identity Platform
 *
 * PORT: 4600
 *
 * Purpose:
 * - Identity Resolution (link identifiers to unified identity)
 * - Identity Linking (connect identities across channels)
 * - Cross-Channel Matching (map channel-specific IDs)
 * - Consent Mapping (track consent per channel)
 *
 * This platform does NOT own:
 * - Commerce Graph (belongs to REZ Intelligence)
 * - Mobility Graph (belongs to REZ Intelligence)
 * - Trust Graph (belongs to REZ Intelligence)
 */
/**
 * Identity identifier types
 */
export type IdentifierType = 'phone' | 'email' | 'device_id' | 'device_fingerprint' | 'cookie_id' | 'account_id' | 'external_id';
/**
 * Channel types
 */
export type Channel = 'whatsapp' | 'instagram' | 'facebook' | 'webchat' | 'pos' | 'app' | 'website' | 'api';
/**
 * Identity identifier
 */
export interface Identifier {
    type: IdentifierType;
    value: string;
    channel?: Channel;
    verified: boolean;
    verified_at?: string;
    first_seen_at: string;
    last_seen_at: string;
}
/**
 * Unified identity
 */
export interface UnifiedIdentity {
    id: string;
    tenant_id: string;
    primary_customer_id: string;
    identifiers: Identifier[];
    link_count: number;
    confidence_score: number;
    resolution_method: 'deterministic' | 'probabilistic' | 'manual';
    status: 'active' | 'flagged' | 'merged';
    merged_into?: string;
    created_at: string;
    updated_at: string;
}
/**
 * Identity link
 */
export interface IdentityLink {
    id: string;
    tenant_id: string;
    identity_a_id: string;
    identity_b_id: string;
    link_type: 'same_person' | 'same_household' | 'same_device' | 'manual';
    confidence: number;
    created_at: string;
    created_by?: string;
}
/**
 * Channel mapping
 */
export interface ChannelMapping {
    id: string;
    tenant_id: string;
    identity_id: string;
    channel: Channel;
    channel_identity: string;
    created_at: string;
}
/**
 * Consent mapping
 */
export interface ConsentMapping {
    id: string;
    tenant_id: string;
    identity_id: string;
    channel: Channel;
    consent_status: Record<string, boolean>;
    last_updated: string;
}
export declare class HojaiIdentityPlatform {
    private resolutionEngine;
    private consentEngine;
    constructor();
    resolve(tenantId: string, identifiers: {
        type: IdentifierType;
        value: string;
    }[]): Promise<{
        identity?: UnifiedIdentity;
        isNew: boolean;
        resolutionMethod: "deterministic" | "probabilistic" | "none";
    }>;
    getIdentity(tenantId: string, identityId: string): Promise<UnifiedIdentity | null>;
    getIdentityByIdentifier(tenantId: string, type: IdentifierType, value: string): Promise<UnifiedIdentity | null>;
    linkIdentities(tenantId: string, identityAId: string, identityBId: string, linkType: IdentityLink['link_type'], confidence?: number): Promise<IdentityLink>;
    getCrossChannelIdentity(tenantId: string, identityId: string): Promise<{
        channel: Channel;
        channelIdentity: string;
    }[]>;
    mapConsent(tenantId: string, identityId: string, channel: Channel, consentStatus: Record<string, boolean>): Promise<ConsentMapping>;
    getConsent(tenantId: string, identityId: string, channel: Channel): Promise<ConsentMapping | null>;
    getAllConsents(tenantId: string, identityId: string): Promise<ConsentMapping[]>;
    isConsentGranted(tenantId: string, identityId: string, consentType: string): Promise<boolean>;
}
export declare function createIdentityRoutes(platform: HojaiIdentityPlatform): import("express-serve-static-core").Router;
export declare function bootstrap(port?: number): Promise<{
    platform: HojaiIdentityPlatform;
    app: import("express-serve-static-core").Express;
}>;
declare const _default: {
    HojaiIdentityPlatform: typeof HojaiIdentityPlatform;
    createIdentityRoutes: typeof createIdentityRoutes;
    bootstrap: typeof bootstrap;
};
export default _default;
//# sourceMappingURL=index.d.ts.map