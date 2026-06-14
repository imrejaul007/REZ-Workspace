// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Profile Edit Page
// Edit user profile information with photo upload

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuthActions } from '@/stores/selectors';
import authService from '@/services/authApi';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { HeaderBackButton } from '@/components/navigation/SafeBackButton';
import { PROFILE_COLORS } from '@/types/profile.types';
import { getImagePicker } from '@/utils/lazyImports';
import { uploadProfileImage } from '@/services/imageUploadService';
import {
  platformAlertSimple,
  platformAlertConfirm,
  platformAlertDestructive,
  platformAlertError,
} from '@/utils/platformAlert';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  website: string;
  dateOfBirth: string;
  gender: string;
}

function ProfileEditPage() {
  const router = useRouter();
  const { goBack } = useSafeNavigation();
  const { user, updateUser } = useProfile();
  const authActions = useAuthActions();

  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    dateOfBirth: '',
    gender: '',
  });
  const [initialData, setInitialData] = useState<ProfileFormData | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const isMounted = useIsMounted();

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  // Load profile directly from API on mount — bypass all caching layers
  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const response = await authService.getProfile();
        if (cancelled || !isMounted()) return;
        if (response.success && response.data) {
          const d = response.data as unknown;
          const profileData: ProfileFormData = {
            name:
              d.profile?.firstName && d.profile?.lastName
                ? `${d.profile.firstName} ${d.profile.lastName}`
                : d.profile?.firstName || d.name || '',
            email: d.email || '',
            phone: d.phoneNumber || d.phone || '',
            bio: d.profile?.bio || d.bio || '',
            location: d.profile?.location?.address || d.location || '',
            website: d.profile?.website || d.website || '',
            dateOfBirth: d.profile?.dateOfBirth
              ? new Date(d.profile.dateOfBirth).toISOString().split('T')[0]
              : d.dateOfBirth || '',
            gender: d.profile?.gender || d.gender || '',
          };
          setFormData(profileData);
          setInitialData(profileData);
        } else if (user) {
          // Fallback to context user
          const profileData: ProfileFormData = {
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            bio: user.bio || '',
            location: user.location || '',
            website: user.website || '',
            dateOfBirth: user.dateOfBirth || '',
            gender: user.gender || '',
          };
          setFormData(profileData);
          setInitialData(profileData);
        }
      } catch {
        // Fallback to context user on error
        if (user && !cancelled) {
          const profileData: ProfileFormData = {
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            bio: user.bio || '',
            location: user.location || '',
            website: user.website || '',
            dateOfBirth: user.dateOfBirth || '',
            gender: user.gender || '',
          };
          setFormData(profileData);
          setInitialData(profileData);
        }
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialData) return;
    const hasChangesDetected =
      formData.name !== initialData.name ||
      formData.email !== initialData.email ||
      formData.phone !== initialData.phone ||
      formData.bio !== initialData.bio ||
      formData.location !== initialData.location ||
      formData.website !== initialData.website ||
      formData.dateOfBirth !== initialData.dateOfBirth ||
      formData.gender !== initialData.gender;
    setHasChanges(hasChangesDetected);
  }, [formData, initialData]);

  const handleBackPress = () => {
    if (hasChanges) {
      platformAlertDestructive(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        () => {
          goBack('/profile' as unknown);
        },
        'Leave',
      );
    } else {
      goBack('/profile' as unknown);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleGenderSelect = (gender: string) => {
    setFormData((prev) => ({ ...prev, gender }));
    setShowGenderModal(false);
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch {
      return dateString;
    }
  };

  const handleImageUpload = async () => {
    try {
      const ImagePicker = await getImagePicker();

      // Request permission (not needed on web)
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
          platformAlertSimple(
            'Permission Required',
            'Please allow access to your photo library to upload a profile picture.',
          );
          return;
        }
      }

      // Pick image with EXTREME compression for fastest Cloudinary upload
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2, // Extreme compression (20% quality) for slow Cloudinary connection
        base64: false,
        allowsMultipleSelection: false,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        if (!isMounted()) return;
        setUploadingImage(true);

        // Try upload with retry logic (Cloudinary is slow from your location)
        let uploadResult;
        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
          uploadResult = await uploadProfileImage(result.assets[0].uri);

          if (uploadResult.success) {
            break; // Success, exit retry loop
          }

          retryCount++;
          if (retryCount <= maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        if (uploadResult?.success) {
          // Refresh user data to show new avatar.
          // Clear lastProfileSync so checkAuthStatus performs a fresh background sync
          // instead of skipping it (which would leave the old avatar in memory for 5 min).
          const AS = (await import('@react-native-async-storage/async-storage')).default;
          await AS.removeItem('lastProfileSync');
          await authActions.checkAuthStatus();
          platformAlertSimple('Success', 'Profile picture updated successfully!');
        } else {
          platformAlertSimple(
            'Upload Failed',
            `After ${retryCount} attempts: ${uploadResult?.error || 'Failed to upload image'}\n\nCloudinary connection is slow. Try different network or smaller image.`,
          );
        }
      }
    } catch (error) {
      platformAlertSimple(
        'Error',
        error instanceof Error ? error.message : 'An error occurred while uploading the image',
      );
    } finally {
      if (!isMounted()) return;
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      platformAlertSimple('Validation Error', 'Name is required');
      return;
    }

    // Email validation - only validate if email is provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        platformAlertSimple('Validation Error', 'Please enter a valid email address');
        return;
      }
    }

    setIsSaving(true);

    try {
      // Split name into firstName/lastName for the backend
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Call API directly to avoid context/cache issues
      const profileUpdateData = {
        email: formData.email || undefined,
        profile: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          bio: formData.bio || undefined,
          website: formData.website || undefined,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
          gender:
            formData.gender && ['male', 'female', 'other'].includes(formData.gender.toLowerCase())
              ? formData.gender.toLowerCase()
              : undefined,
          location: formData.location ? { address: formData.location } : undefined,
        },
      };

      const response = await authService.updateProfile(profileUpdateData as unknown);

      if (!response.success) {
        throw new Error(response.error || response.message || 'Failed to update profile');
      }

      // BUG FIX: Persist the returned user directly to SecureStore (via authStorage.saveUser)
      // BEFORE calling checkAuthStatus. Previously the code cleared lastProfileSync and called
      // checkAuthStatus — but checkAuthStatus re-reads from SecureStore which still contained
      // the OLD user, and then dispatched UPDATE_USER with stale data overwriting the edit.
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      if (response.data) {
        const { saveUser } = await import('@/utils/authStorage');
        await saveUser(response.data);
        // Stamp lastProfileSync so background fetch within checkAuthStatus skips API
        // (we already have fresh data in SecureStore)
        await AsyncStorage.setItem('lastProfileSync', Date.now().toString());
      } else {
        // No data returned — clear lastProfileSync so checkAuthStatus performs a fresh
        // background API fetch instead of using the old cached user
        await AsyncStorage.removeItem('lastProfileSync');
      }
      await authActions.checkAuthStatus();

      // Update initial data so hasChanges resets
      setInitialData({ ...formData });

      platformAlertSimple('Success', 'Profile updated successfully!');

      // Navigate back after a short delay
      setTimeout(() => {
        if (isMounted()) goBack('/profile' as unknown);
      }, 500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      platformAlertError('Save Failed', message);
    } finally {
      if (isMounted()) setIsSaving(false);
    }
  };

  // --- Field icon mapping ---
  const fieldIcons: Record<keyof ProfileFormData, keyof typeof Ionicons.glyphMap> = {
    name: 'person-outline',
    email: 'mail-outline',
    phone: 'call-outline',
    bio: 'chatbubble-ellipses-outline',
    location: 'location-outline',
    website: 'globe-outline',
    dateOfBirth: 'calendar-outline',
    gender: 'people-outline',
  };

  const renderFormField = (
    label: string,
    field: keyof ProfileFormData,
    placeholder: string,
    multiline: boolean = false,
    keyboardType: 'default' | 'email-address' | 'phone-pad' | 'url' = 'default',
    readonly: boolean = false,
  ) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldIconRow}>
        <View style={styles.fieldIconCircle}>
          <Ionicons name={fieldIcons[field]} size={16} color={PROFILE_COLORS.primaryDark} />
        </View>
        <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
        {readonly && (
          <View style={styles.readonlyBadge}>
            <Ionicons name="lock-closed-outline" size={11} color={colors.neutral[400]} />
            <ThemedText style={styles.readonlyBadgeText}>Read-only</ThemedText>
          </View>
        )}
      </View>
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput, readonly ? styles.readonlyInput : null]}
        value={formData[field] as string}
        onChangeText={readonly ? undefined : (value) => handleInputChange(field, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[400]}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        autoCorrect={keyboardType === 'email-address' ? false : true}
        selectionColor={PROFILE_COLORS.gold}
        editable={!readonly}
        selectTextOnFocus={!readonly}
        accessibilityLabel={`${label} input field`}
        accessibilityHint={readonly ? 'This field cannot be edited' : `Enter your ${label.toLowerCase()}`}
        accessibilityValue={{ text: formData[field] as string }}
      />
    </View>
  );

  const renderGenderOption = useCallback(
    ({ item }: { item: { value: string; label: string } }) => (
      <Pressable
        style={[styles.genderOption, formData.gender === item.value ? styles.selectedGenderOption : null]}
        onPress={() => handleGenderSelect(item.value)}
        accessibilityLabel={`Select ${item.label} as your gender`}
        accessibilityRole="button"
        accessibilityHint={`Double tap to set your gender to ${item.label}`}
        accessibilityState={{ selected: formData.gender === item.value }}
      >
        <ThemedText
          style={[styles.genderOptionText, formData.gender === item.value ? styles.selectedGenderOptionText : null]}
        >
          {item.label}
        </ThemedText>
        {formData.gender === item.value && <Ionicons name="checkmark" size={20} color={PROFILE_COLORS.gold} />}
      </Pressable>
    ),
    [formData.gender, handleGenderSelect],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PROFILE_COLORS.primaryDark} translucent={false} />

      {/* Gradient Header with Avatar */}
      <LinearGradient
        colors={[PROFILE_COLORS.primaryDark, '#2d5a7b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Top bar: back + title + save */}
        <View style={styles.headerTopBar}>
          <Pressable
            style={styles.backButton}
            onPress={handleBackPress}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            accessibilityHint="Double tap to return to profile page"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text.inverse} />
          </Pressable>

          <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>

          <Pressable
            style={[styles.saveButton, (!hasChanges || isSaving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving || !hasChanges}
            accessibilityLabel={
              isSaving ? 'Saving profile changes' : hasChanges ? 'Save profile changes' : 'Save profile'
            }
            accessibilityRole="button"
            accessibilityHint="Double tap to save your profile changes"
            accessibilityState={{ disabled: isSaving || !hasChanges, busy: isSaving }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <ThemedText style={[styles.saveButtonText, (!hasChanges || isSaving) && styles.saveButtonTextDisabled]}>
                Save
              </ThemedText>
            )}
          </Pressable>
        </View>

        {/* Avatar row */}
        <View style={styles.headerAvatarRow}>
          <Pressable
            style={styles.avatarWrapper}
            onPress={handleImageUpload}
            disabled={uploadingImage}
            accessibilityLabel={uploadingImage ? 'Uploading profile photo' : 'Change profile photo'}
            accessibilityRole="button"
            accessibilityHint="Double tap to select a new profile picture from your gallery"
            accessibilityState={{ disabled: uploadingImage, busy: uploadingImage }}
          >
            {/* Gradient ring */}
            <LinearGradient colors={[PROFILE_COLORS.gold, '#ffd7b5']} style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                {user?.avatar ? (
                  <CachedImage
                    source={{ uri: user.avatar }}
                    style={styles.avatarImage}
                    cachePolicy="none"
                    key={user.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <ThemedText style={styles.avatarInitials}>
                      {user?.name?.substring(0, 2).toUpperCase() || 'U'}
                    </ThemedText>
                  </View>
                )}
                {uploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color={colors.text.inverse} />
                  </View>
                )}
              </View>
            </LinearGradient>
            {/* Camera badge */}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color={colors.text.inverse} />
            </View>
          </Pressable>

          <View style={styles.headerUserInfo}>
            <ThemedText style={styles.headerUserName}>{formData.name || user?.name || ''}</ThemedText>
            <ThemedText style={styles.headerUserSub}>
              {uploadingImage ? 'Uploading photo...' : 'Tap photo to change'}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBadge}>
                <Ionicons name="person" size={16} color={PROFILE_COLORS.primaryDark} />
              </View>
              <ThemedText style={styles.cardTitle}>Personal Info</ThemedText>
            </View>

            {renderFormField('Full Name', 'name', 'Enter your full name')}
            {renderFormField('Email Address', 'email', 'Enter your email', false, 'email-address', false)}
            {renderFormField('Phone Number', 'phone', 'Enter your phone number', false, 'phone-pad', true)}
            {renderFormField('Date of Birth', 'dateOfBirth', 'YYYY-MM-DD', false, 'default')}

            {/* Gender Selection */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldIconRow}>
                <View style={styles.fieldIconCircle}>
                  <Ionicons name="people-outline" size={16} color={PROFILE_COLORS.primaryDark} />
                </View>
                <ThemedText style={styles.fieldLabel}>Gender</ThemedText>
              </View>
              <Pressable
                style={styles.genderSelector}
                onPress={() => setShowGenderModal(true)}
                accessibilityLabel={`Gender: ${formData.gender ? genderOptions.find((opt) => opt.value === formData.gender)?.label : 'Not selected'}`}
                accessibilityRole="button"
                accessibilityHint="Double tap to select your gender"
              >
                <ThemedText style={[styles.genderText, !formData.gender ? styles.placeholderText : null]}>
                  {formData.gender
                    ? genderOptions.find((opt) => opt.value === formData.gender)?.label
                    : 'Select gender'}
                </ThemedText>
                <Ionicons name="chevron-down" size={20} color={colors.text.tertiary} />
              </Pressable>
            </View>
          </View>

          {/* About Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBadge}>
                <Ionicons name="chatbubble-ellipses" size={16} color={PROFILE_COLORS.primaryDark} />
              </View>
              <ThemedText style={styles.cardTitle}>About</ThemedText>
            </View>
            {renderFormField('Bio', 'bio', 'Tell us about yourself...', true)}
          </View>

          {/* Contact Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBadge}>
                <Ionicons name="compass" size={16} color={PROFILE_COLORS.primaryDark} />
              </View>
              <ThemedText style={styles.cardTitle}>Contact</ThemedText>
            </View>
            {renderFormField('Location', 'location', 'Enter your city or location')}
            {renderFormField('Website', 'website', 'https://your-website.com', false, 'url')}
          </View>

          {/* Account Settings Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBadge}>
                <Ionicons name="settings" size={16} color={PROFILE_COLORS.primaryDark} />
              </View>
              <ThemedText style={styles.cardTitle}>Account Settings</ThemedText>
            </View>

            <Pressable
              style={styles.settingItem}
              accessibilityLabel="Change Password"
              accessibilityRole="button"
              accessibilityHint="Double tap to update your account password"
            >
              <View style={styles.settingItemLeft}>
                <View style={styles.settingIconCircle}>
                  <Ionicons name="key-outline" size={20} color={PROFILE_COLORS.primaryDark} />
                </View>
                <View style={styles.settingItemText}>
                  <ThemedText style={styles.settingItemTitle}>Change Password</ThemedText>
                  <ThemedText style={styles.settingItemDescription}>Update your account password</ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.neutral[300]} />
            </Pressable>

            <Pressable
              style={styles.settingItem}
              accessibilityLabel="Notification Preferences"
              accessibilityRole="button"
              accessibilityHint="Double tap to manage your notification settings"
            >
              <View style={styles.settingItemLeft}>
                <View style={styles.settingIconCircle}>
                  <Ionicons name="notifications-outline" size={20} color={PROFILE_COLORS.primaryDark} />
                </View>
                <View style={styles.settingItemText}>
                  <ThemedText style={styles.settingItemTitle}>Notification Preferences</ThemedText>
                  <ThemedText style={styles.settingItemDescription}>Manage your notification settings</ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.neutral[300]} />
            </Pressable>

            <Pressable
              style={[styles.settingItem, styles.settingItemLast]}
              accessibilityLabel="Privacy Settings"
              accessibilityRole="button"
              accessibilityHint="Double tap to control who can see your profile"
            >
              <View style={styles.settingItemLeft}>
                <View style={styles.settingIconCircle}>
                  <Ionicons name="shield-outline" size={20} color={PROFILE_COLORS.primaryDark} />
                </View>
                <View style={styles.settingItemText}>
                  <ThemedText style={styles.settingItemTitle}>Privacy Settings</ThemedText>
                  <ThemedText style={styles.settingItemDescription}>Control who can see your profile</ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.neutral[300]} />
            </Pressable>
          </View>

          {/* Danger Zone Card */}
          <View style={[styles.card, styles.dangerCard]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBadge, styles.dangerIconBadge]}>
                <Ionicons name="warning" size={16} color={Colors.error} />
              </View>
              <ThemedText style={[styles.cardTitle, styles.dangerCardTitle]}>Danger Zone</ThemedText>
            </View>

            <Pressable
              style={styles.dangerItem}
              onPress={() => {
                platformAlertDestructive(
                  'Delete Account',
                  'Are you sure you want to delete your account? This action cannot be undone.',
                  () => {
                    platformAlertSimple('Account Deleted', 'Your account has been scheduled for deletion.');
                  },
                  'Delete',
                );
              }}
              accessibilityLabel="Delete Account"
              accessibilityRole="button"
              accessibilityHint="Double tap to permanently delete your account and all data. This action cannot be undone"
            >
              <View style={styles.dangerIconCircle}>
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </View>
              <View style={styles.dangerItemText}>
                <ThemedText style={styles.dangerItemTitle}>Delete Account</ThemedText>
                <ThemedText style={styles.dangerItemDescription}>
                  Permanently delete your account and all data
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.error} />
            </Pressable>
          </View>

          {/* Full-width Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving || !hasChanges}
            accessibilityLabel={isSaving ? 'Saving profile changes' : 'Save changes'}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSaving || !hasChanges, busy: isSaving }}
            style={styles.bottomSaveWrapper}
          >
            <LinearGradient
              colors={hasChanges && !isSaving ? [PROFILE_COLORS.primaryDark, '#2d5a7b'] : ['#B0BEC5', '#CFD8DC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bottomSaveButton}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
                  <ThemedText style={styles.bottomSaveText}>{hasChanges ? 'Save Changes' : 'No Changes'}</ThemedText>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderModal}
        transparent={true}
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Gender</ThemedText>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowGenderModal(false)}
                accessibilityLabel="Close gender selection"
                accessibilityRole="button"
                accessibilityHint="Double tap to close the gender selection modal"
              >
                <Ionicons name="close" size={20} color={colors.text.tertiary} />
              </Pressable>
            </View>

            <FlashList
              data={genderOptions}
              keyExtractor={(item) => item.value}
              estimatedItemSize={44}
              renderItem={renderGenderOption}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    paddingTop: Platform.OS === 'android' ? 48 : 52,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  headerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: 0.4,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: PROFILE_COLORS.gold,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PROFILE_COLORS.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: PROFILE_COLORS.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  saveButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Avatar in header
  headerAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    shadowColor: PROFILE_COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 41,
    overflow: 'hidden',
    backgroundColor: PROFILE_COLORS.primaryDark,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text.inverse,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PROFILE_COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerUserInfo: {
    flex: 1,
  },
  headerUserName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.inverse,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  headerUserSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },

  // ── Scroll Content ────────────────────────────────────────────────────────
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },

  // ── Cards ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    marginBottom: 16,
    shadowColor: '#1a3a52',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  cardIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: `${PROFILE_COLORS.primaryDark}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PROFILE_COLORS.primaryDark,
    letterSpacing: 0.2,
  },

  // ── Form Fields ────────────────────────────────────────────────────────────
  fieldContainer: {
    marginBottom: 16,
  },
  fieldIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: `${PROFILE_COLORS.primaryDark}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
    flex: 1,
    letterSpacing: 0.1,
  },
  readonlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  readonlyBadgeText: {
    fontSize: 10,
    color: colors.neutral[400],
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: PROFILE_COLORS.primaryDark,
    backgroundColor: '#FAFBFD',
    minHeight: 50,
  },
  multilineInput: {
    height: 110,
    textAlignVertical: 'top',
    paddingTop: 13,
  },
  readonlyInput: {
    backgroundColor: '#F7F8FA',
    borderColor: '#E8ECF0',
    color: '#9AA7B2',
  },

  // Gender selector
  genderSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFBFD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minHeight: 50,
  },
  genderText: {
    fontSize: 15,
    color: PROFILE_COLORS.primaryDark,
  },
  placeholderText: {
    color: colors.neutral[400],
  },

  // ── Setting Items ─────────────────────────────────────────────────────────
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    minHeight: 62,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: `${PROFILE_COLORS.primaryDark}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PROFILE_COLORS.primaryDark,
    marginBottom: 2,
  },
  settingItemDescription: {
    fontSize: 12,
    color: '#9AA7B2',
    lineHeight: 18,
  },

  // ── Danger Zone ───────────────────────────────────────────────────────────
  dangerCard: {
    borderWidth: 1.5,
    borderColor: `${Colors.error}20`,
  },
  dangerCardTitle: {
    color: Colors.error,
  },
  dangerIconBadge: {
    backgroundColor: `${Colors.error}12`,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    minHeight: 62,
  },
  dangerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: `${Colors.error}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  dangerItemText: {
    flex: 1,
  },
  dangerItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 2,
  },
  dangerItemDescription: {
    fontSize: 12,
    color: '#9AA7B2',
    lineHeight: 18,
  },

  // ── Bottom Save Button ─────────────────────────────────────────────────────
  bottomSaveWrapper: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: PROFILE_COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  bottomSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: 16,
  },
  bottomSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
  },

  bottomSpace: {
    height: 30,
  },

  // ── Gender Modal ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '55%',
    paddingBottom: Spacing.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PROFILE_COLORS.primaryDark,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F8FA',
  },
  selectedGenderOption: {
    backgroundColor: `${PROFILE_COLORS.gold}15`,
  },
  genderOptionText: {
    fontSize: 16,
    color: PROFILE_COLORS.primaryDark,
    fontWeight: '500',
  },
  selectedGenderOptionText: {
    color: PROFILE_COLORS.primaryDark,
    fontWeight: '700',
  },
});

export default withErrorBoundary(ProfileEditPage, 'ProfileEdit');
