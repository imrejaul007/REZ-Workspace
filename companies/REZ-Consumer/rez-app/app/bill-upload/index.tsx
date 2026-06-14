// @ts-nocheck
/**
 * Bill Upload Page - index.tsx
 *
 * Lean composition layer. All state/logic lives in useBillUploadPage,
 * all sub-UI lives in components/bill-upload/*.
 *
 * @version 3.0.0 - refactored from monolithic bill-upload.tsx
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Sub-components
import BillCamera from '@/components/bill-upload/BillCamera';
import BillPreview from '@/components/bill-upload/BillPreview';
import BillUploadForm from '@/components/bill-upload/BillUploadForm';
import { MerchantSelectorModal, ProgressModal, InfoModal } from '@/components/bill-upload/BillUploadModals';

// State hook
import { useBillUploadPage } from '@/components/bill-upload/hooks/useBillUploadPage';

// Shared components
import { HeaderBackButton } from '@/components/navigation/SafeBackButton';
import Toast from '@/components/common/Toast';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import BonusCampaignBanner from '@/components/earn/BonusCampaignBanner';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

function BillUploadPage() {
  const router = useRouter();
  const { bonusCampaignSlug } = useLocalSearchParams<unknown>();

  const {
    // State
    formData,
    errors,
    touched,
    merchants,
    filteredMerchants,
    cashbackCalculation,
    hasPermission,
    showCamera,
    showMerchantSelector,
    showCashbackPreview,
    showInfoModal,
    showProgressModal,
    merchantSearchQuery,
    isLoadingMerchants,
    isCheckingQuality,
    qualityResult,
    toast,
    isOnline,
    hasPendingUploads,
    pendingCount,
    billUploadHook,
    fadeAnim,
    // Refs
    cameraRef,
    amountInputRef,
    billNumberInputRef,
    notesInputRef,
    scrollViewRef,
    // Handlers
    handleFieldChange,
    handleFieldBlur,
    handleSubmit,
    openCamera,
    takePicture,
    pickImageFromGallery,
    selectMerchant,
    loadMerchants,
    setShowCamera,
    setShowMerchantSelector,
    setShowCashbackPreview,
    setShowInfoModal,
    setShowProgressModal,
    setMerchantSearchQuery,
    setCameraType,
    cameraType,
    showToast,
    dismissToast,
    isFormValid,
    currencySymbol,
  } = useBillUploadPage();

  // Render full-screen camera view
  if (showCamera) {
    // Web fallback: file input instead of native camera
    if (Platform.OS === 'web') {
      return (
        <View style={styles.cameraContainer}>
          <View style={styles.webUploadContainer}>
            <Pressable style={styles.cameraCloseButton} onPress={() => setShowCamera(false)}>
              <Ionicons name="close" size={32} color={colors.text.inverse} />
            </Pressable>
            <View style={styles.webUploadIcon}>
              <Ionicons name="cloud-upload-outline" size={40} color="#fff" />
            </View>
            <Text style={styles.webUploadTitle}>Upload Bill Photo</Text>
            <Text style={styles.webUploadSubtitle}>Select a clear photo of your bill</Text>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target?.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const uri = ev.target?.result as string;
                    setShowCamera(false);
                    handleFieldChange('billImage', uri);
                    showToast('Bill photo selected', 'success');
                  };
                  reader.readAsDataURL(file);
                }
              }}
              style={
                {
                  padding: 12,
                  backgroundColor: '#1a3a52',
                  color: '#fff',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: 'none',
                  fontSize: 16,
                } as unknown
              }
            />
          </View>
        </View>
      );
    }

    return (
      <BillCamera
        cameraRef={cameraRef}
        cameraType={cameraType}
        onCapture={takePicture}
        onClose={() => setShowCamera(false)}
        onFlipCamera={() => setCameraType(cameraType === 'back' ? 'front' : 'back')}
      />
    );
  }

  return (
    <ErrorBoundary>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <HeaderBackButton
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/' as unknown);
              }
            }}
            iconColor={colors.darkGray}
          />
          <Text style={styles.headerTitle}>Upload Bill</Text>
          <Pressable onPress={() => setShowInfoModal(true)}>
            <Ionicons name="information-circle-outline" size={24} color={colors.darkGray} />
          </Pressable>
        </View>

        <Animated.ScrollView
          ref={scrollViewRef as unknown}
          style={[styles.scrollView, { opacity: fadeAnim }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Offline Banner */}
          {!isOnline && (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline" size={20} color="#FF9800" />
              <Text style={styles.offlineBannerText}>
                You&apos;re offline. Bills will be queued and uploaded automatically when connection is restored.
              </Text>
            </View>
          )}

          {/* Pending Queue Banner */}
          {hasPendingUploads && isOnline && (
            <Pressable style={styles.queueBanner} onPress={() => router.push('/bill-history')}>
              <View style={styles.queueBannerLeft}>
                <Ionicons name="cloud-upload" size={20} color="#2196F3" />
                <Text style={styles.queueBannerText}>
                  {pendingCount} bill{pendingCount > 1 ? 's' : ''} waiting to upload
                </Text>
              </View>
              <Text style={styles.queueBannerAction}>Sync Now</Text>
            </Pressable>
          )}

          {/* Bonus Campaign Banner */}
          <BonusCampaignBanner campaignSlug={bonusCampaignSlug as string} />

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="gift" size={24} color={colors.brand.green} />
            <Text style={styles.infoBannerText}>Upload offline bills to earn up to 20% cashback!</Text>
          </View>

          {/* Bill Image Preview / Upload Options */}
          <BillPreview
            billImage={formData.billImage}
            qualityResult={qualityResult}
            isCheckingQuality={isCheckingQuality}
            touched={touched}
            errors={errors}
            onOpenCamera={openCamera}
            onPickFromGallery={pickImageFromGallery}
            onRemoveImage={() => handleFieldChange('billImage', null)}
          />

          {/* Form Fields */}
          <BillUploadForm
            formData={formData}
            errors={errors}
            touched={touched}
            cashbackCalculation={cashbackCalculation}
            showCashbackPreview={showCashbackPreview}
            isUploading={billUploadHook.isUploading}
            isFormValid={isFormValid()}
            currencySymbol={currencySymbol}
            amountInputRef={amountInputRef}
            billNumberInputRef={billNumberInputRef}
            notesInputRef={notesInputRef}
            onFieldChange={handleFieldChange}
            onFieldBlur={handleFieldBlur}
            onOpenMerchantSelector={() => {
              loadMerchants();
              setShowMerchantSelector(true);
            }}
            onToggleCashbackPreview={() => setShowCashbackPreview(!showCashbackPreview)}
            onSubmit={handleSubmit}
          />

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>

        {/* Merchant Selector Modal */}
        <MerchantSelectorModal
          visible={showMerchantSelector}
          merchants={filteredMerchants}
          selectedMerchantId={formData.merchantId}
          searchQuery={merchantSearchQuery}
          isLoading={isLoadingMerchants}
          onClose={() => setShowMerchantSelector(false)}
          onSelect={selectMerchant}
          onSearchChange={setMerchantSearchQuery}
        />

        {/* Progress Modal */}
        <ProgressModal
          visible={showProgressModal}
          percentComplete={billUploadHook.percentComplete}
          uploadSpeed={billUploadHook.uploadSpeed}
          onCancel={() => {
            billUploadHook.cancelUpload();
            setShowProgressModal(false);
          }}
        />

        {/* Info Modal */}
        <InfoModal visible={showInfoModal} currencySymbol={currencySymbol} onClose={() => setShowInfoModal(false)} />

        {/* Toast */}
        {toast.visible && (
          <Toast message={toast.message} type={toast.type} actions={toast.actions} onDismiss={dismissToast} />
        )}
      </KeyboardAvoidingView>
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' },
    }),
  },
  headerTitle: {
    ...Typography.h4,
    color: colors.text.primary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 192, 106, 0.1)',
    padding: Spacing.base,
    margin: Spacing.base,
    borderRadius: 8,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 192, 106, 0.2)',
  },
  infoBannerText: {
    flex: 1,
    ...Typography.body,
    color: colors.brand.green,
    fontWeight: '500',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: Spacing.base,
    margin: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: 8,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  offlineBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
    fontWeight: '500',
  },
  queueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  queueBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  queueBannerText: {
    fontSize: 13,
    color: '#1565C0',
    fontWeight: '500',
    flex: 1,
  },
  queueBannerAction: {
    ...Typography.body,
    color: '#1976D2',
    fontWeight: '600',
    paddingLeft: Spacing.sm,
  },
  // Web camera fallback styles
  cameraContainer: {
    flex: 1,
  },
  webUploadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 24,
  },
  cameraCloseButton: {
    position: 'absolute',
    top: 50,
    right: Spacing.lg,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: Spacing.sm,
  },
  webUploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  webUploadTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  webUploadSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default withErrorBoundary(BillUploadPage, 'Bill Upload');
