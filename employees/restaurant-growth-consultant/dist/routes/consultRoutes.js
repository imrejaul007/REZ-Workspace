"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const types_1 = require("../types");
const menuEngineer_1 = require("../services/menuEngineer");
const turnoverOptimizer_1 = require("../services/turnoverOptimizer");
const costAnalyzer_1 = require("../services/costAnalyzer");
const loyaltyManager_1 = require("../services/loyaltyManager");
const reviewManager_1 = require("../services/reviewManager");
const platformOptimizer_1 = require("../services/platformOptimizer");
const salesAgent_1 = require("../composers/salesAgent");
const marketingAgent_1 = require("../composers/marketingAgent");
const loyaltyAgent_1 = require("../composers/loyaltyAgent");
const router = (0, express_1.Router)();
// ============================================
// Health Check
// ============================================
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            service: 'Restaurant Growth Consultant',
            status: 'healthy',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        },
    });
});
// ============================================
// Menu Engineering
// ============================================
/**
 * POST /api/consult/menu
 * Analyze menu and provide engineering recommendations
 */
router.post('/menu', async (req, res) => {
    const startTime = Date.now();
    try {
        // Validate request body
        const validatedData = types_1.MenuEngineSchema.parse(req.body);
        // Analyze menu
        const result = await menuEngineer_1.menuEngineerService.analyzeMenu(validatedData);
        res.json({
            success: true,
            data: result,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'menu-engineer-v1',
                confidence: 0.92,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: error.errors,
                },
            });
            return;
        }
        console.error('Menu analysis error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to analyze menu',
            },
        });
    }
});
// ============================================
// Table Turnover
// ============================================
/**
 * POST /api/consult/turnover
 * Analyze table turnover and provide optimization recommendations
 */
router.post('/turnover', async (req, res) => {
    const startTime = Date.now();
    try {
        // Validate request body
        const validatedData = types_1.TurnoverSchema.parse(req.body);
        // Analyze turnover
        const result = await turnoverOptimizer_1.turnoverOptimizerService.analyze(validatedData);
        res.json({
            success: true,
            data: result,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'turnover-optimizer-v1',
                confidence: 0.89,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: error.errors,
                },
            });
            return;
        }
        console.error('Turnover analysis error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to analyze table turnover',
            },
        });
    }
});
// ============================================
// Food Cost
// ============================================
/**
 * POST /api/consult/food-cost
 * Analyze food costs and provide optimization recommendations
 */
router.post('/food-cost', async (req, res) => {
    const startTime = Date.now();
    try {
        // Validate request body
        const validatedData = types_1.FoodCostSchema.parse(req.body);
        // Analyze food cost
        const result = await costAnalyzer_1.costAnalyzerService.analyze(validatedData);
        res.json({
            success: true,
            data: result,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'cost-analyzer-v1',
                confidence: 0.91,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: error.errors,
                },
            });
            return;
        }
        console.error('Food cost analysis error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to analyze food costs',
            },
        });
    }
});
// ============================================
// Loyalty Program
// ============================================
/**
 * POST /api/consult/loyalty
 * Design or optimize loyalty program
 */
router.post('/loyalty', async (req, res) => {
    const startTime = Date.now();
    try {
        // Validate request body
        const validatedData = types_1.LoyaltySchema.parse(req.body);
        // Design loyalty program
        const result = await loyaltyManager_1.loyaltyManagerService.designProgram(validatedData);
        res.json({
            success: true,
            data: result,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'loyalty-manager-v1',
                confidence: 0.88,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: error.errors,
                },
            });
            return;
        }
        console.error('Loyalty design error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to design loyalty program',
            },
        });
    }
});
// ============================================
// Review Management
// ============================================
/**
 * POST /api/consult/reviews
 * Analyze reviews and provide management strategy
 */
router.post('/reviews', async (req, res) => {
    const startTime = Date.now();
    try {
        // Validate request body
        const validatedData = types_1.ReviewSchema.parse(req.body);
        // Analyze reviews
        const result = await reviewManager_1.reviewManagerService.analyze(validatedData);
        res.json({
            success: true,
            data: result,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'review-manager-v1',
                confidence: 0.85,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: error.errors,
                },
            });
            return;
        }
        console.error('Review analysis error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to analyze reviews',
            },
        });
    }
});
// ============================================
// Platform Optimization (Zomato/Swiggy)
// ============================================
/**
 * POST /api/consult/zomato
 * Optimize restaurant presence on Zomato/Swiggy
 */
router.post('/zomato', async (req, res) => {
    const startTime = Date.now();
    try {
        // Validate request body
        const validatedData = types_1.PlatformOptimizationSchema.parse(req.body);
        // Optimize platform presence
        const result = await platformOptimizer_1.platformOptimizerService.optimize(validatedData);
        res.json({
            success: true,
            data: result,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'platform-optimizer-v1',
                confidence: 0.87,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: error.errors,
                },
            });
            return;
        }
        console.error('Platform optimization error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to optimize platform presence',
            },
        });
    }
});
// ============================================
// Growth Recommendations
// ============================================
/**
 * GET /api/consult/growth
 * Get comprehensive growth recommendations
 */
router.get('/growth', async (req, res) => {
    const startTime = Date.now();
    try {
        const { restaurantId, restaurantProfile, financialMetrics, customerMetrics, platformMetrics } = req.body;
        // Validate required fields
        if (!restaurantId || !restaurantProfile || !financialMetrics || !customerMetrics) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields: restaurantId, restaurantProfile, financialMetrics, customerMetrics',
                },
            });
            return;
        }
        // Generate growth recommendations (simplified version)
        const growthResponse = {
            currentState: {
                revenue: financialMetrics.monthlyRevenue,
                customers: customerMetrics.totalCustomers,
                avgOrderValue: financialMetrics.avgOrderValue,
                growthRate: ((financialMetrics.monthlyOrders - 1) / financialMetrics.monthlyOrders) * 100 || 0,
            },
            targetState: {
                revenue: financialMetrics.monthlyRevenue * 1.25,
                customers: Math.round(customerMetrics.totalCustomers * 1.15),
                avgOrderValue: financialMetrics.avgOrderValue * 1.1,
                growthRate: 25,
            },
            growthPillars: [
                {
                    pillar: 'Menu Engineering',
                    weight: 0.3,
                    currentScore: 65,
                    targetScore: 85,
                    initiatives: [
                        { initiative: 'Analyze and optimize star items', impact: 15, timeline: '2 weeks', effort: 'low' },
                        { initiative: 'Reprice plowhorse items', impact: 10, timeline: '1 week', effort: 'low' },
                    ],
                },
                {
                    pillar: 'Table Turnover',
                    weight: 0.2,
                    currentScore: 55,
                    targetScore: 80,
                    initiatives: [
                        { initiative: 'Implement QR ordering', impact: 12, timeline: '4 weeks', effort: 'medium' },
                        { initiative: 'Optimize table layout', impact: 8, timeline: '2 weeks', effort: 'medium' },
                    ],
                },
                {
                    pillar: 'Food Cost Control',
                    weight: 0.2,
                    currentScore: 60,
                    targetScore: 75,
                    initiatives: [
                        { initiative: 'Vendor renegotiation', impact: 10, timeline: '4 weeks', effort: 'high' },
                        { initiative: 'Recipe optimization', impact: 8, timeline: '3 weeks', effort: 'medium' },
                    ],
                },
                {
                    pillar: 'Loyalty Program',
                    weight: 0.15,
                    currentScore: 40,
                    targetScore: 75,
                    initiatives: [
                        { initiative: 'Launch loyalty program', impact: 12, timeline: '4 weeks', effort: 'medium' },
                        { initiative: 'Tier upgrade campaigns', impact: 8, timeline: '2 weeks', effort: 'low' },
                    ],
                },
                {
                    pillar: 'Platform Optimization',
                    weight: 0.15,
                    currentScore: 50,
                    targetScore: 80,
                    initiatives: [
                        { initiative: 'Review generation', impact: 10, timeline: '4 weeks', effort: 'medium' },
                        { initiative: 'Menu optimization', impact: 8, timeline: '2 weeks', effort: 'low' },
                    ],
                },
            ],
            quickWins: [
                { action: 'Add combo meals', impact: 8, effort: 'low', timeline: '1 week' },
                { action: 'Implement dynamic pricing', impact: 6, effort: 'medium', timeline: '2 weeks' },
                { action: 'Launch referral program', impact: 10, effort: 'low', timeline: '2 weeks' },
            ],
            investments: [
                { category: 'POS System Upgrade', amount: 50000, roi: 3.5, paybackMonths: 6 },
                { category: 'QR Ordering System', amount: 30000, roi: 4.2, paybackMonths: 4 },
                { category: 'Loyalty Platform', amount: 25000, roi: 3.8, paybackMonths: 5 },
            ],
            timeline: [
                {
                    month: 'Month 1',
                    focus: 'Foundation',
                    keyActions: ['Menu analysis', 'Vendor review', 'Loyalty program design'],
                    expectedOutcome: 'Clear roadmap with prioritized actions',
                },
                {
                    month: 'Month 2-3',
                    focus: 'Implementation',
                    keyActions: ['Launch loyalty program', 'Implement QR ordering', 'Reprice menu items'],
                    expectedOutcome: '15% increase in repeat customers',
                },
                {
                    month: 'Month 4-6',
                    focus: 'Optimization',
                    keyActions: ['Platform optimization', 'Campaign execution', 'Performance monitoring'],
                    expectedOutcome: '25% revenue growth',
                },
            ],
        };
        res.json({
            success: true,
            data: growthResponse,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'growth-consultant-v1',
                confidence: 0.90,
            },
        });
    }
    catch (error) {
        console.error('Growth recommendations error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to generate growth recommendations',
            },
        });
    }
});
// ============================================
// Sales Agent Endpoints
// ============================================
/**
 * POST /api/consult/sales/upsell
 * Generate upselling suggestions
 */
router.post('/sales/upsell', async (req, res) => {
    const startTime = Date.now();
    try {
        const { currentOrder, menuItems } = req.body;
        if (!currentOrder || !menuItems) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields: currentOrder, menuItems',
                },
            });
            return;
        }
        const suggestions = await salesAgent_1.salesAgent.generateUpsellSuggestions(currentOrder, menuItems);
        res.json({
            success: true,
            data: { suggestions },
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'sales-agent-v1',
            },
        });
    }
    catch (error) {
        console.error('Upsell generation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to generate upsell suggestions',
            },
        });
    }
});
/**
 * POST /api/consult/sales/bundles
 * Generate bundle opportunities
 */
router.post('/sales/bundles', async (req, res) => {
    const startTime = Date.now();
    try {
        const { menuItems, targetMargin } = req.body;
        if (!menuItems) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required field: menuItems',
                },
            });
            return;
        }
        const bundles = await salesAgent_1.salesAgent.generateBundleOpportunities(menuItems, targetMargin);
        res.json({
            success: true,
            data: { bundles },
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'sales-agent-v1',
            },
        });
    }
    catch (error) {
        console.error('Bundle generation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to generate bundle opportunities',
            },
        });
    }
});
// ============================================
// Marketing Agent Endpoints
// ============================================
/**
 * POST /api/consult/marketing/channels
 * Analyze marketing channels
 */
router.post('/marketing/channels', async (req, res) => {
    const startTime = Date.now();
    try {
        const { currentSpend, performance } = req.body;
        if (!currentSpend) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required field: currentSpend',
                },
            });
            return;
        }
        const spendMap = new Map(Object.entries(currentSpend));
        const perfMap = new Map(Object.entries(performance || {}));
        const channels = await marketingAgent_1.marketingAgent.analyzeChannels(spendMap, perfMap);
        res.json({
            success: true,
            data: { channels },
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'marketing-agent-v1',
            },
        });
    }
    catch (error) {
        console.error('Channel analysis error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to analyze marketing channels',
            },
        });
    }
});
/**
 * POST /api/consult/marketing/campaigns
 * Create marketing campaigns
 */
router.post('/marketing/campaigns', async (req, res) => {
    const startTime = Date.now();
    try {
        const { restaurantProfile, objectives } = req.body;
        if (!restaurantProfile || !objectives) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields: restaurantProfile, objectives',
                },
            });
            return;
        }
        const campaigns = await marketingAgent_1.marketingAgent.createCampaigns(restaurantProfile, objectives);
        res.json({
            success: true,
            data: { campaigns },
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'marketing-agent-v1',
            },
        });
    }
    catch (error) {
        console.error('Campaign creation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create marketing campaigns',
            },
        });
    }
});
// ============================================
// Loyalty Agent Endpoints
// ============================================
/**
 * POST /api/consult/loyalty/health
 * Calculate member health scores
 */
router.post('/loyalty/health', async (req, res) => {
    const startTime = Date.now();
    try {
        const { member } = req.body;
        if (!member) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required field: member',
                },
            });
            return;
        }
        const health = loyaltyAgent_1.loyaltyAgent.calculateMemberHealth(member);
        res.json({
            success: true,
            data: health,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'loyalty-agent-v1',
            },
        });
    }
    catch (error) {
        console.error('Health calculation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to calculate member health',
            },
        });
    }
});
/**
 * POST /api/consult/loyalty/at-risk
 * Identify at-risk loyalty members
 */
router.post('/loyalty/at-risk', async (req, res) => {
    const startTime = Date.now();
    try {
        const { members } = req.body;
        if (!members || !Array.isArray(members)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required field: members (array)',
                },
            });
            return;
        }
        const atRisk = await loyaltyAgent_1.loyaltyAgent.identifyAtRiskMembers(members);
        res.json({
            success: true,
            data: atRisk,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'loyalty-agent-v1',
            },
        });
    }
    catch (error) {
        console.error('At-risk identification error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to identify at-risk members',
            },
        });
    }
});
exports.default = router;
//# sourceMappingURL=consultRoutes.js.map