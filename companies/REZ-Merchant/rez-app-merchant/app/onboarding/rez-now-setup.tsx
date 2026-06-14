/**
 * REZ Now Setup Wizard
 * Guides a logged-in merchant (who has no slug yet) through setting up their
 * now.rez.money public page. Launched automatically from the dashboard when
 * activeStore.slug is empty.
 *
 * Steps:
 *   1 — Set Your Store URL  (slug + availability check)
 *   2 — What type of store are you?  (store-type chips)
 *   3 — Turn on features  (toggles)
 *   4 — Add your first menu item  (only when online ordering is on)
 *   5 — You're all set!  (animated confirm + deep-link)
 *
 * Step sub-components live in: components/onboarding/RezNowSteps.tsx
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';
import { Colors } from '@/constants/Colors';
import {
  ProgressDots,
  Step1,
  Step2,
  Step3,
  Step4,
  Step5,
} from '@/components/onboarding/RezNowSteps';
import type { StoreType, SlugStatus } from '@/components/onboarding/RezNowSteps';
import { logger } from '@/utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardState {
  slug: string;
  storeType: StoreType;
  onlineOrdering: boolean;
  scanPay: boolean;
  loyaltyStamps: boolean;
  categoryName: string;
  itemName: string;
  itemPrice: string;
}

const TOTAL_STEPS = 5;
const SLUG_REGEX = /^[a-z0-9-]+$/;

// ─── Wizard ───────────────────────────────────────────────────────────────────

export default function RezNowSetupScreen() {
  const router = useRouter();
  const { activeStore, setActiveStoreSlug } = useStore();

  // Debug: log every step change
  const [step, setStep] = useState(1);
  useEffect(() => {
    if (__DEV__) logger.log('[DEBUG RezNowSetupScreen] step changed to:', step);
  }, [step]);
  const [saving, setSaving] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<WizardState>({
    slug: '',
    storeType: 'restaurant',
    onlineOrdering: true,
    scanPay: true,
    loyaltyStamps: true,
    categoryName: '',
    itemName: '',
    itemPrice: '',
  });

  const set = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Slug availability check — debounced 500 ms ──────────────────────────────
  const handleSlugChange = useCallback(
    (raw: string) => {
      const v = raw.toLowerCase();
      set('slug', v);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (v.length === 0) {
        setSlugStatus('idle');
        return;
      }
      if (v.length < 3 || v.length > 30 || !SLUG_REGEX.test(v)) {
        setSlugStatus('invalid');
        return;
      }

      setSlugStatus('checking');

      debounceRef.current = setTimeout(async () => {
        try {
          const res = await apiClient.get<{ available: boolean }>(
            `/web-ordering/check-slug/${encodeURIComponent(v)}`
          );
          setSlugStatus(res.data?.available ? 'available' : 'taken');
        } catch {
          setSlugStatus('idle');
        }
      }, 500);
    },
    [set]
  );

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  // ── Persist config when leaving step 3 ─────────────────────────────────────
  const saveConfig = useCallback(async (): Promise<boolean> => {
    if (!activeStore?._id) {
      if (__DEV__) logger.log('[DEBUG saveConfig] ❌ No activeStore._id');
      return false;
    }
    setSaving(true);
    if (__DEV__) logger.log('[DEBUG saveConfig] Making API call with slug:', state.slug);
    try {
      const res = await apiClient.patch<{ success: boolean; data: { slug: string } }>(
        '/merchant/rez-now-config',
        {
          slug: state.slug,
          storeType: state.storeType,
          acceptsOnlineOrders: state.onlineOrdering,
          acceptsScanPay: state.scanPay,
          showLoyaltyStamps: state.loyaltyStamps,
        }
      );
      logger.info('[DEBUG saveConfig] API call succeeded, slug:', res.data?.data?.slug);
      // Persist slug into StoreContext AND local storage so re-login doesn't lose it.
      // (stores/active doesn't return slug, so we can't rely on API reload.)
      const savedSlug = res.data?.data?.slug || state.slug;
      if (savedSlug) {
        await setActiveStoreSlug(savedSlug);
        if (__DEV__) logger.info('[DEBUG saveConfig] setActiveStoreSlug succeeded');
      }
      return true;
    } catch (err) {
      if (__DEV__) logger.error(`[DEBUG saveConfig] API call failed: ${String(err)}`);
      Alert.alert('Error', 'Could not save settings. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [activeStore, state, setActiveStoreSlug]);

  const handleStep3Next = useCallback(async () => {
    if (__DEV__) logger.info(`[DEBUG handleStep3Next] activeStore: ${activeStore?._id}, slug: ${activeStore?.slug}, state.slug: ${state.slug}, state.storeType: ${state.storeType}`);
    if (!activeStore?._id) {
      if (__DEV__) logger.info('[DEBUG handleStep3Next] activeStore._id is missing!');
      Alert.alert(
        'Store not loaded',
        'Your store data could not be loaded. Please check that the backend is running and try again.',
        [{ text: 'OK' }]
      );
      return;
    }
    if (__DEV__) logger.info('[DEBUG handleStep3Next] calling saveConfig...');
    const ok = await saveConfig();
    if (!ok) {
      if (__DEV__) logger.info('[DEBUG handleStep3Next] saveConfig returned false');
      return;
    }
    logger.info('[DEBUG handleStep3Next] saveConfig OK, setting step to', state.onlineOrdering ? 4 : 5);
    // Skip step 4 (menu item) if online ordering is off
    const nextStep = state.onlineOrdering ? 4 : 5;
    logger.info(`[DEBUG handleStep3Next] calling setStep(${nextStep})`);
    setStep(nextStep);
    logger.info('[DEBUG handleStep3Next] setStep called, should re-render with step', nextStep);
  }, [saveConfig, state.onlineOrdering, activeStore]);

  // ── Save first menu item (best-effort) and advance ──────────────────────────
  const handleStep4Next = useCallback(async () => {
    logger.info('[DEBUG handleStep4Next] pressed, hasData fields:', { categoryName: state.categoryName.trim() || '(empty)', itemName: state.itemName.trim() || '(empty)', itemPrice: state.itemPrice.trim() || '(empty)' });
    const hasData = state.categoryName.trim() && state.itemName.trim() && state.itemPrice.trim();

    if (hasData) {
      if (__DEV__) logger.info('[DEBUG handleStep4Next] hasData=true, calling menu API...');
      setSaving(true);
      try {
        await apiClient.patch('/merchant/menu', {
          categoryName: state.categoryName.trim(),
          itemName: state.itemName.trim(),
          itemPrice: parseFloat(state.itemPrice),
        });
        if (__DEV__) logger.info('[DEBUG handleStep4Next] menu API succeeded');
      } catch (err) {
        if (__DEV__) logger.error('[DEBUG handleStep4Next] menu API failed (non-blocking):', err);
        // Show warning but DO NOT return — always navigate forward.
        Alert.alert(
          'Menu item not saved',
          'Could not add the menu item now. You can add it later from Products.',
          [{ text: 'OK' }]
        );
      }
      setSaving(false);
    } else {
      if (__DEV__) logger.info('[DEBUG handleStep4Next] hasData=false, skipping API, calling goNext directly');
    }

    // Always advance — menu save is best-effort and non-blocking.
    if (__DEV__) logger.info('[DEBUG handleStep4Next] calling goNext()');
    goNext();
  }, [state, goNext]);

  const handleGoToDashboard = useCallback(() => {
    router.replace('/(dashboard)');
  }, [router]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (saving && step !== 4) {
    // Full-screen spinner only when saving between step 3 and 4/5
    return (
      <SafeAreaView style={screenStyles.container} edges={['top', 'bottom']}>
        <View style={screenStyles.center}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ProgressDots current={step} total={TOTAL_STEPS} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={screenStyles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <Step1
              slug={state.slug}
              slugStatus={slugStatus}
              onSlugChange={handleSlugChange}
              onNext={goNext}
            />
          )}
          {step === 2 && (
            <Step2
              storeType={state.storeType}
              onChange={(v) => set('storeType', v)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <Step3
              onlineOrdering={state.onlineOrdering}
              scanPay={state.scanPay}
              loyaltyStamps={state.loyaltyStamps}
              onToggle={(key, value) => set(key, value)}
              onNext={handleStep3Next}
              onBack={goBack}
            />
          )}
          {step === 4 && (
            <Step4
              categoryName={state.categoryName}
              itemName={state.itemName}
              itemPrice={state.itemPrice}
              onFieldChange={(key, value) => set(key, value)}
              onNext={handleStep4Next}
              onBack={goBack}
              onSkip={goNext}
              saving={saving}
            />
          )}
          {step === 5 && <Step5 slug={state.slug} onGoToDashboard={handleGoToDashboard} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Screen-level styles ──────────────────────────────────────────────────────

const screenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  scroll: { padding: 24, paddingBottom: 48, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
