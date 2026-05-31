/**
 * Registry Routes
 */
import { Router } from 'express';
import { AGENT_TEMPLATES } from '../index.js';
const router = Router();
// ============================================
// HELPERS
// ============================================
function createResponse(data, tenantId) {
    return {
        success: true,
        data,
        meta: { timestamp: new Date().toISOString(), requestId: `req_${Date.now()}`, tenantId }
    };
}
/**
 * GET /registry
 * List available agent templates
 */
router.get('/', (req, res) => {
    const ctx = req.tenantContext;
    const { category, type } = req.query;
    let templates = AGENT_TEMPLATES;
    if (category) {
        templates = templates.filter(t => t.category === category);
    }
    if (type) {
        templates = templates.filter(t => t.type === type);
    }
    res.json(createResponse({ templates }, ctx.tenant_id));
});
/**
 * GET /registry/:id
 * Get template by ID
 */
router.get('/:id', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const template = AGENT_TEMPLATES.find(t => t.id === id);
    if (!template) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: `Template ${id} not found` }
        });
    }
    res.json(createResponse({ template }, ctx.tenant_id));
});
/**
 * GET /registry/categories
 * Get agent categories
 */
router.get('/meta/categories', (req, res) => {
    const ctx = req.tenantContext;
    const categories = [...new Set(AGENT_TEMPLATES.map(t => t.category))];
    res.json(createResponse({ categories }, ctx.tenant_id));
});
/**
 * GET /registry/:id/capabilities
 * Get template capabilities
 */
router.get('/:id/capabilities', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const template = AGENT_TEMPLATES.find(t => t.id === id);
    if (!template) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: `Template ${id} not found` }
        });
    }
    res.json(createResponse({
        capabilities: template.capabilities,
        agentType: template.type,
        agentName: template.name
    }, ctx.tenant_id));
});
export { router as registryRoutes };
//# sourceMappingURL=registry.js.map