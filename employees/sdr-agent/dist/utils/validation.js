"use strict";
// ============================================
// HOJAI AI - SDR Agent Validation Utilities
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRMConfigSchema = exports.StageUpdateSchema = exports.FollowupBatchSchema = exports.FollowupScheduleItemSchema = exports.OutreachMessageSchema = exports.QualificationInputSchema = exports.ProspectSearchSchema = exports.LeadFiltersSchema = exports.DateRangeSchema = exports.PaginationSchema = exports.UUIDSchema = void 0;
exports.parseZodError = parseZodError;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
exports.paginatedResponse = paginatedResponse;
const zod_1 = require("zod");
// Parse Zod error to structured format
function parseZodError(error) {
    const details = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
    }));
    return {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details
    };
}
// Async validation middleware factory
function validateBody(schema) {
    return async (req, res, next) => {
        try {
            const result = await schema.parseAsync(req.body);
            req.body = result;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: parseZodError(error)
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Validation error'
                    }
                });
            }
        }
    };
}
// Validate query parameters
function validateQuery(schema) {
    return async (req, res, next) => {
        try {
            const result = await schema.parseAsync(req.query);
            req.query = result;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: parseZodError(error)
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Validation error'
                    }
                });
            }
        }
    };
}
// Validate params
function validateParams(schema) {
    return async (req, res, next) => {
        try {
            const result = await schema.parseAsync(req.params);
            req.params = result;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: parseZodError(error)
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Validation error'
                    }
                });
            }
        }
    };
}
// UUID validation schema
exports.UUIDSchema = zod_1.z.string().uuid('Invalid UUID format');
// Pagination schema
exports.PaginationSchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().min(1).max(100).default(50),
    offset: zod_1.z.coerce.number().min(0).default(0)
});
// Date range schema
exports.DateRangeSchema = zod_1.z.object({
    start: zod_1.z.string().datetime().optional(),
    end: zod_1.z.string().datetime().optional()
});
// Lead filters schema
exports.LeadFiltersSchema = zod_1.z.object({
    stage: zod_1.z.enum([
        'new', 'contacted', 'qualified', 'proposal',
        'negotiation', 'closed_won', 'closed_lost'
    ]).optional(),
    source: zod_1.z.enum([
        'cold_outreach', 'inbound', 'referral', 'event',
        'linkedin', 'campaign', 'webinar', 'partner'
    ]).optional(),
    score: zod_1.z.enum(['hot', 'warm', 'cold', 'unqualified']).optional(),
    assignedTo: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(50),
    offset: zod_1.z.coerce.number().min(0).default(0)
});
// Prospect search schema
exports.ProspectSearchSchema = zod_1.z.object({
    industry: zod_1.z.array(zod_1.z.string()).optional(),
    companySize: zod_1.z.array(zod_1.z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])).optional(),
    location: zod_1.z.object({
        cities: zod_1.z.array(zod_1.z.string()).optional(),
        states: zod_1.z.array(zod_1.z.string()).optional(),
        countries: zod_1.z.array(zod_1.z.string()).optional()
    }).optional(),
    title: zod_1.z.array(zod_1.z.string()).optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    excludeKeywords: zod_1.z.array(zod_1.z.string()).optional(),
    technologies: zod_1.z.array(zod_1.z.string()).optional(),
    fundingStage: zod_1.z.array(zod_1.z.enum(['seed', 'series_a', 'series_b', 'series_c', 'ipo', 'profitable'])).optional(),
    recentlyHired: zod_1.z.boolean().optional(),
    jobChanges: zod_1.z.object({
        titles: zod_1.z.array(zod_1.z.string()).optional(),
        withinDays: zod_1.z.number().min(1).max(365).optional()
    }).optional()
});
// Qualification schema
exports.QualificationInputSchema = zod_1.z.object({
    budget: zod_1.z.object({
        hasBudget: zod_1.z.boolean(),
        amount: zod_1.z.number().min(0).optional(),
        currency: zod_1.z.string().default('USD'),
        comments: zod_1.z.string().optional()
    }),
    authority: zod_1.z.object({
        level: zod_1.z.enum(['individual', 'manager', 'director', 'vp', 'cxo', 'unknown']),
        isDecisionMaker: zod_1.z.boolean(),
        involvesOthers: zod_1.z.boolean().optional(),
        comments: zod_1.z.string().optional()
    }),
    need: zod_1.z.object({
        painPoints: zod_1.z.array(zod_1.z.string()).min(1, 'At least one pain point is required'),
        priority: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
        businessImpact: zod_1.z.string().optional()
    }),
    timeline: zod_1.z.object({
        targetClose: zod_1.z.string().datetime().optional(),
        buyingStage: zod_1.z.enum(['awareness', 'consideration', 'decision', 'none']),
        urgency: zod_1.z.enum(['low', 'medium', 'high'])
    })
});
// Outreach message schema
exports.OutreachMessageSchema = zod_1.z.object({
    channel: zod_1.z.enum(['email', 'linkedin', 'phone', 'sms', 'whatsapp']),
    subject: zod_1.z.string().max(500).optional(),
    body: zod_1.z.string().min(1).max(5000),
    templateId: zod_1.z.string().optional(),
    personalization: zod_1.z.record(zod_1.z.string()).optional(),
    attachments: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        url: zod_1.z.string().url()
    })).optional()
});
// Followup schedule schema
exports.FollowupScheduleItemSchema = zod_1.z.object({
    channel: zod_1.z.enum(['email', 'linkedin', 'phone', 'sms', 'whatsapp']),
    scheduledAt: zod_1.z.string().datetime(),
    message: zod_1.z.string().max(5000).optional(),
    reminder: zod_1.z.boolean().default(true)
});
// Followup batch schema
exports.FollowupBatchSchema = zod_1.z.object({
    leadId: zod_1.z.string().uuid(),
    followups: zod_1.z.array(exports.FollowupScheduleItemSchema).min(1)
});
// Stage update schema
exports.StageUpdateSchema = zod_1.z.object({
    stage: zod_1.z.enum([
        'new', 'contacted', 'qualified', 'proposal',
        'negotiation', 'closed_won', 'closed_lost'
    ]),
    notes: zod_1.z.string().max(2000).optional()
});
// CRM config schema
exports.CRMConfigSchema = zod_1.z.object({
    provider: zod_1.z.enum(['hubspot', 'salesforce', 'pipedrive', 'zoho', 'custom']),
    apiKey: zod_1.z.string().min(1),
    apiSecret: zod_1.z.string().optional(),
    instanceUrl: zod_1.z.string().url().optional(),
    webhookSecret: zod_1.z.string().optional()
});
// API response helpers
function successResponse(data, message) {
    return {
        success: true,
        ...(message ? { message } : {}),
        data
    };
}
function errorResponse(code, message, details) {
    return {
        success: false,
        error: {
            code,
            message,
            ...(details ? { details } : {})
        }
    };
}
function paginatedResponse(items, total, limit, offset) {
    return {
        success: true,
        data: {
            items,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + items.length < total
            }
        }
    };
}
//# sourceMappingURL=validation.js.map