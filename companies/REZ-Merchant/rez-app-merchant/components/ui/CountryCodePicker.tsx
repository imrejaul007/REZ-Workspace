/**
 * CountryCodePicker — compact country dialing-code selector.
 *
 * Shows a bottom modal with a searchable list of common country codes.
 * Designed to replace hardcoded +91 in the merchant registration flow.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface Country {
  code: string; // e.g. "IN"
  dial: string; // e.g. "+91"
  name: string; // e.g. "India"
  flag: string; // emoji flag
}

// Common countries covering the primary markets
export const COUNTRIES: Country[] = [
  { code: 'IN', dial: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'AE', dial: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'US', dial: '+1', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', dial: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'SG', dial: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AU', dial: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', dial: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'SA', dial: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'QA', dial: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: 'KW', dial: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'BH', dial: '+973', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'OM', dial: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: 'NZ', dial: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'ZA', dial: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: 'DE', dial: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', dial: '+33', name: 'France', flag: '🇫🇷' },
  { code: 'MY', dial: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'LK', dial: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'PK', dial: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'BD', dial: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'NP', dial: '+977', name: 'Nepal', flag: '🇳🇵' },
];

interface CountryCodePickerProps {
  value: Country;
  onChange: (country: Country) => void;
  style?: object;
}

export function CountryCodePicker({ value, onChange, style }: CountryCodePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, style]}
        onPress={() => setOpen(true)}
        accessibilityLabel={`Country code: ${value.dial} ${value.name}`}
        accessibilityRole="button"
      >
        <Text style={styles.flag}>{value.flag}</Text>
        <Text style={styles.dial}>{value.dial}</Text>
        <Ionicons name="chevron-down" size={12} color="#888" />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Country Code</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.search}
            placeholder="Search country..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.row, item.code === value.code && styles.rowSelected]}
                onPress={() => {
                  onChange(item);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <Text style={styles.rowFlag}>{item.flag}</Text>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowDial}>{item.dial}</Text>
                {item.code === value.code && (
                  <Ionicons name="checkmark" size={16} color="#4F46E5" />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 4,
  },
  flag: { fontSize: 18 },
  dial: { fontSize: 14, fontWeight: '600', color: '#111', marginRight: 2 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    ...Platform.select({
      android: { elevation: 20 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  search: {
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    color: '#111',
    backgroundColor: '#F9FAFB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#F3F4F6',
    gap: 10,
  },
  rowSelected: { backgroundColor: '#EEF2FF' },
  rowFlag: { fontSize: 22, width: 32 },
  rowName: { flex: 1, fontSize: 15, color: '#111' },
  rowDial: { fontSize: 14, color: '#6B7280', marginRight: 6 },
});
