import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

const REZ_INTERESTS_KEY = 'rez_interests';

interface Interest {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const INTERESTS: Interest[] = [
  { id: 'food', label: 'Food & Dining', icon: 'restaurant-outline' },
  { id: 'fashion', label: 'Fashion', icon: 'shirt-outline' },
  { id: 'electronics', label: 'Electronics', icon: 'phone-portrait-outline' },
  { id: 'beauty', label: 'Beauty', icon: 'sparkles-outline' },
  { id: 'groceries', label: 'Groceries', icon: 'basket-outline' },
  { id: 'sports', label: 'Sports', icon: 'fitness-outline' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film-outline' },
  { id: 'home', label: 'Home & Living', icon: 'home-outline' },
];

function InterestsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 14, stiffness: 80, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleInterest = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      await AsyncStorage.setItem(REZ_INTERESTS_KEY, JSON.stringify(Array.from(selected)));
    } catch {
      // silently handle
    } finally {
      setSaving(false);
    }
    router.push('/onboarding/location');
  };

  const canContinue = selected.size > 0 && !saving;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#F5F3FF', '#EDE9FE', '#fff']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.nileBlue} />
        </Pressable>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.heading}>What do you shop for?</Text>
          <Text style={styles.sub}>Select at least one to personalise your experience</Text>

          {/* Interest grid */}
          <View style={styles.grid}>
            {INTERESTS.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <Pressable
                  key={item.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleInterest(item.id)}
                  accessibilityLabel={`${item.label}${isSelected ? ', selected' : ''}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  <View style={[styles.chipIconWrap, isSelected && styles.chipIconWrapSelected]}>
                    <Ionicons name={item.icon} size={22} color={isSelected ? '#fff' : colors.nileBlue} />
                  </View>
                  <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{item.label}</Text>
                  {isSelected && (
                    <View style={styles.checkMark}>
                      <Ionicons name="checkmark" size={12} color="#7C3AED" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Continue button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          accessibilityLabel="Continue to location step"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={canContinue ? ['#7C3AED', '#5B21B6'] : ['#D1D5DB', '#9CA3AF']}
            style={styles.continueBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueBtnText}>
              {selected.size > 0 ? `Continue (${selected.size} selected)` : 'Select at least 1'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 8,
  },
  backBtn: { padding: 4 },
  stepRow: { flexDirection: 'row', gap: 6 },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  stepDotActive: { backgroundColor: '#7C3AED', width: 24 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  heading: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.nileBlue,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  sub: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    width: '46%',
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  chipSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  chipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  chipIconWrapSelected: { backgroundColor: '#7C3AED' },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.nileBlue,
    textAlign: 'center',
  },
  chipLabelSelected: { color: '#5B21B6' },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: { paddingHorizontal: 20, paddingBottom: 12 },
  continueBtn: { borderRadius: 16, overflow: 'hidden' },
  continueBtnDisabled: { opacity: 0.7 },
  continueBtnGradient: { paddingVertical: 17, alignItems: 'center' },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
});

export default withErrorBoundary(InterestsScreen, 'OnboardingInterests');
