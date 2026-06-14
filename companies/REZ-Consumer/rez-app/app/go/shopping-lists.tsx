'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface ListItem {
  productId: string;
  name: string;
  brand: string;
  lastPrice: number;
  estimatedPrice: number;
  frequency: string;
  nextPurchaseDate: string;
  priority: 'high' | 'medium' | 'low';
  priceStatus: 'good' | 'wait' | 'expensive';
}

interface ShoppingList {
  listId: string;
  name: string;
  items: ListItem[];
  estimatedTotal: number;
  potentialCashback: number;
}

export default function ShoppingListsScreen() {
  const [activeList, setActiveList] = useState<'monthly' | 'weekly'>('monthly');

  // Mock data
  const mockList: ShoppingList = {
    listId: 'LIST-ABC123',
    name: 'Monthly Essentials',
    estimatedTotal: 4850,
    potentialCashback: 97,
    items: [
      {
        productId: 'P1',
        name: 'Amul Butter 500g',
        brand: 'Amul',
        lastPrice: 275,
        estimatedPrice: 280,
        frequency: '2x/month',
        nextPurchaseDate: '2026-06-01',
        priority: 'high',
        priceStatus: 'good',
      },
      {
        productId: 'P2',
        name: 'Tata Salt 1kg',
        brand: 'Tata',
        lastPrice: 22,
        estimatedPrice: 22,
        frequency: '1x/month',
        nextPurchaseDate: '2026-06-05',
        priority: 'medium',
        priceStatus: 'good',
      },
      {
        productId: 'P3',
        name: 'Maggi 2-Minute Noodles',
        brand: 'Nestle',
        lastPrice: 12,
        estimatedPrice: 14,
        frequency: '3x/month',
        nextPurchaseDate: '2026-06-02',
        priority: 'high',
        priceStatus: 'wait',
      },
      {
        productId: 'P4',
        name: 'Fortune Sunflower Oil 1L',
        brand: 'Adani',
        lastPrice: 160,
        estimatedPrice: 170,
        frequency: '1x/month',
        nextPurchaseDate: '2026-06-10',
        priority: 'medium',
        priceStatus: 'good',
      },
      {
        productId: 'P5',
        name: 'India Gate Basmati Rice 5kg',
        brand: 'India Gate',
        lastPrice: 420,
        estimatedPrice: 450,
        frequency: '1x/2months',
        nextPurchaseDate: '2026-07-01',
        priority: 'low',
        priceStatus: 'expensive',
      },
      {
        productId: 'P6',
        name: 'Parle-G Biscuits',
        brand: 'Parle',
        lastPrice: 30,
        estimatedPrice: 32,
        frequency: '4x/month',
        nextPurchaseDate: '2026-05-30',
        priority: 'high',
        priceStatus: 'good',
      },
    ],
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      default: return '#22C55E';
    }
  };

  const getPriceStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return { icon: '💚', text: 'Good price' };
      case 'wait': return { icon: '⏳', text: 'Wait for better' };
      default: return { icon: '🔴', text: 'Expensive' };
    }
  };

  const highPriority = mockList.items.filter(i => i.priority === 'high');
  const mediumPriority = mockList.items.filter(i => i.priority === 'medium');
  const lowPriority = mockList.items.filter(i => i.priority === 'low');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shopping Lists</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ New List</Text>
        </TouchableOpacity>
      </View>

      {/* List Type Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeList === 'monthly' && styles.tabActive]}
          onPress={() => setActiveList('monthly')}>
          <Text style={[styles.tabText, activeList === 'monthly' && styles.tabTextActive]}>
            📅 Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeList === 'weekly' && styles.tabActive]}
          onPress={() => setActiveList('weekly')}>
          <Text style={[styles.tabText, activeList === 'weekly' && styles.tabTextActive]}>
            📆 Weekly
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.listName}>{mockList.name}</Text>
          <Text style={styles.itemCount}>{mockList.items.length} items</Text>
        </View>
        <View style={styles.summaryRight}>
          <View style={styles.estimate}>
            <Text style={styles.estimateLabel}>Estimated</Text>
            <Text style={styles.estimateValue}>₹{mockList.estimatedTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.cashback}>
            <Text style={styles.cashbackIcon}>💰</Text>
            <Text style={styles.cashbackValue}>+₹{mockList.potentialCashback}</Text>
          </View>
        </View>
      </View>

      {/* Quick Add Button */}
      <TouchableOpacity style={styles.quickAddButton}>
        <Text style={styles.quickAddIcon}>🛒</Text>
        <Text style={styles.quickAddText}>Quick Add Items</Text>
      </TouchableOpacity>

      {/* Items by Priority */}
      {highPriority.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.priorityDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.sectionTitle}>Need Soon ({highPriority.length})</Text>
          </View>
          {highPriority.map((item) => {
            const status = getPriceStatusIcon(item.priceStatus);
            return (
              <View key={item.productId} style={styles.itemCard}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemFreq}>{item.frequency}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.itemNext}>
                      {new Date(item.nextPurchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemPrice}>₹{item.estimatedPrice}</Text>
                  <View style={styles.statusBadge}>
                    <Text>{status.icon}</Text>
                    <Text style={styles.statusText}>{status.text}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {mediumPriority.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.priorityDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.sectionTitle}>This Month ({mediumPriority.length})</Text>
          </View>
          {mediumPriority.map((item) => {
            const status = getPriceStatusIcon(item.priceStatus);
            return (
              <View key={item.productId} style={styles.itemCard}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemFreq}>{item.frequency}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.itemNext}>
                      {new Date(item.nextPurchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemPrice}>₹{item.estimatedPrice}</Text>
                  <View style={styles.statusBadge}>
                    <Text>{status.icon}</Text>
                    <Text style={styles.statusText}>{status.text}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {lowPriority.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.priorityDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.sectionTitle}>Later ({lowPriority.length})</Text>
          </View>
          {lowPriority.map((item) => {
            const status = getPriceStatusIcon(item.priceStatus);
            return (
              <View key={item.productId} style={styles.itemCard}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemFreq}>{item.frequency}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.itemNext}>
                      {new Date(item.nextPurchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemPrice}>₹{item.estimatedPrice}</Text>
                  <View style={styles.statusBadge}>
                    <Text>{status.icon}</Text>
                    <Text style={styles.statusText}>{status.text}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* AI Insight */}
      <View style={styles.insightCard}>
        <Text style={styles.insightIcon}>🤖</Text>
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>Smart Insight</Text>
          <Text style={styles.insightText}>
            Based on your shopping patterns, prices for Maggi are expected to drop 10% after June 15th. Consider waiting for better deals!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#22C55E',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    flexDirection: 'row',
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  summaryLeft: {
    flex: 1,
  },
  listName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  itemCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  estimate: {
    alignItems: 'flex-end',
  },
  estimateLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  estimateValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  cashback: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  cashbackIcon: {
    fontSize: 14,
  },
  cashbackValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    gap: 8,
  },
  quickAddIcon: {
    fontSize: 20,
  },
  quickAddText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4338CA',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  itemCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemBrand: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  itemFreq: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  metaDot: {
    fontSize: 11,
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  itemNext: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#6B7280',
  },
  insightCard: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    gap: 12,
  },
  insightIcon: {
    fontSize: 24,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  insightText: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 4,
    lineHeight: 18,
  },
});
