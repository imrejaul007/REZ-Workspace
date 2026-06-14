import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';

interface PostPurchaseRule {
  _id: string;
  name: string;
  triggerType: 'unknown' | 'category' | 'product';
  triggerCategory?: string;
  delayDays: number;
  channel: 'push' | 'sms' | 'whatsapp';
  messageTitle: string;
  messageBody: string;
  includeDiscount: boolean;
  discountPercent?: number;
  isActive: boolean;
  totalSent: number;
}

const CHANNEL_ICONS: Record<string, string> = {
  push: 'notifications',
  sms: 'phone-portrait',
  whatsapp: 'logo-whatsapp',
};

const CHANNEL_COLORS: Record<string, string> = {
  push: '#7C3AED',
  sms: '#0284c7',
  whatsapp: '#25D366',
};

export default function PostPurchaseScreen() {
  const [rules, setRules] = useState<PostPurchaseRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState<PostPurchaseRule | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<'unknown' | 'category' | 'product'>('unknown');
  const [triggerCategory, setTriggerCategory] = useState('');
  const [delayDays, setDelayDays] = useState('3');
  const [channel, setChannel] = useState<'push' | 'sms' | 'whatsapp'>('push');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [includeDiscount, setIncludeDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('10');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<PostPurchaseRule[]>('merchant/post-purchase/rules');
      if (res.success && res.data) setRules(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setName('');
    setTriggerType('unknown');
    setTriggerCategory('');
    setDelayDays('3');
    setChannel('push');
    setMessageTitle('');
    setMessageBody('');
    setIncludeDiscount(false);
    setDiscountPercent('10');
    setEditRule(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (r: PostPurchaseRule) => {
    setEditRule(r);
    setName(r.name);
    setTriggerType(r.triggerType);
    setTriggerCategory(r.triggerCategory || '');
    setDelayDays(String(r.delayDays));
    setChannel(r.channel);
    setMessageTitle(r.messageTitle);
    setMessageBody(r.messageBody);
    setIncludeDiscount(r.includeDiscount);
    setDiscountPercent(String(r.discountPercent || 10));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Rule name is required');
    if (!messageTitle.trim() || !messageBody.trim())
      return Alert.alert('Error', 'Message title and body are required');
    if (!delayDays || Number(delayDays) < 1)
      return Alert.alert('Error', 'Delay must be at least 1 day');
    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        triggerType,
        triggerCategory: triggerType === 'category' ? triggerCategory.trim() : undefined,
        delayDays: Number(delayDays),
        channel,
        messageTitle: messageTitle.trim(),
        messageBody: messageBody.trim(),
        includeDiscount,
        discountPercent: includeDiscount ? Number(discountPercent) : undefined,
      };
      if (editRule) {
        await apiClient.put(`merchant/post-purchase/rules/${editRule._id}`, payload);
      } else {
        await apiClient.post('merchant/post-purchase/rules', payload);
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: PostPurchaseRule) => {
    try {
      await apiClient.patch(`merchant/post-purchase/rules/${rule._id}/toggle`, {});
      setRules((prev) =>
        prev.map((r) => (r._id === rule._id ? { ...r, isActive: !r.isActive } : r))
      );
    } catch {
      Alert.alert('Error', 'Failed to toggle rule');
    }
  };

  const deleteRule = (rule: PostPurchaseRule) => {
    Alert.alert('Delete Rule', `Delete "${rule.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`merchant/post-purchase/rules/${rule._id}`);
            setRules((prev) => prev.filter((r) => r._id !== rule._id));
          } catch {
            Alert.alert('Error', 'Failed to delete rule');
          }
        },
      },
    ]);
  };

  const renderRule = ({ item }: { item: PostPurchaseRule }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View
          style={[styles.channelBadge, { backgroundColor: CHANNEL_COLORS[item.channel] + '20' }]}
        >
          <Ionicons
            name={CHANNEL_ICONS[item.channel] as unknown as keyof typeof Ionicons.glyphMap}
            size={14}
            color={CHANNEL_COLORS[item.channel]}
          />
          <Text style={[styles.channelText, { color: CHANNEL_COLORS[item.channel] }]}>
            {item.channel.toUpperCase()}
          </Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: item.isActive ? '#ecfdf5' : '#f3f4f6' }]}
        >
          <Text style={[styles.statusText, { color: item.isActive ? '#059669' : '#6b7280' }]}>
            {item.isActive ? 'Active' : 'Paused'}
          </Text>
        </View>
      </View>

      <Text style={styles.ruleName}>{item.name}</Text>
      <Text style={styles.ruleMeta}>
        Sends {item.delayDays} day{item.delayDays !== 1 ? 's' : ''} after purchase
        {item.triggerType !== 'unknown' ? ` · ${item.triggerType}: ${item.triggerCategory}` : ''}
      </Text>

      <View style={styles.messagePreview}>
        <Text style={styles.msgTitle}>{item.messageTitle}</Text>
        <Text style={styles.msgBody} numberOfLines={2}>
          {item.messageBody}
        </Text>
        {item.includeDiscount && (
          <View style={styles.discountChip}>
            <Ionicons name="pricetag" size={12} color="#059669" />
            <Text style={styles.discountText}>{item.discountPercent}% discount included</Text>
          </View>
        )}
      </View>

      {item.totalSent > 0 && <Text style={styles.sentCount}>{item.totalSent} messages sent</Text>}

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
          <Ionicons name="pencil" size={16} color="#7C3AED" />
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleRule(item)}>
          <Ionicons
            name={item.isActive ? 'pause-circle' : 'play-circle'}
            size={16}
            color={item.isActive ? '#d97706' : '#059669'}
          />
          <Text style={[styles.actionBtnText, { color: item.isActive ? '#d97706' : '#059669' }]}>
            {item.isActive ? 'Pause' : 'Activate'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => deleteRule(item)}>
          <Ionicons name="trash" size={16} color="#ef4444" />
          <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Post-Purchase Rules</Text>
          <Text style={styles.headerSub}>Auto-engage customers after every sale</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createBtnText}>New Rule</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.light.primary} />
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(r) => r._id}
          renderItem={renderRule}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="repeat-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No rules yet</Text>
              <Text style={styles.emptyText}>
                Create follow-up rules to automatically re-engage customers after a purchase
              </Text>
              <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
                <Text style={styles.createBtnText}>Create First Rule</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editRule ? 'Edit Rule' : 'Create Rule'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
            <View>
              <Text style={styles.label}>Rule Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Haircut follow-up"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View>
              <Text style={styles.label}>Trigger</Text>
              <View style={styles.chipRow}>
                {(['unknown', 'category'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, triggerType === t && styles.chipActive]}
                    onPress={() => setTriggerType(t)}
                  >
                    <Text style={[styles.chipText, triggerType === t && styles.chipTextActive]}>
                      {t === 'unknown' ? 'Any purchase' : 'Category'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {triggerType === 'category' && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  value={triggerCategory}
                  onChangeText={setTriggerCategory}
                  placeholder="Category name (e.g. Hair)"
                  placeholderTextColor="#9ca3af"
                />
              )}
            </View>

            <View>
              <Text style={styles.label}>Send after (days) *</Text>
              <TextInput
                style={styles.input}
                value={delayDays}
                onChangeText={setDelayDays}
                keyboardType="number-pad"
                placeholder="3"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View>
              <Text style={styles.label}>Channel</Text>
              <View style={styles.chipRow}>
                {(['push', 'sms', 'whatsapp'] as const).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, channel === c && styles.chipActive]}
                    onPress={() => setChannel(c)}
                  >
                    <Ionicons
                      name={CHANNEL_ICONS[c] as unknown as keyof typeof Ionicons.glyphMap}
                      size={14}
                      color={channel === c ? '#fff' : '#6b7280'}
                    />
                    <Text style={[styles.chipText, channel === c && styles.chipTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={styles.label}>Message Title *</Text>
              <TextInput
                style={styles.input}
                value={messageTitle}
                onChangeText={setMessageTitle}
                placeholder="We miss you! 👋"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View>
              <Text style={styles.label}>Message Body *</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={messageBody}
                onChangeText={setMessageBody}
                placeholder="It's been a while — come back and enjoy exclusive offers..."
                placeholderTextColor="#9ca3af"
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIncludeDiscount(!includeDiscount)}
            >
              <View style={[styles.toggle, includeDiscount && styles.toggleActive]}>
                <View style={[styles.toggleThumb, includeDiscount && styles.toggleThumbActive]} />
              </View>
              <Text style={styles.toggleLabel}>Include discount code</Text>
            </TouchableOpacity>

            {includeDiscount && (
              <View>
                <Text style={styles.label}>Discount %</Text>
                <TextInput
                  style={styles.input}
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                  keyboardType="number-pad"
                  placeholder="10"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  headerSub: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 4,
  },
  createBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  channelText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  ruleName: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 3 },
  ruleMeta: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  messagePreview: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 3,
  },
  msgTitle: { fontSize: 13, fontWeight: '700', color: '#111' },
  msgBody: { fontSize: 12, color: '#6b7280', lineHeight: 17 },
  discountChip: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  discountText: { fontSize: 12, color: '#059669', fontWeight: '600' },
  sentCount: { fontSize: 11, color: '#9ca3af', marginBottom: 8 },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#7C3AED' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', maxWidth: 300 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  saveText: { fontSize: 16, fontWeight: '700', color: '#7C3AED' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fff',
  },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#e5e7eb', padding: 2 },
  toggleActive: { backgroundColor: '#7C3AED' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleThumbActive: { transform: [{ translateX: 20 }] },
  toggleLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
});
