/**
 * My Bikes Screen
 * Displays user's registered bikes
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { Button } from '../../components/Button';
import { api } from '../../services/api';

interface Bike {
  _id: string;
  nickname: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  odometer: number;
  overallHealth: number;
  tireHealth: { front: number; rear: number };
  chainCondition: number;
  brakeHealth: { front: number; rear: number };
  isPrimary: boolean;
}

export default function MyBikesScreen() {
  const router = useRouter();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBikes();
  }, []);

  const loadBikes = async () => {
    try {
      setLoading(true);
      const data = await api.getBikes();
      setBikes(data);
    } catch (error) {
      console.error('Failed to load bikes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return '#4ade80';
    if (health >= 60) return '#facc15';
    if (health >= 40) return '#f97316';
    return '#ef4444';
  };

  const renderBikeCard = ({ item }: { item: Bike }) => (
    <Card
      onPress={() => router.push(`/profile/bike/${item._id}`)}
      variant="elevated"
    >
      <View style={styles.bikeHeader}>
        <View style={styles.bikeIcon}>
          <Text style={styles.bikeIconText}>🏍️</Text>
        </View>
        <View style={styles.bikeInfo}>
          <Text style={styles.bikeName}>{item.nickname || `${item.make} ${item.model}`}</Text>
          <Text style={styles.bikeDetails}>
            {item.year} {item.make} {item.model}
          </Text>
          <Text style={styles.bikeReg}>{item.registrationNumber}</Text>
        </View>
        {item.isPrimary && (
          <View style={styles.primaryBadge}>
            <Text style={styles.primaryBadgeText}>⭐ Primary</Text>
          </View>
        )}
      </View>

      <View style={styles.bikeStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.odometer.toLocaleString()}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.healthIndicator, { backgroundColor: getHealthColor(item.overallHealth) }]}>
            <Text style={styles.healthValue}>{item.overallHealth}%</Text>
          </View>
          <Text style={styles.statLabel}>Health</Text>
        </View>
      </View>

      <View style={styles.healthBars}>
        <HealthBar label="Tires" value={(item.tireHealth.front + item.tireHealth.rear) / 2} />
        <HealthBar label="Chain" value={item.chainCondition} />
        <HealthBar label="Brakes" value={(item.brakeHealth.front + item.brakeHealth.rear) / 2} />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bikes</Text>
        <TouchableOpacity onPress={() => router.push('/profile/add-bike')} style={styles.addButton}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Bike List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading bikes...</Text>
        </View>
      ) : bikes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏍️</Text>
          <Text style={styles.emptyTitle}>No bikes added yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your first bike to start tracking rides
          </Text>
          <Button
            title="Add Your Bike"
            onPress={() => router.push('/profile/add-bike')}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          data={bikes}
          renderItem={renderBikeCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function HealthBar({ label, value }: { label: string; value: number }) {
  const getColor = () => {
    if (value >= 80) return '#4ade80';
    if (value >= 60) return '#facc15';
    if (value >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <View style={styles.healthBar}>
      <View style={styles.healthBarHeader}>
        <Text style={styles.healthBarLabel}>{label}</Text>
        <Text style={[styles.healthBarValue, { color: getColor() }]}>{Math.round(value)}%</Text>
      </View>
      <View style={styles.healthBarTrack}>
        <View
          style={[
            styles.healthBarFill,
            { width: `${value}%`, backgroundColor: getColor() },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 20,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e94560',
    borderRadius: 20,
  },
  addText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  bikeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bikeIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bikeIconText: {
    fontSize: 32,
  },
  bikeInfo: {
    flex: 1,
  },
  bikeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  bikeDetails: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  bikeReg: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  primaryBadge: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  primaryBadgeText: {
    fontSize: 12,
    color: '#facc15',
  },
  bikeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2a2a4e',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  healthIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  healthBars: {
    gap: 8,
  },
  healthBar: {
    marginBottom: 4,
  },
  healthBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  healthBarLabel: {
    fontSize: 12,
    color: '#888',
  },
  healthBarValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  healthBarTrack: {
    height: 6,
    backgroundColor: '#2a2a4e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 32,
  },
});