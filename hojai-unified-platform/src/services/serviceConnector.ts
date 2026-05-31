/**
 * HOJAI Unified Platform - Service Connector
 * Connects to HOJAI Core services: Memory, Event Bus, Training Pipeline
 * Also connects to REZ Intelligence services for cross-platform intelligence
 *
 * HOJAI Services:
 * - hojai-memory (4520): Store conversation memory and user context
 * - hojai-event (4510): Emit events when actions happen
 * - hojai-training-pipeline (4880): Learn from conversations
 *
 * REZ Intelligence Services (Privileged Tenant):
 * - Intent Predictor (4018): Real-time intent detection
 * - Predictive Engine (4123): Churn/LTV/Conversion predictions
 * - Memory Layer (4201): Cross-platform user memory
 */

import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

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

// ============================================================================
// REZ INTELLIGENCE TYPES
// ============================================================================

export interface REZServiceConfig {
  intentPredictorUrl: string;
  predictiveEngineUrl: string;
  memoryLayerUrl: string;
}

export interface REZIntentPrediction {
  user_id: string;
  session_id: string;
  current_intent: {
    category: string;
    confidence: number;
    urgency?: string;
  };
  all_intent_scores: Array<{
    category: string;
    score: number;
  }>;
  mood?: {
    label: string;
    score: number;
  };
  session_analysis?: {
    duration: number;
    event_count: number;
    dominant_intent: string;
  };
  push_recommendation?: {
    should_push: boolean;
    reason: string;
  };
}

export interface REZPredictionResult {
  userId: string;
  type: 'churn' | 'ltv' | 'revisit' | 'conversion';
  prediction: {
    probability?: number;
    predicted_ltv?: number;
    predicted_revisit_days?: number;
    risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    factors?: string[];
    reason?: string;
  };
  metadata?: {
    cached: boolean;
    modelVersion: string;
    timestamp: string;
  };
}

export interface REZAllPredictions {
  churn: REZPredictionResult['prediction'];
  ltv: REZPredictionResult['prediction'];
  revisit: REZPredictionResult['prediction'];
  conversion: REZPredictionResult['prediction'];
}

export interface REZMemoryTimeline {
  userId: string;
  events: Array<{
    _id: string;
    type: string;
    category: string;
    source: string;
    timestamp: string;
    data: Record<string, unknown>;
  }>;
  totalEvents: number;
  lastActivity?: string;
}

export interface REZMemoryEvent {
  userId: string;
  type: string;
  category?: string;
  source?: string;
  data?: Record<string, unknown>;
}

export interface REZUserProfile {
  user_id: string;
  current_intent: {
    category: string;
    confidence: number;
  };
  signals: {
    search_queries: string[];
    browse_history_count: number;
    cart_behavior?: string;
    device_type?: string;
    price_sensitivity?: number;
  };
  mood_indicators?: {
    label: string;
    score: number;
  };
  urgency_signals?: string[];
  metrics?: {
    total_purchases: number;
    average_order_value: number;
    lifetime_value: number;
  };
  user_segment?: string;
  push_eligibility?: {
    should_push: boolean;
    selected_trigger?: string;
  };
}

// ============================================================================
// SERVICE CONNECTOR CLASS
// ============================================================================

class ServiceConnector {
  private memoryClient: AxiosInstance | null = null;
  private eventClient: AxiosInstance | null = null;
  private trainingClient: AxiosInstance | null = null;

  // REZ Intelligence clients
  private intentClient: AxiosInstance | null = null;
  private predictiveClient: AxiosInstance | null = null;
  private rezMemoryClient: AxiosInstance | null = null;

  private config: ServiceConnectorConfig;
  private rezConfig: REZServiceConfig;
  private initialized = false;

  // Health status cache
  private healthCache: Map<string, { status: ServiceHealth; timestamp: number }> = new Map();
  private healthCacheTtlMs = 30000; // 30 seconds

  constructor(config?: Partial<ServiceConnectorConfig>, rezConfig?: Partial<REZServiceConfig>) {
    this.config = {
      memoryUrl: config?.memoryUrl || process.env.HOJAI_MEMORY_URL || 'http://localhost:4520',
      eventUrl: config?.eventUrl || process.env.HOJAI_EVENT_URL || 'http://localhost:4510',
      trainingUrl: config?.trainingUrl || process.env.HOJAI_TRAINING_URL || 'http://localhost:4880',
      timeout: config?.timeout || 10000,
      retries: config?.retries || 3
    };

    // REZ Intelligence configuration
    this.rezConfig = {
      intentPredictorUrl: rezConfig?.intentPredictorUrl || process.env.REZ_INTENT_URL || 'http://localhost:4018',
      predictiveEngineUrl: rezConfig?.predictiveEngineUrl || process.env.REZ_PREDICTIVE_URL || 'http://localhost:4123',
      memoryLayerUrl: rezConfig?.memoryLayerUrl || process.env.REZ_MEMORY_URL || 'http://localhost:4201'
    };
  }

  /**
   * Initialize all service connections (HOJAI + REZ Intelligence)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

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

    // Initialize REZ Intelligence clients
    await this.initializeREZClients();

    // Add request interceptor for logging
    this.setupInterceptors();

    // Test connections
    await this.testConnections();

    this.initialized = true;
    console.log('[ServiceConnector] All service connections initialized (HOJAI + REZ Intelligence)');
  }

  /**
   * Initialize REZ Intelligence service clients
   */
  private async initializeREZClients(): Promise<void> {
    console.log('[ServiceConnector] Initializing REZ Intelligence clients...');

    // Intent Predictor client (4018)
    this.intentClient = axios.create({
      baseURL: this.rezConfig.intentPredictorUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'hojai-unified-platform',
        'X-Tenant-Id': 'hojai_commercial'
      }
    });

    // Predictive Engine client (4123)
    this.predictiveClient = axios.create({
      baseURL: this.rezConfig.predictiveEngineUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'hojai-unified-platform',
        'X-Tenant-Id': 'hojai_commercial'
      }
    });

    // REZ Memory Layer client (4201)
    this.rezMemoryClient = axios.create({
      baseURL: this.rezConfig.memoryLayerUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'hojai-unified-platform',
        'X-Tenant-Id': 'hojai_commercial'
      }
    });

    console.log('[ServiceConnector] REZ Intelligence clients configured');
  }

  /**
   * Setup axios interceptors for logging and tenant headers
   */
  private setupInterceptors(): void {
    // Memory client interceptors
    this.memoryClient?.interceptors.request.use((config) => {
      console.log(`[Memory] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    this.memoryClient?.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`[Memory] Error:`, error.message);
        return Promise.reject(error);
      }
    );

    // Event client interceptors
    this.eventClient?.interceptors.request.use((config) => {
      console.log(`[Event] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    this.eventClient?.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`[Event] Error:`, error.message);
        return Promise.reject(error);
      }
    );

    // Training client interceptors
    this.trainingClient?.interceptors.request.use((config) => {
      console.log(`[Training] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    this.trainingClient?.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`[Training] Error:`, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Test connections to all services (HOJAI + REZ Intelligence)
   */
  private async testConnections(): Promise<void> {
    console.log('[ServiceConnector] Testing service connections...');

    const results = await Promise.allSettled([
      this.checkServiceHealth('memory'),
      this.checkServiceHealth('event'),
      this.checkServiceHealth('training'),
      this.checkServiceHealth('rez_intent'),
      this.checkServiceHealth('rez_predictive'),
      this.checkServiceHealth('rez_memory')
    ]);

    const failed = results.filter(r => r.status === 'rejected');
    const unhealthy = results.filter(r =>
      r.status === 'fulfilled' && r.value.status !== 'healthy'
    ).length;

    if (failed.length > 0 || unhealthy > 0) {
      console.warn(`[ServiceConnector] ${failed.length + unhealthy} service(s) failed or unhealthy`);
      console.log('[ServiceConnector] REZ services may not be running. They will be connected when available.');
      // Don't fail initialization - services might start later
    } else {
      console.log('[ServiceConnector] All services connected successfully (HOJAI + REZ)');
    }
  }

  // ============================================================================
  // MEMORY SERVICE (Port 4520)
  // ============================================================================

  /**
   * Connect to memory service for a specific tenant
   */
  connectToMemory(tenantId: string): AxiosInstance {
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
  async getUserContext(tenantId: string, userId: string): Promise<MemoryContext | null> {
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
      const memories: StoredMemory[] = memoriesRes.data.data;
      const timeline = timelineRes.data.data || [];

      // Extract recent messages from conversation memories
      const conversationMemories = memories.filter(m => m.type === 'conversation');
      const recentMessages = conversationMemories
        .slice(0, 10)
        .map(m => ({
          role: 'user' as const,
          content: m.content,
          timestamp: new Date()
        }));

      // Extract preferences from preference memories
      const preferenceMemories = memories.filter(m => m.type === 'preference');
      const preferences: Record<string, unknown> = {};
      preferenceMemories.forEach(m => {
        try {
          const data = JSON.parse(m.content);
          Object.assign(preferences, data);
        } catch {
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
    } catch (error) {
      console.error('[ServiceConnector] Failed to get user context:', error);
      return null;
    }
  }

  /**
   * Store conversation in memory
   */
  async storeConversation(
    tenantId: string,
    userId: string,
    conversationId: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: Date }>
  ): Promise<StoredMemory[]> {
    try {
      const client = this.connectToMemory(tenantId);
      const storedMemories: StoredMemory[] = [];

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
    } catch (error) {
      console.error('[ServiceConnector] Failed to store conversation:', error);
      return [];
    }
  }

  /**
   * Store user preference in memory
   */
  async storePreference(
    tenantId: string,
    userId: string,
    preferenceType: string,
    value: unknown
  ): Promise<boolean> {
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
    } catch (error) {
      console.error('[ServiceConnector] Failed to store preference:', error);
      return false;
    }
  }

  /**
   * Get full context for AI processing (implements Memory Before Models)
   */
  async getFullContext(
    tenantId: string,
    userId: string,
    entityId?: string
  ): Promise<Record<string, unknown>> {
    try {
      const client = this.connectToMemory(tenantId);

      const response = await client.get('/api/memories/context', {
        params: { userId, entityId }
      });

      return response.data.data || {};
    } catch (error) {
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
  connectToEvent(tenantId: string): AxiosInstance {
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
  async emitEvent(tenantId: string, event: EmittedEvent): Promise<string | null> {
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
    } catch (error) {
      console.error('[ServiceConnector] Failed to emit event:', error);
      return null;
    }
  }

  /**
   * Emit conversation started event
   */
  async emitConversationStarted(
    tenantId: string,
    userId: string,
    conversationId: string,
    channel: string
  ): Promise<string | null> {
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
  async emitMessageSent(
    tenantId: string,
    userId: string,
    conversationId: string,
    messageContent: string,
    channel: string,
    isFromBot: boolean
  ): Promise<string | null> {
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
  async emitIntentRecognized(
    tenantId: string,
    userId: string,
    conversationId: string,
    intent: string,
    confidence: number
  ): Promise<string | null> {
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
  async emitActionCompleted(
    tenantId: string,
    userId: string,
    conversationId: string,
    actionType: string,
    success: boolean
  ): Promise<string | null> {
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
  connectToTraining(tenantId: string): AxiosInstance {
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
  async sendToTraining(trainingData: TrainingData): Promise<boolean> {
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
    } catch (error) {
      console.error('[ServiceConnector] Failed to send training data:', error);
      return false;
    }
  }

  /**
   * Send user action to training pipeline
   */
  async sendActionToTraining(
    tenantId: string,
    userId: string,
    actionType: string,
    properties?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const client = this.connectToTraining(tenantId);

      await client.post('/api/training/action', {
        type: actionType,
        tenantId,
        userId,
        properties
      });

      return true;
    } catch (error) {
      console.error('[ServiceConnector] Failed to send action to training:', error);
      return false;
    }
  }

  /**
   * Send feedback to training pipeline
   */
  async sendFeedbackToTraining(
    tenantId: string,
    userId: string,
    feedbackType: 'positive' | 'negative' | 'rating' | 'correction',
    score?: number,
    content?: string
  ): Promise<boolean> {
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
    } catch (error) {
      console.error('[ServiceConnector] Failed to send feedback to training:', error);
      return false;
    }
  }

  /**
   * Send correction to training pipeline (for AI mistakes)
   */
  async sendCorrectionToTraining(
    tenantId: string,
    userId: string,
    originalContent: string,
    correctedContent: string,
    reason?: string
  ): Promise<boolean> {
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
    } catch (error) {
      console.error('[ServiceConnector] Failed to send correction to training:', error);
      return false;
    }
  }

  /**
   * Capture learning signal
   */
  async captureLearningSignal(
    tenantId: string,
    sourceId: string,
    signalType: string,
    content: Record<string, unknown>,
    confidence: number = 0.5
  ): Promise<boolean> {
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
    } catch (error) {
      console.error('[ServiceConnector] Failed to capture learning signal:', error);
      return false;
    }
  }

  // ============================================================================
  // REZ INTELLIGENCE CONNECTIONS
  // ============================================================================

  /**
   * Connect to REZ Intelligence services
   * Returns connection status for all three services
   */
  async connectToRezIntelligence(): Promise<{
    intentPredictor: { connected: boolean; url: string };
    predictiveEngine: { connected: boolean; url: string };
    memoryLayer: { connected: boolean; url: string };
  }> {
    const results = {
      intentPredictor: { connected: false, url: this.rezConfig.intentPredictorUrl },
      predictiveEngine: { connected: false, url: this.rezConfig.predictiveEngineUrl },
      memoryLayer: { connected: false, url: this.rezConfig.memoryLayerUrl }
    };

    // Test Intent Predictor (4018)
    try {
      const healthResponse = await axios.get(`${this.rezConfig.intentPredictorUrl}/health`, { timeout: 5000 });
      results.intentPredictor.connected = healthResponse.status === 200;
    } catch {
      results.intentPredictor.connected = false;
    }

    // Test Predictive Engine (4123)
    try {
      const healthResponse = await axios.get(`${this.rezConfig.predictiveEngineUrl}/health`, { timeout: 5000 });
      results.predictiveEngine.connected = healthResponse.status === 200;
    } catch {
      results.predictiveEngine.connected = false;
    }

    // Test REZ Memory Layer (4201)
    try {
      const healthResponse = await axios.get(`${this.rezConfig.memoryLayerUrl}/health`, { timeout: 5000 });
      results.memoryLayer.connected = healthResponse.status === 200;
    } catch {
      results.memoryLayer.connected = false;
    }

    console.log('[ServiceConnector] REZ Intelligence connection status:', JSON.stringify(results, null, 2));
    return results;
  }

  /**
   * Check if REZ Intelligence services are available
   */
  async isRezIntelligenceAvailable(): Promise<boolean> {
    const status = await this.connectToRezIntelligence();
    return status.intentPredictor.connected ||
           status.predictiveEngine.connected ||
           status.memoryLayer.connected;
  }

  // ============================================================================
  // INTENT PREDICTION (REZ Intent Predictor - 4018)
  // ============================================================================

  /**
   * Fetch intent prediction from REZ Intent Predictor
   *
   * @param userId - User ID to get predictions for
   * @param signals - Optional user signals (search queries, browse history, etc.)
   * @param sessionId - Optional session ID
   * @returns Intent prediction including current intent, all scores, mood, session analysis
   */
  async fetchIntentPrediction(
    userId: string,
    signals?: {
      search_queries?: string[];
      browse_history?: string[];
      cart_behavior?: string;
      device_type?: string;
      price_sensitivity?: number;
    },
    sessionId?: string
  ): Promise<REZIntentPrediction | null> {
    if (!this.intentClient) {
      console.error('[ServiceConnector] REZ Intent Predictor client not initialized');
      return null;
    }

    try {
      const response = await this.intentClient.post('/intent/score', {
        user_id: userId,
        session_id: sessionId,
        signals: signals || {},
        context: {
          source: 'hojai_unified_platform',
          timestamp: new Date().toISOString()
        }
      });

      if (response.data?.success && response.data?.data) {
        console.log(`[ServiceConnector] Intent prediction fetched for user ${userId}`);
        return response.data.data as REZIntentPrediction;
      }

      return null;
    } catch (error) {
      console.error('[ServiceConnector] Failed to fetch intent prediction:', error);
      return null;
    }
  }

  /**
   * Get full user intent profile from REZ
   *
   * @param userId - User ID to get profile for
   * @returns Complete user profile including signals, mood, metrics
   */
  async getRezUserProfile(userId: string): Promise<REZUserProfile | null> {
    if (!this.intentClient) {
      console.error('[ServiceConnector] REZ Intent Predictor client not initialized');
      return null;
    }

    try {
      const response = await this.intentClient.get(`/intent/user/${userId}/profile`);

      if (response.data?.success && response.data?.data) {
        console.log(`[ServiceConnector] REZ user profile fetched for ${userId}`);
        return response.data.data as REZUserProfile;
      }

      return null;
    } catch (error) {
      console.error('[ServiceConnector] Failed to fetch REZ user profile:', error);
      return null;
    }
  }

  /**
   * Record an event for intent tracking
   *
   * @param userId - User ID
   * @param eventType - Type of event (e.g., 'page_view', 'search', 'add_to_cart')
   * @param eventData - Additional event data
   * @param sessionId - Optional session ID
   */
  async recordRezEvent(
    userId: string,
    eventType: string,
    eventData?: Record<string, unknown>,
    sessionId?: string
  ): Promise<boolean> {
    if (!this.intentClient) {
      console.error('[ServiceConnector] REZ Intent Predictor client not initialized');
      return false;
    }

    try {
      await this.intentClient.post('/intent/event', {
        user_id: userId,
        session_id: sessionId,
        event_type: eventType,
        event_data: eventData || {}
      });

      console.log(`[ServiceConnector] REZ event recorded: ${eventType} for user ${userId}`);
      return true;
    } catch (error) {
      console.error('[ServiceConnector] Failed to record REZ event:', error);
      return false;
    }
  }

  /**
   * Optimize intent detection with outcome feedback
   *
   * @param userId - User ID
   * @param actionTaken - Action that was taken based on prediction
   * @param outcome - Outcome ('conversion', 'no_conversion', etc.)
   * @param feedbackData - Additional feedback data
   */
  async optimizeIntent(
    userId: string,
    actionTaken: string,
    outcome: 'conversion' | 'no_conversion',
    feedbackData?: {
      converted_intent?: string;
      purchase_value?: number;
    }
  ): Promise<boolean> {
    if (!this.intentClient) {
      console.error('[ServiceConnector] REZ Intent Predictor client not initialized');
      return false;
    }

    try {
      await this.intentClient.post('/intent/optimize', {
        user_id: userId,
        action_taken: actionTaken,
        outcome,
        feedback_data: feedbackData
      });

      console.log(`[ServiceConnector] Intent optimization recorded for user ${userId}`);
      return true;
    } catch (error) {
      console.error('[ServiceConnector] Failed to optimize intent:', error);
      return false;
    }
  }

  // ============================================================================
  // USER PREDICTIONS (REZ Predictive Engine - 4123)
  // ============================================================================

  /**
   * Fetch user predictions from REZ Predictive Engine
   * Gets all predictions: churn, LTV, revisit, conversion
   *
   * @param userId - User ID to get predictions for
   * @param useCache - Whether to use cached predictions (default: true)
   * @returns All predictions for the user
   */
  async fetchUserPredictions(
    userId: string,
    useCache: boolean = true
  ): Promise<REZAllPredictions | null> {
    if (!this.predictiveClient) {
      console.error('[ServiceConnector] REZ Predictive Engine client not initialized');
      return null;
    }

    try {
      const response = await this.predictiveClient.get(`/predict/${userId}/all`, {
        params: { cache: useCache }
      });

      if (response.data?.success && response.data?.data) {
        console.log(`[ServiceConnector] All predictions fetched for user ${userId}`);
        return response.data.data as REZAllPredictions;
      }

      return null;
    } catch (error) {
      console.error('[ServiceConnector] Failed to fetch user predictions:', error);
      return null;
    }
  }

  /**
   * Get churn prediction for a user
   *
   * @param userId - User ID
   * @param useCache - Whether to use cached predictions
   * @returns Churn prediction with probability and risk level
   */
  async fetchChurnPrediction(
    userId: string,
    useCache: boolean = true
  ): Promise<REZPredictionResult | null> {
    if (!this.predictiveClient) {
      console.error('[ServiceConnector] REZ Predictive Engine client not initialized');
      return null;
    }

    try {
      const response = await this.predictiveClient.get(`/predict/${userId}/churn`, {
        params: { cache: useCache }
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data as REZPredictionResult;
      }

      return null;
    } catch (error) {
      console.error('[ServiceConnector] Failed to fetch churn prediction:', error);
      return null;
    }
  }

  /**
   * Get LTV (Lifetime Value) prediction for a user
   *
   * @param userId - User ID
   * @param useCache - Whether to use cached predictions
   * @returns LTV prediction with predicted value and confidence
   */
  async fetchLTVPrediction(
    userId: string,
    useCache: boolean = true
  ): Promise<REZPredictionResult | null> {
    if (!this.predictiveClient) {
      console.error('[ServiceConnector] REZ Predictive Engine client not initialized');
      return null;
    }

    try {
      const response = await this.predictiveClient.get(`/predict/${userId}/ltv`, {
        params: { cache: useCache }
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data as REZPredictionResult;
      }

      return null;
    } catch (error) {
      console.error('[ServiceConnector] Failed to fetch LTV prediction:', error);
      return null;
    }
  }

  /**
   * Get revisit prediction for a user
   *
   * @param userId - User ID
   * @param useCache - Whether to use cached predictions
   * @returns Revisit prediction with expected days until return
   */
  async fetchRevisitPrediction(
    userId: string,
    useCache: boolean = true
  ): Promise<REZPredictionResult | null> {
    if (!this.predictiveClient) {
      console.error('[ServiceConnector] REZ Predictive Engine client not initialized');
      return null;
    }

    try {
      const response = await this.predictiveClient.get(`/predict/${userId}/revisit`, {
        params: { cache: useCache }
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data as REZPredictionResult;
      }

      return null;
    } catch (error) {
      console.error('[ServiceConnector] Failed to fetch revisit prediction:', error);
      return null;
    }
  }

  /**
   * Get conversion prediction for a user
   *
   * @param userId - User ID
   * @param useCache - Whether to use cached predictions
   * @returns Conversion prediction with probability
   */
  async fetchConversionPrediction(
    userId: string,
    useCache: boolean = true
  ): Promise<REZPredictionResult | null> {
    if (!this.predictiveClient) {
      console.error('[ServiceConnector] REZ Predictive Engine client not initialized');
      return null;
    }

    try {
      const response = await this.predictiveClient.get(`/predict/${userId}/conversion`, {
        params: { cache: useCache }
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data as REZPredictionResult;
      }

      return null;
    } catch (error) {
      console.error('[ServiceConnector] Failed to fetch conversion prediction:', error);
      return null;
    }
  }

  /**
   * Get at-risk users segment
   *
   * @param riskLevels - Risk levels to filter (default: ['CRITICAL', 'HIGH'])
   * @param limit - Max number of users to return (default: 100)
   * @returns List of at-risk users
   */
  async getAtRiskSegment(
    riskLevels: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = ['CRITICAL', 'HIGH'],
    limit: number = 100
  ): Promise<Array<{ userId: string; churnProbability: number; riskLevel: string }> | null> {
    if (!this.predictiveClient) {
      console.error('[ServiceConnector] REZ Predictive Engine client not initialized');
      return null;
    }

    try {
      const response = await this.predictiveClient.get('/predict/segments/at-risk', {
        params: {
          riskLevels: JSON.stringify(riskLevels),
          limit
        }
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data.users || [];
      }

      return null;
    } catch (error) {
      console.error('[ServiceConnector] Failed to get at-risk segment:', error);
      return null;
    }
  }

  /**
   * Get high-value customers segment
   *
   * @param tiers - Loyalty tiers to filter (default: ['PLATINUM', 'GOLD'])
   * @param limit - Max number of users to return (default: 100)
   * @returns List of high-value customers
   */
  async getHighValueSegment(
    tiers: string[] = ['PLATINUM', 'GOLD'],
    limit: number = 100
  ): Promise<Array<{ userId: string; predictedLtv: number; tier: string }> | null> {
    if (!this.predictiveClient) {
      console.error('[ServiceConnector] REZ Predictive Engine client not initialized');
      return null;
    }

    try {
      const response = await this.predictiveClient.get('/predict/segments/high-value', {
        params: {
          tiers: JSON.stringify(tiers),
          limit
        }
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data.users || [];
      }

      return null;
    } catch (error) {
      console.error('[ServiceConnector] Failed to get high-value segment:', error);
      return null;
    }
  }

  // ============================================================================
  // CROSS-PLATFORM MEMORY (REZ Memory Layer - 4201)
  // ============================================================================

  /**
   * Fetch user timeline from REZ Memory Layer
   * Gets cross-platform activity history
   *
   * @param userId - User ID to get timeline for
   * @param limit - Max number of events (default: 100)
   * @returns User timeline events
   */
  async fetchUserTimeline(
    userId: string,
    limit: number = 100
  ): Promise<REZMemoryTimeline | null> {
    if (!this.rezMemoryClient) {
      console.error('[ServiceConnector] REZ Memory Layer client not initialized');
      return null;
    }

    try {
      const response = await this.rezMemoryClient.get(`/timeline/${userId}`, {
        params: { limit }
      });

      if (response.data?.success && response.data?.data) {
        const events = response.data.data;
        console.log(`[ServiceConnector] User timeline fetched: ${events.length || 0} events for ${userId}`);
        return {
          userId,
          events: Array.isArray(events) ? events : [],
          totalEvents: Array.isArray(events) ? events.length : 0,
          lastActivity: events[0]?.timestamp
        };
      }

      return null;
    } catch (error) {
      console.error('[ServiceConnector] Failed to fetch user timeline:', error);
      return null;
    }
  }

  /**
   * Get timeline summary for a user
   *
   * @param userId - User ID
   * @returns Summary with total events and last activity
   */
  async getTimelineSummary(userId: string): Promise<{ totalEvents: number; lastActivity?: string } | null> {
    if (!this.rezMemoryClient) {
      console.error('[ServiceConnector] REZ Memory Layer client not initialized');
      return null;
    }

    try {
      const response = await this.rezMemoryClient.get(`/timeline/${userId}/summary`);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error('[ServiceConnector] Failed to get timeline summary:', error);
      return null;
    }
  }

  /**
   * Record an event in REZ Memory Layer
   * Stores cross-platform activity for unified user memory
   *
   * @param event - Event to record
   * @returns Created event or null on failure
   */
  async recordMemoryEvent(event: REZMemoryEvent): Promise<boolean> {
    if (!this.rezMemoryClient) {
      console.error('[ServiceConnector] REZ Memory Layer client not initialized');
      return false;
    }

    try {
      const response = await this.rezMemoryClient.post('/timeline/events', {
        userId: event.userId,
        type: event.type,
        category: event.category || 'engagement',
        source: event.source || 'hojai_unified_platform',
        data: event.data || {}
      });

      if (response.data?.success) {
        console.log(`[ServiceConnector] Memory event recorded: ${event.type} for user ${event.userId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ServiceConnector] Failed to record memory event:', error);
      return false;
    }
  }

  // ============================================================================
  // UNIFIED USER INTELLIGENCE
  // ============================================================================

  /**
   * Get complete user intelligence from all REZ services
   * Combines intent, predictions, and memory for a 360-degree view
   *
   * @param userId - User ID
   * @returns Complete user intelligence profile
   */
  async getCompleteUserIntelligence(userId: string): Promise<{
    intent?: REZIntentPrediction;
    predictions?: REZAllPredictions;
    timeline?: REZMemoryTimeline;
    profile?: REZUserProfile;
    hojaiContext?: MemoryContext | null;
  } | null> {
    console.log(`[ServiceConnector] Fetching complete intelligence for user ${userId}`);

    try {
      const [intent, predictions, timeline, profile, hojaiContext] = await Promise.allSettled([
        this.fetchIntentPrediction(userId),
        this.fetchUserPredictions(userId),
        this.fetchUserTimeline(userId),
        this.getRezUserProfile(userId),
        Promise.resolve(null) // HOJAI context would need tenantId
      ]);

      return {
        intent: intent.status === 'fulfilled' ? intent.value || undefined : undefined,
        predictions: predictions.status === 'fulfilled' ? predictions.value || undefined : undefined,
        timeline: timeline.status === 'fulfilled' ? timeline.value || undefined : undefined,
        profile: profile.status === 'fulfilled' ? profile.value || undefined : undefined,
        hojaiContext: hojaiContext.status === 'fulfilled' ? hojaiContext.value : null
      };
    } catch (error) {
      console.error('[ServiceConnector] Failed to get complete user intelligence:', error);
      return null;
    }
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  /**
   * Check health of a specific service
   */
  async checkServiceHealth(
    service: 'memory' | 'event' | 'training' | 'rez_intent' | 'rez_predictive' | 'rez_memory'
  ): Promise<ServiceHealth> {
    // Check cache first
    const cached = this.healthCache.get(service);
    if (cached && Date.now() - cached.timestamp < this.healthCacheTtlMs) {
      return cached.status;
    }

    const startTime = Date.now();
    let url: string;
    let serviceName: string;

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
      case 'rez_intent':
        url = `${this.rezConfig.intentPredictorUrl}/health`;
        serviceName = 'rez-intent-predictor';
        break;
      case 'rez_predictive':
        url = `${this.rezConfig.predictiveEngineUrl}/health`;
        serviceName = 'rez-predictive-engine';
        break;
      case 'rez_memory':
        url = `${this.rezConfig.memoryLayerUrl}/health`;
        serviceName = 'rez-memory-layer';
        break;
    }

    try {
      const response = await axios.get(url, { timeout: 5000 });
      const latencyMs = Date.now() - startTime;

      const health: ServiceHealth = {
        service: serviceName,
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        latencyMs
      };

      // Update cache
      this.healthCache.set(service, { status: health, timestamp: Date.now() });

      return health;
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const health: ServiceHealth = {
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
   * Get health status of all connected services (HOJAI + REZ Intelligence)
   */
  async getAllServiceHealth(): Promise<ServiceHealth[]> {
    const results = await Promise.all([
      this.checkServiceHealth('memory'),
      this.checkServiceHealth('event'),
      this.checkServiceHealth('training'),
      this.checkServiceHealth('rez_intent'),
      this.checkServiceHealth('rez_predictive'),
      this.checkServiceHealth('rez_memory')
    ]);

    return results;
  }

  /**
   * Check if all services are healthy
   */
  async areAllServicesHealthy(): Promise<boolean> {
    const health = await this.getAllServiceHealth();
    return health.every(h => h.status === 'healthy');
  }

  /**
   * Clear health cache (force fresh check)
   */
  clearHealthCache(): void {
    this.healthCache.clear();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if connector is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Shutdown connector and cleanup
   */
  async shutdown(): Promise<void> {
    console.log('[ServiceConnector] Shutting down...');

    this.memoryClient = null;
    this.eventClient = null;
    this.trainingClient = null;

    // Cleanup REZ Intelligence clients
    this.intentClient = null;
    this.predictiveClient = null;
    this.rezMemoryClient = null;

    this.healthCache.clear();
    this.initialized = false;

    console.log('[ServiceConnector] Shutdown complete (HOJAI + REZ Intelligence)');
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
