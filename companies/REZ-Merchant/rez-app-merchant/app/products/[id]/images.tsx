import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
  Modal,
  TextInput,
  FlatList,
  Platform,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  productGalleryService,
  ProductGalleryItem,
  ProductGalleryCategory,
} from '@/services/api/productGallery';
import { productsService } from '@/services';
import { logger } from '@/utils/logger';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';
import { isWeb } from '@/utils/platform';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// Helper function to show success/error messages
const showSuccess = (title: string, message: string, setSuccess, setShow) => {
  setSuccess({ title, message });
  setShow(true);
};

const showError = (title: string, message: string, setError, setShow) => {
  setError({ title, message });
  setShow(true);
};

// Conditional import for drag functionality (not available on web)
let DraggableFlatList: unknown = null;
let RenderItemParams: unknown = null;

if (Platform.OS !== 'web') {
  try {
    const DragModule = require('react-native-draggable-flatlist');
    DraggableFlatList = DragModule.default;
    RenderItemParams = DragModule.RenderItemParams;
  } catch (e) {
    logger.debug('Draggable FlatList not available for this platform');
  }
}

const { width } = Dimensions.get('window');
const imageSize = (width - 48) / 3; // 3 columns with padding

const PRODUCT_IMAGE_CATEGORIES = [
  'main',
  'variant',
  'lifestyle',
  'details',
  'packaging',
  'general',
];

export default function ProductImagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<unknown>(null);
  const [galleryItems, setGalleryItems] = useState<ProductGalleryItem[]>([]);
  const [categories, setCategories] = useState<ProductGalleryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Advanced features state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [dragEnabled, setDragEnabled] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Cross-platform modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [errorMessage, setErrorMessage] = useState({ title: '', message: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ title: '', message: '', onConfirm: () => {} });

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState<{
    category: string;
    title: string;
    description: string;
    variantId: string;
    tags: string[];
  }>({
    category: 'main',
    title: '',
    description: '',
    variantId: '',
    tags: [],
  });
  const [selectedFiles, setSelectedFiles] = useState<unknown[]>([]);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<ProductGalleryItem | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    category: string;
    variantId: string;
    tags: string[];
  }>({
    title: '',
    description: '',
    category: 'main',
    variantId: '',
    tags: [],
  });

  // Load product and gallery
  useEffect(() => {
    if (productId) {
      loadProduct();
      loadGallery();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const data = await productsService.getProduct(productId);
      setProduct(data);
    } catch (error) {
      logger.error('Failed to load product:', error);
      showError(
        'Error',
        error.message || 'Failed to load product',
        setErrorMessage,
        setShowErrorModal
      );
    }
  };

  const loadGallery = async (category?: string) => {
    try {
      setLoading(true);
      const categoryToUse = category !== undefined ? category : selectedCategory;
      const response = await productGalleryService.getGallery(productId, {
        category: categoryToUse === 'all' ? undefined : (categoryToUse as 'main' | 'variant' | 'lifestyle' | 'details' | 'packaging' | 'general'),
        limit: 100,
      });

      setGalleryItems(response.items || []);

      // Load categories
      const cats = await productGalleryService.getCategories(productId);
      setCategories(cats);
    } catch (error) {
      logger.error('Failed to load gallery:', error);
      showError(
        'Error',
        error.message || 'Failed to load images',
        setErrorMessage,
        setShowErrorModal
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGallery();
    setRefreshing(false);
  }, [productId, selectedCategory]);

  // Image picker
  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError(
          'Permission Denied',
          'Camera roll permission is required',
          setErrorMessage,
          setShowErrorModal
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 20,
      });

      if (!result.canceled && result.assets) {
        setSelectedFiles(result.assets);
        setShowUploadModal(true);
      }
    } catch (error) {
      logger.error('Image picker error:', error);
      showError('Error', 'Failed to pick images', setErrorMessage, setShowErrorModal);
    }
  };

  // Upload handler
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showError('No Images', 'Please select images to upload', setErrorMessage, setShowErrorModal);
      return;
    }

    if (!uploadForm.category) {
      showError(
        'Category Required',
        'Please select a category',
        setErrorMessage,
        setShowErrorModal
      );
      return;
    }

    try {
      setUploading(true);

      if (selectedFiles.length === 1) {
        // Single upload
        await productGalleryService.uploadItem(productId, selectedFiles[0], {
          category: uploadForm.category as 'main' | 'variant' | 'lifestyle' | 'details' | 'packaging' | 'general',
          title: uploadForm.title || undefined,
          description: uploadForm.description || undefined,
          variantId: uploadForm.variantId || undefined,
          tags: uploadForm.tags.length > 0 ? uploadForm.tags : undefined,
          isVisible: true,
        });

        showSuccess(
          'Success',
          'Image uploaded successfully',
          setSuccessMessage,
          setShowSuccessModal
        );
      } else {
        // Bulk upload
        const result = await productGalleryService.bulkUpload(productId, selectedFiles, {
          category: uploadForm.category as 'main' | 'variant' | 'lifestyle' | 'details' | 'packaging' | 'general',
          title: uploadForm.title || undefined,
          description: uploadForm.description || undefined,
          variantId: uploadForm.variantId || undefined,
          tags: uploadForm.tags.length > 0 ? uploadForm.tags : undefined,
          isVisible: true,
        });

        showSuccess(
          'Upload Complete',
          `Uploaded ${result.totalUploaded} of ${selectedFiles.length} images`,
          setSuccessMessage,
          setShowSuccessModal
        );
      }

      // Reset and reload
      setShowUploadModal(false);
      setSelectedFiles([]);
      setUploadForm({
        category: 'main',
        title: '',
        description: '',
        variantId: '',
        tags: [],
      });
      loadGallery();
    } catch (error) {
      logger.error('Upload error:', error);
      showError(
        'Upload Failed',
        error.message || 'Failed to upload images',
        setErrorMessage,
        setShowErrorModal
      );
    } finally {
      setUploading(false);
    }
  };

  // Edit handler
  const openEditModal = (item: ProductGalleryItem) => {
    setEditItem(item);
    setEditForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category,
      variantId: item.variantId || '',
      tags: item.tags || [],
    });
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editItem) return;

    try {
      await productGalleryService.updateItem(productId, editItem.id, {
        title: editForm.title || undefined,
        description: editForm.description || undefined,
        category: editForm.category as 'main' | 'variant' | 'lifestyle' | 'details' | 'packaging' | 'general',
        variantId: editForm.variantId || undefined,
        tags: editForm.tags.length > 0 ? editForm.tags : undefined,
      });

      showSuccess('Success', 'Image updated successfully', setSuccessMessage, setShowSuccessModal);
      setShowEditModal(false);
      loadGallery();
    } catch (error) {
      showError(
        'Update Failed',
        error.message || 'Failed to update image',
        setErrorMessage,
        setShowErrorModal
      );
    }
  };

  // Delete handler
  const confirmDelete = (item: ProductGalleryItem) => {
    setConfirmConfig({
      title: 'Delete Image',
      message: 'Are you sure you want to delete this image? This action cannot be undone.',
      onConfirm: () => handleDelete(item.id),
    });
    setShowConfirmModal(true);
  };

  const handleDelete = async (itemId: string) => {
    try {
      setDeleting(true);
      await productGalleryService.deleteItem(productId, itemId);
      showSuccess('Success', 'Image deleted successfully', setSuccessMessage, setShowSuccessModal);
      loadGallery();
    } catch (error) {
      showError(
        'Delete Failed',
        error.message || 'Failed to delete image',
        setErrorMessage,
        setShowErrorModal
      );
    } finally {
      setDeleting(false);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    setConfirmConfig({
      title: 'Delete Images',
      message: `Are you sure you want to delete ${selectedItems.size} image(s)? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setDeleting(true);
          await productGalleryService.bulkDelete(productId, Array.from(selectedItems));
          showSuccess(
            'Success',
            `Deleted ${selectedItems.size} image(s)`,
            setSuccessMessage,
            setShowSuccessModal
          );
          setSelectedItems(new Set());
          setIsSelectionMode(false);
          loadGallery();
        } catch (error) {
          showError(
            'Delete Failed',
            error.message || 'Failed to delete images',
            setErrorMessage,
            setShowErrorModal
          );
        } finally {
          setDeleting(false);
        }
      },
    });
    setShowConfirmModal(true);
  };

  // Set cover
  const handleSetCover = async (itemId: string) => {
    try {
      await productGalleryService.setCover(productId, itemId);
      showSuccess(
        'Success',
        'Cover image set successfully',
        setSuccessMessage,
        setShowSuccessModal
      );
      loadGallery();
    } catch (error) {
      showError(
        'Failed',
        error.message || 'Failed to set cover image',
        setErrorMessage,
        setShowErrorModal
      );
    }
  };

  // Toggle selection
  const toggleSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Render gallery item
  const renderGalleryItem = ({ item, drag, isActive }) => {
    const isSelected = selectedItems.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.galleryItem, isActive && styles.galleryItemActive]}
        onLongPress={() => {
          if (!isWeb) {
            setIsSelectionMode(true);
            toggleSelection(item.id);
          }
        }}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(item.id);
          }
        }}
        disabled={deleting || uploading}
      >
        <Image source={{ uri: item.url }} style={styles.galleryImage} />

        {/* Badges */}
        <View style={styles.badgeContainer}>
          {item.isCover && (
            <View style={[styles.badge, styles.coverBadge]}>
              <Text style={styles.badgeText}>Cover</Text>
            </View>
          )}
          {!item.isVisible && (
            <View style={[styles.badge, styles.hiddenBadge]}>
              <Text style={styles.badgeText}>Hidden</Text>
            </View>
          )}
          <View style={[styles.badge, styles.categoryBadge]}>
            <Text style={styles.badgeText}>{item.category}</Text>
          </View>
        </View>

        {/* Selection checkbox */}
        {isSelectionMode && (
          <View style={styles.selectionCheckbox}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
          </View>
        )}

        {/* Quick actions */}
        {!isSelectionMode && (
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}>
              <Ionicons name="create-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => handleSetCover(item.id)}>
              <Ionicons name="star-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => confirmDelete(item)}>
              <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Product Gallery</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={pickImages}
            style={styles.bulkUploadButton}
            disabled={uploading}
          >
            <Ionicons name="images" size={18} color="#FFFFFF" />
            <Text style={styles.bulkUploadText}>Bulk Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickImages}
            style={styles.uploadIconButton}
            disabled={uploading}
          >
            <Ionicons name="add" size={28} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Product info */}
      {product && (
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.imageCount}>{galleryItems.length} items in gallery</Text>
        </View>
      )}

      {/* Category filters with view mode */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilters}
          contentContainerStyle={styles.categoryFiltersContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
            onPress={() => {
              setSelectedCategory('all');
              loadGallery('all');
            }}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === 'all' && styles.categoryChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {PRODUCT_IMAGE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => {
                setSelectedCategory(cat);
                loadGallery(cat);
              }}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* View mode icons */}
        <View style={styles.viewModeIcons}>
          <TouchableOpacity style={styles.viewModeButton}>
            <Ionicons name="grid" size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewModeButton}>
            <Ionicons name="images-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewModeButton}>
            <Ionicons name="videocam-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selection mode toolbar */}
      {isSelectionMode && (
        <View style={styles.selectionToolbar}>
          <TouchableOpacity
            onPress={() => {
              setIsSelectionMode(false);
              setSelectedItems(new Set());
            }}
          >
            <Text style={styles.selectionToolbarText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.selectionCount}>{selectedItems.size} selected</Text>

          <TouchableOpacity onPress={handleBulkDelete} disabled={selectedItems.size === 0}>
            <Ionicons
              name="trash-outline"
              size={24}
              color={selectedItems.size > 0 ? '#EF4444' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Gallery grid */}
      <FlatList
        data={galleryItems}
        renderItem={renderGalleryItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.galleryGrid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyText}>No gallery items yet</Text>
            <Text style={styles.emptySubtext}>Upload images to showcase your product</Text>
            <TouchableOpacity onPress={pickImages} style={styles.emptyButton}>
              <Ionicons name="add-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.emptyButtonText}>Upload First Item</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Upload Modal */}
      <Modal visible={showUploadModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Images ({selectedFiles.length})</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Category */}
              <Text style={styles.formLabel}>Category *</Text>
              <View style={styles.categoryOptions}>
                {PRODUCT_IMAGE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      uploadForm.category === cat && styles.categoryOptionActive,
                    ]}
                    onPress={() => setUploadForm({ ...uploadForm, category: cat })}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        uploadForm.category === cat && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title */}
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={uploadForm.title}
                onChangeText={(text) => setUploadForm({ ...uploadForm, title: text })}
                placeholder="Enter title"
              />

              {/* Description */}
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={uploadForm.description}
                onChangeText={(text) => setUploadForm({ ...uploadForm, description: text })}
                placeholder="Enter description"
                multiline
                numberOfLines={3}
              />

              {/* Variant ID */}
              <Text style={styles.formLabel}>Variant ID (optional)</Text>
              <TextInput
                style={styles.input}
                value={uploadForm.variantId}
                onChangeText={(text) => setUploadForm({ ...uploadForm, variantId: text })}
                placeholder="Enter variant ID if applicable"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUploadModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Image</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {editItem && <Image source={{ uri: editItem.url }} style={styles.previewImage} />}

              {/* Category */}
              <Text style={styles.formLabel}>Category *</Text>
              <View style={styles.categoryOptions}>
                {PRODUCT_IMAGE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      editForm.category === cat && styles.categoryOptionActive,
                    ]}
                    onPress={() => setEditForm({ ...editForm, category: cat })}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        editForm.category === cat && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title */}
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={editForm.title}
                onChangeText={(text) => setEditForm({ ...editForm, title: text })}
                placeholder="Enter title"
              />

              {/* Description */}
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.description}
                onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                placeholder="Enter description"
                multiline
                numberOfLines={3}
              />

              {/* Variant ID */}
              <Text style={styles.formLabel}>Variant ID</Text>
              <TextInput
                style={styles.input}
                value={editForm.variantId}
                onChangeText={(text) => setEditForm({ ...editForm, variantId: text })}
                placeholder="Enter variant ID if applicable"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitButton} onPress={handleEdit}>
                <Text style={styles.submitButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <Alert
        visible={showErrorModal}
        title={errorMessage.title}
        message={errorMessage.message}
        onClose={() => setShowErrorModal(false)}
        type="error"
      />

      <Alert
        visible={showSuccessModal}
        title={successMessage.title}
        message={successMessage.message}
        onClose={() => setShowSuccessModal(false)}
        type="success"
      />

      <ConfirmDialog
        visible={showConfirmModal}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          setShowConfirmModal(false);
          confirmConfig.onConfirm();
        }}
        onCancel={() => setShowConfirmModal(false)}
      />

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 4,
    width: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulkUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    gap: 6,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bulkUploadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  uploadIconButton: {
    padding: 4,
    width: 32,
  },
  productInfo: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  imageCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryFilters: {
    flex: 1,
  },
  categoryFiltersContent: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    minHeight: 32,
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  viewModeIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    gap: 4,
  },
  viewModeButton: {
    padding: 6,
    borderRadius: 6,
  },
  selectionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  selectionToolbarText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  selectionCount: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  galleryGrid: {
    padding: 16,
    paddingBottom: BOTTOM_NAV_HEIGHT_CONSTANT + 16,
  },
  galleryItem: {
    width: imageSize,
    height: imageSize,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  galleryItemActive: {
    opacity: 0.5,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  coverBadge: {
    backgroundColor: '#F59E0B',
  },
  hiddenBadge: {
    backgroundColor: '#6B7280',
  },
  categoryBadge: {
    backgroundColor: '#8B5CF6',
  },
  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectionCheckbox: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  quickActions: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 19,
    color: '#111827',
    fontWeight: '700',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    padding: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  categoryOptionActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryOptionTextActive: {
    color: '#FFFFFF',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
