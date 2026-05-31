/**
 * Feature Store Configuration
 */
interface Config {
    port: number;
    redis: {
        host: string;
        port: number;
        password: string;
        keyPrefix: string;
    };
    featureStore: {
        ttl: number;
        maxFeaturesPerEntity: number;
        maxBatchSize: number;
    };
    internalServiceToken: string;
}
declare const config: Config;
export default config;
//# sourceMappingURL=index.d.ts.map