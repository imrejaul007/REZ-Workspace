import { KnowledgeBaseItem } from './conversationService.js';
interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export declare class OpenAIService {
    private client;
    constructor();
    /**
     * Generate AI response using GPT-4
     */
    generateResponse(params: {
        merchantPersona: string;
        knowledgeBase: KnowledgeBaseItem[];
        userMessage: string;
        conversationHistory: ConversationMessage[];
        customerName?: string;
        customerContext?: Record<string, unknown>;
    }): Promise<{
        response: string;
        intent: string;
        confidence: number;
        tokens: number;
    }>;
    /**
     * Build knowledge base text for the prompt
     */
    private buildKnowledgeBaseText;
    /**
     * Build system prompt with merchant persona and rules
     */
    private buildSystemPrompt;
    /**
     * Detect intent from user message
     */
    private detectIntent;
    /**
     * Clean and format response
     */
    private cleanResponse;
    /**
     * Fallback response when OpenAI fails
     */
    private getFallbackResponse;
    /**
     * Generate response for template messages
     */
    generateTemplate(params: {
        template: string;
        variables: Record<string, string>;
    }): Promise<string>;
}
export declare const openaiService: OpenAIService;
export {};
//# sourceMappingURL=openaiService.d.ts.map