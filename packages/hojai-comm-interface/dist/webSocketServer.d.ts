import { WebSocketMessage, WebSocketConnection } from './types/index.js';
declare class WebSocketServerManager {
    private wss?;
    private connections;
    private tenantConnections;
    private heartbeatInterval?;
    private messageHandler?;
    /**
     * Initialize WebSocket server
     */
    initialize(port?: number): void;
    /**
     * Handle new WebSocket connection
     */
    private handleConnection;
    /**
     * Handle incoming WebSocket message
     */
    private handleMessage;
    /**
     * Handle chat message
     */
    private handleChatMessage;
    /**
     * Handle typing indicator
     */
    private handleTypingIndicator;
    /**
     * Handle join conversation
     */
    private handleJoinConversation;
    /**
     * Handle leave conversation
     */
    private handleLeaveConversation;
    /**
     * Handle disconnect
     */
    private handleDisconnect;
    /**
     * Ping all connections to check liveness
     */
    private pingAll;
    /**
     * Send message to specific client
     */
    send(connectionId: string, message: WebSocketMessage): boolean;
    /**
     * Send error to client
     */
    private sendError;
    /**
     * Broadcast message to all connections in a conversation
     */
    broadcastToConversation(conversationId: string, message: WebSocketMessage, excludeConnectionId?: string): void;
    /**
     * Broadcast to all connections of a tenant
     */
    broadcastToTenant(tenantId: string, message: WebSocketMessage): void;
    /**
     * Send to specific user across all their connections
     */
    sendToUser(tenantId: string, userId: string, message: WebSocketMessage): void;
    /**
     * Register message handler for external processing
     */
    onMessage(handler: (data: {
        tenantId: string;
        userId: string;
        conversationId: string;
        message: string;
    }) => Promise<void>): void;
    /**
     * Get connection count
     */
    getConnectionCount(): number;
    /**
     * Get connections for a tenant
     */
    getTenantConnectionCount(tenantId: string): number;
    /**
     * Get all active connections
     */
    getConnections(): WebSocketConnection[];
    /**
     * Shutdown server
     */
    shutdown(): void;
}
export declare const webSocketServer: WebSocketServerManager;
export {};
//# sourceMappingURL=webSocketServer.d.ts.map