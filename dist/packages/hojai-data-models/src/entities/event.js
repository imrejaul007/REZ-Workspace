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
export function createEvent(tenantId, type, category, source, data, options) {
    const now = new Date().toISOString();
    return {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        type,
        category,
        source,
        data,
        occurred_at: now,
        created_at: now,
        ...options,
    };
}
export const WorkflowCreateSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['automation', 'sequence', 'broadcast', 'reaction']),
    trigger: z.object({
        type: z.enum(['event', 'schedule', 'manual', 'api']),
        event_type: z.string().optional(),
        schedule_cron: z.string().optional(),
    }),
    steps: z.array(z.object({
        type: z.enum(['message', 'delay', 'condition', 'action', 'ai']),
        config: z.record(z.unknown()),
    })),
});
export function createWorkflow(tenantId, createdBy, data) {
    const now = new Date().toISOString();
    return {
        id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        name: data.name,
        description: data.description,
        type: data.type,
        status: 'draft',
        trigger: data.trigger,
        steps: data.steps.map((s, i) => ({
            ...s,
            id: `step_${i}`,
            order: i,
        })),
        version: 1,
        created_by: createdBy,
        created_at: now,
        updated_at: now,
    };
}
export const AgentCreateSchema = z.object({
    name: z.string().min(1),
    title: z.string().optional(),
    type: z.enum(['support', 'sales', 'booking', 'marketing', 'retention', 'care']),
    description: z.string().optional(),
    config: z.object({
        working_hours: z.object({
            enabled: z.boolean(),
            timezone: z.string(),
        }),
        channels: z.array(z.string()),
        languages: z.array(z.string()),
        handoff: z.object({
            enabled: z.boolean(),
            message: z.string(),
        }),
    }),
    behavior: z.object({
        tone: z.enum(['formal', 'friendly', 'casual']),
        use_emoji: z.boolean(),
        max_response_length: z.number(),
        traits: z.array(z.string()),
        disallowed_topics: z.array(z.string()),
    }),
});
export function createAgent(tenantId, createdBy, data) {
    const now = new Date().toISOString();
    return {
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        name: data.name,
        title: data.title,
        description: data.description,
        type: data.type,
        status: 'inactive',
        version: 1,
        config: {
            working_hours: data.config.working_hours,
            channels: data.config.channels,
            languages: data.config.languages,
            handoff: {
                ...data.config.handoff,
                conditions: [],
            },
            max_response_time_seconds: 30,
        },
        behavior: data.behavior,
        knowledge_base_ids: [],
        stats: {
            total_conversations: 0,
            resolved_conversations: 0,
            escalated_conversations: 0,
            avg_resolution_time_minutes: 0,
            avg_csat_score: 0,
        },
        created_by: createdBy,
        created_at: now,
        updated_at: now,
    };
}
export const CampaignCreateSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['broadcast', 'triggered', 'automated', 'personalized']),
    channel: z.enum(['whatsapp', 'email', 'sms', 'push']),
    segments: z.array(z.string()).min(1),
    content: z.object({
        subject: z.string().optional(),
        body: z.string().min(1),
    }),
    scheduled_at: z.string().datetime().optional(),
});
export function createCampaign(tenantId, createdBy, data) {
    const now = new Date().toISOString();
    return {
        id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        name: data.name,
        description: data.description,
        type: data.type,
        channel: data.channel,
        segments: data.segments,
        content: data.content,
        status: data.scheduled_at ? 'scheduled' : 'draft',
        scheduled_at: data.scheduled_at,
        stats: {
            audience_size: 0,
            sent: 0,
            delivered: 0,
            failed: 0,
            opted_out: 0,
        },
        created_by: createdBy,
        created_at: now,
        updated_at: now,
    };
}
//# sourceMappingURL=event.js.map