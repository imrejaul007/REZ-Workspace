/**
 * Hojai Intelligence Service
 * Version: 1.0 | Port: 4530
 * ML predictions, recommendations, and insights
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { predictionRoutes } from './routes/predictions.js';
import { recommendationRoutes } from './routes/recommendations.js';
import { insightRoutes } from './routes/insights.js';
const PORT = 4530;
// ============================================
// LOGGING
// ============================================
function createLogger(service) {
    return {
        info: (event, data) => {
            console.log(JSON.stringify({ level: 'info', service, event, timestamp: new Date().toISOString(), ...data }));
        },
        error: (event, data) => {
            console.error(JSON.stringify({ level: 'error', service, event, timestamp: new Date().toISOString(), ...data }));
        },
        warn: (event, data) => {
            console.warn(JSON.stringify({ level: 'warn', service, event, timestamp: new Date().toISOString(), ...data }));
        }
    };
}
const logger = createLogger('hojai-intelligence');
// ============================================
// IN-MEMORY STORES
// ============================================
export const predictionStore = new Map();
export const recommendationStore = new Map();
export const insightStore = new Map();
function tenantMiddleware() {
    return (req, res, next) => {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_TENANT_ID', message: 'X-Tenant-Id header required' }
            });
        }
        req.tenantContext = { tenant_id: tenantId, user_id: req.headers['x-user-id'] };
        next();
    };
}
// ============================================
// PREDICTION ENGINE (Simplified ML)
// ============================================
function predictChurn(features) {
    // Simplified churn prediction based on engagement metrics
    const daysSinceActivity = features.daysSinceActivity || 30;
    const engagementScore = features.engagementScore || 0.5;
    const totalOrders = features.totalOrders || 0;
    // Higher days since activity = higher churn risk
    // Lower engagement = higher churn risk
    let score = Math.min(1, Math.max(0, daysSinceActivity / 90 * 0.6 + (1 - engagementScore) * 0.4));
    // Reduce score if they have many orders
    if (totalOrders > 10)
        score *= 0.7;
    else if (totalOrders > 5)
        score *= 0.85;
    const confidence = 0.65 + Math.random() * 0.25; // 65-90%
    return { score, confidence };
}
function predictLTV(features) {
    const avgOrderValue = features.avgOrderValue || 100;
    const orderFrequency = features.orderFrequency || 1;
    const customerAge = features.customerAge || 30; // days
    // Simplified LTV calculation
    const monthlyValue = avgOrderValue * orderFrequency;
    const expectedMonths = Math.min(60, customerAge / 30 * 2); // Max 5 years
    let score = monthlyValue * expectedMonths;
    // Normalize to 0-1 scale (assuming max LTV of 50,000)
    score = Math.min(1, score / 50000);
    const confidence = 0.60 + Math.random() * 0.30;
    return { score, confidence };
}
function predictIntent(features) {
    const recentSearches = features.recentSearches || [];
    const pageViews = features.pageViews || 0;
    const cartValue = features.cartValue || 0;
    // Simple intent detection
    let intent = 'browse';
    let score = 0.3;
    if (cartValue > 0) {
        intent = 'purchase';
        score = 0.7 + Math.min(0.3, cartValue / 1000);
    }
    else if (pageViews > 5) {
        intent = 'research';
        score = 0.5 + Math.min(0.3, pageViews / 20);
    }
    else if (recentSearches.length > 0) {
        intent = 'search';
        score = 0.4 + Math.min(0.4, recentSearches.length / 10);
    }
    const confidence = 0.55 + Math.random() * 0.35;
    return { score, confidence, intent };
}
function predictPropensity(features) {
    const engagement = features.engagement || 0.5;
    const recency = features.recency || 0.5;
    const frequency = features.frequency || 0.5;
    // RFM-based propensity
    let score = (engagement + recency + frequency) / 3;
    const confidence = 0.60 + Math.random() * 0.30;
    return { score, confidence };
}
function predictRevisit(features) {
    const lastVisit = features.lastVisitDaysAgo || 7;
    const visitFrequency = features.visitFrequency || 7;
    // Higher visit frequency = more likely to revisit
    let score = 1 - Math.min(1, lastVisit / (visitFrequency * 2));
    const days = Math.round(visitFrequency - lastVisit + visitFrequency);
    const confidence = 0.55 + Math.random() * 0.35;
    return { score, confidence, days: Math.max(1, days) };
}
function predictConversion(features) {
    const cartItems = features.cartItems || 0;
    const wishlistCount = features.wishlistCount || 0;
    const viewedProducts = features.viewedProducts || 0;
    const timeOnSite = features.timeOnSite || 0; // minutes
    // Conversion propensity
    let score = 0;
    if (cartItems > 0)
        score += 0.4;
    if (wishlistCount > 0)
        score += 0.2;
    if (viewedProducts > 3)
        score += 0.2;
    if (timeOnSite > 5)
        score += 0.2;
    const confidence = 0.55 + Math.random() * 0.35;
    return { score: Math.min(1, score), confidence };
}
// ============================================
// RECOMMENDATION ENGINE
// ============================================
function generateRecommendations(type, userId, tenantId, context) {
    const items = [];
    switch (type) {
        case 'product':
            // Sample product recommendations
            items.push({ id: 'prod_1', type: 'product', score: 0.95, reason: 'Based on your browsing history' }, { id: 'prod_2', type: 'product', score: 0.88, reason: 'Frequently bought together' }, { id: 'prod_3', type: 'product', score: 0.82, reason: 'Popular in your category' });
            break;
        case 'content':
            items.push({ id: 'content_1', type: 'article', score: 0.90, reason: 'Trending in your interests' }, { id: 'content_2', type: 'video', score: 0.85, reason: 'Based on your activity' });
            break;
        case 'action':
            items.push({ id: 'action_1', type: 'checkout', score: 0.92, reason: 'Complete your purchase' }, { id: 'action_2', type: 'review', score: 0.75, reason: 'Share your feedback' });
            break;
        default:
            items.push({ id: 'item_1', type: 'generic', score: 0.80 }, { id: 'item_2', type: 'generic', score: 0.70 });
    }
    return items;
}
// ============================================
// INTELLIGENCE SERVICE CLASS
// ============================================
class HojaiIntelligence {
    app;
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                logger.info('request', {
                    method: req.method,
                    path: req.path,
                    status: res.statusCode,
                    duration: Date.now() - start
                });
            });
            next();
        });
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'hojai-intelligence',
                version: '1.0.0',
                port: PORT,
                timestamp: new Date().toISOString()
            });
        });
        this.app.get('/health/live', (req, res) => res.json({ status: 'ok' }));
        this.app.get('/health/ready', (req, res) => res.json({ status: 'ready' }));
        // Stats
        this.app.get('/stats', tenantMiddleware(), (req, res) => {
            const ctx = req.tenantContext;
            const predictions = predictionStore.get(ctx.tenant_id) || [];
            const recommendations = recommendationStore.get(ctx.tenant_id) || [];
            const insights = insightStore.get(ctx.tenant_id) || [];
            res.json({
                success: true,
                data: {
                    predictions: { total: predictions.length, byType: this.groupByType(predictions) },
                    recommendations: { total: recommendations.length },
                    insights: { total: insights.length }
                }
            });
        });
        // Mount routes
        this.app.use('/predictions', tenantMiddleware(), predictionRoutes);
        this.app.use('/recommendations', tenantMiddleware(), recommendationRoutes);
        this.app.use('/insights', tenantMiddleware(), insightRoutes);
        // Error handler
        this.app.use((err, req, res, next) => {
            logger.error('error', { error: err.message, path: req.path });
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: err.message }
            });
        });
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: `Route ${req.path} not found` }
            });
        });
    }
    groupByType(items) {
        const grouped = {};
        for (const item of items) {
            grouped[item.type] = (grouped[item.type] || 0) + 1;
        }
        return grouped;
    }
    start() {
        this.app.listen(PORT, () => {
            logger.info('service_started', { port: PORT });
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║           HOJAI INTELLIGENCE v1.0.0                     ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                ║
║  Status: Running                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Features:                                                   ║
║  - Churn Prediction                                          ║
║  - LTV Prediction                                            ║
║  - Intent Detection                                          ║
║  - Propensity Scoring                                        ║
║  - Product Recommendations                                   ║
║  - Trend Insights                                            ║
╚══════════════════════════════════════════════════════════════╝
      `);
        });
    }
}
// ============================================
// BOOTSTRAP
// ============================================
const intelligence = new HojaiIntelligence();
intelligence.start();
export { HojaiIntelligence, predictChurn, predictLTV, predictIntent, predictPropensity, predictRevisit, predictConversion, generateRecommendations };
export default intelligence;
//# sourceMappingURL=index.js.map