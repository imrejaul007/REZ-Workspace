"use strict";
// ============================================
// HOJAI AI - SDR Agent Outreach Engine Service
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.outreachEngine = exports.OutreachEngine = void 0;
const models_1 = require("../models");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class OutreachEngine {
    config;
    constructor(config) {
        this.config = {
            channels: config?.channels || {
                email: { enabled: true },
                linkedin: { enabled: false },
                phone: { enabled: false },
                sms: { enabled: false },
                whatsapp: { enabled: false }
            },
            templates: config?.templates || this.getDefaultTemplates(),
            personalization: config?.personalization || {
                firstName: true,
                companyName: true,
                title: true,
                painPoints: true,
                recentNews: false
            },
            scheduling: config?.scheduling || {
                timezone: 'America/New_York',
                bestTimes: [
                    { day: 1, hour: 9 },
                    { day: 1, hour: 14 },
                    { day: 2, hour: 10 },
                    { day: 3, hour: 11 },
                    { day: 4, hour: 9 },
                    { day: 4, hour: 15 }
                ],
                avoidTimes: [
                    { day: 5, hour: 17 },
                    { day: 6, hour: 12 },
                    { day: 0, hour: 12 }
                ]
            }
        };
    }
    /**
     * Send outreach message to a lead
     */
    async sendOutreach(tenantId, leadId, channel, message, scheduledFor, ownerId) {
        logger_1.logger.info('Sending outreach', { tenantId, leadId, channel });
        // Validate channel is enabled
        if (!this.isChannelEnabled(channel)) {
            return {
                success: false,
                outreach: {},
                error: `${channel} channel is not enabled`
            };
        }
        // Get lead
        const lead = await models_1.Lead.findOne({ _id: leadId, tenantId });
        if (!lead) {
            return {
                success: false,
                outreach: {},
                error: 'Lead not found'
            };
        }
        // Get contact for personalization
        const contact = await models_1.Contact.findById(lead.contactId);
        if (!contact) {
            return {
                success: false,
                outreach: {},
                error: 'Contact not found'
            };
        }
        // Personalize message
        const personalizedMessage = this.personalizeMessage(message.body, contact, message.personalization);
        const personalizedSubject = message.subject
            ? this.personalizeMessage(message.subject, contact, message.personalization)
            : undefined;
        // Create outreach record
        const outreach = await models_1.Outreach.create({
            tenantId,
            leadId: lead._id,
            channel,
            status: types_1.OutreachStatus.PENDING,
            subject: personalizedSubject,
            body: personalizedMessage,
            templateId: message.templateId,
            personalization: message.personalization,
            metadata: {
                attachments: message.attachments,
                scheduledFor,
                createdBy: ownerId
            }
        });
        // If scheduled, mark as pending
        if (scheduledFor) {
            logger_1.logger.info('Outreach scheduled', { tenantId, leadId, scheduledFor });
            return {
                success: true,
                outreach: this.mapToIOutreach(outreach)
            };
        }
        // Send immediately
        try {
            await this.sendViaChannel(channel, contact, {
                subject: personalizedSubject,
                body: personalizedMessage,
                attachments: message.attachments
            });
            // Update outreach status
            outreach.status = types_1.OutreachStatus.SENT;
            outreach.sentAt = new Date();
            await outreach.save();
            // Update lead
            lead.lastContactedAt = new Date();
            if (lead.stage === types_1.LeadStage.NEW) {
                lead.stage = types_1.LeadStage.CONTACTED;
            }
            await lead.save();
            // Log activity
            await models_1.Activity.create({
                tenantId,
                leadId: lead._id,
                type: 'outreach',
                description: `Sent ${channel} outreach`,
                metadata: { outreachId: outreach._id, channel },
                createdBy: ownerId || 'system'
            });
            logger_1.logger.info('Outreach sent successfully', { tenantId, leadId, outreachId: outreach._id });
            return {
                success: true,
                outreach: this.mapToIOutreach(outreach)
            };
        }
        catch (error) {
            // Mark as failed
            outreach.status = types_1.OutreachStatus.FAILED;
            outreach.errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await outreach.save();
            logger_1.logger.error('Outreach failed', { tenantId, leadId, error });
            return {
                success: false,
                outreach: this.mapToIOutreach(outreach),
                error: outreach.errorMessage
            };
        }
    }
    /**
     * Send outreach via specific channel
     */
    async sendViaChannel(channel, contact, message) {
        const email = contact.email;
        const phone = contact.phone;
        switch (channel) {
            case types_1.OutreachChannel.EMAIL:
                await this.sendEmail(email, message.subject || '', message.body, message.attachments);
                break;
            case types_1.OutreachChannel.LINKEDIN:
                const linkedinUrl = contact.linkedinUrl;
                if (!linkedinUrl)
                    throw new Error('No LinkedIn URL for contact');
                await this.sendLinkedInMessage(linkedinUrl, message.body);
                break;
            case types_1.OutreachChannel.PHONE:
                if (!phone)
                    throw new Error('No phone number for contact');
                await this.initiateCall(phone, message.body);
                break;
            case types_1.OutreachChannel.SMS:
                if (!phone)
                    throw new Error('No phone number for contact');
                await this.sendSMS(phone, message.body);
                break;
            case types_1.OutreachChannel.WHATSAPP:
                if (!phone)
                    throw new Error('No phone number for contact');
                await this.sendWhatsApp(phone, message.body);
                break;
            default:
                throw new Error(`Unsupported channel: ${channel}`);
        }
    }
    /**
     * Send email via configured provider
     */
    async sendEmail(to, subject, body, attachments) {
        // In production, integrate with SendGrid, Mailgun, AWS SES, etc.
        logger_1.logger.info('Sending email', { to, subject });
        if (!this.config.channels.email.enabled) {
            throw new Error('Email channel not configured');
        }
        // Simulate email send (in production, call actual email API)
        // Example with SendGrid:
        // const sgMail = require('@sendgrid/mail');
        // await sgMail.send({ to, from: this.config.channels.email.fromEmail, subject, html: body });
        return Promise.resolve();
    }
    /**
     * Send LinkedIn message
     */
    async sendLinkedInMessage(linkedinUrl, message) {
        if (!this.config.channels.linkedin.enabled) {
            throw new Error('LinkedIn channel not configured');
        }
        logger_1.logger.info('Sending LinkedIn message', { linkedinUrl, messageLength: message.length });
        // In production, integrate with LinkedIn API or use a service like Phantombuster
        return Promise.resolve();
    }
    /**
     * Initiate phone call
     */
    async initiateCall(phone, message) {
        if (!this.config.channels.phone.enabled) {
            throw new Error('Phone channel not configured');
        }
        logger_1.logger.info('Initiating call', { phone, messagePreview: message.substring(0, 50) });
        // In production, integrate with Twilio for click-to-call
        return Promise.resolve();
    }
    /**
     * Send SMS
     */
    async sendSMS(phone, message) {
        if (!this.config.channels.sms.enabled) {
            throw new Error('SMS channel not configured');
        }
        logger_1.logger.info('Sending SMS', { phone, messageLength: message.length });
        // In production, integrate with Twilio, AWS SNS, etc.
        return Promise.resolve();
    }
    /**
     * Send WhatsApp message
     */
    async sendWhatsApp(phone, message) {
        if (!this.config.channels.whatsapp.enabled) {
            throw new Error('WhatsApp channel not configured');
        }
        logger_1.logger.info('Sending WhatsApp message', { phone, messageLength: message.length });
        // In production, integrate with Twilio WhatsApp API
        return Promise.resolve();
    }
    /**
     * Personalize message with contact data
     */
    personalizeMessage(template, contact, additionalVars) {
        let personalized = template;
        // Standard variables
        const replacements = {
            '{{firstName}}': contact.firstName || 'there',
            '{{lastName}}': contact.lastName || '',
            '{{fullName}}': `${contact.firstName}${contact.lastName ? ' ' + contact.lastName : ''}`,
            '{{email}}': contact.email || '',
            '{{title}}': contact.title || '',
            '{{company}}': contact.company || '',
            '{{companySize}}': contact.companySize || ''
        };
        // Add additional variables
        if (additionalVars) {
            for (const [key, value] of Object.entries(additionalVars)) {
                replacements[`{{${key}}}`] = value;
            }
        }
        // Replace all variables
        for (const [variable, value] of Object.entries(replacements)) {
            personalized = personalized.replace(new RegExp(variable, 'g'), value);
        }
        return personalized;
    }
    /**
     * Check if channel is enabled
     */
    isChannelEnabled(channel) {
        switch (channel) {
            case types_1.OutreachChannel.EMAIL:
                return this.config.channels.email.enabled;
            case types_1.OutreachChannel.LINKEDIN:
                return this.config.channels.linkedin.enabled;
            case types_1.OutreachChannel.PHONE:
                return this.config.channels.phone.enabled;
            case types_1.OutreachChannel.SMS:
                return this.config.channels.sms.enabled;
            case types_1.OutreachChannel.WHATSAPP:
                return this.config.channels.whatsapp.enabled;
            default:
                return false;
        }
    }
    /**
     * Get outreach history for a lead
     */
    async getOutreachHistory(tenantId, leadId) {
        const outreaches = await models_1.Outreach.find({ tenantId, leadId })
            .sort({ createdAt: -1 });
        return outreaches.map(o => this.mapToIOutreach(o));
    }
    /**
     * Update outreach status (webhook from external services)
     */
    async updateOutreachStatus(tenantId, outreachId, status, metadata) {
        const outreach = await models_1.Outreach.findOne({ _id: outreachId, tenantId });
        if (!outreach) {
            return null;
        }
        outreach.status = status;
        if (metadata) {
            if (metadata.deliveredAt)
                outreach.deliveredAt = metadata.deliveredAt;
            if (metadata.openedAt)
                outreach.openedAt = metadata.openedAt;
            if (metadata.clickedAt)
                outreach.clickedAt = metadata.clickedAt;
            if (metadata.repliedAt)
                outreach.repliedAt = metadata.repliedAt;
        }
        await outreach.save();
        // Log activity if opened/clicked/replied
        if (status === types_1.OutreachStatus.OPENED) {
            await models_1.Activity.create({
                tenantId,
                leadId: outreach.leadId,
                type: 'email_opened',
                description: 'Opened email',
                metadata: { outreachId: outreach._id },
                createdBy: 'system'
            });
        }
        else if (status === types_1.OutreachStatus.CLICKED) {
            await models_1.Activity.create({
                tenantId,
                leadId: outreach.leadId,
                type: 'email_clicked',
                description: 'Clicked link in email',
                metadata: { outreachId: outreach._id },
                createdBy: 'system'
            });
        }
        else if (status === types_1.OutreachStatus.REPLIED) {
            await models_1.Activity.create({
                tenantId,
                leadId: outreach.leadId,
                type: 'email_replied',
                description: 'Replied to email',
                metadata: { outreachId: outreach._id },
                createdBy: 'system'
            });
            // Update lead stage to qualified if first reply
            await models_1.Lead.findByIdAndUpdate(outreach.leadId, {
                stage: types_1.LeadStage.QUALIFIED
            });
        }
        return this.mapToIOutreach(outreach);
    }
    /**
     * Get best time to send outreach
     */
    getBestSendTime(timezone) {
        const tz = timezone || this.config.scheduling.timezone;
        const now = new Date();
        // Simple implementation: return next best time slot
        // In production, use proper timezone handling with libraries like luxon or date-fns-tz
        const nextBestTime = new Date(now);
        nextBestTime.setDate(nextBestTime.getDate() + 1);
        nextBestTime.setHours(9, 0, 0, 0);
        return nextBestTime;
    }
    /**
     * Get default outreach templates
     */
    getDefaultTemplates() {
        return [
            {
                id: 'cold-email-intro',
                name: 'Cold Email Introduction',
                channel: types_1.OutreachChannel.EMAIL,
                subject: 'Quick question about {{company}}',
                body: `Hi {{firstName}},

I noticed {{company}} is growing rapidly in the {{industry}} space. I wanted to reach out because we've helped similar companies solve their biggest challenge: [specific problem].

Would you be open to a quick 15-minute call this week to see if there's a fit?

Best,
[Your name]`,
                variables: ['firstName', 'company', 'industry'],
                isActive: true
            },
            {
                id: 'linkedin-connection',
                name: 'LinkedIn Connection Request',
                channel: types_1.OutreachChannel.LINKEDIN,
                subject: undefined,
                body: `Hi {{firstName}}, I noticed your work at {{company}} and I'd love to connect to learn more about what you're building.`,
                variables: ['firstName', 'company'],
                isActive: true
            },
            {
                id: 'follow-up-email',
                name: 'Follow-up Email',
                channel: types_1.OutreachChannel.EMAIL,
                subject: 'Following up on my note',
                body: `Hi {{firstName}},

Just wanted to follow up on my previous message. I know you're busy, but I believe [product] could help {{company}} achieve [specific goal].

Would you have 10 minutes this week for a quick chat?

Best,
[Your name]`,
                variables: ['firstName', 'company'],
                isActive: true
            }
        ];
    }
    /**
     * Map MongoDB document to IOutreach
     */
    mapToIOutreach(doc) {
        return {
            id: doc._id.toString(),
            tenantId: doc.tenantId,
            leadId: doc.leadId.toString(),
            channel: doc.channel,
            status: doc.status,
            subject: doc.subject,
            body: doc.body,
            templateId: doc.templateId,
            personalization: doc.personalization,
            sentAt: doc.sentAt,
            deliveredAt: doc.deliveredAt,
            openedAt: doc.openedAt,
            clickedAt: doc.clickedAt,
            repliedAt: doc.repliedAt,
            errorMessage: doc.errorMessage,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        };
    }
}
exports.OutreachEngine = OutreachEngine;
exports.outreachEngine = new OutreachEngine();
//# sourceMappingURL=outreachEngine.js.map