import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

interface StampCard {
  id: string;
  name: string;
  requiredStamps: number;
  rewardType: 'free_item' | 'discount' | 'coins';
  rewardDescription: string;
  isActive: boolean;
  enrolledCount: number;
  completedCount: number;
}

export default function StampCardsScreen() {
  const [cards, setCards] = useState<StampCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    requiredStamps: string;
    rewardType: 'free_item' | 'discount' | 'coins';
    rewardDescription: string;
  }>({
    name: '',
    requiredStamps: '10',
    rewardType: 'free_item',
    rewardDescription: '',
  });

  const fetchCards = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);

      const response = await apiClient.get<StampCard[]>('/merchant/stamp-cards');
      if (response.success && response.data) {
        setCards(Array.isArray(response.data) ? response.data : []);
      } else {
        showAlert('Error', response.message || 'Failed to load stamp cards');
      }
    } catch (error) {
      logger.error('Error fetching stamp cards:', error);
      showAlert('Error', error?.message || 'Failed to load stamp cards');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleCreateCard = async () => {
    if (!formData.name.trim()) {
      showAlert('Validation', 'Please enter a card name');
      return;
    }
    if (!formData.rewardDescription.trim()) {
      showAlert('Validation', 'Please enter a reward description');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        requiredStamps: parseInt(formData.requiredStamps) || 10,
        rewardType: formData.rewardType,
        rewardDescription: formData.rewardDescription,
      };

      const response = await apiClient.post('/merchant/stamp-cards', payload);
      if (response.success) {
        showAlert('Success', 'Stamp card created successfully');
        setFormData({
          name: '',
          requiredStamps: '10',
          rewardType: 'free_item',
          rewardDescription: '',
        });
        setShowCreateModal(false);
        await fetchCards();
      } else {
        showAlert('Error', response.message || 'Failed to create card');
      }
    } catch (error) {
      logger.error('Error creating stamp card:', error);
      showAlert('Error', error?.message || 'Failed to create card');
    }
  };

  const handleToggleCard = async (cardId: string, newActive: boolean) => {
    try {
      const response = await apiClient.patch(`/merchant/stamp-cards/${cardId}`, {
        isActive: newActive,
      });

      if (response.success) {
        await fetchCards();
      } else {
        showAlert('Error', 'Failed to update card');
      }
    } catch (error) {
      logger.error('Error toggling card:', error);
      showAlert('Error', 'Failed to update card');
    }
  };

  const getRewardIcon = (type: string): string => {
    switch (type) {
      case 'free_item':
        return '🎁';
      case 'discount':
        return '💰';
      case 'coins':
        return '🪙';
      default:
        return '🏷️';
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading stamp cards...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Stamp Cards</ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchCards(true)} />
        }
        showsVerticalScrollIndicator={false}
      >
        {cards.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="ticket" size={64} color={Colors.light.icon} />
            <ThemedText style={styles.emptyStateTitle}>No stamp cards yet</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              Create your first stamp card to reward loyal customers
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={cards}
            renderItem={({ item }) => (
              <View style={styles.cardContainer}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <ThemedText style={styles.cardEmoji}>
                      {getRewardIcon(item.rewardType)}
                    </ThemedText>
                    <View style={styles.cardDetails}>
                      <ThemedText style={styles.cardName}>{item.name}</ThemedText>
                      <ThemedText style={styles.cardReward}>
                        {item.requiredStamps} stamps → {item.rewardDescription}
                      </ThemedText>
                    </View>
                  </View>
                  <Switch
                    value={item.isActive}
                    onValueChange={(value) => handleToggleCard(item.id, value)}
                    trackColor={{ false: Colors.light.icon, true: Colors.light.success }}
                    thumbColor={item.isActive ? Colors.light.success : Colors.light.icon}
                  />
                </View>

                <View style={styles.cardStats}>
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statValue}>{item.enrolledCount}</ThemedText>
                    <ThemedText style={styles.statLabel}>enrolled</ThemedText>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statValue}>{item.completedCount}</ThemedText>
                    <ThemedText style={styles.statLabel}>completed</ThemedText>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="create" size={16} color={Colors.light.tint} />
                    <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.cardsList}
          />
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreateModal(true)}>
        <Ionicons name="add" size={32} color={Colors.light.card} />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Create Stamp Card</ThemedText>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={28} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Card Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g., Coffee Loyalty Card"
                placeholderTextColor={Colors.light.icon}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Required Stamps</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="10"
                placeholderTextColor={Colors.light.icon}
                keyboardType="number-pad"
                value={formData.requiredStamps}
                onChangeText={(text) => setFormData({ ...formData, requiredStamps: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Reward Type</ThemedText>
              <View style={styles.rewardTypeButtons}>
                {(['free_item', 'discount', 'coins'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.rewardTypeButton,
                      formData.rewardType === type && styles.rewardTypeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, rewardType: type })}
                  >
                    <ThemedText
                      style={[
                        styles.rewardTypeButtonText,
                        formData.rewardType === type && styles.rewardTypeButtonTextActive,
                      ]}
                    >
                      {type === 'free_item'
                        ? 'Free Item'
                        : type === 'discount'
                          ? 'Discount %'
                          : 'Coins'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Reward Description</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1 free coffee"
                placeholderTextColor={Colors.light.icon}
                value={formData.rewardDescription}
                onChangeText={(text) => setFormData({ ...formData, rewardDescription: text })}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleCreateCard}>
              <ThemedText style={styles.submitButtonText}>Create Card</ThemedText>
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
  cardsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
  },
  cardContainer: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardReward: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginBottom: 12,
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
    fontSize: 11,
    color: Colors.light.icon,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.light.background,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.tint,
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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.card,
  },
  rewardTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rewardTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  rewardTypeButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  rewardTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  rewardTypeButtonTextActive: {
    color: Colors.light.card,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.card,
  },
});
