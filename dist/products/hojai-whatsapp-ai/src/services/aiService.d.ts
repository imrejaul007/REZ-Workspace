export declare class AIService {
    /**
     * Generate AI response based on context
     */
    generateResponse(params: {
        tenantId: string;
        merchantId: string;
        userMessage: string;
        conversationHistory: Array<{
            role: string;
            content: string;
        }>;
        customerContext?: Record<string, unknown>;
    }): Promise<{
        response: string;
        intent: string;
        confidence: number;
        suggestedActions?: string[];
    }>;
    private detectIntent;
    private findKnowledgeAnswer;
    private checkAutomation;
    private generateFallbackResponse;
    /**
     * Generate personalized greeting based on time and context
     */
    generateGreeting(context?: {
        customerName?: string;
        isReturning?: boolean;
        lastVisit?: Date;
    }): string;
}
export declare const aiService: AIService;
//# sourceMappingURL=aiService.d.ts.map