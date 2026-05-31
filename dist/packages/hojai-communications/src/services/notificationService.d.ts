import mongoose from 'mongoose';
import { Message, Template, Campaign, Channel, MessageStatus } from '../types/index.js';
export declare const MessageModel: mongoose.Model<{
    status: MessageStatus;
    tenantId: string;
    body: string;
    channel: Channel;
    direction: "inbound" | "outbound";
    from: string;
    to: string;
    error?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    subject?: string | null | undefined;
    templateId?: string | null | undefined;
    sentAt?: NativeDate | null | undefined;
    deliveredAt?: NativeDate | null | undefined;
    readAt?: NativeDate | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    cost?: number | null | undefined;
    variables?: Map<string, string> | null | undefined;
    segments?: number | null | undefined;
    externalId?: string | null | undefined;
    externalStatus?: string | null | undefined;
    errorCode?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    status: MessageStatus;
    tenantId: string;
    body: string;
    channel: Channel;
    direction: "inbound" | "outbound";
    from: string;
    to: string;
    error?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    subject?: string | null | undefined;
    templateId?: string | null | undefined;
    sentAt?: NativeDate | null | undefined;
    deliveredAt?: NativeDate | null | undefined;
    readAt?: NativeDate | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    cost?: number | null | undefined;
    variables?: Map<string, string> | null | undefined;
    segments?: number | null | undefined;
    externalId?: string | null | undefined;
    externalStatus?: string | null | undefined;
    errorCode?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: MessageStatus;
    tenantId: string;
    body: string;
    channel: Channel;
    direction: "inbound" | "outbound";
    from: string;
    to: string;
    error?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    subject?: string | null | undefined;
    templateId?: string | null | undefined;
    sentAt?: NativeDate | null | undefined;
    deliveredAt?: NativeDate | null | undefined;
    readAt?: NativeDate | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    cost?: number | null | undefined;
    variables?: Map<string, string> | null | undefined;
    segments?: number | null | undefined;
    externalId?: string | null | undefined;
    externalStatus?: string | null | undefined;
    errorCode?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: MessageStatus;
    tenantId: string;
    body: string;
    channel: Channel;
    direction: "inbound" | "outbound";
    from: string;
    to: string;
    error?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    subject?: string | null | undefined;
    templateId?: string | null | undefined;
    sentAt?: NativeDate | null | undefined;
    deliveredAt?: NativeDate | null | undefined;
    readAt?: NativeDate | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    cost?: number | null | undefined;
    variables?: Map<string, string> | null | undefined;
    segments?: number | null | undefined;
    externalId?: string | null | undefined;
    externalStatus?: string | null | undefined;
    errorCode?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: MessageStatus;
    tenantId: string;
    body: string;
    channel: Channel;
    direction: "inbound" | "outbound";
    from: string;
    to: string;
    error?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    subject?: string | null | undefined;
    templateId?: string | null | undefined;
    sentAt?: NativeDate | null | undefined;
    deliveredAt?: NativeDate | null | undefined;
    readAt?: NativeDate | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    cost?: number | null | undefined;
    variables?: Map<string, string> | null | undefined;
    segments?: number | null | undefined;
    externalId?: string | null | undefined;
    externalStatus?: string | null | undefined;
    errorCode?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: MessageStatus;
    tenantId: string;
    body: string;
    channel: Channel;
    direction: "inbound" | "outbound";
    from: string;
    to: string;
    error?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    subject?: string | null | undefined;
    templateId?: string | null | undefined;
    sentAt?: NativeDate | null | undefined;
    deliveredAt?: NativeDate | null | undefined;
    readAt?: NativeDate | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    cost?: number | null | undefined;
    variables?: Map<string, string> | null | undefined;
    segments?: number | null | undefined;
    externalId?: string | null | undefined;
    externalStatus?: string | null | undefined;
    errorCode?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const TemplateModel: mongoose.Model<{
    status: "active" | "draft" | "archived";
    name: string;
    tenantId: string;
    channel: Channel;
    variables: string[];
    stats?: {
        delivered: number;
        sent: number;
        read: number;
        bounced: number;
    } | null | undefined;
    content?: {
        body: string;
        buttons: mongoose.Types.DocumentArray<{
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }> & {
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }>;
        subject?: string | null | undefined;
        imageUrl?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    status: "active" | "draft" | "archived";
    name: string;
    tenantId: string;
    channel: Channel;
    variables: string[];
    stats?: {
        delivered: number;
        sent: number;
        read: number;
        bounced: number;
    } | null | undefined;
    content?: {
        body: string;
        buttons: mongoose.Types.DocumentArray<{
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }> & {
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }>;
        subject?: string | null | undefined;
        imageUrl?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: "active" | "draft" | "archived";
    name: string;
    tenantId: string;
    channel: Channel;
    variables: string[];
    stats?: {
        delivered: number;
        sent: number;
        read: number;
        bounced: number;
    } | null | undefined;
    content?: {
        body: string;
        buttons: mongoose.Types.DocumentArray<{
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }> & {
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }>;
        subject?: string | null | undefined;
        imageUrl?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "active" | "draft" | "archived";
    name: string;
    tenantId: string;
    channel: Channel;
    variables: string[];
    stats?: {
        delivered: number;
        sent: number;
        read: number;
        bounced: number;
    } | null | undefined;
    content?: {
        body: string;
        buttons: mongoose.Types.DocumentArray<{
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }> & {
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }>;
        subject?: string | null | undefined;
        imageUrl?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "active" | "draft" | "archived";
    name: string;
    tenantId: string;
    channel: Channel;
    variables: string[];
    stats?: {
        delivered: number;
        sent: number;
        read: number;
        bounced: number;
    } | null | undefined;
    content?: {
        body: string;
        buttons: mongoose.Types.DocumentArray<{
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }> & {
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }>;
        subject?: string | null | undefined;
        imageUrl?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: "active" | "draft" | "archived";
    name: string;
    tenantId: string;
    channel: Channel;
    variables: string[];
    stats?: {
        delivered: number;
        sent: number;
        read: number;
        bounced: number;
    } | null | undefined;
    content?: {
        body: string;
        buttons: mongoose.Types.DocumentArray<{
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }> & {
            id?: string | null | undefined;
            url?: string | null | undefined;
            text?: string | null | undefined;
        }>;
        subject?: string | null | undefined;
        imageUrl?: string | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const CampaignModel: mongoose.Model<{
    status: "completed" | "draft" | "running" | "failed" | "scheduled" | "paused";
    name: string;
    tenantId: string;
    channel: Channel;
    templateId: string;
    stats?: {
        failed: number;
        delivered: number;
        sent: number;
        read: number;
        clicked: number;
        total: number;
        bounced: number;
    } | null | undefined;
    schedule?: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            days: number[];
            frequency?: string | null | undefined;
            time?: string | null | undefined;
        } | null | undefined;
        sendAt?: NativeDate | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    audience?: {
        type: "filter" | "segment" | "list";
        id?: string | null | undefined;
        criteria?: Map<string, any> | null | undefined;
    } | null | undefined;
    createdBy?: string | null | undefined;
    settings?: {
        dedupe: boolean;
        allowDuplicates: boolean;
        randomize: boolean;
        cap?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    status: "completed" | "draft" | "running" | "failed" | "scheduled" | "paused";
    name: string;
    tenantId: string;
    channel: Channel;
    templateId: string;
    stats?: {
        failed: number;
        delivered: number;
        sent: number;
        read: number;
        clicked: number;
        total: number;
        bounced: number;
    } | null | undefined;
    schedule?: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            days: number[];
            frequency?: string | null | undefined;
            time?: string | null | undefined;
        } | null | undefined;
        sendAt?: NativeDate | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    audience?: {
        type: "filter" | "segment" | "list";
        id?: string | null | undefined;
        criteria?: Map<string, any> | null | undefined;
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
    status: "completed" | "draft" | "running" | "failed" | "scheduled" | "paused";
    name: string;
    tenantId: string;
    channel: Channel;
    templateId: string;
    stats?: {
        failed: number;
        delivered: number;
        sent: number;
        read: number;
        clicked: number;
        total: number;
        bounced: number;
    } | null | undefined;
    schedule?: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            days: number[];
            frequency?: string | null | undefined;
            time?: string | null | undefined;
        } | null | undefined;
        sendAt?: NativeDate | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    audience?: {
        type: "filter" | "segment" | "list";
        id?: string | null | undefined;
        criteria?: Map<string, any> | null | undefined;
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
    status: "completed" | "draft" | "running" | "failed" | "scheduled" | "paused";
    name: string;
    tenantId: string;
    channel: Channel;
    templateId: string;
    stats?: {
        failed: number;
        delivered: number;
        sent: number;
        read: number;
        clicked: number;
        total: number;
        bounced: number;
    } | null | undefined;
    schedule?: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            days: number[];
            frequency?: string | null | undefined;
            time?: string | null | undefined;
        } | null | undefined;
        sendAt?: NativeDate | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    audience?: {
        type: "filter" | "segment" | "list";
        id?: string | null | undefined;
        criteria?: Map<string, any> | null | undefined;
    } | null | undefined;
    createdBy?: string | null | undefined;
    settings?: {
        dedupe: boolean;
        allowDuplicates: boolean;
        randomize: boolean;
        cap?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "completed" | "draft" | "running" | "failed" | "scheduled" | "paused";
    name: string;
    tenantId: string;
    channel: Channel;
    templateId: string;
    stats?: {
        failed: number;
        delivered: number;
        sent: number;
        read: number;
        clicked: number;
        total: number;
        bounced: number;
    } | null | undefined;
    schedule?: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            days: number[];
            frequency?: string | null | undefined;
            time?: string | null | undefined;
        } | null | undefined;
        sendAt?: NativeDate | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    audience?: {
        type: "filter" | "segment" | "list";
        id?: string | null | undefined;
        criteria?: Map<string, any> | null | undefined;
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
    status: "completed" | "draft" | "running" | "failed" | "scheduled" | "paused";
    name: string;
    tenantId: string;
    channel: Channel;
    templateId: string;
    stats?: {
        failed: number;
        delivered: number;
        sent: number;
        read: number;
        clicked: number;
        total: number;
        bounced: number;
    } | null | undefined;
    schedule?: {
        type: "scheduled" | "immediate" | "recurring";
        recurring?: {
            days: number[];
            frequency?: string | null | undefined;
            time?: string | null | undefined;
        } | null | undefined;
        sendAt?: NativeDate | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    audience?: {
        type: "filter" | "segment" | "list";
        id?: string | null | undefined;
        criteria?: Map<string, any> | null | undefined;
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