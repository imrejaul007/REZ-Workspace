/**
 * MerchantCustomerPush
 * Phase 3.2 — Merchant-Driven Growth
 *
 * Merchant can compose and send a push notification to their loyal REZ
 * customers (3+ visits). Includes:
 * - Template options: Special offer / New item / Double cashback
 * - Custom message composer
 * - Preview before sending
 * - Enforced limit: 2 pushes per week per merchant
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import { apiClient } from '@/services/api/client';
import { platformAlertSimple } from '@/utils/platformAlert';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------
type TemplateId = 'special_offer' | 'new_item' | 'double_cashback' | 'custom';

interface PushTemplate {
  id: TemplateId;
  label: string;
  icon: string;
  color: string;
  defaultMessage: string;
}

const PUSH_TEMPLATES: PushTemplate[] = [
  {
    id: 'special_offer',
    label: 'Special Offer',
    icon: 'pricetag',
    color: '#7c3aed',
    defaultMessage:
      'Exclusive offer for our loyal customers! Come in today and save extra with REZ.',
  },
  {
    id: 'new_item',
    label: 'New Item',
    icon: 'sparkles',
    color: '#0ea5e9',
    defaultMessage:
      'We just added something new to our menu! Come check it out and earn REZ coins.',
  },
  {
    id: 'double_cashback',
    label: 'Double Cashback',
    icon: 'cash',
    color: '#10b981',
    defaultMessage: 'Double cashback day! Earn 2x REZ coins on every purchase today only.',
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: 'create',
    color: '#f59e0b',
    defaultMessage: '',
  },
];

interface PushStatus {
  sentThisWeek: number;
  weeklyLimit: number;
  canSend: boolean;
  nextAvailableAt?: string;
  recipientCount: number; // loyal customers who will receive it
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
async function fetchPushStatus(storeId: string): Promise<PushStatus> {
  const res = await apiClient.get(`/merchant/growth/push-status?storeId=${storeId}`);
  return res.data?.data ?? res.data;
}

async function sendCustomerPush(payload: {
  storeId: string;
  message: string;
  template: TemplateId;
}): Promise<{ success: boolean; recipientCount: number }> {
  const res = await apiClient.post('/merchant/growth/push', payload);
  return res.data?.data ?? res.data;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function MerchantCustomerPush() {
  const { activeStore } = useStore();
  const queryClient = useQueryClient();
  const storeId = activeStore?._id;
  const storeName = activeStore?.name ?? 'Your Store';

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('special_offer');
  const [message, setMessage] = useState(PUSH_TEMPLATES[0].defaultMessage);
  const [showPreview, setShowPreview] = useState(false);

  const { data: pushStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['push-status', storeId],
    queryFn: () => fetchPushStatus(storeId!),
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000,
  });

  const sendMutation = useMutation({
    mutationFn: (payload: { storeId: string; message: string; template: TemplateId }) =>
      sendCustomerPush(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['push-status', storeId] });
      setShowPreview(false);
      platformAlertSimple(
        'Push Sent!',
        `Your message was delivered to ${data.recipientCount} loyal customers.`
      );
    },
    onError: (err) => {
      platformAlertSimple(
        'Send Failed',
        err?.response?.data?.message ?? err?.message ?? 'Could not send notification'
      );
    },
  });

  const handleTemplateSelect = useCallback((tmpl: PushTemplate) => {
    setSelectedTemplate(tmpl.id);
    if (tmpl.id !== 'custom') {
      setMessage(tmpl.defaultMessage);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (!storeId) return;
    if (!message.trim()) {
      platformAlertSimple('Message Required', 'Please enter a message before sending.');
      return;
    }
    if (message.trim().length > 200) {
      platformAlertSimple('Too Long', 'Message must be 200 characters or fewer.');
      return;
    }
    if (!pushStatus?.canSend) {
      platformAlertSimple(
        'Weekly Limit Reached',
        `You can send ${pushStatus?.weeklyLimit ?? 2} pushes per week. Try again next week.`
      );
      return;
    }
    setShowPreview(true);
  }, [storeId, message, pushStatus]);

  const handleConfirmSend = useCallback(() => {
    if (!storeId) return;
    sendMutation.mutate({ storeId, message: message.trim(), template: selectedTemplate });
  }, [storeId, message, selectedTemplate, sendMutation]);

  const activeTemplateData = PUSH_TEMPLATES.find((t) => t.id === selectedTemplate)!;
  const remainingPushes = pushStatus ? pushStatus.weeklyLimit - pushStatus.sentThisWeek : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#7c3aed', '#a78bfa']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(dashboard)'))}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Message Loyal Customers</ThemedText>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Weekly limit status */}
        {statusLoading ? (
          <ActivityIndicator style={{ marginVertical: 16 }} color={Colors.light.primary} />
        ) : (
          <View
            style={[
              styles.limitBanner,
              { backgroundColor: pushStatus?.canSend ? '#f0fdf4' : '#fef2f2' },
            ]}
          >
            <Ionicons
              name={pushStatus?.canSend ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={pushStatus?.canSend ? '#16a34a' : '#dc2626'}
            />
            <ThemedText
              style={[styles.limitText, { color: pushStatus?.canSend ? '#15803d' : '#dc2626' }]}
            >
              {pushStatus?.canSend
                ? `${remainingPushes} push${remainingPushes !== 1 ? 'es' : ''} left this week • ${pushStatus.recipientCount} loyal customers`
                : `Weekly limit reached (${pushStatus?.weeklyLimit ?? 2}/week)`}
            </ThemedText>
          </View>
        )}

        {/* Template picker */}
        <ThemedText style={styles.sectionLabel}>Choose a Template</ThemedText>
        <View style={styles.templateGrid}>
          {PUSH_TEMPLATES.map((tmpl) => (
            <TouchableOpacity
              key={tmpl.id}
              style={[
                styles.templateCard,
                selectedTemplate === tmpl.id && {
                  borderColor: tmpl.color,
                  borderWidth: 2,
                },
              ]}
              onPress={() => handleTemplateSelect(tmpl)}
              accessibilityLabel={`Select ${tmpl.label} template`}
            >
              <View style={[styles.templateIconCircle, { backgroundColor: `${tmpl.color}20` }]}>
                <Ionicons name={tmpl.icon as unknown as keyof typeof Ionicons.glyphMap} size={22} color={tmpl.color} />
              </View>
              <ThemedText
                style={[
                  styles.templateLabel,
                  selectedTemplate === tmpl.id && { color: tmpl.color },
                ]}
              >
                {tmpl.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message composer */}
        <ThemedText style={styles.sectionLabel}>Your Message</ThemedText>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            placeholder={
              selectedTemplate === 'custom'
                ? 'Write a personal message to your loyal customers...'
                : 'Customize your message...'
            }
            maxLength={200}
            accessibilityLabel="Push notification message"
          />
          <ThemedText style={styles.charCount}>{message.length}/200</ThemedText>
        </View>

        {/* Audience note */}
        <View style={styles.audienceNote}>
          <Ionicons name="people-circle" size={18} color="#7c3aed" />
          <ThemedText style={styles.audienceText}>
            This will be sent to{' '}
            <ThemedText style={styles.audienceBold}>
              {pushStatus?.recipientCount ?? '—'} customers
            </ThemedText>{' '}
            who visited {storeName} 3+ times via REZ
          </ThemedText>
        </View>

        {/* Preview button */}
        <TouchableOpacity
          style={[
            styles.previewBtn,
            { opacity: !pushStatus?.canSend || !message.trim() ? 0.5 : 1 },
          ]}
          onPress={handleSend}
          disabled={!pushStatus?.canSend || !message.trim() || sendMutation.isPending}
          accessibilityLabel="Preview and send push notification"
        >
          <LinearGradient
            colors={['#7c3aed', '#a78bfa']}
            style={styles.previewGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="eye" size={20} color="#fff" />
            <Text style={styles.previewBtnText}>Preview & Send</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Preview Modal */}
      {showPreview && (
        <View style={styles.previewOverlay}>
          <View style={styles.previewModal}>
            <ThemedText style={styles.previewModalTitle}>Preview Notification</ThemedText>

            {/* Simulated phone notification */}
            <View style={styles.notifSimulator}>
              <View style={styles.notifHeader}>
                <View style={styles.notifAppIcon}>
                  <ThemedText style={styles.notifAppIconText}>R</ThemedText>
                </View>
                <ThemedText style={styles.notifAppName}>REZ App</ThemedText>
                <ThemedText style={styles.notifTime}>now</ThemedText>
              </View>
              <ThemedText style={styles.notifTitle}>{storeName}</ThemedText>
              <ThemedText style={styles.notifBody} numberOfLines={3}>
                {message}
              </ThemedText>
            </View>

            <ThemedText style={styles.previewRecipient}>
              Will be sent to {pushStatus?.recipientCount ?? 0} loyal customers
            </ThemedText>

            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPreview(false)}>
                <ThemedText style={styles.cancelBtnText}>Edit</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { opacity: sendMutation.isPending ? 0.7 : 1 }]}
                onPress={handleConfirmSend}
                disabled={sendMutation.isPending}
              >
                {sendMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.confirmBtnText}>Send Now</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  content: { padding: 16 },

  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  limitText: { flex: 1, fontSize: 13, fontWeight: '500' },

  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  templateCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1.5,
    borderColor: Colors.light.backgroundSecondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  templateIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  templateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },

  inputContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageInput: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: Colors.light.textMuted,
    textAlign: 'right',
    marginTop: 6,
  },

  audienceNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  audienceText: { flex: 1, fontSize: 13, color: '#6d28d9', lineHeight: 18 },
  audienceBold: { fontWeight: '700' },

  previewBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  previewGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  previewBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Preview modal
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  previewModal: {
    backgroundColor: Colors.light.background,
    borderRadius: 24,
    padding: 24,
  },
  previewModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 16,
  },
  notifSimulator: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  notifAppIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifAppIconText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  notifAppName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#475569' },
  notifTime: { fontSize: 11, color: '#94a3b8' },
  notifTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  notifBody: { fontSize: 13, color: '#475569', lineHeight: 18 },
  previewRecipient: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
