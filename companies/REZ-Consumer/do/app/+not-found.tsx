/**
 * Not Found Page - Handles invalid deep links
 *
 * When a user clicks an invalid deep link, they land here
 * and can navigate back to a valid section of the app.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { useEffect } from 'react';
import { useDeepLinking } from '@/hooks/useDeepLinking';

export default function NotFoundScreen() {
  const { parseDeepLink } = useDeepLinking();

  // Get the invalid path from the URL
  useEffect(() => {
    // Log for debugging
    console.warn('[NotFound] Invalid deep link caught by +not-found.tsx');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>404</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Page Not Found</Text>

        {/* Description */}
        <Text style={styles.description}>
          The page you're looking for doesn't exist or has been moved.
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Primary: Go Home */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Go to Chat</Text>
          </TouchableOpacity>

          {/* Secondary links */}
          <View style={styles.secondaryLinks}>
            <Link href="/(tabs)/wallet" style={styles.link}>
              Wallet
            </Link>
            <Text style={styles.linkSeparator}>|</Text>
            <Link href="/(tabs)/explore" style={styles.link}>
              Explore
            </Link>
            <Text style={styles.linkSeparator}>|</Text>
            <Link href="/(tabs)/profile" style={styles.link}>
              Profile
            </Link>
          </View>
        </View>

        {/* Help text */}
        <Text style={styles.helpText}>
          If you reached here from a link, the link may be outdated.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 32,
    fontWeight: '700',
    color: '#7C3AED',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    fontSize: 14,
    color: '#7C3AED',
    paddingHorizontal: 8,
  },
  linkSeparator: {
    color: '#4B5563',
    fontSize: 14,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 32,
  },
});
