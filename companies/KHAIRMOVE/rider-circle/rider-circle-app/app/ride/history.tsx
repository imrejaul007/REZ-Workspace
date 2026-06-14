/**
 * Ride History Screen
 */

import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/Card';
import { api } from '../../services/api';

interface Ride {
  _id: string;
  title: string;
  status: string;
  startTime: string;
  route: {
    distance: number;
    startLocation: { name?: string };
    endLocation?: { name?: string };
  };
  stats: {
    avgSpeed: number;
    maxSpeed: number;
    duration: number;
  };
  memory?: {
    coverImage?: string;
  };
}

export default function RideHistoryScreen() {
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadRides = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      }

      const response = await api.getRideHistory(pageNum);

      if (refresh || pageNum === 1) {
        setRides(response.data || []);
      } else {
        setRides(prev => [...prev, ...(response.data || [])]);
      }

      setHasMore(response.pagination.page < response.pagination.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load rides:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRides(1);
  }, []);

  const onRefresh = useCallback(() => {
    loadRides(1, true);
  }, []);

  const onEndReached = () => {
    if (hasMore && !loading) {
      loadRides(page + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const renderRide = ({ item }: { item: Ride }) => (
    <TouchableOpacity onPress={() => router.push(`/ride/${item._id}`)}>
      <Card style={styles.rideCard}>
        <View style={styles.rideHeader}>
          <View style={styles.rideIcon}>
            <Text style={styles.rideIconText}>🏍️</Text>
          </View>
          <View style={styles.rideInfo}>
            <Text style={styles.rideTitle}>{item.title}</Text>
            <Text style={styles.rideDate}>{formatDate(item.startTime)}</Text>
            {item.route.startLocation?.name && (
              <Text style={styles.rideLocation}>
                📍 {item.route.startLocation.name}
                {item.route.endLocation?.name && ` → ${item.route.endLocation.name}`}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rideStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.route.distance.toFixed(1)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDuration(item.stats.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.stats.avgSpeed.toFixed(0)}</Text>
            <Text style={styles.statLabel}>km/h avg</Text>
          </View>
        </View>

        {item.memory?.coverImage && (
          <View style={styles.memoryPreview}>
            <Text style={styles.memoryLabel}>📖 Memory available</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏍️</Text>
      <Text style={styles.emptyTitle}>No rides yet</Text>
      <Text style={styles.emptySubtitle}>
        Start your first ride to see it here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Ride List */}
      <FlatList
        data={rides}
        renderItem={renderRide}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#e94560"
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
      />
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  rideCard: {
    marginBottom: 12,
  },
  rideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rideIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rideIconText: {
    fontSize: 24,
  },
  rideInfo: {
    flex: 1,
  },
  rideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  rideDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  rideLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  rideStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e94560',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2a2a4e',
  },
  memoryPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  memoryLabel: {
    fontSize: 12,
    color: '#facc15',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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
  },
});