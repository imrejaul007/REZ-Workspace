// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

const REZ_ONBOARDING_DONE_KEY = 'rez_onboarding_done';

function FirstScanScreen() {
  const router = useRouter();

  // Coin pulse animation
  const coinScale = useRef(new Animated.Value(1)).current;
  const coinOpacity = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 14, stiffness: 80, useNativeDriver: true }),
    ]).start();

    // Infinite coin pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(coinScale, { toValue: 1.18, duration: 700, useNativeDriver: true }),
          Animated.timing(coinOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(coinScale, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(coinOpacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        ]),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [coinScale, coinOpacity, fadeAnim, slideAnim]);

  const handleStartEarning = async () => {
    await AsyncStorage.setItem(REZ_ONBOARDING_DONE_KEY, 'true').catch(() => {});
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

      {/* Step indicator */}
      <View style={styles.stepRow}>
        <View style={styles.stepDot} />
        <View style={styles.stepDot} />
        <View style={[styles.stepDot, styles.stepDotActive]} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Coin animation */}
        <Animated.View
          style={[
            styles.coinWrap,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.coinOuter,
              {
                transform: [{ scale: coinScale }],
                opacity: coinOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={['#FCD34D', '#F59E0B']}
              style={styles.coinInner}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
            >
              <Text style={styles.coinSymbol}>R</Text>
            </LinearGradient>
          </Animated.View>

          {/* Orbit dots */}
          <View style={[styles.orbitDot, styles.orbitDot1]} />
          <View style={[styles.orbitDot, styles.orbitDot2]} />
          <View style={[styles.orbitDot, styles.orbitDot3]} />
        </Animated.View>

        {/* Check mark */}
        <Animated.View style={[styles.checkWrap, { opacity: fadeAnim }]}>
          <Ionicons name="checkmark-circle" size={32} color="#A7F3D0" />
          <Text style={styles.checkText}>You&apos;re all set!</Text>
        </Animated.View>

        {/* Headline */}
        <Animated.Text style={[styles.headline, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          Scan a store&apos;s QR code to earn your first
        </Animated.Text>

        {/* Coin count */}
        <Animated.View style={[styles.coinCountRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.coinCount}>50</Text>
          <Text style={styles.coinCountLabel}>REZ Coins</Text>
        </Animated.View>

        {/* Steps */}
        <Animated.View style={[styles.stepsCard, { opacity: fadeAnim }]}>
          {[
            { icon: 'qr-code-outline' as const, text: 'Open the app at a partner store' },
            { icon: 'scan-outline' as const, text: 'Tap Scan on the home screen' },
            { icon: 'star-outline' as const, text: 'Coins land in your wallet instantly' },
          ].map(({ icon, text }, idx) => (
            <View key={text} style={[styles.stepItem, idx < 2 && styles.stepItemBorder]}>
              <View style={styles.stepIconWrap}>
                <Ionicons name={icon} size={18} color="#7C3AED" />
              </View>
              <Text style={styles.stepText}>{text}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <Pressable
          style={styles.startBtn}
          onPress={handleStartEarning}
          accessibilityLabel="Start earning coins"
          accessibilityRole="button"
        >
          <Text style={styles.startBtnText}>Start Earning</Text>
          <Ionicons name="arrow-forward" size={18} color="#7C3AED" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  decorCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -80,
    right: -80,
  },
  decorCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 140,
    left: -50,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  stepDotActive: { backgroundColor: '#fff', width: 24 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  coinWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  coinOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  coinInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  coinSymbol: {
    fontSize: 38,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  orbitDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(252, 211, 77, 0.7)',
  },
  orbitDot1: { top: 4, right: 10 },
  orbitDot2: { bottom: 8, left: 6 },
  orbitDot3: { top: '50%', right: 0 },
  checkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  checkText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#A7F3D0',
  },
  headline: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
    fontWeight: '400',
  },
  coinCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 28,
  },
  coinCount: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: -1,
  },
  coinCountLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  stepsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stepItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  stepIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  startBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.3,
  },
});

export default withErrorBoundary(FirstScanScreen, 'OnboardingFirstScan');
