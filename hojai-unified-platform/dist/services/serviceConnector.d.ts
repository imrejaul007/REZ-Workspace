/**
 * HOJAI Unified Platform - Service Connector
 * Connects to HOJAI Core services: Memory, Event Bus, Training Pipeline
 *
 * Services:
 * - hojai-memory (4520): Store conversation memory and user context
 * - hojai-event (4510): Emit events when actions happen
 * - hojai-training-pipeline (4880): Learn from conversations
 */
import { AxiosInstance } from 'axios';
export interface ServiceHealth {
    service: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    latencyMs?: number;
    error?: string;
}
export interface ServiceConnectorConfig {
    memoryUrl: string;
    eventUrl: string;
    trainingUrl: string;
    timeout?: number;
    retries?: number;
}
export interface MemoryContext {
    userId: string;
    conversationId: string;
    channel: string;
    recentMessages?: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: Date;
    }>;
    preferences?: Record<string, unknown>;
}
export interface StoredMemory {
    id: string;
    userId: string;
    content: string;
    type: string;
    tier: string;
    importance?: number;
}
export interface EmittedEvent {
    type: string;
    category: string;
    name: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
    sessionId?: string;
    channel?: string;
    properties?: Record<string, unknown>;
    metrics?: Record<string, number>;
}
export interface TrainingData {
    conversationId: string;
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        metadata?: Record<string, unknown>;
    }>;
    tenantId?: string;
    userId?: string;
}
declare class ServiceConnector {
    private memoryClient;
    private eventClient;
    private trainingClient;
    private config;
    private initialized;
    private healthCache;
    private healthCacheTtlMs;
    constructor(config?: Partial<ServiceConnectorConfig>);
    /**
     * Initialize all service connections
     */
    initialize(): Promise<void>;
    /**
     * Setup axios interceptors for logging and tenant headers
     */
    private setupInterceptors;
    /**
     * Test connections to all services
     */
    private testConnections;
    /**
     * Connect to memory service for a specific tenant
     */
    connectToMemory(tenantId: string): AxiosInstance;
    /**
     * Get user context from memory service
     */
    getUserContext(tenantId: string, userId: string): Promise<MemoryContext | null>;
    /**
     * Store conversation in memory
     */
    storeConversation(tenantId: string, userId: string, conversationId: string, messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp?: Date;
    }>): Promise<StoredMemory[]>;
    /**
     * Store user preference in memory
     */
    storePreference(tenantId: string, userId: string, preferenceType: string, value: unknown): Promise<boolean>;
    /**
     * Get full context for AI processing (implements Memory Before Models)
     */
    getFullContext(tenantId: string, userId: string, entityId?: string): Promise<Record<string, unknown>>;
    /**
     * Connect to event service for a specific tenant
     */
    connectToEvent(tenantId: string): AxiosInstance;
    /**
     * Emit an event to the event bus
     */
    emitEvent(tenantId: string, event: EmittedEvent): Promise<string | null>;
    /**
     * Emit conversation started event
     */
    emitConversationStarted(tenantId: string, userId: string, conversationId: string, channel: string): Promise<string | null>;
    /**
     * Emit message sent event
     */
    emitMessageSent(tenantId: string, userId: string, conversationId: string, messageContent: string, channel: string, isFromBot: boolean): Promise<string | null>;
    /**
     * Emit intent recognized event
     */
    emitIntentRecognized(tenantId: string, userId: string, conversationId: string, intent: string, confidence: number): Promise<string | null>;
    /**
     * Emit action completed event
     */
    emitActionCompleted(tenantId: string, userId: string, conversationId: string, actionType: string, success: boolean): Promise<string | null>;
    /**
     * Connect to training pipeline for a specific tenant
     */
    connectToTraining(tenantId: string): AxiosInstance;
    /**
     * Send conversation to training pipeline for learning
     */
    sendToTraining(trainingData: TrainingData): Promise<boolean>;
    /**
     * Send user action to training pipeline
     */
    sendActionToTraining(tenantId: string, userId: string, actionType: string, properties?: Record<string, unknown>): Promise<boolean>;
    /**
     * Send feedback to training pipeline
     */
    sendFeedbackToTraining(tenantId: string, userId: string, feedbackType: 'positive' | 'negative' | 'rating' | 'correction', score?: number, content?: string): Promise<boolean>;
    /**
     * Send correction to training pipeline (for AI mistakes)
     */
    sendCorrectionToTraining(tenantId: string, userId: string, originalContent: string, correctedContent: string, reason?: string): Promise<boolean>;
    /**
     * Capture learning signal
     */
    captureLearningSignal(tenantId: string, sourceId: string, signalType: string, content: Record<string, unknown>, confidence?: number): Promise<boolean>;
    /**
     * Check health of a specific service
     */
    checkServiceHealth(service: 'memory' | 'event' | 'training'): Promise<ServiceHealth>;
    /**
     * Get health status of all connected services
     */
    getAllServiceHealth(): Promise<ServiceHealth[]>;
    /**
     * Check if all services are healthy
     */
    areAllServicesHealthy(): Promise<boolean>;
    /**
     * Clear health cache (force fresh check)
     */
    clearHealthCache(): void;
    /**
     * Check if connector is initialized
     */
    isInitialized(): boolean;
    /**
     * Shutdown connector and cleanup
     */
    shutdown(): Promise<void>;
}
export declare const serviceConnector: ServiceConnector;
export { ServiceConnector };
export default serviceConnector;
