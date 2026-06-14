import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { outletsService, CreateOutletRequest } from '@/services/api/outlets';
import { useStore } from '@/contexts/StoreContext';
import ConfirmModal from '@/components/common/ConfirmModal';
import * as Location from 'expo-location';
import { logger } from '@/utils/logger';

const outletSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  address: z.string().min(5, 'Address must be at least 5 characters').max(500),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  latitude: z
    .string()
    .regex(/^-?\d+\.?\d*$/, 'Must be a valid number')
    .refine(
      (val) => parseFloat(val) >= -90 && parseFloat(val) <= 90,
      'Latitude must be between -90 and 90'
    ),
  longitude: z
    .string()
    .regex(/^-?\d+\.?\d*$/, 'Must be a valid number')
    .refine(
      (val) => parseFloat(val) >= -180 && parseFloat(val) <= 180,
      'Longitude must be between -180 and 180'
    ),
  openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Must be in HH:MM format'),
  closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Must be in HH:MM format'),
  isActive: z.boolean().default(true),
});

type OutletFormData = z.infer<typeof outletSchema>;

export default function AddOutletScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.id as string;
  const { stores } = useStore();
  const store = stores.find((s) => s._id === storeId);

  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showOpenTimePicker, setShowOpenTimePicker] = useState(false);
  const [showCloseTimePicker, setShowCloseTimePicker] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'default' | 'danger' | 'warning';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'default',
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OutletFormData>({
    resolver: zodResolver(outletSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      latitude: '',
      longitude: '',
      openTime: '09:00',
      closeTime: '21:00',
      isActive: true,
    },
  });

  const openTime = watch('openTime');
  const closeTime = watch('closeTime');

  const getCurrentLocation = async () => {
    try {
      setFetchingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAlertModal({
          visible: true,
          title: 'Permission Denied',
          message: 'Location permission is required to use current location.',
          type: 'warning',
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setValue('latitude', location.coords.latitude.toFixed(6));
      setValue('longitude', location.coords.longitude.toFixed(6));

      // Try to get address from coordinates
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (address) {
          const fullAddress = [
            address.streetNumber,
            address.street,
            address.district,
            address.city,
            address.region,
            address.postalCode,
            address.country,
          ]
            .filter(Boolean)
            .join(', ');
          setValue('address', fullAddress);
        }
      } catch (err) {
        if (__DEV__) logger.log('Could not get address from coordinates');
      }
    } catch (error) {
      setAlertModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to get current location',
        type: 'danger',
      });
    } finally {
      setFetchingLocation(false);
    }
  };

  const parseTimeToDate = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTimeFromDate = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTimeForDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${suffix}`;
  };

  const onSubmit = async (data: OutletFormData) => {
    try {
      setLoading(true);

      // Validate closing time is after opening time
      const openParts = data.openTime.split(':').map(Number);
      const closeParts = data.closeTime.split(':').map(Number);
      const openMinutes = openParts[0] * 60 + openParts[1];
      const closeMinutes = closeParts[0] * 60 + closeParts[1];

      if (closeMinutes <= openMinutes) {
        setAlertModal({
          visible: true,
          title: 'Error',
          message: 'Closing time must be after opening time',
          type: 'danger',
        });
        return;
      }

      const outletData: CreateOutletRequest = {
        storeId: storeId,
        name: data.name.trim(),
        address: data.address.trim(),
        location: {
          type: 'Point',
          coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
        },
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        openingHours: {
          open: data.openTime,
          close: data.closeTime,
        },
        isActive: data.isActive,
      };

      const response = await outletsService.createOutlet(outletData);

      if (response.success) {
        setAlertModal({
          visible: true,
          title: 'Success',
          message: 'Outlet created successfully',
          type: 'default',
          onConfirm: () => {
            setAlertModal({ ...alertModal, visible: false });
            router.back();
          },
        });
      } else {
        setAlertModal({
          visible: true,
          title: 'Error',
          message: response.message || 'Failed to create outlet',
          type: 'danger',
        });
      }
    } catch (error) {
      if (__DEV__) console.error('Error creating outlet:', error);
      setAlertModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to create outlet',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    name: keyof OutletFormData,
    label: string,
    placeholder: string,
    options?: {
      multiline?: boolean;
      keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
      icon?: string;
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={[styles.inputContainer, errors[name] && styles.inputError]}>
            {options?.icon && (
              <Ionicons
                name={options.icon as unknown as keyof typeof Ionicons.glyphMap}
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
            )}
            <TextInput
              style={[styles.input, options?.multiline && styles.inputMultiline]}
              placeholder={placeholder}
              placeholderTextColor="#9CA3AF"
              value={typeof value === 'string' ? value : String(value)}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline={options?.multiline}
              numberOfLines={options?.multiline ? 3 : 1}
              keyboardType={options?.keyboardType || 'default'}
              autoCapitalize={name === 'email' ? 'none' : 'sentences'}
            />
          </View>
        )}
      />
      {errors[name] && <Text style={styles.errorText}>{errors[name]?.message}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <LinearGradient colors={['#10B981', '#059669']} style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Add Outlet</Text>
              {store && <Text style={styles.headerSubtitle}>{store.name}</Text>}
            </View>
            <View style={styles.headerBtn} />
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="information-circle" size={20} color="#10B981" />
              </View>
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>

            {renderInput('name', 'Outlet Name *', 'e.g., Main Branch', {
              icon: 'storefront-outline',
            })}
            {renderInput('phone', 'Phone Number *', 'e.g., +91 9876543210', {
              icon: 'call-outline',
              keyboardType: 'phone-pad',
            })}
            {renderInput('email', 'Email (Optional)', 'e.g., outlet@store.com', {
              icon: 'mail-outline',
              keyboardType: 'email-address',
            })}
          </View>

          {/* Address Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="location" size={20} color="#10B981" />
              </View>
              <Text style={styles.sectionTitle}>Address</Text>
            </View>

            {renderInput('address', 'Full Address *', 'Enter complete address with landmark', {
              icon: 'map-outline',
              multiline: true,
            })}
          </View>

          {/* Location Coordinates Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="navigate" size={20} color="#10B981" />
              </View>
              <Text style={styles.sectionTitle}>Location Coordinates</Text>
            </View>

            {/* Get Current Location Button */}
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={fetchingLocation}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.locationButtonGradient}
              >
                {fetchingLocation ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="locate" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.locationButtonText}>
                  {fetchingLocation ? 'Getting Location...' : 'Use Current Location'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.orText}>- OR ENTER MANUALLY -</Text>

            <View style={styles.coordinatesRow}>
              <View style={styles.coordinateInput}>
                {renderInput('latitude', 'Latitude *', 'e.g., 28.6139', {
                  keyboardType: 'numeric',
                })}
              </View>
              <View style={styles.coordinateInput}>
                {renderInput('longitude', 'Longitude *', 'e.g., 77.2090', {
                  keyboardType: 'numeric',
                })}
              </View>
            </View>
          </View>

          {/* Opening Hours Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="time" size={20} color="#10B981" />
              </View>
              <Text style={styles.sectionTitle}>Opening Hours</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Same hours for all days</Text>

            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.label}>Opens At *</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowOpenTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#10B981" />
                  <Text style={styles.timeButtonText}>{formatTimeForDisplay(openTime)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timeInput}>
                <Text style={styles.label}>Closes At *</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowCloseTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#EF4444" />
                  <Text style={styles.timeButtonText}>{formatTimeForDisplay(closeTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Time Pickers */}
            {showOpenTimePicker && (
              <DateTimePicker
                value={parseTimeToDate(openTime)}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowOpenTimePicker(Platform.OS === 'ios');
                  if (date) {
                    setValue('openTime', formatTimeFromDate(date));
                  }
                }}
              />
            )}
            {showCloseTimePicker && (
              <DateTimePicker
                value={parseTimeToDate(closeTime)}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowCloseTimePicker(Platform.OS === 'ios');
                  if (date) {
                    setValue('closeTime', formatTimeFromDate(date));
                  }
                }}
              />
            )}
          </View>

          {/* Status Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="toggle" size={20} color="#10B981" />
              </View>
              <Text style={styles.sectionTitle}>Status</Text>
            </View>

            <Controller
              control={control}
              name="isActive"
              render={({ field: { onChange, value } }) => (
                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchLabel}>Active</Text>
                    <Text style={styles.switchDescription}>
                      Inactive outlets won't be visible to customers
                    </Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
                    thumbColor={value ? '#10B981' : '#9CA3AF'}
                  />
                </View>
              )}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#9CA3AF', '#6B7280'] : ['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Create Outlet</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Alert Modal */}
      <ConfirmModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="OK"
        onConfirm={() => {
          if (alertModal.onConfirm) {
            alertModal.onConfirm();
          } else {
            setAlertModal({ ...alertModal, visible: false });
          }
        }}
        onCancel={() => setAlertModal({ ...alertModal, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 48,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 14,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  locationButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  locationButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16,
    fontWeight: '500',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  timeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  switchDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    shadowOpacity: 0.1,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
