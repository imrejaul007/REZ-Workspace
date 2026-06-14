/**
 * PersonaDetectionOnboarding
 *
 * One-time card shown on first home screen visit when statedIdentity is null.
 * User picks Student / Employee / General → persisted to Zustand + AsyncStorage.
 *
 * Design: white card, light gray background tiles, mustard selection highlight.
 * Dismisses permanently after one selection.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserIdentityStore, StatedIdentity } from '@/stores/userIdentityStore';

const NAVY    = '#1a3a52';
const MUSTARD = '#FFC857';
const BORDER  = '#E2E8F0';
const LIGHT   = '#F8F9FA';
const BODY    = '#475569';
const MUTED   = '#94A3B8';

// ─── Persona options ──────────────────────────────────────────────────────────
const PERSONAS: {
  id: StatedIdentity;
  emoji: string;
  label: string;
  subtext: string;
  icon: string;
}[] = [
  {
    id: 'student',
    emoji: '🎓',
    label: 'Student',
    subtext: 'Cashback on campus food, chai & hangouts',
    icon: 'school-outline',
  },
  {
    id: 'corporate',
    emoji: '💼',
    label: 'Employee',
    subtext: 'Cashback on every office meal & grooming',
    icon: 'briefcase-outline',
  },
  {
    id: 'general',
    emoji: '🏠',
    label: 'General',
    subtext: 'Cashback on every nearby deal',
    icon: 'home-outline',
  },
];

// ─── Main component ───────────────────────────────────────────────────────────
const PersonaDetectionOnboarding: React.FC = () => {
  const { statedIdentity, _hydrated, setIdentity } = useUserIdentityStore();

  // Fade-out animation on selection
  const opacity = useRef(new Animated.Value(1)).current;

  // Don't render if already set or store not hydrated yet (prevents flash)
  if (!_hydrated || statedIdentity !== null) return null;

  const handleSelect = (persona: StatedIdentity) => {
    // Animate out first, then persist
    Animated.timing(opacity, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setIdentity({ statedIdentity: persona });
    });
  };

  return (
    <Animated.View style={[styles.wrapper, { opacity }]}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>Personalise your cashback</Text>
            <Text style={styles.subtitle}>
              We'll show you cashback deals most relevant to your lifestyle
            </Text>
          </View>
          <View style={styles.sparkBadge}>
            <Text style={styles.sparkText}>NEW</Text>
          </View>
        </View>

        {/* Persona tiles */}
        <View style={styles.tilesRow}>
          {PERSONAS.map((p) => (
            <Pressable
              key={p.id}
              style={({ pressed }) => [
                styles.tile,
                pressed && styles.tilePressed,
              ]}
              onPress={() => handleSelect(p.id)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${p.label} persona`}
            >
              <View style={styles.tileIconBox}>
                <Text style={styles.tileEmoji}>{p.emoji}</Text>
              </View>
              <Text style={styles.tileLabel}>{p.label}</Text>
              <Text style={styles.tileSubtext} numberOfLines={2}>
                {p.subtext}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Skip link */}
        <Pressable
          style={styles.skipRow}
          onPress={() => handleSelect('general')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Skip personalisation"
        >
          <Text style={styles.skipText}>Skip for now</Text>
          <Ionicons name="chevron-forward" size={12} color={MUTED} />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTextBlock: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: BODY,
    lineHeight: 17,
  },
  sparkBadge: {
    backgroundColor: MUSTARD,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sparkText: {
    fontSize: 10,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: 0.5,
  },

  // ── Persona tiles ──
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    alignItems: 'center',
  },
  tilePressed: {
    backgroundColor: '#FFFBEB',
    borderColor: MUSTARD,
  },
  tileIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileEmoji: {
    fontSize: 18,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 2,
    textAlign: 'center',
  },
  tileSubtext: {
    fontSize: 10,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 14,
  },

  // ── Skip ──
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  skipText: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '500',
  },
});

export default React.memo(PersonaDetectionOnboarding);
