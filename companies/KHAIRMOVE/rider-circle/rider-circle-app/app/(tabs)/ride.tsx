import { View, Text, StyleSheet, TouchableOpacity, useRouter } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function RideScreen() {
  const router = useRouter();
  const [isRiding, setIsRiding] = useState(false);

  return (
    <View style={styles.container}>
      {!isRiding ? (
        <StartRideView onStart={() => setIsRiding(true)} />
      ) : (
        <ActiveRideView onStop={() => setIsRiding(false)} />
      )}
    </View>
  );
}

function StartRideView({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.startContainer}>
      <Text style={styles.bikeIcon}>🏍️</Text>
      <Text style={styles.title}>Ready to Ride?</Text>
      <Text style={styles.subtitle}>Start tracking your adventure</Text>

      <TouchableOpacity style={styles.startButton} onPress={onStart}>
        <Text style={styles.startButtonText}>🚀 Start Ride</Text>
      </TouchableOpacity>

      <View style={styles.quickStats}>
        <QuickStat label="This Week" value="3 rides" />
        <QuickStat label="Distance" value="245 km" />
        <QuickStat label="Time" value="8h 30m" />
      </View>
    </View>
  );
}

function ActiveRideView({ onStop }: { onStop: () => void }) {
  return (
    <View style={styles.activeContainer}>
      <View style={styles.statsContainer}>
        <StatDisplay label="Distance" value="12.4" unit="km" />
        <StatDisplay label="Duration" value="0:32" unit="min" />
        <StatDisplay label="Speed" value="23" unit="km/h" />
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️ Live Map</Text>
        <Text style={styles.mapSubtext}>Tracking your route...</Text>
      </View>

      <View style={styles.waypoints}>
        <Text style={styles.waypointsTitle}>📍 Waypoints</Text>
        <TouchableOpacity style={styles.addWaypoint}>
          <Text style={styles.addWaypointText}>+ Add Stop</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.sosButton}>
          <Text style={styles.sosIcon}>🆘</Text>
          <Text style={styles.sosLabel}>SOS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.stopButton} onPress={onStop}>
          <Text style={styles.stopButtonText}>⏹️ End Ride</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.quickStat}>
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

function StatDisplay({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.statDisplay}>
      <Text style={styles.statDisplayValue}>{value}</Text>
      <Text style={styles.statDisplayUnit}>{unit}</Text>
      <Text style={styles.statDisplayLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  bikeIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 48,
  },
  startButton: {
    backgroundColor: '#e94560',
    paddingVertical: 20,
    paddingHorizontal: 48,
    borderRadius: 30,
    marginBottom: 48,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quickStats: {
    flexDirection: 'row',
    gap: 24,
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  activeContainer: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statDisplay: {
    alignItems: 'center',
  },
  statDisplayValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e94560',
  },
  statDisplayUnit: {
    fontSize: 14,
    color: '#888',
  },
  statDisplayLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapText: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#888',
  },
  waypoints: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  waypointsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  addWaypoint: {
    borderWidth: 1,
    borderColor: '#e94560',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addWaypointText: {
    color: '#e94560',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  sosButton: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: 80,
  },
  sosIcon: {
    fontSize: 24,
  },
  sosLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  stopButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});