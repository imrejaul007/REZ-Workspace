import mongoose, { Document } from 'mongoose';
export interface IMessage extends Document {
    _id: mongoose.Types.ObjectId;
    messageId: string;
    tenantId: string;
    channel: string;
    recipient: string;
    sender?: string;
    type: string;
    priority: string;
    subject?: string;
    body: string;
    htmlBody?: string;
    previewText?: string;
    media?: {
        type: string;
        url: string;
        thumbnailUrl?: string;
        caption?: string;
        filename?: string;
    };
    templateId?: string;
    templateVariables?: Record<string, any>;
    status: string;
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    failedAt?: Date;
    errorMessage?: string;
    providerMessageId?: string;
    provider?: string;
    scheduledAt?: Date;
    metadata?: Record<string, any>;
    tags?: string[];
    cost?: number;
    currency: string;
    opened: boolean;
    clicked: boolean;
    conversionTracked: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Message: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage, {}, {}> & IMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface ITemplate extends Document {
    _id: mongoose.Types.ObjectId;
    templateId: string;
    tenantId: string;
    name: string;
    channel: string;
    category: string;
    subject?: string;
    body: string;
    htmlBody?: string;
    variables: Array<{
        name: string;
        type: string;
        required?: boolean;
        defaultValue?: string;
        description?: string;
    }>;
    status: string;
    isDefault: boolean;
    whatsappHeader?: string;
    whatsappFooter?: string;
    whatsappButtons?: Array<{
        id: string;
        text: string;
    }>;
    emailFromName?: string;
    emailReplyTo?: string;
    usageCount: number;
    lastUsedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Template: mongoose.Model<ITemplate, {}, {}, {}, mongoose.Document<unknown, {}, ITemplate, {}, {}> & ITemplate & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface ICampaign extends Document {
    _id: mongoose.Types.ObjectId;
    campaignId: string;
    tenantId: string;
    name: string;
    description?: string;
    channel: string;
    templateId?: string;
    subject?: string;
    body: string;
    media?: {
        type: string;
        url: string;
    };
    segmentIds: [string];
    recipientCount: number;
    excludeRecipientIds?: [string];
    filters?: {
        tags?: string[];
        excludeTags?: string[];
        lastActiveDays?: number;
        signupDateAfter?: Date;
    };
    status: string;
    scheduledAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    abTest?: {
        enabled: boolean;
        variants?: Array<{
            id: string;
            name: string;
            body: string;
            weight: number;
        }>;
        winner?: string;
    };
    stats: {
        sent: number;
        delivered: number;
        failed: number;
        opened: number;
        clicked: number;
        converted: number;
        unsubscribed: number;
        complained: number;
    };
    totalCost?: number;
    costPerMessage?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Campaign: mongoose.Model<ICampaign, {}, {}, {}, mongoose.Document<unknown, {}, ICampaign, {}, {}> & ICampaign & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface ISubscriber extends Document {
    _id: mongoose.Types.ObjectId;
    subscriberId: string;
    tenantId: string;
    userId?: string;
    email?: string;
    phone?: string;
    whatsappId?: string;
    deviceToken?: string;
    channels: string[];
    subscribed: boolean;
    unsubscribedAt?: Date;
    unsubscribedChannels?: string[];
    tags: string[];
    segments: string[];
    totalMessagesReceived: number;
    lastMessageAt?: Date;
    lastOpenedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Subscriber: mongoose.Model<ISubscriber, {}, {}, {}, mongoose.Document<unknown, {}, ISubscriber, {}, {}> & ISubscriber & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface IChannelConfig extends Document {
    _id: mongoose.Types.ObjectId;
    configId: string;
    tenantId: string;
    channel: string;
    whatsappPhoneNumber?: string;
    whatsappBusinessAccountId?: string;
    whatsappAccessToken?: string;
    smsProvider?: string;
    smsApiKey?: string;
    smsSenderId?: string;
    emailProvider?: string;
    emailApiKey?: string;
    emailFromAddress?: string;
    emailFromName?: string;
    fcmServerKey?: string;
    apnsCertPath?: string;
    voiceProvider?: string;
    voiceApiKey?: string;
    enabled: boolean;
    webhooks?: {
        delivery?: string;
        open?: string;
        click?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const ChannelConfig: mongoose.Model<IChannelConfig, {}, {}, {}, mongoose.Document<unknown, {}, IChannelConfig, {}, {}> & IChannelConfig & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=index.d.ts.map