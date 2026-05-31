/**
 * HOJAI Learning Hooks
 * Import into any service to enable auto-learning
 *
 * Usage:
 *   import { addLearningHooks } from './hooks';
 *   addLearningHooks(app);
 */
export declare function learnFromChat(data: {
    intent: string;
    query: string;
    response: string;
    success: boolean;
    refinement?: string;
    duration?: number;
}): Promise<void>;
export declare function learnFromSignal(data: {
    signalType: string;
    userAction: string;
    outcome: string;
    confidence?: number;
}): Promise<void>;
export declare function learnFromEvent(data: {
    eventType: string;
    context: any;
    success: boolean;
    improvement?: string;
}): Promise<void>;
export declare function learnFromConversion(data: {
    trigger: string;
    action: string;
    result: string;
    revenue?: number;
}): Promise<void>;
export declare function learnFromCorrection(data: {
    wrong: string;
    correct: string;
    context: string;
}): Promise<void>;
export declare function learnEverything(data: {
    chats?: any[];
    signals?: any[];
    events?: any[];
    conversions?: any[];
    corrections?: any[];
}): Promise<void>;
export declare function learningMiddleware(req: any, res: any, next: any): void;
export declare function addChatLearningHooks(app: any): void;
export declare function addSignalLearningHooks(app: any): void;
export declare function addEventLearningHooks(): (event: any) => Promise<void>;
export declare function addCorrectionHook(): (data: {
    wrong: string;
    correct: string;
    context: any;
}) => Promise<void>;
export declare function addWorkforceLearningHooks(): {
    onTaskComplete: (task: any) => Promise<void>;
    onLevelUp: (employee: any) => Promise<void>;
};
export declare function getAllLearnings(): Promise<any>;
//# sourceMappingURL=hooks.d.ts.map