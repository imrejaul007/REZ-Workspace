// Refunds Screen - View and manage refunds
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useUserStore } from '@/stores';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ChevronRight } from 'lucide-react-native';

interface Refund {
  id: string;
  orderId?: string;
  bookingId?: string;
  type: 'booking' | 'payment' | 'service' | 'other';
  amount?: number;
  reason: string;
  status: 'registered' | 'investigating' | 'resolved' | 'escalated' | 'closed';
  description: string;
  createdAt: string;
  resolution?: string;
}

export default function RefundsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { token, isAuthenticated, profile } = useUserStore();

  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.EXPO_PUBLIC_DO_API_URL || 'http://localhost:3000';

  const loadRefunds = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Load complaints as refunds (they're managed together)
      const response = await fetch(`${API_URL}/do/complaints`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Map complaints to refunds display
        const mappedRefunds: Refund[] = (data.complaints || []).map((c) => ({
          id: c.id,
          reason: c.type,
          description: c.description,
          status: c.status,
          createdAt: c.createdAt,
          resolution: c.resolution,
        }));
        setRefunds(mappedRefunds);
      }
    } catch (error) {
      logger.error('Failed to load refunds:', error);
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRefunds();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, loadRefunds]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRefunds();
    setRefreshing(false);
  };

  const handleCreateRefund = () => {
    Alert.alert(
      'Request Refund',
      'Contact support to request a refund for your booking.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Support',
          onPress: () => {
            // Navigate to complaints to create new
            router.push('/complaints');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return colors.systemGreen;
      case 'investigating':
        return colors.systemOrange;
      case 'escalated':
        return colors.systemRed;
      case 'closed':
        return colors.gray;
      case 'registered':
      default:
        return colors.systemBlue;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      registered: 'Submitted',
      investigating: 'Under Review',
      resolved: 'Resolved',
      escalated: 'Escalated',
      closed: 'Closed',
    };
    return labels[status] || status;
  };

  const renderRefund = ({ item }: { item: Refund }) => (
    <Card style={styles.refundCard}>
      <View style={styles.refundHeader}>
        <View style={styles.refundInfo}>
          <Text style={[styles.refundType, { color: colors.label }]}>
            {item.reason.charAt(0).toUpperCase() + item.reason.slice(1)} Request
          </Text>
          <Text style={[styles.refundId, { color: colors.labelSecondary }]}>
            {item.id}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.labelSecondary }]} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.refundFooter}>
        <Text style={[styles.date, { color: colors.labelTertiary }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        {item.resolution && (
          <View style={styles.resolutionBadge}>
            <Text style={[styles.resolutionText, { color: colors.systemGreen }]}>
              Resolved
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: colors.label }]}>
        No Refund Requests
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.labelSecondary }]}>
        If you've been charged incorrectly, we'll help you get your money back.
      </Text>
      {isAuthenticated && (
        <Button
          variant="primary"
          size="medium"
          onPress={handleCreateRefund}
          style={{ marginTop: 16 }}
        >
          Request Refund
        </Button>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.label }]}>Refunds</Text>
      </View>

      <FlatList
        data={refunds}
        keyExtractor={(item) => item.id}
        renderItem={renderRefund}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
  },
  refundCard: {
    marginBottom: 12,
  },
  refundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  refundInfo: {
    flex: 1,
  },
  refundType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  refundId: {
    fontSize: 12,
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
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  refundFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
  },
  resolutionBadge: {
    backgroundColor: 'rgba(107, 203, 119, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  resolutionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
