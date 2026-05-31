import mongoose, { Schema } from 'mongoose';
import { ChannelEnum, MessageStatusEnum } from '../types';
const MessageSchema = new Schema({
    messageId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    channel: { type: String, required: true, enum: ChannelEnum.enum },
    recipient: { type: String, required: true, index: true },
    sender: String,
    type: { type: String, enum: ['transactional', 'marketing', 'notification', 'alert'], default: 'transactional' },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    subject: String,
    body: { type: String, required: true },
    htmlBody: String,
    previewText: String,
    media: {
        type: String,
        url: String,
        thumbnailUrl: String,
        caption: String,
        filename: String
    },
    templateId: String,
    templateVariables: { type: Map, of: Schema.Types.Mixed },
    status: { type: String, enum: MessageStatusEnum.enum, default: 'pending', index: true },
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    failedAt: Date,
    errorMessage: String,
    providerMessageId: String,
    provider: String,
    scheduledAt: Date,
    metadata: { type: Map, of: Schema.Types.Mixed },
    tags: [String],
    cost: Number,
    currency: { type: String, default: 'INR' },
    opened: { type: Boolean, default: false },
    clicked: { type: Boolean, default: false },
    conversionTracked: { type: Boolean, default: false }
}, { timestamps: true, collection: 'comm_messages' });
MessageSchema.index({ tenantId: 1, status: 1 });
MessageSchema.index({ tenantId: 1, channel: 1, createdAt: -1 });
MessageSchema.index({ scheduledAt: 1, status: 1 });
export const Message = mongoose.model('Message', MessageSchema);
const TemplateSchema = new Schema({
    templateId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    channel: { type: String, required: true, enum: ChannelEnum.enum },
    category: { type: String, required: true },
    subject: String,
    body: { type: String, required: true },
    htmlBody: String,
    variables: [{
            name: String,
            type: String,
            required: { type: Boolean, default: false },
            defaultValue: String,
            description: String
        }],
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    isDefault: { type: Boolean, default: false },
    whatsappHeader: String,
    whatsappFooter: String,
    whatsappButtons: [{ id: String, text: String }],
    emailFromName: String,
    emailReplyTo: String,
    usageCount: { type: Number, default: 0 },
    lastUsedAt: Date
}, { timestamps: true, collection: 'comm_templates' });
TemplateSchema.index({ tenantId: 1, channel: 1, status: 1 });
TemplateSchema.index({ tenantId: 1, name: 'text', body: 'text' });
export const Template = mongoose.model('Template', TemplateSchema);
const CampaignSchema = new Schema({
    campaignId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    channel: { type: String, required: true, enum: ChannelEnum.enum },
    templateId: String,
    subject: String,
    body: { type: String, required: true },
    media: { type: String, url: String },
    segmentIds: [String],
    recipientCount: { type: Number, default: 0 },
    excludeRecipientIds: [String],
    filters: {
        tags: [String],
        excludeTags: [String],
        lastActiveDays: Number,
        signupDateAfter: Date
    },
    status: { type: String, enum: ['draft', 'scheduled', 'sending', 'completed', 'paused', 'cancelled'], default: 'draft' },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    abTest: {
        enabled: { type: Boolean, default: false },
        variants: [{
                id: String,
                name: String,
                body: String,
                weight: Number
            }],
        winner: String
    },
    stats: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 },
        converted: { type: Number, default: 0 },
        unsubscribed: { type: Number, default: 0 },
        complained: { type: Number, default: 0 }
    },
    totalCost: Number,
    costPerMessage: Number
}, { timestamps: true, collection: 'comm_campaigns' });
CampaignSchema.index({ tenantId: 1, status: 1 });
CampaignSchema.index({ tenantId: 1, scheduledAt: 1 });
export const Campaign = mongoose.model('Campaign', CampaignSchema);
const SubscriberSchema = new Schema({
    subscriberId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    userId: String,
    email: String,
    phone: String,
    whatsappId: String,
    deviceToken: String,
    channels: [{ type: String, enum: ChannelEnum.enum }],
    subscribed: { type: Boolean, default: true },
    unsubscribedAt: Date,
    unsubscribedChannels: [String],
    tags: [String],
    segments: [String],
    totalMessagesReceived: { type: Number, default: 0 },
    lastMessageAt: Date,
    lastOpenedAt: Date
}, { timestamps: true, collection: 'comm_subscribers' });
SubscriberSchema.index({ tenantId: 1, email: 1 }, { sparse: true });
SubscriberSchema.index({ tenantId: 1, phone: 1 }, { sparse: true });
SubscriberSchema.index({ tenantId: 1, segments: 1 });
SubscriberSchema.index({ tenantId: 1, tags: 1 });
export const Subscriber = mongoose.model('Subscriber', SubscriberSchema);
const ChannelConfigSchema = new Schema({
    configId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    channel: { type: String, required: true, enum: ChannelEnum.enum },
    whatsappPhoneNumber: String,
    whatsappBusinessAccountId: String,
    whatsappAccessToken: String,
    smsProvider: String,
    smsApiKey: String,
    smsSenderId: String,
    emailProvider: String,
    emailApiKey: String,
    emailFromAddress: String,
    emailFromName: String,
    fcmServerKey: String,
    apnsCertPath: String,
    voiceProvider: String,
    voiceApiKey: String,
    enabled: { type: Boolean, default: true },
    webhooks: {
        delivery: String,
        open: String,
        click: String
    }
}, { timestamps: true, collection: 'comm_channel_configs' });
ChannelConfigSchema.index({ tenantId: 1, channel: 1 }, { unique: true });
export const ChannelConfig = mongoose.model('ChannelConfig', ChannelConfigSchema);
//# sourceMappingURL=index.js.map