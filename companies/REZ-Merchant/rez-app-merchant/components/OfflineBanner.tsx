import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const { width } = Dimensions.get('window');

interface OfflineBannerProps {
  showDetails?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  showDetails = false
}) => {
  const networkStatus = useNetworkStatus();
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  // Don't show banner if online and no pending actions
  if (networkStatus.isOnline && networkStatus.syncStatus.pendingActions === 0) {
    return null;
  }

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    Animated.timing(animation, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const getBannerColor = () => {
    if (networkStatus.isOffline) return Colors[scheme].error;
    if (networkStatus.isSyncing) return Colors[scheme].info;
    if (networkStatus.syncStatus.pendingActions > 0) return Colors[scheme].warning;
    return Colors[scheme].success;
  };

  const getBannerIcon = () => {
    if (networkStatus.isOffline) return 'cloud-offline';
    if (networkStatus.isSyncing) return 'sync';
    if (networkStatus.syncStatus.pendingActions > 0) return 'time';
    return 'cloud-done';
  };

  const getPrimaryMessage = () => {
    if (networkStatus.isOffline) return 'You\'re offline';
    if (networkStatus.isSyncing) return 'Syncing changes...';
    if (networkStatus.syncStatus.pendingActions > 0) {
      return `${networkStatus.syncStatus.pendingActions} pending changes`;
    }
    return 'All changes synced';
  };

  const getSecondaryMessage = () => {
    if (networkStatus.isOffline) {
      return 'Changes will sync when you\'re back online';
    }
    if (networkStatus.isSyncing) {
      return 'Please wait while we sync your changes';
    }
    if (networkStatus.syncStatus.pendingActions > 0) {
      return 'Tap to retry sync now';
    }
    return '';
  };

  const handleBannerPress = () => {
    if (networkStatus.canSync && networkStatus.syncStatus.pendingActions > 0) {
      networkStatus.triggerSync();
    } else if (showDetails) {
      toggleExpanded();
    }
  };

  const formatLastSync = () => {
    if (!networkStatus.syncStatus.lastSyncAt) return 'Never';

    const now = new Date();
    const diff = now.getTime() - networkStatus.syncStatus.lastSyncAt.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return networkStatus.syncStatus.lastSyncAt.toLocaleDateString();
  };

  const expandedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  const themed = getThemedStyles(scheme);

  return (
    <View style={[themed.container, { borderLeftColor: getBannerColor() }]}>
      <TouchableOpacity
        style={STATIC_STYLES.banner}
        onPress={handleBannerPress}
        activeOpacity={0.8}
      >
        <View style={STATIC_STYLES.content}>
          <View style={STATIC_STYLES.iconContainer}>
            <Ionicons
              name={getBannerIcon()}
              size={20}
              color={getBannerColor()}
              style={networkStatus.isSyncing ? STATIC_STYLES.spinningIcon : undefined}
            />
          </View>

          <View style={STATIC_STYLES.textContainer}>
            <ThemedText style={[STATIC_STYLES.primaryText, { color: getBannerColor() }]}>
              {getPrimaryMessage()}
            </ThemedText>
            {getSecondaryMessage() && (
              <ThemedText style={themed.secondaryText}>
                {getSecondaryMessage()}
              </ThemedText>
            )}
          </View>

          {showDetails && (
            <TouchableOpacity
              style={STATIC_STYLES.expandButton}
              onPress={toggleExpanded}
            >
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors[scheme].textSecondary}
              />
            </TouchableOpacity>
          )}

          {networkStatus.canSync && networkStatus.syncStatus.pendingActions > 0 && (
            <TouchableOpacity
              style={themed.syncButton}
              onPress={() => networkStatus.triggerSync()}
            >
              <Ionicons name="refresh" size={16} color={Colors[scheme].background} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {showDetails && (
        <Animated.View style={[themed.expandedContent, { height: expandedHeight }]}>
          <View style={STATIC_STYLES.detailsContainer}>
            <View style={STATIC_STYLES.detailRow}>
              <ThemedText style={themed.detailLabel}>Connection:</ThemedText>
              <ThemedText style={themed.detailValue}>
                {networkStatus.isOnline ? networkStatus.getConnectionTypeDisplay() : 'Offline'}
              </ThemedText>
            </View>

            <View style={STATIC_STYLES.detailRow}>
              <ThemedText style={themed.detailLabel}>Quality:</ThemedText>
              <ThemedText style={[
                themed.detailValue,
                { color: networkStatus.hasGoodConnection ? Colors[scheme].success : Colors[scheme].warning }
              ]}>
                {networkStatus.connectionQuality.charAt(0).toUpperCase() + networkStatus.connectionQuality.slice(1)}
              </ThemedText>
            </View>

            <View style={STATIC_STYLES.detailRow}>
              <ThemedText style={themed.detailLabel}>Last sync:</ThemedText>
              <ThemedText style={themed.detailValue}>
                {formatLastSync()}
              </ThemedText>
            </View>

            <View style={STATIC_STYLES.detailRow}>
              <ThemedText style={themed.detailLabel}>Pending:</ThemedText>
              <ThemedText style={themed.detailValue}>
                {networkStatus.syncStatus.pendingActions} actions
              </ThemedText>
            </View>

            {networkStatus.syncStatus.syncErrors.length > 0 && (
              <View style={themed.errorsContainer}>
                <ThemedText style={themed.errorTitle}>Sync Errors:</ThemedText>
                {networkStatus.syncStatus.syncErrors.map((error, index) => (
                  <ThemedText key={index} style={themed.errorText}>
                    • {error}
                  </ThemedText>
                ))}
                <TouchableOpacity
                  style={STATIC_STYLES.clearErrorsButton}
                  onPress={networkStatus.clearSyncErrors}
                >
                  <ThemedText style={themed.clearErrorsText}>Clear</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// Static styles — theme-independent
const STATIC_STYLES = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
  },
  spinningIcon: {
    // Add rotation animation if needed
  },
  textContainer: {
    flex: 1,
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  expandButton: {
    padding: 4,
  },
  detailsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  clearErrorsButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

type ThemedStyleKeys = 'container' | 'secondaryText' | 'syncButton' | 'expandedContent' | 'detailLabel' | 'detailValue' | 'errorsContainer' | 'errorTitle' | 'errorText' | 'clearErrorsText';

function getThemedStyles(scheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      backgroundColor: Colors[scheme].backgroundSecondary,
      borderLeftWidth: 4,
      marginBottom: 1,
    },
    secondaryText: {
      fontSize: 12,
      color: Colors[scheme].textSecondary,
    },
    syncButton: {
      backgroundColor: Colors[scheme].primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    expandedContent: {
      overflow: 'hidden',
      backgroundColor: Colors[scheme].background,
    },
    detailLabel: {
      fontSize: 12,
      color: Colors[scheme].textSecondary,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 12,
      color: Colors[scheme].text,
      fontWeight: '600',
    },
    errorsContainer: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: Colors[scheme].border,
    },
    errorTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors[scheme].error,
      marginBottom: 4,
    },
    errorText: {
      fontSize: 11,
      color: Colors[scheme].error,
      marginBottom: 2,
    },
    clearErrorsText: {
      fontSize: 10,
      color: Colors[scheme].primary,
      fontWeight: '600',
    },
  } as Record<ThemedStyleKeys, object>);
}
