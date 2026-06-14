/**
 * Salon Services - Service management
 *
 * Features:
 * - View all services
 * - Add/edit services
 * - Set prices and duration
 * - Enable/disable services
 * - Service categories
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { salonService, SalonService, ServiceCategory } from '@/services/api/salon';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  addButton: {
    padding: 4,
  },
  categoryTabs: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryTabActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  serviceMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  serviceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceMetaText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
    marginRight: 12,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 120 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.light.text, marginTop: 16 },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
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
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
    borderColor: Colors.light.border,
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
    borderColor: Colors.light.border,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: Colors.light.text,
  },
  switchSubtext: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.light.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

const DEFAULT_CATEGORIES: ServiceCategory[] = [
  { id: 'hair', name: 'Hair', icon: 'cut-outline' },
  { id: 'skincare', name: 'Skincare', icon: 'sparkles-outline' },
  { id: 'nails', name: 'Nails', icon: 'hand-left-outline' },
  { id: 'massage', name: 'Massage', icon: 'hand-right-outline' },
  { id: 'makeup', name: 'Makeup', icon: 'color-palette-outline' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export default function SalonServicesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<SalonService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<SalonService | null>(null);

  // Form state
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [serviceCategory, setServiceCategory] = useState('other');
  const [serviceEnabled, setServiceEnabled] = useState(true);
  const [commissionRate, setCommissionRate] = useState('10');

  const storeId = (user as unknown as { storeId?: string; stores?: Array<{ _id?: string }> })?.storeId ||
    (user as unknown as { stores?: Array<{ _id?: string }> })?.stores?.[0]?._id || '';

  const fetchServices = useCallback(async () => {
    if (!storeId) return;

    try {
      const [servicesData, categoriesData] = await Promise.all([
        salonService.getServices(storeId),
        salonService.getServiceCategories(storeId),
      ]);

      setServices(servicesData);
      if (categoriesData.length > 0) {
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServices();
  }, [fetchServices]);

  const resetForm = useCallback(() => {
    setServiceName('');
    setServiceDescription('');
    setServicePrice('');
    setServiceDuration('30');
    setServiceCategory('other');
    setServiceEnabled(true);
    setCommissionRate('10');
    setEditingService(null);
  }, []);

  const handleEditService = useCallback((service: SalonService) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceDescription(service.description || '');
    setServicePrice(service.price.toString());
    setServiceDuration(service.duration.toString());
    setServiceCategory(service.category || 'other');
    setServiceEnabled(service.isActive);
    setCommissionRate(service.commissionRate?.toString() || '10');
    setShowServiceModal(true);
  }, []);

  const handleAddService = useCallback(() => {
    resetForm();
    setShowServiceModal(true);
  }, [resetForm]);

  const handleSaveService = useCallback(async () => {
    if (!storeId || !serviceName.trim() || !servicePrice) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const serviceData = {
        name: serviceName.trim(),
        description: serviceDescription.trim(),
        price: parseFloat(servicePrice),
        duration: parseInt(serviceDuration, 10) || 30,
        category: serviceCategory,
        isActive: serviceEnabled,
        commissionRate: parseFloat(commissionRate) || 10,
      };

      if (editingService) {
        await salonService.updateService(editingService._id, serviceData);
      } else {
        await salonService.createService(storeId, serviceData);
      }

      setShowServiceModal(false);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Error', 'Failed to save service');
    }
  }, [storeId, editingService, serviceName, serviceDescription, servicePrice, serviceDuration, serviceCategory, serviceEnabled, commissionRate, resetForm, fetchServices]);

  const handleDeleteService = useCallback(async (serviceId: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await salonService.deleteService(serviceId);
              setShowServiceModal(false);
              resetForm();
              fetchServices();
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Error', 'Failed to delete service');
            }
          },
        },
      ]
    );
  }, [fetchServices, resetForm]);

  const handleToggleService = useCallback(async (service: SalonService) => {
    try {
      await salonService.updateService(service._id, { isActive: !service.isActive });
      fetchServices();
    } catch (error) {
      console.error('Error toggling service:', error);
    }
  }, [fetchServices]);

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter((s) => s.category === selectedCategory);

  const renderService = useCallback(
    ({ item }: { item: SalonService }) => (
      <View style={styles.serviceCard}>
        <View style={styles.serviceInfo}>
          <ThemedText style={styles.serviceName}>{item.name}</ThemedText>
          {item.description && (
            <ThemedText style={styles.serviceDescription} numberOfLines={2}>
              {item.description}
            </ThemedText>
          )}
          <View style={styles.serviceMeta}>
            <View style={styles.serviceMetaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.light.textSecondary} />
              <ThemedText style={styles.serviceMetaText}>{item.duration} min</ThemedText>
            </View>
            {item.commissionRate && (
              <View style={styles.serviceMetaItem}>
                <Ionicons name="cash-outline" size={14} color={Colors.light.textSecondary} />
                <ThemedText style={styles.serviceMetaText}>{item.commissionRate}% commission</ThemedText>
              </View>
            )}
          </View>
        </View>
        <ThemedText style={styles.servicePrice}>Rs. {item.price}</ThemedText>
        <View style={styles.serviceActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleToggleService(item)}
          >
            <Ionicons
              name={item.isActive ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={item.isActive ? Colors.light.success : Colors.light.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleEditService(item)}
          >
            <Ionicons name="pencil-outline" size={20} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleEditService, handleToggleService]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Services</ThemedText>
        <TouchableOpacity onPress={handleAddService} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        <TouchableOpacity
          style={[
            styles.categoryTab,
            selectedCategory === 'all' && styles.categoryTabActive,
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <ThemedText
            style={[
              styles.categoryTabText,
              selectedCategory === 'all' && styles.categoryTabTextActive,
            ]}
          >
            All ({services.length})
          </ThemedText>
        </TouchableOpacity>
        {categories.map((cat) => {
          const count = services.filter((s) => s.category === cat.id).length;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryTab,
                selectedCategory === cat.id && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <ThemedText
                style={[
                  styles.categoryTabText,
                  selectedCategory === cat.id && styles.categoryTabTextActive,
                ]}
              >
                {cat.name} ({count})
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Services List */}
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item._id}
        renderItem={renderService}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="services-outline" size={64} color={Colors.light.textSecondary} />
            <ThemedText style={styles.emptyTitle}>No Services</ThemedText>
            <ThemedText style={styles.emptyText}>
              {selectedCategory === 'all'
                ? 'Add your first service to start accepting bookings.'
                : 'No services in this category.'}
            </ThemedText>
          </View>
        }
      />

      {/* Add/Edit Service Modal */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowServiceModal(false);
          resetForm();
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {editingService ? 'Edit Service' : 'Add Service'}
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowServiceModal(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Service Name *</ThemedText>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Haircut"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={serviceName}
                  onChangeText={setServiceName}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Description</ThemedText>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Brief description of the service..."
                  placeholderTextColor={Colors.light.textSecondary}
                  value={serviceDescription}
                  onChangeText={setServiceDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.priceRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <ThemedText style={styles.formLabel}>Price (Rs.) *</ThemedText>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={servicePrice}
                    onChangeText={setServicePrice}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <ThemedText style={styles.formLabel}>Duration (min)</ThemedText>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="30"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={serviceDuration}
                    onChangeText={setServiceDuration}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Category</ThemedText>
                <View style={styles.categoryPicker}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        serviceCategory === cat.id && styles.categoryChipActive,
                      ]}
                      onPress={() => setServiceCategory(cat.id)}
                    >
                      <ThemedText
                        style={[
                          styles.categoryChipText,
                          serviceCategory === cat.id && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Commission Rate (%)</ThemedText>
                <TextInput
                  style={styles.formInput}
                  placeholder="10"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={commissionRate}
                  onChangeText={setCommissionRate}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.switchRow}>
                <View>
                  <ThemedText style={styles.switchLabel}>Service Active</ThemedText>
                  <ThemedText style={styles.switchSubtext}>
                    Enable to show this service for booking
                  </ThemedText>
                </View>
                <TouchableOpacity
                  onPress={() => setServiceEnabled(!serviceEnabled)}
                >
                  <Ionicons
                    name={serviceEnabled ? 'toggle' : 'toggle-outline'}
                    size={48}
                    color={serviceEnabled ? Colors.light.primary : Colors.light.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowServiceModal(false);
                    resetForm();
                  }}
                >
                  <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveService}>
                  <ThemedText style={styles.saveBtnText}>
                    {editingService ? 'Save Changes' : 'Add Service'}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {editingService && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteService(editingService._id)}
                >
                  <ThemedText style={styles.deleteBtnText}>Delete Service</ThemedText>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
