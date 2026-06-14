// Onboarding Screen with Style Preferences
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useUserStore } from '@/stores';
import Animated, { FadeIn } from 'react-native-reanimated';

interface OnboardingSlide {
  id: number;
  icon: string;
  title: string;
  subtitle: string;
}

const INTRO_SLIDES: OnboardingSlide[] = [
  {
    id: 1,
    icon: '💬',
    title: 'Chat to Book',
    subtitle: 'Just tell me what you want. I\'ll find the best options for you.',
  },
  {
    id: 2,
    icon: '🎁',
    title: 'Earn Rewards',
    subtitle: 'Earn coins on every booking and redeem for discounts.',
  },
  {
    id: 3,
    icon: '⭐',
    title: 'Karma Tiers',
    subtitle: 'Silver, Gold, Platinum - the more you use, the more you save.',
  },
  {
    id: 4,
    icon: '🚀',
    title: 'One App, Everything',
    subtitle: 'Restaurants, hotels, spas, events - all in one place.',
  },
];

// Style preference options
const STYLE_VIBES = [
  { id: 'casual', label: 'Casual', emoji: '👕' },
  { id: 'formal', label: 'Formal', emoji: '👔' },
  { id: 'trendy', label: 'Trendy', emoji: '✨' },
  { id: 'minimal', label: 'Minimal', emoji: '💎' },
  { id: 'bold', label: 'Bold', emoji: '🔥' },
  { id: 'classic', label: 'Classic', emoji: '👌' },
];

const OCCASIONS = [
  { id: 'date', label: 'Date Night', emoji: '💕' },
  { id: 'office', label: 'Work/Office', emoji: '💼' },
  { id: 'party', label: 'Parties', emoji: '🎉' },
  { id: 'family', label: 'Family Time', emoji: '👨‍👩‍👧' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'relax', label: 'Relaxation', emoji: '🧘' },
];

const PREFERRED_CUISINES = [
  { id: 'indian', label: 'Indian', emoji: '🍛' },
  { id: 'chinese', label: 'Chinese', emoji: '🥡' },
  { id: 'italian', label: 'Italian', emoji: '🍕' },
  { id: 'japanese', label: 'Japanese', emoji: '🍣' },
  { id: 'continental', label: 'Continental', emoji: '🥩' },
  { id: 'cafe', label: 'Cafe/Bakery', emoji: '☕' },
  { id: 'fastfood', label: 'Fast Food', emoji: '🍔' },
  { id: 'healthy', label: 'Healthy', emoji: '🥗' },
];

interface StylePreferences {
  vibes: string[];
  occasions: string[];
  cuisines: string[];
}

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { profile, setProfile } = useUserStore();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<StylePreferences>({
    vibes: [],
    occasions: [],
    cuisines: [],
  });

  const handleNext = () => {
    if (currentSlide < INTRO_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else if (!showPreferences) {
      setShowPreferences(true);
    } else {
      // Save preferences and continue to auth
      if (profile) {
        setProfile({
          ...profile,
          stylePreferences: preferences,
        });
      }
      router.replace('/auth');
    }
  };

  const handleSkip = () => {
    router.replace('/auth');
  };

  const togglePreference = (
    category: keyof StylePreferences,
    id: string
  ) => {
    setPreferences((prev) => {
      const current = prev[category];
      const updated = current.includes(id)
        ? current.filter((i) => i !== id)
        : [...current, id];
      return { ...prev, [category]: updated };
    });
  };

  const renderIntroSlide = () => {
    const slide = INTRO_SLIDES[currentSlide];
    return (
      <Animated.View key={slide.id} entering={FadeIn} style={styles.content}>
        <Text style={styles.icon}>{slide.icon}</Text>
        <Text style={[styles.title, { color: colors.label }]}>{slide.title}</Text>
        <Text style={[styles.subtitle, { color: colors.labelSecondary }]}>
          {slide.subtitle}
        </Text>
      </Animated.View>
    );
  };

  const renderPreferenceSection = (
    title: string,
    options: { id: string; label: string; emoji: string }[],
    category: keyof StylePreferences
  ) => (
    <View style={styles.preferenceSection}>
      <Text style={[styles.sectionTitle, { color: colors.label }]}>{title}</Text>
      <View style={styles.optionsGrid}>
        {options.map((option) => {
          const isSelected = preferences[category].includes(option.id);
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionChip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.fill,
                  borderColor: isSelected ? colors.primary : colors.separator,
                },
              ]}
              onPress={() => togglePreference(category, option.id)}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text
                style={[
                  styles.optionLabel,
                  { color: isSelected ? colors.white : colors.label },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {!showPreferences ? (
        <>
          <View style={styles.skipContainer}>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={[styles.skip, { color: colors.labelSecondary }]}>Skip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.slideContainer}>{renderIntroSlide()}</View>
        </>
      ) : (
        <ScrollView
          style={styles.preferencesContainer}
          contentContainerStyle={styles.preferencesContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn} style={styles.preferencesHeader}>
            <Text style={styles.iconSmall}>🎨</Text>
            <Text style={[styles.title, { color: colors.label }]}>
              Tell us your style
            </Text>
            <Text style={[styles.subtitle, { color: colors.labelSecondary }]}>
              Help us personalize your experience (optional)
            </Text>
          </Animated.View>

          {renderPreferenceSection('Your Vibe', STYLE_VIBES, 'vibes')}
          {renderPreferenceSection('Frequent Occasions', OCCASIONS, 'occasions')}
          {renderPreferenceSection('Preferred Cuisines', PREFERRED_CUISINES, 'cuisines')}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {!showPreferences ? (
            INTRO_SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentSlide ? colors.primary : colors.fillTertiary,
                  },
                ]}
              />
            ))
          ) : (
            <View
              style={[
                styles.dot,
                { backgroundColor: colors.primary, width: 24 },
              ]}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleNext}
        >
          <Text style={[styles.buttonText, { color: colors.white }]}>
            {currentSlide === INTRO_SLIDES.length - 1 && !showPreferences
              ? 'Next'
              : showPreferences
              ? 'Get Started'
              : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    alignItems: 'flex-end',
    padding: 20,
  },
  skip: {
    fontSize: 16,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 100,
    marginBottom: 32,
  },
  iconSmall: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  preferencesContainer: {
    flex: 1,
  },
  preferencesContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  preferencesHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  preferenceSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  optionEmoji: {
    fontSize: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
