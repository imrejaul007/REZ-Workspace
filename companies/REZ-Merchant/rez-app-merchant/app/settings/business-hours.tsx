import React, { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { platformAlertSimple } from '@/utils/platformAlert';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

type BusinessHours = Record<DayKey, DayHours>;

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const DEFAULT_HOURS: BusinessHours = {
  mon: { open: '09:00', close: '18:00', closed: false },
  tue: { open: '09:00', close: '18:00', closed: false },
  wed: { open: '09:00', close: '18:00', closed: false },
  thu: { open: '09:00', close: '18:00', closed: false },
  fri: { open: '09:00', close: '18:00', closed: false },
  sat: { open: '10:00', close: '16:00', closed: false },
  sun: { open: '10:00', close: '14:00', closed: true },
};

/** Validates HH:MM format */
function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

/** Returns true when closeTime is strictly after openTime (HH:MM strings) */
function isCloseAfterOpen(open: string, close: string): boolean {
  if (!isValidTime(open) || !isValidTime(close)) return true; // skip check if malformed
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  return ch * 60 + cm > oh * 60 + om;
}

function TimeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <TextInput
      style={[timeStyles.input, disabled && timeStyles.inputDisabled]}
      value={value}
      onChangeText={onChange}
      placeholder="HH:MM"
      placeholderTextColor={Colors.light.textSecondary}
      editable={!disabled}
      maxLength={5}
      keyboardType="numbers-and-punctuation"
    />
  );
}

const timeStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
    width: 72,
    textAlign: 'center',
  },
  inputDisabled: {
    opacity: 0.4,
  },
});

export default function BusinessHoursScreen() {
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchHours = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<unknown>('merchant/store-profile');
      const payload = res.data ?? res;
      const oh: Partial<BusinessHours> = payload?.openingHours ?? {};

      setHours((prev) => {
        const merged = { ...prev };
        (Object.keys(oh) as DayKey[]).forEach((key) => {
          if (oh[key]) {
            merged[key] = {
              open: oh[key]!.open ?? prev[key].open,
              close: oh[key]!.close ?? prev[key].close,
              closed: oh[key]!.closed ?? prev[key].closed,
            };
          }
        });
        return merged;
      });
    } catch (err) {
      logger.error('[BusinessHours] fetch error:', err);
      // keep defaults on error
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHours();
  }, [fetchHours]);

  const updateDay = (key: DayKey, field: keyof DayHours, value: string | boolean) => {
    setHours((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const copyMonFri = () => {
    const monHours = hours.mon;
    setHours((prev) => ({
      ...prev,
      tue: { ...monHours },
      wed: { ...monHours },
      thu: { ...monHours },
      fri: { ...monHours },
    }));
  };

  const handleSave = async () => {
    // Validate times for non-closed days
    for (const { key, label } of DAYS) {
      const day = hours[key];
      if (!day.closed) {
        if (!isValidTime(day.open) || !isValidTime(day.close)) {
          platformAlertSimple('Invalid Time', `${label}: Please enter times in HH:MM format.`);
          return;
        }
        if (!isCloseAfterOpen(day.open, day.close)) {
          platformAlertSimple('Invalid Time', `${label}: Close time must be after open time.`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      await apiClient.patch('merchant/store-profile', { openingHours: hours });
      platformAlertSimple('Saved', 'Business hours updated successfully.');
    } catch (err) {
      logger.error('[BusinessHours] save error:', err);
      platformAlertSimple('Error', err.message || 'Failed to save business hours.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Business Hours</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading hours...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Business Hours</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Copy convenience */}
        <TouchableOpacity style={styles.copyBtn} onPress={copyMonFri} activeOpacity={0.7}>
          <Ionicons name="copy-outline" size={16} color={Colors.light.primary} />
          <Text style={styles.copyBtnText}>Copy Mon hours to Tue–Fri</Text>
        </TouchableOpacity>

        {/* Column header */}
        <View style={styles.columnHeader}>
          <Text style={[styles.colLabel, { flex: 1 }]}>Day</Text>
          <Text style={[styles.colLabel, { width: 60, textAlign: 'center' }]}>Closed</Text>
          <Text style={[styles.colLabel, { width: 72, textAlign: 'center' }]}>Open</Text>
          <View style={{ width: 12 }} />
          <Text style={[styles.colLabel, { width: 72, textAlign: 'center' }]}>Close</Text>
        </View>

        {/* Day Rows */}
        <View style={styles.daysCard}>
          {DAYS.map(({ key, label }, idx) => {
            const day = hours[key];
            const isLast = idx === DAYS.length - 1;
            return (
              <View key={key} style={[styles.dayRow, isLast && styles.dayRowLast]}>
                <Text style={styles.dayLabel}>{label}</Text>

                {/* Closed Toggle */}
                <View style={styles.closedToggle}>
                  <Switch
                    value={day.closed}
                    onValueChange={(v) => updateDay(key, 'closed', v)}
                    trackColor={{ false: Colors.light.border, true: '#FCA5A5' }}
                    thumbColor={day.closed ? '#DC2626' : '#fff'}
                    style={Platform.OS === 'android' ? { transform: [{ scale: 0.85 }] } : {}}
                  />
                </View>

                {/* Open Time */}
                <TimeInput
                  value={day.open}
                  onChange={(v) => updateDay(key, 'open', v)}
                  disabled={day.closed}
                />

                <Text style={styles.timeSep}>–</Text>

                {/* Close Time */}
                <TimeInput
                  value={day.close}
                  onChange={(v) => updateDay(key, 'close', v)}
                  disabled={day.closed}
                />
              </View>
            );
          })}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Hours</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.textHeading },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  loadingText: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 8 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.primaryLight2,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  copyBtnText: { fontSize: 13, fontWeight: '600', color: Colors.light.primary },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  daysCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    gap: 4,
  },
  dayRowLast: { borderBottomWidth: 0 },
  dayLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  closedToggle: {
    width: 60,
    alignItems: 'center',
  },
  timeSep: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    width: 12,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
