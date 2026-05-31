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
import express from 'express';
import { tenantMiddleware } from '../shared/middleware/tenant';
import { createLogger } from '../shared/utils/logger';
import { createResponse, createErrorResponse } from '../shared/types';
const logger = createLogger('hojai-identity');
// ============================================
// IDENTITY RESOLUTION SERVICE
// ============================================
/**
 * Identity Resolution Engine
 */
class IdentityResolutionEngine {
    identities = new Map();
    identityByIdentifier = new Map(); // identifier → identity_id
    /**
     * Resolve identifiers to unified identity
     */
    async resolve(tenantId, identifiers) {
        // Check if any identifier already maps to an identity
        for (const idf of identifiers) {
            const key = `${tenantId}:${idf.type}:${idf.value}`;
            const existingId = this.identityByIdentifier.get(key);
            if (existingId) {
                const identity = this.identities.get(existingId);
                if (identity) {
                    // Update last_seen for all identifiers
                    this.updateIdentifierLastSeen(identity, identifiers);
                    return {
                        identity,
                        isNew: false,
                        resolutionMethod: 'deterministic'
                    };
                }
            }
        }
        // Create new identity
        const identity = this.createIdentity(tenantId, identifiers);
        this.identities.set(identity.id, identity);
        // Index identifiers
        for (const idf of identifiers) {
            const key = `${tenantId}:${idf.type}:${idf.value}`;
            this.identityByIdentifier.set(key, identity.id);
        }
        logger.info('identity_resolved_new', {
            tenantId,
            identityId: identity.id,
            identifierCount: identifiers.length
        });
        return {
            identity,
            isNew: true,
            resolutionMethod: 'deterministic'
        };
    }
    /**
     * Get identity by ID
     */
    async getIdentity(tenantId, identityId) {
        const identity = this.identities.get(identityId);
        if (!identity || identity.tenant_id !== tenantId)
            return null;
        return identity;
    }
    /**
     * Get identity by identifier
     */
    async getIdentityByIdentifier(tenantId, type, value) {
        const key = `${tenantId}:${type}:${value}`;
        const identityId = this.identityByIdentifier.get(key);
        if (!identityId)
            return null;
        return this.getIdentity(tenantId, identityId);
    }
    /**
     * Link two identities
     */
    async linkIdentities(tenantId, identityAId, identityBId, linkType, confidence = 1.0) {
        const identityA = this.identities.get(identityAId);
        const identityB = this.identities.get(identityBId);
        if (!identityA || !identityB) {
            throw new Error('Identity not found');
        }
        // Merge identifiers from B into A
        const mergedIdentifiers = [...identityA.identifiers, ...identityB.identifiers];
        // Update identity A
        const updatedA = {
            ...identityA,
            identifiers: mergedIdentifiers,
            link_count: identityA.link_count + 1,
            confidence_score: Math.min(1, identityA.confidence_score + 0.1),
            updated_at: new Date().toISOString()
        };
        this.identities.set(identityAId, updatedA);
        // Mark identity B as merged
        const updatedB = {
            ...identityB,
            status: 'merged',
            merged_into: identityAId,
            updated_at: new Date().toISOString()
        };
        this.identities.set(identityBId, updatedB);
        // Update identifier index for B's identifiers
        for (const idf of identityB.identifiers) {
            const key = `${tenantId}:${idf.type}:${idf.value}`;
            this.identityByIdentifier.set(key, identityAId);
        }
        // Return link record
        const link = {
            id: `link_${Date.now()}`,
            tenant_id: tenantId,
            identity_a_id: identityAId,
            identity_b_id: identityBId,
            link_type: linkType,
            confidence,
            created_at: new Date().toISOString()
        };
        logger.info('identities_linked', {
            tenantId,
            identityAId,
            identityBId,
            linkType
        });
        return link;
    }
    /**
     * Get cross-channel identity
     */
    async getCrossChannelIdentity(tenantId, identityId) {
        const identity = await this.getIdentity(tenantId, identityId);
        if (!identity)
            return [];
        return identity.identifiers
            .filter(idf => idf.channel)
            .map(idf => ({
            channel: idf.channel,
            channelIdentity: idf.value
        }));
    }
    /**
     * Create new identity
     */
    createIdentity(tenantId, identifiers) {
        const now = new Date().toISOString();
        return {
            id: `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tenant_id: tenantId,
            primary_customer_id: identifiers[0]?.value || '',
            identifiers: identifiers.map(idf => ({
                type: idf.type,
                value: idf.value,
                channel: idf.channel,
                verified: false,
                first_seen_at: now,
                last_seen_at: now
            })),
            link_count: 0,
            confidence_score: identifiers.length > 1 ? 0.9 : 0.5,
            resolution_method: 'deterministic',
            status: 'active',
            created_at: now,
            updated_at: now
        };
    }
    /**
     * Update identifier last seen
     */
    updateIdentifierLastSeen(identity, newIdentifiers) {
        const now = new Date().toISOString();
        for (const existingIdf of identity.identifiers) {
            for (const newIdf of newIdentifiers) {
                if (existingIdf.type === newIdf.type &&
                    existingIdf.value === newIdf.value) {
                    existingIdf.last_seen_at = now;
                }
            }
        }
    }
}
// ============================================
// CONSENT MAPPING SERVICE
// ============================================
/**
 * Consent Mapping Engine
 */
class ConsentMappingEngine {
    consentMappings = new Map();
    /**
     * Map consent to channel for identity
     */
    async mapConsent(tenantId, identityId, channel, consentStatus) {
        const key = `${tenantId}:${identityId}:${channel}`;
        const now = new Date().toISOString();
        const mapping = {
            id: `cmap_${Date.now()}`,
            tenant_id: tenantId,
            identity_id: identityId,
            channel,
            consent_status: consentStatus,
            last_updated: now
        };
        this.consentMappings.set(key, mapping);
        logger.info('consent_mapped', { tenantId, identityId, channel });
        return mapping;
    }
    /**
     * Get consent for identity on channel
     */
    async getConsent(tenantId, identityId, channel) {
        const key = `${tenantId}:${identityId}:${channel}`;
        return this.consentMappings.get(key) || null;
    }
    /**
     * Get all consents for identity
     */
    async getAllConsents(tenantId, identityId) {
        const results = [];
        for (const mapping of this.consentMappings.values()) {
            if (mapping.tenant_id === tenantId && mapping.identity_id === identityId) {
                results.push(mapping);
            }
        }
        return results;
    }
    /**
     * Check if consent is granted for all channels
     */
    async isConsentGranted(tenantId, identityId, consentType) {
        const consents = await this.getAllConsents(tenantId, identityId);
        // If no consent mappings, assume not granted
        if (consents.length === 0)
            return false;
        // Check if granted on at least one active channel
        for (const consent of consents) {
            if (consent.consent_status[consentType] === true) {
                return true;
            }
        }
        return false;
    }
}
// ============================================
// MAIN PLATFORM
// ============================================
export class HojaiIdentityPlatform {
    resolutionEngine;
    consentEngine;
    constructor() {
        this.resolutionEngine = new IdentityResolutionEngine();
        this.consentEngine = new ConsentMappingEngine();
    }
    // ========== IDENTITY RESOLUTION ==========
    async resolve(tenantId, identifiers) {
        return this.resolutionEngine.resolve(tenantId, identifiers);
    }
    async getIdentity(tenantId, identityId) {
        return this.resolutionEngine.getIdentity(tenantId, identityId);
    }
    async getIdentityByIdentifier(tenantId, type, value) {
        return this.resolutionEngine.getIdentityByIdentifier(tenantId, type, value);
    }
    async linkIdentities(tenantId, identityAId, identityBId, linkType, confidence) {
        return this.resolutionEngine.linkIdentities(tenantId, identityAId, identityBId, linkType, confidence);
    }
    async getCrossChannelIdentity(tenantId, identityId) {
        return this.resolutionEngine.getCrossChannelIdentity(tenantId, identityId);
    }
    // ========== CONSENT MAPPING ==========
    async mapConsent(tenantId, identityId, channel, consentStatus) {
        return this.consentEngine.mapConsent(tenantId, identityId, channel, consentStatus);
    }
    async getConsent(tenantId, identityId, channel) {
        return this.consentEngine.getConsent(tenantId, identityId, channel);
    }
    async getAllConsents(tenantId, identityId) {
        return this.consentEngine.getAllConsents(tenantId, identityId);
    }
    async isConsentGranted(tenantId, identityId, consentType) {
        return this.consentEngine.isConsentGranted(tenantId, identityId, consentType);
    }
}
// ============================================
// EXPRESS ROUTES
// ============================================
export function createIdentityRoutes(platform) {
    const router = express.Router();
    // ========== IDENTITY RESOLUTION ==========
    /**
     * POST /api/identity/resolve
     * Resolve identifiers to unified identity
     */
    router.post('/resolve', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const { identifiers } = req.body;
            if (!identifiers || !Array.isArray(identifiers) || identifiers.length === 0) {
                return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'identifiers array is required'));
            }
            const result = await platform.resolve(tenantId, identifiers);
            res.json(createResponse(result, { tenantId }));
        }
        catch (error) {
            logger.error('resolve_error', { error });
            res.status(500).json(createErrorResponse('RESOLVE_ERROR', error.message));
        }
    });
    /**
     * GET /api/identity/:id
     * Get identity by ID
     */
    router.get('/:id', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const identity = await platform.getIdentity(tenantId, req.params.id);
            if (!identity) {
                return res.status(404).json(createErrorResponse('NOT_FOUND', 'Identity not found'));
            }
            res.json(createResponse(identity, { tenantId }));
        }
        catch (error) {
            logger.error('get_identity_error', { error });
            res.status(500).json(createErrorResponse('GET_ERROR', error.message));
        }
    });
    /**
     * GET /api/identity/by-identifier/:type/:value
     * Get identity by identifier
     */
    router.get('/by-identifier/:type/:value', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const { type, value } = req.params;
            const identity = await platform.getIdentityByIdentifier(tenantId, type, decodeURIComponent(value));
            if (!identity) {
                return res.status(404).json(createErrorResponse('NOT_FOUND', 'Identity not found'));
            }
            res.json(createResponse(identity, { tenantId }));
        }
        catch (error) {
            logger.error('get_by_identifier_error', { error });
            res.status(500).json(createErrorResponse('GET_ERROR', error.message));
        }
    });
    /**
     * POST /api/identity/link
     * Link two identities
     */
    router.post('/link', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const { identityAId, identityBId, linkType, confidence } = req.body;
            if (!identityAId || !identityBId || !linkType) {
                return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'identityAId, identityBId, and linkType are required'));
            }
            const link = await platform.linkIdentities(tenantId, identityAId, identityBId, linkType, confidence);
            res.json(createResponse(link, { tenantId }));
        }
        catch (error) {
            logger.error('link_error', { error });
            res.status(400).json(createErrorResponse('LINK_ERROR', error.message));
        }
    });
    /**
     * GET /api/identity/:id/channels
     * Get cross-channel identity
     */
    router.get('/:id/channels', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const channels = await platform.getCrossChannelIdentity(tenantId, req.params.id);
            res.json(createResponse(channels, { tenantId }));
        }
        catch (error) {
            logger.error('get_channels_error', { error });
            res.status(500).json(createErrorResponse('GET_ERROR', error.message));
        }
    });
    // ========== CONSENT MAPPING ==========
    /**
     * POST /api/identity/consent
     * Map consent to channel
     */
    router.post('/consent', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const { identityId, channel, consentStatus } = req.body;
            if (!identityId || !channel || !consentStatus) {
                return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'identityId, channel, and consentStatus are required'));
            }
            const mapping = await platform.mapConsent(tenantId, identityId, channel, consentStatus);
            res.json(createResponse(mapping, { tenantId }));
        }
        catch (error) {
            logger.error('map_consent_error', { error });
            res.status(500).json(createErrorResponse('CONSENT_ERROR', error.message));
        }
    });
    /**
     * GET /api/identity/consent/:identityId
     * Get all consents for identity
     */
    router.get('/consent/:identityId', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const consents = await platform.getAllConsents(tenantId, req.params.identityId);
            res.json(createResponse(consents, { tenantId }));
        }
        catch (error) {
            logger.error('get_consents_error', { error });
            res.status(500).json(createErrorResponse('GET_ERROR', error.message));
        }
    });
    /**
     * POST /api/identity/consent/check
     * Check if consent is granted
     */
    router.post('/consent/check', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const { identityId, consentType } = req.body;
            if (!identityId || !consentType) {
                return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'identityId and consentType are required'));
            }
            const granted = await platform.isConsentGranted(tenantId, identityId, consentType);
            res.json(createResponse({ granted }, { tenantId }));
        }
        catch (error) {
            logger.error('check_consent_error', { error });
            res.status(500).json(createErrorResponse('CHECK_ERROR', error.message));
        }
    });
    return router;
}
// ============================================
// BOOTSTRAP
// ============================================
export async function bootstrap(port = 4600) {
    const platform = new HojaiIdentityPlatform();
    const app = express();
    app.use(express.json());
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            service: 'hojai-identity',
            version: '1.0.0',
            timestamp: new Date().toISOString()
        });
    });
    app.use('/api/identity', createIdentityRoutes(platform));
    app.listen(port, () => {
        logger.info('hojai_identity_platform_started', { port });
    });
    return { platform, app };
}
export default { HojaiIdentityPlatform, createIdentityRoutes, bootstrap };
//# sourceMappingURL=index.js.map