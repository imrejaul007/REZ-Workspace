/**
 * REZ Atlas Field App
 * Mobile App for Field Sales Teams
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

// API Base URL
const API_BASE = 'http://localhost:5150';

interface Stop {
  id: string;
  merchantId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  priority: number;
  status: 'pending' | 'visited' | 'skipped';
}

interface Route {
  id: string;
  name: string;
  date: string;
  stops: Stop[];
}

export default function FieldApp() {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStop, setActiveStop] = useState<Stop | null>(null);

  useEffect(() => {
    fetchTodayRoute();
  }, []);

  const fetchTodayRoute = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_BASE}/api/routes?date=${today}`);
      const data = await response.json();
      setRoute(data.routes?.[0] || null);
    } catch (error) {
      console.error('Failed to fetch route:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStopStatus = async (stopId: string, status: string) => {
    try {
      await fetch(`${API_BASE}/api/routes/${route?.id}/stops/${stopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      // Update local state
      if (route) {
        const updatedStops = route.stops.map(s =>
          s.id === stopId ? { ...s, status } : s
        );
        setRoute({ ...route, stops: updatedStops });
        setActiveStop(null);
      }
    } catch (error) {
      console.error('Failed to update stop:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading your route...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ REZ Atlas Field</Text>
        <Text style={styles.headerSubtitle}>
          {route?.name || 'No route assigned'}
        </Text>
      </View>

      {/* Route List */}
      <ScrollView style={styles.routeList}>
        {route?.stops.map((stop, index) => (
          <TouchableOpacity
            key={stop.id}
            style={[
              styles.stopCard,
              stop.status === 'visited' && styles.stopVisited,
              stop.status === 'skipped' && styles.stopSkipped,
            ]}
            onPress={() => setActiveStop(stop)}
          >
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopName}>{stop.name}</Text>
              <Text style={styles.stopAddress}>{stop.address}</Text>
              <View style={styles.stopMeta}>
                <Text style={styles.stopPriority}>
                  Priority: {stop.priority === 1 ? '🔥 High' : stop.priority === 2 ? '⚡ Medium' : '📍 Normal'}
                </Text>
                <Text style={[
                  styles.stopStatus,
                  stop.status === 'visited' && styles.statusVisited,
                  stop.status === 'skipped' && styles.statusSkipped,
                ]}>
                  {stop.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {(!route || route.stops.length === 0) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>No stops for today</Text>
            <Text style={styles.emptySubtitle}>
              Your route will appear here when assigned
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Stop Detail Modal */}
      {activeStop && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{activeStop.name}</Text>
            <Text style={styles.modalAddress}>{activeStop.address}</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.visitButton]}
                onPress={() => updateStopStatus(activeStop.id, 'visited')}
              >
                <Text style={styles.actionButtonText}>✅ Mark Visited</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.skipButton]}
                onPress={() => updateStopStatus(activeStop.id, 'skipped')}
              >
                <Text style={styles.actionButtonText}>⏭️ Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.navButton]}
                onPress={() => {
                  // Open maps app for navigation
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${activeStop.lat},${activeStop.lng}`;
                  console.log('Navigate to:', url);
                }}
              >
                <Text style={styles.actionButtonText}>🧭 Navigate</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setActiveStop(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Stats */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {route?.stops.filter(s => s.status === 'visited').length || 0}
          </Text>
          <Text style={styles.statLabel}>Visited</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {route?.stops.filter(s => s.status === 'pending').length || 0}
          </Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {route?.stops.length || 0}
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    backgroundColor: '#374151',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  headerTitle: {
    color: '#60A5FA',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  routeList: {
    flex: 1,
    padding: 16,
  },
  stopCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopVisited: {
    opacity: 0.6,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  stopSkipped: {
    opacity: 0.6,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  stopNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stopAddress: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  stopMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stopPriority: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  stopStatus: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  statusVisited: {
    color: '#10B981',
  },
  statusSkipped: {
    color: '#F59E0B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalAddress: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 24,
  },
  modalActions: {
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  visitButton: {
    backgroundColor: '#10B981',
  },
  skipButton: {
    backgroundColor: '#F59E0B',
  },
  navButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderTopWidth: 1,
    borderTopColor: '#4B5563',
    paddingVertical: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 16,
  },
});