/**
 * Hojai LLM Adapter - Custom Error Classes
 *
 * Provides structured error handling for all LLM operations
 */
/**
 * Base error class for all LLM-related errors
 */
export declare class LLMError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly isRetryable: boolean;
    readonly originalError?: Error;
    readonly metadata?: Record<string, unknown>;
    constructor(message: string, options?: {
        code?: string;
        statusCode?: number;
        isRetryable?: boolean;
        originalError?: Error;
        metadata?: Record<string, unknown>;
    });
    toJSON(): Record<string, unknown>;
}
/**
 * Authentication error with API provider
 */
export declare class AuthenticationError extends LLMError {
    constructor(message: string, originalError?: Error);
}
/**
 * Rate limit exceeded error
 */
export declare class RateLimitError extends LLMError {
    readonly retryAfterMs?: number;
    readonly limitType?: 'tokens' | 'requests' | 'time';
    constructor(message: string, options?: {
        retryAfterMs?: number;
        limitType?: 'tokens' | 'requests' | 'time';
        originalError?: Error;
    });
}
/**
 * Token limit exceeded error
 */
export declare class TokenLimitError extends LLMError {
    readonly inputTokens: number;
    readonly maxTokens: number;
    constructor(message: string, options: {
        inputTokens: number;
        maxTokens: number;
        originalError?: Error;
    });
}
/**
 * Model not available or not found error
 */
export declare class ModelNotFoundError extends LLMError {
    readonly model: string;
    readonly provider: string;
    constructor(model: string, provider: string, originalError?: Error);
}
/**
 * Context window exceeded error
 */
export declare class ContextWindowError extends LLMError {
    readonly contextTokens: number;
    readonly maxContext: number;
    constructor(contextTokens: number, maxContext: number, originalError?: Error);
}
/**
 * Invalid request error
 */
export declare class InvalidRequestError extends LLMError {
    readonly validationErrors?: z.ZodError;
    constructor(message: string, options?: {
        validationErrors?: z.ZodError;
        originalError?: Error;
    });
}
/**
 * Empty response error
 */
export declare class EmptyResponseError extends LLMError {
    constructor(originalError?: Error);
}
/**
 * Response parsing error
 */
export declare class ResponseParseError extends LLMError {
    readonly rawResponse?: string;
    constructor(message: string, options?: {
        rawResponse?: string;
        originalError?: Error;
    });
}
/**
 * Streaming error
 */
export declare class StreamingError extends LLMError {
    readonly chunksReceived: number;
    constructor(message: string, options?: {
        chunksReceived?: number;
        originalError?: Error;
    });
}
/**
 * Timeout error
 */
export declare class TimeoutError extends LLMError {
    readonly timeoutMs: number;
    readonly operation?: string;
    constructor(timeoutMs: number, options?: {
        operation?: string;
        originalError?: Error;
    });
}
/**
 * Retry exhausted error
 */
export declare class RetryExhaustedError extends LLMError {
    readonly attempts: number;
    readonly lastError?: Error;
    constructor(attempts: number, lastError?: Error);
}
/**
 * Provider unavailable error
 */
export declare class ProviderUnavailableError extends LLMError {
    readonly provider: string;
    readonly lastChecked?: Date;
    constructor(provider: string, options?: {
        lastChecked?: Date;
        originalError?: Error;
    });
}
/**
 * Configuration error
 */
export declare class ConfigurationError extends LLMError {
    readonly configKey?: string;
    constructor(message: string, options?: {
        configKey?: string;
        originalError?: Error;
    });
}
import { z } from 'zod';
/**
 * Check if an error is retryable
 */
export declare function isRetryableError(error: unknown): boolean;
/**
 * Get error message for logging
 */
export declare function getErrorMessage(error: unknown): string;
/**
 * Wrap async function with error handling
 */
export declare function withErrorHandling<T>(fn: () => Promise<T>, options?: {
    errorClass?: new (message: string, error?: Error) => LLMError;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
}): Promise<T>;
/**
 * Sleep utility for retries
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry with exponential backoff
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
}): Promise<T>;
//# sourceMappingURL=errors.d.ts.map