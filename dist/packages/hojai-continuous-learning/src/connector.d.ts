/**
 * Continuous Learning Connector
 * Hook into ALL services to learn from everything
 */
export declare class ContinuousLearningConnector {
    fromChat(data: {
        intent: string;
        query: string;
        response: string;
        success: boolean;
        refinement?: string;
    }): Promise<void>;
    fromSignal(data: {
        signalType: string;
        userAction: string;
        outcome: string;
    }): Promise<void>;
    fromEvent(data: {
        eventType: string;
        context: any;
        success: boolean;
        improvement?: string;
    }): Promise<void>;
    fromConversion(data: {
        trigger: string;
        action: string;
        result: string;
        revenue?: number;
    }): Promise<void>;
    fromCorrection(data: {
        wrong: string;
        correct: string;
        context: string;
    }): Promise<void>;
    fromEverything(data: {
        chats?: any[];
        signals?: any[];
        events?: any[];
        conversions?: any[];
        corrections?: any[];
    }): Promise<void>;
}
export declare const continuousLearning: ContinuousLearningConnector;
export declare function hookREZSignals(): string;
export declare function hookHOJAIAgents(): string;
export declare function hookHOJAIMemory(): string;
export declare function hookHOJAIWorkforce(): string;
export declare function hookConversations(): string;
//# sourceMappingURL=connector.d.ts.map