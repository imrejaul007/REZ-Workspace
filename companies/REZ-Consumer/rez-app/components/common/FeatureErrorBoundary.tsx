/**
 * FeatureErrorBoundary
 *
 * Reusable error boundary for unknown feature section or page.
 * Consolidates the previous GameErrorBoundary, WalletErrorBoundary,
 * ProductPageErrorBoundary, GalleryErrorBoundary, homepage/ErrorBoundary,
 * and the generic ErrorBoundary into one component.
 *
 * Props:
 *  - featureName: optional label shown in the error UI (e.g. "Wallet", "Scratch Card")
 *  - fallback: custom ReactNode to render on error
 *  - onError: callback when an error is caught
 *  - onReset: callback after the user taps "Try Again"
 *  - onSecondaryAction: optional second button (e.g. "Go Back", "Back to Games")
 *  - secondaryActionLabel: text for the second button (default "Go Back")
 *  - secondaryActionIcon: Ionicons name for the second button (default "arrow-back")
 *  - compact: if true, renders a minimal inline error strip instead of full-screen
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { otaManager } from '@/utils/otaManager';

// REZ brand colors for the root error boundary UI
const REZ_NAVY = '#1a2b4a';
const REZ_GOLD = '#c9a84c';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  /** Label shown in the error title, e.g. "Wallet", "Gallery", "Scratch Card" */
  featureName?: string;
  /** Completely custom fallback UI. When provided, the default error UI is skipped. */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Called after the user resets the boundary via "Try Again" */
  onReset?: () => void;
  /** If provided, a secondary button is shown (e.g. "Go Back", "Back to Games") */
  onSecondaryAction?: () => void;
  /** Label for the secondary action button */
  secondaryActionLabel?: string;
  /** Ionicons icon name for the secondary action button */
  secondaryActionIcon?: string;
  /**
   * Render a minimal one-line error strip instead of the full-screen fallback.
   * Useful for wrapping small sections inside a page.
   */
  compact?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, State> {
  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    // Mark crash for OTA rollback detection
    otaManager.markCrash();

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Custom fallback takes priority
    if (this.props.fallback) {
      return this.props.fallback;
    }

    const { featureName, onSecondaryAction, secondaryActionLabel, secondaryActionIcon, compact } = this.props;
    const { error } = this.state;

    // Compact mode: one-line error strip for inline section boundaries
    if (compact) {
      return (
        <View style={styles.compactContainer}>
          <View style={styles.compactContent}>
            <Ionicons name="warning-outline" size={16} color={colors.warningScale[400]} />
            <Text style={styles.compactText} numberOfLines={1}>
              {featureName ? `Failed to load ${featureName.toLowerCase()}` : 'Something went wrong'}
            </Text>
          </View>
          <Pressable onPress={this.handleReset} style={styles.compactRetryButton}>
            <Ionicons name="refresh" size={16} color={colors.brand.purpleLight} />
          </Pressable>
        </View>
      );
    }

    // Detect error type for smarter messaging
    const msg = error?.message?.toLowerCase() ?? '';
    const isNetworkError = msg.includes('network') || msg.includes('fetch') || msg.includes('timeout');

    const title = featureName
      ? (isNetworkError ? 'Connection Error' : `${featureName} Error`)
      : (isNetworkError ? 'Connection Error' : 'Oops! Something went wrong');

    const message = isNetworkError
      ? 'Please check your internet connection and try again.'
      : "We encountered an unexpected error. Don't worry, your data is safe.";

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={isNetworkError ? 'cloud-offline' : 'alert-circle'}
              size={64}
              color={REZ_GOLD}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {__DEV__ && error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorDetailsTitle}>Error Details (Dev Only):</Text>
              <Text style={styles.errorDetailsText} numberOfLines={4}>
                {error.message}
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.primaryButton}
              onPress={this.handleReset}
              accessibilityLabel="Try again"
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Retry</Text>
            </Pressable>

            {onSecondaryAction && (
              <Pressable
                style={styles.secondaryButton}
                onPress={onSecondaryAction}
                accessibilityLabel={secondaryActionLabel ?? 'Go Back'}
              >
                <Ionicons
                  name={(secondaryActionIcon as unknown) ?? 'arrow-back'}
                  size={20}
                  color={REZ_NAVY}
                />
                <Text style={styles.secondaryButtonText}>
                  {secondaryActionLabel ?? 'Go Back'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  // Full-screen fallback
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: REZ_NAVY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: REZ_NAVY,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    maxWidth: 320,
    width: '100%',
    borderWidth: 1,
    borderColor: REZ_GOLD,
  },
  errorDetailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: REZ_GOLD,
    marginBottom: 4,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: REZ_NAVY,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: REZ_NAVY,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: REZ_NAVY,
  },

  // Compact mode
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.tint.amberLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  compactText: {
    fontSize: 14,
    color: colors.brand.amberDark,
    fontWeight: '500',
  },
  compactRetryButton: {
    padding: 4,
  },
});

// Named export for destructured imports
export { FeatureErrorBoundary };

// Default export (used by most consumers that import via `import X from ...`)
export default FeatureErrorBoundary;
