/**
 * New Customer Page - REZ Merchant CRM
 *
 * Create a new customer with:
 * - Name, phone, email
 * - Address
 * - Tags
 */

import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { customerService, CreateCustomerRequest } from '@/services/customerService';
import { Colors } from '@/constants/Colors';

export default function NewCustomerPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeStore } = useStore();

  const merchantId = activeStore?._id || user?.merchantId || '';

  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    phone: '',
    email: '',
    addresses: [],
    tags: [],
  });

  const [newTag, setNewTag] = useState('');
  const [address, setAddress] = useState({
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerRequest) =>
      customerService.createCustomer(merchantId, data),
    onSuccess: (customer) => {
      Alert.alert('Success', 'Customer created successfully', [
        {
          text: 'View Customer',
          onPress: () =>
            router.replace(`/customers/${customer._id || customer.id}`),
        },
        { text: 'Add Another', onPress: () => resetForm() },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to create customer');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      addresses: [],
      tags: [],
    });
    setAddress({ addressLine1: '', city: '', state: '', pincode: '' });
    setNewTag('');
  };

  const handleAddTag = () => {
    if (newTag.trim() && formData.tags && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
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

  const handleAddAddress = () => {
    if (address.addressLine1.trim()) {
      setFormData({
        ...formData,
        addresses: [
          ...(formData.addresses || []),
          {
            addressLine1: address.addressLine1,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            isDefault: (formData.addresses?.length || 0) === 0,
          },
        ],
      });
      setAddress({ addressLine1: '', city: '', state: '', pincode: '' });
    }
  };

  const handleRemoveAddress = (index: number) => {
    setFormData({
      ...formData,
      addresses: formData.addresses?.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter customer name');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Validation Error', 'Please enter phone number');
      return;
    }
    createMutation.mutate(formData);
  };

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
        <Text style={styles.headerTitle}>New Customer</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
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
              value={formData.name}
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
              value={formData.phone}
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
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
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

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Enter street address"
              placeholderTextColor={Colors.gray[400]}
              value={address.addressLine1}
              onChangeText={(text) =>
                setAddress({ ...address, addressLine1: text })
              }
              multiline
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={Colors.gray[400]}
                value={address.city}
                onChangeText={(text) => setAddress({ ...address, city: text })}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                placeholderTextColor={Colors.gray[400]}
                value={address.state}
                onChangeText={(text) => setAddress({ ...address, state: text })}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pincode"
              placeholderTextColor={Colors.gray[400]}
              value={address.pincode}
              onChangeText={(text) => setAddress({ ...address, pincode: text })}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={handleAddAddress}
            disabled={!address.addressLine1.trim()}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary[500]} />
            <Text style={styles.addAddressButtonText}>Add Address</Text>
          </TouchableOpacity>

          {/* Address List */}
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
                  <TouchableOpacity onPress={() => handleRemoveAddress(index)}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error[500]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary[500],
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
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
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
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: Colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderStyle: 'dashed',
  },
  addAddressButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary[500],
  },
  addressList: {
    marginTop: 12,
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
});
