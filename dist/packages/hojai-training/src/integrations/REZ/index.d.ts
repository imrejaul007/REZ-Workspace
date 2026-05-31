/**
 * REZ Signal Connector - Connect REZ signals → Training
 *
 * REZ Signal Aggregator (4142) → Training Pipeline
 * REZ Attribution System (4120) → Training
 */
export interface REZSignalData {
    userId: string;
    type: string;
    source: string;
    properties: any;
    confidence: number;
    tenantId: string;
}
export declare class REZSignalConnector {
    private trainingUrl;
    constructor(trainingUrl?: string);
    onSignal(signal: REZSignalData): Promise<void>;
    batchSignals(signals: REZSignalData[]): Promise<void>;
}
export declare const rezSignalConnector: REZSignalConnector;
//# sourceMappingURL=index.d.ts.map