/**
 * Error Handling Utilities
 * Comprehensive error handling for production-ready app
 */

import { logger } from './logger';

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: Error,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 'NETWORK_ERROR', 0, originalError);
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 'AUTH_ERROR', 401, originalError);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400, undefined, { field });
    this.name = 'ValidationError';
  }
}

export class ServerError extends AppError {
  constructor(message: string, statusCode: number = 500, originalError?: Error) {
    super(message, 'SERVER_ERROR', statusCode, originalError);
    this.name = 'ServerError';
  }
}

// ============================================================================
// ERROR HANDLERS
// ============================================================================

export interface ErrorHandlerConfig {
  showToast?: boolean;
  logToSentry?: boolean;
  logToConsole?: boolean;
  fallbackMessage?: string;
}

const defaultConfig: ErrorHandlerConfig = {
  showToast: true,
  logToSentry: true,
  logToConsole: true,
};

/**
 * Handle error with proper logging and user feedback
 */
export function handleError(
  error: unknown,
  context: string,
  config: ErrorHandlerConfig = defaultConfig
): AppError {
  const appError = normalizeError(error);

  // Log to console
  if (config.logToConsole) {
    // @ts-ignore
    logger.error(`[${context}]`, appError, appError.context);
  }

  // Log to Sentry
  if (config.logToSentry) {
    captureError(appError, context);
  }

  return appError;
}

/**
 * Normalize unknown error to AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new NetworkError(error.message, error);
    }
    // Auth errors
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return new AuthError(error.message, error);
    }
    // Other errors
    return new AppError(error.message, 'UNKNOWN_ERROR', undefined, error);
  }

  return new AppError(
    typeof error === 'string' ? error : 'An unknown error occurred',
    'UNKNOWN_ERROR'
  );
}

/**
 * Capture error to Sentry
 */
export function captureError(error: AppError, context: string): void {
  // Sentry would be integrated here
  // Sentry.captureException(error, { extra: { context, ...error.context } });
  logger.debug('[Sentry] Would capture:', { code: error.code, message: error.message, context });
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // @ts-ignore
    logger.error('[ErrorBoundary]', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={this.handleReset}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a3a52',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ============================================================================
// VALIDATION
// ============================================================================

export function validateRequired(value: unknown, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
}

export function validatePhone(phone: string): void {
  const phoneRegex = /^[+]?[\d\s-]{10,}$/;
  if (!phoneRegex.test(phone)) {
    throw new ValidationError('Invalid phone number', 'phone');
  }
}

// ============================================================================
// SAFE EXECUTION
// ============================================================================

export async function safeExecute<T>(
  fn: () => T | Promise<T>,
  fallback: T,
  context = 'safeExecute'
): Promise<T> {
  try {
    const result = await fn();
    return result;
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
}

export function safeExecuteSync<T>(
  fn: () => T,
  fallback: T,
  context = 'safeExecuteSync'
): T {
  try {
    return fn();
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
}
