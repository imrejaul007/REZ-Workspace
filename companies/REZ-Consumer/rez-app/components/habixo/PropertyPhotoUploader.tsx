// Property Photo Uploader Component
// Reusable component for uploading and managing property photos in Habixo

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { borderRadius, colors, spacing, typography, shadows } from '@/constants/theme';
import { platformAlertSimple } from '@/utils/platformAlert';
import { useIsMounted } from '@/hooks/useIsMounted';
import { habixoPhotoApi, PropertyPhoto } from '@/services/habixoPhotoApi';
import CachedImage from '@/components/ui/CachedImage';

interface PropertyPhotoUploaderProps {
  propertyId: string;
  initialPhotos?: PropertyPhoto[];
  onPhotosChange?: (photos: PropertyPhoto[]) => void;
  maxPhotos?: number;
  editable?: boolean;
}

interface PhotoUpload {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  uploadProgress: number;
  isUploading: boolean;
  error?: string;
}

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

function PropertyPhotoUploader({
  propertyId,
  initialPhotos = [],
  onPhotosChange,
  maxPhotos = 50,
  editable = true,
}: PropertyPhotoUploaderProps) {
  const [photos, setPhotos] = useState<PropertyPhoto[]>(initialPhotos);
  const [uploads, setUploads] = useState<PhotoUpload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PropertyPhoto | null>(null);
  const [editingCaption, setEditingCaption] = useState<string>('');
  const isMounted = useIsMounted();

  /**
   * Request media library permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        platformAlertSimple(
          'Permission Required',
          'Please grant access to your photo library to upload images.'
        );
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Pick images from device
   */
  const pickImages = useCallback(async () => {
    if (!editable || isUploading) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const validAssets = result.assets.filter((asset) => {
          // Check file size (rough estimate based on dimensions)
          if (asset.width && asset.height) {
            const pixels = asset.width * asset.height;
            // Approximate: 4MB per megapixel at 80% quality
            const approxSize = (pixels / 1000000) * 4;
            if (approxSize > MAX_FILE_SIZE_MB) {
              platformAlertSimple(
                'File Too Large',
                `${asset.uri.split('/').pop() || 'Image'} is too large. Please select smaller images.`
              );
              return false;
            }
          }
          return true;
        });

        if (validAssets.length === 0) return;

        // Check max photos limit
        if (photos.length + validAssets.length > maxPhotos) {
          platformAlertSimple(
            'Too Many Photos',
            `You can only upload up to ${maxPhotos} photos. Please remove some photos first.`
          );
          return;
        }

        // Add to upload queue
        const newUploads: PhotoUpload[] = validAssets.map((asset) => ({
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          uri: asset.uri,
          fileName: asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          uploadProgress: 0,
          isUploading: true,
        }));

        setUploads((prev) => [...prev, ...newUploads]);
        setIsUploading(true);

        // Start uploading
        await uploadPhotos(newUploads);
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to select images. Please try again.');
    }
  }, [editable, isUploading, photos.length, maxPhotos, requestPermissions]);

  /**
   * Upload photos to server
   */
  const uploadPhotos = useCallback(
    async (uploadsToUpload: PhotoUpload[]) => {
      const photosToUpload = uploadsToUpload.map((u) => ({
        uri: u.uri,
        name: u.fileName,
        type: u.mimeType,
      }));

      const result = await habixoPhotoApi.uploadPhotos(propertyId, photosToUpload);

      if (!isMounted()) return;

      if (result.success && result.data) {
        // Remove from uploads queue
        setUploads((prev) => prev.filter((u) => !uploadsToUpload.some((cu) => cu.id === u.id)));

        // Add to photos list
        const newPhotos = result.data.photos;
        setPhotos((prev) => {
          const updated = [...prev, ...newPhotos].sort((a, b) => a.order - b.order);
          onPhotosChange?.(updated);
          return updated;
        });
      } else {
        // Mark uploads as failed
        setUploads((prev) =>
          prev.map((u) =>
            uploadsToUpload.some((cu) => cu.id === u.id)
              ? { ...u, isUploading: false, error: result.message }
              : u
          )
        );
        platformAlertSimple('Upload Failed', result.message || 'Failed to upload photos');
      }

      setIsUploading(uploads.length > 0);
    },
    [propertyId, onPhotosChange, isMounted, uploads.length]
  );

  /**
   * Delete a photo
   */
  const handleDeletePhoto = useCallback(
    async (photo: PropertyPhoto) => {
      Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            const result = await habixoPhotoApi.deletePhoto(propertyId, photo.photoId);

            if (!isMounted()) return;
            setIsLoading(false);

            if (result.success) {
              setPhotos((prev) => {
                const updated = prev.filter((p) => p.photoId !== photo.photoId);
                onPhotosChange?.(updated);
                return updated;
              });
              setSelectedPhoto(null);
            } else {
              platformAlertSimple('Error', result.error || 'Failed to delete photo');
            }
          },
        },
      ]);
    },
    [propertyId, onPhotosChange, isMounted]
  );

  /**
   * Set photo as primary
   */
  const handleSetPrimary = useCallback(
    async (photo: PropertyPhoto) => {
      setIsLoading(true);
      const result = await habixoPhotoApi.setPrimaryPhoto(propertyId, photo.photoId);

      if (!isMounted()) return;
      setIsLoading(false);

      if (result.success) {
        setPhotos((prev) => {
          const updated = prev.map((p) => ({
            ...p,
            isPrimary: p.photoId === photo.photoId,
          }));
          onPhotosChange?.(updated);
          return updated;
        });
        setSelectedPhoto(null);
        platformAlertSimple('Success', 'Primary photo updated');
      } else {
        platformAlertSimple('Error', result.error || 'Failed to set primary photo');
      }
    },
    [propertyId, onPhotosChange, isMounted]
  );

  /**
   * Update photo caption
   */
  const handleUpdateCaption = useCallback(
    async (photo: PropertyPhoto, caption: string) => {
      setIsLoading(true);
      const result = await habixoPhotoApi.updatePhotoCaption(propertyId, photo.photoId, caption);

      if (!isMounted()) return;
      setIsLoading(false);

      if (result.success) {
        setPhotos((prev) => {
          const updated = prev.map((p) =>
            p.photoId === photo.photoId ? { ...p, caption } : p
          );
          onPhotosChange?.(updated);
          return updated;
        });
        setSelectedPhoto(null);
      } else {
        platformAlertSimple('Error', result.error || 'Failed to update caption');
      }
    },
    [propertyId, onPhotosChange, isMounted]
  );

  /**
   * Open edit modal
   */
  const openEditModal = (photo: PropertyPhoto) => {
    setSelectedPhoto(photo);
    setEditingCaption(photo.caption || '');
  };

  const retryUpload = (upload: PhotoUpload) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === upload.id ? { ...u, isUploading: true, error: undefined } : u
      )
    );
    uploadPhotos([upload]);
  };

  const removeFailedUpload = (uploadId: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== uploadId));
  };

  const totalItems = photos.length + uploads.length;
  const canAddMore = totalItems < maxPhotos;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Photos</Text>
        <Text style={styles.count}>
          {photos.length} of {maxPhotos} photos
        </Text>
      </View>

      {/* Photo Grid */}
      {photos.length > 0 || uploads.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Uploaded Photos */}
          {photos.map((photo) => (
            <Pressable
              key={photo.photoId}
              style={styles.photoCard}
              onPress={() => editable && openEditModal(photo)}
            >
              <CachedImage source={photo.url} style={styles.photoImage} contentFit="cover" />
              {photo.isPrimary && (
                <View style={styles.primaryBadge}>
                  <Ionicons name="star" size={12} color="#fff" />
                  <Text style={styles.primaryBadgeText}>Primary</Text>
                </View>
              )}
              {editable && (
                <Pressable
                  style={styles.editOverlay}
                  onPress={() => openEditModal(photo)}
                >
                  <Ionicons name="pencil" size={16} color="#fff" />
                </Pressable>
              )}
            </Pressable>
          ))}

          {/* Uploading Photos */}
          {uploads.map((upload) => (
            <View key={upload.id} style={styles.photoCard}>
              <CachedImage source={upload.uri} style={styles.photoImage} contentFit="cover" />
              {upload.isUploading ? (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.uploadingText}>{upload.uploadProgress}%</Text>
                </View>
              ) : upload.error ? (
                <View style={styles.errorOverlay}>
                  <Pressable style={styles.retryButton} onPress={() => retryUpload(upload)}>
                    <Ionicons name="refresh" size={16} color="#fff" />
                  </Pressable>
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeFailedUpload(upload.id)}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}

          {/* Add More Button */}
          {editable && canAddMore && (
            <Pressable style={styles.addButton} onPress={pickImages}>
              <Ionicons name="add" size={32} color={colors.primary[500]} />
              <Text style={styles.addButtonText}>Add Photos</Text>
            </Pressable>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={48} color={colors.neutral[300]} />
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptyMessage}>
            Add photos to showcase your property
          </Text>
          {editable && (
            <Pressable style={styles.uploadButton} onPress={pickImages}>
              <Ionicons name="camera" size={20} color={colors.primary[500]} />
              <Text style={styles.uploadButtonText}>Upload Photos</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Photo Edit Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={() => setSelectedPhoto(null)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </Pressable>

            {/* Photo Preview */}
            {selectedPhoto && (
              <>
                <CachedImage
                  source={selectedPhoto.url}
                  style={styles.modalImage}
                  contentFit="contain"
                />

                {/* Caption Input */}
                <View style={styles.captionSection}>
                  <Text style={styles.captionLabel}>Caption</Text>
                  <TextInput
                    style={styles.captionInput}
                    value={editingCaption}
                    onChangeText={setEditingCaption}
                    placeholder="Add a caption..."
                    placeholderTextColor={colors.text.tertiary}
                    maxLength={200}
                  />
                </View>

                {/* Actions */}
                <View style={styles.modalActions}>
                  {selectedPhoto.isPrimary ? (
                    <View style={styles.primaryIndicator}>
                      <Ionicons name="star" size={20} color={colors.warning[500]} />
                      <Text style={styles.primaryIndicatorText}>Primary Photo</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handleSetPrimary(selectedPhoto)}
                      disabled={isLoading}
                    >
                      <Ionicons name="star-outline" size={20} color={colors.text.primary} />
                      <Text style={styles.actionButtonText}>Set as Primary</Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={() => handleUpdateCaption(selectedPhoto, editingCaption)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={[styles.actionButtonText, styles.saveButtonText]}>Save</Text>
                      </>
                    )}
                  </Pressable>
                </View>

                {/* Delete Button */}
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(selectedPhoto)}
                  disabled={isLoading}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={styles.deleteButtonText}>Delete Photo</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  count: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  photoCard: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.neutral[100],
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[500],
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  primaryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  editOverlay: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  retryButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
  },
  addButtonText: {
    ...typography.bodySmall,
    color: colors.primary[500],
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyMessage: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  uploadButtonText: {
    ...typography.button,
    color: colors.primary[500],
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.neutral[100],
  },
  captionSection: {
    marginBottom: spacing.lg,
  },
  captionLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  primaryIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: colors.warning[50],
    borderRadius: borderRadius.md,
  },
  primaryIndicatorText: {
    ...typography.body,
    color: colors.warning[700],
    fontWeight: '600',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  saveButton: {
    backgroundColor: colors.primary[500],
  },
  saveButtonText: {
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: spacing.sm,
  },
  deleteButtonText: {
    ...typography.button,
    color: colors.error,
  },
});

export default React.memo(PropertyPhotoUploader);
