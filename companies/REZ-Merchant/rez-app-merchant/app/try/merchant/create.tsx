/**
 * Create Trial Screen — Simplified
 * Single page with essential fields only:
 * - Title, Category, Original Price
 * - Coin Price (with AI suggestion)
 * - Commitment Fee, Daily Slots, QR Window
 * - Images (placeholder for now)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { platformAlert } from '@/utils/platformAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { trialsService, CreateTrialPayload, TrialImage } from '@/services/api/trials';
import { Colors } from '@/constants/Colors';
import AIPricingHelper from './components/AIPricingHelper';

const CATEGORIES = ['Service', 'Sample Pickup', 'Experience', 'D2C Kit'];

const QR_WINDOW_TYPES = [
  { label: '30 min (Quick Service)', value: '30min', minutes: 30 },
  { label: '2 hours (Pickup)', value: '2hours', minutes: 120 },
  { label: 'Fixed slot (Event)', value: 'Fixed', minutes: 1440 },
  { label: 'Auto (Delivery)', value: 'Auto', minutes: 86400 },
];

const COMMITMENT_FEES = [
  { label: '₹9 — Low barrier', value: 9 },
  { label: '₹19 — Standard', value: 19 },
  { label: '₹29 — Premium', value: 29 },
];

interface FormData {
  title: string;
  category: string;
  originalPrice: number | '';
  trialCoinPrice: number;
  commitmentFee: number;
  dailySlots: number;
  qrWindowType: string;
  qrWindowMinutes: number;
  images: TrialImage[];
  terms: string;
}

export default function CreateTrialScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showWindowPicker, setShowWindowPicker] = useState(false);
  const [showFeePicker, setShowFeePicker] = useState(false);

  const [form, setForm] = useState<FormData>({
    title: '',
    category: 'Service',
    originalPrice: '',
    trialCoinPrice: 30,
    commitmentFee: 19,
    dailySlots: 5,
    qrWindowType: '30min',
    qrWindowMinutes: 30,
    images: [],
    terms: '',
  });

  const updateForm = (field: keyof FormData, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    if (!form.title.trim()) {
      platformAlert('Validation', 'Please enter a trial title');
      return false;
    }
    if (!form.originalPrice || String(form.originalPrice) === '') {
      platformAlert('Validation', 'Please enter the original price');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: CreateTrialPayload = {
        title: form.title.trim(),
        category: form.category as 'Service' | 'Sample Pickup' | 'Experience' | 'D2C Kit',
        originalPrice: Number(form.originalPrice),
        trialCoinPrice: form.trialCoinPrice,
        commitmentFee: form.commitmentFee,
        dailySlots: form.dailySlots,
        qrWindowType: form.qrWindowType as 'Fixed' | '30min' | '2hours' | 'Auto',
        qrWindowMinutes: form.qrWindowMinutes,
        images: form.images,
        terms: form.terms,
        rewardCoins: 50, // Default reward
        brandedCoins: 0, // No branded coins by default
        brandedCoinLabel: '',
        upsellLinks: [],
      };

      const response = await trialsService.createTrial(payload);
      if (response.success) {
        platformAlert('Success', 'Trial created! Pending approval.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch {
      platformAlert('Error', 'Failed to create trial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedWindowType = QR_WINDOW_TYPES.find((t) => t.value === form.qrWindowType);
  const selectedFee = COMMITMENT_FEES.find((f) => f.value === form.commitmentFee);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#A78BFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Trial</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Trial Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Premium Haircut"
            value={form.title}
            onChangeText={(v) => updateForm('title', v.slice(0, 60))}
            placeholderTextColor={Colors.light.textMuted}
            maxLength={60}
          />
          <Text style={styles.charCount}>{form.title.length}/60</Text>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={styles.pickerText}>{form.category}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.light.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Original Price */}
        <View style={styles.field}>
          <Text style={styles.label}>Original Price (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 500"
            value={String(form.originalPrice)}
            onChangeText={(v) => updateForm('originalPrice', v ? parseInt(v) : '')}
            keyboardType="number-pad"
            placeholderTextColor={Colors.light.textMuted}
          />
        </View>

        {/* Coin Price with AI Helper */}
        <View style={styles.field}>
          <Text style={styles.label}>Trial Coin Price</Text>
          <AIPricingHelper
            category={form.category}
            originalPrice={Number(form.originalPrice)}
            onSuggestion={(price) => updateForm('trialCoinPrice', price)}
          />
          <View style={styles.coinInputRow}>
            <TouchableOpacity
              onPress={() =>
                updateForm('trialCoinPrice', Math.max(10, form.trialCoinPrice - 5))
              }
            >
              <Ionicons name="remove-circle" size={28} color="#8B5CF6" />
            </TouchableOpacity>
            <View style={styles.coinDisplay}>
              <Text style={styles.coinValue}>{form.trialCoinPrice}</Text>
              <Text style={styles.coinUnit}>Coins</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                updateForm('trialCoinPrice', Math.min(200, form.trialCoinPrice + 5))
              }
            >
              <Ionicons name="add-circle" size={28} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Commitment Fee */}
        <View style={styles.field}>
          <Text style={styles.label}>Commitment Fee</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowFeePicker(true)}
          >
            <Text style={styles.pickerText}>{selectedFee?.label}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.light.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Daily Slots */}
        <View style={styles.field}>
          <Text style={styles.label}>Daily Slots (1-50)</Text>
          <View style={styles.numberRow}>
            <TouchableOpacity
              onPress={() => updateForm('dailySlots', Math.max(1, form.dailySlots - 1))}
            >
              <Ionicons name="remove-circle" size={28} color="#8B5CF6" />
            </TouchableOpacity>
            <Text style={styles.numberValue}>{form.dailySlots}</Text>
            <TouchableOpacity
              onPress={() => updateForm('dailySlots', Math.min(50, form.dailySlots + 1))}
            >
              <Ionicons name="add-circle" size={28} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* QR Window Type */}
        <View style={styles.field}>
          <Text style={styles.label}>QR Scanning Window</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowWindowPicker(true)}
          >
            <Text style={styles.pickerText}>{selectedWindowType?.label}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.light.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Images Placeholder */}
        <View style={styles.field}>
          <Text style={styles.label}>Images (up to 5)</Text>
          <View style={styles.imageGrid}>
            {[...Array(Math.min(5, form.images.length + 1))].map((_, i) => (
              <View key={i} style={styles.imagePlaceholder}>
                <Ionicons
                  name={i < form.images.length ? 'image' : 'add'}
                  size={24}
                  color={Colors.light.textMuted}
                />
              </View>
            ))}
          </View>
          <Text style={styles.helperText}>Tap to add images (skipped for MVP)</Text>
        </View>

        {/* Terms (Optional) */}
        <View style={styles.field}>
          <Text style={styles.label}>Terms (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Valid once per customer..."
            value={form.terms}
            onChangeText={(v) => updateForm('terms', v)}
            placeholderTextColor={Colors.light.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Create Trial</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.pickerOption}
                onPress={() => {
                  updateForm('category', cat);
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{cat}</Text>
                {form.category === cat && (
                  <Ionicons name="checkmark" size={20} color="#8B5CF6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Window Type Picker Modal */}
      <Modal visible={showWindowPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowWindowPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>QR Window Type</Text>
            {QR_WINDOW_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={styles.pickerOption}
                onPress={() => {
                  updateForm('qrWindowType', type.value);
                  updateForm('qrWindowMinutes', type.minutes);
                  setShowWindowPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{type.label}</Text>
                {form.qrWindowType === type.value && (
                  <Ionicons name="checkmark" size={20} color="#8B5CF6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Commitment Fee Picker Modal */}
      <Modal visible={showFeePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowFeePicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Commitment Fee</Text>
            {COMMITMENT_FEES.map((fee) => (
              <TouchableOpacity
                key={fee.value}
                style={styles.pickerOption}
                onPress={() => {
                  updateForm('commitmentFee', fee.value);
                  setShowFeePicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{fee.label}</Text>
                {form.commitmentFee === fee.value && (
                  <Ionicons name="checkmark" size={20} color="#8B5CF6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 8,
  },
  charCount: {
    position: 'absolute',
    right: 8,
    top: 8,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.textHeading,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 14,
    color: Colors.light.textHeading,
  },
  helperText: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 6,
  },
  coinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  coinValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  coinUnit: {
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  numberValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.textHeading,
    minWidth: 50,
    textAlign: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  imagePlaceholder: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.light.card,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  pickerOptionText: {
    fontSize: 14,
    color: Colors.light.textHeading,
  },
});
