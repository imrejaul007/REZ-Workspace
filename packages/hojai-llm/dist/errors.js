"use strict";
/**
 * Hojai LLM Adapter - Custom Error Classes
 *
 * Provides structured error handling for all LLM operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationError = exports.ProviderUnavailableError = exports.RetryExhaustedError = exports.TimeoutError = exports.StreamingError = exports.ResponseParseError = exports.EmptyResponseError = exports.InvalidRequestError = exports.ContextWindowError = exports.ModelNotFoundError = exports.TokenLimitError = exports.RateLimitError = exports.AuthenticationError = exports.LLMError = void 0;
exports.isRetryableError = isRetryableError;
exports.getErrorMessage = getErrorMessage;
exports.withErrorHandling = withErrorHandling;
exports.sleep = sleep;
exports.retryWithBackoff = retryWithBackoff;
// ============================================================================
// BASE ERROR CLASS
// ============================================================================
/**
 * Base error class for all LLM-related errors
 */
class LLMError extends Error {
    code;
    statusCode;
    isRetryable;
    originalError;
    metadata;
    constructor(message, options = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = options.code || 'LLM_ERROR';
        this.statusCode = options.statusCode || 500;
        this.isRetryable = options.isRetryable ?? false;
        this.originalError = options.originalError;
        this.metadata = options.metadata;
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            isRetryable: this.isRetryable,
            metadata: this.metadata,
            stack: this.stack
        };
    }
}
exports.LLMError = LLMError;
// ============================================================================
// PROVIDER-SPECIFIC ERRORS
// ============================================================================
/**
 * Authentication error with API provider
 */
class AuthenticationError extends LLMError {
    constructor(message, originalError) {
        super(message, {
            code: 'AUTHENTICATION_ERROR',
            statusCode: 401,
            isRetryable: false,
            originalError
        });
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Rate limit exceeded error
 */
class RateLimitError extends LLMError {
    retryAfterMs;
    limitType;
    constructor(message, options = {}) {
        super(message, {
            code: 'RATE_LIMIT_ERROR',
            statusCode: 429,
            isRetryable: true,
            originalError: options.originalError,
            metadata: {
                retryAfterMs: options.retryAfterMs,
                limitType: options.limitType
            }
        });
        this.retryAfterMs = options.retryAfterMs;
        this.limitType = options.limitType;
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Token limit exceeded error
 */
class TokenLimitError extends LLMError {
    inputTokens;
    maxTokens;
    constructor(message, options) {
        super(message, {
            code: 'TOKEN_LIMIT_ERROR',
            statusCode: 400,
            isRetryable: false,
            originalError: options.originalError,
            metadata: {
                inputTokens: options.inputTokens,
                maxTokens: options.maxTokens
            }
        });
        this.inputTokens = options.inputTokens;
        this.maxTokens = options.maxTokens;
    }
}
exports.TokenLimitError = TokenLimitError;
/**
 * Model not available or not found error
 */
class ModelNotFoundError extends LLMError {
    model;
    provider;
    constructor(model, provider, originalError) {
        super(`Model '${model}' not available from provider '${provider}'`, {
            code: 'MODEL_NOT_FOUND',
            statusCode: 404,
            isRetryable: false,
            originalError,
            metadata: { model, provider }
        });
        this.model = model;
        this.provider = provider;
    }
}
exports.ModelNotFoundError = ModelNotFoundError;
/**
 * Context window exceeded error
 */
class ContextWindowError extends LLMError {
    contextTokens;
    maxContext;
    constructor(contextTokens, maxContext, originalError) {
        super(`Context window exceeded: ${contextTokens} tokens > ${maxContext} max`, {
            code: 'CONTEXT_WINDOW_ERROR',
            statusCode: 400,
            isRetryable: false,
            originalError,
            metadata: { contextTokens, maxContext }
        });
        this.contextTokens = contextTokens;
        this.maxContext = maxContext;
    }
}
exports.ContextWindowError = ContextWindowError;
// ============================================================================
// REQUEST/RESPONSE ERRORS
// ============================================================================
/**
 * Invalid request error
 */
class InvalidRequestError extends LLMError {
    validationErrors;
    constructor(message, options = {}) {
        super(message, {
            code: 'INVALID_REQUEST',
            statusCode: 400,
            isRetryable: false,
            originalError: options.originalError,
            metadata: {
                validationErrors: options.validationErrors?.errors
            }
        });
        this.validationErrors = options.validationErrors;
    }
}
exports.InvalidRequestError = InvalidRequestError;
/**
 * Empty response error
 */
class EmptyResponseError extends LLMError {
    constructor(originalError) {
        super('LLM returned empty response', {
            code: 'EMPTY_RESPONSE',
            statusCode: 500,
            isRetryable: true,
            originalError
        });
    }
}
exports.EmptyResponseError = EmptyResponseError;
/**
 * Response parsing error
 */
class ResponseParseError extends LLMError {
    rawResponse;
    constructor(message, options = {}) {
        super(message, {
            code: 'RESPONSE_PARSE_ERROR',
            statusCode: 500,
            isRetryable: false,
            originalError: options.originalError,
            metadata: { rawResponse: options.rawResponse }
        });
        this.rawResponse = options.rawResponse;
    }
}
exports.ResponseParseError = ResponseParseError;
/**
 * Streaming error
 */
class StreamingError extends LLMError {
    chunksReceived;
    constructor(message, options = {}) {
        super(message, {
            code: 'STREAMING_ERROR',
            statusCode: 500,
            isRetryable: false,
            originalError: options.originalError,
            metadata: { chunksReceived: options.chunksReceived }
        });
        this.chunksReceived = options.chunksReceived ?? 0;
    }
}
exports.StreamingError = StreamingError;
/**
 * Timeout error
 */
class TimeoutError extends LLMError {
    timeoutMs;
    operation;
    constructor(timeoutMs, options = {}) {
        super(`Operation timed out after ${timeoutMs}ms`, {
            code: 'TIMEOUT_ERROR',
            statusCode: 504,
            isRetryable: true,
            originalError: options.originalError,
            metadata: { timeoutMs, operation: options.operation }
        });
        this.timeoutMs = timeoutMs;
        this.operation = options.operation;
    }
}
exports.TimeoutError = TimeoutError;
/**
 * Retry exhausted error
 */
class RetryExhaustedError extends LLMError {
    attempts;
    lastError;
    constructor(attempts, lastError) {
        super(`Failed after ${attempts} retry attempts`, {
            code: 'RETRY_EXHAUSTED',
            statusCode: 500,
            isRetryable: false,
            originalError: lastError,
            metadata: { attempts }
        });
        this.attempts = attempts;
        this.lastError = lastError;
    }
}
exports.RetryExhaustedError = RetryExhaustedError;
// ============================================================================
// SYSTEM ERRORS
// ============================================================================
/**
 * Provider unavailable error
 */
class ProviderUnavailableError extends LLMError {
    provider;
    lastChecked;
    constructor(provider, options = {}) {
        super(`Provider '${provider}' is currently unavailable`, {
            code: 'PROVIDER_UNAVAILABLE',
            statusCode: 503,
            isRetryable: true,
            originalError: options.originalError,
            metadata: {
                provider,
                lastChecked: options.lastChecked?.toISOString()
            }
        });
        this.provider = provider;
        this.lastChecked = options.lastChecked;
    }
}
exports.ProviderUnavailableError = ProviderUnavailableError;
/**
 * Configuration error
 */
class ConfigurationError extends LLMError {
    configKey;
    constructor(message, options = {}) {
        super(message, {
            code: 'CONFIGURATION_ERROR',
            statusCode: 500,
            isRetryable: false,
            originalError: options.originalError,
            metadata: { configKey: options.configKey }
        });
        this.configKey = options.configKey;
    }
}
exports.ConfigurationError = ConfigurationError;
/**
 * Check if an error is retryable
 */
function isRetryableError(error) {
    if (error instanceof LLMError) {
        return error.isRetryable;
    }
    if (error instanceof Error) {
        // Network errors are typically retryable
        if (error.message.includes('ECONNREFUSED') ||
            error.message.includes('ETIMEDOUT') ||
            error.message.includes('network')) {
            return true;
        }
    }
    return false;
}
/**
 * Get error message for logging
 */
function getErrorMessage(error) {
    if (error instanceof LLMError) {
        return `[${error.code}] ${error.message}`;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
/**
 * Wrap async function with error handling
 */
async function withErrorHandling(fn, options = {}) {
    try {
        return await fn();
    }
    catch (error) {
        if (error instanceof LLMError) {
            throw error;
        }
        const errorClass = options.errorClass || LLMError;
        const message = options.errorMessage || (error instanceof Error ? error.message : 'Unknown error');
        const err = error instanceof Error ? error : new Error(String(error));
        // Create a new error instance with proper error object
        const newError = Object.assign(Object.create(errorClass.prototype), new Error(message, { cause: err }), {
            code: 'LLM_ERROR',
            statusCode: 500,
            isRetryable: false,
            originalError: err,
            metadata: options.metadata
        });
        throw newError;
    }
}
/**
 * Sleep utility for retries
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Retry with exponential backoff
 */
async function retryWithBackoff(fn, options = {}) {
    const maxAttempts = options.maxAttempts || 3;
    const baseDelayMs = options.baseDelayMs || 1000;
    const maxDelayMs = options.maxDelayMs || 30000;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt === maxAttempts || !isRetryableError(lastError)) {
                throw lastError;
            }
            // Exponential backoff with jitter
            const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000, maxDelayMs);
            options.onRetry?.(attempt, lastError);
            await sleep(delay);
        }
    }
    throw lastError;
}
//# sourceMappingURL=errors.js.map