import mongoose from 'mongoose';
import { Message, Template, Campaign, Channel, MessageStatus } from '../types/index.js';
export declare const MessageModel: mongoose.Model<{
    to: string;
    body: string;
    channel: Channel;
    status: MessageStatus;
    tenantId: string;
    direction: "inbound" | "outbound";
    from: string;
    error?: string | null | undefined;
    subject?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    cost?: number | null | undefined;
    externalId?: string | null | undefined;
    templateId?: string | null | undefined;
    variables?: Map<string, string> | null | undefined;
    externalStatus?: string | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    sentAt?: NativeDate | null | undefined;
    deliveredAt?: NativeDate | null | undefined;
    readAt?: NativeDate | null | undefined;
    errorCode?: string | null | undefined;
    segments?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    to: string;
    body: string;
    channel: Channel;
    status: MessageStatus;
    tenantId: string;
    direction: "inbound" | "outbound";
    from: string;
    error?: string | null | undefined;
    subject?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    cost?: number | null | undefined;
    externalId?: string | null | undefined;
    templateId?: string | null | undefined;
    variables?: Map<string, string> | null | undefined;
    externalStatus?: string | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    sentAt?: NativeDate | null | undefined;
    deliveredAt?: NativeDate | null | undefined;
    readAt?: NativeDate | null | undefined;
    errorCode?: string | null | undefined;
    segments?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    to: string;
    body: string;
    channel: Channel;
    status: MessageStatus;
    tenantId: string;
    direction: "inbound" | "outbound";
    from: string;
    error?: string | null | undefined;
    subject?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    cost?: number | null | undefined;
    externalId?: string | null | undefined;
    templateId?: string | null | undefined;
    variables?: Map<string, string> | null | undefined;
    externalStatus?: string | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    sentAt?: NativeDate | null | undefined;
    deliveredAt?: NativeDate | null | undefined;
    readAt?: NativeDate | null | undefined;
    errorCode?: string | null | undefined;
    segments?: number | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    to: string;
    body: string;
    channel: Channel;
    status: MessageStatus;
    tenantId: string;
    direction: "inbound" | "outbound";
    from: string;
    error?: string | null | undefined;
    subject?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    cost?: number | null | undefined;
    externalId?: string | null | undefined;
    templateId?: string | null | undefined;
    variables?: Map<string, string> | null | undefined;
    externalStatus?: string | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    sentAt?: NativeDate | null | undefined;
    deliveredAt?: NativeDate | null | undefined;
    readAt?: NativeDate | null | undefined;
    errorCode?: string | null | undefined;
    segments?: number | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    to: string;
    body: string;
    channel: Channel;
    status: MessageStatus;
    tenantId: string;
    direction: "inbound" | "outbound";
    from: string;
    error?: string | null | undefined;
    subject?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    cost?: number | null | undefined;
    externalId?: string | null | undefined;
    templateId?: string | null | undefined;
    variables?: Map<string, string> | null | undefined;
    externalStatus?: string | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    sentAt?: NativeDate | null | undefined;
    deliveredAt?: NativeDate | null | undefined;
    readAt?: NativeDate | null | undefined;
    errorCode?: string | null | undefined;
    segments?: number | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    to: string;
    body: string;
    channel: Channel;
    status: MessageStatus;
    tenantId: string;
    direction: "inbound" | "outbound";
    from: string;
    error?: string | null | undefined;
    subject?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    cost?: number | null | undefined;
    externalId?: string | null | undefined;
    templateId?: string | null | undefined;
    variables?: Map<string, string> | null | undefined;
    externalStatus?: string | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    sentAt?: NativeDate | null | undefined;
    deliveredAt?: NativeDate | null | undefined;
    readAt?: NativeDate | null | undefined;
    errorCode?: string | null | undefined;
    segments?: number | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const TemplateModel: mongoose.Model<{
    name: string;
    channel: Channel;
    status: "active" | "draft" | "archived";
    tenantId: string;
    variables: string[];
    content?: {
        body: string;
        buttons: mongoose.Types.DocumentArray<{
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }> & {
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }>;
        subject?: string | null | undefined;
        imageUrl?: string | null | undefined;
    } | null | undefined;
    stats?: {
        read: number;
        sent: number;
        delivered: number;
        bounced: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    channel: Channel;
    status: "active" | "draft" | "archived";
    tenantId: string;
    variables: string[];
    content?: {
        body: string;
        buttons: mongoose.Types.DocumentArray<{
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }> & {
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }>;
        subject?: string | null | undefined;
        imageUrl?: string | null | undefined;
    } | null | undefined;
    stats?: {
        read: number;
        sent: number;
        delivered: number;
        bounced: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    channel: Channel;
    status: "active" | "draft" | "archived";
    tenantId: string;
    variables: string[];
    content?: {
        body: string;
        buttons: mongoose.Types.DocumentArray<{
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }> & {
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }>;
        subject?: string | null | undefined;
        imageUrl?: string | null | undefined;
    } | null | undefined;
    stats?: {
        read: number;
        sent: number;
        delivered: number;
        bounced: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    channel: Channel;
    status: "active" | "draft" | "archived";
    tenantId: string;
    variables: string[];
    content?: {
        body: string;
        buttons: mongoose.Types.DocumentArray<{
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }> & {
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }>;
        subject?: string | null | undefined;
        imageUrl?: string | null | undefined;
    } | null | undefined;
    stats?: {
        read: number;
        sent: number;
        delivered: number;
        bounced: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    channel: Channel;
    status: "active" | "draft" | "archived";
    tenantId: string;
    variables: string[];
    content?: {
        body: string;
        buttons: mongoose.Types.DocumentArray<{
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }> & {
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }>;
        subject?: string | null | undefined;
        imageUrl?: string | null | undefined;
    } | null | undefined;
    stats?: {
        read: number;
        sent: number;
        delivered: number;
        bounced: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    channel: Channel;
    status: "active" | "draft" | "archived";
    tenantId: string;
    variables: string[];
    content?: {
        body: string;
        buttons: mongoose.Types.DocumentArray<{
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }> & {
            url?: string | null | undefined;
            id?: string | null | undefined;
            text?: string | null | undefined;
        }>;
        subject?: string | null | undefined;
        imageUrl?: string | null | undefined;
    } | null | undefined;
    stats?: {
        read: number;
        sent: number;
        delivered: number;
        bounced: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const CampaignModel: mongoose.Model<{
    name: string;
    channel: Channel;
    status: "paused" | "running" | "completed" | "failed" | "scheduled" | "draft";
    tenantId: string;
    templateId: string;
    audience?: {
        type: "filter" | "segment" | "list";
        id?: string | null | undefined;
        criteria?: Map<string, any> | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    schedule?: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            days: number[];
            frequency?: string | null | undefined;
            time?: string | null | undefined;
        } | null | undefined;
        sendAt?: NativeDate | null | undefined;
    } | null | undefined;
    stats?: {
        failed: number;
        read: number;
        total: number;
        sent: number;
        delivered: number;
        bounced: number;
        clicked: number;
    } | null | undefined;
    createdBy?: string | null | undefined;
    settings?: {
        dedupe: boolean;
        allowDuplicates: boolean;
        randomize: boolean;
        cap?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    channel: Channel;
    status: "paused" | "running" | "completed" | "failed" | "scheduled" | "draft";
    tenantId: string;
    templateId: string;
    audience?: {
        type: "filter" | "segment" | "list";
        id?: string | null | undefined;
        criteria?: Map<string, any> | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    schedule?: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            days: number[];
            frequency?: string | null | undefined;
            time?: string | null | undefined;
        } | null | undefined;
        sendAt?: NativeDate | null | undefined;
    } | null | undefined;
    stats?: {
        failed: number;
        read: number;
        total: number;
        sent: number;
        delivered: number;
        bounced: number;
        clicked: number;
    } | null | undefined;
    createdBy?: string | null | undefined;
    settings?: {
        dedupe: boolean;
        allowDuplicates: boolean;
        randomize: boolean;
        cap?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    channel: Channel;
    status: "paused" | "running" | "completed" | "failed" | "scheduled" | "draft";
    tenantId: string;
    templateId: string;
    audience?: {
        type: "filter" | "segment" | "list";
        id?: string | null | undefined;
        criteria?: Map<string, any> | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    schedule?: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            days: number[];
            frequency?: string | null | undefined;
            time?: string | null | undefined;
        } | null | undefined;
        sendAt?: NativeDate | null | undefined;
    } | null | undefined;
    stats?: {
        failed: number;
        read: number;
        total: number;
        sent: number;
        delivered: number;
        bounced: number;
        clicked: number;
    } | null | undefined;
    createdBy?: string | null | undefined;
    settings?: {
        dedupe: boolean;
        allowDuplicates: boolean;
        randomize: boolean;
        cap?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    channel: Channel;
    status: "paused" | "running" | "completed" | "failed" | "scheduled" | "draft";
    tenantId: string;
    templateId: string;
    audience?: {
        type: "filter" | "segment" | "list";
        id?: string | null | undefined;
        criteria?: Map<string, any> | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    schedule?: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            days: number[];
            frequency?: string | null | undefined;
            time?: string | null | undefined;
        } | null | undefined;
        sendAt?: NativeDate | null | undefined;
    } | null | undefined;
    stats?: {
        failed: number;
        read: number;
        total: number;
        sent: number;
        delivered: number;
        bounced: number;
        clicked: number;
    } | null | undefined;
    createdBy?: string | null | undefined;
    settings?: {
        dedupe: boolean;
        allowDuplicates: boolean;
        randomize: boolean;
        cap?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    channel: Channel;
    status: "paused" | "running" | "completed" | "failed" | "scheduled" | "draft";
    tenantId: string;
    templateId: string;
    audience?: {
        type: "filter" | "segment" | "list";
        id?: string | null | undefined;
        criteria?: Map<string, any> | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    schedule?: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            days: number[];
            frequency?: string | null | undefined;
            time?: string | null | undefined;
        } | null | undefined;
        sendAt?: NativeDate | null | undefined;
    } | null | undefined;
    stats?: {
        failed: number;
        read: number;
        total: number;
        sent: number;
        delivered: number;
        bounced: number;
        clicked: number;
    } | null | undefined;
    createdBy?: string | null | undefined;
    settings?: {
        dedupe: boolean;
        allowDuplicates: boolean;
        randomize: boolean;
        cap?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    channel: Channel;
    status: "paused" | "running" | "completed" | "failed" | "scheduled" | "draft";
    tenantId: string;
    templateId: string;
    audience?: {
        type: "filter" | "segment" | "list";
        id?: string | null | undefined;
        criteria?: Map<string, any> | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    schedule?: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            days: number[];
            frequency?: string | null | undefined;
            time?: string | null | undefined;
        } | null | undefined;
        sendAt?: NativeDate | null | undefined;
    } | null | undefined;
    stats?: {
        failed: number;
        read: number;
        total: number;
        sent: number;
        delivered: number;
        bounced: number;
        clicked: number;
    } | null | undefined;
    createdBy?: string | null | undefined;
    settings?: {
        dedupe: boolean;
        allowDuplicates: boolean;
        randomize: boolean;
        cap?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare class CommunicationsService {
    sendMessage(params: {
        tenantId: string;
        channel: Channel;
        to: string;
        from?: string;
        subject?: string;
        body: string;
        templateId?: string;
        variables?: Record<string, string>;
        scheduledAt?: Date;
        metadata?: Record<string, unknown>;
    }): Promise<Message>;
    private sendViaProvider;
    private sendSMS;
    private sendEmail;
    private sendWhatsApp;
    private sendPush;
    private getDefaultFrom;
    private renderTemplate;
    handleWebhook(params: {
        tenantId: string;
        channel: Channel;
        externalId: string;
        event: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    createTemplate(template: Omit<Template, 'id' | 'stats' | 'createdAt' | 'updatedAt'>): Promise<Template>;
    getTemplates(tenantId: string, channel?: Channel): Promise<Template[]>;
    createCampaign(campaign: Omit<Campaign, 'id' | 'stats' | 'createdAt' | 'updatedAt'>): Promise<Campaign>;
    getCampaignStats(tenantId: string, campaignId: string): Promise<Campaign['stats']>;
    /**
     * Execute a campaign - send to all recipients
     */
    executeCampaign(campaignId: string): Promise<{
        sent: number;
        failed: number;
    }>;
    /**
     * Resolve audience to list of contacts
     */
    private resolveAudience;
    /**
     * Check if contact is opted out for channel
     */
    private isOptedOut;
    /**
     * Check if message was sent to contact in last 24h
     */
    private wasRecentlySent;
    /**
     * Mark contact as sent for deduplication
     */
    private markAsSent;
    /**
     * Process scheduled messages
     */
    processScheduledMessages(): Promise<{
        processed: number;
    }>;
}
export declare const communicationsService: CommunicationsService;
//# sourceMappingURL=notificationService.d.ts.map