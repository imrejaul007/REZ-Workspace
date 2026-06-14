import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../stores/auth';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🚴</Text>
          <Text style={styles.logoText}>RiderCircle</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>
          The Operating System for{'\n'}Adventure Mobility
        </Text>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem icon="🛡️" text="SafeQR Emergency ID" />
          <FeatureItem icon="🗺️" text="Route Intelligence" />
          <FeatureItem icon="👥" text="Rider Community" />
          <FeatureItem icon="🤖" text="AI Ride Assistant" />
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/auth/signup')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 18,
    color: '#e94560',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 28,
  },
  features: {
    width: '100%',
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#e94560',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#e94560',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#e94560',
    fontSize: 18,
    fontWeight: 'bold',
  },
  version: {
    position: 'absolute',
    bottom: 24,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
});