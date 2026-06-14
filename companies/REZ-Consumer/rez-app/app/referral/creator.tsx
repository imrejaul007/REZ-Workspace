// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useReferral } from '../../hooks/useReferral';

export default function CreatorProfileScreen() {
  const router = useRouter();
  const { referralCode, generateCode } = useReferral();

  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const isCreator = referralCode?.code && referralCode.type === 'creator';

  const createProfile = async () => {
    if (!handle.trim()) {
      Alert.alert('Error', 'Please enter a creator handle');
      return;
    }

    setIsCreating(true);
    try {
      await generateCode('creator');
      Alert.alert('Success', 'Creator profile created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create creator profile');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Creator Studio</Text>
        <Text style={styles.subtitle}>Become a REZ Creator</Text>
      </View>

      {isCreator ? (
        /* Creator Dashboard */
        <View style={styles.dashboard}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Scans</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹0</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>

          {/* Creator Code */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Your Creator Code</Text>
            <Text style={styles.codeText}>{referralCode?.code}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/referral/creator/collections')}
            >
              <Text style={styles.actionIcon}>📚</Text>
              <Text style={styles.actionText}>Manage Collections</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/referral/creator/earnings')}
            >
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionText}>View Earnings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/referral/creator/analytics')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/referral/creator/links')}
            >
              <Text style={styles.actionIcon}>🔗</Text>
              <Text style={styles.actionText}>Share Links</Text>
            </TouchableOpacity>
          </View>

          {/* Commission Info */}
          <View style={styles.commissionCard}>
            <Text style={styles.commissionTitle}>Your Commission</Text>
            <View style={styles.commissionGrid}>
              <View style={styles.commissionItem}>
                <Text style={styles.commissionValue}>5%</Text>
                <Text style={styles.commissionLabel}>Starter</Text>
              </View>
              <View style={styles.commissionItem}>
                <Text style={styles.commissionValue}>7%</Text>
                <Text style={styles.commissionLabel}>Pro (100+)</Text>
              </View>
              <View style={styles.commissionItem}>
                <Text style={styles.commissionValue}>10%</Text>
                <Text style={styles.commissionLabel}>Elite (1000+)</Text>
              </View>
              <View style={styles.commissionItem}>
                <Text style={styles.commissionValue}>15%</Text>
                <Text style={styles.commissionLabel}>Diamond (5000+)</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* Onboarding */
        <View style={styles.onboarding}>
          <View style={styles.heroSection}>
            <Text style={styles.heroIcon}>⭐</Text>
            <Text style={styles.heroTitle}>Become a REZ Creator</Text>
            <Text style={styles.heroDescription}>
              Earn commissions by recommending REZ to your audience.
              Create collections, share QR codes, and build your creator brand.
            </Text>
          </View>

          <View style={styles.benefitsList}>
            <Text style={styles.benefitsTitle}>Creator Benefits</Text>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>💰</Text>
              <View>
                <Text style={styles.benefitText}>Earn Commission</Text>
                <Text style={styles.benefitSubtext}>5-15% on every referral</Text>
              </View>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📚</Text>
              <View>
                <Text style={styles.benefitText}>Create Collections</Text>
                <Text style={styles.benefitSubtext}>Curate your favorites</Text>
              </View>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📱</Text>
              <View>
                <Text style={styles.benefitText}>QR Codes</Text>
                <Text style={styles.benefitSubtext}>Share offline and online</Text>
              </View>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎁</Text>
              <View>
                <Text style={styles.benefitText}>Exclusive Rewards</Text>
                <Text style={styles.benefitSubtext}>Creator-only campaigns</Text>
              </View>
            </View>
          </View>

          {/* Sign Up Form */}
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Create Your Creator Profile</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Creator Handle</Text>
              <TextInput
                style={styles.input}
                placeholder="@yourname"
                value={handle}
                onChangeText={setHandle}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>
                Your unique identifier on REZ. e.g., @foodlover
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell your audience about yourself..."
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={createProfile}
              disabled={isCreating}
            >
              <Text style={styles.createButtonText}>
                {isCreating ? 'Creating...' : 'Become a Creator'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#6366F1',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  dashboard: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  codeCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
    letterSpacing: 4,
    marginTop: 8,
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  commissionCard: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  commissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  commissionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  commissionItem: {
    width: '48%',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  commissionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  commissionLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  onboarding: {
    padding: 16,
  },
  heroSection: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitIcon: {
    fontSize: 28,
    marginRight: 16,
    width: 40,
    textAlign: 'center',
  },
  benefitText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  benefitSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
