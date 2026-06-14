/**
 * QR Generator screen — per-table QR codes + store-level Scan & Pay QR.
 *
 * Store QR:  https://now.rez.money/{slug}
 * Table QR:  https://now.rez.money/{slug}?table={n}
 *
 * Accessible via:  More > Business Tools > QR Code  (route: /qr-generator)
 * Hidden tab registered in (dashboard)/_layout.tsx with href: null.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  Platform,
  StatusBar,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/contexts/StoreContext';
import { QRCodeCard } from '@/components/QRCodeCard';
import { Colors } from '@/constants/Colors';

const REZ_NOW_BASE = 'https://now.rez.money';
const MIN_TABLES = 1;
const MAX_TABLES = 50;
const DEFAULT_TABLES = 4;

export default function QRGeneratorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();

  const [tableCount, setTableCount] = useState<number>(DEFAULT_TABLES);
  const [tableInputText, setTableInputText] = useState<string>(String(DEFAULT_TABLES));

  const slug = activeStore?.slug ?? null;

  const storeUrl = slug ? `${REZ_NOW_BASE}/${slug}` : null;

  const tableNumbers = Array.from({ length: tableCount }, (_, i) => i + 1);

  const handleTableInputChange = useCallback((text: string) => {
    setTableInputText(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.min(MAX_TABLES, Math.max(MIN_TABLES, parsed));
      setTableCount(clamped);
    }
  }, []);

  const handleTableInputBlur = useCallback(() => {
    // Snap the displayed text to the clamped value on blur
    setTableInputText(String(tableCount));
  }, [tableCount]);

  const handleDecrement = useCallback(() => {
    setTableCount((prev) => {
      const next = Math.max(MIN_TABLES, prev - 1);
      setTableInputText(String(next));
      return next;
    });
  }, []);

  const handleIncrement = useCallback(() => {
    setTableCount((prev) => {
      const next = Math.min(MAX_TABLES, prev + 1);
      setTableInputText(String(next));
      return next;
    });
  }, []);

  const handleShareAll = useCallback(async () => {
    if (!storeUrl) return;
    const lines = [
      `${activeStore?.name ?? 'Store'} — REZ Now QR codes`,
      `Store (Scan & Pay): ${storeUrl}`,
      '',
      ...tableNumbers.map((n) => `Table ${n}: ${storeUrl}?table=${n}`),
    ];
    try {
      await Share.share({
        message: lines.join('\n'),
        title: `${activeStore?.name ?? 'Store'} — REZ Now QR codes`,
      });
    } catch {
      // User cancelled — no-op
    }
  }, [storeUrl, tableNumbers, activeStore?.name]);

  // ── No slug guard ──────────────────────────────────────────────────────────
  if (!slug) {
    return (
      <View style={styles.emptyRoot}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#7C3AED', '#6366F1']}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Codes</Text>
          <View style={{ width: 38 }} />
        </LinearGradient>
        <View style={styles.emptyBody}>
          <Ionicons name="qr-code-outline" size={56} color={Colors.light.textMuted} />
          <Text style={styles.emptyTitle}>No REZ Now page yet</Text>
          <Text style={styles.emptySubtitle}>
            Set up your REZ Now online ordering page first, then come back to generate table QR
            codes.
          </Text>
          <TouchableOpacity
            style={styles.settingsLink}
            onPress={() => router.push('/stores')}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsLinkText}>Go to Store Settings</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#7C3AED', '#6366F1']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Codes</Text>
        <View style={{ width: 38 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Store QR section ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store QR — Scan &amp; Pay</Text>
          <Text style={styles.sectionSub}>
            Display at your counter. Customers scan to order and pay directly.
          </Text>
          <View style={styles.storeQrCenter}>
            <QRCodeCard url={storeUrl!} label="Store QR – Scan & Pay" size={200} />
          </View>
          <Text style={styles.urlHint} numberOfLines={1}>
            {storeUrl}
          </Text>
        </View>

        {/* ── Divider ────────────────────────────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── Table QR section ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Table QR Codes</Text>
          <Text style={styles.sectionSub}>
            Print one QR per table. Customers scan to see your menu and order.
          </Text>

          {/* Stepper */}
          <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>Number of tables</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={[styles.stepperBtn, tableCount <= MIN_TABLES && styles.stepperBtnDisabled]}
                onPress={handleDecrement}
                disabled={tableCount <= MIN_TABLES}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="remove"
                  size={18}
                  color={tableCount <= MIN_TABLES ? Colors.light.textMuted : Colors.light.primary}
                />
              </TouchableOpacity>
              <TextInput
                style={styles.stepperInput}
                value={tableInputText}
                onChangeText={handleTableInputChange}
                onBlur={handleTableInputBlur}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
                accessibilityLabel="Number of tables"
              />
              <TouchableOpacity
                style={[styles.stepperBtn, tableCount >= MAX_TABLES && styles.stepperBtnDisabled]}
                onPress={handleIncrement}
                disabled={tableCount >= MAX_TABLES}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={tableCount >= MAX_TABLES ? Colors.light.textMuted : Colors.light.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Grid — using FlatList with 2 columns */}
          <FlatList
            data={tableNumbers}
            keyExtractor={(n) => String(n)}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            scrollEnabled={false}
            renderItem={({ item: tableNum }) => (
              <View style={styles.gridCell}>
                <QRCodeCard
                  url={`${storeUrl}?table=${tableNum}`}
                  label={`Table ${tableNum}`}
                  size={140}
                />
              </View>
            )}
            style={styles.grid}
          />

          {/* Share All */}
          <TouchableOpacity style={styles.shareAllBtn} onPress={handleShareAll} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
            <Text style={styles.shareAllText}>Share All QR Links</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  // ── Section ───────────────────────────────────────────────────────────────
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: Colors.light.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 24,
  },
  // ── Store QR ──────────────────────────────────────────────────────────────
  storeQrCenter: {
    alignItems: 'center',
    marginBottom: 10,
  },
  urlHint: {
    fontSize: 11,
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  // ── Stepper ───────────────────────────────────────────────────────────────
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textDark,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.light.primaryLight2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: Colors.light.backgroundTertiary,
  },
  stepperInput: {
    width: 44,
    height: 32,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textHeading,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingVertical: 0,
    backgroundColor: '#fff',
  },
  // ── Grid ──────────────────────────────────────────────────────────────────
  grid: {
    marginBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCell: {
    flex: 1,
    maxWidth: '48%',
  },
  // ── Share All ─────────────────────────────────────────────────────────────
  shareAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  // ── Empty / no-slug state ──────────────────────────────────────────────────
  emptyRoot: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  emptyBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight2,
  },
  settingsLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});
