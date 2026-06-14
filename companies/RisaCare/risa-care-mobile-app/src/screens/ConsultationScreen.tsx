import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '../../App';

const doctors = [
  { id: '1', name: 'Dr. Amit Sharma', specialty: 'Cardiologist', fee: 500, available: true },
  { id: '2', name: 'Dr. Priya Patel', specialty: 'Dermatologist', fee: 400, available: true },
];

export default function ConsultationScreen({ navigation }: any) {
  const [selected, setSelected] = useState<any>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Video Consultation</Text>
        <Text style={styles.subtitle}>Connect with doctors via video call</Text>
      </View>

      <FlatList
        data={doctors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.doctorCard, selected?.id === item.id && styles.doctorCardSelected]}
            onPress={() => setSelected(item)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👨‍⚕️</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.specialty}>{item.specialty}</Text>
              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: item.available ? COLORS.success + '20' : COLORS.danger + '20' }]}>
                  <Text style={[styles.badgeText, { color: item.available ? COLORS.success : COLORS.danger }]}>
                    {item.available ? 'Available' : 'Offline'}
                  </Text>
                </View>
                <Text style={styles.fee}>₹{item.fee}</Text>
              </View>
            </View>
            {selected?.id === item.id && <View style={styles.checkmark}><Text style={styles.checkmarkText}>✓</Text></View>}
          </TouchableOpacity>
        )}
        ListFooterComponent={
          selected ? (
            <TouchableOpacity style={styles.startBtn}>
              <Text style={styles.startBtnText}>Start Consultation</Text>
            </TouchableOpacity>
          ) : null
        }
        contentContainerStyle={{ padding: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
  subtitle: { fontSize: 14, color: COLORS.white, opacity: 0.8, marginTop: 5 },
  doctorCard: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 15, borderRadius: 15, marginBottom: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  doctorCardSelected: { borderColor: COLORS.primary },
  avatar: { width: 60, height: 60, backgroundColor: COLORS.accent, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 30 },
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  specialty: { fontSize: 13, color: COLORS.textLight, marginTop: 3 },
  badges: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  fee: { fontSize: 14, fontWeight: 'bold', color: COLORS.success, marginLeft: 10 },
  checkmark: { width: 30, height: 30, backgroundColor: COLORS.primary, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  checkmarkText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  startBtn: { backgroundColor: COLORS.success, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  startBtnText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
});
