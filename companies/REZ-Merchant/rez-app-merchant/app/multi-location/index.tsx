import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';

interface Location {
  id: string;
  name: string;
  address: string;
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  trend: number;
}

export default function MultiLocationDashboard() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/v1/merchant/locations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLocations(data.data || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLocations();
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  const formatTrend = (trend: number) => trend >= 0 ? `+${trend}%` : `${trend}%`;

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.header}>All Locations</Text>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Revenue</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(locations.reduce((sum, l) => sum + l.revenue, 0))}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Orders</Text>
          <Text style={styles.summaryValue}>
            {locations.reduce((sum, l) => sum + l.orders, 0)}
          </Text>
        </View>
      </View>

      {/* Location List */}
      {locations.map((location) => (
        <TouchableOpacity key={location.id} style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={[styles.trend, location.trend >= 0 ? styles.trendUp : styles.trendDown]}>
              {formatTrend(location.trend)}
            </Text>
          </View>
          <Text style={styles.locationAddress}>{location.address}</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{location.orders}</Text>
              <Text style={styles.metricLabel}>Orders</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{location.customers}</Text>
              <Text style={styles.metricLabel}>Customers</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{formatCurrency(location.avgOrderValue)}</Text>
              <Text style={styles.metricLabel}>AOV</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 24, fontWeight: 'bold', padding: 16 },
  summaryRow: { flexDirection: 'row', padding: 8 },
  summaryCard: { flex: 1, backgroundColor: '#f0f0f0', padding: 16, margin: 4, borderRadius: 8 },
  summaryLabel: { fontSize: 12, color: '#666' },
  summaryValue: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  locationCard: { backgroundColor: '#fff', padding: 16, margin: 8, borderRadius: 12, elevation: 2 },
  locationHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  locationName: { fontSize: 18, fontWeight: '600' },
  locationAddress: { fontSize: 14, color: '#666', marginTop: 4 },
  trend: { fontWeight: '600' },
  trendUp: { color: '#22c55e' },
  trendDown: { color: '#ef4444' },
  metricsRow: { flexDirection: 'row', marginTop: 16 },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 16, fontWeight: 'bold' },
  metricLabel: { fontSize: 12, color: '#666', marginTop: 2 },
});
