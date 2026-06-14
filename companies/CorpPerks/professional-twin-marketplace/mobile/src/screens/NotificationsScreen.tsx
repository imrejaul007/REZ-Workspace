/**
 * Notifications Screen
 */

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7c3aed',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  text: '#ffffff',
  textSecondary: '#94a3b8',
  success: '#10b981',
  warning: '#f59e0b',
};

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'hire', title: 'New Hire Request', message: 'TechCorp wants to hire your Skill Twin', time: '2 min ago', read: false },
  { id: '2', type: 'milestone', title: 'Milestone Achieved! 🎉', message: 'Your Execution Twin reached Expert level', time: '1 hour ago', read: false },
  { id: '3', type: 'learning', title: 'Twin Learning Progress', message: 'Your Knowledge Twin learned: System Design', time: '3 hours ago', read: true },
  { id: '4', type: 'subscription', title: 'Subscription Active', message: 'Your TwinOS Pro subscription is active', time: '1 day ago', read: true },
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = React.useState(MOCK_NOTIFICATIONS);

  const getIcon = (type: string) => {
    switch (type) {
      case 'hire': return 'briefcase';
      case 'milestone': return 'trophy';
      case 'learning': return 'school';
      case 'subscription': return 'card';
      default: return 'notifications';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'hire': return COLORS.primary;
      case 'milestone': return COLORS.warning;
      case 'learning': return COLORS.success;
      case 'subscription': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity>
          <Text style={styles.markAll}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.notificationCard, !item.read && styles.unread]}>
            <View style={[styles.iconContainer, { backgroundColor: getColor(item.type) + '20' }]}>
              <Ionicons name={getIcon(item.type) as any} size={20} color={getColor(item.type)} />
            </View>
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationTime}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  markAll: { fontSize: 14, color: COLORS.primary },
  notificationCard: { flexDirection: 'row', backgroundColor: COLORS.surface, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16 },
  unread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, marginLeft: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  notificationTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 8 },
  notificationMessage: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  notificationTime: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, opacity: 0.7 },
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 16 },
});
