import { IOutreach, OutreachChannel, OutreachStatus } from '../types';
export interface OutreachTemplate {
    id: string;
    name: string;
    channel: OutreachChannel;
    subject?: string;
    body: string;
    variables: string[];
    isActive: boolean;
}
export interface OutreachConfig {
    channels: {
        email: {
            enabled: boolean;
            apiKey?: string;
            fromName?: string;
            fromEmail?: string;
            dailyLimit?: number;
        };
        linkedin: {
            enabled: boolean;
            apiKey?: string;
            username?: string;
        };
        phone: {
            enabled: boolean;
            twilioAccountSid?: string;
            twilioAuthToken?: string;
            fromNumber?: string;
        };
        sms: {
            enabled: boolean;
            twilioAccountSid?: string;
            twilioAuthToken?: string;
            fromNumber?: string;
        };
        whatsapp: {
            enabled: boolean;
            twilioAccountSid?: string;
            twilioAuthToken?: string;
            fromNumber?: string;
        };
    };
    templates: OutreachTemplate[];
    personalization: {
        firstName: boolean;
        companyName: boolean;
        title: boolean;
        painPoints: boolean;
        recentNews: boolean;
    };
    scheduling: {
        timezone: string;
        bestTimes: {
            day: number;
            hour: number;
        }[];
        avoidTimes: {
            day: number;
            hour: number;
        }[];
    };
}
export declare class OutreachEngine {
    private config;
    constructor(config?: Partial<OutreachConfig>);
    /**
     * Send outreach message to a lead
     */
    sendOutreach(tenantId: string, leadId: string, channel: OutreachChannel, message: {
        body: string;
        subject?: string;
        templateId?: string;
        personalization?: Record<string, string>;
        attachments?: {
            name: string;
            url: string;
        }[];
    }, scheduledFor?: string, ownerId?: string): Promise<{
        success: boolean;
        outreach: IOutreach;
        error?: string;
    }>;
    /**
     * Send outreach via specific channel
     */
    private sendViaChannel;
    /**
     * Send email via configured provider
     */
    private sendEmail;
    /**
     * Send LinkedIn message
     */
    private sendLinkedInMessage;
    /**
     * Initiate phone call
     */
    private initiateCall;
    /**
     * Send SMS
     */
    private sendSMS;
    /**
     * Send WhatsApp message
     */
    private sendWhatsApp;
    /**
     * Personalize message with contact data
     */
    private personalizeMessage;
    /**
     * Check if channel is enabled
     */
    private isChannelEnabled;
    /**
     * Get outreach history for a lead
     */
    getOutreachHistory(tenantId: string, leadId: string): Promise<IOutreach[]>;
    /**
     * Update outreach status (webhook from external services)
     */
    updateOutreachStatus(tenantId: string, outreachId: string, status: OutreachStatus, metadata?: {
        deliveredAt?: Date;
        openedAt?: Date;
        clickedAt?: Date;
        repliedAt?: Date;
    }): Promise<IOutreach | null>;
    /**
     * Get best time to send outreach
     */
    getBestSendTime(timezone?: string): Date;
    /**
     * Get default outreach templates
     */
    private getDefaultTemplates;
    /**
     * Map MongoDB document to IOutreach
     */
    private mapToIOutreach;
}
export declare const outreachEngine: OutreachEngine;
//# sourceMappingURL=outreachEngine.d.ts.map