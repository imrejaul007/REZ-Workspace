/**
 * MemoryPanel - Genie Memory Display Component
 *
 * Shows what Genie remembers about the user
 *
 * Usage:
 * ```typescript
 * <MemoryPanel userId={userId} />
 * ```
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGenieMemory, Memory, UsualOrder } from '@/hooks/useGenieMemory';

interface MemoryPanelProps {
  userId: string;
  compact?: boolean;
  onMemoryPress?: (memory: Memory) => void;
}

export function MemoryPanel({ userId, compact = false, onMemoryPress }: MemoryPanelProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'memories' | 'preferences' | 'patterns'>('memories');

  const {
    getMemories,
    getFoodPreferences,
    getUsual,
    isLoading,
    recall,
  } = useGenieMemory(userId);

  const { data: memories = [] } = getMemories(20);
  const { data: preferences = null } = getFoodPreferences();
  const { data: usual = null } = getUsual();

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const renderMemoriesTab = () => (
    <View style={styles.tabContent}>
      {memories.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="brain-outline" size={48} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>No memories yet</Text>
          <Text style={styles.emptyText}>
            Genie will remember your preferences as you use the app
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {memories.slice(0, compact ? 3 : 10).map((memory) => (
            <TouchableOpacity
              key={memory.id}
              style={styles.memoryItem}
              onPress={() => onMemoryPress?.(memory)}
            >
              <View style={styles.memoryIcon}>
                <Ionicons
                  name={
                    memory.type === 'preference' ? 'heart' :
                    memory.type === 'transaction' ? 'receipt' :
                    memory.type === 'booking' ? 'calendar' :
                    memory.type === 'fact' ? 'information-circle' :
                    'chatbox'
                  }
                  size={20}
                  color="#6C5CE7"
                />
              </View>
              <View style={styles.memoryContent}>
                <Text style={styles.memoryText} numberOfLines={2}>
                  {memory.content}
                </Text>
                <View style={styles.memoryMeta}>
                  <Text style={styles.memoryType}>{memory.type}</Text>
                  <Text style={styles.memoryDate}>
                    {new Date(memory.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.memoryImportance}>
                {[...Array(5)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.importanceDot,
                      i < memory.importance && styles.importanceDotActive,
                    ]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderPreferencesTab = () => (
    <View style={styles.tabContent}>
      {preferences ? (
        <View style={styles.preferencesGrid}>
          {preferences.cuisines && preferences.cuisines.length > 0 && (
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceTitle}>Favorite Cuisines</Text>
              <View style={styles.preferenceChips}>
                {preferences.cuisines.map((cuisine, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipText}>{cuisine}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {preferences.priceRange && (
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceTitle}>Price Range</Text>
              <View style={styles.preferenceValue}>
                <Ionicons name="cash-outline" size={16} color="#6C5CE7" />
                <Text style={styles.preferenceText}>{preferences.priceRange}</Text>
              </View>
            </View>
          )}

          {preferences.dietary && preferences.dietary.length > 0 && (
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceTitle}>Dietary Preferences</Text>
              <View style={styles.preferenceChips}>
                {preferences.dietary.map((diet, i) => (
                  <View key={i} style={[styles.chip, styles.chipGreen]}>
                    <Text style={[styles.chipText, styles.chipTextGreen]}>{diet}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={48} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>No preferences yet</Text>
          <Text style={styles.emptyText}>
            Order food and Genie will learn your preferences
          </Text>
        </View>
      )}
    </View>
  );

  const renderPatternsTab = () => (
    <View style={styles.tabContent}>
      {usual ? (
        <View style={styles.patternsContainer}>
          <View style={styles.patternCard}>
            <View style={styles.patternHeader}>
              <Ionicons name="star" size={24} color="#F39C12" />
              <Text style={styles.patternTitle}>Your Usual</Text>
            </View>
            {usual.merchant && (
              <View style={styles.patternRow}>
                <Text style={styles.patternLabel}>Merchant:</Text>
                <Text style={styles.patternValue}>{usual.merchant}</Text>
              </View>
            )}
            {usual.cuisine && (
              <View style={styles.patternRow}>
                <Text style={styles.patternLabel}>Cuisine:</Text>
                <Text style={styles.patternValue}>{usual.cuisine}</Text>
              </View>
            )}
            {usual.amount && (
              <View style={styles.patternRow}>
                <Text style={styles.patternLabel}>Average:</Text>
                <Text style={styles.patternValue}>₹{usual.amount}</Text>
              </View>
            )}
            {usual.time && (
              <View style={styles.patternRow}>
                <Text style={styles.patternLabel}>Time:</Text>
                <Text style={styles.patternValue}>{usual.time}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.patternAction}>
            <Ionicons name="repeat" size={20} color="#6C5CE7" />
            <Text style={styles.patternActionText}>Order your usual again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="trending-up-outline" size={48} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Learning your patterns</Text>
          <Text style={styles.emptyText}>
            Genie will identify your habits as you use the app
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="brain" size={24} color="#6C5CE7" />
          <Text style={styles.headerTitle}>Genie Memory</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      {!compact && (
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'memories' && styles.tabActive]}
            onPress={() => setActiveTab('memories')}
          >
            <Text style={[styles.tabText, activeTab === 'memories' && styles.tabTextActive]}>
              Memories
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'preferences' && styles.tabActive]}
            onPress={() => setActiveTab('preferences')}
          >
            <Text style={[styles.tabText, activeTab === 'preferences' && styles.tabTextActive]}>
              Preferences
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'patterns' && styles.tabActive]}
            onPress={() => setActiveTab('patterns')}
          >
            <Text style={[styles.tabText, activeTab === 'patterns' && styles.tabTextActive]}>
              Patterns
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'memories' && renderMemoriesTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
        {activeTab === 'patterns' && renderPatternsTab()}
      </View>

      {/* Footer */}
      {!compact && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton}>
            <Ionicons name="add-circle" size={20} color="#6C5CE7" />
            <Text style={styles.footerButtonText}>Remember this</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton}>
            <Ionicons name="search" size={20} color="#6C5CE7" />
            <Text style={styles.footerButtonText}>Search memories</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  containerCompact: {
    // Compact styling
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginLeft: 8,
  },
  headerRight: {},
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#6C5CE7',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#6C5CE7',
    fontWeight: '600',
  },
  content: {
    minHeight: 200,
  },
  tabContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  memoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memoryContent: {
    flex: 1,
  },
  memoryText: {
    fontSize: 14,
    color: '#1A1A2E',
    lineHeight: 20,
  },
  memoryMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  memoryType: {
    fontSize: 12,
    color: '#6C5CE7',
    marginRight: 8,
    textTransform: 'capitalize',
  },
  memoryDate: {
    fontSize: 12,
    color: '#999',
  },
  memoryImportance: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  importanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    marginLeft: 2,
  },
  importanceDotActive: {
    backgroundColor: '#6C5CE7',
  },
  preferencesGrid: {},
  preferenceSection: {
    marginBottom: 16,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  preferenceChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#F0EBFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  chipGreen: {
    backgroundColor: '#E8F5E9',
  },
  chipText: {
    fontSize: 13,
    color: '#6C5CE7',
    fontWeight: '500',
  },
  chipTextGreen: {
    color: '#4CAF50',
  },
  preferenceValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceText: {
    fontSize: 14,
    color: '#1A1A2E',
    marginLeft: 8,
  },
  patternsContainer: {},
  patternCard: {
    backgroundColor: '#F0EBFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginLeft: 8,
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  patternLabel: {
    fontSize: 14,
    color: '#666',
  },
  patternValue: {
    fontSize: 14,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  patternAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6C5CE7',
  },
  patternActionText: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingVertical: 8,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  footerButtonText: {
    fontSize: 13,
    color: '#6C5CE7',
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default MemoryPanel;