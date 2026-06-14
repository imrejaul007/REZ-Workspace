// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMarketingInbox } from '@/hooks/useMarketingInbox';
import { MarketingMessage } from '@/services/marketingInboxApi';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

function MarketingInboxScreen() {
  const router = useRouter();
  const { messages, loading, refresh, dismiss } = useMarketingInbox();

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs < 1) {
      const mins = Math.floor(diffMs / 60000);
      return `${mins}m ago`;
    }
    if (diffHrs < 24) return `${Math.floor(diffHrs)}h ago`;
    if (diffHrs < 48) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item }: { item: MarketingMessage }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Ionicons name="megaphone" size={20} color={Colors.info} />
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardTime}>{formatTime(item.sentAt)}</Text>
        </View>
        <Pressable
          onPress={() => dismiss(item.id)}
          style={styles.dismissBtn}
          accessibilityLabel="Dismiss message"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color={colors.text.tertiary} />
        </Pressable>
      </View>
      <Text style={styles.cardBody}>{item.message}</Text>
      {item.ctaUrl ? (
        <View style={styles.ctaRow}>
          <Ionicons name="link-outline" size={14} color={Colors.info} />
          <Text style={styles.ctaText} numberOfLines={1}>
            {item.ctaUrl}
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Marketing Messages
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && messages.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.info} />
        </View>
      ) : (
        <FlashList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, messages.length === 0 && styles.emptyContent]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.info} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="mail-open-outline" size={56} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>Promotional offers and merchant broadcasts will appear here.</Text>
            </View>
          }
          estimatedItemSize={100}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: 120,
  },
  emptyContent: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  cardMeta: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardTime: {
    ...Typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  dismissBtn: {
    padding: 4,
    marginLeft: Spacing.sm,
  },
  cardBody: {
    ...Typography.body,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 4,
  },
  ctaText: {
    ...Typography.caption,
    color: Colors.info,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 80,
  },
  emptyTitle: {
    ...Typography.h4,
    color: colors.text.secondary,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default withErrorBoundary(MarketingInboxScreen, 'MarketingInbox');
