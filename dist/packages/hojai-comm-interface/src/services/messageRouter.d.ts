import { MessageContext, EmployeeRoutingResult, Source } from '../types/index.js';
export interface RouteResult {
    success: boolean;
    conversationId?: string;
    messageId?: string;
    response?: string;
    employeeId?: string;
    routedTo?: {
        id: string;
        name: string;
        role: string;
    };
    confidence?: number;
    error?: string;
}
export interface IntentMatch {
    intent: string;
    confidence: number;
    entities: Record<string, unknown>;
}
declare class MessageRouter {
    private intentPatterns;
    private intentKeywords;
    /**
     * Detect intent from message content
     */
    detectIntent(message: string): IntentMatch;
    /**
     * Find the best employee for a message based on intent and availability
     */
    routeToEmployee(tenantId: string, intent: IntentMatch, preferredEmployeeId?: string): Promise<EmployeeRoutingResult | null>;
    /**
     * Check if an employee is available for new conversations
     */
    private isEmployeeAvailable;
    /**
     * Process incoming message and route to appropriate employee
     */
    processMessage(context: MessageContext): Promise<RouteResult>;
    /**
     * Generate AI response for a message
     */
    private generateAIResponse;
    /**
     * Handle case when no employees are available
     */
    private handleNoEmployeeAvailable;
    /**
     * Forward message to specific employee
     */
    forwardToEmployee(tenantId: string, conversationId: string, employeeId: string, message: string, source: Source, metadata?: Record<string, unknown>): Promise<RouteResult>;
}
export declare const messageRouter: MessageRouter;
export {};
//# sourceMappingURL=messageRouter.d.ts.map