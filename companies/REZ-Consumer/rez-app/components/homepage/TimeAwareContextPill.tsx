/**
 * TimeAwareContextPill — Contextual banner that surfaces time-of-day
 * and persona-aware deal messaging with a pulsing activity dot.
 *
 * Personas: 'general' | 'student' | 'employee'
 * Times:    morning (5–11) | lunch (12–14) | evening (17–21) | night (rest)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';

// CRED Light palette
const MUSTARD    = '#FFC857';
const NILE_BLUE  = '#1a3a52';
const CARD_BG    = '#FFFFFF';
const CARD_BORDER = 'rgba(0,0,0,0.06)';
const BODY_TEXT  = '#6B7280';

// ─── Types ────────────────────────────────────────────────────────────────────
export type TimeAwarePersona = 'general' | 'student' | 'employee';

type TimeSlot = 'morning' | 'lunch' | 'evening' | 'night';

interface TimeAwareContextPillProps {
  persona?: TimeAwarePersona;
  onPress?: () => void;
  /** Override current hour (0–23) — useful for testing */
  overrideHour?: number;
  /** Live nearby offer count from API — replaces hardcoded number when provided */
  nearbyOfferCount?: number;
}

// ─── Copy map ────────────────────────────────────────────────────────────────
// NOTE: The general-lunch entry uses a placeholder token {{count}} that is
// replaced at render time with the live nearbyOfferCount prop value.
const COPY: Record<TimeAwarePersona, Record<TimeSlot, string>> = {
  general: {
    morning: 'Cashback deals live near you — earn on every visit',
    lunch:   '{{count}} cashback deals within 1 km — lunch time',
    evening: 'Evening cashback deals — dining, grooming & more',
    night:   'Cashback offers open now near you',
  },
  student: {
    morning: 'Morning cashback deals near campus — chai & essentials',
    lunch:   'Top cashback lunch deals near campus — from ₹79',
    evening: 'Cashback on hangouts — cafés, gaming & chill spots',
    night:   'Late-night cashback on campus food',
  },
  employee: {
    morning: 'Cashback on breakfast near office — grab & go',
    lunch:   'Cashback lunch near office — express slots filling',
    evening: 'After-work cashback — grooming, gym & dining',
    night:   'Weekend cashback deals — dining & home services',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTimeSlot(hour: number): TimeSlot {
  if (hour >= 5  && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 14) return 'lunch';
  if (hour >= 17 && hour <= 21) return 'evening';
  return 'night';
}

// ─── Pulsing dot ─────────────────────────────────────────────────────────────
const PulsingDot: React.FC = () => {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.5, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,   duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1,   duration: 800, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return (
    <View style={pulse.wrapper}>
      <Animated.View style={[pulse.ring, { transform: [{ scale }], opacity }]} />
      <View style={pulse.core} />
    </View>
  );
};

const pulse = StyleSheet.create({
  wrapper: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  ring: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,200,87,0.30)',
  },
  core: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MUSTARD,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────
const TimeAwareContextPill: React.FC<TimeAwareContextPillProps> = ({
  persona      = 'general',
  onPress,
  overrideHour,
  nearbyOfferCount,
}) => {
  const hour     = overrideHour ?? new Date().getHours();
  const timeSlot = getTimeSlot(hour);
  const rawText  = COPY[persona]?.[timeSlot] ?? COPY.general[timeSlot];
  // Replace placeholder with live count when available, otherwise strip token
  const text = rawText.replace(
    '{{count}}',
    nearbyOfferCount != null ? String(nearbyOfferCount) : '—'
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.pill, pressed && { opacity: 0.82 }]}
      onPress={onPress}
    >
      <PulsingDot />
      <Text style={styles.text} numberOfLines={1}>{text}</Text>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: NILE_BLUE,
    lineHeight: 16,
  },
  arrow: {
    fontSize: 14,
    fontWeight: '600',
    color: NILE_BLUE,
    marginLeft: 6,
    opacity: 0.7,
  },
});

export default React.memo(TimeAwareContextPill);
