import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import FormInput from '@/components/forms/FormInput';
import FormSelect from '@/components/forms/FormSelect';
import { offersService, CreateOfferRequest } from '@/services/api/offers';
import { useStore } from '@/contexts/StoreContext';
import { uploadsService } from '@/services/api/uploads';
import { isWeb, handleWebImageUpload } from '@/utils/platform';
import { showAlert } from '@/utils/alert';
import { Colors } from '@/constants/DesignTokens';
import { logger } from '@/utils/logger';

const dealSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  subtitle: z.string().max(200).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  image: z.string().url('Image URL is required'),
  category: z
    .enum([
      'mega',
      'student',
      'new_arrival',
      'trending',
      'food',
      'fashion',
      'electronics',
      'general',
    ])
    .default('general'),
  type: z
    .enum(['cashback', 'discount', 'voucher', 'combo', 'special', 'walk_in'])
    .default('walk_in'),
  cashbackPercentage: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Must be a valid number')
    .refine((val) => parseFloat(val) >= 0 && parseFloat(val) <= 100, 'Must be between 0 and 100'),
  originalPrice: z.string().optional().or(z.literal('')),
  discountedPrice: z.string().optional().or(z.literal('')),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean().default(true),
  minOrderValue: z.string().optional().or(z.literal('')),
  maxDiscountAmount: z.string().optional().or(z.literal('')),
  usageLimitPerUser: z.string().optional().or(z.literal('')),
  usageLimit: z.string().optional().or(z.literal('')),
  priority: z.string().regex(/^\d+$/, 'Must be a number').optional().or(z.literal('')),
  featured: z.boolean().default(false),
  enableTimeWindow: z.boolean().default(false),
  startHour: z.number().min(0).max(23).optional(),
  endHour: z.number().min(1).max(23).optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

export default function AddDealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.id as string;
  const { stores } = useStore();
  const store = stores.find((s) => s._id === storeId);

  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      description: '',
      image: '',
      category: 'general',
      type: 'walk_in',
      cashbackPercentage: '10',
      originalPrice: '',
      discountedPrice: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      isActive: true,
      minOrderValue: '',
      maxDiscountAmount: '',
      usageLimitPerUser: '',
      usageLimit: '',
      priority: '0',
      featured: false,
      enableTimeWindow: false,
      startHour: 9,
      endHour: 21,
    },
  });

  const typedControl = control;

  const handleImagePicker = async () => {
    try {
      let result;
      if (isWeb) {
        const webImages = await handleWebImageUpload();
        if (webImages.length > 0) {
          result = {
            assets: [
              {
                uri: webImages[0].uri,
                file: webImages[0].file, // Pass File object for direct upload
              },
            ],
            canceled: false,
          };
        } else {
          return;
        }
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileObject = isWeb && 'file' in asset ? asset.file : undefined;
        setImageUri(asset.uri);
        setUploadingImage(true);

        try {
          // Upload to Cloudinary using uploadsService
          // Note: imageType accepts 'logo' | 'banner' | 'general', backend will handle folder organization
          const uploadResult = await uploadsService.uploadImage(
            asset.uri,
            undefined,
            'general',
            fileObject
          );
          // The uploadResult is the UploadedFile directly, not wrapped in success/data
          if (uploadResult && uploadResult.url) {
            const uploadedUrl = uploadResult.url;
            setImageUrl(uploadedUrl);
            setValue('image', uploadedUrl);
          } else {
            throw new Error('Failed to upload image: No URL returned');
          }
        } catch (error) {
          if (__DEV__) console.error('Image upload error:', error);
          showAlert('Upload Error', error.message || 'Failed to upload image');
          setImageUri(null);
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Image picker error:', error);
      showAlert('Error', error.message || 'Failed to pick image');
    }
  };

  const onSubmit = async (data: DealFormData) => {
    try {
      setLoading(true);

      if (!imageUrl && !data.image) {
        showAlert('Error', 'Please upload an image for the deal');
        return;
      }

      const offerData: CreateOfferRequest = {
        title: data.title.trim(),
        subtitle: data.subtitle?.trim() || undefined,
        description: data.description?.trim() || undefined,
        image: imageUrl || data.image,
        category: data.category,
        type: data.type,
        cashbackPercentage: parseFloat(data.cashbackPercentage),
        originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : undefined,
        discountedPrice: data.discountedPrice ? parseFloat(data.discountedPrice) : undefined,
        storeId: storeId,
        validity: {
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
          isActive: data.isActive,
        },
        restrictions: {
          minOrderValue: data.minOrderValue ? parseFloat(data.minOrderValue) : undefined,
          maxDiscountAmount: data.maxDiscountAmount
            ? parseFloat(data.maxDiscountAmount)
            : undefined,
          usageLimitPerUser: data.usageLimitPerUser ? parseInt(data.usageLimitPerUser) : undefined,
          usageLimit: data.usageLimit ? parseInt(data.usageLimit) : undefined,
        },
        metadata: {
          priority: data.priority ? parseInt(data.priority) : 0,
          featured: data.featured,
          tags: [],
        },
        ...(data.enableTimeWindow && data.startHour !== undefined && data.endHour !== undefined
          ? {
              timeWindow: {
                startHour: data.startHour,
                endHour: data.endHour,
              },
            }
          : {}),
      };

      const response = await offersService.createOffer(offerData);

      if (response.success) {
        showAlert('Success', 'Deal created successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        showAlert('Error', response.message || 'Failed to create deal');
      }
    } catch (error) {
      if (__DEV__) console.error('Error creating deal:', error);
      showAlert('Error', error.message || 'Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Walk-In Deal</Text>
        <View style={{ width: 24 }} />
      </View>

      {store && (
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <FormInput
          name="title"
          control={typedControl}
          label="Deal Title *"
          placeholder="e.g., 50% Off on All Items"
          error={errors.title?.message}
        />

        <FormInput
          name="subtitle"
          control={typedControl}
          label="Subtitle"
          placeholder="Short description"
          error={errors.subtitle?.message}
        />

        <FormInput
          name="description"
          control={typedControl}
          label="Description"
          placeholder="Detailed description of the deal"
          multiline
          numberOfLines={4}
          error={errors.description?.message}
        />

        <Text style={styles.sectionTitle}>Deal Image *</Text>
        <TouchableOpacity
          style={styles.imagePicker}
          onPress={handleImagePicker}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator size="large" color="#3B82F6" />
          ) : imageUri ? (
            <View style={styles.imagePreview}>
              <Text style={styles.imagePreviewText}>Image selected</Text>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
          ) : (
            <>
              <Ionicons name="image-outline" size={32} color="#3B82F6" />
              <Text style={styles.imagePickerText}>Tap to select image</Text>
            </>
          )}
        </TouchableOpacity>

        <FormSelect
          name="category"
          control={typedControl}
          label="Category"
          options={[
            { label: 'General', value: 'general' },
            { label: 'Mega', value: 'mega' },
            { label: 'Student', value: 'student' },
            { label: 'New Arrival', value: 'new_arrival' },
            { label: 'Trending', value: 'trending' },
            { label: 'Food', value: 'food' },
            { label: 'Fashion', value: 'fashion' },
            { label: 'Electronics', value: 'electronics' },
          ]}
        />

        <FormSelect
          name="type"
          control={typedControl}
          label="Deal Type"
          options={[
            { label: 'Walk-In', value: 'walk_in' },
            { label: 'Cashback', value: 'cashback' },
            { label: 'Discount', value: 'discount' },
            { label: 'Voucher', value: 'voucher' },
            { label: 'Combo', value: 'combo' },
            { label: 'Special', value: 'special' },
          ]}
        />

        <FormInput
          name="cashbackPercentage"
          control={typedControl}
          label="Cashback Percentage (%) *"
          placeholder="10"
          keyboardType="numeric"
          error={errors.cashbackPercentage?.message}
        />

        <FormInput
          name="originalPrice"
          control={typedControl}
          label="Original Price (₹)"
          placeholder="1000"
          keyboardType="numeric"
          error={errors.originalPrice?.message}
        />

        <FormInput
          name="discountedPrice"
          control={typedControl}
          label="Discounted Price (₹)"
          placeholder="500"
          keyboardType="numeric"
          error={errors.discountedPrice?.message}
        />

        <Text style={styles.sectionTitle}>Validity Period *</Text>
        <FormInput
          name="startDate"
          control={typedControl}
          label="Start Date"
          placeholder="YYYY-MM-DD"
          error={errors.startDate?.message}
        />

        <FormInput
          name="endDate"
          control={typedControl}
          label="End Date"
          placeholder="YYYY-MM-DD"
          error={errors.endDate?.message}
        />

        <Text style={styles.sectionTitle}>Time Window (Optional)</Text>
        <Controller
          name="enableTimeWindow"
          control={typedControl}
          render={({ field: { value, onChange } }) => (
            <View style={styles.switchRow}>
              <View style={styles.switchLabelGroup}>
                <Text style={styles.switchLabel}>Restrict to specific hours?</Text>
                <Text style={styles.switchSubLabel}>Only show this deal during selected hours</Text>
              </View>
              <TouchableOpacity style={styles.switchContainer} onPress={() => onChange(!value)}>
                <Ionicons
                  name={value ? 'toggle' : 'toggle-outline'}
                  size={32}
                  color={value ? '#3B82F6' : Colors.gray[400]}
                />
              </TouchableOpacity>
            </View>
          )}
        />

        {watch('enableTimeWindow') && (
          <View style={styles.timeWindowCard}>
            <Controller
              name="startHour"
              control={typedControl}
              render={({ field: { value, onChange } }) => (
                <View style={styles.timePickerRow}>
                  <Text style={styles.timePickerLabel}>Start Time</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timeChipsContainer}
                  >
                    {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => {
                      const label =
                        hour < 12
                          ? `${hour}:00 AM`
                          : hour === 12
                            ? '12:00 PM'
                            : `${hour - 12}:00 PM`;
                      return (
                        <TouchableOpacity
                          key={hour}
                          style={[styles.timeChip, value === hour && styles.timeChipSelected]}
                          onPress={() => onChange(hour)}
                        >
                          <Text
                            style={[
                              styles.timeChipText,
                              value === hour && styles.timeChipTextSelected,
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            />

            <Controller
              name="endHour"
              control={typedControl}
              render={({ field: { value, onChange } }) => (
                <View style={[styles.timePickerRow, { marginTop: 12 }]}>
                  <Text style={styles.timePickerLabel}>End Time</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timeChipsContainer}
                  >
                    {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => {
                      const label =
                        hour < 12
                          ? `${hour}:00 AM`
                          : hour === 12
                            ? '12:00 PM'
                            : `${hour - 12}:00 PM`;
                      const startHour = watch('startHour') ?? 0;
                      const isDisabled = hour <= startHour;
                      return (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.timeChip,
                            value === hour && styles.timeChipSelected,
                            isDisabled && styles.timeChipDisabled,
                          ]}
                          onPress={() => !isDisabled && onChange(hour)}
                          disabled={isDisabled}
                        >
                          <Text
                            style={[
                              styles.timeChipText,
                              value === hour && styles.timeChipTextSelected,
                              isDisabled && styles.timeChipTextDisabled,
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>Restrictions (Optional)</Text>
        <FormInput
          name="minOrderValue"
          control={typedControl}
          label="Minimum Order Value (₹)"
          placeholder="500"
          keyboardType="numeric"
          error={errors.minOrderValue?.message}
        />

        <FormInput
          name="maxDiscountAmount"
          control={typedControl}
          label="Maximum Discount Amount (₹)"
          placeholder="1000"
          keyboardType="numeric"
          error={errors.maxDiscountAmount?.message}
        />

        <FormInput
          name="usageLimitPerUser"
          control={typedControl}
          label="Usage Limit Per User"
          placeholder="1"
          keyboardType="numeric"
          error={errors.usageLimitPerUser?.message}
        />

        <FormInput
          name="usageLimit"
          control={typedControl}
          label="Total Usage Limit"
          placeholder="100"
          keyboardType="numeric"
          error={errors.usageLimit?.message}
        />

        <FormInput
          name="priority"
          control={typedControl}
          label="Priority (0-100)"
          placeholder="0"
          keyboardType="numeric"
          error={errors.priority?.message}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Featured Deal</Text>
          <Controller
            name="featured"
            control={typedControl}
            render={({ field: { value, onChange } }) => (
              <TouchableOpacity style={styles.switchContainer} onPress={() => onChange(!value)}>
                <Ionicons
                  name={value ? 'toggle' : 'toggle-outline'}
                  size={32}
                  color={value ? '#3B82F6' : Colors.gray[400]}
                />
              </TouchableOpacity>
            )}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.text.inverse} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={Colors.text.inverse} />
              <Text style={styles.submitButtonText}>Create Deal</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: 12,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  storeInfo: {
    backgroundColor: Colors.background.primary,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginTop: 16,
    marginBottom: 12,
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray[50],
    marginBottom: 16,
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imagePreviewText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
  },
  switchLabelGroup: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray[800],
  },
  switchSubLabel: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 2,
  },
  switchContainer: {
    padding: 4,
  },
  timeWindowCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: 16,
    marginBottom: 16,
  },
  timePickerRow: {
    gap: 8,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 6,
  },
  timeChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.gray[50],
  },
  timeChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  timeChipDisabled: {
    backgroundColor: Colors.gray[50],
    borderColor: Colors.border.default,
    opacity: 0.4,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[700],
  },
  timeChipTextSelected: {
    color: '#FFFFFF',
  },
  timeChipTextDisabled: {
    color: Colors.gray[400],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
