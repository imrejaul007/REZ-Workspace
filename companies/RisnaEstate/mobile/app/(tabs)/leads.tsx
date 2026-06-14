/**
 * Mobile - Lead Detail Screen
 */
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LeadDetailScreen() {
  const lead = {
    id: '1',
    name: 'Rajesh Sharma',
    phone: '+91 98765 43210',
    email: 'rajesh@example.com',
    segment: 'HNI',
    score: 92,
    budget: '₹2Cr+',
    timeline: 'Immediate',
    broker: 'Ahmed Properties',
    notes: 'Serious investor, prefers sea-facing units',
  };

  const timeline = [
    { date: 'Mar 20, 3:00 PM', type: 'call', text: 'Called - interested in Dubai Marina' },
    { date: 'Mar 18, 10:00 AM', type: 'whatsapp', text: 'Sent brochure' },
    { date: 'Mar 15, 9:00 AM', type: 'note', text: 'Lead created from website' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{lead.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{lead.name}</Text>
        <Text style={styles.phone}>{lead.phone}</Text>
        <View style={[styles.scoreBadge, { backgroundColor: '#fef2f2' }]}>
          <Text style={[styles.scoreText, { color: '#ef4444' }]}>Score: {lead.score}/100</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="call" size={24} color="#22c55e" />
          <Text style={styles.actionLabel}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="logo-whatsapp" size={24} color="#22c55e" />
          <Text style={styles.actionLabel}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="calendar" size={24} color="#0ea5e9" />
          <Text style={styles.actionLabel}>Visit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="document-text" size={24} color="#6b7280" />
          <Text style={styles.actionLabel}>Docs</Text>
        </TouchableOpacity>
      </View>

      {/* Info Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lead Info</Text>
        <View style={styles.card}>
          <InfoRow label="Segment" value={lead.segment} />
          <InfoRow label="Budget" value={lead.budget} />
          <InfoRow label="Timeline" value={lead.timeline} />
          <InfoRow label="Broker" value={lead.broker} />
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <View style={styles.card}>
          <Text style={styles.notes}>{lead.notes}</Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity</Text>
        {timeline.map((item, i) => (
          <View key={i} style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Ionicons
                name={item.type === 'call' ? 'call' : item.type === 'whatsapp' ? 'chatbubbles' : 'document-text'}
                size={16}
                color="#6b7280"
              />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineText}>{item.text}</Text>
              <Text style={styles.timelineDate}>{item.date}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Add Note */}
      <View style={styles.noteInput}>
        <TextInput
          style={styles.input}
          placeholder="Add note..."
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity style={styles.sendBtn}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#16a34a' },
  name: { fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  phone: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  scoreBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  scoreText: { fontSize: 14, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  actionBtn: { alignItems: 'center' },
  actionLabel: { fontSize: 12, marginTop: 4, color: '#374151' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { color: '#6b7280' },
  infoValue: { fontWeight: '500' },
  notes: { color: '#374151', lineHeight: 22 },
  timelineItem: { flexDirection: 'row', marginBottom: 16 },
  timelineIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  timelineContent: { flex: 1 },
  timelineText: { color: '#374151' },
  timelineDate: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  noteInput: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
