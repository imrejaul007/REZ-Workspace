// OfferCreator Component
// Create and manage merchant offers, deals, and promotions

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useMerchant } from '../contexts/MerchantContext';
import { createOffer, Offer } from '../services/merchant.service';

interface OfferCreatorProps {
  onOfferCreated?: (offer: Offer) => void;
  onCancel?: () => void;
}

type OfferType = 'percentage' | 'fixed' | 'bogo' | 'bundle' | 'loyalty';
type TargetAudience = 'all' | 'new' | 'returning' | 'vip';

const OFFER_TYPES: Array<{ type: OfferType; icon: string; label: string; description: string }> = [
  { type: 'percentage', icon: '💰', label: 'Percentage Off', description: 'Discount as % of order' },
  { type: 'fixed', icon: '🎟️', label: 'Fixed Amount', description: 'Flat discount on order' },
  { type: 'bogo', icon: '买一送一', label: 'Buy 1 Get 1', description: 'Free item on purchase' },
  { type: 'bundle', icon: '📦', label: 'Bundle Deal', description: 'Discount on combo' },
  { type: 'loyalty', icon: '⭐', label: 'Loyalty Reward', description: 'Points or rewards' },
];

const AUDIENCE_OPTIONS: Array<{ value: TargetAudience; label: string; description: string }> = [
  { value: 'all', label: 'Everyone', description: 'All customers' },
  { value: 'new', label: 'New Customers', description: 'First-time buyers' },
  { value: 'returning', label: 'Returning', description: 'Past customers' },
  { value: 'vip', label: 'VIP Only', description: 'Premium customers' },
];

const VALIDITY_OPTIONS = [
  { days: 7, label: '1 Week' },
  { days: 14, label: '2 Weeks' },
  { days: 30, label: '1 Month' },
  { days: 90, label: '3 Months' },
  { days: 365, label: '1 Year' },
];

export function OfferCreator({ onOfferCreated, onCancel }: OfferCreatorProps): React.JSX.Element {
  const { merchant } = useMerchant();
  const [creating, setCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [offerType, setOfferType] = useState<OfferType>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('all');
  const [validityDays, setValidityDays] = useState(30);
  const [usageLimit, setUsageLimit] = useState('');
  const [terms, setTerms] = useState('');

  const merchantId = merchant?.id || 'demo-merchant';

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter an offer title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter an offer description');
      return false;
    }
    if (offerType !== 'bogo' && offerType !== 'bundle') {
      if (!discountValue || parseFloat(discountValue) <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid discount value');
        return false;
      }
      if (offerType === 'percentage' && parseFloat(discountValue) > 100) {
        Alert.alert('Validation Error', 'Percentage discount cannot exceed 100%');
        return false;
      }
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setCreating(true);
    try {
      const offerData: Partial<Offer> = {
        title: title.trim(),
        description: description.trim(),
        type: offerType,
        value: offerType === 'bogo' || offerType === 'bundle' ? 100 : parseFloat(discountValue),
        minPurchase: minPurchase ? parseFloat(minPurchase) : undefined,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
        targetAudience,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : undefined,
        terms: terms.trim() || undefined,
      };

      const newOffer = await createOffer(merchantId, offerData);
      onOfferCreated?.(newOffer);
    } catch (error) {
      Alert.alert('Error', 'Failed to create offer. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getPreviewText = (): string => {
    if (offerType === 'bogo') {
      return 'Buy 1 Get 1 Free';
    }
    if (offerType === 'bundle') {
      return 'Special Bundle Deal';
    }
    if (offerType === 'percentage') {
      return `${discountValue || '0'}% OFF`;
    }
    if (offerType === 'fixed') {
      return `₹${discountValue || '0'} OFF`;
    }
    return 'Loyalty Reward';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create New Offer</Text>
          <Text style={styles.headerSubtitle}>Attract more customers with special deals</Text>
        </View>

        {/* Offer Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offer Type</Text>
          <View style={styles.typeGrid}>
            {OFFER_TYPES.map(item => (
              <TouchableOpacity
                key={item.type}
                style={[
                  styles.typeCard,
                  offerType === item.type && styles.typeCardSelected,
                ]}
                onPress={() => setOfferType(item.type)}
              >
                <Text style={styles.typeIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    offerType === item.type && styles.typeLabelSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Offer Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Summer Special - 20% Off"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
            <Text style={styles.charCount}>{title.length}/50</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your offer..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.charCount}>{description.length}/200</Text>
          </View>
        </View>

        {/* Discount Value */}
        {offerType !== 'bogo' && offerType !== 'bundle' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discount Value</Text>

            <View style={styles.discountInputRow}>
              {offerType === 'percentage' && (
                <View style={styles.discountInputWrapper}>
                  <TextInput
                    style={styles.discountInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Text style={styles.discountSuffix}>%</Text>
                </View>
              )}
              {offerType === 'fixed' && (
                <View style={styles.discountInputWrapper}>
                  <Text style={styles.discountPrefix}>₹</Text>
                  <TextInput
                    style={styles.discountInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              )}
              {offerType === 'loyalty' && (
                <View style={styles.discountInputWrapper}>
                  <TextInput
                    style={styles.discountInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <Text style={styles.discountSuffix}>pts</Text>
                </View>
              )}
            </View>

            {/* Conditions */}
            <View style={styles.conditionsRow}>
              <View style={styles.conditionInput}>
                <Text style={styles.inputLabel}>Min. Purchase (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={minPurchase}
                  onChangeText={setMinPurchase}
                  keyboardType="numeric"
                />
              </View>
              {offerType === 'percentage' && (
                <View style={styles.conditionInput}>
                  <Text style={styles.inputLabel}>Max Discount (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="No limit"
                    placeholderTextColor="#9CA3AF"
                    value={maxDiscount}
                    onChangeText={setMaxDiscount}
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Target Audience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Audience</Text>
          <View style={styles.audienceGrid}>
            {AUDIENCE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.audienceCard,
                  targetAudience === option.value && styles.audienceCardSelected,
                ]}
                onPress={() => setTargetAudience(option.value)}
              >
                <Text
                  style={[
                    styles.audienceLabel,
                    targetAudience === option.value && styles.audienceLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.audienceDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Validity Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Validity Period</Text>
          <View style={styles.validityGrid}>
            {VALIDITY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.days}
                style={[
                  styles.validityOption,
                  validityDays === option.days && styles.validityOptionSelected,
                ]}
                onPress={() => setValidityDays(option.days)}
              >
                <Text
                  style={[
                    styles.validityLabel,
                    validityDays === option.days && styles.validityLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.validityNote}>
            Offer will expire on{' '}
            {new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>

        {/* Usage Limit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Limits (Optional)</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Redemption Limit</Text>
            <TextInput
              style={styles.input}
              placeholder="Unlimited"
              placeholderTextColor="#9CA3AF"
              value={usageLimit}
              onChangeText={setUsageLimit}
              keyboardType="numeric"
            />
            <Text style={styles.inputHint}>Leave empty for unlimited redemptions</Text>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions (Optional)</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add unknown terms or conditions..."
              placeholderTextColor="#9CA3AF"
              value={terms}
              onChangeText={setTerms}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{terms.length}/500</Text>
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>{getPreviewText()}</Text>
            </View>
            <Text style={styles.previewTitle}>{title || 'Your Offer Title'}</Text>
            <Text style={styles.previewDescription}>
              {description || 'Your offer description will appear here'}
            </Text>
            <View style={styles.previewFooter}>
              <Text style={styles.previewAudience}>
                {AUDIENCE_OPTIONS.find(a => a.value === targetAudience)?.label}
              </Text>
              <Text style={styles.previewValidity}>
                Valid for {VALIDITY_OPTIONS.find(v => v.days === validityDays)?.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.createButton, creating && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.createButtonText}>Create Offer</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#6366F1',
    fontWeight: '600',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  discountInputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  discountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  discountPrefix: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 4,
  },
  discountSuffix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  discountInput: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    paddingVertical: 14,
    minWidth: 100,
    textAlign: 'center',
  },
  conditionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionInput: {
    flex: 1,
  },
  audienceGrid: {
    gap: 10,
  },
  audienceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  audienceCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  audienceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  audienceLabelSelected: {
    color: '#6366F1',
  },
  audienceDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  validityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  validityOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  validityOptionSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  validityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  validityLabelSelected: {
    color: '#FFFFFF',
  },
  validityNote: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  previewBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  previewBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  previewDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  previewAudience: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '500',
  },
  previewValidity: {
    fontSize: 13,
    color: '#6B7280',
  },
  bottomPadding: {
    height: 100,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OfferCreator;
