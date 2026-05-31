"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const types_1 = require("../types");
const staffAnalyzer_1 = require("../services/staffAnalyzer");
const bookingOptimizer_1 = require("../services/bookingOptimizer");
const membershipManager_1 = require("../services/membershipManager");
const packageAdvisor_1 = require("../services/packageAdvisor");
const scheduleOptimizer_1 = require("../services/scheduleOptimizer");
const growthAdvisor_1 = require("../services/growthAdvisor");
const router = (0, express_1.Router)();
// ============================================
// Health Check
// ============================================
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            service: 'Salon Growth Consultant',
            status: 'healthy',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        },
    });
});
// ============================================
// Staff Utilization
// ============================================
/**
 * POST /api/consult/staff
 * Analyze staff utilization and provide optimization recommendations
 */
router.post('/staff', async (req, res) => {
    const startTime = Date.now();
    try {
        const validatedData = types_1.StaffConsultSchema.parse(req.body);
        const result = await staffAnalyzer_1.staffAnalyzerService.analyzeStaff(validatedData);
        res.json({
            success: true,
            data: result,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'staff-analyzer-v1',
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
        console.error('Staff analysis error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to analyze staff utilization',
            },
        });
    }
});
// ============================================
// Booking Optimization
// ============================================
/**
 * POST /api/consult/bookings
 * Analyze booking patterns and provide optimization recommendations
 */
router.post('/bookings', async (req, res) => {
    const startTime = Date.now();
    try {
        const validatedData = types_1.BookingConsultSchema.parse(req.body);
        const result = await bookingOptimizer_1.bookingOptimizerService.analyze(validatedData);
        res.json({
            success: true,
            data: result,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'booking-optimizer-v1',
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
        console.error('Booking analysis error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to analyze booking optimization',
            },
        });
    }
});
// ============================================
// Membership Setup
// ============================================
/**
 * POST /api/consult/memberships
 * Design or optimize membership program
 */
router.post('/memberships', async (req, res) => {
    const startTime = Date.now();
    try {
        const validatedData = types_1.MembershipConsultSchema.parse(req.body);
        const result = await membershipManager_1.membershipManagerService.designProgram(validatedData);
        res.json({
            success: true,
            data: result,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'membership-manager-v1',
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
        console.error('Membership design error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to design membership program',
            },
        });
    }
});
// ============================================
// Package Recommendations
// ============================================
/**
 * POST /api/consult/packages
 * Generate beauty package recommendations
 */
router.post('/packages', async (req, res) => {
    const startTime = Date.now();
    try {
        const validatedData = types_1.PackageConsultSchema.parse(req.body);
        const result = await packageAdvisor_1.packageAdvisorService.recommend(validatedData);
        res.json({
            success: true,
            data: result,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'package-advisor-v1',
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
        console.error('Package recommendation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to generate package recommendations',
            },
        });
    }
});
// ============================================
// Staff Scheduling
// ============================================
/**
 * POST /api/consult/scheduling
 * Optimize staff scheduling
 */
router.post('/scheduling', async (req, res) => {
    const startTime = Date.now();
    try {
        const validatedData = types_1.ScheduleConsultSchema.parse(req.body);
        const result = await scheduleOptimizer_1.scheduleOptimizerService.optimize(validatedData);
        res.json({
            success: true,
            data: result,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'schedule-optimizer-v1',
                confidence: 0.86,
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
        console.error('Schedule optimization error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to optimize schedule',
            },
        });
    }
});
// ============================================
// Growth Recommendations
// ============================================
/**
 * GET /api/consult/growth
 * Get comprehensive salon growth recommendations
 */
router.get('/growth', async (req, res) => {
    const startTime = Date.now();
    try {
        // Support both GET and POST for growth endpoint
        const body = req.method === 'POST' ? req.body : req.query;
        if (!body.salonId || !body.salonProfile || !body.financialMetrics || !body.clientMetrics) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields: salonId, salonProfile, financialMetrics, clientMetrics',
                },
            });
            return;
        }
        const validatedData = types_1.GrowthConsultSchema.parse(body);
        const result = await growthAdvisor_1.growthAdvisorService.advise(validatedData);
        res.json({
            success: true,
            data: result,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'growth-advisor-v1',
                confidence: 0.90,
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
/**
 * POST /api/consult/growth
 * Get comprehensive salon growth recommendations (POST method)
 */
router.post('/growth', async (req, res) => {
    const startTime = Date.now();
    try {
        if (!req.body.salonId || !req.body.salonProfile || !req.body.financialMetrics || !req.body.clientMetrics) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields: salonId, salonProfile, financialMetrics, clientMetrics',
                },
            });
            return;
        }
        const validatedData = types_1.GrowthConsultSchema.parse(req.body);
        const result = await growthAdvisor_1.growthAdvisorService.advise(validatedData);
        res.json({
            success: true,
            data: result,
            metadata: {
                processingTime: Date.now() - startTime,
                model: 'growth-advisor-v1',
                confidence: 0.90,
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
// Analytics Summary
// ============================================
/**
 * GET /api/consult/analytics
 * Get analytics summary for all modules
 */
router.get('/analytics', async (req, res) => {
    const startTime = Date.now();
    try {
        const { salonId } = req.query;
        if (!salonId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required field: salonId',
                },
            });
            return;
        }
        // Return a summary of available analytics
        const analytics = {
            modules: [
                {
                    name: 'Staff Utilization',
                    endpoint: 'POST /api/consult/staff',
                    metrics: ['utilization', 'revenue_per_hour', 'top_performers'],
                },
                {
                    name: 'Booking Optimization',
                    endpoint: 'POST /api/consult/bookings',
                    metrics: ['repeat_rate', 'upsell_rate', 'no_show_rate'],
                },
                {
                    name: 'Membership',
                    endpoint: 'POST /api/consult/memberships',
                    metrics: ['members', 'mrr', 'churn_rate'],
                },
                {
                    name: 'Packages',
                    endpoint: 'POST /api/consult/packages',
                    metrics: ['conversion', 'avg_value', 'margin'],
                },
                {
                    name: 'Scheduling',
                    endpoint: 'POST /api/consult/scheduling',
                    metrics: ['utilization', 'buffer_time', 'peak_coverage'],
                },
                {
                    name: 'Growth',
                    endpoint: 'GET/POST /api/consult/growth',
                    metrics: ['revenue', 'clients', 'growth_rate'],
                },
            ],
            availableFilters: ['dateRange', 'staffId', 'serviceCategory'],
        };
        res.json({
            success: true,
            data: analytics,
            metadata: {
                processingTime: Date.now() - startTime,
            },
        });
    }
    catch (error) {
        console.error('Analytics summary error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get analytics summary',
            },
        });
    }
});
exports.default = router;
//# sourceMappingURL=consultRoutes.js.map