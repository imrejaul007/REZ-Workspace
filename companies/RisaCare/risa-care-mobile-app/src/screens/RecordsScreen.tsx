import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS } from '../../App';

const records = [
  { id: '1', type: 'Lab Report', title: 'Complete Blood Count', date: '2026-06-15', hospital: 'Apollo Hospital', icon: '🧪' },
  { id: '2', type: 'Prescription', title: 'Diabetes Follow-up', date: '2026-06-10', doctor: 'Dr. Amit Sharma', icon: '💊' },
  { id: '3', type: 'Imaging', title: 'Chest X-Ray', date: '2026-06-05', hospital: 'Max Hospital', icon: '📷' },
  { id: '4', type: 'Discharge Summary', title: 'Knee Surgery', date: '2026-05-20', hospital: 'Fortis Hospital', icon: '📋' },
];

export default function RecordsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Records</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.recordCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={styles.recordInfo}>
              <Text style={styles.recordType}>{item.type}</Text>
              <Text style={styles.recordTitle}>{item.title}</Text>
              <Text style={styles.recordMeta}>
                {item.date} • {item.hospital || item.doctor}
              </Text>
            </View>
            <TouchableOpacity style={styles.viewBtn}>
              <Text style={styles.viewBtnText}>View</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: COLORS.white, fontWeight: '600' },
  recordCard: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 15, borderRadius: 15, marginBottom: 12, elevation: 2 },
  iconContainer: { width: 50, height: 50, backgroundColor: COLORS.accent, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 24 },
  recordInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  recordType: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  recordTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 3 },
  recordMeta: { fontSize: 12, color: COLORS.textLight, marginTop: 3 },
  viewBtn: { justifyContent: 'center' },
  viewBtnText: { color: COLORS.primary, fontWeight: '600' },
});
