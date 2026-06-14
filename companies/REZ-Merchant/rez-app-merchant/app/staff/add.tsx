/**
 * AddEditStaffScreen
 * Form for adding or editing staff members.
 * APIs:
 *   POST /staff (create)
 *   PATCH /staff/:id (update)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useMerchant } from '@/contexts/MerchantContext';
import { useStore } from '@/contexts/StoreContext';
import {
  staffService,
  StaffRole,
  StaffStatus,
  CreateStaffRequest,
  UpdateStaffRequest,
  getStaffRoleLabel,
} from '@/services/staffService';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

// Role options
const ROLE_OPTIONS: StaffRole[] = ['owner', 'manager', 'cashier', 'server', 'chef', 'delivery', 'other'];

// Status options
const STATUS_OPTIONS: StaffStatus[] = ['active', 'inactive', 'on_leave'];

interface FormData {
  name: string;
  role: StaffRole;
  status: StaffStatus;
  phone: string;
  email: string;
  dateOfBirth: string;
  joiningDate: string;
}

export default function AddEditStaffScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditing = Boolean(id);
  const staffId = id as string;

  const { merchant } = useMerchant();
  const { activeStore } = useStore();

  const [loading, setLoading] = useState(false);
  const [fetchingStaff, setFetchingStaff] = useState(isEditing);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    role: 'server',
    status: 'active',
    phone: '',
    email: '',
    dateOfBirth: '',
    joiningDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isEditing && staffId) {
      fetchStaff();
    }
  }, [isEditing, staffId]);

  const fetchStaff = async () => {
    try {
      const staff = await staffService.getStaffById(staffId);
      setFormData({
        name: staff.name || '',
        role: staff.role || 'server',
        status: staff.status || 'active',
        phone: staff.phone || '',
        email: staff.email || '',
        dateOfBirth: staff.dateOfBirth ? staff.dateOfBirth.split('T')[0] : '',
        joiningDate: staff.joiningDate ? staff.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      logger.error('[AddEditStaff] Error fetching staff:', error);
      showAlert('Error', 'Failed to load staff details');
      router.back();
    } finally {
      setFetchingStaff(false);
    }
  };

  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showAlert('Validation Error', 'Please enter staff name');
      return false;
    }
    if (formData.phone && !/^[+]?[\d\s-]{10,}$/.test(formData.phone)) {
      showAlert('Validation Error', 'Please enter a valid phone number');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showAlert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const merchantId = merchant?._id;
    if (!merchantId) {
      showAlert('Error', 'Merchant ID not found. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        const updateData: UpdateStaffRequest = {
          name: formData.name.trim(),
          role: formData.role,
          status: formData.status,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          joiningDate: formData.joiningDate || undefined,
        };
        await staffService.updateStaff(staffId, updateData);
        showAlert('Success', 'Staff member updated successfully');
      } else {
        const createData: CreateStaffRequest = {
          merchantId,
          storeId: activeStore?._id,
          name: formData.name.trim(),
          role: formData.role,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          joiningDate: formData.joiningDate || undefined,
        };
        await staffService.createStaff(createData);
        showAlert('Success', 'Staff member added successfully');
      }
      router.back();
    } catch (error) {
      logger.error('[AddEditStaff] Error saving staff:', error);
      showAlert('Error', error?.message || 'Failed to save staff member');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingStaff) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.light.card} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Staff' : 'Add Staff'}
        </Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.light.card} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.inputCard}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                  placeholder="Enter staff name"
                  placeholderTextColor={Colors.light.icon}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Role</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipContainer}>
                    {ROLE_OPTIONS.map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.chip,
                          formData.role === role && styles.chipActive,
                        ]}
                        onPress={() => updateField('role', role)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            formData.role === role && styles.chipTextActive,
                          ]}
                        >
                          {getStaffRoleLabel(role)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {isEditing && (
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Status</Text>
                  <View style={styles.chipContainer}>
                    {STATUS_OPTIONS.map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.chip,
                          formData.status === status && styles.chipActive,
                        ]}
                        onPress={() => updateField('status', status)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            formData.status === status && styles.chipTextActive,
                          ]}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Contact Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.inputCard}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.phone}
                  onChangeText={(text) => updateField('phone', text)}
                  placeholder="Enter phone number"
                  placeholderTextColor={Colors.light.icon}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  placeholder="Enter email address"
                  placeholderTextColor={Colors.light.icon}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          {/* Employment Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Employment Details</Text>
            <View style={styles.inputCard}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Joining Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.joiningDate}
                  onChangeText={(text) => updateField('joiningDate', text)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.light.icon}
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.dateOfBirth}
                  onChangeText={(text) => updateField('dateOfBirth', text)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.light.icon}
                />
              </View>
            </View>
          </View>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.light.icon} />
            <Text style={styles.infoNoteText}>
              Additional details like salary, working hours, and documents can be added after creating the staff member.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.light.card} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Staff' : 'Add Staff Member'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.card,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.card,
  },

  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.icon,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  inputCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 4,
  },
  inputRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.icon,
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    color: Colors.light.text,
    padding: 0,
  },

  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
  },
  chipTextActive: {
    color: Colors.light.card,
  },

  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    backgroundColor: `${Colors.light.tint}10`,
    borderRadius: 8,
    marginBottom: 20,
    gap: 10,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.icon,
    lineHeight: 18,
  },

  submitButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.card,
  },
});
