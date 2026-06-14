/**
 * REZ Verify QR - Claims Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { verifyQrApi } from '../services/verifyQrApi';
import { Claim } from '../types';

export default function ClaimsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: claims, isLoading, refetch } = useQuery({
    queryKey: ['claims'],
    queryFn: async () => {
      const response = await verifyQrApi.getClaims();
      return response.success ? response.data || [] : [];
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#F59E0B';
      case 'APPROVED':
        return '#10B981';
      case 'REJECTED':
        return '#EF4444';
      case 'RESOLVED':
        return '#6366F1';
      default:
        return '#64748B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳';
      case 'APPROVED':
        return '✅';
      case 'REJECTED':
        return '❌';
      case 'RESOLVED':
        return '🎉';
      default:
        return '❓';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderClaim = ({ item }: { item: Claim }) => (
    <TouchableOpacity style={styles.claimCard}>
      <View style={styles.claimHeader}>
        <Text style={styles.claimIcon}>{getStatusIcon(item.status)}</Text>
        <View style={styles.claimInfo}>
          <Text style={styles.claimIssue}>{item.issue_type.replace('_', ' ')}</Text>
          <Text style={styles.claimSerial}>{item.serial_number}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.claimDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.claimFooter}>
        <Text style={styles.claimDate}>{formatDate(item.created_at)}</Text>
        {item.resolution && (
          <Text style={styles.claimResolution}>Resolved: {item.resolution}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No Claims Yet</Text>
      <Text style={styles.emptyText}>
        When you file a warranty claim, it will appear here.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={claims || []}
        renderItem={renderClaim}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  claimCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  claimIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  claimInfo: {
    flex: 1,
  },
  claimIssue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textTransform: 'capitalize',
  },
  claimSerial: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  claimDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  claimDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  claimResolution: {
    fontSize: 12,
    color: '#10B981',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});
