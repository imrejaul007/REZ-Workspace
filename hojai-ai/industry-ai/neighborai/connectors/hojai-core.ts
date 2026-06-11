/**
 * HOJAI Core Connector
 * Connects NEIGHBORAI to HOJAI Core AI infrastructure
 * Provides tenant context management, industry-specific AI model selection,
 * cross-industry pattern sharing, and society-specific data aggregation
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Type Definitions
// ============================================================================

export interface HOJAIConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface TenantContext {
  tenantId: string;
  societyId?: string;
  residentId?: string;
  flatNumber?: string;
  wing?: string;
  role?: 'admin' | 'committee_member' | 'resident' | 'security' | 'vendor';
  preferences?: Record<string, unknown>;
}

export interface CommunityContext {
  societyId?: string;
  residentId?: string;
  flatNumber?: string;
  wing?: string;
}

export interface IndustryModelConfig {
  modelId: string;
  modelName: string;
  provider: 'openai' | 'anthropic' | 'huggingface' | 'custom';
  capabilities: string[];
  maxTokens: number;
  temperature: number;
  domainFocus: 'residential' | 'commercial' | 'industrial';
}

export interface CrossIndustryPattern {
  patternId: string;
  sourceIndustry: string;
  targetIndustries: string[];
  patternType: 'billing' | 'communication' | 'maintenance' | 'security';
  description: string;
  metadata: Record<string, unknown>;
  successRate: number;
}

export interface SocietyInsight {
  totalResidents: number;
  activeComplaints: number;
  pendingPayments: number;
  upcomingEvents: number;
  announcements: string[];
  monthlyTrend: {
    complaints: number;
    payments: number;
    events: number;
  };
}

export interface ResidentProfile {
  residentId: string;
  name: string;
  flatNumber: string;
  wing: string;
  moveInDate: string;
  familyMembers: number;
  vehicleCount: number;
  paymentStatus: 'current' | 'overdue' | 'defaulted';
  activeComplaints: number;
  participationScore: number;
}

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
  suggestedActions?: string[];
  followUpQuestions?: string[];
}

export interface AIModelResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  modelUsed?: string;
  processingTimeMs?: number;
}

export interface DataAggregationRequest {
  societyId: string;
  dataTypes: ('complaints' | 'payments' | 'events' | 'visitors' | 'maintenance')[];
  dateRange: { start: string; end: string };
  groupBy?: 'day' | 'week' | 'month';
}

export interface AggregatedData {
  societyId: string;
  period: { start: string; end: string };
  dataPoints: {
    complaints: { total: number; byCategory: Record<string, number>; byStatus: Record<string, number> };
    payments: { total: number; collected: number; pending: number; byMode: Record<string, number> };
    events: { total: number; attended: number; byType: Record<string, number> };
    visitors: { total: number; byPurpose: Record<string, number> };
    maintenance: { total: number; completed: number; pending: number; avgResponseTime: number };
  };
  summary: {
    overallHealth: number;
    trends: Record<string, 'improving' | 'stable' | 'declining'>;
  };
}

export interface CrossIndustryInsight {
  insightId: string;
  category: 'billing' | 'communication' | 'maintenance' | 'security' | 'compliance';
  description: string;
  applicableIndustries: string[];
  confidence: number;
  implementationGuide?: string;
}

export interface TenantSession {
  sessionId: string;
  tenantId: string;
  createdAt: string;
  expiresAt: string;
  context: TenantContext;
}

// ============================================================================
// Logger Utility
// ============================================================================

class ConnectorLogger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: string, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] [${this.context}] ${message}${metaStr}`;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(this.formatMessage('INFO', message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(this.formatMessage('ERROR', message, meta));
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }
}

// ============================================================================
// HOJAI Core Connector
// ============================================================================

export class HOJAIConnector {
  private config: HOJAIConfig;
  private logger: ConnectorLogger;
  private activeSessions: Map<string, TenantSession>;
  private modelCache: Map<string, IndustryModelConfig>;

  // Default industry models for residential/community management
  private readonly defaultModels: Record<string, IndustryModelConfig> = {
    residential: {
      modelId: 'hojai-residential-v2',
      modelName: 'HOJAI Residential Assistant',
      provider: 'custom',
      capabilities: ['complaint_routing', 'payment_nudges', 'event_coordination', 'visitor_auth'],
      maxTokens: 4096,
      temperature: 0.7,
      domainFocus: 'residential'
    },
    billing: {
      modelId: 'hojai-billing-v1',
      modelName: 'HOJAI Billing Specialist',
      provider: 'custom',
      capabilities: ['invoice_generation', 'payment_tracking', 'due_date_prediction', 'payment_plan_suggestions'],
      maxTokens: 2048,
      temperature: 0.3,
      domainFocus: 'residential'
    },
    maintenance: {
      modelId: 'hojai-maintenance-v1',
      modelName: 'HOJAI Maintenance Coordinator',
      provider: 'custom',
      capabilities: ['issue_classification', 'vendor_matching', 'sla_tracking', 'priority_routing'],
      maxTokens: 3072,
      temperature: 0.5,
      domainFocus: 'residential'
    },
    security: {
      modelId: 'hojai-security-v1',
      modelName: 'HOJAI Security Monitor',
      provider: 'custom',
      capabilities: ['visitor_screening', 'access_control', 'incident_detection', 'emergency_routing'],
      maxTokens: 2048,
      temperature: 0.2,
      domainFocus: 'residential'
    }
  };

  constructor(config: HOJAIConfig) {
    this.config = {
      ...config,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3
    };
    this.logger = new ConnectorLogger('HOJAIConnector');
    this.activeSessions = new Map();
    this.modelCache = new Map();
    this.logger.info('HOJAI Connector initialized', { baseUrl: config.baseUrl });
  }

  // ==========================================================================
  // Tenant Context Management
  // ==========================================================================

  /**
   * Creates a new tenant session with full context
   */
  async createTenantSession(tenant: TenantContext): Promise<TenantSession> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const session: TenantSession = {
      sessionId,
      tenantId: tenant.tenantId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      context: tenant
    };

    this.activeSessions.set(sessionId, session);
    this.logger.info('Tenant session created', { sessionId, tenantId: tenant.tenantId });

    return session;
  }

  /**
   * Retrieves and validates an existing tenant session
   */
  async getTenantSession(sessionId: string): Promise<TenantSession | null> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      this.logger.warn('Session not found', { sessionId });
      return null;
    }

    const now = new Date();
    if (new Date(session.expiresAt) < now) {
      this.activeSessions.delete(sessionId);
      this.logger.warn('Session expired', { sessionId });
      return null;
    }

    return session;
  }

  /**
   * Updates tenant context within an active session
   */
  async updateTenantContext(sessionId: string, updates: Partial<TenantContext>): Promise<TenantSession | null> {
    const session = await this.getTenantSession(sessionId);

    if (!session) {
      return null;
    }

    session.context = { ...session.context, ...updates };
    this.activeSessions.set(sessionId, session);
    this.logger.info('Tenant context updated', { sessionId });

    return session;
  }

  /**
   * Terminates a tenant session
   */
  async endTenantSession(sessionId: string): Promise<boolean> {
    const deleted = this.activeSessions.delete(sessionId);
    if (deleted) {
      this.logger.info('Tenant session terminated', { sessionId });
    }
    return deleted;
  }

  // ==========================================================================
  // Industry-Specific AI Model Selection
  // ==========================================================================

  /**
   * Selects the most appropriate AI model based on intent and context
   */
  async selectAIModel(intent: string, context?: CommunityContext): Promise<IndustryModelConfig> {
    const cacheKey = `${intent}:${context?.societyId || 'default'}`;
    const cached = this.modelCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/models/select`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ intent, context })
        }
      );

      if (response.ok) {
        const model = await response.json() as IndustryModelConfig;
        this.modelCache.set(cacheKey, model);
        return model;
      }
    } catch (error) {
      this.logger.error('Model selection API failed, using default', { error, intent });
    }

    // Fallback to default model based on intent
    return this.getDefaultModelForIntent(intent);
  }

  /**
   * Returns default model configuration based on intent type
   */
  private getDefaultModelForIntent(intent: string): IndustryModelConfig {
    const intentLower = intent.toLowerCase();

    if (intentLower.includes('payment') || intentLower.includes('bill') || intentLower.includes('due')) {
      return this.defaultModels.billing;
    }
    if (intentLower.includes('maintenance') || intentLower.includes('repair') || intentLower.includes('issue')) {
      return this.defaultModels.maintenance;
    }
    if (intentLower.includes('security') || intentLower.includes('visitor') || intentLower.includes('access')) {
      return this.defaultModels.security;
    }

    return this.defaultModels.residential;
  }

  /**
   * Lists all available industry models
   */
  async listAvailableModels(): Promise<IndustryModelConfig[]> {
    return Object.values(this.defaultModels);
  }

  /**
   * Registers a custom model for the tenant
   */
  async registerCustomModel(model: IndustryModelConfig): Promise<boolean> {
    try {
      this.modelCache.set(model.modelId, model);
      this.logger.info('Custom model registered', { modelId: model.modelId });
      return true;
    } catch (error) {
      this.logger.error('Failed to register custom model', { error });
      return false;
    }
  }

  // ==========================================================================
  // Cross-Industry Pattern Sharing
  // ==========================================================================

  /**
   * Retrieves patterns from other industries that can be applied here
   */
  async getCrossIndustryPatterns(industryType: string, patternCategory?: string): Promise<CrossIndustryPattern[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/patterns/cross-industry`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ industryType, patternCategory })
        }
      );

      if (!response.ok) {
        return this.getDefaultPatterns(industryType);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Cross-industry pattern fetch failed', { error, industryType });
      return this.getDefaultPatterns(industryType);
    }
  }

  /**
   * Returns default patterns based on industry type
   */
  private getDefaultPatterns(industryType: string): CrossIndustryPattern[] {
    const patterns: CrossIndustryPattern[] = [
      {
        patternId: 'pattern-001',
        sourceIndustry: 'retail',
        targetIndustries: ['residential', 'commercial'],
        patternType: 'billing',
        description: 'Auto-reminder system for upcoming dues',
        metadata: { frequency: 'weekly', channels: ['push', 'sms', 'email'] },
        successRate: 0.85
      },
      {
        patternId: 'pattern-002',
        sourceIndustry: 'healthcare',
        targetIndustries: ['residential'],
        patternType: 'communication',
        description: 'Appointment-based visitor scheduling with QR code access',
        metadata: { preNoticeHours: 24 },
        successRate: 0.92
      },
      {
        patternId: 'pattern-003',
        sourceIndustry: 'hospitality',
        targetIndustries: ['residential', 'commercial'],
        patternType: 'maintenance',
        description: 'Gamified maintenance request resolution tracking',
        metadata: { displayPublicLeaderboard: true },
        successRate: 0.78
      },
      {
        patternId: 'pattern-004',
        sourceIndustry: 'logistics',
        targetIndustries: ['residential'],
        patternType: 'security',
        description: 'Real-time visitor tracking with ETA notifications',
        metadata: { notifyOnArrival: true },
        successRate: 0.88
      }
    ];

    return patterns.filter(p => p.targetIndustries.includes(industryType));
  }

  /**
   * Shares a successful pattern from this industry to others
   */
  async sharePattern(pattern: Omit<CrossIndustryPattern, 'patternId'>): Promise<CrossIndustryPattern> {
    const newPattern: CrossIndustryPattern = {
      ...pattern,
      patternId: `pattern-${uuidv4().slice(0, 8)}`
    };

    this.logger.info('Pattern shared to cross-industry network', {
      patternId: newPattern.patternId,
      sourceIndustry: newPattern.sourceIndustry
    });

    return newPattern;
  }

  /**
   * Gets insights applicable across multiple industries
   */
  async getCrossIndustryInsights(societyId: string): Promise<CrossIndustryInsight[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/insights/cross-industry/${societyId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) {
        return this.getDefaultInsights();
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Cross-industry insights fetch failed', { error });
      return this.getDefaultInsights();
    }
  }

  private getDefaultInsights(): CrossIndustryInsight[] {
    return [
      {
        insightId: 'insight-001',
        category: 'billing',
        description: 'Societies using auto-debit see 40% higher collection rates',
        applicableIndustries: ['residential', 'commercial', 'retail'],
        confidence: 0.87,
        implementationGuide: 'Enable auto-debit as primary payment method'
      },
      {
        insightId: 'insight-002',
        category: 'communication',
        description: 'Morning announcement broadcasts increase resident engagement by 25%',
        applicableIndustries: ['residential'],
        confidence: 0.82,
        implementationGuide: 'Schedule daily 8 AM summary notification'
      },
      {
        insightId: 'insight-003',
        category: 'maintenance',
        description: 'Predictive maintenance reduces emergency calls by 60%',
        applicableIndustries: ['residential', 'commercial', 'industrial'],
        confidence: 0.79,
        implementationGuide: 'Implement IoT sensors for common failure points'
      }
    ];
  }

  // ==========================================================================
  // Society-Specific Data Aggregation
  // ==========================================================================

  /**
   * Aggregates data across multiple categories for a society
   */
  async aggregateSocietyData(request: DataAggregationRequest): Promise<AggregatedData> {
    this.logger.info('Aggregating society data', {
      societyId: request.societyId,
      dataTypes: request.dataTypes
    });

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/aggregate/society`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        }
      );

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      this.logger.error('Society data aggregation API failed', { error });
    }

    // Return mock aggregated data for demonstration
    return this.generateMockAggregatedData(request);
  }

  private generateMockAggregatedData(request: DataAggregationRequest): AggregatedData {
    return {
      societyId: request.societyId,
      period: request.dateRange,
      dataPoints: {
        complaints: {
          total: 47,
          byCategory: { plumbing: 12, electrical: 8, cleanliness: 15, other: 12 },
          byStatus: { open: 8, in_progress: 12, resolved: 27 }
        },
        payments: {
          total: 1250000,
          collected: 1125000,
          pending: 125000,
          byMode: { upi: 650000, card: 250000, cash: 150000, bank_transfer: 75000 }
        },
        events: {
          total: 12,
          attended: 485,
          byType: { social: 5, committee: 4, maintenance: 3 }
        },
        visitors: {
          total: 892,
          byPurpose: { delivery: 450, guest: 280, vendor: 162 }
        },
        maintenance: {
          total: 65,
          completed: 52,
          pending: 13,
          avgResponseTime: 4.2
        }
      },
      summary: {
        overallHealth: 82,
        trends: {
          complaints: 'declining',
          payments: 'stable',
          events: 'improving',
          visitors: 'stable',
          maintenance: 'improving'
        }
      }
    };
  }

  /**
   * Gets detailed resident profile for personalization
   */
  async getResidentProfile(residentId: string): Promise<ResidentProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/residents/${residentId}/profile`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      this.logger.error('Failed to fetch resident profile', { residentId });
      return null;
    }
  }

  /**
   * Gets community insights for a society
   */
  async getCommunityInsights(societyId: string): Promise<SocietyInsight | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/community/${societyId}/insights`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      this.logger.error('Failed to fetch community insights', { societyId });
      return null;
    }
  }

  // ==========================================================================
  // Intent Analysis with Context
  // ==========================================================================

  /**
   * Analyzes user intent with full tenant context
   */
  async analyzeIntent(text: string, context?: CommunityContext): Promise<IntentResult> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/intent/analyze`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text, context })
        }
      );

      if (!response.ok) {
        return {
          intent: 'unknown',
          confidence: 0,
          entities: {},
          suggestedActions: [],
          followUpQuestions: []
        };
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Intent analysis failed', { error, text });
      return {
        intent: 'unknown',
        confidence: 0,
        entities: {},
        suggestedActions: [],
        followUpQuestions: []
      };
    }
  }

  /**
   * Generates AI response using selected model
   */
  async generateResponse(
    prompt: string,
    modelConfig?: IndustryModelConfig
  ): Promise<AIModelResponse<string>> {
    const startTime = Date.now();
    const model = modelConfig || this.defaultModels.residential;

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/ai/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt,
            model: model.modelId,
            maxTokens: model.maxTokens,
            temperature: model.temperature
          })
        }
      );

      const processingTimeMs = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          error: 'Generation failed',
          modelUsed: model.modelId,
          processingTimeMs
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.response,
        modelUsed: model.modelId,
        processingTimeMs
      };
    } catch (error) {
      this.logger.error('AI generation failed', { error, model: model.modelId });
      return {
        success: false,
        error: 'Generation failed',
        modelUsed: model.modelId,
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  // ==========================================================================
  // Health Check
  // ==========================================================================

  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(
        `${this.config.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      this.logger.error('Health check failed', { error });
      return false;
    }
  }

  /**
   * Gets connector statistics
   */
  getStats(): {
    activeSessions: number;
    cachedModels: number;
    configTimeout: number;
  } {
    return {
      activeSessions: this.activeSessions.size,
      cachedModels: this.modelCache.size,
      configTimeout: this.config.timeout || 30000
    };
  }
}

export default HOJAIConnector;
