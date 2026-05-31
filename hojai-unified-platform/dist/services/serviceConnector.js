/**
 * HOJAI Unified Platform - Service Connector
 * Connects to HOJAI Core services: Memory, Event Bus, Training Pipeline
 *
 * Services:
 * - hojai-memory (4520): Store conversation memory and user context
 * - hojai-event (4510): Emit events when actions happen
 * - hojai-training-pipeline (4880): Learn from conversations
 */
import axios from 'axios';
// ============================================================================
// SERVICE CONNECTOR CLASS
// ============================================================================
class ServiceConnector {
    memoryClient = null;
    eventClient = null;
    trainingClient = null;
    config;
    initialized = false;
    // Health status cache
    healthCache = new Map();
    healthCacheTtlMs = 30000; // 30 seconds
    constructor(config) {
        this.config = {
            memoryUrl: config?.memoryUrl || process.env.HOJAI_MEMORY_URL || 'http://localhost:4520',
            eventUrl: config?.eventUrl || process.env.HOJAI_EVENT_URL || 'http://localhost:4510',
            trainingUrl: config?.trainingUrl || process.env.HOJAI_TRAINING_URL || 'http://localhost:4880',
            timeout: config?.timeout || 10000,
            retries: config?.retries || 3
        };
    }
    /**
     * Initialize all service connections
     */
    async initialize() {
        if (this.initialized)
            return;
        console.log('[ServiceConnector] Initializing service connections...');
        // Create axios instances with default config
        this.memoryClient = axios.create({
            baseURL: this.config.memoryUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        this.eventClient = axios.create({
            baseURL: this.config.eventUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        this.trainingClient = axios.create({
            baseURL: this.config.trainingUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // Add request interceptor for logging
        this.setupInterceptors();
        // Test connections
        await this.testConnections();
        this.initialized = true;
        console.log('[ServiceConnector] All service connections initialized');
    }
    /**
     * Setup axios interceptors for logging and tenant headers
     */
    setupInterceptors() {
        // Memory client interceptors
        this.memoryClient?.interceptors.request.use((config) => {
            console.log(`[Memory] ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        });
        this.memoryClient?.interceptors.response.use((response) => response, (error) => {
            console.error(`[Memory] Error:`, error.message);
            return Promise.reject(error);
        });
        // Event client interceptors
        this.eventClient?.interceptors.request.use((config) => {
            console.log(`[Event] ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        });
        this.eventClient?.interceptors.response.use((response) => response, (error) => {
            console.error(`[Event] Error:`, error.message);
            return Promise.reject(error);
        });
        // Training client interceptors
        this.trainingClient?.interceptors.request.use((config) => {
            console.log(`[Training] ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        });
        this.trainingClient?.interceptors.response.use((response) => response, (error) => {
            console.error(`[Training] Error:`, error.message);
            return Promise.reject(error);
        });
    }
    /**
     * Test connections to all services
     */
    async testConnections() {
        console.log('[ServiceConnector] Testing service connections...');
        const results = await Promise.allSettled([
            this.checkServiceHealth('memory'),
            this.checkServiceHealth('event'),
            this.checkServiceHealth('training')
        ]);
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
            console.warn(`[ServiceConnector] ${failed.length} service(s) failed initial connection test`);
            // Don't fail initialization - services might start later
        }
        else {
            console.log('[ServiceConnector] All services connected successfully');
        }
    }
    // ============================================================================
    // MEMORY SERVICE (Port 4520)
    // ============================================================================
    /**
     * Connect to memory service for a specific tenant
     */
    connectToMemory(tenantId) {
        if (!this.memoryClient) {
            throw new Error('ServiceConnector not initialized. Call initialize() first.');
        }
        // Return a client with tenant header pre-set
        const client = axios.create({
            baseURL: this.config.memoryUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': tenantId
            }
        });
        return client;
    }
    /**
     * Get user context from memory service
     */
    async getUserContext(tenantId, userId) {
        try {
            const client = this.connectToMemory(tenantId);
            // Get recent memories
            const memoriesRes = await client.get('/api/memories', {
                params: { userId, limit: 50 }
            });
            // Get timeline events
            const timelineRes = await client.get('/api/memories/timeline', {
                params: { userId, limit: 20 }
            });
            if (!memoriesRes.data.data || memoriesRes.data.data.length === 0) {
                return null;
            }
            // Build context from memories
            const memories = memoriesRes.data.data;
            const timeline = timelineRes.data.data || [];
            // Extract recent messages from conversation memories
            const conversationMemories = memories.filter(m => m.type === 'conversation');
            const recentMessages = conversationMemories
                .slice(0, 10)
                .map(m => ({
                role: 'user',
                content: m.content,
                timestamp: new Date()
            }));
            // Extract preferences from preference memories
            const preferenceMemories = memories.filter(m => m.type === 'preference');
            const preferences = {};
            preferenceMemories.forEach(m => {
                try {
                    const data = JSON.parse(m.content);
                    Object.assign(preferences, data);
                }
                catch {
                    preferences[m.type] = m.content;
                }
            });
            return {
                userId,
                conversationId: '',
                channel: 'unknown',
                recentMessages,
                preferences
            };
        }
        catch (error) {
            console.error('[ServiceConnector] Failed to get user context:', error);
            return null;
        }
    }
    /**
     * Store conversation in memory
     */
    async storeConversation(tenantId, userId, conversationId, messages) {
        try {
            const client = this.connectToMemory(tenantId);
            const storedMemories = [];
            for (const message of messages) {
                const response = await client.post('/api/memories', {
                    userId,
                    entityType: 'session',
                    entityId: conversationId,
                    type: 'conversation',
                    content: message.content,
                    data: {
                        role: message.role,
                        conversationId,
                        timestamp: message.timestamp || new Date()
                    },
                    importance: 7,
                    confidence: 0.9,
                    source: 'hojai-unified-platform',
                    context: {
                        channel: 'unified'
                    }
                });
                if (response.data.data) {
                    storedMemories.push(response.data.data);
                }
            }
            console.log(`[ServiceConnector] Stored ${storedMemories.length} conversation memories`);
            return storedMemories;
        }
        catch (error) {
            console.error('[ServiceConnector] Failed to store conversation:', error);
            return [];
        }
    }
    /**
     * Store user preference in memory
     */
    async storePreference(tenantId, userId, preferenceType, value) {
        try {
            const client = this.connectToMemory(tenantId);
            await client.post('/api/memories', {
                userId,
                entityType: 'user',
                entityId: userId,
                type: 'preference',
                content: JSON.stringify({ [preferenceType]: value }),
                data: { [preferenceType]: value },
                importance: 8,
                confidence: 0.95,
                source: 'hojai-unified-platform'
            });
            return true;
        }
        catch (error) {
            console.error('[ServiceConnector] Failed to store preference:', error);
            return false;
        }
    }
    /**
     * Get full context for AI processing (implements Memory Before Models)
     */
    async getFullContext(tenantId, userId, entityId) {
        try {
            const client = this.connectToMemory(tenantId);
            const response = await client.get('/api/memories/context', {
                params: { userId, entityId }
            });
            return response.data.data || {};
        }
        catch (error) {
            console.error('[ServiceConnector] Failed to get full context:', error);
            return {};
        }
    }
    // ============================================================================
    // EVENT SERVICE (Port 4510)
    // ============================================================================
    /**
     * Connect to event service for a specific tenant
     */
    connectToEvent(tenantId) {
        if (!this.eventClient) {
            throw new Error('ServiceConnector not initialized. Call initialize() first.');
        }
        return axios.create({
            baseURL: this.config.eventUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': tenantId
            }
        });
    }
    /**
     * Emit an event to the event bus
     */
    async emitEvent(tenantId, event) {
        try {
            const client = this.connectToEvent(tenantId);
            const response = await client.post('/api/events', {
                type: event.type,
                category: event.category,
                name: event.name,
                userId: event.userId,
                entityType: event.entityType,
                entityId: event.entityId,
                sessionId: event.sessionId,
                channel: event.channel,
                properties: event.properties,
                metrics: event.metrics
            });
            if (response.data.data?.eventId) {
                console.log(`[ServiceConnector] Event emitted: ${event.type}`);
                return response.data.data.eventId;
            }
            return null;
        }
        catch (error) {
            console.error('[ServiceConnector] Failed to emit event:', error);
            return null;
        }
    }
    /**
     * Emit conversation started event
     */
    async emitConversationStarted(tenantId, userId, conversationId, channel) {
        return this.emitEvent(tenantId, {
            type: 'conversation.started',
            category: 'engagement',
            name: 'Conversation Started',
            userId,
            entityType: 'conversation',
            entityId: conversationId,
            channel,
            properties: {
                platform: 'hojai-unified-platform',
                source: 'chat'
            }
        });
    }
    /**
     * Emit message sent event
     */
    async emitMessageSent(tenantId, userId, conversationId, messageContent, channel, isFromBot) {
        return this.emitEvent(tenantId, {
            type: 'message.sent',
            category: 'engagement',
            name: 'Message Sent',
            userId,
            entityType: 'conversation',
            entityId: conversationId,
            channel,
            properties: {
                isFromBot,
                contentLength: messageContent.length,
                platform: 'hojai-unified-platform'
            },
            metrics: {
                messageLength: messageContent.length
            }
        });
    }
    /**
     * Emit intent recognized event
     */
    async emitIntentRecognized(tenantId, userId, conversationId, intent, confidence) {
        return this.emitEvent(tenantId, {
            type: 'intent.recognized',
            category: 'intelligence',
            name: 'Intent Recognized',
            userId,
            entityType: 'conversation',
            entityId: conversationId,
            properties: {
                intent,
                confidence,
                platform: 'hojai-unified-platform'
            },
            metrics: {
                confidence: confidence
            }
        });
    }
    /**
     * Emit action completed event
     */
    async emitActionCompleted(tenantId, userId, conversationId, actionType, success) {
        return this.emitEvent(tenantId, {
            type: 'action.completed',
            category: 'commerce',
            name: 'Action Completed',
            userId,
            entityType: 'action',
            entityId: `${conversationId}:${actionType}`,
            properties: {
                actionType,
                success,
                platform: 'hojai-unified-platform'
            },
            metrics: {
                success: success ? 1 : 0
            }
        });
    }
    // ============================================================================
    // TRAINING SERVICE (Port 4880)
    // ============================================================================
    /**
     * Connect to training pipeline for a specific tenant
     */
    connectToTraining(tenantId) {
        if (!this.trainingClient) {
            throw new Error('ServiceConnector not initialized. Call initialize() first.');
        }
        return axios.create({
            baseURL: this.config.trainingUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': tenantId
            }
        });
    }
    /**
     * Send conversation to training pipeline for learning
     */
    async sendToTraining(trainingData) {
        try {
            const client = this.connectToTraining(trainingData.tenantId || 'default');
            await client.post('/api/training/conversation', {
                conversationId: trainingData.conversationId,
                messages: trainingData.messages,
                tenantId: trainingData.tenantId,
                userId: trainingData.userId
            });
            console.log(`[ServiceConnector] Training data sent for conversation ${trainingData.conversationId}`);
            return true;
        }
        catch (error) {
            console.error('[ServiceConnector] Failed to send training data:', error);
            return false;
        }
    }
    /**
     * Send user action to training pipeline
     */
    async sendActionToTraining(tenantId, userId, actionType, properties) {
        try {
            const client = this.connectToTraining(tenantId);
            await client.post('/api/training/action', {
                type: actionType,
                tenantId,
                userId,
                properties
            });
            return true;
        }
        catch (error) {
            console.error('[ServiceConnector] Failed to send action to training:', error);
            return false;
        }
    }
    /**
     * Send feedback to training pipeline
     */
    async sendFeedbackToTraining(tenantId, userId, feedbackType, score, content) {
        try {
            const client = this.connectToTraining(tenantId);
            await client.post('/api/training/feedback', {
                type: feedbackType,
                score,
                content,
                tenantId,
                userId
            });
            return true;
        }
        catch (error) {
            console.error('[ServiceConnector] Failed to send feedback to training:', error);
            return false;
        }
    }
    /**
     * Send correction to training pipeline (for AI mistakes)
     */
    async sendCorrectionToTraining(tenantId, userId, originalContent, correctedContent, reason) {
        try {
            const client = this.connectToTraining(tenantId);
            await client.post('/api/training/correction', {
                originalContent,
                correctedContent,
                reason,
                tenantId,
                userId
            });
            return true;
        }
        catch (error) {
            console.error('[ServiceConnector] Failed to send correction to training:', error);
            return false;
        }
    }
    /**
     * Capture learning signal
     */
    async captureLearningSignal(tenantId, sourceId, signalType, content, confidence = 0.5) {
        try {
            const client = this.connectToTraining(tenantId);
            await client.post('/api/training/capture', {
                source: 'unified_platform',
                sourceId,
                type: signalType,
                content,
                confidence,
                tenantId
            });
            return true;
        }
        catch (error) {
            console.error('[ServiceConnector] Failed to capture learning signal:', error);
            return false;
        }
    }
    // ============================================================================
    // HEALTH CHECKS
    // ============================================================================
    /**
     * Check health of a specific service
     */
    async checkServiceHealth(service) {
        // Check cache first
        const cached = this.healthCache.get(service);
        if (cached && Date.now() - cached.timestamp < this.healthCacheTtlMs) {
            return cached.status;
        }
        const startTime = Date.now();
        let url;
        let serviceName;
        switch (service) {
            case 'memory':
                url = `${this.config.memoryUrl}/health`;
                serviceName = 'hojai-memory';
                break;
            case 'event':
                url = `${this.config.eventUrl}/health`;
                serviceName = 'hojai-event';
                break;
            case 'training':
                url = `${this.config.trainingUrl}/health`;
                serviceName = 'hojai-training-pipeline';
                break;
        }
        try {
            const response = await axios.get(url, { timeout: 5000 });
            const latencyMs = Date.now() - startTime;
            const health = {
                service: serviceName,
                status: response.status === 200 ? 'healthy' : 'unhealthy',
                latencyMs
            };
            // Update cache
            this.healthCache.set(service, { status: health, timestamp: Date.now() });
            return health;
        }
        catch (error) {
            const latencyMs = Date.now() - startTime;
            const health = {
                service: serviceName,
                status: 'unhealthy',
                latencyMs,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            // Update cache even for failures
            this.healthCache.set(service, { status: health, timestamp: Date.now() });
            return health;
        }
    }
    /**
     * Get health status of all connected services
     */
    async getAllServiceHealth() {
        const results = await Promise.all([
            this.checkServiceHealth('memory'),
            this.checkServiceHealth('event'),
            this.checkServiceHealth('training')
        ]);
        return results;
    }
    /**
     * Check if all services are healthy
     */
    async areAllServicesHealthy() {
        const health = await this.getAllServiceHealth();
        return health.every(h => h.status === 'healthy');
    }
    /**
     * Clear health cache (force fresh check)
     */
    clearHealthCache() {
        this.healthCache.clear();
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    /**
     * Check if connector is initialized
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Shutdown connector and cleanup
     */
    async shutdown() {
        console.log('[ServiceConnector] Shutting down...');
        this.memoryClient = null;
        this.eventClient = null;
        this.trainingClient = null;
        this.healthCache.clear();
        this.initialized = false;
        console.log('[ServiceConnector] Shutdown complete');
    }
}
// ============================================================================
// SINGLETON EXPORT
// ============================================================================
// Default instance with environment variable configuration
export const serviceConnector = new ServiceConnector();
// Export class for custom instances
export { ServiceConnector };
export default serviceConnector;
//# sourceMappingURL=serviceConnector.js.map