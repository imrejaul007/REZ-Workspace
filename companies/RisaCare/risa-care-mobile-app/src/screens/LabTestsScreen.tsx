import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '../../App';

const categories = ['All', 'Blood Tests', 'Health Packages', 'Imaging', 'COVID-19'];

const tests = [
  { id: '1', name: 'Complete Blood Count (CBC)', price: 350, fasting: true, duration: 'Same Day' },
  { id: '2', name: 'Thyroid Profile (T3, T4, TSH)', price: 550, fasting: true, duration: 'Same Day' },
  { id: '3', name: 'Lipid Profile', price: 400, fasting: true, duration: 'Same Day' },
  { id: '4', name: 'HbA1c (Diabetes)', price: 450, fasting: false, duration: 'Same Day' },
  { id: '5', name: 'Liver Function Test', price: 500, fasting: true, duration: 'Same Day' },
];

const packages = [
  { id: 'p1', name: 'Basic Health Checkup', tests: 10, price: 1499, originalPrice: 2500 },
  { id: 'p2', name: 'Full Body Checkup', tests: 70, price: 3499, originalPrice: 6000 },
];

export default function LabTestsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Book Lab Tests</Text>
        <TextInput style={styles.searchInput} placeholder="Search tests..." placeholderTextColor={COLORS.textLight} />
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={{ paddingHorizontal: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.categoryChip, item === 'All' && styles.categoryChipActive]}>
            <Text style={[styles.categoryText, item === 'All' && styles.categoryTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.sectionTitle}>Popular Packages</Text>
      <FlatList
        horizontal
        data={packages}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.packageCard}>
            <View style={styles.discountBadge}><Text style={styles.discountText}>{Math.round((1 - item.price/item.originalPrice)*100)}% OFF</Text></View>
            <Text style={styles.packageName}>{item.name}</Text>
            <Text style={styles.packageTests}>{item.tests} tests included</Text>
            <View style={styles.priceRow}>
              <Text style={styles.packagePrice}>₹{item.price}</Text>
              <Text style={styles.packageOriginal}>₹{item.originalPrice}</Text>
            </View>
            <TouchableOpacity style={styles.addBtn}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>Individual Tests</Text>
      <FlatList
        data={tests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.testCard}>
            <View style={styles.testInfo}>
              <Text style={styles.testName}>{item.name}</Text>
              <View style={styles.testMeta}>
                {item.fasting && <Text style={styles.metaTag}>⏰ Fasting</Text>}
                <Text style={styles.metaTag}>⏱ {item.duration}</Text>
              </View>
            </View>
            <View style={styles.testRight}>
              <Text style={styles.testPrice}>₹{item.price}</Text>
              <TouchableOpacity style={styles.addBtn}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
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
  categoryChip: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10, marginVertical: 15 },
  categoryChipActive: { backgroundColor: COLORS.primary },
  categoryText: { fontSize: 14, color: COLORS.text },
  categoryTextActive: { color: COLORS.white },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, paddingHorizontal: 20, marginTop: 10 },
  packageCard: { backgroundColor: COLORS.white, padding: 15, borderRadius: 15, marginRight: 15, width: 200 },
  discountBadge: { backgroundColor: COLORS.success, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  discountText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  packageName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 10 },
  packageTests: { fontSize: 12, color: COLORS.textLight, marginTop: 5 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  packagePrice: { fontSize: 20, fontWeight: 'bold', color: COLORS.success },
  packageOriginal: { fontSize: 14, color: COLORS.textLight, textDecorationLine: 'line-through', marginLeft: 10 },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, marginTop: 10, alignSelf: 'flex-start' },
  addBtnText: { color: COLORS.white, fontWeight: '600' },
  testCard: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 15, borderRadius: 15, marginBottom: 10 },
  testInfo: { flex: 1 },
  testName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  testMeta: { flexDirection: 'row', marginTop: 5 },
  metaTag: { fontSize: 12, color: COLORS.textLight, marginRight: 10 },
  testRight: { alignItems: 'flex-end' },
  testPrice: { fontSize: 18, fontWeight: 'bold', color: COLORS.success },
});
