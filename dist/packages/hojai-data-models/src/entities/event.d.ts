/**
 * Hojai Data Models - Event, Workflow, Agent, Campaign Entities
 * Version: 1.0.0 | Date: May 30, 2026
 *
 * Event: System events across the platform
 * Workflow: Automation workflows
 * Agent: AI employees
 * Campaign: Marketing campaigns
 */
import { z } from 'zod';
export type EventCategory = 'commerce' | 'identity' | 'loyalty' | 'engagement' | 'support' | 'communication' | 'ai' | 'workflow' | 'system';
export type EventActorType = 'customer' | 'user' | 'ai' | 'system';
export interface Event {
    id: string;
    tenant_id: string;
    type: string;
    category: EventCategory;
    source: string;
    subject_type?: string;
    subject_id?: string;
    actor_type?: EventActorType;
    actor_id?: string;
    data: Record<string, unknown>;
    diff?: Record<string, {
        before: unknown;
        after: unknown;
    }>;
    correlation_id?: string;
    causation_id?: string;
    location_id?: string;
    occurred_at: string;
    created_at: string;
    expires_at?: string;
}
export declare function createEvent(tenantId: string, type: string, category: EventCategory, source: string, data: Record<string, unknown>, options?: Partial<Omit<Event, 'id' | 'tenant_id' | 'type' | 'category' | 'source' | 'data' | 'created_at'>>): Event;
export type WorkflowType = 'automation' | 'sequence' | 'broadcast' | 'reaction';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'stopped';
export type WorkflowTriggerType = 'event' | 'schedule' | 'manual' | 'api';
export type WorkflowStepType = 'message' | 'delay' | 'condition' | 'action' | 'ai';
export interface WorkflowTrigger {
    type: WorkflowTriggerType;
    event_type?: string;
    schedule_cron?: string;
    schedule_timezone?: string;
}
export interface WorkflowStep {
    id: string;
    order: number;
    type: WorkflowStepType;
    config: Record<string, unknown>;
}
export interface Workflow {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    type: WorkflowType;
    status: WorkflowStatus;
    trigger: WorkflowTrigger;
    steps: WorkflowStep[];
    version: number;
    created_by: string;
    created_at: string;
    updated_at: string;
    last_executed_at?: string;
}
export interface WorkflowExecution {
    id: string;
    workflow_id: string;
    tenant_id: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    current_step: number;
    context: Record<string, unknown>;
    started_at: string;
    completed_at?: string;
    error?: string;
}
export declare const WorkflowCreateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["automation", "sequence", "broadcast", "reaction"]>;
    trigger: z.ZodObject<{
        type: z.ZodEnum<["event", "schedule", "manual", "api"]>;
        event_type: z.ZodOptional<z.ZodString>;
        schedule_cron: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "manual" | "event" | "schedule" | "api";
        event_type?: string | undefined;
        schedule_cron?: string | undefined;
    }, {
        type: "manual" | "event" | "schedule" | "api";
        event_type?: string | undefined;
        schedule_cron?: string | undefined;
    }>;
    steps: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["message", "delay", "condition", "action", "ai"]>;
        config: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        type: "ai" | "message" | "delay" | "condition" | "action";
        config: Record<string, unknown>;
    }, {
        type: "ai" | "message" | "delay" | "condition" | "action";
        config: Record<string, unknown>;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "automation" | "sequence" | "broadcast" | "reaction";
    trigger: {
        type: "manual" | "event" | "schedule" | "api";
        event_type?: string | undefined;
        schedule_cron?: string | undefined;
    };
    steps: {
        type: "ai" | "message" | "delay" | "condition" | "action";
        config: Record<string, unknown>;
    }[];
    description?: string | undefined;
}, {
    name: string;
    type: "automation" | "sequence" | "broadcast" | "reaction";
    trigger: {
        type: "manual" | "event" | "schedule" | "api";
        event_type?: string | undefined;
        schedule_cron?: string | undefined;
    };
    steps: {
        type: "ai" | "message" | "delay" | "condition" | "action";
        config: Record<string, unknown>;
    }[];
    description?: string | undefined;
}>;
export declare function createWorkflow(tenantId: string, createdBy: string, data: z.infer<typeof WorkflowCreateSchema>): Workflow;
export type AgentType = 'support' | 'sales' | 'booking' | 'marketing' | 'retention' | 'care';
export type AgentStatus = 'active' | 'training' | 'inactive';
export interface AgentConfig {
    working_hours: {
        enabled: boolean;
        timezone: string;
        schedule: {
            day: number;
            start: string;
            end: string;
        }[];
    };
    channels: string[];
    languages: string[];
    handoff: {
        enabled: boolean;
        conditions: {
            type: string;
            value: unknown;
        }[];
        message: string;
    };
    max_response_time_seconds: number;
}
export interface AgentBehavior {
    tone: 'formal' | 'friendly' | 'casual';
    use_emoji: boolean;
    max_response_length: number;
    traits: string[];
    disallowed_topics: string[];
}
export interface AgentStats {
    total_conversations: number;
    resolved_conversations: number;
    escalated_conversations: number;
    avg_resolution_time_minutes: number;
    avg_csat_score: number;
}
export interface Agent {
    id: string;
    tenant_id: string;
    name: string;
    title?: string;
    avatar_url?: string;
    description?: string;
    type: AgentType;
    status: AgentStatus;
    version: number;
    config: AgentConfig;
    behavior: AgentBehavior;
    knowledge_base_ids: string[];
    fallback_agent_id?: string;
    stats: AgentStats;
    created_by: string;
    created_at: string;
    updated_at: string;
    last_trained_at?: string;
}
export declare const AgentCreateSchema: z.ZodObject<{
    name: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["support", "sales", "booking", "marketing", "retention", "care"]>;
    description: z.ZodOptional<z.ZodString>;
    config: z.ZodObject<{
        working_hours: z.ZodObject<{
            enabled: z.ZodBoolean;
            timezone: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            timezone: string;
        }, {
            enabled: boolean;
            timezone: string;
        }>;
        channels: z.ZodArray<z.ZodString, "many">;
        languages: z.ZodArray<z.ZodString, "many">;
        handoff: z.ZodObject<{
            enabled: z.ZodBoolean;
            message: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            message: string;
            enabled: boolean;
        }, {
            message: string;
            enabled: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        handoff: {
            message: string;
            enabled: boolean;
        };
        channels: string[];
        working_hours: {
            enabled: boolean;
            timezone: string;
        };
        languages: string[];
    }, {
        handoff: {
            message: string;
            enabled: boolean;
        };
        channels: string[];
        working_hours: {
            enabled: boolean;
            timezone: string;
        };
        languages: string[];
    }>;
    behavior: z.ZodObject<{
        tone: z.ZodEnum<["formal", "friendly", "casual"]>;
        use_emoji: z.ZodBoolean;
        max_response_length: z.ZodNumber;
        traits: z.ZodArray<z.ZodString, "many">;
        disallowed_topics: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        tone: "formal" | "friendly" | "casual";
        use_emoji: boolean;
        max_response_length: number;
        traits: string[];
        disallowed_topics: string[];
    }, {
        tone: "formal" | "friendly" | "casual";
        use_emoji: boolean;
        max_response_length: number;
        traits: string[];
        disallowed_topics: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    behavior: {
        tone: "formal" | "friendly" | "casual";
        use_emoji: boolean;
        max_response_length: number;
        traits: string[];
        disallowed_topics: string[];
    };
    name: string;
    type: "support" | "sales" | "booking" | "marketing" | "retention" | "care";
    config: {
        handoff: {
            message: string;
            enabled: boolean;
        };
        channels: string[];
        working_hours: {
            enabled: boolean;
            timezone: string;
        };
        languages: string[];
    };
    title?: string | undefined;
    description?: string | undefined;
}, {
    behavior: {
        tone: "formal" | "friendly" | "casual";
        use_emoji: boolean;
        max_response_length: number;
        traits: string[];
        disallowed_topics: string[];
    };
    name: string;
    type: "support" | "sales" | "booking" | "marketing" | "retention" | "care";
    config: {
        handoff: {
            message: string;
            enabled: boolean;
        };
        channels: string[];
        working_hours: {
            enabled: boolean;
            timezone: string;
        };
        languages: string[];
    };
    title?: string | undefined;
    description?: string | undefined;
}>;
export declare function createAgent(tenantId: string, createdBy: string, data: z.infer<typeof AgentCreateSchema>): Agent;
export type CampaignType = 'broadcast' | 'triggered' | 'automated' | 'personalized';
export type CampaignChannel = 'whatsapp' | 'email' | 'sms' | 'push';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
export interface CampaignContent {
    subject?: string;
    body: string;
    media?: {
        type: string;
        url: string;
    };
    buttons?: {
        text: string;
        action: string;
    }[];
}
export interface CampaignStats {
    audience_size: number;
    sent: number;
    delivered: number;
    opened?: number;
    clicked?: number;
    converted?: number;
    failed: number;
    opted_out: number;
}
export interface Campaign {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    type: CampaignType;
    channel: CampaignChannel;
    segments: string[];
    exclusion_segments?: string[];
    content: CampaignContent;
    status: CampaignStatus;
    scheduled_at?: string;
    started_at?: string;
    completed_at?: string;
    budget?: number;
    stats: CampaignStats;
    created_by: string;
    created_at: string;
    updated_at: string;
}
export declare const CampaignCreateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["broadcast", "triggered", "automated", "personalized"]>;
    channel: z.ZodEnum<["whatsapp", "email", "sms", "push"]>;
    segments: z.ZodArray<z.ZodString, "many">;
    content: z.ZodObject<{
        subject: z.ZodOptional<z.ZodString>;
        body: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        body: string;
        subject?: string | undefined;
    }, {
        body: string;
        subject?: string | undefined;
    }>;
    scheduled_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "broadcast" | "triggered" | "automated" | "personalized";
    channel: "push" | "whatsapp" | "sms" | "email";
    segments: string[];
    content: {
        body: string;
        subject?: string | undefined;
    };
    description?: string | undefined;
    scheduled_at?: string | undefined;
}, {
    name: string;
    type: "broadcast" | "triggered" | "automated" | "personalized";
    channel: "push" | "whatsapp" | "sms" | "email";
    segments: string[];
    content: {
        body: string;
        subject?: string | undefined;
    };
    description?: string | undefined;
    scheduled_at?: string | undefined;
}>;
export declare function createCampaign(tenantId: string, createdBy: string, data: z.infer<typeof CampaignCreateSchema>): Campaign;
//# sourceMappingURL=event.d.ts.map