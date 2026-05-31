import { WhatsAppWebhookPayload } from './types/index.js';
declare class WhatsAppBridge {
    private clients;
    private messageHandlers;
    private statusHandlers;
    private wsServer?;
    /**
     * Start WhatsApp integration for a tenant
     */
    connect(tenantId: string): Promise<void>;
    /**
     * Disconnect WhatsApp for a tenant
     */
    disconnect(tenantId: string): Promise<void>;
    /**
     * Verify WhatsApp API credentials
     */
    private verifyCredentials;
    /**
     * Register a message handler
     */
    onMessage(tenantId: string, handler: (message: unknown) => Promise<void>): void;
    /**
     * Register a status handler
     */
    onStatusUpdate(tenantId: string, handler: (status: unknown) => Promise<void>): void;
    /**
     * Handle incoming webhook from WhatsApp
     */
    handleWebhook(tenantId: string, payload: WhatsAppWebhookPayload): Promise<void>;
    /**
     * Route incoming message to appropriate handler
     */
    private routeMessage;
    /**
     * Handle message status updates (sent, delivered, read, failed)
     */
    private handleStatusUpdate;
    /**
     * Send a message via WhatsApp
     */
    sendMessage(tenantId: string, to: string, text: string): Promise<string | null>;
    /**
     * Send an interactive message with buttons
     */
    sendInteractiveMessage(tenantId: string, to: string, header: string, body: string, buttons: Array<{
        id: string;
        title: string;
    }>, footer?: string): Promise<string | null>;
    /**
     * Send a media message
     */
    sendMediaMessage(tenantId: string, to: string, mediaUrl: string, caption?: string, type?: 'image' | 'video' | 'audio' | 'document'): Promise<string | null>;
    /**
     * Start WebSocket server for real-time WhatsApp events
     */
    startWebSocketServer(port?: number): void;
    /**
     * Verify webhook subscription
     */
    verifyWebhook(mode: string, token: string, challenge: string): boolean;
    /**
     * Get connection status for a tenant
     */
    getStatus(tenantId: string): {
        connected: boolean;
        connectedAt?: Date;
    };
    /**
     * Get all connected tenants
     */
    getConnectedTenants(): string[];
    /**
     * Shutdown bridge
     */
    shutdown(): Promise<void>;
}
export declare const whatsAppBridge: WhatsAppBridge;
export {};
//# sourceMappingURL=whatsappBridge.d.ts.map