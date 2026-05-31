export declare class MessageService {
    send(data: {
        tenantId: string;
        channel: string;
        recipient: string;
        subject?: string;
        body: string;
        type?: string;
        priority?: string;
        media?: any;
        templateId?: string;
        templateVariables?: Record<string, any>;
        scheduledAt?: Date;
        tags?: string[];
        metadata?: Record<string, any>;
    }): Promise<Message>;
    sendTemplate(data: {
        tenantId: string;
        channel: string;
        recipient: string;
        templateId: string;
        variables?: Record<string, any>;
    }): Promise<Message>;
    get(messageId: string, tenantId: string): Promise<Message | null>;
    list(tenantId: string, options?: {
        channel?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        messages: Message[];
        total: number;
    }>;
    updateStatus(messageId: string, status: string, additionalData?: any): Promise<Message | null>;
    getStats(tenantId: string, channel?: string): Promise<any>;
    private simulateSend;
}
export declare const messageService: MessageService;
export declare class TemplateService {
    create(data: {
        tenantId: string;
        name: string;
        channel: string;
        category: string;
        body: string;
        subject?: string;
        variables?: any[];
        whatsappHeader?: string;
        whatsappFooter?: string;
    }): Promise<Template>;
    get(templateId: string, tenantId: string): Promise<Template | null>;
    list(tenantId: string, options?: {
        channel?: string;
        category?: string;
        status?: string;
    }): Promise<{
        templates: Template[];
        total: number;
    }>;
    update(templateId: string, tenantId: string, updates: any): Promise<Template | null>;
    delete(templateId: string, tenantId: string): Promise<boolean>;
}
export declare const templateService: TemplateService;
export declare class CampaignService {
    create(data: {
        tenantId: string;
        name: string;
        channel: string;
        body: string;
        subject?: string;
        templateId?: string;
        segmentIds: string[];
        scheduledAt?: Date;
        abTest?: any;
    }): Promise<Campaign>;
    get(campaignId: string, tenantId: string): Promise<Campaign | null>;
    list(tenantId: string, options?: {
        channel?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        campaigns: Campaign[];
        total: number;
    }>;
    start(campaignId: string, tenantId: string): Promise<Campaign | null>;
    pause(campaignId: string, tenantId: string): Promise<Campaign | null>;
    cancel(campaignId: string, tenantId: string): Promise<Campaign | null>;
    updateStats(campaignId: string, stats: any): Promise<Campaign | null>;
    private simulateCampaign;
}
export declare const campaignService: CampaignService;
export declare class SubscriberService {
    create(data: {
        tenantId: string;
        email?: string;
        phone?: string;
        channels?: string[];
        tags?: string[];
    }): Promise<Subscriber>;
    get(subscriberId: string, tenantId: string): Promise<Subscriber | null>;
    findByEmail(email: string, tenantId: string): Promise<Subscriber | null>;
    findByPhone(phone: string, tenantId: string): Promise<Subscriber | null>;
    unsubscribe(subscriberId: string, tenantId: string, channel?: string): Promise<Subscriber | null>;
    list(tenantId: string, options?: {
        segment?: string;
        tag?: string;
        subscribed?: boolean;
    }): Promise<{
        subscribers: Subscriber[];
        total: number;
    }>;
}
export declare const subscriberService: SubscriberService;
//# sourceMappingURL=MessageService.d.ts.map