/**
 * Complete Step - Success Screen
 * Step 4 of 4: Onboarding complete!
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/stores/onboarding-v2';
import { Colors } from '@/constants/Colors';
import { logger } from '@/utils/logger';

export default function CompleteStep() {
  const router = useRouter();
  const {
    businessInfo,
    serviceSelection,
    qrCodes,
    completeOnboarding,
    resetOnboarding,
  } = useOnboardingStore();

  const [showContent, setShowContent] = useState(false);
  const [confettiOpacity] = useState(new Animated.Value(0));

  // Count enabled services
  const enabledServices = Object.entries(serviceSelection)
    .filter(([, enabled]) => enabled)
    .length;

  // Animate in
  useEffect(() => {
    Animated.sequence([
      Animated.timing(confettiOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => setShowContent(true), 300);
  }, []);

  // Handle go to dashboard
  const handleGoToDashboard = async () => {
    try {
      await completeOnboarding();
      router.replace('/dashboard');
    } catch (error) {
      logger.error('Failed to complete onboarding:', error);
      // Still go to dashboard
      router.replace('/dashboard');
    }
  };

  // Handle add bank later
  const handleAddBankLater = () => {
    router.push('/onboarding-v2/optional/bank');
  };

  // Handle add documents later
  const handleAddDocumentsLater = () => {
    router.push('/onboarding-v2/optional/documents');
  };

  return (
    <View style={styles.container}>
      {/* Success Animation */}
      <View style={styles.successContainer}>
        <Animated.View style={[styles.successCircle, { opacity: confettiOpacity }]}>
          <Ionicons name="checkmark-circle" size={100} color={Colors.light.success} />
        </Animated.View>

        {/* Confetti effect (simplified) */}
        <View style={styles.confetti}>
          {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'].map((color, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confettiPiece,
                {
                  backgroundColor: color,
                  left: `${15 + i * 14}%`,
                  transform: [{ rotate: `${i * 45}deg` }],
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Content */}
      {showContent && (
        <Animated.View style={[styles.content, styles.contentAnimated]}>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            {businessInfo.businessName} is ready to use
          </Text>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>What's enabled</Text>

            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Ionicons name="storefront" size={18} color={Colors.light.primary} />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Store</Text>
                <Text style={styles.summaryValue}>
                  {businessInfo.storeName || businessInfo.businessName}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Ionicons name="grid-outline" size={18} color={Colors.light.primary} />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Features</Text>
                <Text style={styles.summaryValue}>
                  {enabledServices} service{enabledServices !== 1 ? 's' : ''} active
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
            </View>

            {qrCodes.menu && (
              <View style={styles.summaryItem}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="qr-code-outline" size={18} color={Colors.light.primary} />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>QR Codes</Text>
                  <Text style={styles.summaryValue}>
                    Menu & Payment ready
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
              </View>
            )}
          </View>

          {/* Optional Actions */}
          <View style={styles.optionalSection}>
            <Text style={styles.optionalTitle}>Complete your profile (optional)</Text>

            <TouchableOpacity style={styles.optionalCard} onPress={handleAddBankLater}>
              <View style={styles.optionalIcon}>
                <Ionicons name="card-outline" size={22} color={Colors.light.primary} />
              </View>
              <View style={styles.optionalContent}>
                <Text style={styles.optionalLabel}>Add Bank Details</Text>
                <Text style={styles.optionalDescription}>
                  Required to receive payments
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionalCard} onPress={handleAddDocumentsLater}>
              <View style={styles.optionalIcon}>
                <Ionicons name="document-text-outline" size={22} color={Colors.light.primary} />
              </View>
              <View style={styles.optionalContent}>
                <Text style={styles.optionalLabel}>Upload Documents</Text>
                <Text style={styles.optionalDescription}>
                  GSTIN, PAN, address proof
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.dashboardButton} onPress={handleGoToDashboard}>
          <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          You can complete optional steps anytime from Settings
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    position: 'relative',
  },
  successCircle: {
    transform: [{ scale: 1 }],
  },
  confetti: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
    top: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentAnimated: {
    opacity: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.light.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  optionalSection: {
    marginBottom: 24,
  },
  optionalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  optionalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    marginBottom: 10,
  },
  optionalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.light.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionalContent: {
    flex: 1,
  },
  optionalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  optionalDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    marginBottom: 12,
  },
  dashboardButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footerNote: {
    fontSize: 13,
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
});
