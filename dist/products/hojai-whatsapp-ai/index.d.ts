/**
 * Hojai WhatsApp AI
 * Version: 1.0 | Date: May 30, 2026
 */
export interface WhatsAppMessage {
    from: string;
    body: string;
    type: 'text' | 'image' | 'document' | 'location';
    timestamp: string;
}
export interface WhatsAppAgent {
    id: string;
    name: string;
    greeting: string;
    instructions: string;
    status: 'active' | 'inactive';
}
export declare class WhatsAppAI {
    sendMessage(to: string, message: string): Promise<{
        message_id: string;
        status: string;
    }>;
    createAgent(config: WhatsAppAgent): Promise<{
        id: string;
        name: string;
        greeting: string;
        instructions: string;
        status: "active" | "inactive";
    }>;
    invokeAgent(agentId: string, message: string): Promise<{
        response: string;
        agent_id: string;
        confidence: number;
    }>;
}
export default WhatsAppAI;
//# sourceMappingURL=index.d.ts.map