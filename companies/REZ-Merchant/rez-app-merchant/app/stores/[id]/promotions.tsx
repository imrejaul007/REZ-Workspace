/**
 * Promotions / Banner Management Screen
 *
 * Merchants can add, edit, reorder and delete promotional banners that appear
 * at the top of their web menu (PromoBanner component).
 *
 * Data is stored in Store.promotions[] and saved via PATCH /api/merchant/stores/:storeId
 */

import React, { useState, useEffect, useCallback } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storeService, StorePromotion } from '@/services/api/stores';
import { Colors } from '@/constants/Colors';

// ─── Colour palette presets ───────────────────────────────────────────────────
const COLOR_PRESETS = [
  '#1e3a5f',
  '#1a3a52',
  '#7C3AED',
  '#059669',
  '#DC2626',
  '#D97706',
  '#0891B2',
  '#BE185D',
  '#374151',
  '#000000',
];

// ─── Local draft type (adds a local-only `localId` for list keys) ─────────────
type PromoDraft = StorePromotion & { localId: string };

// FIX (R6): replaced Math.random() with CSPRNG uuidv4()
function makeLocalId() {
  return `local-${Date.now()}-${
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : uuidv4()
  }`;
}

function emptyDraft(): PromoDraft {
  return {
    localId: makeLocalId(),
    title: '',
    subtitle: '',
    image: null,
    backgroundColor: '#1e3a5f',
    actionText: '',
    actionUrl: '',
  };
}

// ─── Banner Preview ───────────────────────────────────────────────────────────
function BannerPreview({ promo }: { promo: PromoDraft }) {
  return (
    <View style={[previewStyles.card, { backgroundColor: promo.backgroundColor || '#1e3a5f' }]}>
      {promo.image ? (
        <Image source={{ uri: promo.image }} style={previewStyles.image} resizeMode="cover" />
      ) : (
        <View style={previewStyles.imagePlaceholder}>
          <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.4)" />
        </View>
      )}
      <View style={previewStyles.textBlock}>
        <Text style={previewStyles.title} numberOfLines={2}>
          {promo.title || 'Banner Title'}
        </Text>
        {promo.subtitle ? (
          <Text style={previewStyles.subtitle} numberOfLines={2}>
            {promo.subtitle}
          </Text>
        ) : null}
        {promo.actionText ? (
          <View style={previewStyles.actionBtn}>
            <Text style={previewStyles.actionBtnText}>{promo.actionText}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Promotion Edit Card ──────────────────────────────────────────────────────
interface PromoCardProps {
  promo: PromoDraft;
  index: number;
  total: number;
  onChange: (localId: string, field: keyof StorePromotion, value: string | null) => void;
  onDelete: (localId: string) => void;
  onMoveUp: (localId: string) => void;
  onMoveDown: (localId: string) => void;
  isExpanded: boolean;
  onToggleExpand: (localId: string) => void;
}

function PromoCard({
  promo,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isExpanded,
  onToggleExpand,
}: PromoCardProps) {
  return (
    <View style={cardStyles.container}>
      {/* Card header — always visible */}
      <TouchableOpacity
        style={cardStyles.header}
        onPress={() => onToggleExpand(promo.localId)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} banner ${index + 1}: ${promo.title || 'Untitled'}`}
      >
        <View style={cardStyles.headerLeft}>
          <View
            style={[cardStyles.colorDot, { backgroundColor: promo.backgroundColor || '#1e3a5f' }]}
          />
          <Text style={cardStyles.headerTitle} numberOfLines={1}>
            {promo.title || `Banner ${index + 1}`}
          </Text>
        </View>
        <View style={cardStyles.headerActions}>
          {index > 0 && (
            <TouchableOpacity
              onPress={() => onMoveUp(promo.localId)}
              style={cardStyles.iconBtn}
              accessibilityLabel="Move banner up"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-up" size={18} color={Colors.light.primary} />
            </TouchableOpacity>
          )}
          {index < total - 1 && (
            <TouchableOpacity
              onPress={() => onMoveDown(promo.localId)}
              style={cardStyles.iconBtn}
              accessibilityLabel="Move banner down"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-down" size={18} color={Colors.light.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => onDelete(promo.localId)}
            style={cardStyles.iconBtn}
            accessibilityLabel="Delete banner"
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={18} color={Colors.light.danger} />
          </TouchableOpacity>
          <Ionicons
            name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={18}
            color={Colors.light.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded edit form */}
      {isExpanded && (
        <View style={cardStyles.body}>
          {/* Preview */}
          <BannerPreview promo={promo} />

          {/* Title */}
          <Text style={cardStyles.label}>Title *</Text>
          <TextInput
            style={cardStyles.input}
            value={promo.title}
            onChangeText={(v) => onChange(promo.localId, 'title', v)}
            placeholder="e.g. Weekend Special"
            placeholderTextColor={Colors.light.textMuted}
            maxLength={100}
            accessibilityLabel="Banner title"
          />

          {/* Subtitle */}
          <Text style={cardStyles.label}>Subtitle</Text>
          <TextInput
            style={cardStyles.input}
            value={promo.subtitle ?? ''}
            onChangeText={(v) => onChange(promo.localId, 'subtitle', v)}
            placeholder="Short description"
            placeholderTextColor={Colors.light.textMuted}
            maxLength={200}
            accessibilityLabel="Banner subtitle"
          />

          {/* Image URL */}
          <Text style={cardStyles.label}>Image URL</Text>
          <TextInput
            style={cardStyles.input}
            value={promo.image ?? ''}
            onChangeText={(v) => onChange(promo.localId, 'image', v || null)}
            placeholder="https://…"
            placeholderTextColor={Colors.light.textMuted}
            autoCapitalize="none"
            keyboardType="url"
            accessibilityLabel="Banner image URL"
          />

          {/* Background colour */}
          <Text style={cardStyles.label}>Background Colour</Text>
          <View style={cardStyles.colorRow}>
            {COLOR_PRESETS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  cardStyles.colorSwatch,
                  { backgroundColor: c },
                  promo.backgroundColor === c && cardStyles.colorSwatchSelected,
                ]}
                onPress={() => onChange(promo.localId, 'backgroundColor', c)}
                accessibilityLabel={`Select colour ${c}`}
                accessibilityRole="button"
              />
            ))}
          </View>
          <TextInput
            style={[cardStyles.input, { marginTop: 6 }]}
            value={promo.backgroundColor ?? '#1e3a5f'}
            onChangeText={(v) => onChange(promo.localId, 'backgroundColor', v)}
            placeholder="#1e3a5f"
            placeholderTextColor={Colors.light.textMuted}
            autoCapitalize="none"
            maxLength={9}
            accessibilityLabel="Banner background colour hex code"
          />

          {/* Action text */}
          <Text style={cardStyles.label}>Button Text</Text>
          <TextInput
            style={cardStyles.input}
            value={promo.actionText ?? ''}
            onChangeText={(v) => onChange(promo.localId, 'actionText', v)}
            placeholder="e.g. Order Now"
            placeholderTextColor={Colors.light.textMuted}
            maxLength={40}
            accessibilityLabel="Banner button text"
          />

          {/* Action URL */}
          <Text style={cardStyles.label}>Button URL</Text>
          <TextInput
            style={cardStyles.input}
            value={promo.actionUrl ?? ''}
            onChangeText={(v) => onChange(promo.localId, 'actionUrl', v)}
            placeholder="https://… (optional)"
            placeholderTextColor={Colors.light.textMuted}
            autoCapitalize="none"
            keyboardType="url"
            accessibilityLabel="Banner button URL"
          />
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PromotionsScreen() {
  const router = useRouter();
  const { id: storeId } = useLocalSearchParams<{ id: string }>();

  const [drafts, setDrafts] = useState<PromoDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');

  // ── Load existing promotions ──────────────────────────────────────────────
  const loadStore = useCallback(
    async (isRefresh = false) => {
      if (!storeId) return;
      try {
        isRefresh ? setRefreshing(true) : setLoading(true);
        const store = await storeService.getStoreById(storeId);
        setStoreName(store.name);
        const existing: PromoDraft[] = (store.promotions ?? []).map((p) => ({
          ...p,
          localId: p._id ?? makeLocalId(),
        }));
        setDrafts(existing);
      } catch (err) {
        Alert.alert('Error', err.message || 'Failed to load store');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [storeId]
  );

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  // ── CRUD helpers ─────────────────────────────────────────────────────────
  const addBanner = () => {
    const draft = emptyDraft();
    setDrafts((prev) => [...prev, draft]);
    setExpandedId(draft.localId);
  };

  const handleChange = (localId: string, field: keyof StorePromotion, value: string | null) => {
    setDrafts((prev) => prev.map((d) => (d.localId === localId ? { ...d, [field]: value } : d)));
  };

  const handleDelete = (localId: string) => {
    Alert.alert('Delete Banner', 'Are you sure you want to delete this promotional banner?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setDrafts((prev) => prev.filter((d) => d.localId !== localId)),
      },
    ]);
  };

  const handleMoveUp = (localId: string) => {
    setDrafts((prev) => {
      const idx = prev.findIndex((d) => d.localId === localId);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const handleMoveDown = (localId: string) => {
    setDrafts((prev) => {
      const idx = prev.findIndex((d) => d.localId === localId);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const toggleExpand = (localId: string) => {
    setExpandedId((prev) => (prev === localId ? null : localId));
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    // Validate: every draft must have a non-empty title
    const invalid = drafts.find((d) => !d.title.trim());
    if (invalid) {
      Alert.alert('Validation Error', 'Every banner must have a title.');
      setExpandedId(invalid.localId);
      return;
    }

    try {
      setSaving(true);
      const payload: StorePromotion[] = drafts.map(({ localId, ...rest }) => rest);
      await storeService.patchStore(storeId as string, { promotions: payload });
      Alert.alert('Saved', 'Promotional banners updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save banners');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading promotions…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Promotions</Text>
            {storeName ? <Text style={styles.headerSubtitle}>{storeName}</Text> : null}
          </View>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            accessibilityLabel="Save promotions"
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info bar */}
        <View style={styles.infoBar}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.light.primary} />
          <Text style={styles.infoText}>
            These banners appear at the top of your web menu for customers. Add up to 5.
          </Text>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadStore(true)} />
          }
        >
          {drafts.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={52} color={Colors.light.textMuted} />
              <Text style={styles.emptyTitle}>No Banners Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add promotional banners to highlight special offers, new items, or seasonal deals on
                your web menu.
              </Text>
            </View>
          )}

          {drafts.map((promo, index) => (
            <PromoCard
              key={promo.localId}
              promo={promo}
              index={index}
              total={drafts.length}
              onChange={handleChange}
              onDelete={handleDelete}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isExpanded={expandedId === promo.localId}
              onToggleExpand={toggleExpand}
            />
          ))}

          {/* Add Banner button */}
          {drafts.length < 5 && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={addBanner}
              accessibilityLabel="Add new promotional banner"
              accessibilityRole="button"
            >
              <Ionicons name="add-circle-outline" size={22} color={Colors.light.primary} />
              <Text style={styles.addBtnText}>Add Banner</Text>
            </TouchableOpacity>
          )}

          {drafts.length >= 5 && <Text style={styles.maxNote}>Maximum 5 banners reached.</Text>}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.light.textSecondary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  headerSubtitle: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 1 },
  saveBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  infoBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  infoText: { flex: 1, fontSize: 12, color: '#1D4ED8', lineHeight: 18 },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },

  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text, marginTop: 16 },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderStyle: 'dashed',
    marginTop: 12,
    backgroundColor: '#F0F9FF',
  },
  addBtnText: { fontSize: 15, fontWeight: '600', color: Colors.light.primary },
  maxNote: { textAlign: 'center', fontSize: 12, color: Colors.light.textMuted, marginTop: 12 },
});

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  headerTitle: { fontSize: 14, fontWeight: '600', color: Colors.light.text, flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 6 },

  body: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: '#FAFAFA',
  },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#7C3AED',
    transform: [{ scale: 1.15 }],
  },
});

const previewStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    minHeight: 90,
  },
  image: {
    width: 100,
    height: 90,
  },
  imagePlaceholder: {
    width: 100,
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, paddingHorizontal: 14, paddingVertical: 10 },
  title: { fontSize: 15, fontWeight: '800', color: '#fff', lineHeight: 20 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4, lineHeight: 16 },
  actionBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  actionBtnText: { fontSize: 11, color: '#fff', fontWeight: '700' },
});
