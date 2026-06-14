/**
 * RezNowSteps.tsx
 * Individual step components for the REZ Now setup wizard.
 * Styles live in rezNowStyles.ts to stay under the 500-line per-file limit.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Animated,
  Alert,
  Linking,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { styles } from './rezNowStyles';
import { logger } from '@/utils/logger';

// ─── Exported Types ───────────────────────────────────────────────────────────

export type StoreType = 'restaurant' | 'cafe' | 'bakery' | 'salon' | 'spa' | 'retail' | 'other';
export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export const STORE_TYPES: { label: string; value: StoreType }[] = [
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Cafe', value: 'cafe' },
  { label: 'Bakery', value: 'bakery' },
  { label: 'Salon', value: 'salon' },
  { label: 'Spa', value: 'spa' },
  { label: 'Retail', value: 'retail' },
  { label: 'Other', value: 'other' },
];

// ─── Progress Dots ────────────────────────────────────────────────────────────

export function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i < current ? styles.dotFilled : styles.dotEmpty]} />
      ))}
    </View>
  );
}

// ─── Step 1: Set Your Store URL ───────────────────────────────────────────────

interface Step1Props {
  slug: string;
  slugStatus: SlugStatus;
  onSlugChange: (v: string) => void;
  onNext: () => void;
}

export function Step1({ slug, slugStatus, onSlugChange, onNext }: Step1Props) {
  const canNext = slugStatus === 'available';

  const statusColor =
    slugStatus === 'available'
      ? Colors.light.success
      : slugStatus === 'taken' || slugStatus === 'invalid'
        ? Colors.light.danger
        : Colors.light.textSecondary;

  const statusText =
    slugStatus === 'available'
      ? `${slug} is available`
      : slugStatus === 'taken'
        ? `${slug} is already taken`
        : slugStatus === 'invalid'
          ? 'Use 3-30 lowercase letters, numbers, or hyphens'
          : slugStatus === 'checking'
            ? 'Checking availability...'
            : '';

  return (
    <View style={styles.stepContainer}>
      <Ionicons
        name="link-outline"
        size={36}
        color={Colors.light.primary}
        style={styles.stepIcon}
      />
      <Text style={styles.stepTitle}>Set Your Store URL</Text>
      <Text style={styles.stepSubtitle}>
        Choose a short, memorable URL for your public REZ Now page.
      </Text>

      <View style={styles.slugInputRow}>
        <Text style={styles.slugPrefix}>now.rez.money/</Text>
        <TextInput
          style={styles.slugInput}
          value={slug}
          onChangeText={onSlugChange}
          placeholder="yourstore"
          placeholderTextColor={Colors.light.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
        />
        {slugStatus === 'checking' && (
          <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginLeft: 8 }} />
        )}
        {slugStatus === 'available' && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={Colors.light.success}
            style={{ marginLeft: 6 }}
          />
        )}
        {(slugStatus === 'taken' || slugStatus === 'invalid') && (
          <Ionicons
            name="close-circle"
            size={22}
            color={Colors.light.danger}
            style={{ marginLeft: 6 }}
          />
        )}
      </View>

      {statusText.length > 0 && (
        <Text style={[styles.slugStatus, { color: statusColor }]}>{statusText}</Text>
      )}

      {slug.length > 0 && slugStatus !== 'invalid' && (
        <Text style={styles.previewUrl}>Your store will be at: now.rez.money/{slug}</Text>
      )}

      <TouchableOpacity
        style={[styles.nextBtnSingle, !canNext && styles.nextBtnDisabled]}
        onPress={onNext}
        disabled={!canNext}
        activeOpacity={0.8}
      >
        <Text style={styles.nextBtnText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 2: Store Type ───────────────────────────────────────────────────────

interface Step2Props {
  storeType: StoreType;
  onChange: (v: StoreType) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2({ storeType, onChange, onNext, onBack }: Step2Props) {
  return (
    <View style={styles.stepContainer}>
      <Ionicons
        name="storefront-outline"
        size={36}
        color={Colors.light.primary}
        style={styles.stepIcon}
      />
      <Text style={styles.stepTitle}>What type of store are you?</Text>
      <Text style={styles.stepSubtitle}>This helps us tailor your REZ Now page.</Text>

      <View style={styles.chips}>
        {STORE_TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.chip, storeType === t.value && styles.chipActive]}
            onPress={() => onChange(t.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, storeType === t.value && styles.chipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={Colors.light.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.8}>
          <Text style={styles.nextBtnText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step 3: Features ─────────────────────────────────────────────────────────

interface Step3Props {
  onlineOrdering: boolean;
  scanPay: boolean;
  loyaltyStamps: boolean;
  onToggle: (key: 'onlineOrdering' | 'scanPay' | 'loyaltyStamps', value: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3({
  onlineOrdering,
  scanPay,
  loyaltyStamps,
  onToggle,
  onNext,
  onBack,
}: Step3Props) {
  const rows: {
    key: 'onlineOrdering' | 'scanPay' | 'loyaltyStamps';
    label: string;
    icon: string;
  }[] = [
    { key: 'onlineOrdering', label: 'Online Ordering', icon: 'bag-handle-outline' },
    { key: 'scanPay', label: 'Scan & Pay', icon: 'qr-code-outline' },
    { key: 'loyaltyStamps', label: 'Loyalty Stamps', icon: 'star-outline' },
  ];
  const values = { onlineOrdering, scanPay, loyaltyStamps };

  return (
    <View style={styles.stepContainer}>
      <Ionicons
        name="toggle-outline"
        size={36}
        color={Colors.light.primary}
        style={styles.stepIcon}
      />
      <Text style={styles.stepTitle}>Turn on features</Text>
      <Text style={styles.stepSubtitle}>You can change these at unknown time from Settings.</Text>

      <View style={styles.card}>
        {rows.map(({ key, label, icon }, idx) => (
          <View
            key={key}
            style={[styles.toggleRow, idx < rows.length - 1 && styles.toggleRowBorder]}
          >
            <View style={styles.toggleRowLeft}>
              <Ionicons
                name={icon as unknown}
                size={22}
                color={Colors.light.primary}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.toggleLabel}>{label}</Text>
            </View>
            <Switch
              value={values[key]}
              onValueChange={(v) => onToggle(key, v)}
              trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={Colors.light.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => {
            if (__DEV__) logger.log('[DEBUG Step3] Next pressed, calling onNext');
            onNext();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step 4: First Menu Item ──────────────────────────────────────────────────

interface Step4Props {
  categoryName: string;
  itemName: string;
  itemPrice: string;
  onFieldChange: (key: 'categoryName' | 'itemName' | 'itemPrice', value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  saving: boolean;
}

export function Step4({
  categoryName,
  itemName,
  itemPrice,
  onFieldChange,
  onNext,
  onBack,
  onSkip,
  saving,
}: Step4Props) {
  return (
    <View style={styles.stepContainer}>
      <Ionicons
        name="restaurant-outline"
        size={36}
        color={Colors.light.primary}
        style={styles.stepIcon}
      />
      <Text style={styles.stepTitle}>Add your first menu item</Text>
      <Text style={styles.stepSubtitle}>Give customers something to order right away.</Text>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Category name</Text>
        <TextInput
          style={styles.input}
          value={categoryName}
          onChangeText={(v) => onFieldChange('categoryName', v)}
          placeholder="e.g. Starters"
          placeholderTextColor={Colors.light.textMuted}
        />
        <Text style={styles.fieldLabel}>Item name</Text>
        <TextInput
          style={styles.input}
          value={itemName}
          onChangeText={(v) => onFieldChange('itemName', v)}
          placeholder="e.g. Paneer Tikka"
          placeholderTextColor={Colors.light.textMuted}
        />
        <Text style={styles.fieldLabel}>Price (in rupees)</Text>
        <TextInput
          style={styles.input}
          value={itemPrice}
          onChangeText={(v) => onFieldChange('itemPrice', v)}
          placeholder="e.g. 250"
          placeholderTextColor={Colors.light.textMuted}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={Colors.light.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, saving && styles.nextBtnDisabled]}
          onPress={() => {
            if (__DEV__) logger.log('[DEBUG Step4] Next pressed', { saving });
            onNext();
          }}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.nextBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.skipLink} onPress={onSkip} activeOpacity={0.7}>
        <Text style={styles.skipLinkText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 5: All Set ──────────────────────────────────────────────────────────

interface Step5Props {
  slug: string;
  onGoToDashboard: () => void;
}

export function Step5({ slug, onGoToDashboard }: Step5Props) {
  const publicUrl = `https://now.rez.money/${slug}`;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handleCopy = () => {
    Clipboard.setString(publicUrl);
    Alert.alert('Copied!', publicUrl);
  };

  const handleOpen = () => {
    Linking.openURL(publicUrl).catch(() => Alert.alert('Could not open browser', publicUrl));
  };

  return (
    <View style={styles.stepContainer}>
      <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="checkmark" size={48} color="#fff" />
      </Animated.View>

      <Text style={styles.allSetTitle}>You're all set!</Text>
      <Text style={styles.allSetSubtitle}>Your REZ Now page is ready to go live.</Text>

      <TouchableOpacity style={styles.urlCard} onPress={handleCopy} activeOpacity={0.8}>
        <Text style={styles.urlText} numberOfLines={1}>
          {publicUrl}
        </Text>
        <Ionicons name="copy-outline" size={18} color={Colors.light.primary} />
      </TouchableOpacity>
      <Text style={styles.tapToCopy}>Tap to copy</Text>

      <TouchableOpacity style={styles.openBtn} onPress={handleOpen} activeOpacity={0.8}>
        <Ionicons name="open-outline" size={18} color={Colors.light.primary} />
        <Text style={styles.openBtnText}>Open my page</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.nextBtnSingle} onPress={onGoToDashboard} activeOpacity={0.8}>
        <Text style={styles.nextBtnText}>Go to Dashboard</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
