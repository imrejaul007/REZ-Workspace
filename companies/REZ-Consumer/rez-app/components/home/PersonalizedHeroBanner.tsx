// @ts-nocheck
/**
 * PersonalizedHeroBanner
 *
 * Renders a full-width personalized hero block just below the StoriesRow.
 * Content, colours and quick-links all change based on the user's segment:
 *
 *   student   → orange/amber, campus tone, budget + TRY + earn tiles
 *   corporate → navy/slate, professional tone, lunch + wellness + privé tiles
 *   general   → brand purple, warm tone, balanced tiles
 *
 * The component is designed to be <100ms perceived render time:
 *   • No data fetching — all config lives in useHomePersona()
 *   • FadeIn animation via react-native-reanimated
 *   • Tiles render inline (no FlatList overhead for 4 items)
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHomePersona, QuickLink, PersonaId } from '@/hooks/useHomePersona';
import { useUserIdentityStore, type UserIdentityState } from '@/stores/userIdentityStore';
import { spacing, borderRadius } from '@/constants/theme';

const { width: SW } = Dimensions.get('window');
const TILE_W = (SW - spacing.lg * 2 - spacing.md * 3) / 4;  // 4 tiles in one row

// ─── Quick-link tile ──────────────────────────────────────────────────────────
const QuickLinkTile = memo(function QuickLinkTile({
  item,
  accentColor,
}: {
  item: QuickLink;
  accentColor: string;
}) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = useCallback(() => {
    router.push(item.route as unknown);
  }, [router, item.route]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handlePressIn  = useCallback(() => { scale.value = withSpring(0.94, { damping: 12 }); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handlePressOut = useCallback(() => { scale.value = withSpring(1,    { damping: 12 }); }, []);

  return (
    <Animated.View style={[styles.tileWrap, animStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.tile, { backgroundColor: item.color }]}
        accessibilityRole="button"
        accessibilityLabel={item.label}
      >
        <Text style={styles.tileEmoji}>{item.emoji}</Text>
        <Text style={[styles.tileLabel, { color: accentColor }]} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={styles.tileSublabel} numberOfLines={1}>
          {item.sublabel}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

// ─── Highlight strip ──────────────────────────────────────────────────────────
const HighlightStrip = memo(function HighlightStrip({
  icon,
  text,
  accentColor,
  bgColor,
}: {
  icon: string;
  text: string;
  accentColor: string;
  bgColor: string;
}) {
  return (
    <View style={[styles.strip, { backgroundColor: bgColor }]}>
      <Ionicons name={icon as unknown} size={14} color={accentColor} />
      <Text style={[styles.stripText, { color: accentColor }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
});

// ─── Persona-specific sub-components ─────────────────────────────────────────

/** Student hero — warm orange card with campus decorations */
const StudentHero = memo(function StudentHero({
  greeting,
  tagline,
  sectionTitle,
  quickLinks,
  accentColor,
  highlightText,
  highlightIcon,
  gradientColors,
}: ReturnType<typeof useHomePersona>) {
  const router = useRouter();
  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.root}>
      {/* Hero card */}
      <Pressable
        onPress={() => router.push('/try' as unknown)}
        style={styles.heroCard}
        android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: false }}
        accessibilityRole="button"
        accessibilityLabel="Explore student experiences"
      >
        <LinearGradient
          colors={gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          {/* Decoration blob top-right */}
          <View style={styles.blobTR} />
          <View style={styles.blobBL} />

          <View style={styles.heroContent}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroGreeting} numberOfLines={1}>{greeting}</Text>
              <Text style={styles.heroTagline} numberOfLines={2}>{tagline}</Text>
              <View style={styles.heroCtaRow}>
                <View style={styles.heroCta}>
                  <Text style={styles.heroCtaText}>Explore TRY →</Text>
                </View>
              </View>
            </View>
            <Text style={styles.heroDecorEmoji}>📚</Text>
          </View>

          {/* Highlight strip inside card */}
          <View style={styles.heroStrip}>
            <Ionicons name="school" size={12} color="#fff" />
            <Text style={styles.heroStripText} numberOfLines={1}>{highlightText}</Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* Section title + tiles */}
      <Text style={[styles.sectionTitle, { color: accentColor }]}>{sectionTitle}</Text>
      <View style={styles.tilesRow}>
        {quickLinks.map(link => (
          <QuickLinkTile key={link.id} item={link} accentColor={accentColor} />
        ))}
      </View>
    </Animated.View>
  );
});

/** Corporate hero — dark navy card with professional tone */
const CorporateHero = memo(function CorporateHero({
  greeting,
  tagline,
  sectionTitle,
  quickLinks,
  accentColor,
  highlightText,
  highlightIcon,
  gradientColors,
}: ReturnType<typeof useHomePersona>) {
  const router = useRouter();
  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.root}>
      {/* Hero card */}
      <Pressable
        onPress={() => router.push('/prive' as unknown)}
        style={styles.heroCard}
        android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: false }}
        accessibilityRole="button"
        accessibilityLabel="Explore corporate perks"
      >
        <LinearGradient
          colors={gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          {/* Subtle grid pattern via overlapping views */}
          <View style={styles.corpPatternA} />
          <View style={styles.corpPatternB} />

          <View style={styles.heroContent}>
            <View style={styles.heroTextWrap}>
              <Text style={[styles.heroGreeting, styles.heroGreetingDark]} numberOfLines={1}>
                {greeting}
              </Text>
              <Text style={[styles.heroTagline, styles.heroTaglineDark]} numberOfLines={2}>
                {tagline}
              </Text>
              <View style={styles.heroCtaRow}>
                <View style={[styles.heroCta, styles.heroCtaDark]}>
                  <Text style={[styles.heroCtaText, { color: gradientColors[0] }]}>
                    View Privé →
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.heroDecorEmoji}>🏢</Text>
          </View>

          <View style={[styles.heroStrip, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            <Ionicons name="briefcase" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={[styles.heroStripText, { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>
              {highlightText}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* Section title + tiles */}
      <Text style={[styles.sectionTitle, { color: '#1a3a52' }]}>{sectionTitle}</Text>
      <View style={styles.tilesRow}>
        {quickLinks.map(link => (
          <QuickLinkTile key={link.id} item={link} accentColor={accentColor} />
        ))}
      </View>
    </Animated.View>
  );
});

/** General hero — brand purple, warm and balanced */
const GeneralHero = memo(function GeneralHero({
  greeting,
  tagline,
  sectionTitle,
  quickLinks,
  accentColor,
  highlightText,
  highlightIcon,
  gradientColors,
}: ReturnType<typeof useHomePersona>) {
  const router = useRouter();
  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.root}>
      {/* Hero card */}
      <Pressable
        onPress={() => router.push('/try' as unknown)}
        style={styles.heroCard}
        android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: false }}
        accessibilityRole="button"
        accessibilityLabel="Explore ReZ"
      >
        <LinearGradient
          colors={gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.blobTR} />
          <View style={styles.heroContent}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroGreeting} numberOfLines={1}>{greeting}</Text>
              <Text style={styles.heroTagline} numberOfLines={2}>{tagline}</Text>
              <View style={styles.heroCtaRow}>
                <View style={styles.heroCta}>
                  <Text style={styles.heroCtaText}>Discover Now →</Text>
                </View>
              </View>
            </View>
            <Text style={styles.heroDecorEmoji}>🌟</Text>
          </View>
          <View style={styles.heroStrip}>
            <Ionicons name="sparkles" size={12} color="#fff" />
            <Text style={styles.heroStripText} numberOfLines={1}>{highlightText}</Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* Section title + tiles */}
      <Text style={[styles.sectionTitle, { color: accentColor }]}>{sectionTitle}</Text>
      <View style={styles.tilesRow}>
        {quickLinks.map(link => (
          <QuickLinkTile key={link.id} item={link} accentColor={accentColor} />
        ))}
      </View>
    </Animated.View>
  );
});

// ─── Root export ──────────────────────────────────────────────────────────────

/**
 * Drop-in hero banner. Just place it in the ScrollView content area.
 * Handles its own persona detection — no props needed.
 * Returns null until the identity store has been rehydrated from AsyncStorage
 * so the correct persona is shown on first paint (no flash).
 */
export const PersonalizedHeroBanner = memo(function PersonalizedHeroBanner() {
  const isHydrated = useUserIdentityStore((s: UserIdentityState) => s._hydrated);
  const persona = useHomePersona();

  // Don't render anything until AsyncStorage rehydration is complete —
  // prevents the generic "General" banner flashing before the correct
  // student/corporate persona is resolved.
  if (!isHydrated) return null;

  if (persona.id === 'student')   return <StudentHero   {...persona} />;
  if (persona.id === 'corporate') return <CorporateHero {...persona} />;
  return <GeneralHero {...persona} />;
});

export default PersonalizedHeroBanner;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  // Hero card
  heroCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  heroGradient: {
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 0,
    minHeight: 130,
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  heroTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  heroGreeting: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  heroGreetingDark: {
    color: '#fff',
  },
  heroTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 17,
    marginBottom: 10,
  },
  heroTaglineDark: {
    color: 'rgba(255,255,255,0.75)',
  },
  heroCtaRow: {
    flexDirection: 'row',
  },
  heroCta: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroCtaDark: {
    backgroundColor: '#fff',
  },
  heroCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  heroDecorEmoji: {
    fontSize: 44,
    opacity: 0.85,
    marginRight: -4,
  },

  // Highlight strip at bottom of card
  heroStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginHorizontal: -18,
  },
  heroStripText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },

  // Decoration blobs
  blobTR: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blobBL: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Corporate pattern
  corpPatternA: {
    position: 'absolute',
    top: 20,
    right: 10,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  corpPatternB: {
    position: 'absolute',
    top: 40,
    right: 30,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  // Section title
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  // Quick-link tiles row
  tilesRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tileWrap: {
    flex: 1,
  },
  tile: {
    borderRadius: borderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 3,
    minHeight: 76,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  tileEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  tileSublabel: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 1,
  },

  // Highlight strip (standalone, outside card)
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    marginTop: 8,
  },
  stripText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
});
