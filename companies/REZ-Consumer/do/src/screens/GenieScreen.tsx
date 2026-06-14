/**
 * GenieScreen - Full Genie Memory Management
 *
 * Complete memory management interface
 *
 * Usage:
 * ```typescript
 * // In navigation
 * <Stack.Screen name="Genie" component={GenieScreen} />
 * ```
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGenieMemory, Memory, MemoryType } from '@/hooks/useGenieMemory';
import { useWakeWord } from '@/hooks/useWakeWord';
import { MemoryPanel } from '@/components/MemoryPanel';
import { WakeWordSettings } from '@/components/WakeWordSettings';

interface GenieScreenProps {
  userId?: string;
  onClose?: () => void;
}

type TabType = 'overview' | 'memories' | 'preferences' | 'settings';

export function GenieScreen({ userId = 'default', onClose }: GenieScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showWakeWord, setShowWakeWord] = useState(false);
  const [newMemory, setNewMemory] = useState('');
  const [newMemoryType, setNewMemoryType] = useState<MemoryType>('fact');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    getMemories,
    getFoodPreferences,
    getUsual,
    remember,
    recall,
    isLoading,
  } = useGenieMemory(userId);

  const { isListening, startListening, stopListening } = useWakeWord();

  const { data: memories = [] } = getMemories(50);
  const { data: preferences = null } = getFoodPreferences();
  const { data: usual = null } = getUsual();

  const filteredMemories = searchQuery
    ? memories.filter(m =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : memories;

  const handleAddMemory = async () => {
    if (!newMemory.trim()) {
      Alert.alert('Error', 'Please enter something to remember');
      return;
    }

    try {
      await remember(newMemoryType, newMemory);
      setNewMemory('');
      setShowAddMemory(false);
      Alert.alert('Success', 'Memory saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save memory');
    }
  };

  const handleRemember = async (type: MemoryType) => {
    setNewMemoryType(type);
    setShowAddMemory(true);
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'grid' },
    { key: 'memories', label: 'Memories', icon: 'chatboxes' },
    { key: 'preferences', label: 'Preferences', icon: 'heart' },
    { key: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{memories.length}</Text>
          <Text style={styles.statLabel}>Memories</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{preferences?.cuisines?.length || 0}</Text>
          <Text style={styles.statLabel}>Preferences</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {isListening ? '🔴' : '🟢'}
          </Text>
          <Text style={styles.statLabel}>
            {isListening ? 'Listening' : 'Standby'}
          </Text>
        </View>
      </View>

      {/* Your Usual Card */}
      {usual && (
        <TouchableOpacity style={styles.usualCard}>
          <View style={styles.usualHeader}>
            <View style={styles.usualIcon}>
              <Ionicons name="star" size={24} color="#F39C12" />
            </View>
            <View style={styles.usualInfo}>
              <Text style={styles.usualTitle}>Your Usual</Text>
              {usual.merchant && (
                <Text style={styles.usualSubtitle}>{usual.merchant}</Text>
              )}
            </View>
            <Ionicons name="refresh" size={20} color="#6C5CE7" />
          </View>
          <View style={styles.usualDetails}>
            {usual.cuisine && (
              <View style={styles.usualDetail}>
                <Text style={styles.usualDetailLabel}>Cuisine</Text>
                <Text style={styles.usualDetailValue}>{usual.cuisine}</Text>
              </View>
            )}
            {usual.amount && (
              <View style={styles.usualDetail}>
                <Text style={styles.usualDetailLabel}>Average</Text>
                <Text style={styles.usualDetailValue}>₹{usual.amount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => handleRemember('fact')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="bulb" size={24} color="#2196F3" />
          </View>
          <Text style={styles.quickActionText}>Remember this</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => handleRemember('preference')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#FCE4EC' }]}>
            <Ionicons name="heart" size={24} color="#E91E63" />
          </View>
          <Text style={styles.quickActionText}>My preference</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => handleRemember('note')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="document-text" size={24} color="#FF9800" />
          </View>
          <Text style={styles.quickActionText}>Add note</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => handleRemember('context')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="chatbox" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.quickActionText}>Remember idea</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Memories */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Memories</Text>
          <TouchableOpacity onPress={() => setActiveTab('memories')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <MemoryPanel userId={userId} compact />
      </View>

      {/* Voice Status */}
      <TouchableOpacity
        style={styles.voiceCard}
        onPress={() => setShowWakeWord(true)}
      >
        <View style={styles.voiceLeft}>
          <View style={styles.voiceIcon}>
            <Ionicons name="mic" size={24} color="#6C5CE7" />
          </View>
          <View>
            <Text style={styles.voiceTitle}>"Hey Genie" Wake Word</Text>
            <Text style={styles.voiceSubtitle}>
              {isListening ? 'Listening for wake word...' : 'Tap to configure'}
            </Text>
          </View>
        </View>
        <View style={[styles.voiceStatus, isListening && styles.voiceStatusActive]}>
          <View style={[styles.voiceDot, isListening && styles.voiceDotActive]} />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderMemoriesTab = () => (
    <View style={styles.tabContent}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search memories..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <TouchableOpacity
          style={[styles.filterChip, styles.filterChipActive]}
        >
          <Text style={styles.filterChipText}>All</Text>
        </TouchableOpacity>
        {['fact', 'preference', 'transaction', 'event', 'note'].map((type) => (
          <TouchableOpacity key={type} style={styles.filterChip}>
            <Text style={styles.filterChipText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Memories List */}
      <ScrollView style={styles.memoriesList} showsVerticalScrollIndicator={false}>
        {filteredMemories.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatboxes-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No memories found</Text>
            <Text style={styles.emptyText}>
              Start using the app and Genie will remember your preferences
            </Text>
          </View>
        ) : (
          filteredMemories.map((memory) => (
            <TouchableOpacity key={memory.id} style={styles.memoryCard}>
              <View style={styles.memoryHeader}>
                <View style={styles.memoryTypeIcon}>
                  <Ionicons
                    name={
                      memory.type === 'preference' ? 'heart' :
                      memory.type === 'transaction' ? 'receipt' :
                      memory.type === 'booking' ? 'calendar' :
                      memory.type === 'event' ? 'calendar-outline' :
                      memory.type === 'fact' ? 'information-circle' :
                      'chatbox'
                    }
                    size={16}
                    color="#6C5CE7"
                  />
                </View>
                <Text style={styles.memoryType}>{memory.type}</Text>
                <Text style={styles.memoryDate}>
                  {new Date(memory.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.memoryContent}>{memory.content}</Text>
              {memory.tags && memory.tags.length > 0 && (
                <View style={styles.memoryTags}>
                  {memory.tags.map((tag, i) => (
                    <View key={i} style={styles.memoryTag}>
                      <Text style={styles.memoryTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addFab}
        onPress={() => setShowAddMemory(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderPreferencesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <MemoryPanel userId={userId} />

      {/* Spending Summary */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Spending Patterns</Text>
        <View style={styles.spendingGrid}>
          <View style={styles.spendingItem}>
            <Text style={styles.spendingValue}>₹{preferences?.averageOrderValue || 0}</Text>
            <Text style={styles.spendingLabel}>Avg Order</Text>
          </View>
          <View style={styles.spendingItem}>
            <Text style={styles.spendingValue}>{preferences?.ordersPerWeek || 0}</Text>
            <Text style={styles.spendingLabel}>Per Week</Text>
          </View>
          <View style={styles.spendingItem}>
            <Text style={styles.spendingValue}>
              {preferences?.preferredTime || 'N/A'}
            </Text>
            <Text style={styles.spendingLabel}>Peak Time</Text>
          </View>
        </View>
      </View>

      {/* Relationship Insights */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Relationship Insights</Text>
        <View style={styles.insightRow}>
          <Ionicons name="people" size={20} color="#6C5CE7" />
          <Text style={styles.insightText}>
            You interact most with food & delivery services
          </Text>
        </View>
        <View style={styles.insightRow}>
          <Ionicons name="time" size={20} color="#6C5CE7" />
          <Text style={styles.insightText}>
            Peak activity: {preferences?.preferredTime || 'Evening'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <WakeWordSettings userId={userId} />

      {/* Privacy */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <TouchableOpacity style={styles.settingsRow}>
          <Ionicons name="shield-checkmark" size={24} color="#6C5CE7" />
          <View style={styles.settingsRowText}>
            <Text style={styles.settingsRowTitle}>Privacy Settings</Text>
            <Text style={styles.settingsRowSubtitle}>Manage your data</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsRow}>
          <Ionicons name="download" size={24} color="#6C5CE7" />
          <View style={styles.settingsRowText}>
            <Text style={styles.settingsRowTitle}>Export Data</Text>
            <Text style={styles.settingsRowSubtitle}>Download all your memories</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsRow}>
          <Ionicons name="trash" size={24} color="#E74C3C" />
          <View style={styles.settingsRowText}>
            <Text style={[styles.settingsRowTitle, { color: '#E74C3C' }]}>
              Delete All Memories
            </Text>
            <Text style={styles.settingsRowSubtitle}>
              This cannot be undone
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="brain" size={24} color="#6C5CE7" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Genie</Text>
            <Text style={styles.headerSubtitle}>Your Personal AI Memory</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? '#6C5CE7' : '#999'}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'memories' && renderMemoriesTab()}
      {activeTab === 'preferences' && renderPreferencesTab()}
      {activeTab === 'settings' && renderSettingsTab()}

      {/* Add Memory Modal */}
      <Modal visible={showAddMemory} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Memory</Text>
              <TouchableOpacity onPress={() => setShowAddMemory(false)}>
                <Ionicons name="close" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>

            <View style={styles.typeSelector}>
              {(['fact', 'preference', 'note', 'context'] as MemoryType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    newMemoryType === type && styles.typeChipActive,
                  ]}
                  onPress={() => setNewMemoryType(type)}
                >
                  <Text style={[
                    styles.typeChipText,
                    newMemoryType === type && styles.typeChipTextActive,
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.memoryInput}
              placeholder={`Remember something (${newMemoryType})...`}
              placeholderTextColor="#999"
              value={newMemory}
              onChangeText={setNewMemory}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleAddMemory}>
              <Text style={styles.saveButtonText}>Save Memory</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Wake Word Modal */}
      <Modal visible={showWakeWord} animationType="slide">
        <View style={styles.wakeWordModal}>
          <WakeWordSettings userId={userId} onClose={() => setShowWakeWord(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#6C5CE7',
  },
  tabText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 4,
  },
  tabTextActive: {
    color: '#6C5CE7',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  usualCard: {
    backgroundColor: '#F0EBFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  usualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  usualIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  usualInfo: {
    flex: 1,
  },
  usualTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  usualSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  usualDetails: {
    flexDirection: 'row',
  },
  usualDetail: {
    flex: 1,
  },
  usualDetailLabel: {
    fontSize: 12,
    color: '#666',
  },
  usualDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  quickAction: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 16,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  voiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  voiceSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  voiceStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceStatusActive: {
    backgroundColor: '#FFEBEE',
  },
  voiceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#999',
  },
  voiceDotActive: {
    backgroundColor: '#E74C3C',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A2E',
    marginLeft: 8,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  memoriesList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  memoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  memoryType: {
    flex: 1,
    fontSize: 13,
    color: '#6C5CE7',
    textTransform: 'capitalize',
  },
  memoryDate: {
    fontSize: 12,
    color: '#999',
  },
  memoryContent: {
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 22,
  },
  memoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  memoryTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  memoryTagText: {
    fontSize: 11,
    color: '#666',
  },
  addFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  spendingGrid: {
    flexDirection: 'row',
  },
  spendingItem: {
    flex: 1,
    alignItems: 'center',
  },
  spendingValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  spendingLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#1A1A2E',
    marginLeft: 12,
    flex: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingsRowText: {
    flex: 1,
    marginLeft: 12,
  },
  settingsRowTitle: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  settingsRowSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    borderRadius: 8,
  },
  typeChipActive: {
    backgroundColor: '#6C5CE7',
  },
  typeChipText: {
    fontSize: 13,
    color: '#666',
    textTransform: 'capitalize',
  },
  typeChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  memoryInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A2E',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  wakeWordModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default GenieScreen;