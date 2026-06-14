// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Enhanced Bill Upload Page
// Users can upload bills with OCR verification and cashback calculation

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Platform, Modal } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { platformAlertSimple, platformAlertConfirm } from '@/utils/platformAlert';
import * as ExpoCamera from 'expo-camera';
import { getImagePicker } from '@/utils/lazyImports';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { billUploadService } from '@/services/billUploadService';
import { useBillVerification } from '@/hooks/useBillVerification';
import BillVerificationStatus from '@/components/bills/BillVerificationStatus';
import BillPreviewModal from '@/components/bills/BillPreviewModal';
import CashbackCalculator from '@/components/bills/CashbackCalculator';
import BillRequirements from '@/components/bills/BillRequirements';
import ManualCorrectionForm from '@/components/bills/ManualCorrectionForm';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

const CameraType = {
  back: 'back' as const,
  front: 'front' as const,
};

type CameraTypeValue = (typeof CameraType)[keyof typeof CameraType];

function EnhancedBillUploadPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const navigation = useNavigation();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const {
    workflow,
    isProcessing,
    error,
    startVerification,
    applyManualCorrections,
    selectMerchant,
    submitBill,
    reset,
    canProceed,
    estimatedCashback,
    hasErrors,
    requiresUserInput,
  } = useBillVerification();

  // Hide the default navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Camera states
  const [permission, requestPermission] = ExpoCamera.useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<CameraTypeValue>(CameraType.back);
  const cameraRef = useRef<unknown>(null);

  // UI states
  const [billImage, setBillImage] = useState<string | null>(null);
  const [showRequirements, setShowRequirements] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Double-tap guard: ref is checked synchronously on the call stack, before any state updates
  const isSubmittingRef = useRef(false);

  // Safe navigation function
  const handleGoBack = () => {
    try {
      if (navigation && navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      } else if (router && router.push) {
        router.push('/');
      } else {
        router.replace('/');
      }
    } catch (error) {
      if (router) {
        router.replace('/');
      }
    }
  };

  // Open camera
  const openCamera = async () => {
    if (Platform.OS === 'web') {
      // Show web fallback screen instead of attempting to open native camera
      setShowCamera(true);
      return;
    }

    if (!permission) {
      // Permission not loaded yet
      return;
    }

    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        platformAlertSimple('Permission Denied', 'Camera permission is required to upload bills.');
        return;
      }
    }

    if (!isMounted()) return;
    setShowCamera(true);
  };

  // Take photo and start verification
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (!isMounted()) return;
        setBillImage(photo.uri);
        if (!isMounted()) return;
        setShowCamera(false);

        // Start verification process
        await startVerification(photo.uri);
      } catch (error) {
        platformAlertSimple('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  // Pick image from gallery and start verification
  const pickImageFromGallery = async () => {
    try {
      const ImagePicker = await getImagePicker();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as unknown,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        if (!isMounted()) return;
        setBillImage(result.assets[0].uri);

        // Start verification process
        await startVerification(result.assets[0].uri);
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Handle preview confirmation
  const handlePreviewConfirm = async (corrections?) => {
    if (corrections) {
      await applyManualCorrections(corrections);
    }
    if (!isMounted()) return;
    setShowPreview(false);
  };

  // Submit verified bill
  const handleSubmit = async () => {
    // Double-tap guard: synchronous block prevents any second invocation
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (!workflow || !canProceed) {
      isSubmittingRef.current = false;
      platformAlertSimple('Cannot Submit', 'Please complete verification first.');
      return;
    }

    setIsUploading(true);

    try {
      const success = await submitBill();

      if (success) {
        // CA-PAY-002 FIX: Use precise decimal rounding instead of float toFixed().
        // Avoid accumulated precision errors by rounding via integer paise (multiply by 100, round, divide).
        const cashbackPaise = Math.round(estimatedCashback * 100);
        const cashbackFormatted = (cashbackPaise / 100).toFixed(2);

        platformAlertConfirm(
          'Success!',
          `Your bill has been uploaded successfully. You'll earn ${currencySymbol}${cashbackFormatted} cashback once approved!`,
          () => router?.push && router.push('/bill-history'),
          'View History',
        );
      } else {
        platformAlertSimple('Upload Failed', error || 'Failed to upload bill. Please try again.');
      }
    } catch (err) {
      platformAlertSimple('Error', 'An error occurred while uploading the bill. Please try again.');
    } finally {
      if (!isMounted()) return;
      setIsUploading(false);
      isSubmittingRef.current = false;
    }
  };

  // Reset form
  const resetForm = () => {
    setBillImage(null);
    reset();
  };

  // Render camera view
  if (showCamera) {
    if (Platform.OS === 'web') {
      // Camera is not available on web — show a friendly message and close trigger
      return (
        <View
          style={[
            styles.cameraContainer,
            { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 32 },
          ]}
        >
          <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16, textAlign: 'center' }}>
            Camera Not Available on Web
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
            Please use the Gallery option to upload a bill image from your device.
          </Text>
          <Pressable
            style={{
              marginTop: 24,
              backgroundColor: '#FF6B35',
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 12,
            }}
            onPress={() => setShowCamera(false)}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Go Back</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <ExpoCamera.CameraView ref={cameraRef} style={styles.camera} facing={cameraType as unknown}>
          <View style={styles.cameraOverlay}>
            <Pressable style={styles.cameraCloseButton} onPress={() => setShowCamera(false)}>
              <Ionicons name="close" size={32} color={colors.text.inverse} />
            </Pressable>

            <View style={styles.cameraGuidelines}>
              <Text style={styles.cameraGuidelinesText}>Position the bill within the frame</Text>
              <Text style={styles.cameraGuidelinesSubtext}>Ensure all text is visible and clear</Text>
              <View style={styles.cameraFrame} />
            </View>

            <View style={styles.cameraControls}>
              <Pressable
                style={styles.cameraFlipButton}
                onPress={() => {
                  setCameraType(cameraType === CameraType.back ? CameraType.front : CameraType.back);
                }}
              >
                <Ionicons name="camera-reverse" size={32} color={colors.text.inverse} />
              </Pressable>

              <Pressable style={styles.cameraCaptureButton} onPress={takePicture}>
                <View style={styles.cameraCaptureButtonInner} />
              </Pressable>

              <View style={{ width: 60 }} />
            </View>
          </View>
        </ExpoCamera.CameraView>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleGoBack}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>Upload Bill</Text>
            <Pressable onPress={() => setShowRequirements(true)}>
              <Ionicons name="information-circle-outline" size={24} color={colors.text.primary} />
            </Pressable>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="gift" size={24} color={colors.brand.emerald} />
            <View style={styles.infoBannerContent}>
              <Text style={styles.infoBannerTitle}>Earn Cashback on Bills!</Text>
              <Text style={styles.infoBannerText}>Upload your bills and earn up to 20% cashback instantly</Text>
            </View>
          </View>

          {/* Bill Image Section */}
          {!billImage ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upload Your Bill</Text>
              <View style={styles.uploadOptionsContainer}>
                <Pressable style={styles.uploadOption} onPress={openCamera}>
                  <Ionicons name="camera" size={40} color="#FF6B35" />
                  <Text style={styles.uploadOptionText}>Take Photo</Text>
                </Pressable>

                <Pressable style={styles.uploadOption} onPress={pickImageFromGallery}>
                  <Ionicons name="images" size={40} color="#FF6B35" />
                  <Text style={styles.uploadOptionText}>Gallery</Text>
                </Pressable>
              </View>
              <Text style={styles.helperText}>Ensure the bill is clear and all details are visible</Text>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.imagePreviewContainer}>
                <CachedImage source={billImage} style={styles.imagePreview} />
                <Pressable style={styles.removeImageButton} onPress={resetForm}>
                  <Ionicons name="close-circle" size={32} color={Colors.error} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Verification Status */}
          {workflow && workflow.currentState && (
            <View style={styles.section}>
              <BillVerificationStatus state={workflow.currentState} />
            </View>
          )}

          {/* Errors */}
          {hasErrors && workflow && (
            <View style={styles.errorSection}>
              <View style={styles.errorHeader}>
                <Ionicons name="alert-circle" size={20} color="#F44336" />
                <Text style={styles.errorTitle}>Verification Issues</Text>
              </View>
              {workflow.errors.map((err, index) => (
                <Text key={index} style={styles.errorText}>
                  • {err}
                </Text>
              ))}
              <Pressable style={styles.correctionButton} onPress={() => setShowCorrectionForm(true)}>
                <Text style={styles.correctionButtonText}>Correct Details</Text>
              </Pressable>
            </View>
          )}

          {/* Cashback Preview */}
          {workflow?.cashbackCalculation && (
            <View style={styles.section}>
              <CashbackCalculator calculation={workflow.cashbackCalculation} />
            </View>
          )}

          {/* Action Buttons */}
          {workflow && requiresUserInput && (
            <View style={styles.actionButtons}>
              <Pressable style={styles.previewButton} onPress={() => setShowPreview(true)}>
                <Ionicons name="eye" size={20} color="#2196F3" />
                <Text style={styles.previewButtonText}>Review Details</Text>
              </Pressable>

              {!canProceed && (
                <Pressable style={styles.editButton} onPress={() => setShowCorrectionForm(true)}>
                  <Ionicons name="create" size={20} color="#FF9800" />
                  <Text style={styles.editButtonText}>Edit Details</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Submit Button */}
          {billImage && (
            <Pressable
              style={[
                styles.submitButton,
                (!canProceed || isUploading || isProcessing || isSubmittingRef.current) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canProceed || isUploading || isProcessing || isSubmittingRef.current}
            >
              {isUploading ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>{canProceed ? 'Submit Bill' : 'Verifying...'}</Text>
                  {estimatedCashback > 0 && (
                    <Text style={styles.submitButtonSubtext}>
                      Earn {currencySymbol}
                      {estimatedCashback.toFixed(2)} cashback
                    </Text>
                  )}
                </>
              )}
            </Pressable>
          )}
        </ScrollView>

        {/* Requirements Modal */}
        <Modal visible={showRequirements} animationType="slide" onRequestClose={() => setShowRequirements(false)}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowRequirements(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </Pressable>
            <Text style={styles.modalTitle}>Requirements</Text>
            <View style={{ width: 24 }} />
          </View>
          <BillRequirements />
        </Modal>

        {/* Preview Modal */}
        {workflow && workflow.ocrData && (
          <BillPreviewModal
            visible={showPreview}
            onClose={() => setShowPreview(false)}
            imageUri={workflow.imageUri}
            ocrData={workflow.ocrData}
            selectedMerchant={workflow.selectedMerchant}
            onConfirm={handlePreviewConfirm}
            onEdit={() => {
              setShowPreview(false);
              setShowCorrectionForm(true);
            }}
          />
        )}

        {/* Correction Form Modal */}
        {workflow && workflow.ocrData && (
          <ManualCorrectionForm
            visible={showCorrectionForm}
            onClose={() => setShowCorrectionForm(false)}
            ocrData={workflow.ocrData}
            onSubmit={async (corrections) => {
              await applyManualCorrections(corrections);
              if (!isMounted()) return;
              setShowCorrectionForm(false);
            }}
          />
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    ...Typography.h4,
    fontWeight: '600',
    color: colors.text.primary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greenMist,
    padding: Spacing.base,
    margin: Spacing.base,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.brand.emerald,
    marginBottom: Spacing.xs,
  },
  infoBannerText: {
    ...Typography.bodySmall,
    color: colors.brand.emerald,
    lineHeight: 18,
  },
  section: {
    padding: Spacing.base,
  },
  sectionTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: Spacing.md,
  },
  uploadOptionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  uploadOption: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  uploadOptionText: {
    marginTop: Spacing.sm,
    ...Typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
  },
  helperText: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  errorSection: {
    backgroundColor: '#FFEBEE',
    margin: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: '#F44336',
  },
  errorText: {
    ...Typography.bodySmall,
    color: '#F44336',
    marginBottom: 6,
    lineHeight: 18,
  },
  correctionButton: {
    backgroundColor: '#F44336',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  correctionButtonText: {
    color: colors.text.inverse,
    ...Typography.body,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 14,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  previewButtonText: {
    color: '#2196F3',
    ...Typography.body,
    fontWeight: '600',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4E5',
    padding: 14,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  editButtonText: {
    color: '#FF9800',
    ...Typography.body,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    margin: Spacing.base,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  submitButtonSubtext: {
    color: colors.text.inverse,
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  cameraGuidelines: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraGuidelinesText: {
    color: colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  cameraGuidelinesSubtext: {
    color: colors.text.inverse,
    ...Typography.bodySmall,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  cameraFrame: {
    width: 300,
    height: 200,
    borderWidth: 2,
    borderColor: colors.background.primary,
    borderRadius: BorderRadius.md,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 50,
  },
  cameraFlipButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCaptureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCaptureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B35',
  },
  // Modal styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    ...Typography.h4,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

export default withErrorBoundary(EnhancedBillUploadPage, 'BillUploadEnhanced');
