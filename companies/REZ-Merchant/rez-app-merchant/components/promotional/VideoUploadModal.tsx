import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/DesignTokens';
import ConfirmModal from '@/components/common/ConfirmModal';
import ProductSelector from './ProductSelector';
import { ProductSummary, CreateVideoRequest } from '@/types/promotionalVideo';
import { uploadsService } from '@/services/api/uploads';
import { promotionalVideosService } from '@/services/api/promotionalVideos';
import { logger } from '@/utils/logger';

interface VideoUploadModalProps {
  visible: boolean;
  storeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_DURATION = 180; // 3 minutes in seconds
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const MAX_FILE_SIZE_MB = 50;

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function VideoUploadModal({
  visible,
  storeId,
  onClose,
  onSuccess,
}: VideoUploadModalProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<ProductSummary[]>([]);

  // Video state
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoFileSize, setVideoFileSize] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isValidDuration, setIsValidDuration] = useState(true);
  const [isValidFileSize, setIsValidFileSize] = useState(true);

  // Background upload state (starts immediately when video is selected)
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadResult, setVideoUploadResult] = useState<{
    url: string;
    thumbnailUrl: string;
    publicId?: string;
    duration?: number;
  } | null>(null);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);

  // Final submit state (creating video record)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI state
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const videoRef = useRef<Video>(null);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return title.trim() || description.trim() || videoUri || selectedProducts.length > 0;
  }, [title, description, videoUri, selectedProducts]);

  // Handle close with confirmation
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowConfirmClose(true);
    } else {
      resetAndClose();
    }
  }, [hasUnsavedChanges]);

  // Reset form and close modal
  const resetAndClose = useCallback(() => {
    setTitle('');
    setDescription('');
    setTags('');
    setSelectedProducts([]);
    setVideoUri(null);
    setVideoDuration(0);
    setVideoFileSize(0);
    setVideoFile(null);
    setIsValidDuration(true);
    setIsValidFileSize(true);
    setIsVideoUploading(false);
    setVideoUploadProgress(0);
    setVideoUploadResult(null);
    setVideoUploadError(null);
    setIsSubmitting(false);
    setErrors({});
    setShowConfirmClose(false);
    onClose();
  }, [onClose]);

  // Upload video to Cloudinary (called automatically after selection)
  const uploadVideoToCloudinary = async (uri: string, file: File | null) => {
    setIsVideoUploading(true);
    setVideoUploadProgress(0);
    setVideoUploadError(null);
    setVideoUploadResult(null);

    try {
      if (__DEV__) logger.log('Starting background video upload to Cloudinary');
      const uploadResult = await uploadsService.uploadVideo(
        uri,
        undefined,
        'store',
        (progress) => setVideoUploadProgress(progress),
        file || undefined
      );

      if (!uploadResult.url) {
        throw new Error('Upload failed - no URL returned');
      }

      if (__DEV__) logger.log('Video uploaded successfully', { url: uploadResult.url });

      // Store the result
      setVideoUploadResult({
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl || uploadResult.url.replace('.mp4', '.jpg'),
        publicId: uploadResult.publicId,
        duration: uploadResult.duration,
      });

      // Update duration from Cloudinary if we didn't have it
      if (uploadResult.duration && uploadResult.duration > 0) {
        const cloudinaryDuration = Math.ceil(uploadResult.duration);
        setVideoDuration(cloudinaryDuration);
        const durationValid = cloudinaryDuration <= MAX_DURATION;
        setIsValidDuration(durationValid);

        if (!durationValid) {
          setErrors(prev => ({
            ...prev,
            video: `Duration (${Math.floor(cloudinaryDuration / 60)}:${(cloudinaryDuration % 60).toString().padStart(2, '0')}) exceeds ${MAX_DURATION / 60} min limit`
          }));
        }
      }
    } catch (error) {
      if (__DEV__) logger.error('Video upload failed', error);
      setVideoUploadError(error.message || 'Failed to upload video');
      setErrors(prev => ({
        ...prev,
        video: error.message || 'Failed to upload video. Please try again.'
      }));
    } finally {
      setIsVideoUploading(false);
    }
  };

  // Pick video from library
  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrors({ video: 'Permission to access media library is required' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        quality: 0.8,
        videoMaxDuration: MAX_DURATION,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const validationErrors: string[] = [];

        // Check file size
        let fileSize = 0;
        let fileObject: File | null = null;
        if (Platform.OS === 'web' && (asset as unknown).file) {
          fileSize = (asset as unknown).file.size;
          fileObject = (asset as unknown).file;
        } else if ((asset as unknown).fileSize) {
          fileSize = (asset as unknown).fileSize;
        }

        setVideoFileSize(fileSize);
        const fileSizeValid = fileSize === 0 || fileSize <= MAX_FILE_SIZE;
        setIsValidFileSize(fileSizeValid);

        if (fileSize > 0 && !fileSizeValid) {
          validationErrors.push(`File size (${formatFileSize(fileSize)}) exceeds ${MAX_FILE_SIZE_MB}MB limit`);
          setErrors({ video: validationErrors.join('. ') });
          // Don't proceed with upload if file is too large
          setVideoUri(asset.uri);
          return;
        }

        // Check duration if available
        let durationValid = true;
        if (asset.duration) {
          const durationSeconds = Math.floor(asset.duration / 1000);
          setVideoDuration(durationSeconds);
          durationValid = durationSeconds <= MAX_DURATION;
          setIsValidDuration(durationValid);

          if (!durationValid) {
            validationErrors.push(`Duration (${Math.floor(durationSeconds / 60)}:${(durationSeconds % 60).toString().padStart(2, '0')}) exceeds ${MAX_DURATION / 60} min limit`);
            setErrors({ video: validationErrors.join('. ') });
            // Don't proceed with upload if duration exceeds limit
            setVideoUri(asset.uri);
            return;
          }
        }

        // Set video URI and clear errors
        setVideoUri(asset.uri);
        setVideoFile(fileObject);
        setErrors({});

        // Start uploading immediately in the background
        uploadVideoToCloudinary(asset.uri, fileObject);
      }
    } catch (error) {
      if (__DEV__) console.error('Video picker error:', error);
      setErrors({ video: 'Failed to select video' });
    }
  };

  // Handle video load to get duration
  const handleVideoLoad = (status) => {
    if (status.isLoaded && status.durationMillis) {
      const durationSeconds = Math.floor(status.durationMillis / 1000);
      setVideoDuration(durationSeconds);
      setIsValidDuration(durationSeconds <= MAX_DURATION);

      if (durationSeconds > MAX_DURATION) {
        setErrors({
          video: `Video must be ${MAX_DURATION / 60} minutes or less`,
        });
      }
    }
  };

  // Remove selected video
  const removeVideo = () => {
    setVideoUri(null);
    setVideoDuration(0);
    setVideoFileSize(0);
    setVideoFile(null);
    setIsValidDuration(true);
    setIsValidFileSize(true);
    // Reset background upload state
    setIsVideoUploading(false);
    setVideoUploadProgress(0);
    setVideoUploadResult(null);
    setVideoUploadError(null);
    setErrors({});
  };

  // Retry video upload
  const retryUpload = () => {
    if (videoUri) {
      uploadVideoToCloudinary(videoUri, videoFile);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    if (!videoUri) {
      newErrors.video = 'Please select a video';
    } else {
      const videoErrors: string[] = [];
      // On web, duration might be 0 until Cloudinary upload - that's ok
      if (!isValidDuration && videoDuration > 0) {
        videoErrors.push(`Duration exceeds ${MAX_DURATION / 60} min limit`);
      }
      if (!isValidFileSize) {
        videoErrors.push(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      }
      if (videoErrors.length > 0) {
        newErrors.video = videoErrors.join('. ');
      }
    }

    if (selectedProducts.length === 0) {
      newErrors.products = 'Please tag at least 1 product';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid for submission
  // Video must be uploaded successfully before allowing submit
  const isFormValid = () => {
    return (
      title.trim().length > 0 &&
      title.length <= 200 &&
      videoUri !== null &&
      videoUploadResult !== null && // Video must be uploaded to Cloudinary
      !isVideoUploading && // Not currently uploading
      !videoUploadError && // No upload errors
      isValidDuration &&
      isValidFileSize &&
      selectedProducts.length >= 1
    );
  };

  // Handle upload - creates video record using already-uploaded Cloudinary video
  const handleUpload = async () => {
    if (!validateForm() || !videoUploadResult) return;

    setIsSubmitting(true);

    try {
      // Video is already uploaded to Cloudinary, just create the record
      if (__DEV__) logger.log('Creating video record');

      // Get duration - prefer Cloudinary's duration if available
      const finalDuration = videoUploadResult.duration && videoUploadResult.duration > 0
        ? Math.ceil(videoUploadResult.duration)
        : videoDuration;

      // Validate duration before creating
      if (finalDuration <= 0) {
        throw new Error('Could not determine video duration. Please try a different video.');
      }

      if (finalDuration > MAX_DURATION) {
        throw new Error(`Video duration (${Math.floor(finalDuration / 60)}:${(finalDuration % 60).toString().padStart(2, '0')}) exceeds ${MAX_DURATION / 60} minute limit.`);
      }

      const createData: CreateVideoRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        storeId,
        videoUrl: videoUploadResult.url,
        thumbnailUrl: videoUploadResult.thumbnailUrl,
        products: selectedProducts.map((p) => p._id),
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        duration: finalDuration,
        publicId: videoUploadResult.publicId,
      };

      await promotionalVideosService.createVideo(createData);

      if (__DEV__) logger.log('Video created successfully');
      resetAndClose();
      onSuccess();
    } catch (error) {
      if (__DEV__) logger.error('Upload error', error);
      setErrors({
        upload: error.message || 'Failed to create video. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isSubmitting}
            >
              <Ionicons name="close" size={28} color={Colors.text.primary} />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Upload Video</ThemedText>
            <TouchableOpacity
              onPress={handleUpload}
              style={[
                styles.uploadButton,
                (!isFormValid() || isSubmitting) && styles.uploadButtonDisabled,
              ]}
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.text.inverse} />
              ) : (
                <ThemedText style={styles.uploadButtonText}>Upload</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Video Selection */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Video</ThemedText>

              {!videoUri ? (
                <TouchableOpacity
                  style={[styles.videoPicker, errors.video && styles.videoPickerError]}
                  onPress={pickVideo}
                  activeOpacity={0.7}
                >
                  <View style={styles.videoPickerIcon}>
                    <Ionicons name="videocam" size={40} color={Colors.primary[500]} />
                  </View>
                  <ThemedText style={styles.videoPickerTitle}>
                    Select Video
                  </ThemedText>
                  <ThemedText style={styles.videoPickerSubtitle}>
                    Max {MAX_DURATION / 60} minutes · Max {MAX_FILE_SIZE_MB}MB
                  </ThemedText>
                  <View style={styles.videoPickerHints}>
                    <View style={styles.hintItem}>
                      <Ionicons name="time-outline" size={14} color={Colors.text.tertiary} />
                      <ThemedText style={styles.hintText}>{MAX_DURATION / 60} min limit</ThemedText>
                    </View>
                    <View style={styles.hintItem}>
                      <Ionicons name="cloud-upload-outline" size={14} color={Colors.text.tertiary} />
                      <ThemedText style={styles.hintText}>{MAX_FILE_SIZE_MB}MB limit</ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.videoPreviewContainer}>
                  <Video
                    ref={videoRef}
                    source={{ uri: videoUri }}
                    style={styles.videoPreview}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    onLoad={handleVideoLoad}
                  />
                  <View style={styles.videoOverlay}>
                    {/* Left side badges */}
                    <View style={styles.leftBadges}>
                      {/* Upload status badge */}
                      {isVideoUploading && (
                        <View style={styles.uploadingBadge}>
                          <ActivityIndicator size="small" color={Colors.text.inverse} />
                          <ThemedText style={styles.durationText}>
                            Uploading... {videoUploadProgress}%
                          </ThemedText>
                        </View>
                      )}

                      {/* Upload complete badge */}
                      {videoUploadResult && !isVideoUploading && (
                        <View style={styles.uploadSuccessBadge}>
                          <Ionicons name="checkmark-circle" size={14} color={Colors.text.inverse} />
                          <ThemedText style={styles.durationText}>
                            Uploaded
                          </ThemedText>
                        </View>
                      )}

                      {/* Upload error badge */}
                      {videoUploadError && !isVideoUploading && (
                        <TouchableOpacity style={styles.uploadErrorBadge} onPress={retryUpload}>
                          <Ionicons name="refresh" size={14} color={Colors.text.inverse} />
                          <ThemedText style={styles.durationText}>
                            Failed - Tap to retry
                          </ThemedText>
                        </TouchableOpacity>
                      )}

                      {/* Duration badge */}
                      <View
                        style={[
                          styles.durationBadge,
                          videoDuration > 0 && !isValidDuration && styles.durationBadgeError,
                        ]}
                      >
                        <Ionicons
                          name={videoDuration === 0 ? 'hourglass-outline' : (isValidDuration ? 'time-outline' : 'warning')}
                          size={14}
                          color={Colors.text.inverse}
                        />
                        <ThemedText style={styles.durationText}>
                          {videoDuration === 0
                            ? 'Duration: Checking...'
                            : `${formatDuration(videoDuration)} / ${formatDuration(MAX_DURATION)}`}
                        </ThemedText>
                      </View>

                      {/* File size badge */}
                      {videoFileSize > 0 && (
                        <View
                          style={[
                            styles.durationBadge,
                            !isValidFileSize && styles.durationBadgeError,
                          ]}
                        >
                          <Ionicons
                            name={isValidFileSize ? 'cloud-outline' : 'warning'}
                            size={14}
                            color={Colors.text.inverse}
                          />
                          <ThemedText style={styles.durationText}>
                            {formatFileSize(videoFileSize)} / {MAX_FILE_SIZE_MB}MB
                          </ThemedText>
                        </View>
                      )}
                    </View>

                    {/* Remove button */}
                    <TouchableOpacity
                      style={styles.removeVideoButton}
                      onPress={removeVideo}
                      disabled={isVideoUploading}
                    >
                      <Ionicons
                        name="close-circle"
                        size={32}
                        color={isVideoUploading ? Colors.gray[400] : Colors.error[500]}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Upload progress bar overlay */}
                  {isVideoUploading && (
                    <View style={styles.uploadProgressOverlay}>
                      <View style={styles.uploadProgressBarContainer}>
                        <View
                          style={[
                            styles.uploadProgressBar,
                            { width: `${videoUploadProgress}%` }
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}

              {errors.video && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={16} color={Colors.error[500]} />
                  <ThemedText style={styles.errorText}>{errors.video}</ThemedText>
                </View>
              )}
            </View>

            {/* Title */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <ThemedText style={styles.label}>Title</ThemedText>
                <ThemedText style={styles.charCount}>
                  {title.length}/200
                </ThemedText>
              </View>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Enter a title for your video..."
                placeholderTextColor={Colors.text.tertiary}
                value={title}
                onChangeText={setTitle}
                maxLength={200}
              />
              {errors.title && (
                <ThemedText style={styles.fieldError}>{errors.title}</ThemedText>
              )}
            </View>

            {/* Description */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <ThemedText style={styles.label}>Description (Optional)</ThemedText>
                <ThemedText style={styles.charCount}>
                  {description.length}/2000
                </ThemedText>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a description..."
                placeholderTextColor={Colors.text.tertiary}
                value={description}
                onChangeText={setDescription}
                maxLength={2000}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Product Selector */}
            <View style={styles.section}>
              <ProductSelector
                storeId={storeId}
                selectedProducts={selectedProducts}
                onProductsChange={setSelectedProducts}
                minProducts={1}
                maxProducts={10}
                error={errors.products}
              />
            </View>

            {/* Tags */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>Tags (Optional)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="summer, fashion, new arrival (comma separated)"
                placeholderTextColor={Colors.text.tertiary}
                value={tags}
                onChangeText={setTags}
              />
              <ThemedText style={styles.helperText}>
                Separate tags with commas
              </ThemedText>
            </View>

            {/* Upload Error */}
            {errors.upload && (
              <View style={styles.uploadErrorContainer}>
                <Ionicons name="alert-circle" size={20} color={Colors.error[500]} />
                <ThemedText style={styles.uploadErrorText}>
                  {errors.upload}
                </ThemedText>
              </View>
            )}

            {/* Submitting Progress */}
            {isSubmitting && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <ActivityIndicator size="small" color={Colors.primary[500]} />
                  <ThemedText style={styles.progressText}>
                    Creating video...
                  </ThemedText>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirm Close Modal */}
      <ConfirmModal
        visible={showConfirmClose}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Discard"
        cancelText="Keep Editing"
        type="warning"
        onConfirm={resetAndClose}
        onCancel={() => setShowConfirmClose(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    ...Platform.select({
      ios: {
        paddingTop: Spacing.xl,
      },
    }),
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  uploadButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  uploadButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  videoPicker: {
    aspectRatio: 16 / 9,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border.default,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPickerError: {
    borderColor: Colors.error[500],
  },
  videoPickerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  videoPickerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  videoPickerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginBottom: Spacing.md,
  },
  videoPickerHints: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  hintText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  videoPreviewContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: Colors.gray[900],
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.sm,
  },
  leftBadges: {
    flexDirection: 'column',
    gap: Spacing.xs,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  durationBadgeError: {
    backgroundColor: Colors.error[600],
  },
  uploadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  uploadSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success[600],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  uploadErrorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error[600],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  uploadProgressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
  uploadProgressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  uploadProgressBar: {
    height: '100%',
    backgroundColor: Colors.primary[400],
    borderRadius: BorderRadius.full,
  },
  durationText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  removeVideoButton: {
    padding: Spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error[500],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  charCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  input: {
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    ...(Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }) as unknown),
  },
  inputError: {
    borderColor: Colors.error[500],
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  fieldError: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error[500],
    marginTop: Spacing.xs,
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  uploadErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  uploadErrorText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.error[700],
  },
  progressContainer: {
    backgroundColor: Colors.primary[50],
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  progressText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[700],
    fontWeight: Typography.fontWeight.medium,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full,
  },
});
