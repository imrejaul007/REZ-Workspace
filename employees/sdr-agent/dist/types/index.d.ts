import { z } from 'zod';
export declare enum LeadStage {
    NEW = "new",
    CONTACTED = "contacted",
    QUALIFIED = "qualified",
    PROPOSAL = "proposal",
    NEGOTIATION = "negotiation",
    CLOSED_WON = "closed_won",
    CLOSED_LOST = "closed_lost"
}
export declare enum LeadSource {
    COLD_OUTREACH = "cold_outreach",
    INBOUND = "inbound",
    REFERRAL = "referral",
    EVENT = "event",
    LINKEDIN = "linkedin",
    CAMPAIGN = "campaign",
    WEBINAR = "webinar",
    PARTNER = "partner"
}
export declare enum LeadScore {
    HOT = "hot",// 80-100
    WARM = "warm",// 50-79
    COLD = "cold",// 0-49
    UNQUALIFIED = "unqualified"
}
export declare enum OutreachChannel {
    EMAIL = "email",
    LINKEDIN = "linkedin",
    PHONE = "phone",
    SMS = "sms",
    WHATSAPP = "whatsapp"
}
export declare enum OutreachStatus {
    PENDING = "pending",
    SENT = "sent",
    DELIVERED = "delivered",
    OPENED = "opened",
    CLICKED = "clicked",
    REPLIED = "replied",
    BOUNCED = "bounced",
    FAILED = "failed"
}
export declare enum FollowupStatus {
    SCHEDULED = "scheduled",
    SENT = "sent",
    COMPLETED = "completed",
    SKIPPED = "skipped"
}
export declare enum BANTField {
    BUDGET = "budget",
    AUTHORITY = "authority",
    NEED = "need",
    TIMELINE = "timeline"
}
export declare enum QualificationStatus {
    NOT_QUALIFIED = "not_qualified",
    IN_PROGRESS = "in_progress",
    QUALIFIED = "qualified",
    DISQUALIFIED = "disqualified"
}
export declare const ContactSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    linkedinUrl: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    companySize: z.ZodOptional<z.ZodEnum<["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]>>;
    industry: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodObject<{
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        city?: string;
        state?: string;
        country?: string;
    }, {
        city?: string;
        state?: string;
        country?: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    linkedinUrl?: string;
    title?: string;
    company?: string;
    companySize?: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+";
    industry?: string;
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
}, {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    linkedinUrl?: string;
    title?: string;
    company?: string;
    companySize?: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+";
    industry?: string;
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
}>;
export declare const CompanySchema: z.ZodObject<{
    name: z.ZodString;
    domain: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodEnum<["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]>>;
    revenue: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodObject<{
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        city?: string;
        state?: string;
        country?: string;
    }, {
        city?: string;
        state?: string;
        country?: string;
    }>>;
    linkedinUrl: z.ZodOptional<z.ZodString>;
    crunchbaseUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    linkedinUrl?: string;
    industry?: string;
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
    name?: string;
    domain?: string;
    size?: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+";
    revenue?: string;
    crunchbaseUrl?: string;
}, {
    linkedinUrl?: string;
    industry?: string;
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
    name?: string;
    domain?: string;
    size?: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+";
    revenue?: string;
    crunchbaseUrl?: string;
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
export declare const QualificationSchema: z.ZodObject<{
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
    channel: z.ZodNativeEnum<typeof OutreachChannel>;
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
    channel?: OutreachChannel;
    subject?: string;
    body?: string;
    templateId?: string;
    personalization?: Record<string, string>;
    attachments?: {
        name?: string;
        url?: string;
    }[];
}, {
    channel?: OutreachChannel;
    subject?: string;
    body?: string;
    templateId?: string;
    personalization?: Record<string, string>;
    attachments?: {
        name?: string;
        url?: string;
    }[];
}>;
export declare const FollowupScheduleSchema: z.ZodObject<{
    leadId: z.ZodString;
    channel: z.ZodNativeEnum<typeof OutreachChannel>;
    scheduledAt: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
    reminder: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    channel?: OutreachChannel;
    leadId?: string;
    scheduledAt?: string;
    reminder?: boolean;
}, {
    message?: string;
    channel?: OutreachChannel;
    leadId?: string;
    scheduledAt?: string;
    reminder?: boolean;
}>;
export interface IContact extends z.infer<typeof ContactSchema> {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICompany extends z.infer<typeof CompanySchema> {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ILead {
    id: string;
    tenantId: string;
    contactId: string;
    companyId: string;
    stage: LeadStage;
    source: LeadSource;
    score: LeadScore;
    scoreValue: number;
    ownerId: string;
    assignedTo: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastContactedAt: Date | null;
    nextFollowupAt: Date | null;
}
export interface IQualification {
    id: string;
    tenantId: string;
    leadId: string;
    status: QualificationStatus;
    bant: {
        budget: {
            hasBudget: boolean;
            amount?: number;
            currency: string;
            comments?: string;
        };
        authority: {
            level: 'individual' | 'manager' | 'director' | 'vp' | 'cxo' | 'unknown';
            isDecisionMaker: boolean;
            involvesOthers?: boolean;
            comments?: string;
        };
        need: {
            painPoints: string[];
            priority: 'low' | 'medium' | 'high' | 'critical';
            businessImpact?: string;
        };
        timeline: {
            targetClose?: Date;
            buyingStage: 'awareness' | 'consideration' | 'decision' | 'none';
            urgency: 'low' | 'medium' | 'high';
        };
    };
    notes: string;
    disqualifyReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IOutreach {
    id: string;
    tenantId: string;
    leadId: string;
    channel: OutreachChannel;
    status: OutreachStatus;
    subject?: string;
    body: string;
    templateId?: string;
    personalization?: Record<string, string>;
    sentAt?: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    clickedAt?: Date;
    repliedAt?: Date;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IFollowup {
    id: string;
    tenantId: string;
    leadId: string;
    outreachId?: string;
    channel: OutreachChannel;
    status: FollowupStatus;
    scheduledFor: Date;
    message?: string;
    sentAt?: Date;
    completedAt?: Date;
    skippedReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IProspect {
    id: string;
    tenantId: string;
    contact: IContact;
    company: ICompany;
    matchScore: number;
    matchReasons: string[];
    scrapedAt: Date;
    createdAt: Date;
}
export interface ISDRMetrics {
    totalProspectsFound: number;
    totalContactsReached: number;
    totalQualified: number;
    totalDisqualified: number;
    totalMeetingsBooked: number;
    conversionRate: number;
    avgResponseRate: number;
    avgTimeToQualify: number;
    outreachByChannel: Record<OutreachChannel, {
        sent: number;
        opened: number;
        replied: number;
        conversionRate: number;
    }>;
    stageDistribution: Record<LeadStage, number>;
}
export interface ProspectFindRequest {
    search: z.infer<typeof ProspectSearchSchema>;
    limit?: number;
    offset?: number;
}
export interface ProspectFindResponse {
    success: boolean;
    data?: {
        prospects: IProspect[];
        total: number;
        hasMore: boolean;
    };
    error?: {
        code: string;
        message: string;
    };
}
export interface QualifyLeadRequest {
    leadId: string;
    qualification: z.infer<typeof QualificationSchema>;
}
export interface OutreachSendRequest {
    leadId: string;
    channel: OutreachChannel;
    message: z.infer<typeof OutreachMessageSchema>;
    scheduleFor?: string;
}
export interface FollowupScheduleRequest {
    leadId: string;
    followups: z.infer<typeof FollowupScheduleSchema>[];
}
export interface LeadListRequest {
    stage?: LeadStage;
    source?: LeadSource;
    score?: LeadScore;
    assignedTo?: string;
    limit?: number;
    offset?: number;
}
export interface LeadStageUpdateRequest {
    stage: LeadStage;
    notes?: string;
}
export interface CRMConfig {
    provider: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'custom';
    apiKey: string;
    apiSecret?: string;
    instanceUrl?: string;
    webhookSecret?: string;
}
export interface CRMSyncResult {
    success: boolean;
    crmContactId?: string;
    crmLeadId?: string;
    syncedAt?: Date;
    error?: string;
}
export interface TenantContext {
    tenantId: string;
    userId?: string;
    roles?: string[];
}
export interface SDRAgentConfig {
    tenantId: string;
    ownerId: string;
    defaultChannels: OutreachChannel[];
    followupSchedule: {
        days: number[];
        hours: number[];
        timezone: string;
    };
    scoringWeights: {
        companyMatch: number;
        roleMatch: number;
        engagement: number;
        intent: number;
    };
}
//# sourceMappingURL=index.d.ts.map