// RisaCare Mobile - Marketplace Screen (Labs & Tests)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView
} from 'react-native';

interface Test {
  id: string;
  name: string;
  category: string;
  parameters: string[];
  price: number;
  discountedPrice: number;
  labs: { name: string; price: number; rating: number }[];
}

interface Lab {
  id: string;
  name: string;
  rating: number;
  distance: string;
  homeCollection: boolean;
  nablAccredited: boolean;
}

const mockTests: Test[] = [
  { id: '1', name: 'Complete Blood Count (CBC)', category: 'preventive', parameters: ['Hemoglobin', 'RBC', 'WBC', 'Platelets'], price: 450, discountedPrice: 399, labs: [{ name: 'Apollo Diagnostics', price: 399, rating: 4.5 }, { name: 'SRL Diagnostics', price: 299, rating: 4.2 }] },
  { id: '2', name: 'Lipid Profile', category: 'cardiac', parameters: ['Cholesterol', 'LDL', 'HDL', 'Triglycerides'], price: 600, discountedPrice: 499, labs: [{ name: 'Apollo Diagnostics', price: 499, rating: 4.5 }, { name: 'Metropolis', price: 450, rating: 4.3 }] },
  { id: '3', name: 'Thyroid Profile', category: 'thyroid', parameters: ['TSH', 'T3', 'T4'], price: 800, discountedPrice: 699, labs: [{ name: 'Dr. Lal PathLabs', price: 699, rating: 4.7 }] },
  { id: '4', name: 'Diabetes Screening', category: 'diabetes', parameters: ['Fasting Glucose', 'HbA1c'], price: 500, discountedPrice: 399, labs: [{ name: 'Apollo Diagnostics', price: 399, rating: 4.5 }] },
  { id: '5', name: "Women's Wellness Package", category: 'womens_health', parameters: ['CBC', 'Thyroid', 'Vitamin D', 'Iron'], price: 2500, discountedPrice: 1999, labs: [{ name: 'SRL Diagnostics', price: 1999, rating: 4.2 }] }
];

const mockLabs: Lab[] = [
  { id: '1', name: 'Apollo Diagnostics', rating: 4.5, distance: '1.2 km', homeCollection: true, nablAccredited: true },
  { id: '2', name: 'SRL Diagnostics', rating: 4.2, distance: '2.5 km', homeCollection: true, nablAccredited: true },
  { id: '3', name: 'Dr. Lal PathLabs', rating: 4.7, distance: '3.1 km', homeCollection: true, nablAccredited: true },
  { id: '4', name: 'Metropolis', rating: 4.3, distance: '4.0 km', homeCollection: false, nablAccredited: true }
];

const categories = ['All', 'Preventive', 'Cardiac', 'Thyroid', 'Diabetes', "Women's Health"];

export default function MarketplaceScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'tests' | 'labs'>('tests');

  const filteredTests = mockTests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.parameters.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || test.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const renderTest = ({ item }: { item: Test }) => (
    <View style={styles.testCard}>
      <View style={styles.testHeader}>
        <View style={styles.testInfo}>
          <Text style={styles.testName}>{item.name}</Text>
          <Text style={styles.testParams}>{item.parameters.slice(0, 3).join(' • ')}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.originalPrice}>₹{item.price}</Text>
          <Text style={styles.discountedPrice}>₹{item.discountedPrice}</Text>
        </View>
      </View>
      <View style={styles.labRow}>
        <Text style={styles.labLabel}>Available at:</Text>
        {item.labs.slice(0, 2).map((lab, idx) => (
          <View key={idx} style={styles.labOption}>
            <Text style={styles.labName}>{lab.name}</Text>
            <Text style={styles.labPrice}>₹{lab.price}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.bookButton}>
        <Text style={styles.bookButtonText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLab = ({ item }: { item: Lab }) => (
    <View style={styles.labCard}>
      <View style={styles.labHeader}>
        <View style={styles.labIcon}>
          <Text style={styles.labIconText}>🏥</Text>
        </View>
        <View style={styles.labInfo}>
          <Text style={styles.labName}>{item.name}</Text>
          <View style={styles.labMeta}>
            <Text style={styles.labMetaText}>⭐ {item.rating}</Text>
            <Text style={styles.labMetaText}>📍 {item.distance}</Text>
          </View>
        </View>
        {item.nablAccredited && (
          <View style={styles.nablBadge}>
            <Text style={styles.nablText}>NABL</Text>
          </View>
        )}
      </View>
      <View style={styles.labServices}>
        {item.homeCollection && (
          <View style={styles.serviceTag}>
            <Text style={styles.serviceText}>🏠 Home Collection</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.viewButton}>
        <Text style={styles.viewButtonText}>View All Tests</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'tests' && styles.tabActive]} onPress={() => setActiveTab('tests')}>
          <Text style={[styles.tabText, activeTab === 'tests' && styles.tabTextActive]}>🧪 Tests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'labs' && styles.tabActive]} onPress={() => setActiveTab('labs')}>
          <Text style={[styles.tabText, activeTab === 'labs' && styles.tabTextActive]}>🏥 Labs</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'tests' ? "Search tests..." : "Search labs..."}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {activeTab === 'tests' && (
        <>
          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tests List */}
          <FlatList
            data={filteredTests}
            renderItem={renderTest}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {activeTab === 'labs' && (
        <FlatList
          data={mockLabs}
          renderItem={renderLab}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#007AFF' },
  tabText: { fontSize: 15, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, paddingHorizontal: 16, borderRadius: 12, marginBottom: 12 },
  searchIcon: { fontSize: 18, marginRight: 12 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#333' },
  categoryScroll: { paddingHorizontal: 16, marginBottom: 12 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, marginRight: 8 },
  categoryChipActive: { backgroundColor: '#34C759' },
  categoryText: { fontSize: 13, color: '#666' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 16, paddingTop: 0 },
  testCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  testHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  testInfo: { flex: 1 },
  testName: { fontSize: 16, fontWeight: '600', color: '#333' },
  testParams: { fontSize: 12, color: '#666', marginTop: 4 },
  priceContainer: { alignItems: 'flex-end' },
  originalPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },
  discountedPrice: { fontSize: 18, fontWeight: 'bold', color: '#34C759' },
  labRow: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  labLabel: { fontSize: 12, color: '#666', marginRight: 8 },
  labOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8, marginTop: 4 },
  labName: { fontSize: 11, color: '#333', marginRight: 4 },
  labPrice: { fontSize: 11, fontWeight: '600', color: '#007AFF' },
  bookButton: { backgroundColor: '#007AFF', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  bookButtonText: { color: '#fff', fontWeight: '600' },
  labCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  labHeader: { flexDirection: 'row', alignItems: 'center' },
  labIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#007AFF20', alignItems: 'center', justifyContent: 'center' },
  labIconText: { fontSize: 24 },
  labInfo: { flex: 1, marginLeft: 12 },
  labName: { fontSize: 16, fontWeight: '600', color: '#333' },
  labMeta: { flexDirection: 'row', marginTop: 4 },
  labMetaText: { fontSize: 12, color: '#666', marginRight: 12 },
  nablBadge: { backgroundColor: '#34C759', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  nablText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  labServices: { flexDirection: 'row', marginTop: 12 },
  serviceTag: { backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  serviceText: { fontSize: 12, color: '#333' },
  viewButton: { backgroundColor: '#F0F0F0', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  viewButtonText: { color: '#007AFF', fontWeight: '600' }
});
