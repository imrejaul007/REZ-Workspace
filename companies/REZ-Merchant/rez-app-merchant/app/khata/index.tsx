/**
 * Khata (Customer Credit Book) - List Screen
 * Shows all customers with outstanding credit balance
 */

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert } from '@/components/ui/Alert';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient, ApiResponse } from '@/services/api/client';
import { useAlert } from '@/hooks';

interface KhataCustomer {
  customerId: string;
  customerName: string;
  phone: string;
  balance: number;
  lastTransaction: string;
  transactionCount: number;
}

export default function KhataListScreen() {
  const alert = useAlert();
  const [customers, setCustomers] = useState<KhataCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<KhataCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Client-side filtering only (filterCustomers). SearchQuery is excluded from deps
  // to prevent a new API call on every keystroke. Filtering happens locally
  // via handleSearch after the data is loaded.
  const fetchKhataData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);

      const response = await apiClient.get<KhataCustomer[]>('/merchant/khata');

      if (response.success && response.data) {
        setCustomers(response.data);
        setFilteredCustomers(response.data);
      } else {
        alert.show('Error', response.message || 'Failed to load khata data', 'error');
      }
    } catch (error) {
      logger.error('Error fetching khata data:', error);
      alert.show('Error', error?.message || 'Failed to load khata data', 'error');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchKhataData();
  }, [fetchKhataData]);

  const filterCustomers = (data: KhataCustomer[], query: string) => {
    if (!query.trim()) {
      setFilteredCustomers(data);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = data.filter(
      (customer) =>
        customer.customerName.toLowerCase().includes(lowerQuery) ||
        customer.phone.includes(lowerQuery)
    );
    setFilteredCustomers(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterCustomers(customers, text);
  };

  const handleRefresh = () => {
    fetchKhataData(true);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) {
      return Colors.light.error; // Red - merchant credit owed
    } else if (balance < 0) {
      return Colors.light.success; // Green - advance paid by customer
    }
    return Colors.light.text;
  };

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    return `₹${absAmount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      }
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading khata...</ThemedText>
      </ThemedView>
    );
  }

  const renderCustomerRow = useCallback(
    ({ item }: { item: KhataCustomer }) => (
      <TouchableOpacity
        style={styles.customerRow}
        onPress={() => router.push(`/khata/${item.customerId}`)}
      >
        <View style={styles.customerInfo}>
          <ThemedText style={styles.customerName}>{item.customerName}</ThemedText>
          <ThemedText style={styles.customerPhone}>{item.phone}</ThemedText>
          <ThemedText style={styles.transactionInfo}>
            {item.transactionCount} transactions • Last: {formatDate(item.lastTransaction)}
          </ThemedText>
        </View>
        <View style={styles.balanceSection}>
          <ThemedText style={[styles.balance, { color: getBalanceColor(item.balance) }]}>
            {item.balance > 0 ? '+' : ''}
            {formatCurrency(item.balance)}
          </ThemedText>
          <Ionicons name="chevron-forward" size={24} color={Colors.light.icon} />
        </View>
      </TouchableOpacity>
    ),
    []
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Khata</ThemedText>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/khata/add')}>
          <Ionicons name="add" size={28} color={Colors.light.card} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.light.icon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone"
          placeholderTextColor={Colors.light.icon}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close" size={20} color={Colors.light.icon} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="receipt" size={64} color={Colors.light.icon} />
          <ThemedText style={styles.emptyStateTitle}>No khata entries yet</ThemedText>
          <ThemedText style={styles.emptyStateText}>
            {searchQuery
              ? 'No customers match your search'
              : 'Start by adding a customer to create khata entries'}
          </ThemedText>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/khata/add')}
            >
              <ThemedText style={styles.emptyStateButtonText}>Add Customer</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerRow}
          keyExtractor={(item) => item.customerId}
          scrollEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/khata/add')}>
        <Ionicons name="add" size={32} color={Colors.light.card} />
      </TouchableOpacity>

      <Alert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={(alert.type as 'success' | 'error' | 'warning' | 'info') || 'info'}
        onClose={alert.close}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.card,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    paddingVertical: 4,
    fontSize: 14,
    color: Colors.light.text,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 13,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  transactionInfo: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  balanceSection: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  balance: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: Colors.light.card,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
