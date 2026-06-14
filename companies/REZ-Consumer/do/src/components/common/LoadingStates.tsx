import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { RefreshCw, WifiOff, AlertCircle } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/components/Button';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={color || colors.primary} />
    </View>
  );
};

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background + 'E6' }]}>
      <View style={[styles.overlayContent, { backgroundColor: colors.backgroundElevated }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        {message && (
          <Text style={[styles.overlayText, { color: colors.label }]}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );
};

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  message = 'Something went wrong',
  onRetry,
}) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.errorContainer}>
      <AlertCircle size={48} color={colors.systemRed} />
      <Text style={[styles.errorTitle, { color: colors.label, ...typography.titleMedium }]}>
        Oops!
      </Text>
      <Text style={[styles.errorMessage, { color: colors.labelSecondary }]}>
        {message}
      </Text>
      {onRetry && (
        <Button variant="secondary" onPress={onRetry}>
          Try Again
        </Button>
      )}
    </View>
  );
};

interface NetworkErrorProps {
  onRetry?: () => void;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry }) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.errorContainer}>
      <WifiOff size={48} color={colors.systemOrange} />
      <Text style={[styles.errorTitle, { color: colors.label, ...typography.titleMedium }]}>
        No Connection
      </Text>
      <Text style={[styles.errorMessage, { color: colors.labelSecondary }]}>
        Please check your internet connection and try again.
      </Text>
      {onRetry && (
        <Button
          variant="primary"
          onPress={onRetry}
          style={{ marginTop: 16 }}
        >
          Retry
        </Button>
      )}
    </View>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      {icon && <View style={styles.emptyIcon}>{icon}</View>}
      <Text style={[styles.emptyTitle, { color: colors.label, ...typography.titleMedium }]}>
        {title}
      </Text>
      {description && (
        <Text style={[styles.emptyDescription, { color: colors.labelSecondary }]}>
          {description}
        </Text>
      )}
      {action && (
        <Button
          variant="primary"
          onPress={action.onPress}
          style={{ marginTop: 16 }}
        >
          {action.label}
        </Button>
      )}
    </View>
  );
};

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: typeof width === 'number' ? width : width,
          height,
          borderRadius,
          backgroundColor: colors.fill,
        },
      ]}
    />
  );
};

interface SkeletonCardProps {}

export const SkeletonCard: React.FC<SkeletonCardProps> = () => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.skeletonCard, { backgroundColor: colors.backgroundElevated, borderRadius: 16 }]}>
      <Skeleton height={120} borderRadius={16} />
      <View style={{ padding: spacing.sm }}>
        <Skeleton width="70%" height={16} />
        <View style={{ height: 8 }} />
        <Skeleton width="50%" height={12} />
        <View style={{ height: 8 }} />
        <Skeleton width="30%" height={12} />
      </View>
    </View>
  );
};

interface SkeletonListProps {
  count?: number;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ count = 5 }) => {
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  overlayContent: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  overlayText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  errorTitle: {
    marginTop: 8,
  },
  errorMessage: {
    textAlign: 'center',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    marginTop: 4,
  },
  skeleton: {
    overflow: 'hidden',
  },
  skeletonCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
});
