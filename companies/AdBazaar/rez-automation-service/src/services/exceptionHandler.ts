import OpenAI from 'openai';
import { Exception, IAutomationException, IExceptionDocument, ExceptionErrorType, ExceptionAction, IAIDecision } from '../models/Exception';
import logger from '../utils/logger';

/**
 * Configuration for the exception handler
 */
interface ExceptionHandlerConfig {
  openaiApiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  enableAI?: boolean;
  defaultMaxRetries?: number;
}

/**
 * Context about the exception for AI analysis
 */
interface ExceptionContext {
  contactData?: Record<string, unknown>;
  campaignId?: string;
  channel?: string;
  templateId?: string;
  recentAttempts?: number;
  lastErrorCode?: string;
}

/**
 * Retry strategy based on error type
 */
interface RetryStrategy {
  action: ExceptionAction;
  adjustedParams?: Record<string, unknown>;
  suggestedChannel?: string;
  estimatedDelay?: number;
  reasoning: string;
  confidence: number;
}

/**
 * AI Exception Handler Service
 * Uses AI to intelligently handle automation failures
 */
export class ExceptionHandlerService {
  private openai: OpenAI | null = null;
  private config: Required<ExceptionHandlerConfig>;
  private isInitialized: boolean = false;

  constructor(config: ExceptionHandlerConfig = {}) {
    this.config = {
      openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY || '',
      model: config.model || 'gpt-4o',
      maxTokens: config.maxTokens || 500,
      temperature: config.temperature || 0.3,
      enableAI: config.enableAI ?? true,
      defaultMaxRetries: config.defaultMaxRetries || 3,
    };
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.config.enableAI && this.config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.openaiApiKey,
      });
      logger.info('AI Exception Handler initialized with OpenAI', {
        model: this.config.model,
      });
    } else {
      logger.warn('AI Exception Handler running without AI - using rule-based fallback');
    }

    this.isInitialized = true;
  }

  /**
   * Handle an exception from automation execution
   */
  async handleException(
    ruleId: string,
    stepId: string,
    executionId: string,
    error: Error | string,
    originalParams: Record<string, unknown>,
    context?: ExceptionContext
  ): Promise<IExceptionDocument> {
    await this.initialize();

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    const errorType = this.categorizeError(errorMessage, errorStack);

    logger.info('Handling automation exception', {
      ruleId,
      stepId,
      executionId,
      errorType,
      errorMessage,
    });

    // Create exception record
    const exception = new Exception({
      ruleId,
      stepId,
      executionId,
      errorType,
      errorMessage,
      errorStack,
      originalParams,
      failedAt: new Date(),
      retryCount: 0,
      maxRetries: this.config.defaultMaxRetries,
      status: 'pending',
      metadata: {
        contactData: context?.contactData,
        campaignId: context?.campaignId,
        channel: context?.channel,
        templateId: context?.templateId,
        recentAttempts: context?.recentAttempts,
        lastErrorCode: context?.lastErrorCode,
      },
    });

    // Get AI decision
    const decision = await this.getAIDecision(exception, context);
    exception.aiDecision = decision;

    // Update status based on AI decision
    if (decision.action === 'escalate') {
      exception.status = 'escalated';
    }

    await exception.save();

    logger.info('Exception recorded with AI decision', {
      exceptionId: exception._id,
      action: decision.action,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
    });

    return exception;
  }

  /**
   * Categorize error into types
   */
  private categorizeError(errorMessage: string, errorStack?: string): ExceptionErrorType {
    const lowerMessage = errorMessage.toLowerCase();
    const combined = `${lowerMessage} ${errorStack || ''}`.toLowerCase();

    if (combined.includes('validation') || combined.includes('invalid') || combined.includes('required')) {
      return 'validation';
    }
    if (combined.includes('auth') || combined.includes('unauthorized') || combined.includes('forbidden') || combined.includes('token')) {
      return 'auth_error';
    }
    if (combined.includes('timeout') || combined.includes('timed out') || combined.includes('etimedout')) {
      return 'timeout';
    }
    if (combined.includes('rate limit') || combined.includes('too many requests') || combined.includes('429')) {
      return 'rate_limit';
    }
    if (combined.includes('api') || combined.includes('request') || combined.includes('fetch') || combined.includes('response')) {
      return 'api_error';
    }
    if (combined.includes('invalid_data') || combined.includes('malformed') || combined.includes('parse')) {
      return 'invalid_data';
    }

    return 'unknown';
  }

  /**
   * Get AI decision for handling the exception
   */
  private async getAIDecision(
    exception: IExceptionDocument,
    context?: ExceptionContext
  ): Promise<IAIDecision> {
    // Use rule-based fallback if AI is disabled
    if (!this.openai) {
      return this.getRuleBasedDecision(exception.errorType, exception.retryCount);
    }

    try {
      const prompt = this.buildDecisionPrompt(exception, context);
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert automation failure handler. Analyze the exception and decide the best course of action.
Your options are:
- retry: The operation can be retried with or without adjusted parameters
- skip: The failure is non-critical, continue with the next step
- human: The issue requires human intervention
- escalate: This is a priority issue that needs immediate escalation
- fallback: Switch to an alternate channel or method

Return a JSON object with:
{
  "action": "retry|skip|human|escalate|fallback",
  "confidence": 0.0-1.0,
  "reasoning": "detailed explanation",
  "adjustedParams": { /* optional - parameters to adjust for retry */ },
  "suggestedChannel": "email|sms|whatsapp|push /* optional - for fallback */,
  "estimatedRetryDelay": number /* optional - milliseconds to wait before retry */
}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        logger.warn('Empty AI response, using rule-based fallback');
        return this.getRuleBasedDecision(exception.errorType, exception.retryCount);
      }

      // Parse JSON response
      const decision = JSON.parse(response) as IAIDecision;

      // Validate the decision
      if (!['retry', 'skip', 'human', 'escalate', 'fallback'].includes(decision.action)) {
        logger.warn('Invalid AI action, using rule-based fallback', { action: decision.action });
        return this.getRuleBasedDecision(exception.errorType, exception.retryCount);
      }

      return decision;
    } catch (error) {
      logger.error('AI decision failed, using rule-based fallback', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return this.getRuleBasedDecision(exception.errorType, exception.retryCount);
    }
  }

  /**
   * Build prompt for AI decision
   */
  private buildDecisionPrompt(exception: IExceptionDocument, context?: ExceptionContext): string {
    return `Analyze this automation exception:

Error Type: ${exception.errorType}
Error Message: ${exception.errorMessage}
Retry Count: ${exception.retryCount} / ${exception.maxRetries}
Rule ID: ${exception.ruleId}
Step ID: ${exception.stepId}
Failed At: ${exception.failedAt.toISOString()}

Original Parameters:
${JSON.stringify(exception.originalParams, null, 2)}

Context:
- Channel: ${context?.channel || 'unknown'}
- Campaign ID: ${context?.campaignId || 'unknown'}
- Template ID: ${context?.templateId || 'unknown'}
- Recent Attempts: ${context?.recentAttempts || 0}
- Last Error Code: ${context?.lastErrorCode || 'none'}

Contact Data (if available):
${context?.contactData ? JSON.stringify(context.contactData, null, 2) : 'Not available'}

What should we do with this exception?`;
  }

  /**
   * Rule-based decision fallback
   */
  private getRuleBasedDecision(errorType: ExceptionErrorType, retryCount: number): IAIDecision {
    // Escalate after max retries
    if (retryCount >= 3) {
      return {
        action: 'escalate',
        confidence: 0.9,
        reasoning: 'Maximum retry attempts reached. Escalating for human review.',
      };
    }

    // Based on error type
    switch (errorType) {
      case 'validation':
        return {
          action: 'skip',
          confidence: 0.85,
          reasoning: 'Validation errors indicate invalid input data. Skipping to prevent further failures.',
        };

      case 'auth_error':
        return {
          action: 'escalate',
          confidence: 0.95,
          reasoning: 'Authentication errors require immediate attention and credential review.',
        };

      case 'timeout':
        return {
          action: 'retry',
          confidence: 0.7,
          reasoning: 'Timeout may be transient. Retrying with exponential backoff.',
          estimatedRetryDelay: Math.pow(2, retryCount) * 1000,
        };

      case 'rate_limit':
        return {
          action: 'retry',
          confidence: 0.8,
          reasoning: 'Rate limit hit. Waiting before retry.',
          estimatedRetryDelay: Math.pow(2, retryCount) * 5000,
        };

      case 'api_error':
        return {
          action: 'retry',
          confidence: 0.65,
          reasoning: 'API error may be transient. Retrying with adjusted parameters.',
          estimatedRetryDelay: Math.pow(2, retryCount) * 2000,
        };

      case 'invalid_data':
        return {
          action: 'fallback',
          confidence: 0.75,
          reasoning: 'Invalid data detected. Suggesting fallback to alternate channel.',
          suggestedChannel: 'email',
        };

      case 'unknown':
      default:
        return {
          action: 'retry',
          confidence: 0.5,
          reasoning: 'Unknown error. Retrying as default behavior.',
          estimatedRetryDelay: Math.pow(2, retryCount) * 1000,
        };
    }
  }

  /**
   * Get exception by ID
   */
  async getException(exceptionId: string): Promise<IExceptionDocument | null> {
    return Exception.findById(exceptionId);
  }

  /**
   * List exceptions with filtering
   */
  async listExceptions(options: {
    status?: string;
    errorType?: ExceptionErrorType;
    ruleId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    exceptions: IExceptionDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filter: Record<string, unknown> = {};

    if (options.status) filter.status = options.status;
    if (options.errorType) filter.errorType = options.errorType;
    if (options.ruleId) filter.ruleId = options.ruleId;

    if (options.startDate || options.endDate) {
      filter.failedAt = {};
      if (options.startDate) (filter.failedAt as Record<string, Date>).$gte = options.startDate;
      if (options.endDate) (filter.failedAt as Record<string, Date>).$lte = options.endDate;
    }

    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const [exceptions, total] = await Promise.all([
      Exception.find(filter).sort({ failedAt: -1 }).skip(skip).limit(limit),
      Exception.countDocuments(filter),
    ]);

    return { exceptions, total, page, limit };
  }

  /**
   * Get exception statistics
   */
  async getExceptionStats(startDate?: Date, endDate?: Date): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byErrorType: Record<string, number>;
    byAction: Record<string, number>;
    avgRetryCount: number;
    resolutionRate: number;
  }> {
    return Exception.getStats(startDate, endDate);
  }

  /**
   * Manually retry an exception
   */
  async retryException(exceptionId: string, adjustedParams?: Record<string, unknown>): Promise<IExceptionDocument | null> {
    const exception = await Exception.findById(exceptionId);
    if (!exception) return null;

    if (!exception.canRetry()) {
      throw new Error('Exception cannot be retried');
    }

    // Increment retry count
    exception.retryCount += 1;
    exception.status = 'pending';

    // Apply adjusted params if provided
    if (adjustedParams) {
      exception.originalParams = { ...exception.originalParams, ...adjustedParams };
    }

    await exception.save();

    logger.info('Exception manually retried', {
      exceptionId: exception._id,
      retryCount: exception.retryCount,
    });

    return exception;
  }

  /**
   * Resolve an exception manually
   */
  async resolveException(
    exceptionId: string,
    resolvedBy: string,
    resolution: string
  ): Promise<IExceptionDocument | null> {
    const exception = await Exception.findById(exceptionId);
    if (!exception) return null;

    exception.resolve(resolvedBy, resolution);
    await exception.save();

    logger.info('Exception resolved', {
      exceptionId: exception._id,
      resolvedBy,
      resolution,
    });

    return exception;
  }

  /**
   * Ignore an exception
   */
  async ignoreException(exceptionId: string, reason: string): Promise<IExceptionDocument | null> {
    const exception = await Exception.findById(exceptionId);
    if (!exception) return null;

    exception.status = 'ignored';
    exception.resolution = reason;
    exception.resolvedAt = new Date();
    await exception.save();

    logger.info('Exception ignored', {
      exceptionId: exception._id,
      reason,
    });

    return exception;
  }

  /**
   * Get pending exceptions for processing
   */
  async getPendingExceptions(limit: number = 100): Promise<IExceptionDocument[]> {
    return Exception.findPending(limit);
  }

  /**
   * Execute the AI-decided action
   */
  async executeAction(
    exception: IExceptionDocument
  ): Promise<{
    success: boolean;
    shouldContinue: boolean;
    nextStepId?: string;
    adjustedParams?: Record<string, unknown>;
    suggestedChannel?: string;
    error?: string;
  }> {
    const decision = exception.aiDecision;
    if (!decision) {
      return { success: false, shouldContinue: false, error: 'No AI decision available' };
    }

    logger.info('Executing AI decision', {
      exceptionId: exception._id,
      action: decision.action,
      reasoning: decision.reasoning,
    });

    switch (decision.action) {
      case 'retry':
        return {
          success: true,
          shouldContinue: true,
          adjustedParams: decision.adjustedParams,
        };

      case 'skip':
        return {
          success: true,
          shouldContinue: true,
        };

      case 'fallback':
        return {
          success: true,
          shouldContinue: true,
          suggestedChannel: decision.suggestedChannel,
          adjustedParams: decision.adjustedParams,
        };

      case 'human':
        logger.warn('Exception requires human intervention', {
          exceptionId: exception._id,
          ruleId: exception.ruleId,
          stepId: exception.stepId,
        });
        return {
          success: true,
          shouldContinue: false,
        };

      case 'escalate':
        exception.escalate();
        await exception.save();
        return {
          success: true,
          shouldContinue: false,
        };

      default:
        return {
          success: false,
          shouldContinue: false,
          error: `Unknown action: ${decision.action}`,
        };
    }
  }

  /**
   * Cleanup old resolved exceptions
   */
  async cleanupResolved(retentionDays: number = 30): Promise<number> {
    const deleted = await Exception.cleanupResolved(retentionDays);
    logger.info('Cleaned up resolved exceptions', {
      deletedCount: deleted,
      retentionDays,
    });
    return deleted;
  }

  /**
   * Get retry delay based on AI decision
   */
  getRetryDelay(decision: IAIDecision, baseDelay: number = 1000): number {
    if (decision.estimatedRetryDelay) {
      return decision.estimatedRetryDelay;
    }

    // Default exponential backoff
    return baseDelay;
  }
}

// Export singleton instance
export const exceptionHandler = new ExceptionHandlerService();
export default exceptionHandler;
