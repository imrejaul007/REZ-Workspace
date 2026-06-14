/**
 * Ride Details Screen
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { Button } from '../../components/Button';
import { api } from '../../services/api';

interface RideDetail {
  _id: string;
  title: string;
  status: string;
  startTime: string;
  endTime?: string;
  bikeId: {
    nickname: string;
    make: string;
    model;
  };
  route: {
    distance: number;
    startLocation: { name?: string; address?: string };
    endLocation?: { name?: string; address?: string };
    track: Array<{ coordinates: [number, number]; timestamp: string }>;
    waypoints: Array<{ name?: string; type: string; timestamp: string }>;
  };
  stats: {
    distance: number;
    avgSpeed: number;
    maxSpeed: number;
    avgAltitude: number;
    maxAltitude: number;
    duration: number;
  };
  expenses: {
    fuel: number;
    tolls: number;
    food: number;
    total: number;
  };
  memory?: {
    title: string;
    story: string;
    highlights: string[];
    hashtags: string[];
    coverImage?: string;
  };
  companions: Array<{ displayName: string; avatar?: string }>;
}

export default function RideDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ride, setRide] = useState<RideDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadRide();
    }
  }, [id]);

  const loadRide = async () => {
    try {
      setLoading(true);
      const data = await api.getRide(id!);
      setRide(data);
    } catch (error) {
      console.error('Failed to load ride:', error);
      Alert.alert('Error', 'Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  const handleShare = async () => {
    if (!ride) return;

    const shareText = `🏍️ ${ride.title}\n\n` +
      `📍 ${ride.route.startLocation.name || 'Start'} → ${ride.route.endLocation?.name || 'End'}\n` +
      `📏 ${ride.stats.distance.toFixed(1)} km\n` +
      `⏱️ ${formatDuration(ride.stats.duration)}\n` +
      `⚡ Avg: ${ride.stats.avgSpeed.toFixed(0)} km/h | Max: ${ride.stats.maxSpeed.toFixed(0)} km/h\n\n` +
      `Shared via RiderCircle 🚴`;

    try {
      await Share.share({
        message: shareText,
        title: ride.title,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleGenerateMemory = async () => {
    if (!ride) return;

    try {
      const memory = await api.generateMemory(ride._id);
      setRide({ ...ride, memory: memory });
      Alert.alert('Success', 'Ride memory generated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate memory');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Ride not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Text style={styles.shareText}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Ride Header */}
        <View style={styles.rideHeader}>
          <Text style={styles.rideTitle}>{ride.title}</Text>
          <Text style={styles.rideDate}>{formatDate(ride.startTime)}</Text>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>
              🕐 {formatTime(ride.startTime)}
              {ride.endTime && ` - ${formatTime(ride.endTime)}`}
            </Text>
          </View>
        </View>

        {/* Route */}
        <Card style={styles.routeCard}>
          <CardHeader title="Route" />
          <CardBody>
            <View style={styles.routeInfo}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, styles.routeDotStart]} />
                <View>
                  <Text style={styles.routeLabel}>Start</Text>
                  <Text style={styles.routeValue}>
                    {ride.route.startLocation.name || ride.route.startLocation.address || 'Unknown'}
                  </Text>
                </View>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, styles.routeDotEnd]} />
                <View>
                  <Text style={styles.routeLabel}>End</Text>
                  <Text style={styles.routeValue}>
                    {ride.route.endLocation?.name || ride.route.endLocation?.address || 'Not recorded'}
                  </Text>
                </View>
              </View>
            </View>
          </CardBody>
        </Card>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <CardHeader title="Statistics" />
          <CardBody>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{ride.stats.distance.toFixed(1)}</Text>
                <Text style={styles.statLabel}>km</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatDuration(ride.stats.duration)}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{ride.stats.avgSpeed.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Avg km/h</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{ride.stats.maxSpeed.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Max km/h</Text>
              </View>
              {ride.stats.maxAltitude > 0 && (
                <>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{ride.stats.maxAltitude.toFixed(0)}</Text>
                    <Text style={styles.statLabel}>Max Alt m</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{ride.stats.avgAltitude.toFixed(0)}</Text>
                    <Text style={styles.statLabel}>Avg Alt m</Text>
                  </View>
                </>
              )}
            </View>
          </CardBody>
        </Card>

        {/* Expenses */}
        {ride.expenses.total > 0 && (
          <Card style={styles.expensesCard}>
            <CardHeader title="Expenses" />
            <CardBody>
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>⛽ Fuel</Text>
                <Text style={styles.expenseValue}>₹{ride.expenses.fuel}</Text>
              </View>
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>🛣️ Tolls</Text>
                <Text style={styles.expenseValue}>₹{ride.expenses.tolls}</Text>
              </View>
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>🍔 Food</Text>
                <Text style={styles.expenseValue}>₹{ride.expenses.food}</Text>
              </View>
              <View style={[styles.expenseRow, styles.expenseTotal]}>
                <Text style={styles.expenseTotalLabel}>Total</Text>
                <Text style={styles.expenseTotalValue}>₹{ride.expenses.total}</Text>
              </View>
            </CardBody>
          </Card>
        )}

        {/* Waypoints */}
        {ride.route.waypoints.length > 0 && (
          <Card style={styles.waypointsCard}>
            <CardHeader title={`Waypoints (${ride.route.waypoints.length})`} />
            <CardBody>
              {ride.route.waypoints.map((wp, index) => (
                <View key={index} style={styles.waypointRow}>
                  <Text style={styles.waypointIcon}>
                    {wp.type === 'fuel' ? '⛽' : wp.type === 'food' ? '🍔' : '📍'}
                  </Text>
                  <View>
                    <Text style={styles.waypointName}>{wp.name || wp.type}</Text>
                    <Text style={styles.waypointTime}>
                      {formatTime(wp.timestamp)}
                    </Text>
                  </View>
                </View>
              ))}
            </CardBody>
          </Card>
        )}

        {/* Memory */}
        <Card style={styles.memoryCard}>
          <CardHeader
            title="Ride Memory"
            right={
              !ride.memory ? (
                <Button
                  title="Generate"
                  onPress={handleGenerateMemory}
                  size="small"
                />
              ) : undefined
            }
          />
          {ride.memory ? (
            <CardBody>
              <Text style={styles.memoryTitle}>{ride.memory.title}</Text>
              <Text style={styles.memoryStory}>{ride.memory.story}</Text>
              {ride.memory.highlights.length > 0 && (
                <View style={styles.highlights}>
                  {ride.memory.highlights.map((h, i) => (
                    <View key={i} style={styles.highlightChip}>
                      <Text style={styles.highlightText}>{h}</Text>
                    </View>
                  ))}
                </View>
              )}
              {ride.memory.hashtags.length > 0 && (
                <View style={styles.hashtags}>
                  {ride.memory.hashtags.map((tag, i) => (
                    <Text key={i} style={styles.hashtag}>{tag}</Text>
                  ))}
                </View>
              )}
            </CardBody>
          ) : (
            <CardBody>
              <Text style={styles.noMemory}>
                Generate an AI-powered memory to capture your ride experience!
              </Text>
            </CardBody>
          )}
        </Card>

        {/* Bike Info */}
        <Card style={styles.bikeCard}>
          <CardHeader title="Bike" />
          <CardBody>
            <View style={styles.bikeInfo}>
              <Text style={styles.bikeIcon}>🏍️</Text>
              <View>
                <Text style={styles.bikeName}>
                  {ride.bikeId?.nickname || `${ride.bikeId?.make} ${ride.bikeId?.model}`}
                </Text>
                {ride.bikeId?.make && (
                  <Text style={styles.bikeDetails}>
                    {ride.bikeId.make} {ride.bikeId.model}
                  </Text>
                )}
              </View>
            </View>
          </CardBody>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="View on Map"
            variant="outline"
            onPress={() => router.push(`/ride/${ride._id}/map`)}
            fullWidth
          />
        </View>
      </ScrollView>
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
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareText: {
    fontSize: 18,
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
  emptyText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
  },
  rideHeader: {
    padding: 16,
    alignItems: 'center',
  },
  rideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  rideDate: {
    fontSize: 14,
    color: '#888',
  },
  timeRow: {
    marginTop: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#e94560',
  },
  routeCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  routeInfo: {
    paddingLeft: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  routeDotStart: {
    backgroundColor: '#4ade80',
  },
  routeDotEnd: {
    backgroundColor: '#e94560',
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: '#2a2a4e',
    marginLeft: 5,
    marginVertical: 4,
  },
  routeLabel: {
    fontSize: 12,
    color: '#888',
  },
  routeValue: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    width: '31%',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e94560',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  expensesCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  expenseLabel: {
    fontSize: 14,
    color: '#fff',
  },
  expenseValue: {
    fontSize: 14,
    color: '#888',
  },
  expenseTotal: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    marginTop: 8,
    paddingTop: 12,
  },
  expenseTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  expenseTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e94560',
  },
  waypointsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  waypointIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  waypointName: {
    fontSize: 14,
    color: '#fff',
  },
  waypointTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  memoryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  memoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  memoryStory: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 12,
  },
  highlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  highlightChip: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  highlightText: {
    fontSize: 12,
    color: '#fff',
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtag: {
    fontSize: 12,
    color: '#e94560',
  },
  noMemory: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    padding: 16,
  },
  bikeCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  bikeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bikeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  bikeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  bikeDetails: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
});