/**
 * Join NBKC Screen
 * Allows users to join the Namma Bengaluru Karma Corps.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NBKCHeader } from './_layout';
import * as nbkcService from '@/services/nbkcService';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const BENGALURU_WARDS = [
  'Indiranagar',
  'Koramangala',
  'Whitefield',
  'HSR Layout',
  'Marathahalli',
  'JP Nagar',
  'BTM Layout',
  'Jayanagar',
  'Malleshwaram',
  'Rajajinagar',
  'Yelahanka',
  'Hebbal',
  'Electronic City',
  'Magadi Road',
  'CV Raman Nagar',
];

export default withErrorBoundary(function JoinNBKCScreen() {
  const router = useRouter();
  const [ward, setWard] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showWardPicker, setShowWardPicker] = useState(false);

  const toggleSkill = (skill: string) => {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  const handleJoin = async () => {
    if (!ward) {
      Alert.alert('Ward Required', 'Please select your ward to join NBKC.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await nbkcService.joinCivicCorps({ ward, skills, hasVehicle });
      if (res.success) {
        Alert.alert('Welcome to NBKC!', "Namma City. Namma Karma. You're now a citizen member.", [
          { text: 'OK', onPress: () => router.replace('/karma/civic-corps') },
        ]);
      } else {
        Alert.alert('Join Failed', res.message ?? 'Please try again.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to join. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <NBKCHeader title="Join NBKC" subtitle="Namma Bengaluru Karma Corps" showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Intro */}
        <View style={styles.introCard}>
          <Ionicons name="leaf" size={32} color="#059669" />
          <Text style={styles.introTitle}>Become a Karma Corps Member</Text>
          <Text style={styles.introText}>
            Join thousands of Bengalureans working to keep our city green and clean. No fees, no minimum commitment —
            just civic pride.
          </Text>
        </View>

        {/* Ward Selection */}
        <Text style={styles.fieldLabel}>Your Ward *</Text>
        <Pressable style={styles.wardSelector} onPress={() => setShowWardPicker(!showWardPicker)}>
          <Text style={[styles.wardSelectorText, !ward && styles.wardPlaceholder]}>{ward || 'Select your ward'}</Text>
          <Ionicons name={showWardPicker ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
        </Pressable>

        {showWardPicker && (
          <View style={styles.wardList}>
            {BENGALURU_WARDS.map((w) => (
              <Pressable
                key={w}
                style={[styles.wardOption, ward === w && styles.wardOptionSelected]}
                onPress={() => {
                  setWard(w);
                  setShowWardPicker(false);
                }}
              >
                <Text style={[styles.wardOptionText, ward === w && styles.wardOptionTextSelected]}>{w}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Skills */}
        <Text style={styles.fieldLabel}>Skills (optional)</Text>
        <View style={styles.skillsGrid}>
          {[
            'Tree Planting',
            'Waste Segregation',
            'Water Conservation',
            'Lake Cleanup',
            'Community Organising',
            'First Aid',
            'Driving',
            'Photography',
            'Social Media',
          ].map((skill) => (
            <Pressable
              key={skill}
              style={[styles.skillChip, skills.includes(skill) && styles.skillChipSelected]}
              onPress={() => toggleSkill(skill)}
            >
              <Text style={[styles.skillChipText, skills.includes(skill) && styles.skillChipTextSelected]}>
                {skill}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Vehicle */}
        <Pressable style={styles.vehicleRow} onPress={() => setHasVehicle(!hasVehicle)}>
          <View style={[styles.checkbox, hasVehicle && styles.checkboxChecked]}>
            {hasVehicle && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleLabel}>I have a vehicle</Text>
            <Text style={styles.vehicleSubtext}>Eligible for NBKC vehicle sticker after 3 missions</Text>
          </View>
        </Pressable>

        {/* Perks preview */}
        <View style={styles.perksPreview}>
          <Text style={styles.perksTitle}>What you get as a member:</Text>
          {[
            'Digital civic ID & membership badge',
            'Access to civic missions',
            'Vehicle sticker (after 3 missions)',
            'Ward & global leaderboard ranking',
            'Merchant partner perks',
          ].map((perk, i) => (
            <View key={i} style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.joinBtn, submitting && styles.joinBtnDisabled]}
          onPress={handleJoin}
          disabled={submitting}
        >
          <LinearGradient colors={['#047857', '#059669', '#10B981']} style={styles.joinBtnGradient}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.joinBtnText}>Join Namma Bengaluru Karma Corps</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </Pressable>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}, 'JoinNBKC');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base },
  bottomPadding: { height: 40 },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  introTitle: { ...Typography.h4, color: '#065F46', fontWeight: '700', marginTop: Spacing.sm, marginBottom: 6 },
  introText: { ...Typography.body, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  fieldLabel: { ...Typography.body2, color: colors.text.primary, marginBottom: 8, marginTop: Spacing.md },
  wardSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  wardSelectorText: { flex: 1, ...Typography.body, color: colors.text.primary },
  wardPlaceholder: { color: '#9CA3AF' },
  wardList: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
  },
  wardOption: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  wardOptionSelected: { backgroundColor: '#D1FAE5' },
  wardOptionText: { ...Typography.body, color: colors.text.primary },
  wardOptionTextSelected: { color: '#065F46', fontWeight: '600' },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skillChipSelected: { backgroundColor: '#D1FAE5', borderColor: '#059669' },
  skillChipText: { ...Typography.bodySmall, color: '#6B7280' },
  skillChipTextSelected: { color: '#065F46', fontWeight: '500' },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: Spacing.md,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#059669', borderColor: '#059669' },
  vehicleLabel: { ...Typography.body, fontWeight: '500', color: colors.text.primary },
  vehicleSubtext: { ...Typography.bodySmall, color: '#9CA3AF', marginTop: 2 },
  perksPreview: {
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  perksTitle: { ...Typography.body2, color: '#065F46', marginBottom: 8 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  perkText: { ...Typography.bodySmall, color: '#065F46', flex: 1 },
  joinBtn: { marginTop: Spacing.lg, borderRadius: BorderRadius.md, overflow: 'hidden' },
  joinBtnDisabled: { opacity: 0.7 },
  joinBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  joinBtnText: { color: '#fff', ...Typography.h4, fontWeight: '700' },
});
