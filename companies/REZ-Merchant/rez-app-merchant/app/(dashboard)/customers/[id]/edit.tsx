/**
 * Edit Customer Page - REZ Merchant CRM
 *
 * Edit customer information including:
 * - Name, phone, email
 * - Address
 * - Tags
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import {
  customerService,
  Customer,
  UpdateCustomerRequest,
  CustomerSegment,
  SEGMENT_CONFIG,
} from '@/services/customerService';
import { Colors } from '@/constants/Colors';

export default function EditCustomerPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<UpdateCustomerRequest>({});
  const [newTag, setNewTag] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch customer
  const {
    data: customer,
    isLoading,
    error,
  } = useQuery<Customer, Error>({
    queryKey: ['customer', id],
    queryFn: () => customerService.getCustomerById(id!),
    enabled: !!id,
  });

  // Initialize form when customer loads
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        addresses: customer.addresses || [],
        tags: customer.tags || [],
        segment: customer.segment,
        isActive: customer.isActive,
      });
    }
  }, [customer]);

  // Track changes
  useEffect(() => {
    if (customer) {
      const changed =
        formData.name !== customer.name ||
        formData.phone !== customer.phone ||
        formData.email !== customer.email ||
        JSON.stringify(formData.addresses) !== JSON.stringify(customer.addresses) ||
        JSON.stringify(formData.tags) !== JSON.stringify(customer.tags);
      setHasChanges(changed);
    }
  }, [formData, customer]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateCustomerRequest) =>
      customerService.updateCustomer(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      Alert.alert('Success', 'Customer updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update customer');
    },
  });

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag),
    });
  };

  const handleSubmit = () => {
    if (!formData.name?.trim()) {
      Alert.alert('Validation Error', 'Please enter customer name');
      return;
    }
    if (!formData.phone?.trim()) {
      Alert.alert('Validation Error', 'Please enter phone number');
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (error || !customer) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error[500]} />
        <Text style={styles.errorTitle}>Error Loading Customer</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Customer</Text>
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={!hasChanges || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                !hasChanges && styles.saveButtonTextDisabled,
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter customer name"
              placeholderTextColor={Colors.gray[400]}
              value={formData.name || ''}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor={Colors.gray[400]}
              value={formData.phone || ''}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor={Colors.gray[400]}
              value={formData.email || ''}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Segment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Segment</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.segmentContainer}
          >
            {Object.entries(SEGMENT_CONFIG).map(([key, config]) => {
              const segment = key as CustomerSegment;
              const isSelected = formData.segment === segment;
              return (
                <TouchableOpacity
                  key={segment}
                  style={[
                    styles.segmentOption,
                    { borderColor: config.color },
                    isSelected && { backgroundColor: config.bgColor },
                  ]}
                  onPress={() => setFormData({ ...formData, segment })}
                >
                  <Text
                    style={[
                      styles.segmentOptionText,
                      { color: config.color },
                      isSelected && styles.segmentOptionTextSelected,
                    ]}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={styles.tagInput}
              placeholder="Add a tag"
              placeholderTextColor={Colors.gray[400]}
              value={newTag}
              onChangeText={setNewTag}
              onSubmitEditing={handleAddTag}
            />
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={handleAddTag}
              disabled={!newTag.trim()}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
          {formData.tags && formData.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {formData.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                    <Ionicons name="close-circle" size={16} color={Colors.gray[500]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Addresses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Addresses</Text>
          {formData.addresses && formData.addresses.length > 0 && (
            <View style={styles.addressList}>
              {formData.addresses.map((addr, index) => (
                <View key={index} style={styles.addressCard}>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressText}>{addr.addressLine1}</Text>
                    <Text style={styles.addressSubtext}>
                      {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                    </Text>
                    {addr.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const newAddresses = formData.addresses?.filter(
                        (_, i) => i !== index
                      );
                      setFormData({ ...formData, addresses: newAddresses });
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.error[500]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.addressHint}>
            Address editing is available on the full dashboard version.
          </Text>
        </View>

        {/* Customer Stats (Read-only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics (Read-only)</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  minimumFractionDigits: 0,
                }).format(customer.totalSpent || 0)}
              </Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{customer.totalOrders || 0}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{customer.visitCount || 0}</Text>
              <Text style={styles.statLabel}>Visits</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary[500],
  },
  saveButtonTextDisabled: {
    color: Colors.gray[400],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[700],
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  segmentContainer: {
    gap: 8,
    paddingRight: 16,
  },
  segmentOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  segmentOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  segmentOptionTextSelected: {
    fontWeight: '600',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  addTagButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: Colors.primary[600],
  },
  addressList: {
    gap: 8,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 15,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  addressSubtext: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  defaultBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 11,
    color: Colors.primary[600],
    fontWeight: '600',
  },
  addressHint: {
    fontSize: 13,
    color: Colors.gray[400],
    fontStyle: 'italic',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    marginTop: 4,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
