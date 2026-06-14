import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { FlashList, FlashListProps } from '@shopify/flash-list';

/** FlashList does not expose estimatedItemSize in its prop types (library limitation). */
type FlashListWithEstimated<T> = Omit<FlashListProps<T>, 'estimatedItemSize'> & {
  estimatedItemSize?: number;
};

function TypedFlashList<T>(props: FlashListWithEstimated<T>) {
  return <FlashList {...props} />;
}
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

interface Customer {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastVisit: string;
  lifetimeValue: number;
  segment: 'champion' | 'loyal' | 'atrisk' | 'lapsed' | 'new';
  segmentLabel: string;
}

type SegmentType = 'all' | 'champions' | 'atrisk' | 'lapsed' | 'new';

interface SegmentCounts {
  all: number;
  champions: number;
  atrisk: number;
  lapsed: number;
  new: number;
}

export default function CRMScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<SegmentType>('all');
  const [segmentCounts, setSegmentCounts] = useState<SegmentCounts>({
    all: 0,
    champions: 0,
    atrisk: 0,
    lapsed: 0,
    new: 0,
  });
  // Timers must not be stored in state — state updates cause re-renders and
  // the stale closure would hold a reference to the wrong timer. useRef holds a mutable
  // reference that does not trigger re-renders.
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCustomers = useCallback(
    async (showRefreshing = false, query = '') => {
      try {
        if (showRefreshing) setRefreshing(true);
        else setIsLoading(true);

        const params: Record<string, unknown> = {};
        if (query) params.q = query;
        if (selectedSegment !== 'all') params.segment = selectedSegment;

        const response = await apiClient.get<Customer[]>('/merchant/customers', { params });

        if (response.success && response.data) {
          const customerList = Array.isArray(response.data) ? response.data : [];
          setCustomers(customerList);
          setFilteredCustomers(customerList);

          // Calculate segment counts
          const counts: SegmentCounts = {
            all: customerList.length,
            champions: customerList.filter((c) => c.segment === 'champion').length,
            atrisk: customerList.filter((c) => c.segment === 'atrisk').length,
            lapsed: customerList.filter((c) => c.segment === 'lapsed').length,
            new: customerList.filter((c) => c.segment === 'new').length,
          };
          setSegmentCounts(counts);
        } else {
          showAlert('Error', response.message || 'Failed to load customers');
        }
      } catch (error) {
        if (__DEV__) console.error('Error fetching customers:', error);
        showAlert('Error', error?.message || 'Failed to load customers');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [selectedSegment]
  );

  useEffect(() => {
    fetchCustomers();
  }, [selectedSegment, fetchCustomers]);

  const handleSearchChange = (text: string) => {
    setSearchText(text);

    // Cancel previous timer via ref (not state)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    // Set new timer for debounced search
    searchTimerRef.current = setTimeout(() => {
      searchTimerRef.current = null;
      if (text.trim()) {
        fetchCustomers(false, text);
      } else {
        setFilteredCustomers(customers);
      }
    }, 300);
  };

  const handleRefresh = () => {
    fetchCustomers(true, searchText);
  };

  const getSegmentColor = (segment: string): string => {
    switch (segment) {
      case 'champion':
        return Colors.light.success;
      case 'loyal':
        return Colors.light.tint;
      case 'atrisk':
        return Colors.light.warning;
      case 'lapsed':
        return Colors.light.error;
      case 'new':
        return Colors.light.info;
      default:
        return Colors.light.icon;
    }
  };

  const getSegmentLabel = (segment: string): string => {
    switch (segment) {
      case 'champion':
        return 'Champion';
      case 'loyal':
        return 'Loyal';
      case 'atrisk':
        return 'At Risk';
      case 'lapsed':
        return 'Lapsed';
      case 'new':
        return 'New';
      default:
        return segment;
    }
  };

  const renderCustomerCard = ({ item }: { item: Customer }) => (
    <TouchableOpacity style={styles.customerCard} onPress={() => router.push(`/crm/${item.id}`)}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {item.avatar ? (
            <ThemedText style={styles.avatarText}>{item.avatar}</ThemedText>
          ) : (
            <Ionicons name="person-circle" size={40} color={Colors.light.icon} />
          )}
        </View>
        <View style={styles.customerInfo}>
          <ThemedText style={styles.customerName}>{item.name}</ThemedText>
          <ThemedText style={styles.customerPhone}>
            <Ionicons name="call" size={12} /> {item.phone}
          </ThemedText>
        </View>
      </View>

      <View style={styles.statsRow}>
        <ThemedText style={styles.statsText}>
          Last visit: {item.lastVisit} · ₹{item.lifetimeValue.toLocaleString()} lifetime
        </ThemedText>
      </View>

      <View style={styles.segmentRow}>
        <View
          style={[styles.segmentBadge, { backgroundColor: `${getSegmentColor(item.segment)}20` }]}
        >
          <ThemedText style={[styles.segmentBadgeText, { color: getSegmentColor(item.segment) }]}>
            {getSegmentLabel(item.segment)}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading customers...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Customer CRM</ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={20} color={Colors.light.icon} />
            <TextInput
              style={styles.searchField}
              placeholder="Search by name or phone..."
              placeholderTextColor={Colors.light.icon}
              value={searchText}
              onChangeText={handleSearchChange}
            />
            {searchText && (
              <TouchableOpacity onPress={() => handleSearchChange('')}>
                <Ionicons name="close-circle" size={20} color={Colors.light.icon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Segment Tabs */}
        <View style={styles.segmentTabs}>
          {[
            { key: 'all' as SegmentType, label: 'All', count: segmentCounts.all },
            { key: 'champions' as SegmentType, label: 'Champions', count: segmentCounts.champions },
            { key: 'atrisk' as SegmentType, label: 'At Risk', count: segmentCounts.atrisk },
            { key: 'lapsed' as SegmentType, label: 'Lapsed', count: segmentCounts.lapsed },
            { key: 'new' as SegmentType, label: 'New', count: segmentCounts.new },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.segmentTab, selectedSegment === tab.key && styles.segmentTabActive]}
              onPress={() => setSelectedSegment(tab.key)}
            >
              <ThemedText
                style={[
                  styles.segmentTabText,
                  selectedSegment === tab.key && styles.segmentTabTextActive,
                ]}
              >
                {tab.label}
              </ThemedText>
              {tab.count > 0 && (
                <ThemedText
                  style={[
                    styles.segmentTabCount,
                    selectedSegment === tab.key && styles.segmentTabCountActive,
                  ]}
                >
                  {tab.count}
                </ThemedText>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Customers List */}
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="people" size={64} color={Colors.light.icon} />
            <ThemedText style={styles.emptyStateTitle}>No customers found</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              {searchText ? 'Try a different search' : 'No customers in this segment'}
            </ThemedText>
          </View>
        ) : (
          <TypedFlashList
            data={filteredCustomers}
            renderItem={renderCustomerCard}
            keyExtractor={(item: Customer) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.customersList}
            estimatedItemSize={80}
          />
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.card,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchField: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  segmentTabs: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 8,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  segmentTabActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  segmentTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
  },
  segmentTabTextActive: {
    color: Colors.light.card,
  },
  segmentTabCount: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.icon,
    marginTop: 2,
  },
  segmentTabCountActive: {
    color: Colors.light.card,
  },
  customersList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
  },
  customerCard: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  statsRow: {
    marginBottom: 8,
  },
  statsText: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 6,
  },
  segmentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  segmentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
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
  },
});
