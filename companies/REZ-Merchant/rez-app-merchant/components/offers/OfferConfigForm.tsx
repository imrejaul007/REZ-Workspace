/**
 * OfferConfigForm — Step 2 of offer creation wizard
 * Pre-filled form with recommended settings from the selected goal.
 */
import React from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface OfferConfig {
  type: 'cashback' | 'discount' | 'voucher';
  value: number;
  minSpend: number;
  durationDays: number;
  budgetCap: number;
  title: string;
  description: string;
  /** Optional image URL displayed on the offer card. Falls back to placeholder if empty. */
  imageUrl?: string;
}

interface OfferConfigFormProps {
  config: OfferConfig;
  goalTitle: string;
  onChange: (field: keyof OfferConfig, value) => void;
}

function OfferConfigForm({ config, goalTitle, onChange }: OfferConfigFormProps) {
  const typeLabels: Record<string, string> = {
    cashback: 'Cashback %',
    discount: 'Discount %',
    voucher: 'Voucher Value (₹)',
  };

  return (
    <View style={styles.container}>
      <View style={styles.suggestionBanner}>
        <Ionicons name="bulb-outline" size={16} color="#7C3AED" />
        <Text style={styles.suggestionText}>
          Based on "{goalTitle}", we recommend {config.type} of {config.value}
          {config.type !== 'voucher' ? '%' : '₹'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Offer Details</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Offer Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Weekend Special 10% Cashback"
          value={config.title}
          onChangeText={(v) => onChange('title', v)}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
          placeholder="Short description of the offer"
          value={config.description}
          onChangeText={(v) => onChange('description', v)}
          multiline
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Offer Image URL (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com/image.jpg"
          value={config.imageUrl || ''}
          onChangeText={(v) => onChange('imageUrl', v)}
          autoCapitalize="none"
          keyboardType="url"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <Text style={styles.sectionTitle}>Reward Settings</Text>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>{typeLabels[config.type] || 'Value'}</Text>
          <TextInput
            style={styles.input}
            value={String(config.value)}
            onChangeText={(v) => onChange('value', parseInt(v) || 0)}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Min Spend (₹)</Text>
          <TextInput
            style={styles.input}
            value={String(config.minSpend)}
            onChangeText={(v) => onChange('minSpend', parseInt(v) || 0)}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Duration (days)</Text>
          <TextInput
            style={styles.input}
            value={String(config.durationDays)}
            onChangeText={(v) => onChange('durationDays', parseInt(v) || 1)}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Budget Cap (₹)</Text>
          <TextInput
            style={styles.input}
            value={String(config.budgetCap)}
            onChangeText={(v) => onChange('budgetCap', parseInt(v) || 0)}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  suggestionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  suggestionText: { fontSize: 12, color: '#7C3AED', fontWeight: '500', flex: 1 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    marginTop: 8,
  },
  field: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },
  row: { flexDirection: 'row', gap: 12 },
});

export default React.memo(OfferConfigForm);
