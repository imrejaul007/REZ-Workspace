/**
 * Loading & Empty State Components
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

// Loading Spinner
interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
}

export function Loading({ size = 'large', color = '#e94560', text }: LoadingProps) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.loadingText}>{text}</Text>}
    </View>
  );
}

// Full Screen Loading
interface FullScreenLoadingProps {
  text?: string;
}

export function FullScreenLoading({ text = 'Loading...' }: FullScreenLoadingProps) {
  return (
    <View style={styles.fullScreenLoading}>
      <View style={styles.loadingContent}>
        <Text style={styles.loadingIcon}>🚴</Text>
        <ActivityIndicator size="large" color="#e94560" style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>{text}</Text>
      </View>
    </View>
  );
}

// Empty State
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDescription}>{description}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.emptyButton} onPress={onAction}>
          <Text style={styles.emptyButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Skeleton Loader
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4 }: SkeletonProps) {
  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
      ]}
    />
  );
}

// Skeleton Card
export function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <Skeleton width={50} height={50} borderRadius={12} />
        <View style={styles.skeletonText}>
          <Skeleton width="60%" height={16} />
          <View style={{ marginTop: 8 }} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <View style={styles.skeletonBody}>
        <Skeleton width="100%" height={14} />
        <View style={{ marginTop: 8 }} />
        <Skeleton width="80%" height={14} />
      </View>
    </View>
  );
}

// Error State
interface ErrorStateProps {
  icon?: string;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  icon = '⚠️',
  title = 'Something went wrong',
  message = 'Please try again later',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>{icon}</Text>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Pull to Refresh indicator
export function RefreshIndicator() {
  return (
    <View style={styles.refreshIndicator}>
      <ActivityIndicator size="small" color="#e94560" />
      <Text style={styles.refreshText}>Refreshing...</Text>
    </View>
  );
}

// Button Loading State
export function ButtonLoading({ label = 'Loading...' }: { label?: string }) {
  return (
    <View style={styles.buttonLoading}>
      <ActivityIndicator size="small" color="#fff" />
      <Text style={styles.buttonLoadingText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Loading styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingSpinner: {
    marginVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  fullScreenLoading: {
    flex: 1,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },

  // Empty state styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Skeleton styles
  skeleton: {
    backgroundColor: '#2a2a4e',
  },
  skeletonCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonText: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonBody: {
    marginTop: 8,
  },

  // Error state styles
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Refresh indicator
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  refreshText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
  },

  // Button loading
  buttonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonLoadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});