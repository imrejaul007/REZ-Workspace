// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Delete Account Page
// Allows users to permanently delete their account with confirmation

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useAuthActions } from '@/stores/selectors';
import apiClient from '@/services/apiClient';
import { platformAlertSimple, platformAlertConfirm, platformAlertDestructive } from '@/utils/platformAlert';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function DeleteAccountPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const actions = useAuthActions();
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const requiredText = 'DELETE';

  const handleDeleteAccount = async () => {
    if (confirmationText !== requiredText) {
      platformAlertSimple('Confirmation Required', `Please type "${requiredText}" to confirm account deletion.`);
      return;
    }

    platformAlertDestructive(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      confirmDeleteAccount,
      'Delete Account',
    );
  };

  const confirmDeleteAccount = async () => {
    setIsLoading(true);

    try {
      // FIX CA-AUT-001: Use correct endpoint /user/auth/account (not /auth/account)
      const response = await apiClient.delete('/user/auth/account');

      const data = response.data as unknown;
      if (data?.success) {
        platformAlertConfirm(
          'Account Deleted',
          'Your account has been successfully deleted. You will be redirected to the login page.',
          async () => {
            // AuthContext navigation guard handles redirect after logout
            await actions.logout();
          },
          'OK',
        );
      } else {
        const msg = data?.message || 'Failed to delete account';
        if (msg.toLowerCase().includes('active order')) {
          platformAlertSimple(
            'Cannot Delete',
            'You have active orders. Please wait for them to complete before deleting your account.',
          );
        } else if (msg.toLowerCase().includes('wallet balance') || msg.toLowerCase().includes('pending')) {
          platformAlertSimple('Cannot Delete', 'Please withdraw your wallet balance before deleting your account.');
        } else {
          platformAlertSimple('Error', msg);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete account. Please try again.';
      if (errorMessage.toLowerCase().includes('active order')) {
        platformAlertSimple(
          'Cannot Delete',
          'You have active orders. Please wait for them to complete before deleting your account.',
        );
      } else if (
        errorMessage.toLowerCase().includes('wallet balance') ||
        errorMessage.toLowerCase().includes('pending')
      ) {
        platformAlertSimple('Cannot Delete', 'Please withdraw your wallet balance before deleting your account.');
      } else {
        platformAlertSimple('Error', errorMessage);
      }
    } finally {
      if (!isMounted()) return;
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get('/auth/me/data-export');
      const json = JSON.stringify(response.data, null, 2);

      // Save to file and share
      const fileName = `rez-data-export-${Date.now()}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Your REZ Data Export (GDPR Article 20)',
        UTI: 'public.json',
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Could not export your data. Please try again.';
      platformAlertSimple('Export Failed', errorMessage);
    } finally {
      if (!isMounted()) return;
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.error} />

      {/* Header */}
      <LinearGradient colors={[colors.error, colors.error]} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Double tap to return to previous screen"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </Pressable>

          <ThemedText style={styles.headerTitle}>Delete Account</ThemedText>

          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Warning Card */}
        <View style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={24} color={Colors.warning} />
            <ThemedText style={styles.warningTitle}>Warning</ThemedText>
          </View>
          <ThemedText style={styles.warningText}>
            This action cannot be undone. Deleting your account will permanently remove all your data, including your
            profile, settings, and account history.
          </ThemedText>
        </View>

        {/* What Will Be Deleted */}
        <View style={styles.deletionCard}>
          <ThemedText style={styles.deletionTitle}>What will be deleted:</ThemedText>
          <View style={styles.deletionList}>
            <View style={styles.deletionItem}>
              <Ionicons name="trash" size={16} color={Colors.error} />
              <ThemedText style={styles.deletionText}>Your profile and personal information</ThemedText>
            </View>
            <View style={styles.deletionItem}>
              <Ionicons name="trash" size={16} color={Colors.error} />
              <ThemedText style={styles.deletionText}>All your settings and preferences</ThemedText>
            </View>
            <View style={styles.deletionItem}>
              <Ionicons name="trash" size={16} color={Colors.error} />
              <ThemedText style={styles.deletionText}>Your account history and data</ThemedText>
            </View>
            <View style={styles.deletionItem}>
              <Ionicons name="trash" size={16} color={Colors.error} />
              <ThemedText style={styles.deletionText}>Access to all app features</ThemedText>
            </View>
          </View>
        </View>

        {/* Confirmation Input */}
        <View style={styles.confirmationContainer}>
          <ThemedText style={styles.confirmationLabel}>
            To confirm, type <ThemedText style={styles.requiredText}>{requiredText}</ThemedText> in the box below:
          </ThemedText>
          <TextInput
            style={styles.confirmationInput}
            value={confirmationText}
            onChangeText={setConfirmationText}
            placeholder={`Type "${requiredText}" here`}
            placeholderTextColor={colors.neutral[400]}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="Delete account confirmation"
            accessibilityHint={`Type the word ${requiredText} to confirm account deletion`}
          />
        </View>

        {/* Export Data Button */}
        <Pressable
          style={[styles.exportButton, isExporting ? styles.exportButtonLoading : null]}
          onPress={handleExportData}
          disabled={isExporting}
          accessibilityRole="button"
          accessibilityLabel="Export my data"
          accessibilityHint="Double tap to download all your data as JSON (GDPR Article 20)"
          accessibilityState={{ disabled: isExporting }}
        >
          {isExporting ? (
            <ActivityIndicator color={colors.text.primary} size="small" />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="#1a3a52" />
              <ThemedText style={styles.exportButtonText}>Export My Data</ThemedText>
            </>
          )}
        </Pressable>
        <ThemedText style={styles.exportCaption}>
          Download all your data (GDPR Article 20 - Right to Data Portability)
        </ThemedText>

        {/* Delete Button */}
        <Pressable
          style={[styles.deleteButton, (confirmationText !== requiredText || isLoading) && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={confirmationText !== requiredText || isLoading}
          accessibilityRole="button"
          accessibilityLabel="Delete my account permanently"
          accessibilityHint="Double tap to permanently delete your account. This action cannot be undone"
          accessibilityState={{ disabled: confirmationText !== requiredText || isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.text.inverse} size="small" />
          ) : (
            <>
              <Ionicons name="trash" size={20} color={colors.text.inverse} />
              <ThemedText style={styles.deleteButtonText}>Delete Account</ThemedText>
            </>
          )}
        </Pressable>

        {/* Alternative Options */}
        <View style={styles.alternativesCard}>
          <ThemedText style={styles.alternativesTitle}>Before you go...</ThemedText>
          <ThemedText style={styles.alternativesText}>Consider these alternatives to deleting your account:</ThemedText>
          <View style={styles.alternativesList}>
            <Pressable
              style={styles.alternativeItem}
              onPress={() => router.push('/account/settings')}
              accessibilityRole="button"
              accessibilityLabel="Update your privacy settings"
              accessibilityHint="Double tap to adjust your account privacy settings instead of deleting"
            >
              <Ionicons name="settings" size={16} color={Colors.brand.purple} />
              <ThemedText style={styles.alternativeText}>Update your privacy settings</ThemedText>
            </Pressable>
            <Pressable
              style={styles.alternativeItem}
              onPress={() => router.push('/account/notifications')}
              accessibilityRole="button"
              accessibilityLabel="Disable notifications"
              accessibilityHint="Double tap to turn off notifications instead of deleting your account"
            >
              <Ionicons name="notifications-off" size={16} color={Colors.brand.purple} />
              <ThemedText style={styles.alternativeText}>Disable notifications</ThemedText>
            </Pressable>
            <Pressable
              style={styles.alternativeItem}
              onPress={() => router.push('/support')}
              accessibilityRole="button"
              accessibilityLabel="Contact support for help"
              accessibilityHint="Double tap to get help from our support team"
            >
              <Ionicons name="help-circle" size={16} color={Colors.brand.purple} />
              <ThemedText style={styles.alternativeText}>Contact support for help</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 120,
  },
  warningCard: {
    backgroundColor: colors.tint.amberLight,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.warningScale[400],
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  warningTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.brand.amberDark,
    marginLeft: Spacing.md,
  },
  warningText: {
    ...Typography.body,
    color: colors.brand.amberDark,
    lineHeight: 20,
  },
  deletionCard: {
    backgroundColor: colors.background.primary,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  deletionTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: Spacing.md,
  },
  deletionList: {
    gap: Spacing.sm,
  },
  deletionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deletionText: {
    ...Typography.body,
    color: colors.text.tertiary,
    marginLeft: Spacing.sm,
  },
  confirmationContainer: {
    marginBottom: Spacing.xl,
  },
  confirmationLabel: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: Spacing.md,
  },
  requiredText: {
    fontWeight: '700',
    color: Colors.error,
  },
  confirmationInput: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    ...Typography.bodyLarge,
    color: colors.text.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  deleteButton: {
    backgroundColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  deleteButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  deleteButtonText: {
    color: colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  exportButton: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: '#1a3a52',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  exportButtonLoading: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: '#1a3a52',
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  exportCaption: {
    ...Typography.caption,
    color: colors.text.tertiary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  alternativesCard: {
    backgroundColor: colors.background.primary,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  alternativesTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: Spacing.sm,
  },
  alternativesText: {
    ...Typography.body,
    color: colors.text.tertiary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  alternativesList: {
    gap: Spacing.sm,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  alternativeText: {
    ...Typography.body,
    color: Colors.brand.purple,
    marginLeft: Spacing.sm,
  },
  footer: {
    height: 20,
  },
});

export default withErrorBoundary(DeleteAccountPage, 'AccountDeleteAccount');
