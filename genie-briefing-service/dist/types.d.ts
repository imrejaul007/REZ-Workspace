/**
 * GENIE Briefing Service - Type Definitions
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Daily briefings (morning + evening) for GENIE Personal Intelligence OS
 *
 * Tagline: "You don't use Genie. You talk to Genie."
 */
import { z } from 'zod';
/**
 * Briefing Types
 */
export type BriefingType = 'morning' | 'evening';
/**
 * Section Types
 */
export type SectionType = 'calendar' | 'tasks' | 'followups' | 'weather' | 'insights' | 'reminders';
/**
 * Priority Levels
 */
export type PriorityLevel = 'high' | 'medium' | 'low';
/**
 * Briefing Item Input (for creation - id is optional)
 */
export interface BriefingItemInput {
    id?: string;
    title: string;
    description?: string;
    priority?: PriorityLevel;
    completed?: boolean;
    action_url?: string;
}
/**
 * Briefing Section Input (for creation)
 */
export interface BriefingSectionInput {
    type: SectionType;
    title: string;
    items: BriefingItemInput[];
}
/**
 * Briefing Interface (output - all fields required)
 */
export interface Briefing {
    id: string;
    user_id: string;
    type: BriefingType;
    date: string;
    sections: BriefingSection[];
    summary: string;
    created_at: string;
    updated_at?: string;
}
/**
 * Briefing Section Interface (output)
 */
export interface BriefingSection {
    type: SectionType;
    title: string;
    items: BriefingItem[];
}
/**
 * Briefing Item Interface (output)
 */
export interface BriefingItem {
    id: string;
    title: string;
    description?: string;
    priority?: PriorityLevel;
    completed?: boolean;
    action_url?: string;
}
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: {
        timestamp: string;
        requestId: string;
        tenantId?: string;
    };
}
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: {
        timestamp: string;
        requestId: string;
        tenantId?: string;
    };
}
export interface PaginatedResponse<T> extends APIResponse<T[]> {
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        hasMore: boolean;
    };
}
export declare const BriefingTypeSchema: z.ZodEnum<["morning", "evening"]>;
export declare const SectionTypeSchema: z.ZodEnum<["calendar", "tasks", "followups", "weather", "insights", "reminders"]>;
export declare const PriorityLevelSchema: z.ZodEnum<["high", "medium", "low"]>;
export declare const BriefingItemSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
    completed: z.ZodOptional<z.ZodBoolean>;
    action_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    title: string;
    id?: string | undefined;
    description?: string | undefined;
    priority?: "high" | "medium" | "low" | undefined;
    completed?: boolean | undefined;
    action_url?: string | undefined;
}, {
    title: string;
    id?: string | undefined;
    description?: string | undefined;
    priority?: "high" | "medium" | "low" | undefined;
    completed?: boolean | undefined;
    action_url?: string | undefined;
}>, {
    id: string;
    title: string;
    description: string | undefined;
    priority: "high" | "medium" | "low" | undefined;
    completed: boolean | undefined;
    action_url: string | undefined;
}, {
    title: string;
    id?: string | undefined;
    description?: string | undefined;
    priority?: "high" | "medium" | "low" | undefined;
    completed?: boolean | undefined;
    action_url?: string | undefined;
}>;
export declare const BriefingSectionSchema: z.ZodObject<{
    type: z.ZodEnum<["calendar", "tasks", "followups", "weather", "insights", "reminders"]>;
    title: z.ZodString;
    items: z.ZodDefault<z.ZodArray<z.ZodEffects<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
        completed: z.ZodOptional<z.ZodBoolean>;
        action_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        id?: string | undefined;
        description?: string | undefined;
        priority?: "high" | "medium" | "low" | undefined;
        completed?: boolean | undefined;
        action_url?: string | undefined;
    }, {
        title: string;
        id?: string | undefined;
        description?: string | undefined;
        priority?: "high" | "medium" | "low" | undefined;
        completed?: boolean | undefined;
        action_url?: string | undefined;
    }>, {
        id: string;
        title: string;
        description: string | undefined;
        priority: "high" | "medium" | "low" | undefined;
        completed: boolean | undefined;
        action_url: string | undefined;
    }, {
        title: string;
        id?: string | undefined;
        description?: string | undefined;
        priority?: "high" | "medium" | "low" | undefined;
        completed?: boolean | undefined;
        action_url?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    type: "calendar" | "tasks" | "followups" | "weather" | "insights" | "reminders";
    items: {
        id: string;
        title: string;
        description: string | undefined;
        priority: "high" | "medium" | "low" | undefined;
        completed: boolean | undefined;
        action_url: string | undefined;
    }[];
}, {
    title: string;
    type: "calendar" | "tasks" | "followups" | "weather" | "insights" | "reminders";
    items?: {
        title: string;
        id?: string | undefined;
        description?: string | undefined;
        priority?: "high" | "medium" | "low" | undefined;
        completed?: boolean | undefined;
        action_url?: string | undefined;
    }[] | undefined;
}>;
export declare const CreateBriefingSchema: z.ZodObject<{
    type: z.ZodEnum<["morning", "evening"]>;
    date: z.ZodString;
    sections: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["calendar", "tasks", "followups", "weather", "insights", "reminders"]>;
        title: z.ZodString;
        items: z.ZodDefault<z.ZodArray<z.ZodEffects<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            title: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
            completed: z.ZodOptional<z.ZodBoolean>;
            action_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            id?: string | undefined;
            description?: string | undefined;
            priority?: "high" | "medium" | "low" | undefined;
            completed?: boolean | undefined;
            action_url?: string | undefined;
        }, {
            title: string;
            id?: string | undefined;
            description?: string | undefined;
            priority?: "high" | "medium" | "low" | undefined;
            completed?: boolean | undefined;
            action_url?: string | undefined;
        }>, {
            id: string;
            title: string;
            description: string | undefined;
            priority: "high" | "medium" | "low" | undefined;
            completed: boolean | undefined;
            action_url: string | undefined;
        }, {
            title: string;
            id?: string | undefined;
            description?: string | undefined;
            priority?: "high" | "medium" | "low" | undefined;
            completed?: boolean | undefined;
            action_url?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        type: "calendar" | "tasks" | "followups" | "weather" | "insights" | "reminders";
        items: {
            id: string;
            title: string;
            description: string | undefined;
            priority: "high" | "medium" | "low" | undefined;
            completed: boolean | undefined;
            action_url: string | undefined;
        }[];
    }, {
        title: string;
        type: "calendar" | "tasks" | "followups" | "weather" | "insights" | "reminders";
        items?: {
            title: string;
            id?: string | undefined;
            description?: string | undefined;
            priority?: "high" | "medium" | "low" | undefined;
            completed?: boolean | undefined;
            action_url?: string | undefined;
        }[] | undefined;
    }>, "many">>;
    summary: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "morning" | "evening";
    date: string;
    sections: {
        title: string;
        type: "calendar" | "tasks" | "followups" | "weather" | "insights" | "reminders";
        items: {
            id: string;
            title: string;
            description: string | undefined;
            priority: "high" | "medium" | "low" | undefined;
            completed: boolean | undefined;
            action_url: string | undefined;
        }[];
    }[];
    summary?: string | undefined;
}, {
    type: "morning" | "evening";
    date: string;
    sections?: {
        title: string;
        type: "calendar" | "tasks" | "followups" | "weather" | "insights" | "reminders";
        items?: {
            title: string;
            id?: string | undefined;
            description?: string | undefined;
            priority?: "high" | "medium" | "low" | undefined;
            completed?: boolean | undefined;
            action_url?: string | undefined;
        }[] | undefined;
    }[] | undefined;
    summary?: string | undefined;
}>;
export declare const UpdateBriefingSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["morning", "evening"]>>;
    date: z.ZodOptional<z.ZodString>;
    sections: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["calendar", "tasks", "followups", "weather", "insights", "reminders"]>;
        title: z.ZodString;
        items: z.ZodDefault<z.ZodArray<z.ZodEffects<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            title: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
            completed: z.ZodOptional<z.ZodBoolean>;
            action_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            id?: string | undefined;
            description?: string | undefined;
            priority?: "high" | "medium" | "low" | undefined;
            completed?: boolean | undefined;
            action_url?: string | undefined;
        }, {
            title: string;
            id?: string | undefined;
            description?: string | undefined;
            priority?: "high" | "medium" | "low" | undefined;
            completed?: boolean | undefined;
            action_url?: string | undefined;
        }>, {
            id: string;
            title: string;
            description: string | undefined;
            priority: "high" | "medium" | "low" | undefined;
            completed: boolean | undefined;
            action_url: string | undefined;
        }, {
            title: string;
            id?: string | undefined;
            description?: string | undefined;
            priority?: "high" | "medium" | "low" | undefined;
            completed?: boolean | undefined;
            action_url?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        type: "calendar" | "tasks" | "followups" | "weather" | "insights" | "reminders";
        items: {
            id: string;
            title: string;
            description: string | undefined;
            priority: "high" | "medium" | "low" | undefined;
            completed: boolean | undefined;
            action_url: string | undefined;
        }[];
    }, {
        title: string;
        type: "calendar" | "tasks" | "followups" | "weather" | "insights" | "reminders";
        items?: {
            title: string;
            id?: string | undefined;
            description?: string | undefined;
            priority?: "high" | "medium" | "low" | undefined;
            completed?: boolean | undefined;
            action_url?: string | undefined;
        }[] | undefined;
    }>, "many">>;
    summary: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "morning" | "evening" | undefined;
    date?: string | undefined;
    sections?: {
        title: string;
        type: "calendar" | "tasks" | "followups" | "weather" | "insights" | "reminders";
        items: {
            id: string;
            title: string;
            description: string | undefined;
            priority: "high" | "medium" | "low" | undefined;
            completed: boolean | undefined;
            action_url: string | undefined;
        }[];
    }[] | undefined;
    summary?: string | undefined;
}, {
    type?: "morning" | "evening" | undefined;
    date?: string | undefined;
    sections?: {
        title: string;
        type: "calendar" | "tasks" | "followups" | "weather" | "insights" | "reminders";
        items?: {
            title: string;
            id?: string | undefined;
            description?: string | undefined;
            priority?: "high" | "medium" | "low" | undefined;
            completed?: boolean | undefined;
            action_url?: string | undefined;
        }[] | undefined;
    }[] | undefined;
    summary?: string | undefined;
}>;
export declare const GenerateBriefingSchema: z.ZodObject<{
    type: z.ZodEnum<["morning", "evening"]>;
    user_id: z.ZodString;
    date: z.ZodOptional<z.ZodString>;
    include_sections: z.ZodOptional<z.ZodArray<z.ZodEnum<["calendar", "tasks", "followups", "weather", "insights", "reminders"]>, "many">>;
    preferences: z.ZodOptional<z.ZodObject<{
        format: z.ZodDefault<z.ZodEnum<["concise", "detailed"]>>;
        tone: z.ZodDefault<z.ZodEnum<["formal", "casual", "friendly"]>>;
    }, "strip", z.ZodTypeAny, {
        format: "concise" | "detailed";
        tone: "formal" | "casual" | "friendly";
    }, {
        format?: "concise" | "detailed" | undefined;
        tone?: "formal" | "casual" | "friendly" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "morning" | "evening";
    user_id: string;
    date?: string | undefined;
    include_sections?: ("calendar" | "tasks" | "followups" | "weather" | "insights" | "reminders")[] | undefined;
    preferences?: {
        format: "concise" | "detailed";
        tone: "formal" | "casual" | "friendly";
    } | undefined;
}, {
    type: "morning" | "evening";
    user_id: string;
    date?: string | undefined;
    include_sections?: ("calendar" | "tasks" | "followups" | "weather" | "insights" | "reminders")[] | undefined;
    preferences?: {
        format?: "concise" | "detailed" | undefined;
        tone?: "formal" | "casual" | "friendly" | undefined;
    } | undefined;
}>;
export declare const GetBriefingQuerySchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    date?: string | undefined;
}, {
    date?: string | undefined;
}>;
export declare const ListBriefingsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["morning", "evening"]>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    type?: "morning" | "evening" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    type?: "morning" | "evening" | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export type CreateBriefingInput = z.infer<typeof CreateBriefingSchema>;
export type UpdateBriefingInput = z.infer<typeof UpdateBriefingSchema>;
export type GenerateBriefingInput = z.infer<typeof GenerateBriefingSchema>;
export type GetBriefingQuery = z.infer<typeof GetBriefingQuerySchema>;
export type ListBriefingsQuery = z.infer<typeof ListBriefingsQuerySchema>;
export interface TenantContext {
    tenant_id: string;
    namespace: string;
    user_id?: string;
    plan?: 'starter' | 'professional' | 'enterprise';
    roles?: string[];
}
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
            userId?: string;
        }
    }
}
//# sourceMappingURL=types.d.ts.map