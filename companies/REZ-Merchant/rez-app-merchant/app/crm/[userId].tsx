import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  memberSince: string;
  segment: string;
  visitCount: number;
  lifetimeValue: number;
  averageOrderValue: number;
  lastVisit: string;
  tags: string[];
  notes: string;
  visits: Array<{
    id: string;
    date: string;
    amount: number;
    coinsEarned: number;
  }>;
}

export default function CustomerDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<CustomerDetail>(`/merchant/customers/${userId}`);
      if (response.success && response.data) {
        setCustomer(response.data);
        setNotes(response.data.notes || '');
      } else {
        showAlert('Error', response.message || 'Failed to load customer');
      }
    } catch (error) {
      if (__DEV__) console.error('Error fetching customer:', error);
      showAlert('Error', error?.message || 'Failed to load customer');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchCustomer();
    }
  }, [userId, fetchCustomer]);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    try {
      const response = await apiClient.post(`/merchant/customers/${userId}/tags`, {
        tag: newTag.trim(),
      });

      if (response.success && customer) {
        setCustomer({
          ...customer,
          tags: [...customer.tags, newTag.trim()],
        });
        setNewTag('');
        setShowAddTag(false);
      } else {
        showAlert('Error', 'Failed to add tag');
      }
    } catch (error) {
      if (__DEV__) console.error('Error adding tag:', error);
      showAlert('Error', 'Failed to add tag');
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!customer) return;

    try {
      const response = await apiClient.delete(`/merchant/customers/${userId}/tags/${tag}`);

      if (response.success) {
        setCustomer({
          ...customer,
          tags: customer.tags.filter((t) => t !== tag),
        });
      } else {
        showAlert('Error', 'Failed to remove tag');
      }
    } catch (error) {
      if (__DEV__) console.error('Error removing tag:', error);
      showAlert('Error', 'Failed to remove tag');
    }
  };

  const handleSaveNotes = async () => {
    if (!customer) return;

    try {
      setIsSaving(true);
      const response = await apiClient.patch(`/merchant/customers/${userId}`, {
        notes: notes.trim(),
      });

      if (response.success) {
        setCustomer({ ...customer, notes: notes.trim() });
        showAlert('Success', 'Notes saved');
      } else {
        showAlert('Error', 'Failed to save notes');
      }
    } catch (error) {
      if (__DEV__) console.error('Error saving notes:', error);
      showAlert('Error', 'Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const getSegmentColor = (segment: string): string => {
    switch (segment?.toLowerCase()) {
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

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading customer...</ThemedText>
      </ThemedView>
    );
  }

  if (!customer) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.light.card} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Customer</ThemedText>
        </View>
        <View style={styles.notFoundContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.light.error} />
          <ThemedText style={styles.notFoundText}>Customer not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.light.card} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{customer.name}</ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {customer.avatar ? (
                <ThemedText style={styles.avatarText}>{customer.avatar}</ThemedText>
              ) : (
                <Ionicons name="person-circle" size={56} color={Colors.light.icon} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={styles.profileName}>{customer.name}</ThemedText>
              <TouchableOpacity style={styles.phoneButton} onPress={handleCall}>
                <Ionicons name="call" size={14} color={Colors.light.tint} />
                <ThemedText style={styles.phoneText}>{customer.phone}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.segmentRow}>
            {customer.segment && (
              <View
                style={[
                  styles.segmentBadge,
                  { backgroundColor: `${getSegmentColor(customer.segment)}20` },
                ]}
              >
                <ThemedText
                  style={[styles.segmentBadgeText, { color: getSegmentColor(customer.segment) }]}
                >
                  {customer.segment}
                </ThemedText>
              </View>
            )}
            <ThemedText style={styles.memberSince}>Member since {customer.memberSince}</ThemedText>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{customer.visitCount}</ThemedText>
            <ThemedText style={styles.statLabel}>visits</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>
              ₹{customer.lifetimeValue.toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.statLabel}>lifetime</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>
              ₹{customer.averageOrderValue.toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.statLabel}>avg order</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{customer.lastVisit}</ThemedText>
            <ThemedText style={styles.statLabel}>last visit</ThemedText>
          </View>
        </View>

        {/* Visit History */}
        {customer.visits.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Visit history</ThemedText>
            <FlatList
              data={customer.visits}
              renderItem={({ item }) => (
                <View style={styles.visitRow}>
                  <View style={styles.visitInfo}>
                    <ThemedText style={styles.visitDate}>{item.date}</ThemedText>
                    <ThemedText style={styles.visitBill}>Bill #{item.id}</ThemedText>
                  </View>
                  <View style={styles.visitAmount}>
                    <ThemedText style={styles.visitValue}>₹{item.amount}</ThemedText>
                    {item.coinsEarned > 0 && (
                      <ThemedText style={styles.coinsEarned}>+{item.coinsEarned} coins</ThemedText>
                    )}
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Tags Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Tags</ThemedText>
            <TouchableOpacity onPress={() => setShowAddTag(true)}>
              <ThemedText style={styles.addLink}>+ Add</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            {customer.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <ThemedText style={styles.tagText}>{tag}</ThemedText>
                <TouchableOpacity onPress={() => handleRemoveTag(tag)} style={styles.tagRemove}>
                  <Ionicons name="close" size={14} color={Colors.light.card} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Private notes</ThemedText>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about this customer..."
            placeholderTextColor={Colors.light.icon}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            editable={!isSaving}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveNotes} disabled={isSaving}>
            <ThemedText style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Notes'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Broadcast Button */}
        <TouchableOpacity
          style={styles.broadcastButton}
          onPress={() => router.push('/(dashboard)/broadcast')}
        >
          <Ionicons name="megaphone" size={16} color={Colors.light.card} />
          <ThemedText style={styles.broadcastButtonText}>Send Broadcast Message</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Tag Modal */}
      <Modal
        visible={showAddTag}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddTag(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add Tag</ThemedText>
              <TouchableOpacity onPress={() => setShowAddTag(false)}>
                <Ionicons name="close" size={28} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.tagInput}
              placeholder="e.g., VIP, Corporate, Regular..."
              placeholderTextColor={Colors.light.icon}
              value={newTag}
              onChangeText={setNewTag}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleAddTag}>
              <ThemedText style={styles.submitButtonText}>Add Tag</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.card,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  profileCard: {
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 13,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  segmentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  memberSince: {
    fontSize: 11,
    color: Colors.light.icon,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.light.icon,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  addLink: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  visitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  visitInfo: {
    flex: 1,
  },
  visitDate: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  visitBill: {
    fontSize: 11,
    color: Colors.light.icon,
    marginTop: 2,
  },
  visitAmount: {
    alignItems: 'flex-end',
  },
  visitValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  coinsEarned: {
    fontSize: 10,
    color: Colors.light.success,
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.light.tint,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.card,
  },
  tagRemove: {
    padding: 2,
  },
  notesInput: {
    minHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.card,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.card,
  },
  broadcastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    marginVertical: 16,
    marginBottom: 32,
  },
  broadcastButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.card,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tagInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.card,
    marginBottom: 16,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.card,
  },
});
