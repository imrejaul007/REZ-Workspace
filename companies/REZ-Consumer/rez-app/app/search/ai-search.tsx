// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// AI Search Page
// Natural language product search - connected to real API

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useGetCurrencySymbol } from '@/stores/selectors';
import apiClient from '@/services/apiClient';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

// REZ Design System
const REZ_THEME = {
  nileBlue: colors.nileBlue,
  nileBlueLight: '#243f55',
  lightMustard: Colors.gold,
  mustardDark: '#e5b84d',
  linen: colors.linen,
  lavenderMist: colors.lavenderMist,
};

interface AIResult {
  id: string;
  type: 'product' | 'store' | 'offer';
  title: string;
  subtitle: string;
  price?: number;
  image: string;
  relevance: number;
  storeId?: string;
}

const getExamplePrompts = (currencySymbol: string) => [
  `Find me a gift for my mom under ${currencySymbol}2000`,
  'Best coffee shops near me with wifi',
  'Comfortable running shoes for beginners',
  'Romantic dinner date options',
  'Healthy meal delivery options',
];

function AISearchPage() {
  const router = useRouter();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AIResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<{ keywords?: string; filters?: unknown }>({});
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    if (searchQuery) setQuery(searchQuery);
    setSearching(true);
    setHasSearched(true);
    setError(null);
    try {
      const response = await apiClient.get('/search/ai-search', { q });
      if (response.success && response.data) {
        const data = response.data as unknown;
        setResults(data.results || []);
        setParsedInfo({ keywords: data.parsedKeywords, filters: data.filters });
      } else {
        if (!isMounted()) return;
        setResults([]);
      }
    } catch (err) {
      if (!isMounted()) return;
      setError('Search failed. Please check your connection and try again.');
      if (!isMounted()) return;
      setResults([]);
    } finally {
      if (!isMounted()) return;
      setSearching(false);
    }
  };

  const handlePromptSelect = (prompt: string) => {
    handleSearch(prompt);
  };

  const handleResultPress = useCallback(
    (item: AIResult) => {
      if (item.type === 'store' && item.storeId) {
        router.push(`/MainStorePage?storeId=${item.storeId}`);
      } else if (item.type === 'product' && item.id) {
        router.push({
          pathname: '/product-page' as unknown,
          params: { cardId: item.id, cardType: 'product' },
        });
      }
    },
    [router],
  );
  const isMounted = useIsMounted();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'product':
        return REZ_THEME.nileBlue;
      case 'store':
        return Colors.info;
      case 'offer':
        return Colors.success;
      default:
        return colors.text.tertiary;
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return `${currencySymbol}${price.toLocaleString()}`;
  };

  const renderResult = useCallback(
    ({ item }: { item: AIResult }) => (
      <Pressable style={styles.resultCard} onPress={() => handleResultPress(item)}>
        <View style={styles.relevanceBadge}>
          <ThemedText style={styles.relevanceText}>{item.relevance}% match</ThemedText>
        </View>

        <View style={styles.resultImage}>
          {item.image ? (
            <CachedImage source={item.image} style={styles.resultImg} contentFit="cover" />
          ) : (
            <View style={styles.resultImgPlaceholder}>
              <Ionicons
                name={item.type === 'store' ? 'storefront' : item.type === 'offer' ? 'pricetag' : 'cube'}
                size={24}
                color={REZ_THEME.nileBlue}
              />
            </View>
          )}
        </View>

        <View style={styles.resultInfo}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
            <ThemedText style={[styles.typeText, { color: getTypeColor(item.type) }]}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </ThemedText>
          </View>
          <ThemedText style={styles.resultTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.resultSubtitle}>{item.subtitle}</ThemedText>
          {item.price !== undefined && item.price > 0 && (
            <ThemedText style={styles.resultPrice}>{formatPrice(item.price)}</ThemedText>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      </Pressable>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currencySymbol, handleResultPress],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={REZ_THEME.nileBlue} />

      <LinearGradient colors={[REZ_THEME.nileBlue, REZ_THEME.nileBlueLight]} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>AI Search</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="sparkles" size={20} color={REZ_THEME.lightMustard} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Describe what you're looking for..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              returnKeyType="search"
              blurOnSubmit={true}
              onSubmitEditing={() => handleSearch()}
            />
          </View>
          <Pressable
            style={[styles.searchButton, !query.trim() && styles.searchButtonDisabled]}
            onPress={() => handleSearch()}
            disabled={!query.trim() || searching}
          >
            {searching ? (
              <ActivityIndicator color={colors.text.inverse} size="small" />
            ) : (
              <Ionicons name="search" size={20} color={REZ_THEME.nileBlue} />
            )}
          </Pressable>
        </View>
      </LinearGradient>

      {!hasSearched ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.aiInfoCard}>
            <View style={styles.aiIconContainer}>
              <Ionicons name="sparkles" size={32} color={REZ_THEME.lightMustard} />
            </View>
            <ThemedText style={styles.aiTitle}>AI-Powered Search</ThemedText>
            <ThemedText style={styles.aiText}>
              Describe what you need in your own words, and our AI will find the perfect matches for you.
            </ThemedText>
          </View>

          <ThemedText style={styles.sectionTitle}>Try asking...</ThemedText>
          <View style={styles.promptsContainer}>
            {getExamplePrompts(currencySymbol).map((prompt, index) => (
              <Pressable key={index} style={styles.promptCard} onPress={() => handlePromptSelect(prompt)}>
                <Ionicons name="chatbubble-outline" size={16} color={REZ_THEME.nileBlue} />
                <ThemedText style={styles.promptText}>{prompt}</ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.featuresSection}>
            <ThemedText style={styles.featuresTitle}>What AI Search can do</ThemedText>
            <View style={styles.featureItem}>
              <Ionicons name="bulb-outline" size={20} color={REZ_THEME.lightMustard} />
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureLabel}>Understand Context</ThemedText>
                <ThemedText style={styles.featureText}>
                  "Gift for techie husband" → Tech gadgets, accessories
                </ThemedText>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="pricetag-outline" size={20} color={Colors.success} />
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureLabel}>Budget Aware</ThemedText>
                <ThemedText style={styles.featureText}>
                  "Under {currencySymbol}5000" → Filters by your budget
                </ThemedText>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="location-outline" size={20} color={Colors.info} />
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureLabel}>Location Smart</ThemedText>
                <ThemedText style={styles.featureText}>"Near me" → Uses your location</ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={REZ_THEME.nileBlue} />
          <ThemedText style={styles.loadingTitle}>Something went wrong</ThemedText>
          <ThemedText style={styles.loadingText}>{error}</ThemedText>
          <Pressable style={styles.retryButton} onPress={() => handleSearch()}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : searching ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingAnimation}>
            <Ionicons name="sparkles" size={48} color={REZ_THEME.lightMustard} />
          </View>
          <ThemedText style={styles.loadingTitle}>Finding perfect matches...</ThemedText>
          <ThemedText style={styles.loadingText}>
            Analyzing your request and searching across products, stores, and offers
          </ThemedText>
        </View>
      ) : (
        <FlashList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={100}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <ThemedText style={styles.resultsTitle}>
                {results.length} results for "{query}"
              </ThemedText>
              {parsedInfo.keywords && parsedInfo.keywords !== query && (
                <ThemedText style={styles.parsedText}>Searched: "{parsedInfo.keywords}"</ThemedText>
              )}
              <ThemedText style={styles.resultsSubtitle}>Sorted by relevance</ThemedText>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
              <ThemedText style={styles.emptyTitle}>No results found</ThemedText>
              <ThemedText style={styles.emptyText}>Try rephrasing your search or being more specific</ThemedText>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: REZ_THEME.linen,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 40,
    paddingBottom: Spacing.base,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    ...Typography.h3,
    fontWeight: '700',
    color: colors.text.inverse,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: colors.text.inverse,
    maxHeight: 80,
  },
  searchButton: {
    backgroundColor: REZ_THEME.lightMustard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 120,
  },
  aiInfoCard: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.subtle,
  },
  aiIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 205, 87, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  aiTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: REZ_THEME.nileBlue,
    marginBottom: Spacing.sm,
  },
  aiText: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: Spacing.md,
  },
  promptsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.subtle,
  },
  promptText: {
    ...Typography.body,
    color: REZ_THEME.nileBlue,
    flex: 1,
  },
  featuresSection: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.subtle,
  },
  featuresTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: REZ_THEME.nileBlue,
    marginBottom: Spacing.base,
  },
  featureItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  featureContent: {
    flex: 1,
  },
  featureLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: REZ_THEME.nileBlue,
    marginBottom: 2,
  },
  featureText: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingAnimation: {
    marginBottom: Spacing.base,
  },
  loadingTitle: {
    ...Typography.h4,
    fontWeight: '600',
    color: REZ_THEME.nileBlue,
    marginBottom: Spacing.sm,
  },
  loadingText: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  resultsHeader: {
    marginBottom: Spacing.base,
  },
  resultsTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: REZ_THEME.nileBlue,
  },
  parsedText: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  resultsSubtitle: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    position: 'relative',
    ...Shadows.subtle,
  },
  relevanceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 205, 87, 0.2)',
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  relevanceText: {
    ...Typography.overline,
    color: REZ_THEME.mustardDark,
    fontWeight: '700',
  },
  resultImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  resultImg: {
    width: 56,
    height: 56,
  },
  resultImgPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: REZ_THEME.lavenderMist,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginBottom: Spacing.xs,
  },
  typeText: {
    ...Typography.overline,
    fontWeight: '600',
  },
  resultTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: REZ_THEME.nileBlue,
  },
  resultSubtitle: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
  },
  resultPrice: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.success,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  emptyTitle: {
    ...Typography.h4,
    fontWeight: '600',
    color: REZ_THEME.nileBlue,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: REZ_THEME.nileBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  retryText: {
    ...Typography.body,
    color: colors.text.inverse,
    fontWeight: '600',
  },
});

export default withErrorBoundary(AISearchPage, 'SearchAiSearch');
