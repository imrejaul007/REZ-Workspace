// @ts-nocheck
/**
 * ProductPageErrorBoundary Component
 * Specialized error boundary for product page with product-specific error handling
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

interface Props {
  children: ReactNode;
  productId?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ProductPageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {

    this.setState({
      error,
      errorInfo,
    });

    // M-4 FIX: Wire ProductPageErrorBoundary to Sentry for production error tracking
    if (__DEV__) {
      logger.error('[ProductPageErrorBoundary]', error, errorInfo?.componentStack);
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
        Sentry.captureException(error, {
          extra: { componentStack: errorInfo?.componentStack, context: 'ProductPageErrorBoundary' },
        });
      } catch {
        // Sentry not available
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleGoBack = () => {
    if (this.props.onGoBack) {
      this.props.onGoBack();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetworkError = this.state.error?.message?.toLowerCase().includes('network') ||
        this.state.error?.message?.toLowerCase().includes('fetch') ||
        this.state.error?.message?.toLowerCase().includes('timeout');

      const isNotFoundError = this.state.error?.message?.toLowerCase().includes('not found') ||
        this.state.error?.message?.toLowerCase().includes('404');

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={isNetworkError ? "cloud-offline" : isNotFoundError ? "search" : "alert-circle"}
                size={64}
                color={colors.error}
              />
            </View>

            <Text style={styles.title}>
              {isNetworkError
                ? "Connection Error"
                : isNotFoundError
                  ? "Product Not Found"
                  : "Oops! Something went wrong"}
            </Text>

            <Text style={styles.message}>
              {isNetworkError
                ? "Unable to load product details. Please check your internet connection and try again."
                : isNotFoundError
                  ? "The product you're looking for could not be found. It may have been removed or is no longer available."
                  : "We encountered an unexpected error while loading this product. Don't worry, your data is safe."}
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorDetailsText}>{this.state.error.message}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Pressable
                style={styles.primaryButton}
                onPress={this.handleReset}
                accessibilityLabel="Try again"
                accessibilityRole="button"
                accessibilityHint="Double tap to retry loading the product"
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </Pressable>

              {this.props.onGoBack && (
                <Pressable
                  style={styles.secondaryButton}
                  onPress={this.handleGoBack}
                  accessibilityLabel="Go back"
                  accessibilityRole="button"
                  accessibilityHint="Double tap to go back to previous page"
                >
                  <Ionicons name="arrow-back" size={20} color={colors.primary[700]} />
                  <Text style={styles.secondaryButtonText}>Go Back</Text>
                </Pressable>
              )}
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    color: colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    lineHeight: 22,
    maxWidth: 320,
  },
  errorDetails: {
    backgroundColor: colors.background.tertiary,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  errorDetailsTitle: {
    ...Typography.labelSmall,
    color: colors.error,
    marginBottom: Spacing.xs,
  },
  errorDetailsText: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: Spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[700],
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.purpleMedium,
  },
  primaryButtonText: {
    ...Typography.button,
    color: colors.text.white,
    fontSize: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[700],
    gap: Spacing.sm,
  },
  secondaryButtonText: {
    ...Typography.buttonSmall,
    color: colors.primary[700],
    fontSize: 16,
    fontWeight: '600',
  },
});

export default React.memo(ProductPageErrorBoundary);
