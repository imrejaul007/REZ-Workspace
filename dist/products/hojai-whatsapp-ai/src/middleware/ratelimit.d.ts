export declare function retry<T>(fn: () => Promise<T>, options?: {
    attempts?: number;
    delay?: number;
    backoff?: 'linear' | 'exponential';
    onError?: (err: Error, attempt: number) => void;
}): Promise<T>;
export declare function withRetry<T>(promise: Promise<T>, context: string): Promise<T | null>;
//# sourceMappingURL=ratelimit.d.ts.map