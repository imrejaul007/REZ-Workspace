/**
 * REZ Now Page Settings
 * Manage the public-facing now.rez.money/<slug> page for this store.
 * Controls: store type, operating hours override, social links,
 * compliance fields (FSSAI / GST), Google Place ID, VAPID push.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Clipboard,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/api/client';
import { Colors } from '@/constants/Colors';

// ─── Types ────────────────────────────────────────────────────────────────────

type StoreType = 'restaurant' | 'cafe' | 'bakery' | 'salon' | 'spa' | 'retail' | 'other';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface DayHours {
  open: string; // HH:MM
  close: string; // HH:MM
  closed: boolean;
}

type OperatingHours = Record<DayOfWeek, DayHours>;

interface RezNowConfig {
  slug: string;
  storeType: StoreType;
  fssaiNumber: string;
  gstNumber: string;
  googlePlaceId: string;
  instagramHandle: string;
  facebookUrl: string;
  twitterHandle: string;
  websiteUrl: string;
  acceptsOnlineOrders: boolean;
  acceptsScanPay: boolean;
  showLoyaltyStamps: boolean;
  deliveryEnabled: boolean;
  deliveryRadiusKm: number;
  deliveryFee: number;
  storeLatitude: string;
  storeLongitude: string;
  operatingHours: OperatingHours;
}

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const DEFAULT_DAY_HOURS: DayHours = { open: '09:00', close: '22:00', closed: false };

const DEFAULT_OPERATING_HOURS: OperatingHours = {
  monday: { ...DEFAULT_DAY_HOURS },
  tuesday: { ...DEFAULT_DAY_HOURS },
  wednesday: { ...DEFAULT_DAY_HOURS },
  thursday: { ...DEFAULT_DAY_HOURS },
  friday: { ...DEFAULT_DAY_HOURS },
  saturday: { ...DEFAULT_DAY_HOURS },
  sunday: { ...DEFAULT_DAY_HOURS },
};

const STORE_TYPES: { label: string; value: StoreType }[] = [
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Café', value: 'cafe' },
  { label: 'Bakery', value: 'bakery' },
  { label: 'Salon', value: 'salon' },
  { label: 'Spa', value: 'spa' },
  { label: 'Retail', value: 'retail' },
  { label: 'Other', value: 'other' },
];

const EMPTY: RezNowConfig = {
  slug: '',
  storeType: 'restaurant',
  fssaiNumber: '',
  gstNumber: '',
  googlePlaceId: '',
  instagramHandle: '',
  facebookUrl: '',
  twitterHandle: '',
  websiteUrl: '',
  acceptsOnlineOrders: true,
  acceptsScanPay: true,
  showLoyaltyStamps: true,
  deliveryEnabled: false,
  deliveryRadiusKm: 5,
  deliveryFee: 0,
  storeLatitude: '',
  storeLongitude: '',
  operatingHours: { ...DEFAULT_OPERATING_HOURS },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RezNowSettingsScreen() {
  const [config, setConfig] = useState<RezNowConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const publicUrl = config.slug ? `https://now.rez.money/${config.slug}` : '';

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get<
          RezNowConfig & { storeLatitude?: number; storeLongitude?: number }
        >('/merchant/rez-now-config');
        if (res.success && res.data) {
          const remote = res.data;
          // Merge remote operating hours with defaults so all 7 days are always present
          const mergedHours: OperatingHours = { ...DEFAULT_OPERATING_HOURS };
          if (remote.operatingHours) {
            for (const d of DAYS_OF_WEEK) {
              const remoteDay = (remote.operatingHours as Partial<OperatingHours>)[d.key];
              if (remoteDay) {
                mergedHours[d.key] = {
                  open: remoteDay.open ?? '09:00',
                  close: remoteDay.close ?? '22:00',
                  closed: remoteDay.closed === true,
                };
              }
            }
          }
          setConfig({
            ...EMPTY,
            ...remote,
            storeLatitude: remote.storeLatitude != null ? String(remote.storeLatitude) : '',
            storeLongitude: remote.storeLongitude != null ? String(remote.storeLongitude) : '',
            operatingHours: mergedHours,
          });
        }
      } catch {
        // Fail silently — user will see the empty form
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const latNum = parseFloat(config.storeLatitude);
      const lngNum = parseFloat(config.storeLongitude);
      const payload = {
        ...config,
        storeLatitude: isNaN(latNum) ? undefined : latNum,
        storeLongitude: isNaN(lngNum) ? undefined : lngNum,
      };
      await apiClient.patch('/merchant/rez-now-config', payload);
      Alert.alert('Saved', 'REZ Now page settings updated!');
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [config]);

  const set = <K extends keyof RezNowConfig>(key: K, value: RezNowConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ title: 'REZ Now Page' }} />
        <View style={styles.center}>
          <ActivityIndicator color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'REZ Now Page' }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Public URL */}
        {publicUrl ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Your Public Page</Text>
            <View style={styles.urlRow}>
              <Text style={styles.url} numberOfLines={1}>
                {publicUrl}
              </Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => {
                  Clipboard.setString(publicUrl);
                  Alert.alert('Copied!', publicUrl);
                }}
              >
                <Ionicons name="copy-outline" size={18} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Store Type */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Store Type</Text>
          <View style={styles.chips}>
            {STORE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.chip, config.storeType === t.value && styles.chipActive]}
                onPress={() => set('storeType', t.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.chipText, config.storeType === t.value && styles.chipTextActive]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Operating Hours */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Operating Hours</Text>
          {DAYS_OF_WEEK.map(({ key, label }) => {
            const day = config.operatingHours[key];
            return (
              <View key={key} style={styles.hoursRow}>
                <Text style={styles.hoursDay}>{label}</Text>
                <View style={styles.hoursRight}>
                  <Switch
                    value={day.closed}
                    onValueChange={(v) =>
                      setConfig((prev) => ({
                        ...prev,
                        operatingHours: {
                          ...prev.operatingHours,
                          [key]: { ...prev.operatingHours[key], closed: v },
                        },
                      }))
                    }
                    trackColor={{ false: Colors.light.border, true: Colors.light.error }}
                    thumbColor="#fff"
                  />
                  <Text style={styles.hoursClosedLabel}>{day.closed ? 'Closed' : 'Open'}</Text>
                  {!day.closed && (
                    <View style={styles.hoursTimeRow}>
                      <TextInput
                        style={styles.hoursTimeInput}
                        value={day.open}
                        onChangeText={(v) =>
                          setConfig((prev) => ({
                            ...prev,
                            operatingHours: {
                              ...prev.operatingHours,
                              [key]: { ...prev.operatingHours[key], open: v },
                            },
                          }))
                        }
                        placeholder="09:00"
                        placeholderTextColor={Colors.light.textSecondary}
                        maxLength={5}
                        keyboardType="numbers-and-punctuation"
                      />
                      <Text style={styles.hoursSeparator}>–</Text>
                      <TextInput
                        style={styles.hoursTimeInput}
                        value={day.close}
                        onChangeText={(v) =>
                          setConfig((prev) => ({
                            ...prev,
                            operatingHours: {
                              ...prev.operatingHours,
                              [key]: { ...prev.operatingHours[key], close: v },
                            },
                          }))
                        }
                        placeholder="22:00"
                        placeholderTextColor={Colors.light.textSecondary}
                        maxLength={5}
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Features</Text>
          {(
            [
              ['acceptsOnlineOrders', 'Online ordering (Order & Pay)'],
              ['acceptsScanPay', 'Scan & Pay'],
              ['showLoyaltyStamps', 'Loyalty stamps'],
            ] as [keyof RezNowConfig, string][]
          ).map(([key, label]) => (
            <View key={key} style={styles.switchRow}>
              <Text style={styles.switchLabel}>{label}</Text>
              <Switch
                value={config[key] as boolean}
                onValueChange={(v) => set(key, v as RezNowConfig[typeof key])}
                trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Delivery */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Delivery</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable delivery orders</Text>
            <Switch
              value={config.deliveryEnabled}
              onValueChange={(v) => set('deliveryEnabled', v)}
              trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              thumbColor="#fff"
            />
          </View>
          {config.deliveryEnabled && (
            <>
              <Text style={styles.fieldLabel}>Delivery radius (km)</Text>
              <TextInput
                style={styles.input}
                value={String(config.deliveryRadiusKm)}
                onChangeText={(v) => {
                  const n = parseFloat(v);
                  set('deliveryRadiusKm', isNaN(n) ? 0 : n);
                }}
                placeholder="5"
                placeholderTextColor={Colors.light.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.fieldLabel}>Delivery fee (₹)</Text>
              <TextInput
                style={styles.input}
                value={String(config.deliveryFee)}
                onChangeText={(v) => {
                  const n = parseFloat(v);
                  set('deliveryFee', isNaN(n) ? 0 : n);
                }}
                placeholder="0"
                placeholderTextColor={Colors.light.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.fieldLabel}>Store latitude</Text>
              <TextInput
                style={styles.input}
                value={config.storeLatitude}
                onChangeText={(v) => set('storeLatitude', v)}
                placeholder="e.g. 12.9716"
                placeholderTextColor={Colors.light.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.fieldLabel}>Store longitude</Text>
              <TextInput
                style={styles.input}
                value={config.storeLongitude}
                onChangeText={(v) => set('storeLongitude', v)}
                placeholder="e.g. 77.5946"
                placeholderTextColor={Colors.light.textSecondary}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                style={{ marginTop: 4 }}
                onPress={() => {
                  // React Native / Expo polyfills navigator.geolocation
                  const geo = typeof navigator !== 'undefined' ? navigator.geolocation : null;
                  if (!geo) {
                    Alert.alert('Error', 'Geolocation not available');
                    return;
                  }
                  geo.getCurrentPosition(
                    (pos: GeolocationPosition) => {
                      set('storeLatitude', String(pos.coords.latitude));
                      set('storeLongitude', String(pos.coords.longitude));
                    },
                    () => Alert.alert('Error', 'Could not get location'),
                    { timeout: 10000 }
                  );
                }}
              >
                <Text style={{ fontSize: 13, color: Colors.light.primary, fontWeight: '600' }}>
                  Use current location for store coordinates
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Compliance */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Compliance</Text>
          <Text style={styles.fieldLabel}>FSSAI Licence Number</Text>
          <TextInput
            style={styles.input}
            value={config.fssaiNumber}
            onChangeText={(v) => set('fssaiNumber', v)}
            placeholder="e.g. 12345678901234"
            placeholderTextColor={Colors.light.textSecondary}
            keyboardType="numeric"
            maxLength={14}
          />
          <Text style={styles.fieldLabel}>GST Number</Text>
          <TextInput
            style={styles.input}
            value={config.gstNumber}
            onChangeText={(v) => set('gstNumber', v.toUpperCase())}
            placeholder="e.g. 22AAAAA0000A1Z5"
            placeholderTextColor={Colors.light.textSecondary}
            autoCapitalize="characters"
            maxLength={15}
          />
        </View>

        {/* Social */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Social Links</Text>
          {(
            [
              ['instagramHandle', 'Instagram handle', '@yourstore'],
              ['twitterHandle', 'X (Twitter) handle', '@yourstore'],
              ['facebookUrl', 'Facebook page URL', 'https://facebook.com/yourstore'],
              ['websiteUrl', 'Website', 'https://yourstore.com'],
            ] as [keyof RezNowConfig, string, string][]
          ).map(([key, label, placeholder]) => (
            <React.Fragment key={key}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                value={config[key] as string}
                onChangeText={(v) => set(key, v as RezNowConfig[typeof key])}
                placeholder={placeholder}
                placeholderTextColor={Colors.light.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />
            </React.Fragment>
          ))}
        </View>

        {/* Google */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Google</Text>
          <Text style={styles.fieldLabel}>Google Place ID</Text>
          <TextInput
            style={styles.input}
            value={config.googlePlaceId}
            onChangeText={(v) => set('googlePlaceId', v)}
            placeholder="ChIJ... (from Google Maps)"
            placeholderTextColor={Colors.light.textSecondary}
            autoCapitalize="none"
          />
          <Text style={styles.hint}>Used to display Google reviews on your REZ Now page.</Text>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  urlRow: { flexDirection: 'row', alignItems: 'center' },
  url: { flex: 1, fontSize: 14, color: Colors.light.primary, fontWeight: '600' },
  copyBtn: { padding: 6, marginLeft: 8 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  chipActive: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primaryLight2 },
  chipText: { fontSize: 13, color: Colors.light.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.light.primary, fontWeight: '700' },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  switchLabel: { fontSize: 15, color: Colors.light.text },

  fieldLabel: { fontSize: 13, color: Colors.light.textSecondary, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
    marginBottom: 4,
  },
  hint: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 4 },

  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  hoursDay: { fontSize: 14, fontWeight: '600', color: Colors.light.text, width: 36 },
  hoursRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  hoursClosedLabel: { fontSize: 13, color: Colors.light.textSecondary, minWidth: 36 },
  hoursTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hoursTimeInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    fontSize: 13,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
    width: 60,
    textAlign: 'center',
  },
  hoursSeparator: { fontSize: 14, color: Colors.light.textSecondary },

  saveBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
