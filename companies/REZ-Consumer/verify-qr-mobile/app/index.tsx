/**
 * REZ Verify QR - Home Screen
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const features = [
  {
    id: '1',
    title: 'Verify Product',
    description: 'Scan QR or enter serial',
    icon: '📱',
    route: '/scan',
    color: '#6366F1',
  },
  {
    id: '2',
    title: 'Warranty',
    description: 'Check or activate warranty',
    icon: '🛡️',
    route: '/warranty',
    color: '#10B981',
  },
  {
    id: '3',
    title: 'Claims',
    description: 'File and track claims',
    icon: '📋',
    route: '/claims',
    color: '#F59E0B',
  },
  {
    id: '4',
    title: 'Service',
    description: 'Find service centers',
    icon: '🔧',
    route: '/service-center',
    color: '#EF4444',
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>REZ Verify QR</Text>
          <Text style={styles.tagline}>Product Trust & Warranty</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => router.push('/scan')}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scanGradient}
            >
              <Text style={styles.scanIcon}>📷</Text>
              <Text style={styles.scanText}>Scan QR Code</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serialButton}
            onPress={() => router.push('/verify')}
          >
            <Text style={styles.serialIcon}>🔢</Text>
            <Text style={styles.serialText}>Enter Serial</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.features}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={() => router.push(feature.route as any)}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <Text style={styles.featureIconText}>{feature.icon}</Text>
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1,234</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>567</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>89</Text>
            <Text style={styles.statLabel}>Claims</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366F1',
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  scanButton: {
    flex: 1,
  },
  scanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  scanIcon: {
    fontSize: 24,
  },
  scanText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  serialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6366F1',
    gap: 8,
  },
  serialIcon: {
    fontSize: 24,
  },
  serialText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  featureDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
});
