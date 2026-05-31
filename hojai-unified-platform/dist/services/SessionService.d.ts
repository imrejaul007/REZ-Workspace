export declare class SessionService {
    private client;
    private connected;
    constructor();
    private connect;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    get<T = any>(key: string): Promise<T | null>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    increment(key: string): Promise<number>;
    isConnected(): boolean;
    disconnect(): Promise<void>;
}
export declare const sessionService: SessionService;
