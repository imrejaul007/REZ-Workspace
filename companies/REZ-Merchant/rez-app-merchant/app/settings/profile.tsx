/**
 * Merchant Profile Editor
 * Edit store name, description, category, phone, website, and logo
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/api/client';
import { uploadsService } from '@/services/api/uploads';
import { Colors } from '@/constants/Colors';

interface StoreProfile {
  name: string;
  description: string;
  category: string;
  phone: string;
  website: string;
  logo?: string;
}

const DESCRIPTION_MAX = 200;

function SkeletonBlock({
  height,
  width,
  style,
}: {
  height: number;
  width?: number | string;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          height,
          width: width ?? '100%',
          backgroundColor: '#E5E7EB',
          borderRadius: 8,
          marginBottom: 8,
        },
        style,
      ]}
    />
  );
}

function LoadingSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      <View style={skeletonStyles.avatarRow}>
        <SkeletonBlock height={50} width={50} style={{ borderRadius: 25 }} />
        <SkeletonBlock height={36} width={120} style={{ marginLeft: 16 }} />
      </View>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i}>
          <SkeletonBlock height={14} width={80} />
          <SkeletonBlock height={44} />
        </View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: { padding: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
});

export default function StoreProfileScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [form, setForm] = useState<StoreProfile>({
    name: '',
    description: '',
    category: '',
    phone: '',
    website: '',
    logo: undefined,
  });

  const savedForm = useRef<StoreProfile | null>(null);
  const isDirty = useCallback((): boolean => {
    if (!savedForm.current) return false;
    const s = savedForm.current;
    return (
      form.name !== s.name ||
      form.description !== s.description ||
      form.category !== s.category ||
      form.phone !== s.phone ||
      form.website !== s.website ||
      form.logo !== s.logo
    );
  }, [form]);

  // Warn on navigate-away with unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty()) return;
      e.preventDefault();
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Discard them and leave the screen?',
        [
          { text: 'Stay', style: 'cancel', onPress: () => {} },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<StoreProfile>('/merchant/store-profile');
      const data: StoreProfile = (res as unknown as { data?: StoreProfile }).data ?? (res as unknown as StoreProfile);
      const profile: StoreProfile = {
        name: data.name ?? '',
        description: data.description ?? '',
        category: data.category ?? '',
        phone: data.phone ?? '',
        website: data.website ?? '',
        logo: data.logo,
      };
      setForm(profile);
      savedForm.current = profile;
    } catch {
      Alert.alert('Error', 'Failed to load store profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChangeLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access to change your logo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: asset.fileName ?? 'logo.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    } as unknown as Blob);

    try {
      setUploadingLogo(true);
      const uploaded = await uploadsService.uploadImage(
        asset.uri,
        asset.fileName ?? 'logo.jpg',
        'logo'
      );
      const uploadedUrl: string = uploaded.url ?? '';
      if (uploadedUrl) {
        setForm((prev) => ({ ...prev, logo: uploadedUrl }));
      } else {
        Alert.alert('Error', 'Upload succeeded but no URL returned');
      }
    } catch {
      Alert.alert('Error', 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Store name is required');
      return;
    }
    if (form.description.length > DESCRIPTION_MAX) {
      Alert.alert('Validation', `Description must be ${DESCRIPTION_MAX} characters or less`);
      return;
    }
    try {
      setSaving(true);
      // BAK-CROSS-009 fix: backend expects ownerName for store profile updates
      const { name, ...restForm } = form;
      await apiClient.patch('/merchant/store-profile', {
        ownerName: name?.trim(),
        ...restForm,
        description: form.description.trim(),
        category: form.category.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        ...(form.logo ? { logo: form.logo } : {}),
      });
      savedForm.current = { ...form };
      Alert.alert('Saved', 'Store profile updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Store Profile', headerShown: true }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <TouchableOpacity
                style={styles.logoWrapper}
                onPress={handleChangeLogo}
                disabled={uploadingLogo}
              >
                {form.logo ? (
                  <Image source={{ uri: form.logo }} style={styles.logoImage} />
                ) : (
                  <View style={[styles.logoImage, styles.logoPlaceholder]}>
                    <Ionicons name="storefront-outline" size={24} color="#9CA3AF" />
                  </View>
                )}
                {uploadingLogo && (
                  <View style={styles.logoOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changeLogoBtn}
                onPress={handleChangeLogo}
                disabled={uploadingLogo}
              >
                <Ionicons name="camera-outline" size={16} color={Colors.light.primary} />
                <Text style={styles.changeLogoText}>Change Logo</Text>
              </TouchableOpacity>
            </View>

            {/* Store Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Store Name *</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                placeholder="e.g. The Coffee Corner"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Description</Text>
                <Text
                  style={[
                    styles.charCount,
                    form.description.length > DESCRIPTION_MAX && styles.charCountOver,
                  ]}
                >
                  {form.description.length}/{DESCRIPTION_MAX}
                </Text>
              </View>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={form.description}
                onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
                placeholder="Tell customers about your store..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={DESCRIPTION_MAX}
                textAlignVertical="top"
              />
            </View>

            {/* Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={form.category}
                onChangeText={(v) => setForm((p) => ({ ...p, category: v }))}
                placeholder="e.g. Food & Beverage"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
                placeholder="+91 98765 43210"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            {/* Website */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Website URL</Text>
              <TextInput
                style={styles.input}
                value={form.website}
                onChangeText={(v) => setForm((p) => ({ ...p, website: v }))}
                placeholder="https://yourstore.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 12,
  },
  logoWrapper: {
    position: 'relative',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  logoPlaceholder: {
    backgroundColor: Colors.light.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeLogoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight2,
  },
  changeLogoText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },

  // Fields
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textDark,
    marginBottom: 6,
  },
  charCount: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  charCountOver: {
    color: Colors.light.error,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 11,
  },

  // Save Button
  saveBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
