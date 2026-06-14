// @ts-nocheck
import { colors } from '@/constants/theme';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Create Article Page

import React, { useState } from 'react';
import apiClient from '@/services/apiClient';
import {
  View,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { platformAlert, platformAlertSimple } from '@/utils/platformAlert';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import CachedImage from '@/components/ui/CachedImage';

interface ArticleForm {
  title: string;
  content: string;
  category: 'lifestyle' | 'food' | 'beauty' | 'travel' | 'finance' | 'health';
  tags: string[];
  images: string[];
  isPublic: boolean;
}

const CATEGORIES = [
  { id: 'food' as const, label: 'Food', emoji: '🍽️' },
  { id: 'beauty' as const, label: 'Beauty', emoji: '💄' },
  { id: 'lifestyle' as const, label: 'Lifestyle', emoji: '✨' },
  { id: 'travel' as const, label: 'Travel', emoji: '✈️' },
  { id: 'finance' as const, label: 'Finance', emoji: '💰' },
  { id: 'health' as const, label: 'Health', emoji: '🏃' },
];

function CreateArticlePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<ArticleForm>({
    title: '',
    content: '',
    category: 'lifestyle',
    tags: [],
    images: [],
    isPublic: true,
  });
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets) {
      const newUris = result.assets.map((a: ImagePickerAsset) => a.uri);
      setForm((f) => ({
        ...f,
        images: [...f.images, ...newUris].slice(0, 5),
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && form.tags.length < 5) {
      const newTag = tagInput.trim().toLowerCase();
      if (!form.tags.includes(newTag)) {
        setForm((f) => ({ ...f, tags: [...f.tags, newTag] }));
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const handleRemoveImage = (index: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handlePublish = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      platformAlertSimple('Missing Info', 'Please add a title and content to your article.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/articles', {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        tags: form.tags,
        isPublic: form.isPublic,
        images: form.images,
      });

      platformAlert('Published!', 'Your article is now live.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) {
      platformAlertSimple('Error', err.message || 'Failed to publish. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.title.trim().length > 0 && form.content.trim().length > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Create Article</ThemedText>
        <Pressable
          onPress={handlePublish}
          disabled={!isValid || submitting}
          style={[styles.publishButton, (!isValid || submitting) && styles.publishButtonDisabled]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <ThemedText style={styles.publishButtonText}>Publish</ThemedText>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.section}>
            <TextInput
              style={styles.titleInput}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.text.tertiary}
              value={form.title}
              onChangeText={(text) => setForm((f) => ({ ...f, title: text }))}
              multiline
            />
          </View>

          {/* Category Picker */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Category</ThemedText>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[styles.categoryPill, form.category === cat.id ? styles.categoryPillSelected : null]}
                  onPress={() => setForm((f) => ({ ...f, category: cat.id }))}
                >
                  <ThemedText style={styles.categoryEmoji}>{cat.emoji}</ThemedText>
                  <ThemedText
                    style={[styles.categoryLabel, form.category === cat.id ? styles.categoryLabelSelected : null]}
                  >
                    {cat.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Content Area */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Content</ThemedText>
            <TextInput
              style={styles.contentInput}
              placeholder="Write your article here..."
              placeholderTextColor={colors.text.tertiary}
              value={form.content}
              onChangeText={(text) => setForm((f) => ({ ...f, content: text }))}
              multiline
            />
          </View>

          {/* Image Attachment */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Photos ({form.images.length}/5)</ThemedText>
            <Pressable style={styles.addPhotoButton} onPress={handleAddImage}>
              <Ionicons name="image-outline" size={24} color={colors.nileBlue} />
              <ThemedText style={styles.addPhotoText}>Add Photos</ThemedText>
            </Pressable>
            {form.images.length > 0 && (
              <View style={styles.imageGrid}>
                {form.images.map((uri, idx) => (
                  <View key={idx} style={styles.imageContainer}>
                    <CachedImage source={{ uri }} style={styles.imageThumbnail} />
                    <Pressable style={styles.removeImageButton} onPress={() => handleRemoveImage(idx)}>
                      <Ionicons name="close-circle" size={24} color={Colors.error} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Tags Input */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Tags (Max 5)</ThemedText>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="Add a tag..."
                placeholderTextColor={colors.text.tertiary}
                value={tagInput}
                onChangeText={setTagInput}
              />
              <Pressable
                style={[
                  styles.tagAddButton,
                  (!tagInput.trim() || form.tags.length >= 5) && styles.tagAddButtonDisabled,
                ]}
                onPress={handleAddTag}
                disabled={!tagInput.trim() || form.tags.length >= 5}
              >
                <Ionicons name="add" size={20} color={colors.text.inverse} />
              </Pressable>
            </View>
            {form.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {form.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagChip}>
                    <ThemedText style={styles.tagChipText}>{tag}</ThemedText>
                    <Pressable onPress={() => handleRemoveTag(tag)}>
                      <Ionicons name="close" size={16} color={colors.text.inverse} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Visibility Toggle */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Visibility</ThemedText>
            <View style={styles.visibilityOptions}>
              <Pressable
                style={[styles.visibilityOption, form.isPublic ? styles.visibilityOptionSelected : null]}
                onPress={() => setForm((f) => ({ ...f, isPublic: true }))}
              >
                <Ionicons
                  name={form.isPublic ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={form.isPublic ? colors.nileBlue : colors.text.tertiary}
                />
                <ThemedText style={styles.visibilityLabel}>Public</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.visibilityOption, !form.isPublic ? styles.visibilityOptionSelected : null]}
                onPress={() => setForm((f) => ({ ...f, isPublic: false }))}
              >
                <Ionicons
                  name={!form.isPublic ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={!form.isPublic ? colors.nileBlue : colors.text.tertiary}
                />
                <ThemedText style={styles.visibilityLabel}>Followers Only</ThemedText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  publishButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    backgroundColor: colors.nileBlue,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  publishButtonText: {
    ...Typography.label,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleInput: {
    ...Typography.h2,
    fontWeight: '700',
    color: colors.text.primary,
    minHeight: 60,
  },
  contentInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    color: colors.text.primary,
    minHeight: 150,
    textAlignVertical: 'top',
    ...Typography.body,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryPillSelected: {
    backgroundColor: Colors.secondary[50],
    borderColor: colors.nileBlue,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  categoryLabelSelected: {
    color: colors.nileBlue,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
  },
  addPhotoText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  imageContainer: {
    position: 'relative',
    width: '48%',
    aspectRatio: 1,
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    color: colors.text.primary,
    ...Typography.body,
  },
  tagAddButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.nileBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagAddButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    backgroundColor: colors.nileBlue,
    borderRadius: BorderRadius.full,
  },
  tagChipText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  visibilityOptionSelected: {
    backgroundColor: Colors.secondary[50],
    borderColor: colors.nileBlue,
  },
  visibilityLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

export default withErrorBoundary(CreateArticlePage, 'ArticleCreate');
