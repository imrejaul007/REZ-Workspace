// ==========================================
// MyTalent - Announcements Screen
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../src/components/Badge';
import { Card } from '../../src/components';

const announcements = [
  { id: '1', title: 'New Health Benefits Package', category: 'HR Update', date: 'May 28, 2026', summary: 'Enhanced health insurance coverage for all employees effective June 1, 2026.', read: false, icon: '🏥' },
  { id: '2', title: 'Office Timings Update', category: 'Company News', date: 'May 25, 2026', summary: 'New flexible work hours policy - Core hours 10 AM to 4 PM.', read: false, icon: '⏰' },
  { id: '3', title: 'Annual Day Celebration', category: 'Events', date: 'May 20, 2026', summary: 'Join us for the annual day celebration on June 15th!', read: true, icon: '🎉' },
  { id: '4', title: 'Performance Review Cycle', category: 'HR Update', date: 'May 15, 2026', summary: 'Q2 performance reviews starting next week. Prepare your self-assessment.', read: true, icon: '📊' },
  { id: '5', title: 'Learning Portal Update', category: 'Product', date: 'May 10, 2026', summary: 'New courses added to the learning portal. Check out Coursera integration.', read: true, icon: '📚' },
];

export default function AnnouncementsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.announcementsList}>
        {announcements.map(ann => (
          <Card key={ann.id} style={[styles.annCard, !ann.read && styles.unreadCard]}>
            <View style={styles.annHeader}>
              <View style={styles.annIconWrap}>
                <Text style={styles.annIcon}>{ann.icon}</Text>
              </View>
              <View style={styles.annInfo}>
                <View style={styles.annTitleRow}>
                  <Text style={[styles.annTitle, !ann.read && styles.unreadTitle]}>{ann.title}</Text>
                  {!ann.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.annCategory}>{ann.category} • {ann.date}</Text>
              </View>
            </View>
            <Text style={styles.annSummary}>{ann.summary}</Text>
            <TouchableOpacity style={styles.readMoreBtn}>
              <Text style={styles.readMoreText}>Read More</Text>
            </TouchableOpacity>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  announcementsList: { padding: Spacing.md },
  annCard: { marginBottom: Spacing.sm' },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: Colors.primary },
  annHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  annIconWrap: { width: 44, height: 44, borderRadius: BorderRadius.lg, backgroundColor: Colors.backgroundDark, alignItems: 'center', justifyContent: 'center' },
  annIcon: { fontSize: 22 },
  annInfo: { flex: 1, marginLeft: Spacing.md },
  annTitleRow: { flexDirection: 'row', alignItems: 'center' },
  annTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flex: 1 },
  unreadTitle: { fontWeight: FontWeight.bold },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: Spacing.sm },
  annCategory: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  annSummary: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.md, lineHeight: 22 },
  readMoreBtn: { marginTop: Spacing.sm },
  readMoreText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
});
