// @ts-nocheck
import { colors } from '@/constants/theme';
/**
 * Privé Campaign Post Submission Screen
 * Submit a post for a campaign
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform as RNPlatform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import priveApi from '@/services/priveApi';
import { platformAlert } from '@/utils/platformAlert';
import CachedImage from '@/components/ui/CachedImage';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

type Platform = 'instagram' | 'twitter' | 'youtube';

const PLATFORM_OPTIONS: { id: Platform; label: string; icon: string }[] = [
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { id: 'twitter', label: 'Twitter/X', icon: 'logo-twitter' },
  { id: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
];

function CampaignSubmitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const campaignId = (params.campaignId as string) || '';

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [postUrl, setPostUrl] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [errors, setErrors] = useState<{ postUrl?: string }>({});

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!selectedPlatform || !postUrl) {
        setErrors({
          postUrl: !postUrl ? 'Post URL is required' : undefined,
        });
        return Promise.reject(new Error('Validation failed'));
      }

      if (!postUrl.startsWith('https://')) {
        setErrors({ postUrl: 'URL must start with https://' });
        return Promise.reject(new Error('Invalid URL'));
      }

      return priveApi.submitCampaignPost(campaignId, {
        platform: selectedPlatform,
        postUrl,
        screenshotUrl: screenshotUrl || undefined,
      });
    },
    onSuccess: (res) => {
      platformAlert('Success', 'Your post has been submitted for review!', [
        {
          text: 'View Status',
          onPress: () => {
            router.push({
              pathname: '/prive/campaigns/status',
              params: { campaignId },
            });
          },
        },
        {
          text: 'Back to Campaigns',
          onPress: () => router.back(),
          style: 'cancel',
        },
      ]);
    },
    onError: (error) => {
      const message = error?.data?.message || 'Failed to submit post';
      platformAlert('Error', message);
    },
  });

  const handleUrlChange = (text: string) => {
    setPostUrl(text);
    setErrors({});
  };

  const isValid = selectedPlatform && postUrl.startsWith('https://');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Submit Post</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={RNPlatform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <ProgressStep number={1} label="Select Platform" active={!selectedPlatform} />
            <View style={styles.progressLine} />
            <ProgressStep number={2} label="Add URL" active={!!selectedPlatform} />
            <View style={styles.progressLine} />
            <ProgressStep number={3} label="Add Screenshot" active={!!postUrl} />
            <View style={styles.progressLine} />
            <ProgressStep number={4} label="Submit" active={!!isValid} />
          </View>

          {/* Step 1: Select Platform */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Platform</Text>
            <View style={styles.platformGrid}>
              {PLATFORM_OPTIONS.map((platform) => (
                <Pressable
                  key={platform.id}
                  onPress={() => setSelectedPlatform(platform.id)}
                  style={[styles.platformButton, selectedPlatform === platform.id ? styles.platformButtonActive : null]}
                >
                  <Ionicons
                    name={platform.icon as unknown}
                    size={32}
                    color={selectedPlatform === platform.id ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[styles.platformLabel, selectedPlatform === platform.id ? styles.platformLabelActive : null]}
                  >
                    {platform.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Step 2: Enter URL */}
          {selectedPlatform && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Post URL</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="link" size={20} color={Colors.primary} />
                <TextInput
                  style={styles.input}
                  placeholder={`Enter your ${PLATFORM_OPTIONS.find((p) => p.id === selectedPlatform)?.label} post URL`}
                  placeholderTextColor={Colors.textSecondary}
                  value={postUrl}
                  onChangeText={handleUrlChange}
                  autoCapitalize="none"
                  autoComplete="off"
                  editable={!submitMutation.isPending}
                />
              </View>
              {errors.postUrl && <Text style={styles.errorText}>{errors.postUrl}</Text>}
              <Text style={styles.helperText}>Must start with https://</Text>
            </View>
          )}

          {/* Step 3: Upload Screenshot */}
          {postUrl && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Screenshot (Optional)</Text>
              <Pressable style={styles.uploadPlaceholder}>
                <Ionicons name="image" size={32} color={Colors.textSecondary} />
                <Text style={styles.uploadPlaceholderText}>Tap to add screenshot</Text>
                <Text style={styles.uploadPlaceholderSubtext}>
                  {screenshotUrl ? 'Screenshot added' : 'Show the post on your profile'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Hints */}
          <View style={styles.hintsSection}>
            <Text style={styles.hintsTitle}>Submission Tips</Text>
            <View style={styles.hintItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={styles.hintText}>Public post so our team can see it</Text>
            </View>
            <View style={styles.hintItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={styles.hintText}>Use the required hashtag</Text>
            </View>
            <View style={styles.hintItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={styles.hintText}>Write an engaging caption</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => submitMutation.mutate()}
          disabled={!isValid || submitMutation.isPending}
          style={({ pressed }) => [
            styles.submitButton,
            (!isValid || submitMutation.isPending) && styles.submitButtonDisabled,
            pressed && !submitMutation.isPending && { opacity: 0.8 },
          ]}
        >
          <LinearGradient
            colors={
              isValid && !submitMutation.isPending
                ? [Colors.primary, Colors.primaryDark]
                : [Colors.textSecondary, Colors.textSecondary]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButtonGradient}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit Post</Text>
                <Ionicons name="send" size={16} color={Colors.white} />
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default withErrorBoundary(CampaignSubmitScreen, 'PriveCampaignsSubmit');

interface ProgressStepProps {
  number: number;
  label: string;
  active: boolean;
}

function ProgressStep({ number, label, active }: ProgressStepProps) {
  return (
    <View style={styles.progressStep}>
      <View style={[styles.progressStepNumber, active ? styles.progressStepNumberActive : null]}>
        <Text style={[styles.progressStepNumberText, active ? styles.progressStepNumberTextActive : null]}>
          {number}
        </Text>
      </View>
      <Text style={styles.progressStepLabel}>{label}</Text>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    ...Typography.heading3,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressStepNumberActive: {
    backgroundColor: Colors.primary,
  },
  progressStepNumberText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  progressStepNumberTextActive: {
    color: Colors.white,
  },
  progressStepLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  progressLine: {
    height: 2,
    backgroundColor: colors.border.default,
    flex: 0.3,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  platformGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  platformButton: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
  },
  platformButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.05)',
  },
  platformLabel: {
    ...Typography.body2,
    color: Colors.text,
    fontWeight: '500',
  },
  platformLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: Colors.white,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
    ...Typography.body2,
    color: Colors.text,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  uploadPlaceholder: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
  },
  uploadPlaceholderText: {
    ...Typography.body2,
    color: Colors.text,
    fontWeight: '500',
  },
  uploadPlaceholderSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  hintsSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(108, 99, 255, 0.05)',
    marginBottom: Spacing.lg,
  },
  hintsTitle: {
    ...Typography.body1,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  hintText: {
    ...Typography.body2,
    color: Colors.text,
    flex: 1,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.primary,
  },
  submitButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  submitButtonText: {
    ...Typography.body1,
    color: Colors.white,
    fontWeight: '600',
  },
});
