/**
 * Ads Manager — Create / Edit Screen
 * Multi-step form: Step 1 Creative | Step 2 Targeting | Step 3 Budget & Schedule
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AdCampaign,
  fetchAds,
  createAd,
  updateAd,
  submitAd,
  CreateAdPayload,
} from '@/services/api/adCampaigns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormState {
  title: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
  placement: AdCampaign['placement'];
  targetSegment: AdCampaign['targetSegment'];
  bidType: AdCampaign['bidType'];
  bidAmount: string;
  dailyBudget: string;
  totalBudget: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  headline: '',
  description: '',
  ctaText: 'Shop Now',
  ctaUrl: '',
  imageUrl: '',
  placement: 'home_banner',
  targetSegment: 'all',
  bidType: 'CPC',
  bidAmount: '',
  dailyBudget: '',
  totalBudget: '',
  startDate: '',
  endDate: '',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CTA_OPTIONS = ['Shop Now', 'Order Now', 'Get Offer', 'Learn More', 'Book Now'];

const PLACEMENTS: {
  key: AdCampaign['placement'];
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { key: 'home_banner', label: 'Home Banner', icon: 'home-outline', color: '#7c3aed' },
  { key: 'explore_feed', label: 'Explore Feed', icon: 'compass-outline', color: '#0ea5e9' },
  { key: 'store_listing', label: 'Store Listing', icon: 'storefront-outline', color: '#10b981' },
  { key: 'search_result', label: 'Search Result', icon: 'search-outline', color: '#f59e0b' },
];

const SEGMENTS: {
  key: AdCampaign['targetSegment'];
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'all', label: 'All Customers', icon: 'people-outline' },
  { key: 'new', label: 'New', icon: 'person-add-outline' },
  { key: 'loyal', label: 'Loyal', icon: 'heart-outline' },
  { key: 'lapsed', label: 'Lapsed', icon: 'time-outline' },
  { key: 'nearby', label: 'Nearby', icon: 'location-outline' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field = ({ label, required, children }: FieldProps) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={{ color: '#ef4444' }}> *</Text>}
    </Text>
    {children}
  </View>
);

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function CreateAdScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [existingAdId, setExistingAdId] = useState<string | null>(id ?? null);

  // Load existing ad if editing
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const ads = await fetchAds();
        const found = ads.find((a) => a._id === id);
        if (found) {
          setExistingAdId(found._id);
          setForm({
            title: found.title,
            headline: found.headline,
            description: found.description,
            ctaText: found.ctaText,
            ctaUrl: found.ctaUrl ?? '',
            imageUrl: found.imageUrl,
            placement: found.placement,
            targetSegment: found.targetSegment,
            bidType: found.bidType,
            bidAmount: String(found.bidAmount),
            dailyBudget: String(found.dailyBudget),
            totalBudget: String(found.totalBudget),
            startDate: found.startDate ? found.startDate.slice(0, 10) : '',
            endDate: found.endDate ? found.endDate.slice(0, 10) : '',
          });
        }
      } catch {
        Alert.alert('Error', 'Failed to load ad details');
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, [id]);

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ---------------------------------------------------------------------------
  // Validation per step
  // ---------------------------------------------------------------------------

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!form.title.trim()) return 'Title is required.';
      if (!form.headline.trim()) return 'Headline is required.';
      if (!form.description.trim()) return 'Description is required.';
      if (!form.imageUrl.trim()) return 'Image URL is required.';
    }
    if (s === 2) {
      if (!form.bidAmount.trim() || Number(form.bidAmount) <= 0)
        return 'Bid amount must be greater than 0.';
      if (!form.dailyBudget.trim() || Number(form.dailyBudget) <= 0)
        return 'Daily budget must be greater than 0.';
      if (!form.totalBudget.trim() || Number(form.totalBudget) <= 0)
        return 'Total budget must be greater than 0.';
      if (!form.startDate.trim()) return 'Start date is required (YYYY-MM-DD).';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.startDate))
        return 'Start date must be in YYYY-MM-DD format.';
      if (form.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.endDate))
        return 'End date must be in YYYY-MM-DD format.';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) {
      Alert.alert('Validation', err);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  // ---------------------------------------------------------------------------
  // Save / Submit
  // ---------------------------------------------------------------------------

  const buildPayload = (): CreateAdPayload => ({
    title: form.title.trim(),
    headline: form.headline.trim(),
    description: form.description.trim(),
    ctaText: form.ctaText,
    ctaUrl: form.ctaUrl.trim() || undefined,
    imageUrl: form.imageUrl.trim(),
    placement: form.placement,
    targetSegment: form.targetSegment,
    bidType: form.bidType,
    bidAmount: Number(form.bidAmount),
    dailyBudget: Number(form.dailyBudget),
    totalBudget: Number(form.totalBudget),
    startDate: form.startDate,
    endDate: form.endDate.trim() || undefined,
  });

  const handleSaveDraft = async () => {
    const err = validateStep(step);
    if (err) {
      Alert.alert('Validation', err);
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (existingAdId) {
        await updateAd(existingAdId, payload);
      } else {
        const created = await createAd(payload);
        if (created) setExistingAdId(created._id);
      }
      router.back();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save ad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    const err = validateStep(step);
    if (err) {
      Alert.alert('Validation', err);
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload();
      let adId = existingAdId;
      if (adId) {
        await updateAd(adId, payload);
      } else {
        const created = await createAd(payload);
        if (!created) throw new Error('Failed to create ad');
        adId = created._id;
      }
      await submitAd(adId!);
      router.replace('/ads');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to submit ad');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderStep1 = () => (
    <>
      <Field label="Title" required>
        <TextInput
          style={styles.input}
          placeholder="e.g. Summer Sale Campaign"
          placeholderTextColor="#9ca3af"
          value={form.title}
          onChangeText={(v) => set('title', v)}
        />
      </Field>

      <Field label={`Headline (${form.headline.length}/90)`} required>
        <TextInput
          style={styles.input}
          placeholder="Short attention-grabbing line"
          placeholderTextColor="#9ca3af"
          value={form.headline}
          maxLength={90}
          onChangeText={(v) => set('headline', v)}
        />
      </Field>

      <Field label={`Description (${form.description.length}/200)`} required>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe your offer..."
          placeholderTextColor="#9ca3af"
          value={form.description}
          maxLength={200}
          multiline
          numberOfLines={3}
          onChangeText={(v) => set('description', v)}
        />
      </Field>

      <Field label="CTA Text">
        <View style={styles.chipRow}>
          {CTA_OPTIONS.map((cta) => (
            <TouchableOpacity
              key={cta}
              style={[styles.chip, form.ctaText === cta && styles.chipActive]}
              onPress={() => set('ctaText', cta)}
            >
              <Text style={[styles.chipText, form.ctaText === cta && styles.chipTextActive]}>
                {cta}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="CTA URL (optional)">
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor="#9ca3af"
          value={form.ctaUrl}
          onChangeText={(v) => set('ctaUrl', v)}
          autoCapitalize="none"
          keyboardType="url"
        />
      </Field>

      <Field label="Image URL" required>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor="#9ca3af"
          value={form.imageUrl}
          onChangeText={(v) => set('imageUrl', v)}
          autoCapitalize="none"
          keyboardType="url"
        />
      </Field>
    </>
  );

  const renderStep2 = () => (
    <>
      <Field label="Placement">
        {PLACEMENTS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.optionRow, form.placement === p.key && styles.optionRowActive]}
            onPress={() => set('placement', p.key)}
          >
            <View style={[styles.optionIcon, { backgroundColor: p.color + '22' }]}>
              <Ionicons name={p.icon} size={20} color={p.color} />
            </View>
            <Text
              style={[
                styles.optionLabel,
                form.placement === p.key && { color: '#7c3aed', fontWeight: '700' },
              ]}
            >
              {p.label}
            </Text>
            {form.placement === p.key && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#7c3aed"
                style={{ marginLeft: 'auto' }}
              />
            )}
          </TouchableOpacity>
        ))}
      </Field>

      <Field label="Target Segment">
        <View style={styles.chipRow}>
          {SEGMENTS.map((seg) => (
            <TouchableOpacity
              key={seg.key}
              style={[styles.chip, form.targetSegment === seg.key && styles.chipActive]}
              onPress={() => set('targetSegment', seg.key)}
            >
              <Ionicons
                name={seg.icon}
                size={13}
                color={form.targetSegment === seg.key ? '#fff' : '#6b7280'}
              />
              <Text
                style={[styles.chipText, form.targetSegment === seg.key && styles.chipTextActive]}
              >
                {seg.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Bid Type">
        <View style={styles.toggleRow}>
          {(['CPC', 'CPM'] as const).map((bt) => (
            <TouchableOpacity
              key={bt}
              style={[styles.toggleBtn, form.bidType === bt && styles.toggleBtnActive]}
              onPress={() => set('bidType', bt)}
            >
              <Text
                style={[styles.toggleBtnText, form.bidType === bt && styles.toggleBtnTextActive]}
              >
                {bt}
              </Text>
              <Text
                style={[
                  styles.toggleBtnSub,
                  form.bidType === bt && { color: 'rgba(255,255,255,0.8)' },
                ]}
              >
                {bt === 'CPC' ? 'Cost per Click' : 'Cost per 1K impressions'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>
    </>
  );

  const renderStep3 = () => (
    <>
      <Field label="Bid Amount (coins)" required>
        <TextInput
          style={styles.input}
          placeholder="e.g. 5"
          placeholderTextColor="#9ca3af"
          value={form.bidAmount}
          onChangeText={(v) => set('bidAmount', v)}
          keyboardType="numeric"
        />
      </Field>

      <Field label="Daily Budget (coins)" required>
        <TextInput
          style={styles.input}
          placeholder="e.g. 500"
          placeholderTextColor="#9ca3af"
          value={form.dailyBudget}
          onChangeText={(v) => set('dailyBudget', v)}
          keyboardType="numeric"
        />
      </Field>

      <Field label="Total Budget (coins)" required>
        <TextInput
          style={styles.input}
          placeholder="e.g. 5000"
          placeholderTextColor="#9ca3af"
          value={form.totalBudget}
          onChangeText={(v) => set('totalBudget', v)}
          keyboardType="numeric"
        />
      </Field>

      <Field label="Start Date (YYYY-MM-DD)" required>
        <TextInput
          style={styles.input}
          placeholder="2026-04-10"
          placeholderTextColor="#9ca3af"
          value={form.startDate}
          onChangeText={(v) => set('startDate', v)}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </Field>

      <Field label="End Date (optional, YYYY-MM-DD)">
        <TextInput
          style={styles.input}
          placeholder="2026-05-10"
          placeholderTextColor="#9ca3af"
          value={form.endDate}
          onChangeText={(v) => set('endDate', v)}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </Field>
    </>
  );

  const STEP_TITLES = ['Creative', 'Targeting & Placement', 'Budget & Schedule'];

  if (loadingExisting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Ad' : 'Create Ad'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress dots */}
      <View style={styles.progressRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.dot, i <= step && styles.dotActive, i < step && styles.dotDone]}
          />
        ))}
      </View>
      <Text style={styles.stepLabel}>
        Step {step + 1} of 3 — {STEP_TITLES[step]}
      </Text>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            {step === 0 && renderStep1()}
            {step === 1 && renderStep2()}
            {step === 2 && renderStep3()}
          </View>
        </ScrollView>

        {/* Footer buttons */}
        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity
              style={styles.backFooterBtn}
              onPress={handleBack}
              disabled={submitting}
            >
              <Ionicons name="arrow-back" size={16} color="#7c3aed" />
              <Text style={styles.backFooterBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < 2 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.finalBtns}>
              <TouchableOpacity
                style={[styles.draftBtn, submitting && styles.btnDisabled]}
                onPress={handleSaveDraft}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#7c3aed" />
                ) : (
                  <Text style={styles.draftBtnText}>Save as Draft</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.btnDisabled]}
                onPress={handleSubmitForReview}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={15} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit for Review</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  dotActive: { backgroundColor: '#7c3aed', width: 24, borderRadius: 4 },
  dotDone: { backgroundColor: '#c4b5fd', width: 8 },
  stepLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },

  scrollContent: { padding: 16, paddingBottom: 8 },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  field: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },

  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  chipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  optionRowActive: { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },

  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  toggleBtnText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  toggleBtnTextActive: { color: '#fff' },
  toggleBtnSub: { fontSize: 11, color: '#9ca3af', marginTop: 2, textAlign: 'center' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 10,
  },
  backFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  backFooterBtnText: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  finalBtns: { flex: 1, flexDirection: 'row', gap: 8 },
  draftBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBtnText: { color: '#7c3aed', fontSize: 14, fontWeight: '700' },
  submitBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
