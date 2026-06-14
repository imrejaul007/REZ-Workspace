'use client';

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type TabId = 'overview' | 'menu-qr' | 'room-qr' | 'ads-qr';

interface Tab {
  id: TabId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: 'grid', route: '/(dashboard)/qr-hub' },
  { id: 'menu-qr', label: 'Menu QR', icon: 'restaurant', route: '/(dashboard)/qr-hub/menu-qr' },
  { id: 'room-qr', label: 'Room QR', icon: 'bed', route: '/(dashboard)/qr-hub/room-qr' },
  { id: 'ads-qr', label: 'Ads QR', icon: 'megaphone', route: '/(dashboard)/qr-hub/ads-qr' },
];

export default function QRHubLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveTab = (): TabId => {
    if (pathname.includes('/menu-qr')) return 'menu-qr';
    if (pathname.includes('/room-qr')) return 'room-qr';
    if (pathname.includes('/ads-qr')) return 'ads-qr';
    return 'overview';
  };

  const activeTab = getActiveTab();

  const handleTabPress = (tab: Tab) => {
    router.push(tab.route);
  };

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
        <StatusBar barStyle="light-content" />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>QR Hub</Text>
          <Text style={styles.headerSubtitle}>Manage all your QR codes</Text>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={20}
                  color={isActive ? '#6366F1' : '#9CA3AF'}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    marginBottom: -1,
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 6,
  },
  tabLabelActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '50%',
    marginLeft: -16,
    width: 32,
    height: 3,
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
});
