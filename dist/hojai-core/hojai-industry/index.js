/**
 * Hojai Industry Intelligence Platform
 * Version: 1.0 | Date: May 30, 2026
 *
 * Privacy-preserving cross-tenant learning
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
export class IndustryIntelligence {
    patterns = new Map();
    async contribute(tenant_id, industry, data) {
        const key = `${industry}_${data.pattern_type}`;
        const existing = this.patterns.get(key) || [];
        existing.push({ ...data, tenant_id, tenant_count: existing.length + 1 });
        this.patterns.set(key, existing);
        return { accepted: true };
    }
    async getPatterns(industry) {
        return this.patterns.get(industry) || [];
    }
}
// ============================================
// EXPRESS ROUTES
// ============================================
function createResponse(data, meta) {
    return {
        success: true,
        data,
        ...meta,
        timestamp: new Date().toISOString()
    };
}
function createErrorResponse(code, message) {
    return {
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    };
}
function tenantMiddleware() {
    return async (req, res, next) => {
        // Extract tenant from header or body
        const tenantId = req.headers['x-tenant-id'] || req.body?.tenant_id;
        if (!tenantId) {
            return res.status(400).json(createErrorResponse('MISSING_TENANT', 'Tenant ID is required'));
        }
        // Attach tenant context
        req.tenantContext = { tenant_id: tenantId };
        next();
    };
}
export function createIndustryRoutes(platform) {
    const router = express.Router();
    // Contribute pattern
    router.post('/patterns', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const { industry, pattern_type, values } = req.body;
            if (!industry || !pattern_type || !values) {
                return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'industry, pattern_type, and values are required'));
            }
            const data = { pattern_type, ...values };
            const result = await platform.contribute(tenantId, industry, data);
            res.json(createResponse(result, { tenantId }));
        }
        catch (error) {
            res.status(500).json(createErrorResponse('CONTRIBUTE_ERROR', error.message));
        }
    });
    // Get patterns
    router.get('/patterns/:industry', async (req, res) => {
        try {
            const { industry } = req.params;
            const patterns = await platform.getPatterns(industry);
            res.json(createResponse(patterns));
        }
        catch (error) {
            res.status(500).json(createErrorResponse('GET_ERROR', error.message));
        }
    });
    return router;
}
// ============================================
// BOOTSTRAP
// ============================================
export async function bootstrap(port = 4620) {
    const platform = new IndustryIntelligence();
    const app = express();
    // Security middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);
    // Health check
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            service: 'hojai-industry',
            version: '1.0.0',
            timestamp: new Date().toISOString()
        });
    });
    // Routes
    app.use('/api/industry', createIndustryRoutes(platform));
    app.listen(port, () => {
        console.log(`Hojai Industry Intelligence started on port ${port}`);
    });
    return { platform, app };
}
export default { IndustryIntelligence, createIndustryRoutes, bootstrap };
//# sourceMappingURL=index.js.map