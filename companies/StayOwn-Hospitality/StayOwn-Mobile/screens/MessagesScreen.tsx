/**
 * StayOwn Mobile - Messages Screen
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const COLORS = { primary: '#6366F1', background: '#F9FAFB', white: '#FFFFFF', text: '#1F2937', textLight: '#6B7280' };

const CONVERSATIONS = [
  { id: '1', name: 'The Grand Palace', lastMessage: 'Your early check-in request has been confirmed.', time: '2:30 PM', unread: 1 },
  { id: '2', name: 'Skyline Suites', lastMessage: 'Thank you for your stay! Rate your experience.', time: 'Yesterday', unread: 0 },
];

export default function MessagesScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <FlatList
        data={CONVERSATIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.conversation}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <View style={styles.messageRow}>
                <Text style={[styles.lastMessage, item.unread > 0 && styles.unread]} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
                {item.unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.unread}</Text></View>}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  conversation: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, color: COLORS.white, fontWeight: '600' },
  content: { flex: 1, marginLeft: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  time: { fontSize: 12, color: COLORS.textLight },
  messageRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  lastMessage: { flex: 1, fontSize: 14, color: COLORS.textLight },
  unread: { color: COLORS.text, fontWeight: '500' },
  badge: { backgroundColor: COLORS.primary, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  badgeText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 50, fontSize: 16, color: COLORS.textLight },
});
