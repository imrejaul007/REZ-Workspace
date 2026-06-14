// Complaints Screen - View and manage complaints
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useUserStore } from '@/stores';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

interface Complaint {
  id: string;
  type: string;
  status: 'registered' | 'investigating' | 'resolved' | 'escalated' | 'closed';
  description: string;
  createdAt: string;
  resolution?: string;
}

export default function ComplaintsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { token, isAuthenticated } = useUserStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadComplaints();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadComplaints = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_DO_API_URL || 'http://localhost:3000'}/do/complaints`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComplaints(data.complaints || []);
        }
      } else if (response.status === 401) {
        Alert.alert('Session Expired', 'Please login again', [
          { text: 'OK', onPress: () => router.replace('/auth') },
        ]);
      }
    } catch (error) {
      logger.error('Failed to load complaints:', error);
      // Fallback to empty state
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return colors.systemGreen;
      case 'investigating':
        return colors.systemOrange;
      case 'escalated':
        return colors.systemRed;
      default:
        return colors.gray;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const renderComplaint = ({ item }: { item: Complaint }) => (
    <Card style={styles.complaintCard}>
      <View style={styles.complaintHeader}>
        <Text style={[styles.complaintId, { color: colors.labelSecondary }]}>
          {item.id}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text style={[styles.complaintDesc, { color: colors.label }]} numberOfLines={2}>
        {item.description}
      </Text>

      {item.resolution && (
        <View style={[styles.resolution, { backgroundColor: colors.fillTertiary }]}>
          <Text style={[styles.resolutionLabel, { color: colors.labelSecondary }]}>Resolution:</Text>
          <Text style={[styles.resolutionText, { color: colors.label }]}>
            {item.resolution}
          </Text>
        </View>
      )}

      <Text style={[styles.date, { color: colors.labelTertiary }]}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: colors.label }]}>
        No Complaints
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.labelSecondary }]}>
        If you have unknown issues with your orders, we'll help you resolve them here.
      </Text>
      {isAuthenticated && (
        <Button
          variant="primary"
          size="medium"
          onPress={handleCreateComplaint}
          style={{ marginTop: 16 }}
        >
          Raise a Complaint
        </Button>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.label }]}>My Complaints</Text>
          {isAuthenticated && (
            <TouchableOpacity onPress={handleCreateComplaint}>
              <Text style={[styles.addButton, { color: colors.primary }]}>+ New</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id}
        renderItem={renderComplaint}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadComplaints();
              setRefreshing(false);
            }}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  complaintCard: {
    marginBottom: 12,
    padding: 16,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  complaintId: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  complaintDesc: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  resolution: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resolutionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  resolutionText: {
    fontSize: 14,
  },
  date: {
    fontSize: 12,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
