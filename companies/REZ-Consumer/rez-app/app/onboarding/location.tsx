import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '@/constants/theme';

function LocationPermissionScreen() {
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {
      // silently handle — permission denied or unavailable
    } finally {
      setRequesting(false);
    }
    router.push('/onboarding/first-scan');
  };

  const handleMaybeLater = () => {
    router.push('/onboarding/first-scan');
  };

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
          <View style={styles.stepDot} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepDot} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="location-outline" size={52} color="#7C3AED" />
          </View>
          <View style={styles.iconRing} />
        </View>

        <Text style={styles.heading}>Find stores near you</Text>
        <Text style={styles.description}>
          Allow REZ to access your location to discover partner stores nearby, get personalised deals, and earn coins at
          stores in your area.
        </Text>

        <View style={styles.benefitsList}>
          {[
            { icon: 'storefront-outline' as const, text: 'See stores within walking distance' },
            { icon: 'pricetag-outline' as const, text: 'Get location-based exclusive offers' },
            { icon: 'navigate-outline' as const, text: 'Find the fastest route to earn coins' },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.benefitRow}>
              <View style={styles.benefitIconWrap}>
                <Ionicons name={icon} size={16} color="#7C3AED" />
              </View>
              <Text style={styles.benefitText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer buttons */}
      <View style={styles.footer}>
        <Pressable
          style={styles.allowBtn}
          onPress={handleAllow}
          disabled={requesting}
          accessibilityLabel="Allow location access"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={['#7C3AED', '#5B21B6']}
            style={styles.allowBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {requesting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="location" size={18} color="#fff" />
                <Text style={styles.allowBtnText}>Allow Location</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={handleMaybeLater}
          hitSlop={8}
          accessibilityLabel="Maybe later"
          accessibilityRole="button"
          style={styles.laterBtn}
        >
          <Text style={styles.laterBtnText}>Maybe Later</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconRing: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    borderStyle: 'dashed',
  },
  heading: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.nileBlue,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  benefitsList: {
    width: '100%',
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  benefitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  allowBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  allowBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
  },
  allowBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  laterBtnText: {
    fontSize: 15,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});

export default withErrorBoundary(LocationPermissionScreen, 'OnboardingLocation');
