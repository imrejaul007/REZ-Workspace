/**
 * Insight Routes
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { insightStore } from '../index.js';
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
function createErrorResponse(code, message) {
    return {
        success: false,
        error: { code, message },
        meta: { timestamp: new Date().toISOString(), requestId: `req_${Date.now()}` }
    };
}
/**
 * POST /insights
 * Create an insight
 */
router.post('/', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, type, title, description, severity, recommendation, data } = req.body;
    if (!type || !title) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'type and title required'));
    }
    const insight = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        userId,
        type,
        title,
        description,
        severity: severity || 'medium',
        recommendation,
        data,
        createdAt: new Date().toISOString()
    };
    const insights = insightStore.get(ctx.tenant_id) || [];
    insights.push(insight);
    insightStore.set(ctx.tenant_id, insights);
    res.status(201).json(createResponse({ insight }, ctx.tenant_id));
});
/**
 * GET /insights
 * Get insights
 */
router.get('/', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, type, severity, limit = 50 } = req.query;
    let insights = insightStore.get(ctx.tenant_id) || [];
    if (userId) {
        insights = insights.filter(i => i.userId === userId);
    }
    if (type) {
        insights = insights.filter(i => i.type === type);
    }
    if (severity) {
        insights = insights.filter(i => i.severity === severity);
    }
    // Sort by severity (critical first) then by date
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    insights.sort((a, b) => {
        const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (sevDiff !== 0)
            return sevDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    res.json(createResponse({
        insights: insights.slice(0, Number(limit)),
        total: insights.length
    }, ctx.tenant_id));
});
/**
 * GET /insights/:id
 * Get insight by ID
 */
router.get('/:id', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const insights = insightStore.get(ctx.tenant_id) || [];
    const insight = insights.find(i => i.id === id);
    if (!insight) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Insight ${id} not found`));
    }
    res.json(createResponse({ insight }, ctx.tenant_id));
});
/**
 * DELETE /insights/:id
 * Delete insight
 */
router.delete('/:id', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const insights = insightStore.get(ctx.tenant_id) || [];
    const index = insights.findIndex(i => i.id === id);
    if (index === -1) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Insight ${id} not found`));
    }
    insights.splice(index, 1);
    insightStore.set(ctx.tenant_id, insights);
    res.json(createResponse({ deleted: true }));
});
/**
 * POST /insights/generate/segment
 * Generate segment insights
 */
router.post('/generate/segment', (req, res) => {
    const ctx = req.tenantContext;
    const { segmentName, segmentData } = req.body;
    if (!segmentName) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'segmentName required'));
    }
    // Generate sample segment insights
    const insights = [
        {
            id: uuidv4(),
            tenantId: ctx.tenant_id,
            type: 'segment',
            title: `High-Value ${segmentName}`,
            description: `${segmentName} segment shows 40% higher engagement than average`,
            severity: 'low',
            recommendation: 'Consider exclusive offers for this segment',
            data: { segmentName, metrics: { engagement: 1.4, retention: 1.2 } },
            createdAt: new Date().toISOString()
        },
        {
            id: uuidv4(),
            tenantId: ctx.tenant_id,
            type: 'opportunity',
            title: `${segmentName} Growth Potential`,
            description: `This segment has 25% untapped purchase potential`,
            severity: 'medium',
            recommendation: 'Launch targeted campaigns to convert this potential',
            data: { segmentName, potential: 0.25 },
            createdAt: new Date().toISOString()
        }
    ];
    const tenantInsights = insightStore.get(ctx.tenant_id) || [];
    tenantInsights.push(...insights);
    insightStore.set(ctx.tenant_id, tenantInsights);
    res.status(201).json(createResponse({ insights }, ctx.tenant_id));
});
/**
 * POST /insights/generate/trend
 * Generate trend insights
 */
router.post('/generate/trend', (req, res) => {
    const ctx = req.tenantContext;
    const { trendData } = req.body;
    const insight = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        type: 'trend',
        title: 'Emerging Trend Detected',
        description: 'Purchase patterns indicate a shift toward premium products',
        severity: 'medium',
        recommendation: 'Consider expanding premium product inventory',
        data: { trendData },
        createdAt: new Date().toISOString()
    };
    const insights = insightStore.get(ctx.tenant_id) || [];
    insights.push(insight);
    insightStore.set(ctx.tenant_id, insights);
    res.status(201).json(createResponse({ insight }, ctx.tenant_id));
});
/**
 * POST /insights/generate/anomaly
 * Generate anomaly insights
 */
router.post('/generate/anomaly', (req, res) => {
    const ctx = req.tenantContext;
    const { anomalyData } = req.body;
    const insight = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        type: 'anomaly',
        title: 'Unusual Activity Detected',
        description: 'Spike in cart abandonment rate (+35%) observed in the last 24 hours',
        severity: 'high',
        recommendation: 'Review checkout flow for potential friction points',
        data: { anomalyData, spike: 0.35 },
        createdAt: new Date().toISOString()
    };
    const insights = insightStore.get(ctx.tenant_id) || [];
    insights.push(insight);
    insightStore.set(ctx.tenant_id, insights);
    res.status(201).json(createResponse({ insight }, ctx.tenant_id));
});
/**
 * GET /insights/types
 * Get available insight types
 */
router.get('/meta/types', (req, res) => {
    const types = [
        { type: 'segment', name: 'Segment', description: 'Segment-based insights' },
        { type: 'trend', name: 'Trend', description: 'Trending patterns' },
        { type: 'anomaly', name: 'Anomaly', description: 'Unusual patterns detected' },
        { type: 'opportunity', name: 'Opportunity', description: 'Business opportunities' },
        { type: 'risk', name: 'Risk', description: 'Potential risks identified' }
    ];
    res.json(createResponse({ types }));
});
/**
 * GET /insights/severity
 * Get severity levels
 */
router.get('/meta/severity', (req, res) => {
    const severity = [
        { level: 'critical', name: 'Critical', description: 'Requires immediate action' },
        { level: 'high', name: 'High', description: 'Important, address soon' },
        { level: 'medium', name: 'Medium', description: 'Should be addressed' },
        { level: 'low', name: 'Low', description: 'Informational only' }
    ];
    res.json(createResponse({ severity }));
});
export { router as insightRoutes };
//# sourceMappingURL=insights.js.map