import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '../../App';

const medicines = [
  { id: '1', name: 'Paracetamol 500mg', price: 25, pack: 'Strip of 10', prescription: false },
  { id: '2', name: 'Azithromycin 500mg', price: 120, pack: 'Strip of 3', prescription: true },
  { id: '3', name: 'Vitamin D3 60K', price: 150, pack: 'Box of 4', prescription: false },
  { id: '4', name: 'Metformin 500mg', price: 80, pack: 'Strip of 10', prescription: true },
];

export default function PharmacyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pharmacy</Text>
        <TextInput style={styles.searchInput} placeholder="Search medicines..." placeholderTextColor={COLORS.textLight} />
      </View>

      <FlatList
        data={medicines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.medicineCard}>
            <View style={styles.medicineInfo}>
              <Text style={styles.medicineName}>{item.name}</Text>
              <Text style={styles.pack}>{item.pack}</Text>
              {item.prescription && (
                <View style={styles.rxBadge}><Text style={styles.rxText}>Rx Required</Text></View>
              )}
            </View>
            <View style={styles.medicineRight}>
              <Text style={styles.price}>₹{item.price}</Text>
              <TouchableOpacity style={styles.addBtn}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  searchInput: { backgroundColor: COLORS.white, padding: 15, borderRadius: 15, marginTop: 15, fontSize: 16 },
  medicineCard: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 15, borderRadius: 15, marginBottom: 12 },
  medicineInfo: { flex: 1 },
  medicineName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  pack: { fontSize: 13, color: COLORS.textLight, marginTop: 3 },
  rxBadge: { backgroundColor: COLORS.danger + '20', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginTop: 5 },
  rxText: { color: COLORS.danger, fontSize: 11, fontWeight: '600' },
  medicineRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  price: { fontSize: 18, fontWeight: 'bold', color: COLORS.success },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: COLORS.white, fontWeight: '600' },
});
