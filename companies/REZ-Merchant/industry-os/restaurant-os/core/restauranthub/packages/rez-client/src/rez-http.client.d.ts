import { ConfigService } from '@nestjs/config';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { CircuitState } from './types/rez.types';
export declare class RezHttpClient {
    private readonly config;
    private readonly logger;
    private readonly circuits;
    constructor(config: ConfigService);
    private getCircuit;
    private isOpen;
    private recordSuccess;
    private recordFailure;
    getCircuitState(serviceKey: string): CircuitState;
    buildInstance(baseURL: string): AxiosInstance;
    private withRetry;
    request<T>(serviceKey: string, instance: AxiosInstance, cfg: AxiosRequestConfig, correlationId?: string): Promise<T | null>;
    get<T>(serviceKey: string, instance: AxiosInstance, url: string, params?: Record<string, unknown>, correlationId?: string): Promise<T | null>;
    post<T>(serviceKey: string, instance: AxiosInstance, url: string, data?: unknown, correlationId?: string): Promise<T | null>;
    put<T>(serviceKey: string, instance: AxiosInstance, url: string, data?: unknown, correlationId?: string): Promise<T | null>;
    delete<T>(serviceKey: string, instance: AxiosInstance, url: string, correlationId?: string): Promise<T | null>;
}
