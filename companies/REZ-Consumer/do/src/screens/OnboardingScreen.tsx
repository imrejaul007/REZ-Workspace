import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn, FadeInRight, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/components/Button';
import { GeniePrivacyConsent } from '@/components/GeniePrivacyConsent';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    emoji: '🤖',
    title: 'Meet Do',
    description: 'Your AI assistant that actually does things for you. Just tell Do what you need.',
  },
  {
    id: '2',
    emoji: '🍽️',
    title: 'Book Instantly',
    description: 'Restaurants, trials, events — just ask and Do books it for you.',
  },
  {
    id: '3',
    emoji: '💰',
    title: 'Earn Rewards',
    description: 'Every booking earns coins and karma. Redeem for discounts and freebies.',
  },
  {
    id: '4',
    emoji: '🧠',
    title: 'Your Personal AI',
    description: 'Meet Genie — your personal AI that remembers your preferences, orders your usual, and helps you every day.',
  },
  {
    id: '5',
    emoji: '🎉',
    title: "You're All Set",
    description: "Ready to experience the future of local commerce? Let's go!",
  },
];

interface ConsentState {
  voiceCommands: boolean;
  voiceWakeWord: boolean;
  activityData: boolean;
  locationData: boolean;
  calendarSync: boolean;
  emailSync: boolean;
}

export const OnboardingScreen: React.FC = () => {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConsent, setShowConsent] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    Haptics.selectionAsync();

    if (currentIndex === SLIDES.length - 2 && !consentGiven) {
      // Before "You're All Set" - show consent
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      // Trigger consent after a brief delay
      setTimeout(() => setShowConsent(true), 300);
    } else if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    Haptics.selectionAsync();
    router.replace('/(tabs)');
  };

  const handleGetStarted = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  const handleConsentAccept = (consents: ConsentState) => {
    // Save consent preferences
    // In production, this would call an API or AsyncStorage
    console.log('Consent accepted:', consents);
    setConsentGiven(true);
    setShowConsent(false);

    // Proceed to next step
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }, 100);
  };

  const handleConsentDecline = () => {
    setShowConsent(false);
    // Proceed without advanced features
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }, 100);
  };

  const handleConsentSkip = () => {
    setShowConsent(false);
  };

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.View
        entering={index === currentIndex ? ZoomIn.delay(200) : undefined}
        style={styles.emojiContainer}
      >
        <Text style={styles.emoji}>{item.emoji}</Text>
      </Animated.View>

      <Animated.Text
        entering={index === currentIndex ? FadeInRight.delay(300) : undefined}
        style={[styles.title, { color: colors.label, ...typography.displayMedium }]}
      >
        {item.title}
      </Animated.Text>

      <Animated.Text
        entering={index === currentIndex ? FadeInRight.delay(400) : undefined}
        style={[styles.description, { color: colors.labelSecondary, ...typography.bodyLarge }]}
      >
        {item.description}
      </Animated.Text>

      {/* Genie Feature Highlights - Show on slide 4 */}
      {item.id === '4' && (
        <Animated.View
          entering={index === currentIndex ? FadeIn.delay(500) : undefined}
          style={styles.featureHighlights}
        >
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✨</Text>
            <Text style={styles.featureText}>Remembers your preferences</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎙️</Text>
            <Text style={styles.featureText}>Voice commands with "Hey Genie"</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📅</Text>
            <Text style={styles.featureText}>Smart calendar sync</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔔</Text>
            <Text style={styles.featureText}>WhatsApp follow-ups</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor:
                index === currentIndex ? colors.primary : colors.fill,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip Button */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.labelSecondary }]}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Consent Modal */}
      {showConsent && (
        <View style={styles.consentOverlay}>
          <GeniePrivacyConsent
            onAccept={handleConsentAccept}
            onDecline={handleConsentDecline}
          />
          <TouchableOpacity style={styles.consentOverlayClose} onPress={handleConsentSkip}>
            <Text style={styles.consentOverlayCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Dots */}
      {renderDots()}

      {/* Bottom */}
      <View style={[styles.bottom, { paddingHorizontal: spacing.screenPadding }]}>
        <Button
          variant="primary"
          size="large"
          onPress={handleNext}
          fullWidth
        >
          {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          {currentIndex < SLIDES.length - 1 && (
            <ChevronRight size={20} color={colors.white} style={{ marginLeft: 8 }} />
          )}
        </Button>

        {/* Consent Preview */}
        {currentIndex === SLIDES.length - 2 && (
          <Text style={styles.consentHint}>
            We'll ask for your consent to enable AI features
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emojiContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    lineHeight: 26,
  },
  featureHighlights: {
    marginTop: 32,
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#666',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  bottom: {
    paddingBottom: 24,
  },
  consentHint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#999',
    marginTop: 12,
  },
  consentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: '#fff',
  },
  consentOverlayClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 101,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  consentOverlayCloseText: {
    fontSize: 24,
    color: '#666',
    lineHeight: 28,
  },
});