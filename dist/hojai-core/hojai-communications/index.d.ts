/**
 * Hojai Communications Platform
 *
 * Unified messaging: WhatsApp, SMS, Email, Push, Voice
 *
 * PORT: 4570
 */
export type Channel = 'whatsapp' | 'sms' | 'email' | 'push' | 'voice';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export interface Message {
    id: string;
    tenant_id: string;
    channel: Channel;
    recipient: string;
    template_id?: string;
    subject?: string;
    content: string;
    media?: {
        type: string;
        url: string;
    };
    status: MessageStatus;
    sent_at?: string;
    delivered_at?: string;
    read_at?: string;
    metadata?: Record<string, any>;
    created_at: string;
}
export interface Template {
    id: string;
    tenant_id: string;
    name: string;
    channel: Channel;
    body: string;
    variables?: string[];
    status: 'active' | 'inactive';
}
export interface Campaign {
    id: string;
    tenant_id: string;
    name: string;
    channel: Channel;
    template_id: string;
    segments: string[];
    status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
    stats: {
        total: number;
        sent: number;
        delivered: number;
        read: number;
        failed: number;
    };
    scheduled_at?: string;
    started_at?: string;
    completed_at?: string;
}
export declare class HojaiCommunicationsPlatform {
    /**
     * Send message
     */
    sendMessage(tenantId: string, data: {
        channel: Channel;
        recipient: string;
        content: string;
        template_id?: string;
        subject?: string;
        media?: {
            type: string;
            url: string;
        };
    }): Promise<Message>;
    /**
     * Send template message
     */
    sendTemplate(tenantId: string, data: {
        channel: Channel;
        recipient: string;
        template_id: string;
        variables?: Record<string, string>;
    }): Promise<Message>;
    /**
     * Get message
     */
    getMessage(tenantId: string, messageId: string): Promise<Message | null>;
    /**
     * List messages
     */
    listMessages(tenantId: string, options?: {
        channel?: Channel;
        status?: MessageStatus;
        limit?: number;
    }): Promise<Message[]>;
    /**
     * Create template
     */
    createTemplate(tenantId: string, data: {
        name: string;
        channel: Channel;
        body: string;
        variables?: string[];
    }): Promise<Template>;
    /**
     * List templates
     */
    listTemplates(tenantId: string, channel?: Channel): Promise<Template[]>;
    /**
     * Create campaign
     */
    createCampaign(tenantId: string, data: {
        name: string;
        channel: Channel;
        template_id: string;
        segments: string[];
        scheduled_at?: string;
    }): Promise<Campaign>;
    /**
     * Start campaign
     */
    startCampaign(tenantId: string, campaignId: string): Promise<Campaign | null>;
    /**
     * Get campaign stats
     */
    getCampaignStats(tenantId: string, campaignId: string): Promise<Campaign | null>;
    private simulateSend;
    private simulateCampaign;
    private generateId;
    private auditLog;
}
export declare function createCommunicationsRoutes(platform: HojaiCommunicationsPlatform): import("express-serve-static-core").Router;
export declare function bootstrap(port?: number): Promise<{
    platform: HojaiCommunicationsPlatform;
    app: import("express-serve-static-core").Express;
}>;
declare const _default: {
    HojaiCommunicationsPlatform: typeof HojaiCommunicationsPlatform;
    createCommunicationsRoutes: typeof createCommunicationsRoutes;
    bootstrap: typeof bootstrap;
};
export default _default;
//# sourceMappingURL=index.d.ts.map