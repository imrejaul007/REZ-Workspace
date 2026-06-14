/**
 * Add Product Variant Screen
 * Form to create a new product variant
 */

import React, { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { showAlert } from '@/utils/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import FormInput from '@/components/forms/FormInput';
import FormSelect from '@/components/forms/FormSelect';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { productsService, uploadsService } from '@/services';
import { Product } from '@/shared/types';
import {
  CreateVariantRequest,
  AttributeType,
  VariantAttribute,
} from '@/types/variants';

// Validation schema
const variantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().optional(),
  price: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Price must be a positive number'
    ),
  salePrice: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Sale price must be a positive number'
    ),
  quantity: z
    .string()
    .min(1, 'Quantity is required')
    .refine(
      (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
      'Quantity must be a non-negative number'
    ),
  trackQuantity: z.boolean(),
  isDefault: z.boolean(),
  status: z.enum(['active', 'inactive']),
  // Attribute fields
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  weight: z.string().optional(),
  style: z.string().optional(),
  pattern: z.string().optional(),
  finish: z.string().optional(),
  capacity: z.string().optional(),
  fragrance: z.string().optional(),
  flavor: z.string().optional(),
});

type VariantFormData = z.infer<typeof variantSchema>;

// Attribute type options
const ATTRIBUTE_TYPES = [
  { label: 'Color', value: 'color' },
  { label: 'Size', value: 'size' },
  { label: 'Material', value: 'material' },
  { label: 'Weight', value: 'weight' },
  { label: 'Style', value: 'style' },
  { label: 'Pattern', value: 'pattern' },
  { label: 'Finish', value: 'finish' },
  { label: 'Capacity', value: 'capacity' },
  { label: 'Fragrance', value: 'fragrance' },
  { label: 'Flavor', value: 'flavor' },
];

export default function AddVariantScreen() {
  const params = useLocalSearchParams();
  const { productId } = params;
  const { hasPermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [variantImage, setVariantImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [addAnother, setAddAnother] = useState(false);

  const canEdit = hasPermission('products:edit');

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      name: '',
      sku: '',
      price: '',
      salePrice: '',
      quantity: '0',
      trackQuantity: true,
      isDefault: false,
      status: 'active',
    },
  });

  const trackQuantity = watch('trackQuantity');

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productIdStr = Array.isArray(productId) ? productId[0] : productId;

      if (!productIdStr) {
        showAlert('Error', 'Missing product ID');
        return;
      }

      const productData = await productsService.getProduct(productIdStr);
      setProduct(productData);
    } catch (error) {
      logger.error('Error loading product:', error);
      showAlert('Error', error.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        showAlert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setVariantImage(imageUri);

        // Upload to server
        await uploadVariantImage(imageUri);
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      showAlert('Error', 'Failed to pick image');
    }
  };

  const uploadVariantImage = async (imageUri: string) => {
    try {
      setUploadingImage(true);

      logger.debug('📤 Uploading variant image:', imageUri);

      // Upload image using uploadsService
      const result = await uploadsService.uploadImage(imageUri, `variant_${Date.now()}.jpg`);

      logger.debug('✅ Variant image uploaded successfully:', result.url);

      // Update variant image with the uploaded URL
      setVariantImage(result.url);

      // Show success feedback
      showAlert('Success', 'Image uploaded successfully');
    } catch (error) {
      logger.error('❌ Failed to upload variant image:', error);
      showAlert('Upload Failed', error.message || 'Failed to upload image. Please try again.');
      // Reset image on upload failure
      setVariantImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const addAttribute = (attributeType: string) => {
    if (!selectedAttributes.includes(attributeType)) {
      setSelectedAttributes([...selectedAttributes, attributeType]);
    }
  };

  const removeAttribute = (attributeType: string) => {
    setSelectedAttributes(selectedAttributes.filter((attr) => attr !== attributeType));
  };

  const onSubmit = async (data: VariantFormData) => {
    if (!canEdit) {
      showAlert('Permission Denied', 'You do not have permission to add variants');
      return;
    }

    try {
      setSaving(true);

      const productIdStr = Array.isArray(productId) ? productId[0] : productId;

      // Build attributes array from selected attributes
      const attributes: VariantAttribute[] = selectedAttributes
        .map((attrType) => ({
          type: attrType as AttributeType,
          name: attrType,
          value: (data[attrType as keyof VariantFormData] as string) || '',
        }))
        .filter((attr) => attr.value);

      // Generate variant name from attributes if not provided
      let variantName = data.name;
      if (!variantName && attributes.length > 0) {
        variantName = attributes.map((attr) => attr.value).join(' / ');
      }

      // Calculate price adjustment from base price
      const basePrice = product?.pricing?.selling ?? 0;
      const variantPrice = data.price ? parseFloat(data.price) : basePrice;
      const priceAdjustment = variantPrice - basePrice;

      const variantData: CreateVariantRequest = {
        productId: productIdStr,
        attributes,
        sku: data.sku || undefined,
        pricing: {
          priceAdjustment,
          costPrice: undefined,
          compareAtPrice: data.salePrice ? parseFloat(data.salePrice) : undefined,
        },
        inventory: {
          stock: parseInt(data.quantity),
          trackInventory: data.trackQuantity,
          lowStockThreshold: 5,
          allowBackorders: false,
        },
        images: variantImage
          ? [
              {
                url: variantImage,
                isMain: true,
                sortOrder: 0,
              },
            ]
          : undefined,
        isDefault: data.isDefault,
        isActive: data.status === 'active',
      };

      await productsService.createVariant(productIdStr, variantData);

      showAlert('Success', 'Variant created successfully', [
        {
          text: 'OK',
          onPress: () => {
            if (addAnother) {
              reset();
              setVariantImage(null);
            } else {
              router.back();
            }
          },
        },
      ]);
    } catch (error) {
      logger.error('Error creating variant:', error);
      showAlert('Error', error.message || 'Failed to create variant');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>
              Add Variant
            </ThemedText>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <ThemedText style={styles.loadingText}>Loading...</ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!canEdit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>
              Add Variant
            </ThemedText>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="lock-closed-outline" size={64} color={Colors.light.destructive} />
            <ThemedText style={styles.errorTitle}>Permission Denied</ThemedText>
            <ThemedText style={styles.errorSubtitle}>
              You do not have permission to add product variants
            </ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <ThemedText type="title" style={styles.title}>
              Add Variant
            </ThemedText>
            {product && <ThemedText style={styles.productName}>{product.name}</ThemedText>}
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Variant Image */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Variant Image</ThemedText>
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={handlePickImage}
              disabled={uploadingImage}
            >
              {variantImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: variantImage }} style={styles.imagePreview} />

                  {/* Upload Progress Overlay */}
                  {uploadingImage && (
                    <View style={styles.uploadOverlay}>
                      <ActivityIndicator size="large" color={Colors.light.background} />
                      <ThemedText style={styles.uploadingText}>Uploading...</ThemedText>
                    </View>
                  )}

                  {/* Remove Button */}
                  {!uploadingImage && (
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setVariantImage(null)}
                    >
                      <Ionicons name="close-circle" size={28} color={Colors.light.destructive} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color={Colors.light.textSecondary} />
                  <ThemedText style={styles.imagePlaceholderText}>
                    {uploadingImage ? 'Uploading...' : 'Add Image'}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>

            <FormInput
              name="name"
              control={control}
              label="Variant Name"
              placeholder="e.g., Red Large Cotton"
              helperText="Auto-generated from attributes if left empty"
            />

            <FormInput
              name="sku"
              control={control}
              label="SKU (Optional)"
              placeholder="e.g., PRD-RED-L"
              autoCapitalize="characters"
            />
          </View>

          {/* Attributes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Attributes</ThemedText>
              <FormSelect
                name="addAttribute"
                control={control}
                placeholder="Add Attribute"
                options={ATTRIBUTE_TYPES.filter((attr) => !selectedAttributes.includes(attr.value))}
                onSelect={(value) => value && addAttribute(value)}
                containerStyle={{ marginBottom: 0, flex: 1 }}
              />
            </View>

            {selectedAttributes.length === 0 ? (
              <View style={styles.emptyAttributes}>
                <ThemedText style={styles.emptyAttributesText}>
                  No attributes added. Select attributes above to define this variant.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.attributesList}>
                {selectedAttributes.map((attrType) => (
                  <View key={attrType} style={styles.attributeItem}>
                    <View style={styles.attributeInputContainer}>
                      <FormInput
                        name={attrType}
                        control={control}
                        label={ATTRIBUTE_TYPES.find((a) => a.value === attrType)?.label}
                        placeholder={`Enter ${attrType}`}
                        containerStyle={{ flex: 1, marginBottom: 0 }}
                      />
                      <TouchableOpacity
                        style={styles.removeAttributeButton}
                        onPress={() => removeAttribute(attrType)}
                      >
                        <Ionicons name="close-circle" size={24} color={Colors.light.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Pricing (Optional)</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Leave empty to use product's default price
            </ThemedText>

            <FormInput
              name="price"
              control={control}
              label="Regular Price"
              placeholder="0.00"
              keyboardType="decimal-pad"
              icon="pricetag-outline"
            />

            <FormInput
              name="salePrice"
              control={control}
              label="Sale Price"
              placeholder="0.00"
              keyboardType="decimal-pad"
              icon="flash-outline"
            />
          </View>

          {/* Inventory */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Inventory</ThemedText>

            <View style={styles.switchRow}>
              <ThemedText style={styles.switchLabel}>Track Quantity</ThemedText>
              <Switch
                value={trackQuantity}
                onValueChange={(value) => {
                  control._formValues.trackQuantity = value;
                }}
                trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              />
            </View>

            {trackQuantity && (
              <FormInput
                name="quantity"
                control={control}
                label="Stock Quantity"
                placeholder="0"
                keyboardType="number-pad"
                icon="cube-outline"
              />
            )}
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Settings</ThemedText>

            <View style={styles.switchRow}>
              <View>
                <ThemedText style={styles.switchLabel}>Set as Default Variant</ThemedText>
                <ThemedText style={styles.switchDescription}>
                  This variant will be selected by default
                </ThemedText>
              </View>
              <Switch
                value={watch('isDefault')}
                onValueChange={(value) => {
                  control._formValues.isDefault = value;
                }}
                trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              />
            </View>

            <FormSelect
              name="status"
              control={control}
              label="Status"
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
            />
          </View>

          {/* Submit Buttons */}
          <View style={styles.submitSection}>
            <View style={styles.addAnotherRow}>
              <Switch
                value={addAnother}
                onValueChange={setAddAnother}
                trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              />
              <ThemedText style={styles.addAnotherText}>Save and add another</ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (saving || loading) && styles.submitButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={saving || loading}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.light.background} />
              ) : (
                <ThemedText style={styles.submitText}>Create Variant</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
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
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: Colors.light.text,
  },
  productName: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
  },
  errorSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.light.background,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  imagePicker: {
    alignItems: 'center',
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    color: Colors.light.background,
    fontSize: 12,
    fontWeight: '600',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.light.background,
    borderRadius: 14,
  },
  emptyAttributes: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
  },
  emptyAttributesText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  attributesList: {
    gap: 12,
  },
  attributeItem: {
    marginBottom: 8,
  },
  attributeInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  removeAttributeButton: {
    padding: 4,
    marginTop: 28,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  switchDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  submitSection: {
    backgroundColor: Colors.light.background,
    padding: 16,
    marginBottom: 16,
  },
  addAnotherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  addAnotherText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
