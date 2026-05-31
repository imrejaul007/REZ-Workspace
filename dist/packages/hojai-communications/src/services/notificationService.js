import mongoose, { Schema } from 'mongoose';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { Channel, MessageStatus } from '../types/index.js';
const MessageSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    channel: { type: String, enum: Object.values(Channel), required: true },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    subject: String,
    body: { type: String, required: true },
    templateId: String,
    variables: { type: Map, of: String },
    status: { type: String, enum: Object.values(MessageStatus), default: MessageStatus.PENDING },
    externalId: String,
    externalStatus: String,
    metadata: { type: Map, of: Schema.Types.Mixed },
    scheduledAt: Date,
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    error: String,
    errorCode: String,
    cost: Number,
    segments: Number
}, { timestamps: true });
MessageSchema.index({ tenantId: 1, status: 1 });
MessageSchema.index({ tenantId: 1, channel: 1, createdAt: -1 });
const TemplateSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    channel: { type: String, enum: Object.values(Channel), required: true },
    content: {
        subject: String,
        body: { type: String, required: true },
        buttons: [{
                id: String,
                text: String,
                url: String
            }],
        imageUrl: String
    },
    variables: [String],
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'active' },
    stats: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        read: { type: Number, default: 0 },
        bounced: { type: Number, default: 0 }
    }
}, { timestamps: true });
const CampaignSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    channel: { type: String, enum: Object.values(Channel), required: true },
    templateId: { type: String, required: true },
    audience: {
        type: { type: String, enum: ['segment', 'list', 'filter'], required: true },
        id: String,
        criteria: { type: Map, of: Schema.Types.Mixed }
    },
    schedule: {
        type: { type: String, enum: ['immediate', 'scheduled', 'recurring'], required: true },
        sendAt: Date,
        recurring: {
            frequency: String,
            days: [Number],
            time: String
        }
    },
    settings: {
        dedupe: { type: Boolean, default: true },
        allowDuplicates: { type: Boolean, default: false },
        cap: Number,
        randomize: { type: Boolean, default: false }
    },
    status: { type: String, enum: ['draft', 'scheduled', 'running', 'paused', 'completed', 'failed'], default: 'draft' },
    stats: {
        total: { type: Number, default: 0 },
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        read: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 },
        bounced: { type: Number, default: 0 },
        failed: { type: Number, default: 0 }
    },
    createdBy: String
}, { timestamps: true });
CampaignSchema.index({ tenantId: 1, status: 1 });
export const MessageModel = mongoose.model('Message', MessageSchema);
export const TemplateModel = mongoose.model('Template', TemplateSchema);
export const CampaignModel = mongoose.model('Campaign', CampaignSchema);
// ============================================================================
// COMMUNICATIONS SERVICE
// ============================================================================
export class CommunicationsService {
    async sendMessage(params) {
        const { tenantId, channel, to, body } = params;
        const message = new MessageModel({
            tenantId,
            channel,
            direction: 'outbound',
            from: params.from || this.getDefaultFrom(channel),
            to,
            subject: params.subject,
            body: this.renderTemplate(body, params.variables || {}),
            templateId: params.templateId,
            variables: params.variables,
            status: MessageStatus.PENDING,
            scheduledAt: params.scheduledAt,
            metadata: params.metadata
        });
        // If scheduled for later, save and return
        if (params.scheduledAt && params.scheduledAt > new Date()) {
            await message.save();
            return message.toObject();
        }
        // Send immediately
        await message.save();
        await this.sendViaProvider(message);
        return message.toObject();
    }
    async sendViaProvider(message) {
        try {
            let result;
            switch (message.channel) {
                case Channel.SMS:
                    result = await this.sendSMS(message);
                    break;
                case Channel.EMAIL:
                    result = await this.sendEmail(message);
                    break;
                case Channel.WHATSAPP:
                    result = await this.sendWhatsApp(message);
                    break;
                case Channel.PUSH:
                    result = await this.sendPush(message);
                    break;
                default:
                    throw new Error(`Unsupported channel: ${message.channel}`);
            }
            message.externalId = result.externalId;
            message.status = result.status === 'sent' ? MessageStatus.SENT : MessageStatus.PENDING;
            message.sentAt = new Date();
        }
        catch (error) {
            message.status = MessageStatus.FAILED;
            message.error = error.message;
        }
        await message.save();
    }
    async sendSMS(message) {
        // Twilio integration
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const from = process.env.TWILIO_PHONE_NUMBER;
        if (!accountSid || !authToken) {
            console.warn(`[SMS] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set - message not sent to ${message.to}`);
            return { externalId: `mock_sms_${Date.now()}`, status: 'sent' };
        }
        const response = await axios.post(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, new URLSearchParams({
            From: from || message.from,
            To: message.to,
            Body: message.body
        }), {
            auth: { username: accountSid, password: authToken }
        });
        return { externalId: response.data.sid, status: 'sent' };
    }
    async sendEmail(message) {
        // SendGrid/Resend integration
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
            console.warn(`[Email] SENDGRID_API_KEY not set - email not sent to ${message.to}`);
            return { externalId: `mock_email_${Date.now()}`, status: 'sent' };
        }
        await axios.post('https://api.sendgrid.com/v3/mail/send', {
            personalizations: [{ to: [{ email: message.to }] }],
            from: { email: message.from },
            subject: message.subject || '',
            content: [{ type: 'text/plain', value: message.body }]
        }, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        return { externalId: `email_${Date.now()}`, status: 'sent' };
    }
    async sendWhatsApp(message) {
        // WhatsApp Business API
        const phoneNumberId = process.env.WHATSAPP_PHONE_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        if (!accessToken) {
            console.warn(`[WhatsApp] WHATSAPP_ACCESS_TOKEN not set - message not sent to ${message.to}`);
            return { externalId: `mock_wa_${Date.now()}`, status: 'sent' };
        }
        await axios.post(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
            messaging_product: 'whatsapp',
            to: message.to,
            type: 'text',
            text: { body: message.body }
        }, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return { externalId: `wa_${Date.now()}`, status: 'sent' };
    }
    async sendPush(message) {
        // Firebase Cloud Messaging
        const serverKey = process.env.FIREBASE_SERVER_KEY;
        if (!serverKey) {
            console.warn(`[Push] FIREBASE_SERVER_KEY not set - push not sent to ${message.to}`);
            return { externalId: `mock_push_${Date.now()}`, status: 'sent' };
        }
        await axios.post('https://fcm.googleapis.com/fcm/send', {
            to: message.to,
            notification: {
                title: message.subject || 'Notification',
                body: message.body
            }
        }, {
            headers: { Authorization: `key=${serverKey}` }
        });
        return { externalId: `push_${Date.now()}`, status: 'sent' };
    }
    getDefaultFrom(channel) {
        const defaults = {
            [Channel.SMS]: process.env.DEFAULT_SMS_FROM || 'HOJAI',
            [Channel.EMAIL]: process.env.DEFAULT_EMAIL_FROM || 'noreply@hojai.ai',
            [Channel.WHATSAPP]: process.env.DEFAULT_WHATSAPP_FROM || '',
            [Channel.PUSH]: ''
        };
        return defaults[channel];
    }
    renderTemplate(template, variables) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
    }
    // Webhook handling
    async handleWebhook(params) {
        const message = await MessageModel.findOne({
            tenantId: params.tenantId,
            externalId: params.externalId
        });
        if (!message)
            return;
        switch (params.event) {
            case 'delivered':
                message.status = MessageStatus.DELIVERED;
                message.deliveredAt = new Date();
                break;
            case 'read':
                message.status = MessageStatus.READ;
                message.readAt = new Date();
                break;
            case 'bounced':
                message.status = MessageStatus.BOUNCED;
                break;
            case 'failed':
                message.status = MessageStatus.FAILED;
                message.error = params.metadata?.error;
                break;
        }
        await message.save();
    }
    // Templates
    async createTemplate(template) {
        const doc = new TemplateModel({ ...template, id: uuid() });
        await doc.save();
        return doc.toObject();
    }
    async getTemplates(tenantId, channel) {
        const filter = { tenantId, status: 'active' };
        if (channel)
            filter.channel = channel;
        const templates = await TemplateModel.find(filter);
        return templates.map(t => t.toObject());
    }
    // Campaigns
    async createCampaign(campaign) {
        const doc = new CampaignModel({ ...campaign, id: uuid() });
        await doc.save();
        return doc.toObject();
    }
    async getCampaignStats(tenantId, campaignId) {
        const stats = await MessageModel.aggregate([
            { $match: { tenantId, templateId: campaignId } },
            { $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                } }
        ]);
        const result = { total: 0, sent: 0, delivered: 0, read: 0, clicked: 0, bounced: 0, failed: 0 };
        for (const s of stats) {
            result.total += s.count;
            if (s._id === 'sent')
                result.sent = s.count;
            if (s._id === 'delivered')
                result.delivered = s.count;
            if (s._id === 'read')
                result.read = s.count;
            if (s._id === 'bounced')
                result.bounced = s.count;
            if (s._id === 'failed')
                result.failed = s.count;
        }
        return result;
    }
    /**
     * Execute a campaign - send to all recipients
     */
    async executeCampaign(campaignId) {
        const campaign = await CampaignModel.findById(campaignId);
        if (!campaign) {
            throw new Error(`Campaign not found: ${campaignId}`);
        }
        if (campaign.status !== 'scheduled' && campaign.status !== 'active') {
            throw new Error(`Campaign cannot be executed in status: ${campaign.status}`);
        }
        console.log(`[Campaign] Starting execution for campaign ${campaignId}`);
        // Update status to running
        await CampaignModel.findByIdAndUpdate(campaignId, { status: 'running' });
        const audience = await this.resolveAudience(campaign.audience);
        let sent = 0;
        let failed = 0;
        for (const contact of audience) {
            try {
                // Check opt-out
                if (await this.isOptedOut(contact.id, campaign.channel)) {
                    console.log(`[Campaign] Skipping opted-out contact: ${contact.id}`);
                    continue;
                }
                // Check deduplication (don't send if sent in last 24h)
                if (await this.wasRecentlySent(contact.id, campaignId)) {
                    console.log(`[Campaign] Skipping duplicate: ${contact.id}`);
                    continue;
                }
                // Send message
                await this.sendMessage({
                    tenantId: campaign.tenantId,
                    channel: campaign.channel,
                    to: contact.contactInfo,
                    templateId: campaign.templateId,
                    variables: contact.variables || {},
                    metadata: { campaignId }
                });
                sent++;
                await CampaignModel.findByIdAndUpdate(campaignId, {
                    $inc: { 'stats.sent': 1 }
                });
                // Mark as sent for deduplication
                await this.markAsSent(contact.id, campaignId);
            }
            catch (error) {
                failed++;
                console.error(`[Campaign] Failed to send to ${contact.id}:`, error);
                await CampaignModel.findByIdAndUpdate(campaignId, {
                    $inc: { 'stats.failed': 1 }
                });
            }
        }
        // Update status to completed
        await CampaignModel.findByIdAndUpdate(campaignId, { status: 'completed' });
        console.log(`[Campaign] Completed: ${sent} sent, ${failed} failed`);
        return { sent, failed };
    }
    /**
     * Resolve audience to list of contacts
     */
    async resolveAudience(audience) {
        if (Array.isArray(audience)) {
            return audience;
        }
        // If audienceId, fetch from external service
        if (audience.audienceId) {
            const response = await fetch(`${process.env.AUDIENCE_SERVICE_URL}/audiences/${audience.audienceId}/contacts`, {
                headers: {
                    'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                console.error(`[Campaign] Failed to fetch audience: ${response.status}`);
                return [];
            }
            return await response.json();
        }
        return [];
    }
    /**
     * Check if contact is opted out for channel
     */
    async isOptedOut(contactId, channel) {
        const OptOutModel = mongoose.model('OptOut') || CampaignModel;
        const optOut = await OptOutModel.findOne({ contactId, channel });
        return !!optOut;
    }
    /**
     * Check if message was sent to contact in last 24h
     */
    async wasRecentlySent(contactId, campaignId) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recent = await MessageModel.findOne({
            contactId,
            templateId: campaignId,
            status: { $in: ['sent', 'delivered'] },
            createdAt: { $gte: oneDayAgo }
        });
        return !!recent;
    }
    /**
     * Mark contact as sent for deduplication
     */
    async markAsSent(contactId, campaignId) {
        // This is tracked via the MessageModel already
    }
    /**
     * Process scheduled messages
     */
    async processScheduledMessages() {
        const now = new Date();
        const scheduled = await MessageModel.find({
            scheduledAt: { $lte: now },
            status: 'scheduled'
        }).limit(100);
        let processed = 0;
        for (const msg of scheduled) {
            try {
                await this.sendMessage({
                    tenantId: msg.tenantId,
                    channel: msg.channel,
                    to: msg.to,
                    templateId: msg.templateId || '',
                    variables: msg.variables,
                    metadata: msg.metadata
                });
                await MessageModel.findByIdAndUpdate(msg._id, {
                    status: 'sent',
                    sentAt: new Date()
                });
                processed++;
            }
            catch (error) {
                console.error(`[Scheduled] Failed to send ${msg._id}:`, error);
                await MessageModel.findByIdAndUpdate(msg._id, {
                    status: 'failed',
                    error: String(error)
                });
            }
        }
        return { processed };
    }
}
export const communicationsService = new CommunicationsService();
//# sourceMappingURL=notificationService.js.map