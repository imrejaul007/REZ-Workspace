/**
 * HOJAI RAG Service Configuration
 */
declare const config: {
    port: number;
    nodeEnv: string;
    logLevel: string;
    serviceName: string;
    version: string;
    vectorServiceUrl: string;
    llmProvider: string;
    openaiApiKey: string | undefined;
    openaiModel: string;
    openaiBaseUrl: string;
    embeddingModel: string;
    embeddingDimension: number;
    defaultSearchLimit: number;
    defaultMinScore: number;
    defaultMaxTokens: number;
    defaultTemperature: number;
    internalServiceToken: string | undefined;
};
export default config;
//# sourceMappingURL=index.d.ts.map