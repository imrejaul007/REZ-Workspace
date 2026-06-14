import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, ChevronRight, TrendingUp, Sparkles, Clock, Heart, Map as MapIcon, List } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { useChatStore, useUserStore } from '@/stores';
import { rezApi, Entity } from '@/services/rezApi';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { ExploreMapScreen } from '@/screens/ExploreMapScreen';

const CATEGORIES = [
  { id: 'restaurants', name: 'Restaurants', emoji: '🍽️' },
  { id: 'cafes', name: 'Cafes', emoji: '☕' },
  { id: 'trials', name: 'Trials', emoji: '✨' },
  { id: 'spa', name: 'Spa & Wellness', emoji: '💆' },
  { id: 'events', name: 'Events', emoji: '🎭' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
];

const MOODS = [
  { id: 'bored', label: "I'm bored", emoji: '🤔' },
  { id: 'celebrate', label: 'Celebrate', emoji: '🎉' },
  { id: 'relax', label: 'Relax', emoji: '🧘' },
  { id: 'adventure', label: 'Adventure', emoji: '🌟' },
  { id: 'date', label: 'Date Night', emoji: '💕' },
];

// For You section based on user preferences
const getForYouSection = (stylePrefs?: { vibes?: string[]; occasions?: string[]; cuisines?: string[] }) => {
  if (!stylePrefs) return null;

  const sections: { id: string; title: string; emoji: string; query: string }[] = [];

  if (stylePrefs.cuisines?.length) {
    sections.push({
      id: 'cuisine',
      title: `Based on your love for ${stylePrefs.cuisines[0]}`,
      emoji: '🍽️',
      query: stylePrefs.cuisines[0],
    });
  }

  if (stylePrefs.occasions?.includes('date')) {
    sections.push({
      id: 'date',
      title: 'Romantic spots for date night',
      emoji: '💕',
      query: 'romantic dinner',
    });
  }

  if (stylePrefs.occasions?.includes('relax')) {
    sections.push({
      id: 'relax',
      title: 'Perfect for unwinding',
      emoji: '🧘',
      query: 'spa wellness',
    });
  }

  if (stylePrefs.vibes?.includes('trendy')) {
    sections.push({
      id: 'trendy',
      title: 'Trendy spots for you',
      emoji: '✨',
      query: 'trending',
    });
  }

  return sections.slice(0, 2); // Max 2 sections
};

export const ExploreScreen: React.FC = () => {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const { location } = useChatStore();
  const { profile } = useUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [trending, setTrending] = useState<Entity[]>([]);
  const [nearby, setNearby] = useState<Entity[]>([]);
  const [forYouResults, setForYouResults] = useState<{ [key: string]: Entity[] }>({});
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodResults, setMoodResults] = useState<Entity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  // Handle map view close
  const handleMapClose = useCallback(() => {
    setShowMap(false);
  }, []);

  // Handle venue selection from map
  const handleMapVenueSelect = useCallback((venueId: string) => {
    setShowMap(false);
    // Could navigate to venue details or show booking modal
    console.log('Selected venue from map:', venueId);
  }, []);

  const forYouSections = getForYouSection(profile?.stylePreferences);

  useEffect(() => {
    loadData();
  }, [location]);

  const loadData = async () => {
    try {
      const lat = location?.lat || 0;
      const lng = location?.lng || 0;

      const [trendingRes, nearbyRes] = await Promise.all([
        rezApi.getTrending(lat, lng),
        rezApi.getNearby({ lat, lng, limit: 20 }),
      ]);

      setTrending(trendingRes.slice(0, 10));
      setNearby(nearbyRes);

      // Load For You results based on preferences
      if (forYouSections) {
        const forYouPromises = forYouSections.map(async (section) => {
          try {
            const res = await rezApi.getMoodDiscovery(section.query, lat, lng);
            return { [section.id]: res.items || [] };
          } catch {
            return { [section.id]: [] };
          }
        });

        const results = await Promise.all(forYouPromises);
        const forYouMap = Object.assign({}, ...results);
        setForYouResults(forYouMap);
      }
    } catch (error) {
      logger.error('Explore load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMoodSelect = async (moodId: string) => {
    setSelectedMood(moodId);
    try {
      const res = await rezApi.getMoodDiscovery(moodId, location?.lat, location?.lng);
      setMoodResults(res.items);
    } catch (error) {
      logger.error('Mood search error:', error);
    }
  };

  const renderEntityCard = (entity: Entity, index: number) => (
    <TouchableOpacity
      key={entity.id}
      style={[
        styles.entityCard,
        { backgroundColor: colors.backgroundElevated },
      ]}
      activeOpacity={0.7}
    >
      {entity.image ? (
        <Image source={{ uri: entity.image }} style={styles.entityImage} />
      ) : (
        <View style={[styles.entityImagePlaceholder, { backgroundColor: colors.fill }]}>
          <Text style={styles.placeholderEmoji}>
            {entity.type === 'venue' ? '🍽️' : entity.type === 'trial' ? '✨' : '🎫'}
          </Text>
        </View>
      )}

      <View style={[styles.entityContent, { padding: spacing.sm }]}>
        <Text
          style={[styles.entityName, { color: colors.label, ...typography.titleSmall }]}
          numberOfLines={1}
        >
          {entity.name}
        </Text>
        <Text
          style={[styles.entitySubtitle, { color: colors.labelSecondary, ...typography.captionMedium }]}
          numberOfLines={1}
        >
          {entity.distance} • {entity.rating}★
        </Text>

        {entity.karmaDiscount && (
          <View style={[styles.discountBadge, { backgroundColor: colors.gold + '20' }]}>
            <Text style={[styles.discountText, { color: colors.gold }]}>
              {entity.karmaDiscount}% off
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundGrouped }]} edges={['top']}>
      {/* Map Modal */}
      <Modal
        visible={showMap}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ExploreMapScreen
          onClose={handleMapClose}
          onVenueSelect={handleMapVenueSelect}
        />
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { padding: spacing.screenPadding }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.label, ...typography.displaySmall }]}>
                Explore
              </Text>
              {location && (
                <View style={styles.locationRow}>
                  <MapPin size={14} color={colors.labelSecondary} />
                  <Text style={[styles.locationText, { color: colors.labelSecondary, ...typography.captionMedium }]}>
                    Nearby places
                  </Text>
                </View>
              )}
            </View>

            {/* Map Toggle Button */}
            <TouchableOpacity
              style={[styles.mapButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowMap(true)}
            >
              <MapIcon size={20} color={colors.primaryContrast} />
              <Text style={[styles.mapButtonText, { color: colors.primaryContrast }]}>
                Map View
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: spacing.screenPadding, marginBottom: spacing.md }}>
          <Input
            placeholder="Search restaurants, trials..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={20} color={colors.labelTertiary} />}
          />
        </View>

        {/* For You - Personalized Section */}
        {forYouSections && forYouSections.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Heart size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.label, ...typography.titleMedium, marginLeft: 8 }]}>
                  For You
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.forYouContainer}
            >
              {forYouSections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={[styles.forYouCard, { backgroundColor: colors.primaryLight + '20' }]}
                  onPress={() => handleMoodSelect(section.query)}
                >
                  <Text style={styles.forYouEmoji}>{section.emoji}</Text>
                  <Text style={[styles.forYouTitle, { color: colors.label }]} numberOfLines={2}>
                    {section.title}
                  </Text>
                  <Text style={[styles.forYouSubtitle, { color: colors.labelSecondary }]}>
                    {forYouResults[section.id]?.length || 0} places
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Moods */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.label, ...typography.titleMedium }]}>
            How are you feeling?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodsContainer}
          >
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodChip,
                  {
                    backgroundColor: selectedMood === mood.id ? colors.primary : colors.fill,
                    borderRadius: borderRadius.lg,
                  },
                ]}
                onPress={() => handleMoodSelect(mood.id)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    {
                      color: selectedMood === mood.id ? colors.white : colors.label,
                      ...typography.buttonSmall,
                    },
                  ]}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Mood Results */}
        {selectedMood && moodResults.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.label, ...typography.titleMedium }]}>
                {MOODS.find((m) => m.id === selectedMood)?.label} options
              </Text>
              <TouchableOpacity onPress={() => setSelectedMood(null)}>
                <Text style={[styles.seeAll, { color: colors.primary, ...typography.buttonSmall }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={moodResults}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              keyExtractor={(item) => `mood-${item.id}`}
              renderItem={({ item, index }) => renderEntityCard(item, index)}
            />
          </View>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.label, ...typography.titleMedium }]}>
            Categories
          </Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: colors.backgroundElevated }]}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text
                  style={[
                    styles.categoryName,
                    { color: colors.label, ...typography.captionMedium },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <TrendingUp size={18} color={colors.systemOrange} />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.label, ...typography.titleMedium, marginLeft: 6 },
                ]}
              >
                Trending Now
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary, ...typography.buttonSmall }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={trending}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            keyExtractor={(item) => `trending-${item.id}`}
            renderItem={({ item, index }) => renderEntityCard(item, index)}
          />
        </View>

        {/* Nearby */}
        <View style={[styles.section, { paddingBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MapPin size={18} color={colors.primary} />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.label, ...typography.titleMedium, marginLeft: 6 },
                ]}
              >
                Nearby
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary, ...typography.buttonSmall }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={nearby}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            keyExtractor={(item) => `nearby-${item.id}`}
            renderItem={({ item, index }) => renderEntityCard(item, index)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {},
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  mapButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forYouContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  forYouCard: {
    width: 160,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
  },
  forYouEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  forYouTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  forYouSubtitle: {
    fontSize: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAll: {},
  moodsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    gap: 6,
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodLabel: {},
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    textAlign: 'center',
  },
  entityCard: {
    width: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  entityImage: {
    width: '100%',
    height: 100,
  },
  entityImagePlaceholder: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  entityContent: {
    paddingTop: 8,
  },
  entityName: {},
  entitySubtitle: {
    marginTop: 2,
  },
  discountBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  discountText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
