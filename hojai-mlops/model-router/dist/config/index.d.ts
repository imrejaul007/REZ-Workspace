/**
 * Hojai Model Router Configuration
 */
interface Config {
    port: number;
    nodeEnv: string;
    logLevel: string;
    serviceName: string;
    version: string;
    providers: {
        openai: {
            enabled: boolean;
            apiKey: string;
            baseUrl: string;
        };
        anthropic: {
            enabled: boolean;
            apiKey: string;
            baseUrl: string;
        };
        google: {
            enabled: boolean;
            apiKey: string;
        };
        meta: {
            enabled: boolean;
            apiKey: string;
        };
    };
    routing: {
        defaultMaxTokens: number;
        defaultTemperature: number;
        fallbackAttempts: number;
    };
}
declare const config: Config;
export default config;
//# sourceMappingURL=index.d.ts.map