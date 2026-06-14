// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const REZ_ONBOARDING_DONE_KEY = 'rez_onboarding_done';

function OnboardingWelcome() {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const btnScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 14,
        stiffness: 80,
        useNativeDriver: true,
      }),
      Animated.spring(btnScale, {
        toValue: 1,
        delay: 400,
        damping: 10,
        stiffness: 80,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetStarted = () => {
    router.push('/onboarding/interests');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(REZ_ONBOARDING_DONE_KEY, 'true');
    router.replace('/(tabs)/' as unknown);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#7C3AED', '#5B21B6']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      {/* Decorative circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      {/* Skip button */}
      <View style={styles.skipRow}>
        <Pressable
          onPress={handleSkip}
          hitSlop={12}
          accessibilityLabel="Skip onboarding"
          accessibilityRole="button"
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo placeholder */}
        <Animated.View style={[styles.logoWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>REZ</Text>
          </View>
          <View style={styles.logoCoinRow}>
            <View style={styles.coinDot} />
            <View style={[styles.coinDot, styles.coinDotMid]} />
            <View style={styles.coinDot} />
          </View>
        </Animated.View>

        {/* Headline */}
        <Animated.Text style={[styles.headline, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          Welcome to REZ
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          Earn coins at every visit.{'\n'}Redeem for real discounts.
        </Animated.Text>

        {/* Feature pills */}
        <Animated.View style={[styles.pillRow, { opacity: fadeAnim }]}>
          {['Earn Coins', 'Discover Stores', 'Get Discounts'].map((pill) => (
            <View key={pill} style={styles.pill}>
              <Text style={styles.pillText}>{pill}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* CTA */}
      <Animated.View style={[styles.ctaWrap, { transform: [{ scale: btnScale }] }]}>
        <Pressable
          style={styles.ctaBtn}
          onPress={handleGetStarted}
          accessibilityLabel="Get started"
          accessibilityRole="button"
        >
          <Text style={styles.ctaBtnText}>Get Started</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorCircle1: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -100,
    right: -100,
  },
  decorCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 120,
    left: -60,
  },
  decorCircle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: SCREEN_HEIGHT * 0.35,
    right: 30,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  logoCoinRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  coinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  coinDotMid: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headline: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    fontWeight: '400',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pillText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  ctaWrap: {
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  ctaBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.3,
  },
});

export default withErrorBoundary(OnboardingWelcome, 'OnboardingWelcome');
