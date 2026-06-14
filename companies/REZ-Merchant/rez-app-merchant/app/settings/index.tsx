import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

interface SettingsItem {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const SETTINGS_ITEMS: SettingsItem[] = [
  {
    title: 'Business Profile',
    description: 'Business name, logo, description',
    icon: 'business-outline',
    route: '/settings/profile',
  },
  {
    title: 'REZ Now Page',
    description: 'Public menu page, store type, social links',
    icon: 'globe-outline',
    route: '/settings/rez-now',
  },
  {
    title: 'Business Hours',
    description: 'Opening and closing times',
    icon: 'time-outline',
    route: '/settings/business-hours',
  },
  {
    title: 'Notifications',
    description: 'Push, email, SMS preferences',
    icon: 'notifications-outline',
    route: '/settings/notifications',
  },
  {
    title: 'Printer Setup',
    description: 'POS receipt printer configuration',
    icon: 'print-outline',
    route: '/settings/printer',
  },
  {
    title: 'Staff Management',
    description: 'Team roles and permissions',
    icon: 'people-outline',
    route: '/settings/staff',
  },
  {
    title: 'Feature Flags',
    description: 'View enabled platform features',
    icon: 'flag-outline',
    route: '/settings/feature-flags',
  },
  {
    title: 'Service Packages',
    description: 'Prepaid bundles and multi-session passes',
    icon: 'gift-outline',
    route: '/service-packages/',
  },
  {
    title: 'Treatment Rooms',
    description: 'Manage rooms, chairs and stations',
    icon: 'bed-outline',
    route: '/treatment-rooms/',
  },
  {
    title: 'Class Scheduling',
    description: 'Group classes with capacity management',
    icon: 'calendar-number-outline',
    route: '/class-schedule/',
  },
  {
    title: 'Calendar Sync',
    description: 'Sync appointments to Google/Apple Calendar',
    icon: 'calendar-outline',
    route: '/settings/calendar-sync',
  },
  {
    title: 'Social Booking',
    description: 'Book via Instagram, Google, Facebook',
    icon: 'share-social-outline',
    route: '/settings/social-booking',
  },
  {
    title: 'Cancellation Policy',
    description: 'Free cancel window and late fees',
    icon: 'close-circle-outline',
    route: '/settings/cancellation-policy',
  },
  {
    title: 'Rebooking Reminders',
    description: 'Auto-remind clients to rebook',
    icon: 'repeat-outline',
    route: '/automation/rebooking-template',
  },
  {
    title: 'System Status',
    description: 'API health and connectivity',
    icon: 'pulse-outline',
    route: '/settings/system-status',
  },
  {
    title: 'Moderation Status',
    description: 'Content review queue',
    icon: 'shield-checkmark-outline',
    route: '/settings/moderation-status',
  },
  {
    title: 'About',
    description: 'App version and legal info',
    icon: 'information-circle-outline',
    route: '/settings/about',
  },
  ...(__DEV__
    ? [
        {
          title: 'DLQ Debug',
          description: 'Offline dead letter queue',
          icon: 'mail-unread-outline' as keyof typeof Ionicons.glyphMap,
          route: '/settings/dlq-debug',
        },
      ]
    : []),
];

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {SETTINGS_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.item}
            onPress={() => router.push(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon} size={22} color={Colors.light.primary} />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.textHeading },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 32 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.light.primaryLight2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: Colors.light.textHeading },
  itemDescription: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
});
