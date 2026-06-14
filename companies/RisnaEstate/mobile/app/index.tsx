// Home Screen
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Search Bar */}
      <TouchableOpacity style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <Text style={styles.searchText}>Search properties...</Text>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="business-outline" size={28} color="#0ea5e9" />
            <Text style={styles.actionText}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="key-outline" size={28} color="#0ea5e9" />
            <Text style={styles.actionText}>Rent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name=" globe-outline" size={28} color="#0ea5e9" />
            <Text style={styles.actionText}>UAE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="flag-outline" size={28} color="#0ea5e9" />
            <Text style={styles.actionText}>India</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Properties */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Properties</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.propertyCard}>
            <View style={styles.propertyImage} />
            <Text style={styles.propertyTitle}>Luxury Villa</Text>
            <Text style={styles.propertyLocation}>Dubai Marina</Text>
            <Text style={styles.propertyPrice}>AED 2,500,000</Text>
          </View>
          <View style={styles.propertyCard}>
            <View style={styles.propertyImage} />
            <Text style={styles.propertyTitle}>2BHK Apartment</Text>
            <Text style={styles.propertyLocation}>Whitefield, Bangalore</Text>
            <Text style={styles.propertyPrice}>₹95,00,000</Text>
          </View>
        </ScrollView>
      </View>

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.servicesGrid}>
          <TouchableOpacity style={styles.serviceCard}>
            <Ionicons name="document-text-outline" size={32} color="#0ea5e9" />
            <Text style={styles.serviceTitle}>Golden Visa</Text>
            <Text style={styles.serviceDesc}>Check eligibility</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.serviceCard}>
            <Ionicons name="calculator-outline" size={32} color="#0ea5e9" />
            <Text style={styles.serviceTitle}>EMI Calculator</Text>
            <Text style={styles.serviceDesc}>Plan your finance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.serviceCard}>
            <Ionicons name="people-outline" size={32} color="#0ea5e9" />
            <Text style={styles.serviceTitle}>Refer & Earn</Text>
            <Text style={styles.serviceDesc}>Get rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.serviceCard}>
            <Ionicons name="chatbubbles-outline" size={32} color="#0ea5e9" />
            <Text style={styles.serviceTitle}>Expert Help</Text>
            <Text style={styles.serviceDesc}>Get guidance</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchText: { marginLeft: 8, color: '#9ca3af', fontSize: 16 },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  seeAll: { color: '#0ea5e9', fontSize: 14 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  actionCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, alignItems: 'center', width: '23%' },
  actionText: { marginTop: 8, fontSize: 12, color: '#374151' },
  propertyCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginRight: 12, width: 200 },
  propertyImage: { height: 120, backgroundColor: '#e5e7eb', borderRadius: 8 },
  propertyTitle: { marginTop: 8, fontSize: 16, fontWeight: '600', color: '#1f2937' },
  propertyLocation: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  propertyPrice: { fontSize: 16, fontWeight: 'bold', color: '#0ea5e9', marginTop: 8 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 },
  serviceCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, alignItems: 'center', width: '48%', marginBottom: 12 },
  serviceTitle: { marginTop: 8, fontSize: 14, fontWeight: '600', color: '#1f2937' },
  serviceDesc: { fontSize: 12, color: '#6b7280', marginTop: 4 },
});
