'use client';

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';

interface ReceiptItem {
  receiptId: string;
  storeName: string;
  date: string;
  total: number;
  items: Array<{ name: string; quantity: number }>;
}

interface ReorderSuggestion {
  productId: string;
  name: string;
  lastPrice: number;
  frequency: string;
}

interface SpendingInsight {
  totalSpent: number;
  totalSaved: number;
  totalCashback: number;
  avgOrder: number;
}

export default function SmartReceiptsScreen() {
  const [activeTab, setActiveTab] = useState<'search' | 'reorder' | 'insights'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReceiptItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Mock data
  const mockReceipts: ReceiptItem[] = [
    {
      receiptId: 'GORE-ABC123',
      storeName: 'BigBasket Koramangala',
      date: '2026-05-28T10:30:00Z',
      total: 1250,
      items: [
        { name: 'Amul Butter 500g', quantity: 1 },
        { name: 'Tata Salt 1kg', quantity: 2 },
        { name: 'Maggi 2-Minute Noodles', quantity: 3 },
      ],
    },
    {
      receiptId: 'GORE-DEF456',
      storeName: 'Apollo Pharmacy',
      date: '2026-05-25T15:45:00Z',
      total: 450,
      items: [
        { name: 'Vitamin D3 60k', quantity: 1 },
      ],
    },
  ];

  const mockReorder: ReorderSuggestion[] = [
    { productId: 'P1', name: 'Amul Butter 500g', lastPrice: 275, frequency: 'Every 2 weeks' },
    { productId: 'P2', name: 'Tata Salt 1kg', lastPrice: 22, frequency: 'Every month' },
    { productId: 'P3', name: 'Maggi 2-Minute Noodles', lastPrice: 12, frequency: 'Every 3 weeks' },
  ];

  const mockInsights: SpendingInsight = {
    totalSpent: 15840,
    totalSaved: 3240,
    totalCashback: 485,
    avgOrder: 528,
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);

    // Simulate API call
    setTimeout(() => {
      const filtered = mockReceipts.filter(r =>
        r.items.some(i => i.name.toLowerCase().includes(query.toLowerCase())) ||
        r.storeName.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setSearching(false);
    }, 500);
  }, [query]);

  const handleNaturalQuery = (q: string) => {
    setQuery(q);
  };

  const renderReceipt = ({ item }: { item: ReceiptItem }) => (
    <TouchableOpacity style={styles.receiptCard}>
      <View style={styles.receiptHeader}>
        <View>
          <Text style={styles.storeName}>{item.storeName}</Text>
          <Text style={styles.date}>
            {new Date(item.date).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        <Text style={styles.total}>₹{item.total}</Text>
      </View>
      <View style={styles.items}>
        {item.items.slice(0, 3).map((i, idx) => (
          <Text key={idx} style={styles.itemText}>
            {i.quantity}x {i.name}
          </Text>
        ))}
        {item.items.length > 3 && (
          <Text style={styles.moreText}>+{item.items.length - 3} more items</Text>
        )}
      </View>
      <TouchableOpacity style={styles.reorderButton}>
        <Text style={styles.reorderButtonText}>↻ Reorder</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderReorderItem = ({ item }: { item: ReorderSuggestion }) => (
    <TouchableOpacity style={styles.reorderCard}>
      <View style={styles.reorderInfo}>
        <Text style={styles.reorderName}>{item.name}</Text>
        <Text style={styles.reorderFreq}>{item.frequency}</Text>
      </View>
      <View style={styles.reorderPrice}>
        <Text style={styles.lastPrice}>₹{item.lastPrice}</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Smart Receipts</Text>
        <Text style={styles.subtitle}>Search, reorder & track spending</Text>
      </View>

      {/* Natural Query Suggestions */}
      <View style={styles.suggestions}>
        <TouchableOpacity
          style={styles.suggestionChip}
          onPress={() => handleNaturalQuery('When did I buy milk?')}>
          <Text style={styles.suggestionText}>🕐 When did I buy milk?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.suggestionChip}
          onPress={() => handleNaturalQuery('Show me all purchases last month')}>
          <Text style={styles.suggestionText}>📅 Last month</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.suggestionChip}
          onPress={() => handleNaturalQuery('Reorder toothpaste')}>
          <Text style={styles.suggestionText}>↻ Reorder</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Ask anything... 'When did I buy...' "
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{mockInsights.totalSpent.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#22C55E' }]}>
            ₹{mockInsights.totalSaved.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            ₹{mockInsights.totalCashback}
          </Text>
          <Text style={styles.statLabel}>Cashback</Text>
        </View>
      </View>

      {/* Recent Receipts */}
      <FlatList
        data={results.length > 0 ? results : mockReceipts}
        keyExtractor={(item) => item.receiptId}
        renderItem={renderReceipt}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No receipts found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  suggestionChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  suggestionText: {
    fontSize: 13,
    color: '#4B5563',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    marginLeft: 12,
    width: 48,
    height: 48,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  total: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22C55E',
  },
  items: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  moreText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  reorderButton: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  reorderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  reorderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reorderInfo: {
    flex: 1,
  },
  reorderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  reorderFreq: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  reorderPrice: {
    alignItems: 'flex-end',
  },
  lastPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
