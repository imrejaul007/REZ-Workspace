import { z, ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';
export interface ValidationError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Array<{
            field: string;
            message: string;
        }>;
    };
}
export declare function parseZodError(error: ZodError): ValidationError['error'];
export declare function validateBody<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function validateQuery<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function validateParams<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const UUIDSchema: z.ZodString;
export declare const PaginationSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit?: number;
    offset?: number;
}, {
    limit?: number;
    offset?: number;
}>;
export declare const DateRangeSchema: z.ZodObject<{
    start: z.ZodOptional<z.ZodString>;
    end: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    end?: string;
    start?: string;
}, {
    end?: string;
    start?: string;
}>;
export declare const LeadFiltersSchema: z.ZodObject<{
    stage: z.ZodOptional<z.ZodEnum<["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]>>;
    source: z.ZodOptional<z.ZodEnum<["cold_outreach", "inbound", "referral", "event", "linkedin", "campaign", "webinar", "partner"]>>;
    score: z.ZodOptional<z.ZodEnum<["hot", "warm", "cold", "unqualified"]>>;
    assignedTo: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit?: number;
    stage?: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
    source?: "cold_outreach" | "inbound" | "referral" | "event" | "linkedin" | "campaign" | "webinar" | "partner";
    score?: "hot" | "warm" | "cold" | "unqualified";
    assignedTo?: string;
    offset?: number;
}, {
    limit?: number;
    stage?: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
    source?: "cold_outreach" | "inbound" | "referral" | "event" | "linkedin" | "campaign" | "webinar" | "partner";
    score?: "hot" | "warm" | "cold" | "unqualified";
    assignedTo?: string;
    offset?: number;
}>;
export declare const ProspectSearchSchema: z.ZodObject<{
    industry: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    companySize: z.ZodOptional<z.ZodArray<z.ZodEnum<["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]>, "many">>;
    location: z.ZodOptional<z.ZodObject<{
        cities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        states: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        countries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        cities?: string[];
        states?: string[];
        countries?: string[];
    }, {
        cities?: string[];
        states?: string[];
        countries?: string[];
    }>>;
    title: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    excludeKeywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    technologies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    fundingStage: z.ZodOptional<z.ZodArray<z.ZodEnum<["seed", "series_a", "series_b", "series_c", "ipo", "profitable"]>, "many">>;
    recentlyHired: z.ZodOptional<z.ZodBoolean>;
    jobChanges: z.ZodOptional<z.ZodObject<{
        titles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        withinDays: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        titles?: string[];
        withinDays?: number;
    }, {
        titles?: string[];
        withinDays?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    title?: string[];
    companySize?: ("1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+")[];
    industry?: string[];
    location?: {
        cities?: string[];
        states?: string[];
        countries?: string[];
    };
    keywords?: string[];
    excludeKeywords?: string[];
    technologies?: string[];
    fundingStage?: ("seed" | "series_a" | "series_b" | "series_c" | "ipo" | "profitable")[];
    recentlyHired?: boolean;
    jobChanges?: {
        titles?: string[];
        withinDays?: number;
    };
}, {
    title?: string[];
    companySize?: ("1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+")[];
    industry?: string[];
    location?: {
        cities?: string[];
        states?: string[];
        countries?: string[];
    };
    keywords?: string[];
    excludeKeywords?: string[];
    technologies?: string[];
    fundingStage?: ("seed" | "series_a" | "series_b" | "series_c" | "ipo" | "profitable")[];
    recentlyHired?: boolean;
    jobChanges?: {
        titles?: string[];
        withinDays?: number;
    };
}>;
export declare const QualificationInputSchema: z.ZodObject<{
    budget: z.ZodObject<{
        hasBudget: z.ZodBoolean;
        amount: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodString>;
        comments: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        hasBudget?: boolean;
        amount?: number;
        currency?: string;
        comments?: string;
    }, {
        hasBudget?: boolean;
        amount?: number;
        currency?: string;
        comments?: string;
    }>;
    authority: z.ZodObject<{
        level: z.ZodEnum<["individual", "manager", "director", "vp", "cxo", "unknown"]>;
        isDecisionMaker: z.ZodBoolean;
        involvesOthers: z.ZodOptional<z.ZodBoolean>;
        comments: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        level?: "unknown" | "individual" | "manager" | "director" | "vp" | "cxo";
        comments?: string;
        isDecisionMaker?: boolean;
        involvesOthers?: boolean;
    }, {
        level?: "unknown" | "individual" | "manager" | "director" | "vp" | "cxo";
        comments?: string;
        isDecisionMaker?: boolean;
        involvesOthers?: boolean;
    }>;
    need: z.ZodObject<{
        painPoints: z.ZodArray<z.ZodString, "many">;
        priority: z.ZodEnum<["low", "medium", "high", "critical"]>;
        businessImpact: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        painPoints?: string[];
        priority?: "low" | "medium" | "high" | "critical";
        businessImpact?: string;
    }, {
        painPoints?: string[];
        priority?: "low" | "medium" | "high" | "critical";
        businessImpact?: string;
    }>;
    timeline: z.ZodObject<{
        targetClose: z.ZodOptional<z.ZodString>;
        buyingStage: z.ZodEnum<["awareness", "consideration", "decision", "none"]>;
        urgency: z.ZodEnum<["low", "medium", "high"]>;
    }, "strip", z.ZodTypeAny, {
        targetClose?: string;
        buyingStage?: "awareness" | "consideration" | "decision" | "none";
        urgency?: "low" | "medium" | "high";
    }, {
        targetClose?: string;
        buyingStage?: "awareness" | "consideration" | "decision" | "none";
        urgency?: "low" | "medium" | "high";
    }>;
}, "strip", z.ZodTypeAny, {
    budget?: {
        hasBudget?: boolean;
        amount?: number;
        currency?: string;
        comments?: string;
    };
    authority?: {
        level?: "unknown" | "individual" | "manager" | "director" | "vp" | "cxo";
        comments?: string;
        isDecisionMaker?: boolean;
        involvesOthers?: boolean;
    };
    need?: {
        painPoints?: string[];
        priority?: "low" | "medium" | "high" | "critical";
        businessImpact?: string;
    };
    timeline?: {
        targetClose?: string;
        buyingStage?: "awareness" | "consideration" | "decision" | "none";
        urgency?: "low" | "medium" | "high";
    };
}, {
    budget?: {
        hasBudget?: boolean;
        amount?: number;
        currency?: string;
        comments?: string;
    };
    authority?: {
        level?: "unknown" | "individual" | "manager" | "director" | "vp" | "cxo";
        comments?: string;
        isDecisionMaker?: boolean;
        involvesOthers?: boolean;
    };
    need?: {
        painPoints?: string[];
        priority?: "low" | "medium" | "high" | "critical";
        businessImpact?: string;
    };
    timeline?: {
        targetClose?: string;
        buyingStage?: "awareness" | "consideration" | "decision" | "none";
        urgency?: "low" | "medium" | "high";
    };
}>;
export declare const OutreachMessageSchema: z.ZodObject<{
    channel: z.ZodEnum<["email", "linkedin", "phone", "sms", "whatsapp"]>;
    subject: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    templateId: z.ZodOptional<z.ZodString>;
    personalization: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        url?: string;
    }, {
        name?: string;
        url?: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    channel?: "linkedin" | "email" | "phone" | "sms" | "whatsapp";
    subject?: string;
    body?: string;
    templateId?: string;
    personalization?: Record<string, string>;
    attachments?: {
        name?: string;
        url?: string;
    }[];
}, {
    channel?: "linkedin" | "email" | "phone" | "sms" | "whatsapp";
    subject?: string;
    body?: string;
    templateId?: string;
    personalization?: Record<string, string>;
    attachments?: {
        name?: string;
        url?: string;
    }[];
}>;
export declare const FollowupScheduleItemSchema: z.ZodObject<{
    channel: z.ZodEnum<["email", "linkedin", "phone", "sms", "whatsapp"]>;
    scheduledAt: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
    reminder: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    channel?: "linkedin" | "email" | "phone" | "sms" | "whatsapp";
    scheduledAt?: string;
    reminder?: boolean;
}, {
    message?: string;
    channel?: "linkedin" | "email" | "phone" | "sms" | "whatsapp";
    scheduledAt?: string;
    reminder?: boolean;
}>;
export declare const FollowupBatchSchema: z.ZodObject<{
    leadId: z.ZodString;
    followups: z.ZodArray<z.ZodObject<{
        channel: z.ZodEnum<["email", "linkedin", "phone", "sms", "whatsapp"]>;
        scheduledAt: z.ZodString;
        message: z.ZodOptional<z.ZodString>;
        reminder: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        message?: string;
        channel?: "linkedin" | "email" | "phone" | "sms" | "whatsapp";
        scheduledAt?: string;
        reminder?: boolean;
    }, {
        message?: string;
        channel?: "linkedin" | "email" | "phone" | "sms" | "whatsapp";
        scheduledAt?: string;
        reminder?: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    leadId?: string;
    followups?: {
        message?: string;
        channel?: "linkedin" | "email" | "phone" | "sms" | "whatsapp";
        scheduledAt?: string;
        reminder?: boolean;
    }[];
}, {
    leadId?: string;
    followups?: {
        message?: string;
        channel?: "linkedin" | "email" | "phone" | "sms" | "whatsapp";
        scheduledAt?: string;
        reminder?: boolean;
    }[];
}>;
export declare const StageUpdateSchema: z.ZodObject<{
    stage: z.ZodEnum<["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    stage?: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
    notes?: string;
}, {
    stage?: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
    notes?: string;
}>;
export declare const CRMConfigSchema: z.ZodObject<{
    provider: z.ZodEnum<["hubspot", "salesforce", "pipedrive", "zoho", "custom"]>;
    apiKey: z.ZodString;
    apiSecret: z.ZodOptional<z.ZodString>;
    instanceUrl: z.ZodOptional<z.ZodString>;
    webhookSecret: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    apiKey?: string;
    provider?: "custom" | "hubspot" | "salesforce" | "pipedrive" | "zoho";
    apiSecret?: string;
    instanceUrl?: string;
    webhookSecret?: string;
}, {
    apiKey?: string;
    provider?: "custom" | "hubspot" | "salesforce" | "pipedrive" | "zoho";
    apiSecret?: string;
    instanceUrl?: string;
    webhookSecret?: string;
}>;
export declare function successResponse<T>(data: T, message?: string): {
    data: T;
    message?: string;
    success: boolean;
};
export declare function errorResponse(code: string, message: string, details?: unknown): {
    success: boolean;
    error: {
        details?: unknown;
        code: string;
        message: string;
    };
};
export declare function paginatedResponse<T>(items: T[], total: number, limit: number, offset: number): {
    success: boolean;
    data: {
        items: T[];
        pagination: {
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
        };
    };
};
//# sourceMappingURL=validation.d.ts.map