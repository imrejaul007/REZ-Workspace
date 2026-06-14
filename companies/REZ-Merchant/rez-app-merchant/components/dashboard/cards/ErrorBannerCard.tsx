/**
 * ErrorBannerCard — Sprint -1a S-size exemplar extraction.
 *
 * Source: app/(dashboard)/index.tsx lines 531-546 (error banner shown when
 * `fetchDashboardData` threw). Rendered at the top of the shell, above the
 * header, so merchants see fetch failures as the first thing.
 *
 * Narrow-prop pattern: this card doesn't need the full DashboardCardProps
 * interface. It takes only the fields it reads.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/DesignTokens';

export interface ErrorBannerCardProps {
  error: string | null | undefined;
}

export const ErrorBannerCard: React.FC<ErrorBannerCardProps> = ({ error }) => {
  if (!error) return null;
  return (
    <View
      style={styles.container}
      testID="dashboard-card-error-banner"
      accessibilityRole="alert"
      accessibilityLabel={`Error: ${error}`}
    >
      <Ionicons name="alert-circle" size={18} color={Colors.danger ?? '#DC2626'} />
      <Text style={styles.text} numberOfLines={2}>
        {error}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#991B1B',
    fontWeight: '600',
  },
});

export default ErrorBannerCard;
