/**
 * KDS Mobile - Header Component
 * Top header with status, stats, and quick actions
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrderStats, useNetworkStatus } from '../hooks/useOrders';
import { formatDateTime } from '../utils/helpers';
import { useKDSStore } from '../store/kdsStore';

interface HeaderProps {
  onSettingsPress?: () => void;
  onRefresh?: () => void;
  onRecallPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onSettingsPress,
  onRefresh,
  onRecallPress,
}) => {
  const insets = useSafeAreaInsets();
  const stats = useOrderStats();
  const isOnline = useNetworkStatus();
  const lastSyncTime = useKDSStore((state) => state.lastSyncTime);
  const recentOrders = useKDSStore((state) => state.recentOrders);

  const hasRecentOrders = recentOrders.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Left Section */}
      <View style={styles.leftSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>REZ</Text>
          <Text style={styles.logoSubtext}>KDS</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FFC107' }]}>
              {stats.pendingCount}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#9C27B0' }]}>
              {stats.inProgressCount}
            </Text>
            <Text style={styles.statLabel}>Cooking</Text>
          </View>
          {stats.urgentCount > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={[styles.statItem, styles.urgentStat]}>
                <Text style={[styles.statValue, { color: '#F44336' }]}>
                  {stats.urgentCount}
                </Text>
                <Text style={styles.statLabel}>Urgent</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Center Section */}
      <View style={styles.centerSection}>
        {lastSyncTime && (
          <Text style={styles.syncText}>
            Last sync: {formatDateTime(lastSyncTime)}
          </Text>
        )}
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {/* Recall Button */}
        {hasRecentOrders && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onRecallPress}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>RECENT</Text>
            <View style={styles.recentBadge}>
              <Text style={styles.recentBadgeText}>{recentOrders.length}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Text style={styles.iconText}>REFRESH</Text>
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <Text style={styles.iconText}>SETTINGS</Text>
        </TouchableOpacity>

        {/* Connection Status */}
        <View
          style={[
            styles.connectionStatus,
            isOnline ? styles.onlineStatus : styles.offlineStatus,
          ]}
        >
          <View
            style={[
              styles.connectionDot,
              isOnline ? styles.onlineDot : styles.offlineDot,
            ]}
          />
          <Text
            style={[
              styles.connectionText,
              isOnline ? styles.onlineText : styles.offlineText,
            ]}
          >
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  logoSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#888888',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#3a3a4e',
  },
  urgentStat: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  syncText: {
    fontSize: 11,
    color: '#666666',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#607D8B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recentBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  recentBadgeText: {
    color: '#607D8B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconButton: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  iconText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 6,
  },
  onlineStatus: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  offlineStatus: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineDot: {
    backgroundColor: '#4CAF50',
  },
  offlineDot: {
    backgroundColor: '#F44336',
  },
  connectionText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  onlineText: {
    color: '#4CAF50',
  },
  offlineText: {
    color: '#F44336',
  },
});

export default Header;
