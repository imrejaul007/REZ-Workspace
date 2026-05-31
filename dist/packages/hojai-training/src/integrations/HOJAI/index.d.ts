/**
 * HOJAI Feedback Connector - Connect HOJAI feedback → Training
 *
 * HOJAI Agents → Training Pipeline
 */
export interface HOJAIFeedback {
    agentId: string;
    type: 'correction' | 'rating' | 'outcome' | 'escalation';
    quality: number;
    tenantId: string;
    data: any;
}
export declare class HOJAIFeedbackConnector {
    private trainingUrl;
    constructor(trainingUrl?: string);
    onFeedback(feedback: HOJAIFeedback): Promise<void>;
    corrections(corrections: HOJAIFeedback[]): Promise<void>;
}
export declare const hojaiFeedbackConnector: HOJAIFeedbackConnector;
//# sourceMappingURL=index.d.ts.map