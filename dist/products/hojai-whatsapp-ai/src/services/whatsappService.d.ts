/**
 * WhatsApp Business API Service
 *
 * Handles:
 * - Sending messages
 * - Template messages
 * - Media messages
 * - Status updates
 */
export declare class WhatsAppService {
    private accessToken;
    private phoneNumberId;
    private apiVersion;
    private baseUrl;
    constructor();
    private getHeaders;
    /**
     * Send text message
     */
    sendTextMessage(to: string, body: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    /**
     * Send template message
     */
    sendTemplate(to: string, templateName: string, components?: any[]): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    /**
     * Send interactive buttons message
     */
    sendButtons(to: string, body: string, buttons: Array<{
        type: string;
        title: string;
        id?: string;
        phone_number?: string;
    }>): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    /**
     * Send reply buttons (quick replies)
     */
    sendReplyButtons(to: string, body: string, buttons: string[]): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    /**
     * Send image
     */
    sendImage(to: string, imageUrl: string, caption?: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    /**
     * Send document
     */
    sendDocument(to: string, documentUrl: string, filename: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    /**
     * Mark message as read
     */
    markAsRead(messageId: string): Promise<boolean>;
    /**
     * Get message status
     */
    getMessageStatus(messageId: string): Promise<string>;
    /**
     * Get templates
     */
    getTemplates(): Promise<any[]>;
    /**
     * Create template (requires WhatsApp Business API approval)
     */
    createTemplate(params: {
        name: string;
        category: string;
        language: string;
        components: any[];
    }): Promise<{
        success: boolean;
        id?: string;
        error?: string;
    }>;
}
export declare const whatsappService: WhatsAppService;
//# sourceMappingURL=whatsappService.d.ts.map